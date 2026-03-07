<template>
  <div class="flow-layout">
    <div class="panel flow-panel">
      <div class="panel-head">
        <div class="head-left">
          <button @click="$router.push('/')" class="btn-back" aria-label="Voltar">
            <Icon name="i-lucide-arrow-left" />
          </button>
          <h2>Minhas Reservas</h2>
        </div>
        <div class="tabs">
          <button :class="{ on: activeTab === 'em_andamento' }" @click="activeTab = 'em_andamento'">Em Andamento</button>
          <button :class="{ on: activeTab === 'historico' }" @click="activeTab = 'historico'">Histórico</button>
        </div>
      </div>
      <div class="panel-scroll">
        <div v-if="isLoading" class="center-msg"><Icon name="i-lucide-loader-2" class="spin" /> Carregando...</div>
        <div v-else-if="error" class="center-msg err">{{ error }}</div>
        <div v-else-if="!filteredReservas.length" class="center-msg">
          <Icon name="i-lucide-calendar-off" style="font-size: 1.5rem;" />
          Nenhuma reserva aqui.
        </div>
        <div v-else class="item-list">
          <div v-for="grupo in filteredReservas" :key="grupo.id_agendamento_pai" class="item-card" @click="toggleGroup(grupo.id_agendamento_pai)">
            <div class="item-top">
              <Icon :name="isGroupExpanded(grupo.id_agendamento_pai) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="item-chevron" />
              <div class="item-info" :class="{ 'is-expanded': isGroupExpanded(grupo.id_agendamento_pai) }">
                <strong class="truncate-text" :title="grupo.recurso">{{ grupo.recurso }}</strong>
                <span class="item-sub"><Icon name="i-lucide-tag" /> {{ grupo.finalidade || 'Sem finalidade' }}</span>
              </div>
              <div class="item-right">
                <span :class="getStatusClass(grupo.status_geral)" class="badge-status">{{ formatarStatus(grupo.status_geral) }}</span>
                <div class="item-btns" @click.stop>
                  <button v-if="['aprovado', 'parcialmente_aprovado'].includes(grupo.status_geral)" class="ibtn green" @click="marcarGrupoComoConcluido(grupo)" title="Concluir Todos"><Icon name="i-lucide-check-check" /></button>
                  <button v-if="!['cancelado', 'concluido', 'finalizado', 'negado'].includes(grupo.status_geral)" class="ibtn red" @click="cancelarGrupo(grupo)" title="Cancelar Todos"><Icon name="i-lucide-x" /></button>
                </div>
              </div>
            </div>
            <div v-if="isGroupExpanded(grupo.id_agendamento_pai)" class="item-detail">
              <div v-for="reserva in grupo.agendamentos_filhos" :key="reserva.id_agendamento" class="slot flex-slot">
                <span style="flex:1;">{{ formatarData(reserva.data_inicio) }} · {{ reserva.hora_inicio?.substring(0, 5) }}–{{ reserva.hora_fim?.substring(0, 5) }}</span>
                <span :class="getStatusClass(reserva.status_agendamento)" class="badge-status sm">{{ formatarStatus(reserva.status_agendamento) }}</span>
                <div v-if="['aprovado', 'pendente'].includes(reserva.status_agendamento)" class="slot-btns" @click.stop>
                  <button v-if="reserva.status_agendamento === 'aprovado'" class="ibtn green sm" @click="marcarHorarioComoConcluido(reserva)" title="Concluir"><Icon name="i-lucide-check" /></button>
                  <button class="ibtn red sm" @click="cancelarHorario(reserva)" title="Cancelar"><Icon name="i-lucide-x" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="toast">
      <div v-if="actionMessage" :class="['action-toast', actionMessage.type]" @click="actionMessage = null">
        <Icon :name="actionMessage.type === 'error' ? 'i-lucide-alert-circle' : 'i-lucide-check-circle'" />
        <span>{{ actionMessage.text }}</span>
      </div>
    </Transition>

    <ConfirmModal 
      :is-open="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      @confirm="executarConfirmacao"
      @cancel="fecharConfirmacao"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { authenticatedFetch } from '~/utils/api';
import { formatarData, formatarStatus, getStatusClass, calcularStatusGeral } from '~/utils/formatters';
import ConfirmModal from '~/components/ConfirmModal.vue';

definePageMeta({ middleware: 'auth' });

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
const actionMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null);
let actionMessageTimer: ReturnType<typeof setTimeout> | null = null;

const showActionMessage = (text: string, type: 'success' | 'error' = 'error') => {
  if (actionMessageTimer) clearTimeout(actionMessageTimer);
  actionMessage.value = { text, type };
  actionMessageTimer = setTimeout(() => { actionMessage.value = null; }, 5000);
};

const confirmDialog = ref({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  action: null as Function | null
});

const abrirConfirmacao = (title: string, message: string, confirmText: string, action: Function) => {
  confirmDialog.value = { isOpen: true, title, message, confirmText, action };
};

const fecharConfirmacao = () => {
  confirmDialog.value.isOpen = false;
  setTimeout(() => confirmDialog.value.action = null, 200);
};

const executarConfirmacao = () => {
  if (confirmDialog.value.action) confirmDialog.value.action();
  fecharConfirmacao();
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
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erro ao buscar reservas.';
  } finally {
    isLoading.value = false;
  }
};

const marcarGrupoComoConcluido = (grupo: GrupoDeReserva) => {
  abrirConfirmacao(
    'Concluir Horários',
    `Tem certeza que deseja marcar TODOS os horários para "${grupo.recurso}" como concluídos?`,
    'Concluir',
    async () => {
      try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/pai/${grupo.id_agendamento_pai}/status/`, {
          method: 'PUT',
          body: JSON.stringify({ status_agendamento: 'concluido' }),
        });
        if (!response.ok) throw new Error('Falha ao atualizar o status.');
        await fetchReservas();
      } catch (err: unknown) {
        showActionMessage(err instanceof Error ? err.message : 'Erro ao concluir.');
      }
    }
  );
};

const cancelarGrupo = (grupo: GrupoDeReserva) => {
  abrirConfirmacao(
    'Cancelar Agendamentos',
    `Tem certeza que deseja CANCELAR TODOS os horários pendentes e aprovados para "${grupo.recurso}"?`,
    'Cancelar Tudo',
    async () => {
      try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/pai/${grupo.id_agendamento_pai}/status/`, {
          method: 'PUT',
          body: JSON.stringify({ status_agendamento: 'cancelado' }),
        });
        if (!response.ok) throw new Error('Falha ao cancelar os agendamentos.');
        await fetchReservas();
      } catch (err: unknown) {
        showActionMessage(err instanceof Error ? err.message : 'Erro ao cancelar.');
      }
    }
  );
};

const marcarHorarioComoConcluido = async (reserva: ReservaFilho) => {
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/${reserva.id_agendamento}/status/`, {
      method: 'PUT',
      body: JSON.stringify({ status_agendamento: 'concluido' }),
    });
    if (!response.ok) throw new Error('Falha ao atualizar o status do horário.');
    await fetchReservas();
  } catch (err: unknown) {
    showActionMessage(err instanceof Error ? err.message : 'Erro ao concluir horário.');
  }
};

const cancelarHorario = (reserva: ReservaFilho) => {
  abrirConfirmacao(
    'Cancelar Horário',
    `Tem certeza que deseja CANCELAR o agendamento do dia ${formatarData(reserva.data_inicio)}?`,
    'Cancelar',
    async () => {
      try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/${reserva.id_agendamento}/status/`, {
          method: 'PUT',
          body: JSON.stringify({ status_agendamento: 'cancelado' }),
        });
        if (!response.ok) throw new Error('Falha ao cancelar o horário.');
        await fetchReservas();
      } catch (err: unknown) {
        showActionMessage(err instanceof Error ? err.message : 'Erro ao cancelar horário.');
      }
    }
  );
};

onMounted(fetchReservas);
</script>

<style scoped>
/* OVERRIDES do layout global */
.flow-layout { flex-direction: column; height: calc(100dvh - 64px); padding: 1.5rem; min-height: 0; overflow: hidden; }
.flow-panel { max-width: 700px; flex: 1; min-height: 0; height: auto; }
.panel-head { padding: 1rem 1.5rem; }
.head-left { gap: 0.75rem; }
.head-left h2 { font-size: 1.15rem; }
.btn-back { padding: 0.5rem; flex-shrink: 0; }
.panel-scroll { min-height: 0; background-color: transparent; }

.tabs { display: flex; gap: 0.15rem; background: #f3f4f6; padding: 0.15rem; border-radius: 6px; }
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
.item-btns { display: flex; gap: 0.25rem; }

.item-info.is-expanded .truncate-text { -webkit-line-clamp: unset; line-clamp: unset; white-space: normal; }

.ibtn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.85rem; transition: all 0.12s; }
.ibtn.sm { width: 22px; height: 22px; font-size: 0.7rem; }
.ibtn.green { background: #22c55e; color: #fff; }
.ibtn.green:hover { background: #16a34a; }
.ibtn.red { background: #ef4444; color: #fff; }
.ibtn.red:hover { background: #dc2626; }

.badge-status { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: capitalize; white-space: nowrap; }
.badge-status.sm { font-size: 0.65rem; padding: 0.15rem 0.45rem; }

.item-detail { padding: 0.5rem 0 0 1.5rem; font-size: 0.85rem; color: #374151; animation: fadeIn 0.15s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.slot { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; padding: 0.35rem 0.6rem; background: #f8fafc; border-radius: 6px; margin-bottom: 0.3rem; border: 1px solid #e5e7eb; }
.slot.flex-slot { display: flex; align-items: center; justify-content: space-between; }
.slot-btns { display: flex; gap: 0.25rem; margin-left: auto; }

/* Toast */
.action-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); z-index: 1000; display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: 10px; font-size: 0.875rem; font-weight: 500; color: #fff; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 90%; }
.action-toast.error { background: #ef4444; }
.action-toast.success { background: #22c55e; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(1rem); }

@media (max-width: 768px) {
  .panel-head { padding: 0.75rem 1rem; }
  .item-card { padding: 0.75rem 1rem; }
  .slot.flex-slot { flex-wrap: wrap; gap: 0.3rem; }
}

@media (max-width: 480px) {
  .panel-head { flex-direction: column; gap: 0.5rem; align-items: stretch; }
  .tabs { width: 100%; }
  .tabs button { flex: 1; justify-content: center; }
}
</style>