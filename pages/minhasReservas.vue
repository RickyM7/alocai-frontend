<template>
  <div>
    <BackgroundImage />
    <TheHeader />
    <div class="container">
      <h1 class="title">Minhas Reservas</h1>
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
.container { max-width: 1200px; margin: 2rem auto; padding: 2rem; background-color: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.title { font-size: 2rem; font-weight: 700; margin-bottom: 2rem; color: #1f2937; }
.status-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: #6b7280; font-size: 1.1rem; }
.spinner { font-size: 2.5rem; margin-bottom: 1rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.icon-error, .icon-empty { font-size: 3rem; margin-bottom: 1rem; }
.icon-error { color: #ef4444; }
.text-error { color: #b91c1c; }
.table-container { margin-top: 1rem; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
.custom-table { width: 100%; border-collapse: collapse; background-color: white; }
.custom-table th { background-color: #f9fafb; font-weight: 600; color: #374151; padding: 1rem 0.75rem; text-align: left; border-bottom: 2px solid #e5e7eb; }
.col-recurso { width: 35%; }
.col-periodo { width: 25%; }
.col-dias { width: 10%; text-align: center; }
.col-finalidade { width: 15%; }
.col-status { width: 15%; text-align: center; }
.table-row { transition: background-color 0.2s; }
.parent-row { cursor: pointer; }
.parent-row:hover { background-color: #f9fafb; }
.child-header-row { background-color: #f8fafc; }
.child-header { padding: 0.5rem 0.75rem 0.5rem 2.5rem; font-size: 0.8rem; font-weight: 600; color: #4b5563; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
.child-row { background-color: #f8fafc; }
.child-row td { padding-left: 2.5rem; color: #4b5563; border-bottom: 1px solid #f3f4f6; }
.child-row:last-of-type td { border-bottom: 1px solid #e5e7eb; }
.custom-table td { padding: 1rem 0.75rem; color: #374151; vertical-align: middle; }
.expand-icon { margin-right: 0.5rem; transition: transform 0.2s; vertical-align: middle; }
.details-row td { padding: 1rem 1.5rem 1rem 2.5rem; background-color: #f8fafc; color: #4b5563; font-size: 0.9rem; border-bottom: 1px solid #f3f4f6; }
.observations-row td { border-top: 1px solid #e5e7eb; }
.details-icon { vertical-align: middle; margin-right: 0.5rem; color: #9ca3af; }
.more-details-row td { text-align: center; padding: 0.5rem; }
.btn-ver-mais { background: none; border: none; color: #2563eb; font-weight: 500; cursor: pointer; padding: 0.5rem 1rem; border-radius: 6px; transition: background-color 0.2s; }
.btn-ver-mais:hover { background-color: #eff6ff; }
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; text-transform: capitalize; }
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
.status-default { background-color: #f3f4f6; color: #374151; }
</style>