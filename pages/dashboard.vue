<template>
  <div class="page-content-layout">
    <div v-if="!selectedResource" class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <div class="tabs">
        <button :class="['tab-btn', { 'active': viewMode === 'list' }]" @click="viewMode = 'list'">
          <Icon name="i-lucide-list" />
          <span>Lista de Recursos</span>
        </button>
        <button :class="['tab-btn', { 'active': viewMode === 'calendar' }]" @click="viewMode = 'calendar'">
          <Icon name="i-lucide-calendar" />
          <span>Calendário Geral</span>
        </button>
      </div>
    </div>

    <div v-if="selectedResource" class="page-header">
      <div class="resource-header">
        <button class="btn-back" @click="selectedResource = null; viewMode = 'list'">
          <Icon name="i-lucide-arrow-left" />
        </button>
        <h1 class="page-title">{{ selectedResource.nome_recurso }}</h1>
      </div>
    </div>

    <div :class="['scrollable-list', { 'no-scroll': viewMode === 'calendar' }]">
      <div v-if="viewMode === 'list'" class="list-content">
        <div v-if="isLoading" class="status-container">
          <Icon name="i-lucide-loader-2" class="spinner" />
          <p>Carregando recursos...</p>
        </div>
        <div v-else-if="error" class="text-red-500 status-container">
          <Icon name="i-lucide-x-circle" class="icon-error" />
          <p>{{ error }}</p>
        </div>
        <div v-else-if="recursos.length === 0" class="status-container">
          <p>Nenhum recurso encontrado.</p>
        </div>
        <div v-else class="recursos-container">
          <div v-for="recurso in recursos" :key="recurso.id_recurso" class="card">
            <div class="card-header" @click="toggleRecurso(recurso.id_recurso)">
              <div class="header-info">
                <Icon :name="recursoAberto === recurso.id_recurso ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="expand-icon" />
                <div>
                  <h2 class="recurso-nome">{{ recurso.nome_recurso }}</h2>
                  <p class="recurso-local">{{ recurso.localizacao }}</p>
                </div>
              </div>
              <div class="header-actions">
                <span :class="getStatusClass(recurso.status_recurso)" class="status-badge">{{ formatarStatus(recurso.status_recurso) }}</span>
                <span class="badge">{{ recurso.agendamentos.length }} agendamento(s)</span>
                <button class="btn btn-outline btn-sm" @click.stop="showResourceCalendar(recurso)" title="Ver Calendário">
                  <Icon name="i-lucide-calendar-days" />
                  <span>Calendário</span>
                </button>
              </div>
            </div>

            <div v-if="recursoAberto === recurso.id_recurso">
              <div v-if="recurso.agendamentos.length > 0" class="child-table-wrapper">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="agendamento in recurso.agendamentos" :key="agendamento.id_agendamento">
                      <td>{{ formatarData(agendamento.data_inicio) }}</td>
                      <td>{{ agendamento.hora_inicio.substring(0, 5) }} - {{ agendamento.hora_fim.substring(0, 5) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="no-agendamentos">
                <p>Nenhum agendamento aprovado.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="viewMode === 'calendar'" class="calendar-content">
        <ClientOnly>
          <DashboardCalendarView :resource-id="selectedResource?.id_recurso" @date-clicked="handleDateClick" />
        </ClientOnly>
      </div>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div v-if="selectedDayInfo" class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Agendamentos para {{ selectedDayInfo.date }}</h2>
            <button class="modal-close-btn" @click="closeModal"><Icon name="i-lucide-x" /></button>
          </div>
          <div v-if="selectedDayInfo.events && selectedDayInfo.events.length > 1" class="modal-summary">
            <p class="summary-text">{{ selectedDayInfo.events.length }} Horários Reservados</p>
          </div>
          <div class="modal-events-container">
            <div v-if="selectedDayInfo.events && selectedDayInfo.events.length > 0" class="modal-events-list">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DashboardCalendarView from '~/components/dashboard/CalendarView.vue';
import { getStatusClass, formatarData, formatarStatus } from '~/utils/formatters';

definePageMeta({ layout: 'dashboard'});

const config = useRuntimeConfig();
const viewMode = ref('list');
const recursos = ref<any[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const recursoAberto = ref<number | null>(null);
const isModalOpen = ref(false);
const selectedDayInfo = ref<{ date: string; events: any[] } | null>(null);
const selectedResource = ref<{id_recurso: number, nome_recurso: string} | null>(null);

const toggleRecurso = (id: number) => { 
  recursoAberto.value = recursoAberto.value === id ? null : id; 
};

const fetchListData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${config.public.apiUrl}/api/dashboard/`);
    if (!response.ok) throw new Error('Não foi possível carregar os dados.');
    recursos.value = await response.json();
  } catch (err: any) { 
    error.value = err.message; 
  } finally { 
    isLoading.value = false; 
  }
};

const formatarHora = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
.page-content-layout{display:flex;flex-direction:column;height:100%;overflow:hidden;min-width:0}
.page-header{flex-shrink:0;background:transparent;position:sticky;top:-2rem;padding-top:2rem;z-index:10;padding-bottom:1rem}
.page-title{font-size:1.75rem;font-weight:700;margin:0}
.tabs{display:flex;gap:.5rem;margin-top:1rem;flex-wrap:wrap}
.tab-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.25rem;border:none;background:transparent;border-bottom:3px solid transparent;cursor:pointer;font-weight:600;color:#6b7280;transition:all .2s}
.tab-btn.active{color:#4f46e5;border-bottom-color:#4f46e5}
.resource-header{display:flex;align-items:center;gap:1rem}
.btn-back{background:none;border:none;cursor:pointer;color:#4b5563;padding:.5rem;border-radius:50%;display:flex;align-items:center;justify-content:center}
.btn-back:hover{background:#f3f4f6}
.scrollable-list{flex-grow:1;overflow-y:auto;padding-right:1rem;min-width:0}
.scrollable-list.no-scroll{overflow:hidden;padding-right:0}
.list-content{padding:0}
.calendar-content{height:100%;display:flex;flex-direction:column;flex:1;min-width:0;overflow:hidden}
.calendar-content :deep(.calendar-container){min-width:0;width:100%}
.calendar-content :deep(.calendar-grid){max-width:100%}
.status-container{text-align:center;padding:2rem;color:#6b7280}
.spinner{font-size:2rem;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.recursos-container{display:flex;flex-direction:column;gap:1rem}
.card{background:#fff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,.05);overflow:hidden}
.card-header{padding:1rem 1.5rem;display:flex;justify-content:space-between;align-items:flex-start;cursor:pointer;border-bottom:1px solid #e5e7eb}
.card-header:hover{background:#f9fafb}
.header-info{display:flex;align-items:flex-start;gap:1rem;flex:1}
.expand-icon{font-size:1.25rem;color:#9ca3af;margin-top:.125rem}
.recurso-nome{font-size:1.25rem;font-weight:600;margin:0}
.recurso-local{font-size:.875rem;color:#6b7280;margin:0}
.header-actions{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border-radius:6px;border:1px solid transparent;cursor:pointer;font-weight:500;transition:all .2s;white-space:nowrap}
.btn-sm{padding:.375rem .75rem;font-size:.875rem}
.btn-outline{background:transparent;color:#4b5563;border-color:#d1d5db}
.btn-outline:hover{background:#f9fafb}
.badge{background:#e5e7eb;color:#374151;padding:.25rem .75rem;border-radius:9999px;font-weight:500;font-size:.8rem}
.status-badge{display:inline-block;padding:.25rem .75rem;border-radius:9999px;font-size:.875rem;font-weight:500;text-transform:capitalize}
.child-table-wrapper{max-height:200px;overflow-y:auto;overflow-x:auto}
.child-table-wrapper .custom-table th{position:sticky;top:0;background:#f9fafb;z-index:1}
.custom-table{width:100%;border-collapse:collapse}
.custom-table th,.custom-table td{padding:.75rem 1rem;text-align:left;border-bottom:1px solid #e5e7eb}
.custom-table tbody tr:last-child td{border-bottom:none}
.no-agendamentos{padding:1rem 1.5rem;color:#6b7280;font-size:.9rem}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px)}
.modal-container{background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.3);width:90%;max-width:500px;max-height:80vh;overflow:hidden;animation:modalSlideIn .15s ease-out}
@keyframes modalSlideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
.modal-content{display:flex;flex-direction:column;height:100%}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding:1.5rem;border-bottom:1px solid #e5e7eb;flex-shrink:0}
.modal-title{font-size:1.25rem;font-weight:600;color:#1f2937;margin:0}
.modal-close-btn{background:none;border:none;cursor:pointer;color:#6b7280;padding:.5rem;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all .2s}
.modal-close-btn:hover{background:#f3f4f6;color:#1f2937}
.modal-summary{padding:1rem 1.5rem;background:#eff6ff;border-bottom:1px solid #e0e7ff;text-align:center}
.summary-text{font-size:1.125rem;font-weight:600;color:#1e40af;margin:0}
.modal-events-container{flex-grow:1;overflow:hidden;display:flex;flex-direction:column}
.modal-events-list{padding:1.5rem;overflow-y:auto;flex-grow:1}
.modal-event-item{border-bottom:1px solid #f3f4f6;padding-bottom:1rem;margin-bottom:1rem}
.modal-event-item:last-child{border-bottom:none;margin-bottom:0}
.event-recurso{font-weight:600;color:#1f2937;margin:0 0 .25rem 0;font-size:1rem}
.event-finalidade{color:#6b7280;margin:0 0 .5rem 0;font-size:.875rem}
.event-horario{color:#1f2937;font-weight:500;margin:0;font-size:.875rem}
.modal-no-events{padding:2rem 1.5rem;text-align:center;color:#6b7280}
.modal-no-events p{margin:0;font-style:italic}

@media(max-width:48rem){
  .page-content-layout{padding: 1rem}
  .page-header{position:static;top:auto;padding-top:1rem}
  .scrollable-list{padding-right:0}
  .calendar-content :deep(.calendar-container){width:98%;margin:0 auto}
  .tab-btn{padding:.6rem 1rem;font-size:.95rem}
}
@media(max-width:31.25rem){
  .page-title{font-size:1.5rem}
  .tab-btn{padding:.5rem .9rem;font-size:.9rem}
}
</style>