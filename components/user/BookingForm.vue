<template>
  <div class="card">
    <div class="card-header">
      <h3 class="text-lg font-semibold text-gray-800">Detalhes do Recurso</h3>
    </div>
    <form @submit.prevent="salvar">
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group col-span-2">
            <label for="nome_recurso" class="form-label">Nome do Recurso</label>
            <input id="nome_recurso" type="text" v-model="form.nome_recurso" class="form-input" required placeholder="Ex: Laboratório de Informática 1" />
          </div>
          <div class="form-group col-span-2">
            <label for="descricao" class="form-label">Descrição</label>
            <textarea id="descricao" v-model="form.descricao" class="form-textarea" placeholder="Ex: Equipado com 25 computadores Dell e projetor."></textarea>
          </div>
          <div class="form-group">
            <label for="localizacao" class="form-label">Localização</label>
            <input id="localizacao" type="text" v-model="form.localizacao" class="form-input" placeholder="Ex: Bloco A - Sala 101" />
          </div>
          <div class="form-group">
            <label for="capacidade" class="form-label">Capacidade</label>
            <input id="capacidade" type="number" v-model.number="form.capacidade" class="form-input" placeholder="Ex: 25" />
          </div>
          <div class="form-group col-span-2">
            <label for="status_recurso" class="form-label">Status</label>
            <select id="status_recurso" v-model="form.status_recurso" class="form-select" required>
              <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ opt.replace('_', ' ') }}</option>
            </select>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <button type="button" class="btn btn-outline" @click="emit('cancelado')">Cancelar</button>
        <button type="submit" class="btn btn-primary" :disabled="isSaving">
          {{ isSaving ? 'Salvando...' : 'Salvar Recurso' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { authenticatedFetch } from '~/utils/api';

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
    await authenticatedFetch(url, { method, body: JSON.stringify(form.value) });
    emit('salvo');
  } catch (error) {
    alert(`Erro: ${error.message}`);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.card { background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.card-header, .card-body, .card-footer { padding: 1.5rem; }
.card-header { border-bottom: 1px solid #e5e7eb; }
.card-footer { border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 0.75rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.5rem; }
.form-group.col-span-2 { grid-column: span 2 / span 2; }
.form-label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #374151; }
.form-input, .form-textarea, .form-select { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; transition: border-color 0.2s, box-shadow 0.2s; }
.form-input:focus, .form-textarea:focus, .form-select:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3); }
.form-textarea { min-height: 100px; }
.form-select { text-transform: capitalize; }
.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid transparent; cursor: pointer; font-weight: 500; transition: all 0.2s; }
.btn-primary { background-color: #4f46e5; color: white; border-color: #4f46e5; }
.btn-primary:hover { background-color: #4338ca; }
.btn-outline { background-color: transparent; color: #4b5563; border-color: #d1d5db; }
.btn-outline:hover { background-color: #f9fafb; }
.btn:disabled { opacity: 0.7; cursor: not-allowed; }
</style>