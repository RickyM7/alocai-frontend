<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="progress-bar">
          <Icon name="heroicons:calendar-days-20-solid" class="icon-active"/>
          <div class="line"></div>
          <Icon name="heroicons:information-circle" class="icon-inactive"/>
          <div class="line"></div>
          <Icon name="heroicons:check-circle" class="icon-inactive"/>
        </div>
        <h1 class="title">Agendar para:</h1>
        <div class="opcoes">
          <label class="radio-label">
            <input type="radio" value="Data" v-model="store.tipoAgendamento" />
            Datas Específicas
          </label>
          <label class="radio-label">
            <input type="radio" value="Período Recorrente" v-model="store.tipoAgendamento" />
            Período Recorrente
          </label>
        </div>
      </div>

      <div class="card-content">
        <div v-if="store.tipoAgendamento === 'Data'" class="content-grid">
          <div class="col-calendar">
            <div v-if="isLoading" class="loading-calendar">
              <p>Carregando calendário...</p>
            </div>
            <template v-else>
              <button type="button" class="btn-open-calendar" @click="isCalendarOpen = true">
                <Icon name="heroicons:calendar-days-20-solid" />
                <span>{{ store.datasSelecionadas.length > 0 ? `Datas Selecionadas (${store.datasSelecionadas.length})` : 'Selecionar Datas' }}</span>
              </button>

              <div class="datepicker-wrapper-desktop">
                <CustomDateSelector 
                  v-model="store.datasSelecionadas"
                  :horarios-ocupados="store.horariosOcupados"
                  :key="calendarKey"
                />
              </div>

              <div v-if="isCalendarOpen" class="calendar-modal-overlay" @click="isCalendarOpen = false">
                <div class="calendar-modal-content" @click.stop>
                  <div class="calendar-modal-header">
                    <h2>Selecione as Datas</h2>
                    <button @click="isCalendarOpen = false" class="btn-close-modal">
                      <Icon name="i-lucide-x" />
                    </button>
                  </div>
                  <div class="calendar-modal-body">
                    <CustomDateSelector 
                      v-model="store.datasSelecionadas" 
                      :horarios-ocupados="store.horariosOcupados"
                      :key="calendarKey"
                    />
                  </div>
                  <div class="calendar-modal-footer">
                    <button class="btn-confirm" @click="isCalendarOpen = false">Confirmar</button>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="col-dates" v-if="store.datasSelecionadas.length">
            <h4 class="section-title">Datas Selecionadas</h4>
            <div class="dates-list">
              <div v-for="(data, index) in store.horariosMultiplos" :key="data.data" class="date-item">
                <span class="date-label">{{ formatarData(new Date(data.data + 'T00:00:00')) }}</span>
                <div v-if="store.horarioMode === 'diferente'" class="slots-container">
                  <div v-for="(slot, sIdx) in data.slots" :key="slot.id" class="time-inputs">
                    <input type="time" v-model="slot.inicio" :min="minInicio(data.data)" @input="handleSlotStartChange(index, sIdx)" class="time-field"/>
                    <span class="time-separator">até</span>
                    <input type="time" v-model="slot.fim" :min="slot.minFim" @input="handleSlotEndChange(index, sIdx)" class="time-field"/>
                    <button type="button" class="btn-remove" @click="store.removerSlot(index, sIdx)">×</button>
                  </div>
                  <button type="button" class="btn-add" @click="store.adicionarSlot(index)">+ Horário</button>
                </div>
              </div>
            </div>
          </div>

          <div class="col-times">
            <div class="time-mode">
              <label class="radio-label-sm">
                <input type="radio" value="mesmo" v-model="store.horarioMode" />
                Mesmo horário
              </label>
              <label class="radio-label-sm">
                <input type="radio" value="diferente" v-model="store.horarioMode" />
                Horários diferentes
              </label>
            </div>

            <div v-if="store.horarioMode === 'mesmo' && store.datasSelecionadas.length" class="same-time-section">
              <h4 class="section-title">Horário Único</h4>
              <div class="time-inputs">
                <input type="time" v-model="store.horarioUnico.inicio" :min="minInicioParaMesmo" @input="handleUnicoStartChange" class="time-field"/>
                <span class="time-separator">até</span>
                <input type="time" v-model="store.horarioUnico.fim" :min="store.horarioUnico.minFim" @input="handleUnicoEndChange" class="time-field"/>
              </div>
            </div>
          </div>
        </div>
       
        <div v-if="store.tipoAgendamento === 'Período Recorrente'" class="content-grid">
          <div class="col-calendar">
            <div class="recurrent-config">
              <div class="field-group">
                 <label class="section-label">Período</label>
                 <button type="button" class="btn-open-calendar-recurrent" @click="openRecurrentModal">
                    <Icon
                      name="heroicons:calendar-days-20-solid"
                      class="recurrent-icon"
                      :class="{ selected: isPeriodSelected }"
                    />
                   <span class="recurrent-text">{{ recurrentPeriodText }}</span>
                 </button>
              </div>
              <div class="weekdays-section">
                <label class="section-label">Dias da Semana</label>
                <div class="weekdays-grid">
                  <label v-for="(dia, index) in diasSemana" :key="index" class="weekday-item">
                    <input type="checkbox" :value="index" v-model="store.diasSemanaSelecionados"/>
                    <span>{{ dia.substring(0, 3) }}</span>
                  </label>
                </div>
              </div>
            </div>
             <div v-if="isRecurrentCalendarOpen" class="calendar-modal-overlay" @click="closeRecurrentModal(false)">
               <div class="calendar-modal-content" @click.stop>
                 <div class="calendar-modal-header">
                   <h2>Selecione o Período</h2>
                   <button @click="closeRecurrentModal(false)" class="btn-close-modal"><Icon name="i-lucide-x" /></button>
                 </div>
                 <div class="calendar-modal-body">
                   <CustomDateSelector
                     v-model="tempRecurrentRange"
                     :horarios-ocupados="store.horariosOcupados"
                     range
                   />
                 </div>
                 <div class="calendar-modal-footer">
                   <button class="btn-confirm" @click="closeRecurrentModal(true)">Confirmar</button>
                 </div>
               </div>
             </div>
          </div>

          <div class="col-dates" v-if="store.datasRecorrentes.length">
            <h4 class="section-title">Ocorrências ({{ store.datasRecorrentes.length }})</h4>
            <div class="dates-list">
              <div v-for="d in store.datasRecorrentes" :key="d.toISOString()" class="date-item-simple">
                {{ formatarData(d) }}
              </div>
            </div>
          </div>

          <div class="col-times">
            <div class="time-mode">
              <label class="radio-label-sm">
                <input type="radio" value="mesmo" v-model="store.horarioModeRecorrente"/>
                Mesmo horário
              </label>
              <label class="radio-label-sm">
                <input type="radio" value="diferente" v-model="store.horarioModeRecorrente"/>
                Horários diferentes
              </label>
            </div>

            <div v-if="store.horarioModeRecorrente === 'mesmo'" class="same-time-section">
              <h4 class="section-title">Horário Único</h4>
              <div class="time-inputs">
                <input type="time" v-model="store.horarioRecorrente.inicio" :min="minInicioRecorrente" @input="handleRecorrenteStartChange" class="time-field"/>
                <span class="time-separator">até</span>
                <input type="time" v-model="store.horarioRecorrente.fim" :min="store.horarioRecorrente.minFim" @input="handleRecorrenteEndChange" class="time-field"/>
              </div>
            </div>

            <div v-if="store.horarioModeRecorrente === 'diferente'" class="different-times-section">
              <h4 class="section-title">Horários</h4>
              <div class="slots-container">
                <div v-for="(slot, idx) in store.recorrenteSlots" :key="slot.id" class="time-inputs">
                  <input type="time" v-model="slot.inicio" :min="minInicioRecorrente" @input="handleRecorrenteSlotStartChange(idx)" class="time-field"/>
                  <span class="time-separator">até</span>
                  <input type="time" v-model="slot.fim" :min="slot.minFim" @input="handleRecorrenteSlotEndChange(idx)" class="time-field"/>
                  <button type="button" class="btn-remove" @click="store.removerRecorrenteSlot(idx)">X</button>
                </div>
                <button type="button" class="btn-add" @click="store.adicionarRecorrenteSlot">+ Horário</button>
              </div>
            </div>
          </div>
        </div>
      </div>
     
      <div class="card-footer">
        <button class="btn-continue" @click="irParaInfo">Prosseguir</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useAgendamentoStore } from '~/stores/agendamento';
import { useRouter } from 'vue-router';
import CustomDateSelector from '~/components/CustomDateSelector.vue';

const router = useRouter();
const store = useAgendamentoStore();
const isCalendarOpen = ref(false);
const calendarKey = ref(0);
const isLoading = ref(true);

const isRecurrentCalendarOpen = ref(false);
const tempRecurrentRange = ref([]);

const isPeriodSelected = computed(() => !!(store.dataInicioRecorrente && store.dataFimRecorrente));

const recurrentPeriodText = computed(() => {
  if (store.dataInicioRecorrente && store.dataFimRecorrente) {
    const formatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const start = new Date(store.dataInicioRecorrente + 'T00:00:00').toLocaleDateString('pt-BR', formatOptions);
    const end = new Date(store.dataFimRecorrente + 'T00:00:00').toLocaleDateString('pt-BR', formatOptions);
    return `De ${start} a ${end}`;
  }
  return 'Selecionar Período';
});

function openRecurrentModal() {
  tempRecurrentRange.value = (store.dataInicioRecorrente && store.dataFimRecorrente)
    ? [new Date(store.dataInicioRecorrente + 'T00:00:00'), new Date(store.dataFimRecorrente + 'T00:00:00')]
    : [];
  isRecurrentCalendarOpen.value = true;
}

function closeRecurrentModal(shouldConfirm) {
  if (shouldConfirm && tempRecurrentRange.value.length === 2) {
    const [start, end] = tempRecurrentRange.value;
    store.dataInicioRecorrente = formatDateToLocal(start);
    store.dataFimRecorrente = formatDateToLocal(end);
  }
  isRecurrentCalendarOpen.value = false;
}

const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const safeNewDate = (date) => (typeof date === 'string' ? new Date(date) : date);

const formatDateToLocal = (date) => {
  const d = safeNewDate(date);
  if (!d || isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const horaAgora = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const hojeStr = formatDateToLocal(new Date());

const minInicioParaMesmo = computed(() => {
  if (!store.datasSelecionadas || store.datasSelecionadas.length === 0) return '';
  const hasToday = store.datasSelecionadas.some(d => formatDateToLocal(safeNewDate(d)) === hojeStr);
  return hasToday ? horaAgora() : '';
});

const incluiHojeNaRecorrencia = computed(() => {
  if (!store.dataInicioRecorrente || !store.dataFimRecorrente || store.diasSemanaSelecionados.length === 0) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(store.dataInicioRecorrente + 'T00:00:00');
  const fim = new Date(store.dataFimRecorrente + 'T00:00:00');
  if (hoje < inicio || hoje > fim) return false;
  return store.diasSemanaSelecionados.includes(hoje.getDay());
});

const minInicioRecorrente = computed(() => incluiHojeNaRecorrencia.value ? horaAgora() : '');
const minInicio = (dateStr) => (dateStr === hojeStr ? horaAgora() : '');

watch(() => store.datasSelecionadas, () => store.syncHorariosMultiplos(), { deep: true });
watch([() => store.dataInicioRecorrente, () => store.dataFimRecorrente, () => store.diasSemanaSelecionados], () => {
  if (store.recorrenteSlots.length === 0) store.adicionarRecorrenteSlot();
});

const handleStartTimeChange = (horarioRef) => {
  if (!horarioRef.inicio) {
    horarioRef.minFim = ''; horarioRef.fim = ''; return;
  }
  const [h, m] = horarioRef.inicio.split(':');
  const data = new Date();
  data.setHours(parseInt(h), parseInt(m), 0, 0);
  data.setMinutes(data.getMinutes() + 1);
  const minFim = data.toTimeString().slice(0, 5);
  horarioRef.minFim = minFim;
  if (!horarioRef.fim || horarioRef.fim <= horarioRef.inicio) {
    horarioRef.fim = minFim;
  }
};

const handleUnicoStartChange = () => {
  handleStartTimeChange(store.horarioUnico);
  if (store.horarioUnico.inicio && store.datasSelecionadas.length > 0) {
    const validacao = store.validarHorarioUnico();
    if (validacao.conflito) {
      alert(validacao.mensagem);
      store.horarioUnico.inicio = ''; store.horarioUnico.fim = ''; store.horarioUnico.minFim = '';
    }
  }
};

const handleUnicoEndChange = () => {
  if (store.horarioUnico.fim && store.datasSelecionadas.length > 0) {
    const validacao = store.validarHorarioUnico();
    if (validacao.conflito) {
      alert(validacao.mensagem);
      store.horarioUnico.fim = store.horarioUnico.minFim || '';
    }
  }
};

const handleSlotStartChange = (dateIndex, slotIndex) => {
  const slot = store.horariosMultiplos[dateIndex].slots[slotIndex];
  handleStartTimeChange(slot);
  if (slot.inicio) {
    const validacao = store.validarSlotMultiplo(dateIndex, slotIndex);
    if (validacao.conflito) {
      alert(validacao.mensagem);
      slot.inicio = ''; slot.fim = ''; slot.minFim = '';
    }
  }
};

const handleSlotEndChange = (dateIndex, slotIndex) => {
  const slot = store.horariosMultiplos[dateIndex].slots[slotIndex];
  if (slot.fim) {
    const validacao = store.validarSlotMultiplo(dateIndex, slotIndex);
    if (validacao.conflito) {
      alert(validacao.mensagem);
      slot.fim = slot.minFim || '';
    }
  }
};

const handleRecorrenteStartChange = () => {
  handleStartTimeChange(store.horarioRecorrente);
  if (store.horarioRecorrente.inicio && store.datasRecorrentes.length > 0) {
    const validacao = store.validarHorarioRecorrente();
    if (validacao.conflito) {
      alert(validacao.mensagem);
      store.horarioRecorrente.inicio = ''; store.horarioRecorrente.fim = ''; store.horarioRecorrente.minFim = '';
    }
  }
};

const handleRecorrenteEndChange = () => {
  if (store.horarioRecorrente.fim && store.datasRecorrentes.length > 0) {
    const validacao = store.validarHorarioRecorrente();
    if (validacao.conflito) {
      alert(validacao.mensagem);
      store.horarioRecorrente.fim = store.horarioRecorrente.minFim || '';
    }
  }
};

const handleRecorrenteSlotStartChange = (slotIndex) => {
  const slot = store.recorrenteSlots[slotIndex];
  handleStartTimeChange(slot);
  if (slot.inicio && store.datasRecorrentes.length > 0) {
    const validacao = store.validarSlotRecorrente(slotIndex);
    if (validacao.conflito) {
      alert(validacao.mensagem);
      slot.inicio = ''; slot.fim = ''; slot.minFim = '';
    }
  }
};

const handleRecorrenteSlotEndChange = (slotIndex) => {
  const slot = store.recorrenteSlots[slotIndex];
  if (slot.fim && store.datasRecorrentes.length > 0) {
    const validacao = store.validarSlotRecorrente(slotIndex);
    if (validacao.conflito) {
      alert(validacao.mensagem);
      slot.fim = slot.minFim || '';
    }
  }
};

function formatarData(data) {
  return safeNewDate(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function validarCampos() {
  store.compilarAgendamentosParaSalvar();
  const agendamentos = store.agendamentos;
  if (agendamentos.length === 0) {
    alert('Nenhuma data válida foi selecionada ou gerada para o agendamento.');
    return false;
  }
  for (let i = 0; i < agendamentos.length; i++) {
    const ag = agendamentos[i];
    if (!ag.hora_inicio || !ag.hora_fim) {
      alert(`Por favor, preencha todos os horários para a data ${formatarData(new Date(ag.data + 'T00:00:00'))}.`);
      return false;
    }
    if (ag.hora_fim <= ag.hora_inicio) {
      alert(`Na data ${formatarData(new Date(ag.data + 'T00:00:00'))}, o horário de término deve ser maior que o de início.`);
      return false;
    }
    if (ag.data === hojeStr && ag.hora_inicio < horaAgora()) {
      alert(`Na data de hoje, não é possível agendar um horário que já passou.`);
      return false;
    }
  }
  return true;
}

async function irParaInfo() {
  if (validarCampos()) {
    router.push('/agendamentoInfo');
  }
}

onMounted(async () => {
  if (!store.recursoSelecionado) {
    alert("Nenhum recurso selecionado. Redirecionando...");
    router.push('/agendamentoSelectRecurso');
    return;
  }
  try {
    const hoje = new Date();
    await store.fetchDisponibilidade(hoje.getFullYear(), hoje.getMonth() + 1);
    calendarKey.value++;
  } catch (error) {
    console.error("Falha ao carregar dados de disponibilidade:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
  .page-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box; background: transparent; }
  .card { width: 100%; max-width: 75rem; background-color: #fff; border-radius: 0.75rem; box-shadow: 0 0.625rem 1.875rem rgba(0,0,0,0.1); display: flex; flex-direction: column; height: 90vh; max-height: 50rem; }
  .card-header { padding: 1.5rem 2rem; border-bottom: 0.063rem solid #e5e7eb; flex-shrink: 0; }
  .card-content { flex-grow: 1; display: flex; flex-direction: column; min-height: 0; padding: 1.5rem 2rem; }
  .card-footer { padding: 1rem 2rem; border-top: 0.063rem solid #e5e7eb; text-align: right; flex-shrink: 0; background-color: #fff; box-shadow: 0 -0.125rem 0.5rem rgba(0,0,0,0.05); }
  .progress-bar { display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
  .icon-active { font-size: 1.5rem; color: #2563eb; }
  .icon-inactive { font-size: 1.5rem; color: #d1d5db; }
  .line { flex-grow: 1; height: 0.125rem; background-color: #e5e7eb; margin: 0 1rem; }
  .title { font-size: 1.75rem; font-weight: 700; text-align: center; margin: 0 0 1rem; }
  .section-title { font-size: 1rem; font-weight: 600; margin: 0 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb; }
  .section-label { display: block; margin-bottom: 0.75rem; font-weight: 600; font-size: 0.9rem; }
  .opcoes { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; }
  .radio-label, .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; }
  .radio-label-sm { font-size: 0.9rem; }
  .field-group { flex: 1; }
  .content-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem; height: 100%; align-items: stretch; }
  .col-calendar, .col-dates, .col-times { min-width: 0; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
  .col-calendar { flex: 1; min-height: 0; }
  .loading-calendar { display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280; }
  .datepicker-wrapper-desktop { flex: 1; display: flex; flex-direction: column; min-height: 0; height: 100%; overflow: hidden; }
  .dates-list { flex-grow: 1; overflow-y: auto; border: 1px solid #f3f4f6; border-radius: 0.5rem; background: #f9fafb; }
  .date-item { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
  .date-item:last-child { border-bottom: none; }
  .date-item-simple { padding: 0.5rem 0.75rem; border-bottom: 1px dashed #e5e7eb; font-size: 0.9rem; }
  .date-item-simple:last-child { border-bottom: none; }
  .date-label { font-weight: 600; color: #374151; font-size: 0.9rem; display: block; margin-bottom: 0.5rem; }
  .time-mode { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .same-time-section, .different-times-section { border: 1px solid #f3f4f6; border-radius: 0.5rem; padding: 1rem; background: #f9fafb; }
  .time-inputs { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
  .time-field { border: 0.063rem solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem; font-size: 0.9rem; min-width: 0; flex: 1; }
  .time-separator { background: #eef2ff; color: #4338ca; border-radius: 9999px; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 700; line-height: 1; white-space: nowrap; }
  .slots-container { display: flex; flex-direction: column; gap: 0.5rem; max-height: 15rem; overflow-y: auto; }
  .recurrent-config { display: flex; flex-direction: column; gap: 1.5rem; }
  .weekdays-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 0.5rem; }
  .weekday-item { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; cursor: pointer; font-size: 0.8rem; text-align: center; }
  .weekday-item:has(input:checked) { background: #eef2ff; border-color: #4338ca; }
  .weekday-item input { margin: 0; }
  .btn-add { background: #10b981; color: #fff; border: none; border-radius: 0.375rem; padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.85rem; align-self: flex-start; }
  .btn-remove { background: #ef4444; color: #fff; border: none; border-radius: 0.375rem; padding: 0.25rem 0.5rem; cursor: pointer; font-size: 0.8rem; min-width: auto; }
  .btn-continue { background-color: #374151; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 500; font-size: 0.8rem; }
  .btn-open-calendar { display: none; }
  .btn-open-calendar-recurrent { display: flex; align-items: center; justify-content: flex-start; gap: 0.75rem; width: 100%; padding: 0.75rem 1rem; font-size: 1rem; font-weight: 500; color: #374151; border: 1px solid #e5e7eb; border-radius: 0.5rem; background-color: #fff; cursor: pointer; text-align: left; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: box-shadow 0.2s, border-color 0.2s; }
  .btn-open-calendar-recurrent:hover { border-color: #d1d5db; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1); }
  .btn-open-calendar-recurrent .recurrent-icon { color: #9ca3af; transition: color 0.2s ease-in-out; font-size: 1.25rem; flex-shrink: 0; }
  .btn-open-calendar-recurrent .recurrent-icon.selected { color: #2563eb; }
  .btn-open-calendar-recurrent .recurrent-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; font-size: 1rem; }
  .calendar-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .calendar-modal-content { background: white; border-radius: 0.75rem; width: 100%; height: 90%; max-width: 500px; max-height: 600px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; }
  .calendar-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
  .calendar-modal-header h2 { font-size: 1.25rem; margin: 0; }
  .btn-close-modal { background: none; border: none; cursor: pointer; padding: 0.5rem; line-height: 1; font-size: 1.5rem; color: #6b7280; }
  .calendar-modal-body { padding: 1rem; flex-grow: 1; min-height: 0; }
  .calendar-modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; text-align: right; flex-shrink: 0; }
  .btn-confirm { background-color: #374151; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; border: none; cursor: pointer; }

  @media (max-width: 1920px) {
    .btn-open-calendar-recurrent .recurrent-text { font-size: 0.93rem; }
  }

  @media (max-width: 1024px) {
    .content-grid { grid-template-columns: 1fr; gap: 1.5rem; }
    .col-calendar { order: 1; }
    .col-times { order: 2; }
    .col-dates { order: 3; }
    .card { max-width: none; width: 95%; }
  }

  @media (max-width: 768px) {
    .page-container { padding: 0; }
    .card { margin: 0; border-radius: 0; height: calc(100vh - 64px); box-shadow: none; max-width: none; width: 100%; }
    .card-header { padding: 16px; position: sticky; top: 0; z-index: 10; background-color: #fff; }
    .card-content { padding: 16px; flex-grow: 1; overflow-y: auto; }
    .card-footer { padding: 16px; position: sticky; bottom: 0; z-index: 10; }
    .content-grid { grid-template-columns: 1fr; gap: 24px; height: auto; }
    .col-calendar, .col-dates, .col-times { height: auto; }
    .opcoes { flex-direction: column; gap: 12px; align-items: stretch; }
    .radio-label, .checkbox-label { justify-content: center; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
    .time-mode { flex-direction: column; gap: 16px; }
    .weekdays-grid { grid-template-columns: repeat(4,1fr); gap: 12px; }
    .dates-list { max-height: 320px; }
    .slots-container { max-height: 200px; }
    .datepicker-wrapper-desktop { display: none; }
    .btn-open-calendar { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 12px 16px; font-size: 16px; font-weight: 500; border: 1px solid #d1d5db; border-radius: 8px; background-color: #f9fafb; cursor: pointer; }
    .title { font-size: 24px; }
  }

  @media (max-width: 480px) {
    .title { font-size: 20px; margin-bottom: 12px; }
    .progress-bar { flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .line { display: none; }
    .card-header { padding: 12px; }
    .card-content { padding: 12px; }
    .card-footer { padding: 12px; }
    .content-grid { gap: 16px; }
    .weekdays-grid { grid-template-columns: repeat(3,1fr); gap: 8px; }
    .weekday-item { padding: 6px; font-size: 12px; }
    .btn-continue { width: 100%; padding: 14px 16px; font-size: 16px; }
    .opcoes { gap: 8px; }
    .radio-label, .checkbox-label { padding: 8px; font-size: 14px; }
    .same-time-section, .different-times-section { padding: 12px; }
    .dates-list { max-height: 240px; }
    .slots-container { max-height: 160px; }
    .section-title { font-size: 14px; }
    .time-field { font-size: 14px; padding: 8px; }
    .time-separator { font-size: 11px; padding: 4px 8px; }
    .calendar-modal-body { padding: 0.75rem; }
    .btn-open-calendar-recurrent .recurrent-text { font-size: 1.195rem; }
  }
</style>