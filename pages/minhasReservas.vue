<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <h1 class="title">Minhas Reservas</h1>
      </div>

      <div class="card-content">
        <div v-if="isLoading" class="status-container">
          <Icon name="i-lucide-loader-2" class="spinner" />
          <p>Carregando reservas...</p>
        </div>
        <div v-else-if="error" class="status-container">
          <Icon name="i-lucide-x-circle" class="icon-error" />
          <p class="text-error">{{ error }}</p>
        </div>
        <div v-else-if="!reservasAgrupadas.length" class="status-container">
          <Icon name="i-lucide-calendar-off" class="icon-empty" />
          <p>Você ainda não possui nenhuma reserva.</p>
        </div>
        
        <div v-else class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th class="col-recurso">Recurso</th>
                <th class="col-periodo">Período</th>
                <th class="col-dias">Dias</th>
                <th class="col-finalidade">Finalidade</th>
                <th class="col-status">Status</th>
              </tr>
            </thead>
            <tbody v-for="grupo in reservasAgrupadas" :key="grupo.id_pai">
              <tr class="table-row parent-row" @click="toggleGroup(grupo.id_pai)">
                <td class="font-semibold">
                  <Icon 
                    :name="isGroupExpanded(grupo.id_pai) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" 
                    class="expand-icon" 
                  />
                  {{ grupo.recurso }}
                </td>
                <td>{{ grupo.periodo }}</td>
                <td>{{ grupo.dias }}</td>
                <td>{{ grupo.finalidade }}</td>
                <td>
                  <span :class="getStatusClass(grupo.status_geral)" class="status-badge">{{ grupo.status_geral }}</span>
                </td>
              </tr>
              
              <template v-if="isGroupExpanded(grupo.id_pai)">
                <tr class="details-row observations-row" v-if="grupo.observacoes">
                  <td colspan="5">
                    <Icon name="i-lucide-info" class="details-icon" />
                    <strong>Observações:</strong> {{ grupo.observacoes }}
                  </td>
                </tr>
                
                <tr class="child-header-row">
                  <th class="child-header">Próximas Datas</th>
                  <th class="child-header" colspan="4">Hora</th>
                </tr>
                
                <tr v-for="reserva in grupo.reservas.slice(0, 3)" :key="reserva.id_agendamento" class="table-row child-row">
                  <td>{{ formatarData(reserva.data_inicio) }}</td>
                  <td colspan="4">{{ reserva.hora_inicio.substring(0, 5) }}</td>
                </tr>

                <tr class="details-row more-details-row">
                  <td colspan="5">
                    <NuxtLink :to="`/reserva/${grupo.id_pai}`">
                      <button class="btn-ver-mais">
                        Ver todos os {{ grupo.dias }} dias e detalhes
                        <Icon name="i-lucide-arrow-right" />
                      </button>
                    </NuxtLink>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authenticatedFetch } from '~/utils/api';

const config = useRuntimeConfig();
const router = useRouter();

interface ReservaDaApi { id_agendamento: number; recurso: string; data_inicio: string; hora_inicio: string; finalidade: string; status_agendamento: string; agendamento_pai: number; observacoes: string; }
interface GrupoDeReserva { id_pai: number; recurso: string; finalidade: string; observacoes: string; periodo: string; dias: number; status_geral: string; reservas: ReservaDaApi[]; }

const reservasAgrupadas = ref<GrupoDeReserva[]>([]);
const expandedGroups = ref<number[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const toggleGroup = (id_pai: number) => { const index = expandedGroups.value.indexOf(id_pai); if (index === -1) { expandedGroups.value.push(id_pai); } else { expandedGroups.value.splice(index, 1); } };
const isGroupExpanded = (id_pai: number) => expandedGroups.value.includes(id_pai);
const formatarData = (dataString: string): string => { try { const data = new Date(`${dataString}T00:00:00`); return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return dataString; } };
const getStatusClass = (status: string) => { if (!status) return 'status-default'; const statusLower = status.toLowerCase(); if (statusLower.includes('confirmado')) return 'status-success'; if (statusLower.includes('pendente')) return 'status-warning'; if (statusLower.includes('cancelado')) return 'status-error'; return 'status-default'; };

const fetchReservas = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/minhas-reservas/`);
    if (!response.ok) throw new Error('Não foi possível buscar suas reservas.');
    const data: ReservaDaApi[] = await response.json();
    
    const grupos: Record<number, GrupoDeReserva> = {};
    for (const reserva of data) {
      const id_pai = reserva.agendamento_pai;
      if (!grupos[id_pai]) {
        grupos[id_pai] = { id_pai, recurso: reserva.recurso, finalidade: reserva.finalidade, observacoes: reserva.observacoes, periodo: '', dias: 0, status_geral: 'Pendente', reservas: [] };
      }
      grupos[id_pai].reservas.push(reserva);
    }
    
    Object.values(grupos).forEach(grupo => {
      grupo.reservas.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
      grupo.dias = grupo.reservas.length;
      if (grupo.dias > 0) {
        const primeiraData = grupo.reservas[0].data_inicio;
        const ultimaData = grupo.reservas[grupo.dias - 1].data_inicio;
        grupo.periodo = grupo.dias > 1 ? `${formatarData(primeiraData)} a ${formatarData(ultimaData)}` : formatarData(primeiraData);
        grupo.status_geral = grupo.reservas[0]?.status_agendamento || 'Pendente';
      }
    });
    reservasAgrupadas.value = Object.values(grupos);
  } catch (err: any) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchReservas);
</script>

<style scoped>
.page-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  width: 100%;
  max-width: 1200px; /* Mais largo para a tabela */
  height: 85vh;
  max-height: 800px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.card-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.title { font-size: 1.75rem; font-weight: 700; margin: 0; }
.card-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 0.5rem;
}
.status-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: #6b7280; }
.spinner { font-size: 2.5rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.table-container { padding: 1.5rem; }
.custom-table { width: 100%; border-collapse: collapse; }
.custom-table th { background-color: #f9fafb; font-weight: 600; padding: 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
.table-row td { padding: 1rem; color: #374151; vertical-align: middle; }
.parent-row { cursor: pointer; border-bottom: 1px solid #e5e7eb; }
.parent-row:hover { background-color: #f9fafb; }
.expand-icon { margin-right: 0.5rem; vertical-align: middle; }
.child-header-row th { padding-left: 2.5rem; background-color: #f8fafc; font-size: 0.8rem; }
.child-row td { padding-left: 2.5rem; background-color: #f8fafc; border-top: 1px solid #f3f4f6; }
.details-row td { background-color: #f8fafc; padding-left: 2.5rem; }
.btn-ver-mais { background: none; border: none; color: #2563eb; cursor: pointer; }
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
</style>