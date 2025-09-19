<template>
  <div class="page-container">
    <div class="card-main">
      <div class="card-header">
        <h1 class="title">Minhas Reservas</h1>
        <div class="tabs">
          <button :class="{ active: activeTab === 'em_andamento' }" @click="activeTab = 'em_andamento'">
            Em Andamento
          </button>
          <button :class="{ active: activeTab === 'historico' }" @click="activeTab = 'historico'">
            Histórico
          </button>
        </div>
      </div>

      <div class="card-content">
        <div v-if="isLoading" class="status-container">
          <Icon name="i-lucide-loader-2" class="spinner" />
          <p>Carregando...</p>
        </div>
        <div v-else-if="error" class="status-container">
          <Icon name="i-lucide-x-circle" class="icon-error" />
          <p class="text-error">{{ error }}</p>
        </div>
        <div v-else-if="!filteredReservas.length" class="status-container">
          <Icon name="i-lucide-calendar-off" class="icon-empty" />
          <p>Você ainda não possui nenhuma reserva aqui.</p>
        </div>
        
        <div v-else class="reservas-container">
          <div v-for="grupo in filteredReservas" :key="grupo.id_agendamento_pai" class="card-item">
            <div class="card-item-header" @click="toggleGroup(grupo.id_agendamento_pai)">
              <div class="header-info">
                <Icon :name="isGroupExpanded(grupo.id_agendamento_pai) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="expand-icon" />
                <div>
                  <h2 class="recurso-nome">{{ grupo.recurso }}</h2>
                  <p class="finalidade-info">{{ grupo.finalidade }}</p>
                </div>
              </div>
              <div class="header-actions">
                <span :class="getStatusClass(grupo.status_geral)" class="status-badge">{{ formatarStatus(grupo.status_geral) }}</span>
                <div class="botoes-grupo-principal">
                  <button v-if="['aprovado', 'parcialmente_aprovado'].includes(grupo.status_geral)" @click.stop="marcarGrupoComoConcluido(grupo)" class="btn-icon-action btn-icon-success" title="Concluir Todos os Horários">
                    <Icon name="i-lucide-check-check" />
                  </button>
                  <button v-if="!['cancelado', 'concluido', 'finalizado', 'negado'].includes(grupo.status_geral)" @click.stop="cancelarGrupo(grupo)" class="btn-icon-action btn-icon-danger" title="Cancelar Todos os Horários Pendentes/Aprovados">
                    <Icon name="i-lucide-x" />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="isGroupExpanded(grupo.id_agendamento_pai)" class="horarios-detalhes">
              <div v-for="reserva in grupo.agendamentos_filhos" :key="reserva.id_agendamento" class="horario-card">
                <div class="horario-info-principal">
                  <div class="info-data-hora">
                    <span class="horario-data">{{ formatarDataCompleta(reserva.data_inicio) }}</span>
                    <span class="horario-hora">Das {{ reserva.hora_inicio?.substring(0, 5) }} às {{ reserva.hora_fim?.substring(0, 5) }}</span>
                  </div>
                  <span :class="getStatusClass(reserva.status_agendamento)" class="status-badge-sm">{{ formatarStatus(reserva.status_agendamento) }}</span>
                </div>
                <div v-if="['aprovado', 'pendente'].includes(reserva.status_agendamento)" class="horario-actions">
                   <button v-if="reserva.status_agendamento === 'aprovado'" @click.stop="marcarHorarioComoConcluido(reserva)" class="btn-horario btn-concluir">
                    <Icon name="i-lucide-check" /> Concluir
                  </button>
                  <button @click.stop="cancelarHorario(reserva)" class="btn-horario btn-cancelar">
                    <Icon name="i-lucide-x" /> Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { authenticatedFetch } from '~/utils/api';
import { getStatusClass, formatarData, formatarStatus, formatarDataCompleta } from '~/utils/formatters';

interface ReservaFilho {
  id_agendamento: number;
  data_inicio: string;
  hora_inicio: string;
  hora_fim: string;
  status_agendamento: string;
}

interface GrupoDeReserva {
  id_agendamento_pai: number;
  recurso: string;
  finalidade: string;
  observacoes: string;
  status_geral: string;
  agendamentos_filhos: ReservaFilho[];
}

const config = useRuntimeConfig();
const reservasAgrupadas = ref<GrupoDeReserva[]>([]);
const expandedGroups = ref<number[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref('em_andamento');

const calcularStatusGeral = (reservas: ReservaFilho[]): string => {
    const statuses = new Set(reservas.map(r => r.status_agendamento));
    const hasPendente = statuses.has('pendente');
    const hasAprovado = statuses.has('aprovado');
    const hasNegado = statuses.has('negado');
    const hasConcluido = statuses.has('concluido');
    const hasCancelado = statuses.has('cancelado');

    if (hasAprovado) {
        if (statuses.size > 1) {
            return 'parcialmente_aprovado';
        }
        return 'aprovado';
    }

    if (hasPendente) {
        if (hasNegado || hasCancelado) {
            return 'parcialmente_negado';
        }
        return 'pendente';
    }

    if (statuses.size === 1 && hasConcluido) return 'concluido';
    if (statuses.size === 1 && hasNegado) return 'negado';
    if (statuses.size === 1 && hasCancelado) return 'cancelado';
    
    if (hasConcluido || hasNegado || hasCancelado) return 'finalizado';

    return 'indefinido';
};

const filteredReservas = computed(() => {
  const inProgressStatuses = ['pendente', 'aprovado', 'parcialmente_aprovado', 'parcialmente_negado'];
  if (activeTab.value === 'em_andamento') {
    return reservasAgrupadas.value.filter(grupo => inProgressStatuses.includes(grupo.status_geral));
  }
  return reservasAgrupadas.value.filter(grupo => !inProgressStatuses.includes(grupo.status_geral));
});

const toggleGroup = (id: number) => {
  const index = expandedGroups.value.indexOf(id);
  if (index === -1) {
    expandedGroups.value.push(id);
  } else {
    expandedGroups.value.splice(index, 1);
  }
};

const isGroupExpanded = (id: number) => expandedGroups.value.includes(id);

const fetchReservas = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/minhas-reservas/`);
    if (!response.ok) throw new Error('Não foi possível buscar suas reservas.');
    const data: GrupoDeReserva[] = await response.json();
    data.forEach(grupo => {
      grupo.status_geral = calcularStatusGeral(grupo.agendamentos_filhos);
    });
    reservasAgrupadas.value = data;
  } catch (err: any) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const marcarGrupoComoConcluido = async (grupo: GrupoDeReserva) => {
  if (!confirm(`Tem certeza que deseja marcar TODOS os horários para "${grupo.recurso}" como concluídos?`)) return;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/pai/${grupo.id_agendamento_pai}/status/`, {
      method: 'PUT',
      body: JSON.stringify({ status_agendamento: 'concluido' }),
    });
    if (!response.ok) throw new Error('Falha ao atualizar o status.');
    await fetchReservas();
  } catch (err: any) {
    alert(`Erro: ${err.message}`);
  }
};

const cancelarGrupo = async (grupo: GrupoDeReserva) => {
  if (!confirm(`Tem certeza que deseja CANCELAR TODOS os horários pendentes e aprovados para "${grupo.recurso}"?`)) return;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/pai/${grupo.id_agendamento_pai}/status/`, {
      method: 'PUT',
      body: JSON.stringify({ status_agendamento: 'cancelado' }),
    });
    if (!response.ok) throw new Error('Falha ao cancelar os agendamentos.');
    await fetchReservas();
  } catch (err: any) {
    alert(`Erro: ${err.message}`);
  }
};

const marcarHorarioComoConcluido = async (reserva: ReservaFilho) => {
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/${reserva.id_agendamento}/status/`, {
      method: 'PUT',
      body: JSON.stringify({ status_agendamento: 'concluido' }),
    });
    if (!response.ok) throw new Error('Falha ao atualizar o status do horário.');
    await fetchReservas();
  } catch (err: any) {
    alert(`Erro: ${err.message}`);
  }
};

const cancelarHorario = async (reserva: ReservaFilho) => {
  if (!confirm(`Tem certeza que deseja CANCELAR o agendamento do dia ${formatarData(reserva.data_inicio)}?`)) return;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/${reserva.id_agendamento}/status/`, {
      method: 'PUT',
      body: JSON.stringify({ status_agendamento: 'cancelado' }),
    });
    if (!response.ok) throw new Error('Falha ao cancelar o horário.');
    await fetchReservas();
  } catch (err: any) {
    alert(`Erro: ${err.message}`);
  }
};

onMounted(fetchReservas);
</script>

<style scoped>
.page-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box; }
.card-main { width: 100%; max-width: 1200px; height: 85vh; max-height: 800px; background-color: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; }
.card-header { padding: 1.5rem 2rem; border-bottom: 1px solid #e5e7eb; }
.title { font-size: 1.75rem; font-weight: 700; margin: 0; }
.tabs { margin-top: 1rem; display: flex; border-bottom: 2px solid #e5e7eb; }
.tabs button { background: none; border: none; padding: 0.75rem 1.5rem; cursor: pointer; font-size: 1rem; font-weight: 600; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; }
.tabs button.active { color: #4f46e5; border-bottom-color: #4f46e5; }
.card-content { flex-grow: 1; overflow-y: auto; padding: 1.5rem; background-color: #f9fafb; }
.status-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: #6b7280; }
.spinner { font-size: 2.5rem; animation: spin 1s linear infinite; } 
@keyframes spin { to { transform: rotate(360deg); } }
.icon-empty { font-size: 3rem; margin-bottom: 1rem; color: #9ca3af; }
.reservas-container { display: flex; flex-direction: column; gap: 1rem; }
.card-item { background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e5e7eb; }
.card-item-header { padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.card-item-header:hover { background-color: #f9fafb; }
.header-info { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.expand-icon { font-size: 1.25rem; color: #9ca3af; }
.recurso-nome { font-size: 1.15rem; font-weight: 600; }
.finalidade-info { font-size: 0.875rem; color: #6b7280; }
.header-actions { display: flex; align-items: center; gap: 0.75rem; }
.botoes-grupo-principal { display: flex; gap: 0.5rem; }
.btn-icon-action { background-color: #f3f4f6; border: 1px solid #d1d5db; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.btn-icon-action .icon { font-size: 1.1rem; }
.btn-icon-action.btn-icon-success { color: #16a34a; }
.btn-icon-action.btn-icon-danger { color: #dc2626; }
.btn-icon-action:hover { transform: scale(1.1); }
.btn-icon-action.btn-icon-success:hover { background-color: #dcfce7; border-color: #16a34a; }
.btn-icon-action.btn-icon-danger:hover { background-color: #fee2e2; border-color: #dc2626; }
.horarios-detalhes { padding: 0 1.5rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 0.75rem; background-color: #f9fafb; }
.horarios-detalhes > *:first-child { margin-top: 1.5rem; }
.horario-card { background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; }
.horario-info-principal { display: flex; justify-content: space-between; align-items: flex-start; }
.info-data-hora { display: flex; flex-direction: column; }
.horario-data { font-weight: 600; font-size: 0.9rem; color: #374151; }
.horario-hora { font-size: 0.85rem; color: #6b7280; }
.horario-actions { border-top: 1px solid #f3f4f6; padding-top: 0.75rem; margin-top: 0.75rem; display: flex; gap: 0.5rem; justify-content: flex-end; }
.btn-horario { border: 1px solid transparent; font-weight: 500; font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem; transition: all 0.2s; }
.btn-horario .icon { font-size: 0.9rem; }
.btn-horario.btn-concluir { background-color: #f0fdf4; color: #15803d; }
.btn-horario.btn-concluir:hover { background-color: #dcfce7; border-color: #16a34a; }
.btn-horario.btn-cancelar { background-color: #fef2f2; color: #b91c1c; }
.btn-horario.btn-cancelar:hover { background-color: #fee2e2; border-color: #dc2626; }
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 500; text-transform: capitalize; }
.status-badge-sm { padding: 0.15rem 0.6rem; font-size: 0.75rem; }
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
.status-info { background-color: #e0e7ff; color: #3730a3; }
.status-default { background-color: #e5e7eb; color: #374151; }
@media (max-width: 768px) {
  .page-container { padding: 0; align-items: stretch; }
  .card-main { height: auto; min-height: 100vh; max-height: none; border-radius: 0; box-shadow: none; }
  .card-header { padding: 1rem; }
  .title { font-size: 1.5rem; }
  .tabs button { padding: 0.5rem 1rem; font-size: 0.9rem; }
  .card-content { padding: 1rem; }
  .card-item-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .header-actions { width: 100%; justify-content: space-between; }
  .horarios-detalhes { padding: 1rem; }
  .horarios-detalhes > *:first-child { margin-top: 1rem; }
}
@media (min-width: 769px) {
  .horarios-detalhes > *:first-child { margin-top: 1rem; }
}
</style>