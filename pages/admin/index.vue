<template>
  <div class="page-content-layout">
    <h1 class="page-title">Solicitações de Agendamento</h1>
    
    <div class="scrollable-list">
      <div v-if="isLoading" class="status-container">
        <Icon name="i-lucide-loader-2" class="spinner" />
        <p>Carregando solicitações...</p>
      </div>
      <div v-else-if="error" class="text-red-500 status-container">
          <Icon name="i-lucide-x-circle" class="icon-error" />
          <p>{{ error }}</p>
      </div>
      <div v-else-if="solicitacoes.length === 0" class="status-container">
          <p>Nenhuma solicitação de agendamento encontrada.</p>
      </div>

      <div v-else class="solicitacoes-container">
        <div v-for="solicitacao in solicitacoes" :key="solicitacao.id_agendamento_pai" class="card">
          <div class="card-header" @click="toggleSolicitacao(solicitacao.id_agendamento_pai)">
            <div class="header-info">
              <Icon :name="isExpanded(solicitacao.id_agendamento_pai) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="expand-icon" />
              <div>
                <h2 class="recurso-nome">{{ solicitacao.recurso }}</h2>
                <p class="solicitante-info">Solicitado por <strong>{{ solicitacao.solicitante }}</strong> em {{ formatarData(solicitacao.data_criacao) }}</p>
              </div>
            </div>
            <div class="header-actions">
              <span :class="getStatusClass(solicitacao.status_geral)" class="status-badge">{{ solicitacao.status_geral }}</span>
              <template v-if="solicitacao.status_geral === 'Pendente' || solicitacao.status_geral === 'Parcialmente Aprovado'">
                <button class="btn btn-outline btn-sm" @click.stop="editarSolicitacao(solicitacao)">
                  <Icon name="i-lucide-pencil" />
                  <span>Editar</span>
                </button>
                <button class="btn btn-success btn-sm" @click.stop="atualizarStatusPai(solicitacao, 'aprovado')">Aprovar Todas</button>
                <button class="btn btn-danger btn-sm" @click.stop="atualizarStatusPai(solicitacao, 'negado')">Negar Todas</button>
              </template>
            </div>
          </div>

          <div v-if="isExpanded(solicitacao.id_agendamento_pai)">
            <div class="card-content">
              <div class="details-grid">
                <div><strong>Finalidade:</strong> {{ solicitacao.finalidade }}</div>
                <div v-if="solicitacao.observacoes"><strong>Observações:</strong> {{ solicitacao.observacoes }}</div>
              </div>
            </div>
            <div class="child-table-wrapper">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Status</th>
                    <th>Ações Individuais</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="agendamento in solicitacao.agendamentos_filhos" :key="agendamento.id_agendamento">
                    <td>{{ formatarData(agendamento.data_inicio) }}</td>
                    <td>{{ agendamento.hora_inicio.substring(0, 5) }} - {{ agendamento.hora_fim.substring(0, 5) }}</td>
                    <td>
                      <span :class="getStatusClass(agendamento.status_agendamento)" class="status-badge">
                        {{ agendamento.status_agendamento }}
                      </span>
                    </td>
                    <td class="actions-cell">
                      <template v-if="agendamento.status_agendamento === 'pendente'">
                        <button @click="atualizarStatusFilho(solicitacao, agendamento, 'aprovado')" class="btn-approve" title="Aprovar"></button>
                        <button @click="atualizarStatusFilho(solicitacao, agendamento, 'negado')" class="btn-deny" title="Negar"></button>
                      </template>
                      <span v-else>-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authenticatedFetch } from '~/utils/api';

definePageMeta({ layout: 'admin', middleware: 'admin-auth' });

const config = useRuntimeConfig();
const solicitacoes = ref([]);
const isLoading = ref(true);
const error = ref(null);
const expandedSolicitacoes = ref([]);

const calcularStatusGeral = (reservas) => {
    const statuses = new Set(reservas.map(r => r.status_agendamento));
    if (statuses.has('pendente')) return 'Pendente';
    if (statuses.size === 1 && statuses.has('concluido')) return 'Concluído';
    if (statuses.has('aprovado') && !statuses.has('negado') && !statuses.has('pendente')) return 'Aprovado';
    if (statuses.has('negado') && !statuses.has('aprovado') && !statuses.has('pendente')) return 'Negado';
    if (statuses.has('aprovado')) return 'Parcialmente Aprovado';
    return Array.from(statuses)[0] || 'Indefinido';
};

const fetchSolicitacoes = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/`);
    if (!response.ok) throw new Error('Falha ao buscar solicitações.');
    const data = await response.json();
    data.forEach(solicitacao => {
        solicitacao.status_geral = calcularStatusGeral(solicitacao.agendamentos_filhos);
    });
    solicitacoes.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const toggleSolicitacao = (id) => {
  const index = expandedSolicitacoes.value.indexOf(id);
  if (index === -1) {
    expandedSolicitacoes.value.push(id);
  } else {
    expandedSolicitacoes.value.splice(index, 1);
  }
};

const isExpanded = (id) => expandedSolicitacoes.value.includes(id);

const atualizarStatusPai = async (solicitacaoPai, novoStatus) => {
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/pai/${solicitacaoPai.id_agendamento_pai}/status/`, {
      method: 'PUT',
      body: JSON.stringify({ status_agendamento: novoStatus }),
    });
    if (!response.ok) throw new Error('Falha ao atualizar status.');
    
    await fetchSolicitacoes(); // Recarrega os dados para atualizar a interface
  } catch (err) {
    alert(`Erro: ${err.message}`);
  }
};

const atualizarStatusFilho = async (solicitacaoPai, agendamentoFilho, novoStatus) => {
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/${agendamentoFilho.id_agendamento}/status/`, {
      method: 'PUT',
      body: JSON.stringify({ status_agendamento: novoStatus }),
    });
    if (!response.ok) throw new Error('Falha ao atualizar status.');
    
    await fetchSolicitacoes(); // Recarrega os dados para atualizar a interface
  } catch (err) {
    alert(`Erro: ${err.message}`);
  }
};

const editarSolicitacao = (solicitacao) => {
  alert(`Funcionalidade "Editar Solicitação ${solicitacao.id_agendamento_pai}" ainda não implementada.`);
};

const formatarData = (dataString) => new Date(dataString).toLocaleDateString('pt-BR');
const getStatusClass = (status) => {
  if (!status) return 'status-default';
  const s = status.toLowerCase();
  if (s.includes('aprovado')) return 'status-success';
  if (s.includes('pendente')) return 'status-warning';
  if (s.includes('negado')) return 'status-error';
  return 'status-default';
};

onMounted(fetchSolicitacoes);
</script>

<style scoped>
.page-content-layout { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.page-title { font-size: 1.75rem; font-weight: 700; padding-bottom: 1rem; flex-shrink: 0; background-color: transparent;  position: sticky; top: -2rem; padding-top: 2rem; z-index: 10; }
.scrollable-list { flex-grow: 1; overflow-y: auto; padding-right: 1rem; }
.solicitacoes-container { display: flex; flex-direction: column; gap: 1rem; }
.card { background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
.card-header { padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid #e5e7eb; }
.card-header:hover { background-color: #f9fafb; }
.header-info { display: flex; align-items: center; gap: 1rem; }
.expand-icon { font-size: 1.25rem; color: #9ca3af; }
.recurso-nome { font-size: 1.25rem; font-weight: 600; }
.solicitante-info { font-size: 0.875rem; color: #6b7280; }
.header-actions { display: flex; align-items: center; gap: 0.75rem; }
.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid transparent; cursor: pointer; font-weight: 500; transition: all 0.2s; }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
.btn-outline { background-color: transparent; color: #4b5563; border-color: #d1d5db; }
.btn-outline:hover { background-color: #f9fafb; }
.btn-success { background-color: #22c55e; color: white; border-color: #22c55e; }
.btn-danger { background-color: #ef4444; color: white; border-color: #ef4444; }
.card-content { padding: 1.5rem; border-bottom: 1px solid #e5e7eb; }
.details-grid { display: grid; gap: 0.5rem; font-size: 0.9rem; color: #374151; }
.custom-table { width: 100%; border-collapse: collapse; }
.custom-table th, .custom-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
.custom-table tbody tr:last-child td { border-bottom: none; }
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; text-transform: capitalize; }
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
.status-info { background-color: #e0e7ff; color: #3730a3; }
.status-default { background-color: #e5e7eb; color: #374151; }
.status-container { text-align: center; padding: 2rem; color: #6b7280; }
.spinner { font-size: 2rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.actions-cell { display: flex; gap: 0.5rem; }
.child-table-wrapper { max-height: 200px; overflow-y: auto; }
.child-table-wrapper .custom-table th { position: sticky; top: 0; background-color: #f9fafb; z-index: 1; }
.btn-approve, .btn-deny { width: 24px; height: 24px; border: none; border-radius: 50%; cursor: pointer; position: relative; display: flex; align-items: center; justify-content: center; }
.btn-approve::after, .btn-deny::after { content: ''; color: white; font-weight: bold; }
.btn-approve { background-color: #22c55e; }
.btn-approve::after { content: '✓'; }
.btn-deny { background-color: #ef4444; }
.btn-deny::after { content: '✕'; font-size: 0.9rem; }
</style>