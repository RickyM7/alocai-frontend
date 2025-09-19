<template>
  <div class="form-wrapper">
    <form @submit.prevent="salvar" class="resource-form">
      <div class="form-grid">
        <div class="form-group">
          <label for="nome_recurso" class="form-label">Nome do Recurso</label>
          <input 
            id="nome_recurso" 
            type="text" 
            v-model="form.nome_recurso" 
            class="form-input" 
            required 
            placeholder="Ex: Laboratório de Informática 1" 
          />
        </div>

        <div class="form-group">
          <label for="localizacao" class="form-label">Localização</label>
          <input 
            id="localizacao" 
            type="text" 
            v-model="form.localizacao" 
            class="form-input" 
            placeholder="Ex: Bloco A - Sala 101" 
          />
        </div>

        <div class="form-group">
          <label for="capacidade" class="form-label">Capacidade</label>
          <input 
            id="capacidade" 
            type="number" 
            v-model.number="form.capacidade" 
            class="form-input" 
            placeholder="Ex: 25" 
          />
        </div>
        
        <div class="form-group">
          <label for="descricao" class="form-label">Descrição</label>
          <textarea 
            id="descricao" 
            v-model="form.descricao" 
            class="form-textarea" 
            placeholder="Ex: Equipado com 25 PCs Dell, projetor e ar-condicionado."
          ></textarea>
        </div>
      </div>

      <div class="status-section">
        <label class="form-label">Status do Recurso</label>
        <div class="status-options">
          <button
            v-for="opt in statusOptions"
            :key="opt"
            type="button"
            :class="['status-btn', getStatusClass(opt), { 'selected': form.status_recurso === opt }]"
            @click="form.status_recurso = opt"
          >
             {{ formatarStatus(opt) }}
          </button>
        </div>
      </div>

      <div class="form-footer">
        <button type="button" class="btn btn-outline" @click="emit('cancelado')">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSaving">
          <Icon v-if="isSaving" name="i-lucide-loader-2" class="animate-spin" />
          <span>{{ isSaving ? 'Salvando...' : 'Salvar Recurso' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { authenticatedFetch } from '~/utils/api';
import { getStatusClass, formatarStatus } from '~/utils/formatters';

const props = defineProps({
  recursoInicial: { type: Object, default: null }
});
const emit = defineEmits(['salvo', 'cancelado']);

const config = useRuntimeConfig();
const form = ref({});
const isSaving = ref(false);
const statusOptions = ['disponivel', 'em_manutencao', 'indisponivel', 'reservado'];

const initializeForm = () => {
  form.value = props.recursoInicial ? { ...props.recursoInicial } : {
    nome_recurso: '',
    descricao: '',
    localizacao: '',
    capacidade: null,
    status_recurso: 'disponivel'
  };
};

onMounted(initializeForm);
watch(() => props.recursoInicial, initializeForm, { deep: true });

const salvar = async () => {
  isSaving.value = true;
  const isEditing = !!form.value.id_recurso;
  const url = isEditing 
    ? `${config.public.apiUrl}/api/admin/recursos/${form.value.id_recurso}/`
    : `${config.public.apiUrl}/api/admin/recursos/`;
  
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const response = await authenticatedFetch(url, { method, body: JSON.stringify(form.value) });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Falha ao salvar o recurso.');
    }
    emit('salvo');
  } catch (error) {
    alert(`Erro: ${error.message}`);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.form-wrapper{background-color:white;border-radius:12px;padding:1rem;box-shadow:0 4px 12px rgba(0,0,0,0.08);border:1px solid #e5e7eb;max-width:100%;overflow:hidden}
.resource-form{display:flex;flex-direction:column;gap:1rem}
.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem}
.form-group{display:flex;flex-direction:column;height:80px}
.form-label{margin-bottom:0.75rem;font-size:0.875rem;font-weight:500;color:#374151;flex-shrink:0}
.form-input,.form-textarea{width:100%;padding:0.75rem;border:1px solid #d1d5db;border-radius:6px;background-color:#f9fafb;transition:border-color 0.2s,box-shadow 0.2s;font-size:1rem;box-sizing:border-box;resize:none;flex:1}
.form-input:focus,.form-textarea:focus{outline:none;border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,0.15);background-color:white}
.status-section{margin:0.5rem 0}
.status-options{display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:0.75rem}
.form-footer{padding-top:1.5rem;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:0.75rem;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;padding:0.6rem 1.25rem;border-radius:8px;border:1px solid transparent;cursor:pointer;font-weight:600;transition:all 0.2s}
.btn-primary{background-color:#4f46e5;color:white;border-color:#4f46e5}
.btn-primary:hover{background-color:#4338ca}
.btn-outline{background-color:transparent;color:#4b5563;border-color:#d1d5db}
.btn-outline:hover{background-color:#f9fafb}
.btn:disabled{opacity:0.7;cursor:not-allowed}
@media (max-width:768px){.form-wrapper{padding:1.25rem}.form-grid{grid-template-columns:1fr;gap:1rem}.status-options{justify-content:center}.status-btn{padding:0.4rem 0.8rem;font-size:0.8125rem}.form-footer{justify-content:stretch}.btn{flex:1;min-width:120px}}
@media (max-width:480px){.form-wrapper{padding:1rem}.form-grid{gap:0.5rem}.status-options{gap:0.5rem}.status-btn{padding:0.375rem 0.75rem;font-size:0.75rem}.form-footer{flex-direction:column}.btn{width:100%}}
</style>