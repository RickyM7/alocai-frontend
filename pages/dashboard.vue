<template>
  <div class="page-content-layout">
    <div v-if="!selectedResource" class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <div class="tabs">
        <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
          Lista de Recursos
        </button>
        <button :class="{ active: viewMode === 'calendar' }" @click="viewMode = 'calendar'">
          Calendário Geral
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
                <div class="info-content">
                  <h2 class="recurso-nome">{{ recurso.nome_recurso }}</h2>
                  <div class="meta-info">
                    <div class="meta-item">
                      <Icon name="i-lucide-map-pin" class="meta-icon" />
                      <div class="meta-text">
                        <span class="meta-label">Localização</span>
                        <strong>{{ recurso.localizacao }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="header-actions">
                <span :class="getStatusClass(recurso.status_recurso)" class="status-badge">{{ formatarStatus(recurso.status_recurso) }}</span>
                <span class="badge">{{ recurso.agendamentos.length }} agendamento(s)</span>
                <div class="action-buttons">
                  <button class="btn btn-outline btn-sm" @click.stop="showResourceCalendar(recurso)" title="Ver Calendário">
                    <Icon name="i-lucide-calendar-days" class="btn-icon-mobile" />
                    <span class="btn-text">Calendário</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="recursoAberto === recurso.id_recurso" class="card-expanded">
              <div v-if="recurso.agendamentos.length > 0" class="card-content">
                <div class="horarios-list">
                  <div v-for="agendamento in recurso.agendamentos" :key="agendamento.id_agendamento" class="horario-item">
                    <div class="horario-info">
                      <div class="horario-date-time">
                        <span class="horario-date">{{ formatarData(agendamento.data_inicio) }}</span>
                        <span class="horario-time">Das {{ agendamento.hora_inicio.substring(0, 5) }} às {{ agendamento.hora_fim.substring(0, 5) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
.page-content-layout{ display: flex; flex-direction: column; height: 100%; overflow: hidden }
.page-header{ flex-shrink: 0; padding: 1.5rem 1.5rem 1rem; background: linear-gradient(to bottom, #ffffff, #f8fafc); position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05) }
.page-title{ font-size: 1.875rem; font-weight: 700; color: #111827 }
.tabs{ display: flex; gap: .25rem; background-color: #f3f4f6; padding: .25rem; border-radius: .5rem }
.tabs button{ background: transparent; border: none; padding: .625rem 1.25rem; cursor: pointer; font-size: .875rem; font-weight: 600; color: #6b7280; border-radius: .375rem; transition: all .2s }
.tabs button:hover:not(.active){ background-color: #ffffff; color: #374151 }
.tabs button.active{ background-color: #ffffff; color: #4f46e5; box-shadow: 0 1px 3px rgba(0,0,0,0.1) }
.resource-header{ display: flex; align-items: center; gap: 1rem; width: 100% }
.btn-back{ background: none; border: none; cursor: pointer; color: #4b5563; padding: .5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all .2s }
.btn-back:hover{ background: #f3f4f6 }
.scrollable-list{ flex-grow: 1; overflow-y: auto; padding: 1.5rem }
.scrollable-list.no-scroll{ overflow: hidden; padding: 1rem }
.list-content{ max-width: 1400px; margin: 0 auto; width: 100% }
.calendar-content{ height: 100%; display: flex; flex-direction: column; flex: 1; min-width: 0; overflow: hidden }
.recursos-container{ display: flex; flex-direction: column; gap: 1rem; max-width: 1400px; margin: 0 auto; width: 100% }
.card{ background-color: white; border-radius: .75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.06); overflow: hidden; transition: box-shadow .2s }
.card:hover{ box-shadow: 0 4px 6px rgba(0,0,0,0.1),0 2px 4px rgba(0,0,0,0.06) }
.card-header{ padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer; background-color: #ffffff; transition: background-color .2s }
.card-header:hover{ background-color: #f9fafb }
.header-info{ display: flex; align-items: flex-start; gap: 1rem; flex: 1; min-width: 0 }
.expand-icon{ font-size: 1.25rem; color: #9ca3af; margin-top: .125rem; flex-shrink: 0 }
.info-content{ flex: 1; min-width: 0 }
.recurso-nome{ font-size: 1.375rem; font-weight: 600; margin: 0 0 .75rem 0; color: #111827; line-height: 1.3 }
.meta-info{ display: flex; gap: 2rem; flex-wrap: wrap }
.meta-item{ display: flex; align-items: flex-start; gap: .625rem; min-width: 0 }
.meta-icon{ font-size: 1rem; color: #6b7280; margin-top: .125rem; flex-shrink: 0 }
.meta-text{ display: flex; flex-direction: column; gap: .125rem; min-width: 0 }
.meta-label{ font-size: .75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: .025em; font-weight: 500 }
.meta-text strong{ font-size: .875rem; color: #374151; font-weight: 600 }
.header-actions{ display: flex; align-items: center; gap: 1rem; flex-shrink: 0 }
.action-buttons{ display: flex; align-items: center; gap: .5rem; flex-wrap: wrap }
.btn{ display: inline-flex; align-items: center; gap: .375rem; padding: .5rem 1rem; border-radius: .5rem; border: 1px solid transparent; cursor: pointer; font-weight: 500; font-size: .875rem; transition: all .2s; white-space: nowrap }
.btn-sm{ padding: .4375rem .875rem; font-size: .8125rem }
.btn-outline{ background-color: white; color: #4b5563; border-color: #d1d5db }
.btn-outline:hover{ background-color: #f9fafb; border-color: #9ca3af }
.btn-icon-mobile{ display: none }
.badge{ background: #e5e7eb; color: #374151; padding: .375rem .875rem; border-radius: 9999px; font-weight: 500; font-size: .8125rem }
.status-badge{ display: inline-block; padding: .375rem .875rem; border-radius: 9999px; font-size: .8125rem; font-weight: 600; text-transform: capitalize; letter-spacing: .025em }
.status-success{ background-color: #dcfce7; color: #14532d }
.status-warning{ background-color: #fef3c7; color: #713f12 }
.status-error{ background-color: #fee2e2; color: #7f1d1d }
.status-info{ background-color: #dbeafe; color: #1e3a8a }
.status-default{ background-color: #f3f4f6; color: #374151 }
.card-expanded{ animation: slideDown .2s ease-out }
@keyframes slideDown{ from{ opacity: 0; transform: translateY(-10px) } to{ opacity: 1; transform: translateY(0) } }
.card-content{ padding: 1.5rem; border-top: 1px solid #e5e7eb; background-color: #f9fafb }
.horarios-list{ background-color: white; padding: 1rem 1.5rem 1.5rem }
.horario-item{ display: flex; justify-content: space-between; align-items: center; padding: 1rem; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: .5rem; margin-bottom: .75rem; transition: all .2s }
.horario-item:last-child{ margin-bottom: 0 }
.horario-item:hover{ background-color: #f1f5f9; border-color: #cbd5e1 }
.horario-info{ display: flex; align-items: center; gap: 1rem; flex: 1 }
.horario-date-time{ display: flex; flex-direction: column; gap: .25rem }
.horario-date{ font-size: .875rem; font-weight: 600; color: #374151 }
.horario-time{ font-size: .8125rem; color: #6b7280 }
.no-agendamentos{ padding: 1rem 1.5rem; color: #6b7280; font-size: .9rem; text-align: center }
.status-container{ text-align: center; padding: 3rem; color: #6b7280 }
.spinner{ font-size: 2.5rem; animation: spin 1s linear infinite; color: #4f46e5 }
@keyframes spin{ to{ transform: rotate(360deg) } }
.modal-overlay{ position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px) }
.modal-container{ background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,.3); width: 90%; max-width: 500px; max-height: 80vh; overflow: hidden; animation: modalSlideIn .15s ease-out }
@keyframes modalSlideIn{ from{ opacity: 0; transform: translateY(-10px) } to{ opacity: 1; transform: translateY(0) } }
.modal-content{ display: flex; flex-direction: column; height: 100% }
.modal-header{ display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; flex-shrink: 0 }
.modal-title{ font-size: 1.25rem; font-weight: 600; color: #1f2937; margin: 0 }
.modal-close-btn{ background: none; border: none; cursor: pointer; color: #6b7280; padding: .5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all .2s }
.modal-close-btn:hover{ background: #f3f4f6; color: #1f2937 }
.modal-summary{ padding: 1rem 1.5rem; background: #eff6ff; border-bottom: 1px solid #e0e7ff; text-align: center }
.summary-text{ font-size: 1.125rem; font-weight: 600; color: #1e40af; margin: 0 }
.modal-events-container{ flex-grow: 1; overflow: hidden; display: flex; flex-direction: column }
.modal-events-list{ padding: 1.5rem; overflow-y: auto; flex-grow: 1 }
.modal-event-item{ border-bottom: 1px solid #f3f4f6; padding-bottom: 1rem; margin-bottom: 1rem }
.modal-event-item:last-child{ border-bottom: none; margin-bottom: 0 }
.event-recurso{ font-weight: 600; color: #1f2937; margin: 0 0 .25rem 0; font-size: 1rem }
.event-finalidade{ color: #6b7280; margin: 0 0 .5rem 0; font-size: .875rem }
.event-horario{ color: #1f2937; font-weight: 500; margin: 0; font-size: .875rem }
.modal-no-events{ padding: 2rem 1.5rem; text-align: center; color: #6b7280 }
.modal-no-events p{ margin: 0; font-style: italic }

@media (max-width: 1024px) {
  .page-header{ padding: 1.25rem 1rem .875rem }
  .page-title{ font-size: 1.625rem }
  .scrollable-list{ padding: 1.25rem 1rem }
  .card-header{ padding: 1rem 1.25rem }
  .recurso-nome{ font-size: 1.25rem }
  .meta-info{ gap: 1.5rem }
  .horarios-list{ padding: 1rem }
  .horario-item{ padding: .875rem }
}

@media (max-width: 768px) {
  .page-header{ flex-direction: column; align-items: stretch; gap: 1rem; padding: 1rem }
  .page-title{ font-size: 1.375rem }
  .tabs{ width: 100%; justify-content: stretch }
  .tabs button{ flex: 1; padding: .5rem .75rem }
  .scrollable-list{ padding: 1rem .75rem }
  .card-header{ flex-direction: column; gap: 1rem; padding: 1rem }
  .header-info{ width: 100% }
  .recurso-nome{ font-size: 1.125rem; margin-bottom: .625rem }
  .meta-info{ flex-direction: column; gap: .625rem }
  .header-actions{ width: 100%; justify-content: flex-start }
  .action-buttons{ flex-wrap: wrap }
  .btn-text{ display: none }
  .btn-icon-mobile{ display: inline-block }
  .horarios-list{ padding: .75rem }
  .horario-item{ flex-direction: column; align-items: stretch; gap: .75rem; padding: .75rem }
  .horario-info{ justify-content: space-between }
  .horario-date-time{ flex: 1 }
  .resource-header{ flex-direction: row; align-items: center }
}

@media (max-width: 480px) {
  .page-title{ font-size: 1.25rem }
  .scrollable-list{ padding: .75rem .5rem }
  .card-header{ padding: .75rem }
  .recurso-nome{ font-size: 1rem }
  .btn-sm{ padding: .375rem .5rem; font-size: .75rem }
  .status-badge{ font-size: .75rem; padding: .25rem .5rem }
  .card-content{ padding: 1rem }
  .horarios-list{ padding: .5rem }
  .horario-item{ padding: .625rem }
  .horario-date{ font-size: .8125rem }
  .horario-time{ font-size: .75rem }
}
</style>