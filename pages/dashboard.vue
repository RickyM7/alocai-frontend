<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <h1 v-if="!selectedResource" class="title">Dashboard</h1>
        <div v-if="selectedResource" class="resource-title-header">
           <button class="btn-back" @click="selectedResource = null; viewMode = 'list'"><Icon name="i-lucide-arrow-left" /></button>
           <h1 class="title">{{ selectedResource.nome_recurso }}</h1>
        </div>
        
        <div class="tabs">
          <button :class="['tab-btn', { 'active': viewMode === 'list' }]" @click="viewMode = 'list'; selectedResource = null">
            <Icon name="i-lucide-list" />
            <span>Lista de Recursos</span>
          </button>
          <button :class="['tab-btn', { 'active': viewMode === 'calendar' && !selectedResource }]" @click="viewMode = 'calendar'; selectedResource = null">
            <Icon name="i-lucide-calendar" />
            <span>Calendário Geral</span>
          </button>
        </div>
      </div>

      <div class="card-content">
        <div v-if="viewMode === 'list'" class="scrollable-content">
          <div v-if="isLoading" class="status-container"><Icon name="i-lucide-loader-2" class="spinner" /></div>
          <div v-else class="recursos-container">
            <div v-for="recurso in recursos" :key="recurso.id_recurso" class="recurso-item">
              <div class="recurso-header" @click="toggleRecurso(recurso.id_recurso)">
                <div class="header-info">
                   <Icon :name="recursoAberto === recurso.id_recurso ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="expand-icon" />
                  <div>
                    <h2 class="recurso-nome">{{ recurso.nome_recurso }}</h2>
                    <p class="recurso-local">{{ recurso.localizacao }}</p>
                  </div>
                </div>
                <div class="recurso-info">
                  <span :class="getStatusClass(recurso.status_recurso)" class="status-badge">{{ recurso.status_recurso.replace('_', ' ') }}</span>
                  <span class="badge">{{ recurso.agendamentos.length }} agendamento(s)</span>
                   <button class="btn-icon" @click.stop="showResourceCalendar(recurso)" title="Ver Calendário do Recurso">
                    <Icon name="i-lucide-calendar-days" />
                  </button>
                </div>
              </div>
               <div v-if="recursoAberto === recurso.id_recurso" class="agendamentos-content">
                <div v-if="recurso.agendamentos.length > 0" class="table-container">
                  <table>
                    <thead><tr><th>Data</th><th>Horário</th></tr></thead>
                    <tbody>
                      <tr v-for="agendamento in recurso.agendamentos" :key="agendamento.id_agendamento">
                        <td>{{ formatarData(agendamento.data_inicio) }}</td>
                        <td>{{ agendamento.hora_inicio.substring(0, 5) }} - {{ agendamento.hora_fim.substring(0, 5) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="no-agendamentos"><p>Nenhum agendamento aprovado.</p></div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="viewMode === 'calendar'" class="calendar-content-wrapper">
          <ClientOnly>
            <DashboardCalendarView :resource-id="selectedResource?.id_recurso" @date-clicked="handleDateClick" />
          </ClientOnly>
        </div>
      </div>
    </div>

    <!-- Modal com posicionamento fixo e overlay -->
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div v-if="selectedDayInfo" class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Agendamentos para {{ selectedDayInfo.date }}</h2>
            <button class="modal-close-btn" @click="closeModal">
              <Icon name="i-lucide-x" />
            </button>
          </div>
          
          <div v-if="selectedDayInfo.events?.length > 1" class="modal-summary">
            <p class="summary-text">{{ selectedDayInfo.events.length }}+ Horários Reservados</p>
          </div>

          <div v-if="selectedDayInfo.events?.length > 0" class="modal-events-list">
            <div v-for="event in selectedDayInfo.events" :key="event.id" class="modal-event-item">
              <p class="event-recurso">{{ event.extendedProps.recurso }}</p>
              <p class="event-finalidade">{{ event.extendedProps.finalidade }}</p>
              <p class="event-horario">Das {{ formatarHora(event.start) }} às {{ formatarHora(event.end) }}</p>
            </div>
          </div>
          
          <div v-else class="modal-no-events">
            <p>Nenhum agendamento encontrado para esta data.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DashboardCalendarView from '~/components/dashboard/CalendarView.vue';

const config = useRuntimeConfig();
const viewMode = ref('list');
const recursos = ref<any[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const recursoAberto = ref<number | null>(null);
const isModalOpen = ref(false);
const selectedDayInfo = ref<{ date: string; events: any[] } | null>(null);
const selectedResource = ref<{id_recurso: number, nome_recurso: string} | null>(null);

const toggleRecurso = (id: number) => { recursoAberto.value = recursoAberto.value === id ? null : id; };

const fetchListData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${config.public.apiUrl}/api/dashboard/`);
    if (!response.ok) throw new Error('Não foi possível carregar os dados.');
    recursos.value = await response.json();
  } catch (err: any) { error.value = err.message; } finally { isLoading.value = false; }
};

const formatarData = (dataString: string): string => new Date(`${dataString}T00:00:00`).toLocaleDateString('pt-BR');
const formatarHora = (dateString: string): string => new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const getStatusClass = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('disponivel')) return 'status-success';
  if (s.includes('manutencao')) return 'status-warning';
  if (s.includes('reservado')) return 'status-info';
  if (s.includes('indisponivel')) return 'status-error';
  return 'status-default';
};

const handleDateClick = (data: { date: Date; events: any[] }) => {
  selectedDayInfo.value = {
    date: data.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    events: data.events
  };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedDayInfo.value = null;
};

const showResourceCalendar = (recurso: any) => {
  selectedResource.value = recurso;
  viewMode.value = 'calendar';
};

onMounted(fetchListData);
</script>

<style scoped>
.page-container { width: 100%; height: calc(100vh - 64px - 2rem); display: flex; align-items: center; justify-content: center; box-sizing: border-box; position: relative; }
.card { width: 100%; max-width: 1200px; height: 100%; background-color: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; }
.card-header { padding: 1.5rem 2rem 0; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
.title { font-size: 1.75rem; font-weight: 700; margin: 0 0 1rem; }
.resource-title-header { display: flex; align-items: center; gap: 1rem; }
.btn-back { background: none; border: none; cursor: pointer; color: #4b5563; padding: 0.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.btn-back:hover { background-color: #f3f4f6; }
.tabs { display: flex; gap: 0.5rem; }
.tab-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border: none; background-color: transparent; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: #6b7280; transition: all 0.2s; }
.tab-btn.active { color: #4f46e5; border-bottom-color: #4f46e5; }
.card-content { flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; }
.scrollable-content { overflow-y: auto; padding: 1.5rem; }
.calendar-content-wrapper { flex-grow: 1; padding: 1rem; overflow: hidden; display: flex; flex-direction: column; }
.status-container { text-align: center; padding-top: 3rem; color: #6b7280; }
.spinner { font-size: 2.5rem; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
.recursos-container { display: flex; flex-direction: column; gap: 1rem; }
.recurso-item { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.recurso-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; cursor: pointer; }
.recurso-header:hover { background-color: #f9fafb; }
.header-info { display: flex; align-items: center; gap: 1rem; }
.expand-icon { font-size: 1.25rem; color: #9ca3af; }
.recurso-nome { font-weight: 600; }
.recurso-local { color: #6b7280; font-size: 0.9rem; }
.recurso-info { display: flex; align-items: center; gap: 0.75rem; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 0.5rem; border-radius: 50%; color: #6b7280; display: flex; align-items: center; }
.btn-icon:hover { background-color: #f3f4f6; color: #1f2937; }
.badge { background-color: #e5e7eb; color: #374151; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 500; font-size: 0.8rem; }
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 500; text-transform: capitalize; }
.agendamentos-content { background-color: #fdfdfd; padding-bottom: 1rem; }
.table-container { max-height: 150px; overflow-y: auto; }
.custom-table { width: 100%; border-collapse: collapse; }
.custom-table th { position: sticky; top: 0; background-color: #f9fafb; padding: 0.5rem 1.5rem; text-align: left; font-size: 0.8rem; }
.custom-table td { padding: 0.75rem 1.5rem; border-top: 1px solid #f3f4f6; }
.no-agendamentos { padding: 1rem 1.5rem; color: #6b7280; font-size: 0.9rem; }
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
.status-info { background-color: #dbeafe; color: #1e40af; }
.status-default { background-color: #e5e7eb; color: #374151; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-container { background-color: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); width: 90%; max-width: 500px; max-height: 80vh; overflow: hidden; animation: modalSlideIn 0.15s ease-out; }

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content { display: flex; flex-direction: column; height: 100%; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
.modal-title { font-size: 1.25rem; font-weight: 600; color: #1f2937; margin: 0; }
.modal-close-btn { background: none; border: none; cursor: pointer; color: #6b7280; padding: 0.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.modal-close-btn:hover { background-color: #f3f4f6; color: #1f2937; }
.modal-summary { padding: 1rem 1.5rem; background-color: #eff6ff; border-bottom: 1px solid #e0e7ff; text-align: center }
.summary-text { font-size: 1.125rem; font-weight: 600; color: #1e40af; margin: 0; }
.modal-events-list { padding: 1.5rem; overflow-y: auto; flex-grow: 1; }
.modal-event-item { border-bottom: 1px solid #f3f4f6; padding-bottom: 1rem; margin-bottom: 1rem; }
.modal-event-item:last-child { border-bottom: none; margin-bottom: 0; }
.event-recurso { font-weight: 600; color: #1f2937; margin: 0 0 0.25rem 0; font-size: 1rem; }
.event-finalidade { color: #6b7280; margin: 0 0 0.5rem 0; font-size: 0.875rem; }
.event-horario { color: #1f2937; font-weight: 500; margin: 0; font-size: 0.875rem; }
.modal-no-events { padding: 2rem 1.5rem; text-align: center; color: #6b7280; }
.modal-no-events p { margin: 0; font-style: italic; }
</style>