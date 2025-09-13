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
                <span :class="getStatusClass(grupo.status_geral)" class="status-badge">{{ grupo.status_geral }}</span>
                <button v-if="grupo.status_geral === 'Aprovado'" @click.stop="marcarGrupoComoConcluido(grupo)" class="btn btn-outline btn-sm" title="Concluir Todos os Horários">
                  <Icon name="i-lucide-check-check" />
                </button>
              </div>
            </div>

            <div v-if="isGroupExpanded(grupo.id_agendamento_pai)">
              <div class="child-table-wrapper">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Horário</th>
                      <th>Status</th>
                      <th class="actions-cell">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="reserva in grupo.agendamentos_filhos" :key="reserva.id_agendamento">
                      <td>{{ formatarData(reserva.data_inicio) }}</td>
                      <td>{{ reserva.hora_inicio?.substring(0, 5) }} - {{ reserva.hora_fim?.substring(0, 5) }}</td>
                      <td>
                        <span :class="getStatusClass(reserva.status_agendamento)" class="status-badge-sm">
                          {{ reserva.status_agendamento }}
                        </span>
                      </td>
                      <td class="actions-cell">
                         <button v-if="reserva.status_agendamento === 'aprovado'" @click.stop="marcarHorarioComoConcluido(reserva)" class="btn-icon" title="Marcar este horário como Concluído">
                          <Icon name="i-lucide-check" />
                        </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { authenticatedFetch } from '~/utils/api';

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

    if (statuses.has('pendente')) {
        return statuses.has('aprovado') || statuses.has('negado') ? 'Parcialmente Aprovado' : 'Pendente';
    }
    if (statuses.has('aprovado')) {
        return (statuses.has('negado') || statuses.has('concluido')) ? 'Parcialmente Aprovado' : 'Aprovado';
    }
    if (statuses.size === 1 && statuses.has('concluido')) return 'Concluído';
    if (statuses.size === 1 && statuses.has('negado')) return 'Negado';
    
    if (statuses.has('concluido') || statuses.has('negado')) return 'Finalizado';

    return 'Indefinido';
};

const filteredReservas = computed(() => {
  const inProgressStatuses = ['Pendente', 'Aprovado', 'Parcialmente Aprovado'];
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

const formatarData = (dataString: string): string => {
  try {
    return new Date(`${dataString}T00:00:00`).toLocaleDateString('pt-BR');
  } catch {
    return dataString;
  }
};

const getStatusClass = (status: string): string => {
  if (!status) return 'status-default';
  const s = status.toLowerCase();
  if (s.includes('aprovado')) return 'status-success';
  if (s.includes('pendente')) return 'status-warning';
  if (s.includes('negado')) return 'status-error';
  if (s.includes('concluido') || s.includes('finalizado')) return 'status-info';
  return 'status-default';
};

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

onMounted(fetchReservas);
</script>

<style scoped>
.page-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.card-main { width: 100%; max-width: 1200px; height: 85vh; max-height: 800px; background-color: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; }
.card-header { padding: 1.5rem 2rem; border-bottom: 1px solid #e5e7eb; }
.title { font-size: 1.75rem; font-weight: 700; margin: 0; }
.tabs { margin-top: 1rem; display: flex; border-bottom: 2px solid #e5e7eb; }
.tabs button { background: none; border: none; padding: 0.75rem 1.5rem; cursor: pointer; font-size: 1rem; font-weight: 600; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; }
.tabs button.active { color: #4f46e5; border-bottom-color: #4f46e5; }
.card-content { flex-grow: 1; overflow-y: auto; padding: 1.5rem; }
.status-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: #6b7280; }
.spinner { font-size: 2.5rem; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
.reservas-container { display: flex; flex-direction: column; gap: 1rem; }
.card-item { background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e5e7eb; }
.card-item-header { padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.card-item-header:hover { background-color: #f9fafb; }
.header-info { display: flex; align-items: center; gap: 1rem; }
.expand-icon { font-size: 1.25rem; color: #9ca3af; }
.recurso-nome { font-size: 1.15rem; font-weight: 600; }
.finalidade-info { font-size: 0.875rem; color: #6b7280; }
.header-actions { display: flex; align-items: center; gap: 1rem; }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
.btn-outline { background-color: transparent; color: #4b5563; border-color: #d1d5db; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 0.5rem; border-radius: 50%; color: #6b7280; display: flex; align-items: center; }
.btn-icon:hover { background-color: #f3f4f6; color: #1f2937; }
.child-table-wrapper { max-height: 180px; overflow-y: auto; border-top: 1px solid #e5e7eb; }
.custom-table { width: 100%; border-collapse: collapse; }
.custom-table th { position: sticky; top: 0; background-color: #f9fafb; z-index: 1; padding: 0.75rem 1.5rem; text-align: left; font-size: 0.8rem; }
.custom-table td { padding: 0.75rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
.custom-table tbody tr:last-child td { border-bottom: none; }
.actions-cell { text-align: right; }
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 500; text-transform: capitalize; }
.status-badge-sm { padding: 0.15rem 0.6rem; font-size: 0.75rem; }
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
.status-info { background-color: #e0e7ff; color: #3730a3; }
.status-default { background-color: #e5e7eb; color: #374151; }
</style>