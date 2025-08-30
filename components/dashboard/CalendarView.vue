<template>
  <div class="calendar-container">
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const props = defineProps({
  resourceId: {
    type: Number,
    default: null
  }
});

const emit = defineEmits(['date-clicked']);
const config = useRuntimeConfig();

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek'
  },
  events: [],
  locale: 'pt-br',
  buttonText: { today: 'Hoje', month: 'Mês', week: 'Semana' },
  eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: false },
  height: '100%',
  dayMaxEvents: true,
  
  dateClick: (info) => {
    const eventsOnDay = calendarOptions.value.events.filter(event => 
      new Date(event.start).toDateString() === info.date.toDateString()
    );
    if (eventsOnDay.length > 0) {
      emit('date-clicked', { date: info.date, events: eventsOnDay });
    }
  },

  dayCellDidMount: (arg) => {
    const hasEvents = calendarOptions.value.events.some(event => 
      new Date(event.start).toDateString() === arg.date.toDateString()
    );
    if (hasEvents) {
      arg.el.classList.add('fc-day-has-events');
    }
  }
});

const fetchCalendarData = async () => {
  let url = `${config.public.apiUrl}/api/dashboard/calendar/`;
  if (props.resourceId) {
    url = `${config.public.apiUrl}/api/admin/recursos/${props.resourceId}/agendamentos/`;
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Falha ao carregar dados do calendário.');
    const data = await response.json();
    
    calendarOptions.value.events = data.map(agendamento => ({
      id: agendamento.id_agendamento,
      title: agendamento.finalidade || 'Agendamento', // <-- ALTERADO para usar a finalidade
      start: `${agendamento.data_inicio}T${agendamento.hora_inicio}`,
      end: `${agendamento.data_fim}T${agendamento.hora_fim}`,
      extendedProps: {
        finalidade: agendamento.finalidade,
        recurso: agendamento.recurso
      }
    }));
  } catch (error) {
    console.error("Erro ao buscar dados do calendário:", error);
  }
};

watch(() => props.resourceId, fetchCalendarData, { immediate: true });
</script>

<style>
.calendar-container { height: 100%; display: flex; flex-direction: column; }
.fc { flex-grow: 1; min-height: 0; }
.fc .fc-button-primary { background-color: #4f46e5; border-color: #4f46e5; }
.fc .fc-button-primary:hover { background-color: #4338ca; }
.fc-day-has-events .fc-daygrid-day-frame { background-color: #f7f7f9; cursor: pointer; transition: background-color 0.2s; }
.fc-day-has-events:hover .fc-daygrid-day-frame { background-color: #eff1f3; }
.fc-event-title { white-space: normal !important; word-wrap: break-word !important; }
.fc-event { cursor: pointer; font-size: 0.8em; }
</style>