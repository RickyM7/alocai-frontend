<template>
  <div class="flow-layout">
    <div class="panel flow-panel" :class="{ 'panel-calendar': viewMode === 'calendar' }">
      <div class="panel-head">
        <div class="head-left">
          <button class="btn-back" @click="goBack">
            <Icon name="i-lucide-arrow-left" />
          </button>
          <h2 :title="selectedResource?.nome_recurso">{{ selectedResource ? selectedResource.nome_recurso : 'Explorar' }}</h2>
        </div>
        <div v-if="!selectedResource" class="tabs">
          <button :class="{ on: viewMode === 'list' }" @click="viewMode = 'list'">Lista</button>
          <button :class="{ on: viewMode === 'calendar' }" @click="viewMode = 'calendar'">Calendário</button>
        </div>
      </div>

      <div v-if="viewMode === 'list'" class="panel-scroll">
        <div v-if="isLoading" class="center-msg"><Icon name="i-lucide-loader-2" class="spin" /> Carregando recursos...</div>
        <div v-else-if="error" class="center-msg err">{{ error }}</div>
        <div v-else-if="recursos.length === 0" class="center-msg">Nenhum recurso encontrado.</div>
        <div v-else class="item-list">
          <div v-for="recurso in recursos" :key="recurso.id_recurso" class="item-card" @click="toggleRecurso(recurso.id_recurso)">
            <div class="item-top">
              <Icon :name="recursoAberto === recurso.id_recurso ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="item-chevron" />
              <div class="item-info" :class="{ 'is-expanded': recursoAberto === recurso.id_recurso }">
                <strong class="truncate-text" :title="recurso.nome_recurso">{{ recurso.nome_recurso }}</strong>
                <span class="item-sub"><Icon name="i-lucide-map-pin" /> {{ recurso.localizacao }}</span>
              </div>
              <div class="item-right">
                <span :class="getStatusClass(recurso.status_recurso)" class="badge-status">{{ formatarStatus(recurso.status_recurso) }}</span>
                <span class="badge-pill">{{ recurso.agendamentos.length }}</span>
                <button class="ibtn gray" @click.stop="showResourceCalendar(recurso)" title="Ver Calendário"><Icon name="i-lucide-calendar-days" /></button>
              </div>
            </div>
            <div v-if="recursoAberto === recurso.id_recurso" class="item-detail">
              <div v-if="recurso.agendamentos.length > 0">
                <div v-for="agendamento in recurso.agendamentos" :key="agendamento.id_agendamento" class="slot">
                  {{ formatarData(agendamento.data_inicio) }} · {{ agendamento.hora_inicio.substring(0, 5) }}–{{ agendamento.hora_fim.substring(0, 5) }}
                </div>
              </div>
              <p v-else style="text-align: center; padding: 0.75rem; color: #9ca3af; font-size: 0.8rem; margin: 0;">Nenhum agendamento aprovado.</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="viewMode === 'calendar'" class="calendar-wrapper">
        <ClientOnly>
          <DashboardCalendarView :resource-id="selectedResource?.id_recurso" @date-clicked="handleDateClick" />
        </ClientOnly>
      </div>
    </div>

    <!-- Modal de dia -->
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-box" @click.stop>
        <div v-if="selectedDayInfo" class="modal-inner">
          <div class="modal-head">
            <h2>{{ selectedDayInfo.date }}</h2>
            <button class="ibtn gray" @click="closeModal"><Icon name="i-lucide-x" /></button>
          </div>
          <div v-if="selectedDayInfo.events && selectedDayInfo.events.length > 1" class="modal-count">
            {{ selectedDayInfo.events.length }} horários reservados
          </div>
          <div class="modal-body">
            <div v-if="selectedDayInfo.events && selectedDayInfo.events.length > 0">
              <div v-for="event in selectedDayInfo.events" :key="event.id" class="modal-event">
                <strong>{{ event.extendedProps.recurso }}</strong>
                <span class="modal-event-fin">{{ event.extendedProps.finalidade }}</span>
                <span class="modal-event-time">{{ formatarHora(event.start) }}–{{ formatarHora(event.end) }}</span>
              </div>
            </div>
            <p v-else class="center-msg" style="padding: 1.5rem;">Nenhum agendamento para esta data.</p>
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

const config = useRuntimeConfig();
const viewMode = ref('list');
const recursos = ref<any[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const recursoAberto = ref<number | null>(null);
const isModalOpen = ref(false);
const selectedDayInfo = ref<{ date: string; events: any[] } | null>(null);
const selectedResource = ref<{id_recurso: number, nome_recurso: string} | null>(null);

const goBack = () => {
  if (selectedResource.value) {
    selectedResource.value = null;
    viewMode.value = 'list';
  } else {
    navigateTo('/');
  }
};

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
  } catch (err: unknown) { 
    error.value = err instanceof Error ? err.message : 'Erro ao carregar dados.'; 
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
/* OVERRIDES do layout global */
.flow-layout { flex-direction: column; height: calc(100dvh - 64px); padding: 1.5rem; min-height: 0; overflow: hidden; }
.flow-panel { max-width: 700px; flex: 1; min-height: 0; height: auto; }
.flow-panel.panel-calendar { max-width: 900px; }
.panel-head { padding: 1rem 1.5rem; }
.head-left { gap: 0.75rem; min-width: 0; flex: 1; }
.head-left h2 { font-size: 1.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.btn-back { padding: 0.5rem; flex-shrink: 0; }
.panel-scroll { min-height: 0; background-color: transparent; }
.calendar-wrapper { flex: 1; overflow: hidden; display: flex; flex-direction: column; min-height: 0; padding: 0.5rem 0.75rem; }

.tabs { display: flex; gap: 0.15rem; background: #f3f4f6; padding: 0.15rem; border-radius: 6px; flex-shrink: 0; }
.tabs button { flex: 1; padding: 0.35rem 0.65rem; border: none; background: transparent; border-radius: 4px; font-weight: 600; font-size: 0.8rem; color: #6b7280; cursor: pointer; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; justify-content: center; gap: 0.3rem; }
.tabs button:hover:not(.on) { color: #374151; }
.tabs button.on { background: #fff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.center-msg { padding: 2.5rem; }
.center-msg.err { color: #ef4444; }

.item-list { padding: 0; }
.item-card { cursor: pointer; border-bottom: 1px solid #f6f7f8; padding: 0.85rem 1.25rem; transition: background 0.1s; }
.item-card:last-child { border-bottom: none; }
.item-card:hover { background: #fafbfc; }
.item-top { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
.item-chevron { color: #9ca3af; font-size: 1.25rem; flex-shrink: 0; }
.item-info { flex: 1; min-width: 0; padding-left: 0.25rem; overflow: hidden; }
.item-info strong { font-size: 0.95rem; color: #111827; }
.item-sub { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: #9ca3af; margin-top: 0.15rem; }
.item-right { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }

.item-info.is-expanded .truncate-text { -webkit-line-clamp: unset; line-clamp: unset; white-space: normal; }

.badge-pill { background: #e5e7eb; color: #374151; padding: 0.1rem 0.45rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
.ibtn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.85rem; transition: all 0.12s; }
.ibtn.gray { background: #f3f4f6; color: #6b7280; }
.ibtn.gray:hover { background: #e5e7eb; color: #374151; }

.badge-status { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: capitalize; white-space: nowrap; }

.item-detail { padding: 0.5rem 0 0 1.5rem; font-size: 0.85rem; color: #374151; animation: fadeIn 0.15s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.slot { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; padding: 0.35rem 0.6rem; background: #f8fafc; border-radius: 6px; margin-bottom: 0.3rem; border: 1px solid #e5e7eb; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-box { background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); width: 90%; max-width: 420px; max-height: 75vh; overflow: hidden; animation: modalIn 0.15s ease-out; }
@keyframes modalIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.modal-inner { display: flex; flex-direction: column; }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid #f3f4f6; }
.modal-head h2 { font-size: 1rem; font-weight: 600; color: #111827; margin: 0; }
.modal-count { text-align: center; padding: 0.5rem 1rem; background: #eff6ff; font-size: 0.8rem; font-weight: 600; color: #1e40af; border-bottom: 1px solid #e0e7ff; }
.modal-body { overflow-y: auto; max-height: 50vh; padding: 1rem 1.25rem; }
.modal-event { border-bottom: 1px solid #f3f4f6; padding-bottom: 0.75rem; margin-bottom: 0.75rem; }
.modal-event:last-child { border-bottom: none; margin-bottom: 0; }
.modal-event strong { display: block; font-size: 0.9rem; color: #111827; margin-bottom: 0.15rem; word-break: break-word; }
.modal-event-fin { display: block; color: #6b7280; font-size: 0.8rem; margin-bottom: 0.25rem; }
.modal-event-time { font-size: 0.8rem; font-weight: 500; color: #111827; }

@media (max-width: 768px) {
  .panel-head { padding: 0.75rem 1rem; }
  .head-left h2 { white-space: normal; overflow: visible; text-overflow: unset; word-break: break-word; }
  .item-card { padding: 0.75rem 1rem; }
}

@media (max-width: 480px) {
  .panel-head { flex-direction: column; gap: 0.5rem; align-items: stretch; }
  .tabs { width: 100%; }
  .tabs button { flex: 1; justify-content: center; }
}
</style>