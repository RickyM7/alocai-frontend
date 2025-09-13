<template>
  <div class="page-content-layout">
    <div class="page-header">
      <h1 class="page-title">Solicitações de Agendamento</h1>
      <div class="tabs">
        <button :class="{ active: activeTab === 'em_andamento' }" @click="activeTab = 'em_andamento'">
          Em Andamento
        </button>
        <button :class="{ active: activeTab === 'historico' }" @click="activeTab = 'historico'">
          Histórico
        </button>
      </div>
    </div>
    
    <div class="scrollable-list">
      <div v-if="isLoading" class="status-container">
        <Icon name="i-lucide-loader-2" class="spinner" />
        <p>Carregando solicitações...</p>
      </div>
      <div v-else-if="error" class="text-red-500 status-container">
          <Icon name="i-lucide-x-circle" class="icon-error" />
          <p>{{ error }}</p>
      </div>
      <div v-else-if="filteredSolicitacoes.length === 0" class="status-container">
          <p>Nenhuma solicitação encontrada nesta categoria.</p>
      </div>

      <div v-else class="solicitacoes-container">
        <div v-for="solicitacao in filteredSolicitacoes" :key="solicitacao.id_agendamento_pai" class="card">
          <div class="card-header" @click="toggleSolicitacao(solicitacao.id_agendamento_pai)">
            <div class="header-info">
              <Icon :name="isExpanded(solicitacao.id_agendamento_pai) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="expand-icon" />
              <div class="info-content">
                <h2 class="recurso-nome">{{ solicitacao.recurso }}</h2>
                <div class="meta-info">
                  <div class="meta-item">
                    <Icon name="i-lucide-user" class="meta-icon" />
                    <div class="meta-text">
                      <span class="meta-label">Solicitado por</span>
                      <strong>{{ solicitacao.solicitante }}</strong>
                      <span class="meta-date">{{ formatarData(solicitacao.data_criacao) }}</span>
                    </div>
                  </div>
                  <div v-if="solicitacao.gerenciado_info" class="meta-item">
                    <Icon name="i-lucide-user-check" class="meta-icon" />
                    <div class="meta-text">
                      <span class="meta-label">Gerenciado por</span>
                      <strong>{{ solicitacao.gerenciado_info.nome }}</strong>
                      <span class="meta-date">{{ formatarDataHora(solicitacao.gerenciado_info.data) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <span :class="getStatusClass(solicitacao.status_geral)" class="status-badge">{{ solicitacao.status_geral }}</span>
              <div class="action-buttons">
                <template v-if="solicitacao.status_geral === 'Pendente' || solicitacao.status_geral === 'Parcialmente Aprovado'">
                  <button class="btn btn-outline btn-sm" @click.stop="editarSolicitacao(solicitacao)" title="Editar">
                    <Icon name="i-lucide-pencil" />
                    <span class="btn-text">Editar</span>
                  </button>
                  <button class="btn btn-success btn-sm" @click.stop="atualizarStatusPai(solicitacao, 'aprovado')" title="Aprovar Todas">
                    <Icon name="i-lucide-check-circle" class="btn-icon-mobile" />
                    <span class="btn-text">Aprovar Todas</span>
                  </button>
                  <button class="btn btn-danger btn-sm" @click.stop="atualizarStatusPai(solicitacao, 'negado')" title="Negar Todas">
                    <Icon name="i-lucide-x-circle" class="btn-icon-mobile" />
                    <span class="btn-text">Negar Todas</span>
                  </button>
                </template>
                <button @click.stop="confirmarDelecao(solicitacao)" class="btn-icon-danger" title="Excluir solicitação">
                  <Icon name="i-lucide-trash-2" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="isExpanded(solicitacao.id_agendamento_pai)" class="card-expanded">
            <div class="card-content">
              <div class="details-grid">
                <div class="detail-item">
                  <strong>Finalidade:</strong> 
                  <span>{{ solicitacao.finalidade }}</span>
                </div>
                <div v-if="solicitacao.observacoes" class="detail-item">
                  <strong>Observações:</strong> 
                  <span>{{ solicitacao.observacoes }}</span>
                </div>
              </div>
            </div>
            
            <div class="horarios-list">
              <div v-for="agendamento in solicitacao.agendamentos_filhos" :key="agendamento.id_agendamento" class="horario-item">
                <div class="horario-info">
                  <div class="horario-date-time">
                    <span class="horario-date">{{ formatarData(agendamento.data_inicio) }}</span>
                    <span class="horario-time">{{ agendamento.hora_inicio.substring(0, 5) }} - {{ agendamento.hora_fim.substring(0, 5) }}</span>
                  </div>
                  <span :class="getStatusClass(agendamento.status_agendamento)" class="status-badge status-small">
                    {{ agendamento.status_agendamento }}
                  </span>
                </div>
                <div class="horario-actions">
                  <template v-if="agendamento.status_agendamento === 'pendente'">
                    <button @click="atualizarStatusFilho(solicitacao, agendamento, 'aprovado')" class="btn-horario btn-approve">
                      Aprovar
                    </button>
                    <button @click="atualizarStatusFilho(solicitacao, agendamento, 'negado')" class="btn-horario btn-deny">
                      Negar
                    </button>
                  </template>
                  <span v-else class="no-action">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { authenticatedFetch } from '~/utils/api';
import { useRouter } from 'vue-router';

definePageMeta({ layout: 'admin', middleware: 'admin-auth' });

const config = useRuntimeConfig();
const solicitacoes = ref([]);
const isLoading = ref(true);
const error = ref(null);
const expandedSolicitacoes = ref([]);
const activeTab = ref('em_andamento');
const router = useRouter();

const calcularStatusGeral = (reservas) => {
    const statuses = new Set(reservas.map(r => r.status_agendamento));

    if (statuses.has('pendente')) {
        return statuses.has('aprovado') || statuses.has('negado') ? 'Parcialmente Aprovado' : 'Pendente';
    }
    if (statuses.has('aprovado')) {
        return (statuses.has('negado') || statuses.has('concluido')) ? 'Parcialmente Aprovado' : 'Aprovado';
    }
    if (statuses.size === 1 && statuses.has('concluido')) return 'Concluído';
    if (statuses.size === 1 && statuses.has('negado')) return 'Negado';
    
    // Se chegou aqui, só pode ter uma mistura de concluído e negado
    if (statuses.has('concluido') || statuses.has('negado')) return 'Finalizado';

    return 'Indefinido';
};

const filteredSolicitacoes = computed(() => {
  const inProgressStatuses = ['Pendente', 'Aprovado', 'Parcialmente Aprovado'];
  
  if (activeTab.value === 'em_andamento') {
    return solicitacoes.value.filter(s => inProgressStatuses.includes(s.status_geral));
  }
  
  return solicitacoes.value.filter(s => !inProgressStatuses.includes(s.status_geral));
});

const parseDateAsLocal = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const verificarConflitosHorario = (agendamentoAprovado) => {
  const conflitos = [];
  solicitacoes.value.forEach(solicitacao => {
    solicitacao.agendamentos_filhos.forEach(agendamento => {
      if (agendamento.status_agendamento === 'pendente' && 
          agendamento.id_agendamento !== agendamentoAprovado.id_agendamento &&
          agendamento.id_recurso === agendamentoAprovado.id_recurso &&
          agendamento.data_inicio === agendamentoAprovado.data_inicio) {
        const inicioA = agendamentoAprovado.hora_inicio;
        const fimA = agendamentoAprovado.hora_fim;
        const inicioB = agendamento.hora_inicio;
        const fimB = agendamento.hora_fim;
        if (inicioA < fimB && inicioB < fimA) {
          conflitos.push(agendamento.id_agendamento);
        }
      }
    });
  });
  return conflitos;
};

const rejeitarConflitos = async (idsConflitantes) => {
  const promises = idsConflitantes.map(id => 
    authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/${id}/status/`, {
      method: 'PUT',
      body: JSON.stringify({ status_agendamento: 'negado' }),
    })
  );
  await Promise.all(promises);
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
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/pai/${solicitacaoPai.id_agendamento_pai}/`, {
      method: 'PUT',
      body: JSON.stringify({ status_agendamento: novoStatus }),
    });
    if (!response.ok) throw new Error('Falha ao atualizar status.');
    
    if (novoStatus === 'aprovado') {
      const todosConflitos = new Set();
      solicitacaoPai.agendamentos_filhos.forEach(agendamento => {
        if (agendamento.status_agendamento === 'pendente') {
          const conflitos = verificarConflitosHorario(agendamento);
          conflitos.forEach(id => todosConflitos.add(id));
        }
      });
      if (todosConflitos.size > 0) {
        await rejeitarConflitos(Array.from(todosConflitos));
      }
    }
    await fetchSolicitacoes();
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
    
    if (novoStatus === 'aprovado') {
      const conflitos = verificarConflitosHorario(agendamentoFilho);
      if (conflitos.length > 0) {
        await rejeitarConflitos(conflitos);
      }
    }
    await fetchSolicitacoes();
  } catch (err) {
    alert(`Erro: ${err.message}`);
  }
};

const editarSolicitacao = (solicitacao) => {
  router.push(`/admin/solicitacao/${solicitacao.id_agendamento_pai}`);
};

const confirmarDelecao = async (solicitacao) => {
  if (confirm(`Tem certeza que deseja excluir permanentemente a solicitação para "${solicitacao.recurso}" de "${solicitacao.solicitante}"?`)) {
    try {
      const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/pai/${solicitacao.id_agendamento_pai}/`, {
        method: 'DELETE',
      });
      if (response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Falha ao excluir a solicitação.');
      }
      alert('Solicitação excluída com sucesso.');
      await fetchSolicitacoes();
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  }
};

const formatarData = (dataString) => {
  if (!dataString) return 'Data inválida';
  const dateOnly = dataString.split('T')[0];
  try {
    const date = new Date(dateOnly + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    return 'Data inválida';
  }
};

const formatarDataHora = (dataString) => {
    if (!dataString) return '';
    try {
        const data = new Date(dataString);
        return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return dataString;
    }
};

const getStatusClass = (status) => {
  if (!status) return 'status-default';
  const s = status.toLowerCase();
  if (s.includes('aprovado')) return 'status-success';
  if (s.includes('pendente')) return 'status-warning';
  if (s.includes('negado')) return 'status-error';
  if (s.includes('concluído') || s.includes('finalizado')) return 'status-info';
  return 'status-default';
};

onMounted(fetchSolicitacoes);
</script>

<style scoped>
.page-content-layout{display:flex;flex-direction:column;height:100%;overflow:hidden}
.page-header{flex-shrink:0;padding:1.5rem 1.5rem 1rem;background:linear-gradient(to bottom,#ffffff,#f8fafc);position:sticky;top:0;z-index:10;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
.page-title{font-size:1.875rem;font-weight:700;color:#111827}
.tabs{display:flex;gap:.25rem;background-color:#f3f4f6;padding:.25rem;border-radius:.5rem}
.tabs button{background:transparent;border:none;padding:.625rem 1.25rem;cursor:pointer;font-size:.875rem;font-weight:600;color:#6b7280;border-radius:.375rem;transition:all .2s}
.tabs button:hover:not(.active){background-color:#ffffff;color:#374151}
.tabs button.active{background-color:#ffffff;color:#4f46e5;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
.scrollable-list{flex-grow:1;overflow-y:auto;padding:1.5rem}
.solicitacoes-container{display:flex;flex-direction:column;gap:1rem;max-width:1400px;margin:0 auto;width:100%}
.card{background-color:white;border-radius:.75rem;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.06);overflow:hidden;transition:box-shadow .2s}
.card:hover{box-shadow:0 4px 6px rgba(0,0,0,0.1),0 2px 4px rgba(0,0,0,0.06)}
.card-header{padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:flex-start;cursor:pointer;background-color:#ffffff;transition:background-color .2s}
.card-header:hover{background-color:#f9fafb}
.header-info{display:flex;align-items:flex-start;gap:1rem;flex:1;min-width:0}
.expand-icon{font-size:1.25rem;color:#9ca3af;margin-top:.125rem;flex-shrink:0}
.info-content{flex:1;min-width:0}
.recurso-nome{font-size:1.375rem;font-weight:600;margin:0 0 .75rem 0;color:#111827;line-height:1.3}
.meta-info{display:flex;gap:2rem;flex-wrap:wrap}
.meta-item{display:flex;align-items:flex-start;gap:.625rem;min-width:0}
.meta-icon{font-size:1rem;color:#6b7280;margin-top:.125rem;flex-shrink:0}
.meta-text{display:flex;flex-direction:column;gap:.125rem;min-width:0}
.meta-label{font-size:.75rem;color:#9ca3af;text-transform:uppercase;letter-spacing:.025em;font-weight:500}
.meta-text strong{font-size:.875rem;color:#374151;font-weight:600}
.meta-date{font-size:.8125rem;color:#6b7280}
.header-actions{display:flex;align-items:center;gap:1rem;flex-shrink:0}
.action-buttons{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:.375rem;padding:.5rem 1rem;border-radius:.5rem;border:1px solid transparent;cursor:pointer;font-weight:500;font-size:.875rem;transition:all .2s;white-space:nowrap}
.btn-sm{padding:.4375rem .875rem;font-size:.8125rem}
.btn-outline{background-color:white;color:#4b5563;border-color:#d1d5db}
.btn-outline:hover{background-color:#f9fafb;border-color:#9ca3af}
.btn-success{background-color:#22c55e;color:white}
.btn-success:hover{background-color:#16a34a}
.btn-danger{background-color:#ef4444;color:white}
.btn-danger:hover{background-color:#dc2626}
.btn-icon-danger{background:transparent;border:none;cursor:pointer;padding:.5rem;border-radius:.5rem;color:#ef4444;display:flex;align-items:center;transition:all .2s}
.btn-icon-danger:hover{background-color:#fee2e2}
.btn-icon-mobile{display:none}
.card-expanded{animation:slideDown .2s ease-out}
@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
.card-content{padding:1.5rem;border-top:1px solid #e5e7eb;background-color:#f9fafb}
.details-grid{display:flex;flex-direction:column;gap:.75rem}
.detail-item{display:flex;gap:.5rem;font-size:.9375rem;color:#374151;line-height:1.5}
.detail-item strong{flex-shrink:0;color:#111827}
.horarios-list{background-color:white;padding:1rem 1.5rem 1.5rem}
.horario-item{display:flex;justify-content:space-between;align-items:center;padding:1rem;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:.5rem;margin-bottom:.75rem;transition:all .2s}
.horario-item:last-child{margin-bottom:0}
.horario-item:hover{background-color:#f1f5f9;border-color:#cbd5e1}
.horario-info{display:flex;align-items:center;gap:1rem;flex:1}
.horario-date-time{display:flex;flex-direction:column;gap:.25rem}
.horario-date{font-size:.875rem;font-weight:600;color:#374151}
.horario-time{font-size:.8125rem;color:#6b7280}
.horario-actions{display:flex;gap:.5rem;align-items:center}
.btn-horario{padding:.375rem .875rem;border-radius:.375rem;border:none;cursor:pointer;font-size:.8125rem;font-weight:500;transition:all .2s}
.btn-approve{background-color:#22c55e;color:white}
.btn-approve:hover{background-color:#16a34a}
.btn-deny{background-color:#ef4444;color:white}
.btn-deny:hover{background-color:#dc2626}
.status-small{font-size:.75rem;padding:.25rem .625rem}
.no-action{color:#9ca3af;font-size:.875rem}
.status-badge{display:inline-block;padding:.375rem .875rem;border-radius:9999px;font-size:.8125rem;font-weight:600;text-transform:capitalize;letter-spacing:.025em}
.status-success{background-color:#dcfce7;color:#14532d}
.status-warning{background-color:#fef3c7;color:#713f12}
.status-error{background-color:#fee2e2;color:#7f1d1d}
.status-info{background-color:#dbeafe;color:#1e3a8a}
.status-default{background-color:#f3f4f6;color:#374151}
.status-container{text-align:center;padding:3rem;color:#6b7280}
.spinner{font-size:2.5rem;animation:spin 1s linear infinite;color:#4f46e5}
@keyframes spin{to{transform:rotate(360deg)}}
@media (max-width:1024px){.page-header{padding:1.25rem 1rem .875rem}.page-title{font-size:1.625rem}.scrollable-list{padding:1.25rem 1rem}.card-header{padding:1rem 1.25rem}.recurso-nome{font-size:1.25rem}.meta-info{gap:1.5rem}.horarios-list{padding:1rem}.horario-item{padding:.875rem}}
@media (max-width:768px){.page-header{flex-direction:column;align-items:stretch;gap:1rem;padding:1rem}.page-title{font-size:1.375rem}.tabs{width:100%;justify-content:stretch}.tabs button{flex:1;padding:.5rem .75rem}.scrollable-list{padding:1rem .75rem}.card-header{flex-direction:column;gap:1rem;padding:1rem}.header-info{width:100%}.recurso-nome{font-size:1.125rem;margin-bottom:.625rem}.meta-info{flex-direction:column;gap:.625rem}.header-actions{width:100%;justify-content:flex-start}.action-buttons{flex-wrap:wrap}.btn-text{display:none}.btn-icon-mobile{display:inline-block}.horarios-list{padding:.75rem}.horario-item{flex-direction:column;align-items:stretch;gap:.75rem;padding:.75rem}.horario-info{justify-content:space-between}.horario-date-time{flex:1}.horario-actions{justify-content:center;width:100%}.btn-horario{flex:1;max-width:120px}}
@media (max-width:480px){.page-title{font-size:1.25rem}.scrollable-list{padding:.75rem .5rem}.card-header{padding:.75rem}.recurso-nome{font-size:1rem}.btn-sm{padding:.375rem .5rem;font-size:.75rem}.status-badge{font-size:.75rem;padding:.25rem .5rem}.card-content{padding:1rem}.horarios-list{padding:.5rem}.horario-item{padding:.625rem}.horario-date{font-size:.8125rem}.horario-time{font-size:.75rem}.btn-horario{font-size:.75rem;padding:.3125rem .625rem}}
</style>