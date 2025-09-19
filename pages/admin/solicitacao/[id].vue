<template>
  <div class="page-container">
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
          <div class="info-group">
            <label>Recurso</label>
            <p class="info-text">{{ agendamentoPai.recurso }}</p>
          </div>
          <div class="info-group">
            <label>Solicitante</label>
            <p class="info-text">{{ agendamentoPai.solicitante }}</p>
          </div>
           <div class="form-group">
            <label for="finalidade">Finalidade</label>
            <input type="text" id="finalidade" v-model="agendamentoPai.finalidade" class="form-input" />
          </div>
          <div class="form-group">
            <label for="observacoes">Observações</label>
            <textarea id="observacoes" v-model="agendamentoPai.observacoes" class="form-textarea" rows="1"></textarea>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3>Datas e Horários</h3>
        </div>
        <div class="card-body-scrollable">
            <div class="date-list">
              <div v-for="(filho, index) in agendamentoPai.agendamentos_filhos" :key="filho.id_agendamento || `new-${index}`" class="date-item">
                <input type="date" v-model="filho.data_inicio" class="date-input"/>
                <div class="time-inputs-container">
                  <span class="time-prefix">Das</span>
                  <input type="time" v-model="filho.hora_inicio" class="time-input"/>
                  <span class="time-separator">às</span>
                  <input type="time" v-model="filho.hora_fim" class="time-input"/>
                </div>
                <button @click="removerHorario(index)" class="btn-icon-danger" title="Remover horário">
                    <Icon name="i-lucide-trash-2" />
                </button>
              </div>
            </div>
            <button @click="adicionarHorario" class="btn btn-outline btn-sm mt-4">
                <Icon name="i-lucide-plus" /> Adicionar Horário
            </button>
        </div>
        <div class="card-footer">
            <button @click="salvarAlteracoes" class="btn btn-primary" :disabled="isSaving">
                <Icon v-if="isSaving" name="i-lucide-loader-2" class="spinner"/>
                <span>{{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}</span>
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
.page-container { padding: 1rem; display: flex; flex-direction: column; height: calc(100vh - 64px - 2rem); }
.page-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1.5rem; flex-shrink: 0; }
.page-title { font-size: 1.75rem; font-weight: 700; color: #1f2937; }
.status-container { text-align: center; padding: 3rem; color: #6b7280; }
.spinner { font-size: 2.5rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.edit-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; flex-grow: 1; overflow: hidden; }
.card { background-color: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; display: flex; flex-direction: column; overflow: hidden; }
.card-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
.card-header h3 { font-size: 1.25rem; font-weight: 600; margin: 0; color: #111827; }
.card-body { padding: 1.5rem; flex-grow: 1; overflow-y: auto; }
.card-body-scrollable { padding: 1.5rem; overflow-y: auto; flex-grow: 1; }
.card-footer { padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; background-color: #f9fafb; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; flex-shrink: 0; }
.form-group, .info-group { margin-bottom: 1.5rem; }
.form-group:last-child, .info-group:last-child { margin-bottom: 0; }
.form-group label, .info-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #4b5563; font-size: 0.875rem; }
.info-text { font-size: 1rem; color: #374151; background-color: #f3f4f6; padding: 0.65rem 0.75rem; border-radius: 8px; border: 1px solid #e5e7eb; word-break: break-word; }
.form-input, .form-textarea { width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; background-color: white; transition: all 0.2s; font-size: 1rem; box-sizing: border-box; }
.form-textarea { resize: none; }
.form-input:focus, .form-textarea:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2); }
.date-list { display: flex; flex-direction: column; gap: 1rem; }
.date-item { display: flex; align-items: center; gap: 0.75rem; padding-bottom: 1rem; border-bottom: 1px solid #f3f4f6; }
.date-item:last-of-type { border-bottom: none; padding-bottom: 0; }
.date-input, .time-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 0.5rem; background-color: white; font-size: 0.9rem; }
.time-inputs-container { display: flex; align-items: center; gap: 0.5rem; flex-grow: 1; }
.time-separator, .time-prefix { color: #6b7280; font-size: 0.875rem; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem 1.25rem; border-radius: 8px; border: 1px solid transparent; cursor: pointer; font-weight: 600; transition: all 0.2s; text-decoration: none; }
.btn-primary { background-color: #4f46e5; color: white; }
.btn-primary:hover { background-color: #4338ca; }
.btn-outline { background-color: white; color: #4b5563; border: 1px solid #d1d5db; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-outline:hover { background-color: #f9fafb; }
.btn-sm { font-size: 0.875rem; padding: 0.5rem 1rem; }
.btn-icon-danger { background: none; border: none; cursor: pointer; color: #9ca3af; padding: 0.5rem; border-radius: 50%; transition: all 0.2s; }
.btn-icon-danger:hover { background-color: #fee2e2; color: #ef4444; }
.btn:disabled { opacity: 0.7; cursor: not-allowed; }
.error-message { color: #b91c1c; background-color: #fee2e2; padding: 1rem; border-radius: 8px; margin-top: 1rem; }
.mt-4 { margin-top: 1rem; }

@media (max-width: 1024px) {
  .edit-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
    height: auto;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 0;
    margin-bottom: 1rem;
    border-bottom: none;
  }
  .page-title {
    font-size: 1.5rem;
  }
  .edit-layout {
    margin-top: 0;
    gap: 1rem;
  }
  .card-body, .card-header, .card-footer {
    padding: 1.25rem;
  }
  .date-item {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .date-input {
    flex-basis: 100%;
    margin-bottom: 0.5rem;
  }
  .time-inputs-container {
    flex-basis: calc(100% - 40px);
  }
  .time-input {
    flex-grow: 1;
  }
}
</style>