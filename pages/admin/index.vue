<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Dashboard do Administrador</h1>
    <div class="card">
      <div class="card-header">
        <h2 class="title">Solicitações de Agendamento</h2>
      </div>
      <div class="card-content">
        <div v-if="isLoading" class="status-container">
          <Icon name="i-lucide-loader-2" class="spinner" />
          <p>Carregando solicitações...</p>
        </div>
        <div v-else-if="error" class="text-red-500 status-container">
            <Icon name="i-lucide-x-circle" class="icon-error" />
            <p>{{ error }}</p>
        </div>
        <div v-else-if="agendamentos.length === 0" class="status-container">
            <p>Nenhuma solicitação de agendamento encontrada.</p>
        </div>
        <table v-else class="custom-table">
          <thead>
            <tr>
              <th>Solicitante</th>
              <th>Recurso</th>
              <th>Finalidade</th>
              <th>Data</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="agendamento in agendamentos" :key="agendamento.id_agendamento">
              <td>{{ agendamento.solicitante }}</td>
              <td>{{ agendamento.recurso }}</td>
              <td>{{ agendamento.finalidade }}</td>
              <td>{{ formatarData(agendamento.data_inicio) }} {{ agendamento.hora_inicio.substring(0, 5) }}</td>
              <td>
                <span :class="getStatusClass(agendamento.status_agendamento)" class="status-badge">
                  {{ agendamento.status_agendamento }}
                </span>
              </td>
              <td class="actions-cell">
                <template v-if="agendamento.status_agendamento === 'pendente'">
                  <button @click="atualizarStatus(agendamento, 'aprovado')" class="btn-approve">Aprovar</button>
                  <button @click="atualizarStatus(agendamento, 'negado')" class="btn-deny">Negar</button>
                </template>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authenticatedFetch } from '~/utils/api';

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
});

const config = useRuntimeConfig();
const agendamentos = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchAgendamentos = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/`);
    if (!response.ok) throw new Error('Falha ao buscar agendamentos.');
    agendamentos.value = await response.json();
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const atualizarStatus = async (agendamento, novoStatus) => {
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/${agendamento.id_agendamento}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status_agendamento: novoStatus }),
    });
    if (!response.ok) throw new Error('Falha ao atualizar status.');
    
    // Atualiza a lista localmente para refletir a mudança
    const index = agendamentos.value.findIndex(a => a.id_agendamento === agendamento.id_agendamento);
    if (index !== -1) {
      agendamentos.value[index].status_agendamento = novoStatus;
    }

  } catch (err) {
    alert(`Erro: ${err.message}`);
  }
};

const formatarData = (dataString) => new Date(`${dataString}T00:00:00`).toLocaleDateString('pt-BR');
const getStatusClass = (status) => {
  if (!status) return 'status-default';
  const s = status.toLowerCase();
  if (s.includes('aprovado')) return 'status-success';
  if (s.includes('pendente')) return 'status-warning';
  if (s.includes('negado')) return 'status-error';
  return 'status-default';
};

onMounted(fetchAgendamentos);
</script>

<style scoped>
.card { background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
.card-header { padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
.title { font-size: 1.25rem; font-weight: 600; }
.card-content { padding: 1.5rem; }
.custom-table { width: 100%; border-collapse: collapse; }
.custom-table th, .custom-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; text-transform: capitalize; }
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
.status-container { text-align: center; padding: 2rem; color: #6b7280; }
.spinner { font-size: 2rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.actions-cell { display: flex; gap: 0.5rem; }
.btn-approve, .btn-deny { border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; color: white; font-size: 0.875rem; }
.btn-approve { background-color: #22c55e; }
.btn-deny { background-color: #ef4444; }
</style>