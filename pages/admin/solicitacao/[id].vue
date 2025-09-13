<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Editar Solicitação</h1>
      <NuxtLink to="/admin" class="btn btn-outline">
        <Icon name="i-lucide-arrow-left" />
        <span>Voltar para a Lista</span>
      </NuxtLink>
    </div>

    <div v-if="isLoading" class="status-container">
      <Icon name="i-lucide-loader-2" class="spinner" />
    </div>
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="agendamentoPai" class="edit-layout">
      <div class="card">
        <div class="card-header">
          <h3>Informações Gerais</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label>Recurso</label>
            <p class="info-text">{{ agendamentoPai.recurso }}</p>
          </div>
          <div class="form-group">
            <label>Solicitante</label>
            <p class="info-text">{{ agendamentoPai.solicitante }}</p>
          </div>
           <div class="form-group">
            <label for="finalidade">Finalidade</label>
            <input type="text" id="finalidade" v-model="agendamentoPai.finalidade" class="form-input" />
          </div>
          <div class="form-group">
            <label for="observacoes">Observações</label>
            <textarea id="observacoes" v-model="agendamentoPai.observacoes" class="form-textarea" rows="4"></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <h3>Datas e Horários</h3>
        </div>
        <div class="card-body-scrollable">
            <div v-for="(filho, index) in agendamentoPai.agendamentos_filhos" :key="filho.id_agendamento || `new-${index}`" class="date-item">
              <input type="date" v-model="filho.data_inicio" class="date-input"/>
              <input type="time" v-model="filho.hora_inicio" class="time-input"/>
              <span>-</span>
              <input type="time" v-model="filho.hora_fim" class="time-input"/>
              <button @click="removerHorario(index)" class="btn-icon-danger" title="Remover horário">
                  <Icon name="i-lucide-x" />
              </button>
            </div>
            <button @click="adicionarHorario" class="btn btn-outline btn-sm mt-4">
                <Icon name="i-lucide-plus" /> Adicionar Horário
            </button>
        </div>
        <div class="card-footer">
            <button @click="salvarAlteracoes" class="btn btn-primary" :disabled="isSaving">
                <Icon v-if="isSaving" name="i-lucide-loader-2" class="spinner"/>
                Salvar Alterações
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authenticatedFetch } from '~/utils/api';

definePageMeta({ layout: 'admin', middleware: 'admin-auth' });

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const agendamentoPai = ref(null);
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref(null);
const id = route.params.id;

onMounted(async () => {
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/pai/${id}/`);
    if (!response.ok) throw new Error('Não foi possível carregar os dados da solicitação.');
    const data = await response.json();
    data.agendamentos_filhos.forEach(f => f.data_fim = f.data_inicio);
    agendamentoPai.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
});

const adicionarHorario = () => {
    const ultimoAgendamento = agendamentoPai.value.agendamentos_filhos.slice(-1)[0];
    const novaData = ultimoAgendamento ? ultimoAgendamento.data_inicio : new Date().toISOString().split('T')[0];

    agendamentoPai.value.agendamentos_filhos.push({
        id_agendamento: null,
        data_inicio: novaData,
        data_fim: novaData,
        hora_inicio: '08:00',
        hora_fim: '09:00',
    });
};

const removerHorario = (index) => {
    agendamentoPai.value.agendamentos_filhos.splice(index, 1);
};

const salvarAlteracoes = async () => {
    isSaving.value = true;
    error.value = null;

    const payload = {
        finalidade: agendamentoPai.value.finalidade,
        observacoes: agendamentoPai.value.observacoes,
        id_responsavel: agendamentoPai.value.id_responsavel,
        agendamentos_filhos: agendamentoPai.value.agendamentos_filhos.map(f => ({
            id_agendamento: f.id_agendamento,
            data_inicio: f.data_inicio,
            hora_inicio: f.hora_inicio,
            data_fim: f.data_inicio,
            hora_fim: f.hora_fim,
        })),
    };

    try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/pai/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        if (!response.ok) {
            const errorMessages = Object.entries(responseData).map(([key, value]) => `${key}: ${value}`).join('\n');
            throw new Error(errorMessages || 'Falha ao salvar as alterações.');
        }
        
        alert('Solicitação atualizada com sucesso!');
        router.push('/admin');

    } catch (err) {
        error.value = err.message;
        alert(`Erro: ${err.message}`);
    } finally {
        isSaving.value = false;
    }
};
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; }
.page-title { font-size: 1.75rem; font-weight: 700; }
.status-container { text-align: center; padding: 2rem; color: #6b7280; }
.spinner { font-size: 2rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.edit-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; margin-top: 1.5rem; }
.card { background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
.card-header { padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
.card-header h3 { font-size: 1.125rem; font-weight: 600; margin: 0; }
.card-body { padding: 1.5rem; }
.card-body-scrollable { padding: 1.5rem; overflow-y: auto; max-height: 400px; }
.card-footer { padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; }
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #4b5563; }
.info-text { font-size: 1rem; color: #1f2937; }
.form-input, .form-textarea { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; }
.date-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.date-input, .time-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 0.5rem; }
.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid transparent; cursor: pointer; font-weight: 500; }
.btn-primary { background-color: #4f46e5; color: white; }
.btn-outline { color: #4b5563; border-color: #d1d5db; }
.btn-sm { font-size: 0.875rem; padding: 0.375rem 0.75rem; }
.btn-icon-danger { background: none; border: none; cursor: pointer; color: #ef4444; }
.btn:disabled { opacity: 0.7; cursor: not-allowed; }
.error-message { color: #b91c1c; background-color: #fee2e2; padding: 1rem; border-radius: 8px; margin-top: 1rem; }
</style>