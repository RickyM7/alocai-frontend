<template>
  <div class="flow-layout">
    <div class="panel flow-panel">
      <!-- Header do fluxo -->
      <div class="panel-head">
        <div class="head-left">
          <button @click="$router.push('/agendamentoSelectRecurso')" class="btn-back" aria-label="Voltar">
            <Icon name="i-lucide-arrow-left" />
          </button>
          <div>
            <h2>Datas e Horários</h2>
            <p>Defina o período para o agendamento.</p>
          </div>
        </div>
        <div class="progress-bar">
          <Icon name="heroicons:calendar-days-20-solid" class="icon-active"/>
          <div class="line"></div>
          <Icon name="heroicons:information-circle" class="icon-inactive"/>
          <div class="line"></div>
          <Icon name="heroicons:check-circle" class="icon-inactive"/>
        </div>
      </div>

      <!-- Corpo com scroll -->
      <div class="panel-scroll panel-padding">
        <!-- Seleção de tipo de reserva (passo 0) -->
        <div class="reservation-type-selector">
          <button 
            type="button"
            class="type-card-btn" 
            :class="{ active: store.tipoAgendamento === 'Data' }"
            @click="store.tipoAgendamento = 'Data'">
            <div class="type-icon"><Icon name="i-lucide-calendar" /></div>
            <div class="type-info">
              <span class="type-title">Datas Específicas</span>
              <span class="type-desc">Agendar uma ou mais datas avulsas</span>
            </div>
          </button>
          
          <button 
            type="button"
            class="type-card-btn" 
            :class="{ active: store.tipoAgendamento === 'Período Recorrente' }"
            @click="store.tipoAgendamento = 'Período Recorrente'">
            <div class="type-icon"><Icon name="i-lucide-calendar-range" /></div>
            <div class="type-info">
              <span class="type-title">Período Recorrente</span>
              <span class="type-desc">Agendar um intervalo de dias automático</span>
            </div>
          </button>
        </div>

        <div class="agendamento-content-vertical">
          
          <!-- Fluxo: datas específicas -->
          <template v-if="store.tipoAgendamento === 'Data'">
            
            <!-- Passo 1: Calendário -->
            <div class="step-block">
              <div class="step-header">
                <span class="step-number">1</span>
                <div>
                  <h3 class="step-title">Selecione as Datas</h3>
                  <p class="step-subtitle">Quais dias você deseja usar o recurso?</p>
                </div>
              </div>
              
              <div class="step-body">
                <div v-if="isLoading" class="loading-calendar">
                  <p>Carregando calendário...</p>
                </div>
                <template v-else>
                  <button type="button" class="btn-open-calendar" @click="isCalendarOpen = true">
                    <Icon name="heroicons:calendar-days-20-solid" />
                    <span>{{ store.datasSelecionadas.length > 0 ? (store.datasSelecionadas.length === 1 ? '1 Data Selecionada' : `${store.datasSelecionadas.length} Datas Selecionadas`) : 'Selecionar Datas' }}</span>
                  </button>
                  <!-- Calendário desktop (container largura total) -->
                  <div class="datepicker-wrapper-desktop">
                    <CustomDateSelector 
                      v-model="store.datasSelecionadas"
                      :horarios-ocupados="store.horariosOcupados"
                      :key="calendarKey"
                    />
                  </div>
                  <!-- Modal calendário mobile -->
                  <div v-if="isCalendarOpen" class="calendar-modal-overlay" @click="isCalendarOpen = false">
                    <div class="calendar-modal-content" @click.stop>
                      <div class="calendar-modal-header">
                        <h2>Selecione as Datas</h2>
                        <button @click="isCalendarOpen = false" class="btn-close-modal" aria-label="Fechar calendário"><Icon name="i-lucide-x" /></button>
                      </div>
                      <div class="calendar-modal-body">
                        <CustomDateSelector v-model="store.datasSelecionadas" :horarios-ocupados="store.horariosOcupados" :key="calendarKey"/>
                      </div>
                      <div class="calendar-modal-footer">
                        <button class="btn-confirm" @click="isCalendarOpen = false">Confirmar</button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Passo 2: Horários (só exibe se datas forem selecionadas) -->
            <div class="step-block" v-if="store.datasSelecionadas.length > 0">
              <div class="step-header">
                <span class="step-number">2</span>
                <div>
                  <h3 class="step-title">Defina os Horários</h3>
                  <p class="step-subtitle">Como as datas selecionadas serão utilizadas?</p>
                </div>
              </div>

              <div class="step-body">
                <!-- Seletor de Modo (Largo) -->
                <div class="mode-radios-horizontal">
                  <label class="radio-label-large" :class="{ 'active': store.horarioMode === 'mesmo' }">
                    <input type="radio" value="mesmo" v-model="store.horarioMode" /> 
                    <div>
                      <span class="radio-title">Mesmo Horário</span>
                      <span class="radio-desc">Aplicar para todos os dias</span>
                    </div>
                  </label>
                  <label class="radio-label-large" :class="{ 'active': store.horarioMode === 'diferente' }">
                    <input type="radio" value="diferente" v-model="store.horarioMode" /> 
                    <div>
                      <span class="radio-title">Horários Diferentes</span>
                      <span class="radio-desc">Personalizar dia a dia</span>
                    </div>
                  </label>
                </div>

                <!-- Input "Mesmo Horário" (Uma caixa gigante) -->
                <div v-if="store.horarioMode === 'mesmo'" class="time-config-card">
                  <p class="helper-text-bold">Horário Único ({{ store.datasSelecionadas.length }} {{ store.datasSelecionadas.length === 1 ? 'data agendada' : 'datas agendadas' }})</p>
                  <div class="time-inputs-massive">
                    <div class="input-block-massive">
                      <label>Início</label>
                      <input type="time" v-model="store.horarioUnico.inicio" :min="minInicioParaMesmo" @input="handleUnicoStartChange" class="time-field-massive"/>
                    </div>
                    <span class="time-separator-massive"><Icon name="i-lucide-arrow-right" /></span>
                    <div class="input-block-massive">
                      <label>Fim</label>
                      <input type="time" v-model="store.horarioUnico.fim" :min="store.horarioUnico.minFim" @input="handleUnicoEndChange" class="time-field-massive"/>
                    </div>
                  </div>
                </div>

                <!-- Input "Horários Diferentes" (Múltiplas caixas gigantes) -->
                <div v-if="store.horarioMode === 'diferente'" class="different-times-list">
                  <div v-for="(data, index) in store.horariosMultiplos" :key="data.data" class="time-config-card-nested">
                    <div class="card-nested-header">
                      <div class="nested-date">
                        <Icon name="i-lucide-calendar" />
                        <span>{{ formatarData(new Date(data.data + 'T00:00:00')) }}</span>
                      </div>
                      <button type="button" class="btn-add-session" @click="store.adicionarSlot(index)"><Icon name="i-lucide-plus" /> Sessão Adicional</button>
                    </div>
                    
                    <div class="nested-body">
                      <div v-for="(slot, sIdx) in data.slots" :key="slot.id" class="time-inputs-row">
                        <div class="time-field-wrapper">
                          <label>Início</label>
                          <input type="time" v-model="slot.inicio" :min="minInicio(data.data)" @input="handleSlotStartChange(index, sIdx)" class="time-input"/>
                        </div>
                        <span class="row-separator"><Icon name="i-lucide-minus" /></span>
                        <div class="time-field-wrapper">
                          <label>Fim</label>
                          <input type="time" v-model="slot.fim" :min="slot.minFim" @input="handleSlotEndChange(index, sIdx)" class="time-input"/>
                        </div>
                        <button type="button" class="btn-remove-session" @click="store.removerSlot(index, sIdx)" aria-label="Remover sessão"><Icon name="i-lucide-trash" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </template>

          <!-- Fluxo: período recorrente -->
          <template v-if="store.tipoAgendamento === 'Período Recorrente'">
            
            <!-- Passo 1: Configurar período -->
            <div class="step-block">
              <div class="step-header">
                <span class="step-number">1</span>
                <div>
                  <h3 class="step-title">Configure a Ocorrência</h3>
                  <p class="step-subtitle">Determine a faixa de dias em que o agendamento se repete.</p>
                </div>
              </div>

              <div class="step-body">
                <div class="field-group-recurrent">
                  <label class="section-label-bold">Intervalo de Meses/Dias</label>
                  <button type="button" class="btn-open-calendar-recurrent-large" @click="openRecurrentModal">
                    <Icon name="heroicons:calendar-days-20-solid" class="recurrent-icon" :class="{ selected: isPeriodSelected }" />
                    <span class="recurrent-text">{{ recurrentPeriodText }}</span>
                  </button>
                </div>
                
                <div class="weekdays-section-large" style="margin-top: 1.5rem;">
                  <label class="section-label-bold">Dias Úteis Afetados</label>
                  <div class="weekdays-grid-large">
                    <label v-for="(dia, index) in diasSemana" :key="index" class="weekday-item-large" :class="{'active-day': store.diasSemanaSelecionados.includes(index)}">
                      <input type="checkbox" :value="index" v-model="store.diasSemanaSelecionados"/>
                      <span>{{ dia }}</span>
                    </label>
                  </div>
                </div>

                <div v-if="isRecurrentCalendarOpen" class="calendar-modal-overlay" @click="closeRecurrentModal(false)">
                  <div class="calendar-modal-content" @click.stop>
                    <div class="calendar-modal-header">
                      <h2>Selecione o Período</h2>
                      <button @click="closeRecurrentModal(false)" class="btn-close-modal" aria-label="Fechar calendário"><Icon name="i-lucide-x" /></button>
                    </div>
                    <div class="calendar-modal-body">
                      <CustomDateSelector v-model="tempRecurrentRange" :horarios-ocupados="store.horariosOcupados" range />
                    </div>
                    <div class="calendar-modal-footer">
                      <button class="btn-confirm" @click="closeRecurrentModal(true)">Confirmar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Passo 2: Horários da recorrência -->
            <div class="step-block" v-if="store.datasRecorrentes.length > 0">
              <div class="step-header">
                <span class="step-number">2</span>
                <div>
                  <h3 class="step-title">Horários da Recorrência</h3>
                  <p class="step-subtitle">{{ store.datasRecorrentes.length }} {{ store.datasRecorrentes.length === 1 ? 'ocorrência válida identificada' : 'ocorrências válidas identificadas' }}.</p>
                </div>
              </div>

              <div class="step-body">
                <!-- Seletor de Modo (Largo) -->
                <div class="mode-radios-horizontal">
                  <label class="radio-label-large" :class="{ 'active': store.horarioModeRecorrente === 'mesmo' }">
                    <input type="radio" value="mesmo" v-model="store.horarioModeRecorrente"/>
                    <div>
                      <span class="radio-title">Mesmo Horário</span>
                      <span class="radio-desc">Agendar todas as {{ store.datasRecorrentes.length }} ocorrências juntas</span>
                    </div>
                  </label>
                  <label class="radio-label-large" :class="{ 'active': store.horarioModeRecorrente === 'diferente' }">
                    <input type="radio" value="diferente" v-model="store.horarioModeRecorrente"/>
                    <div>
                      <span class="radio-title">Múltiplos Turnos</span>
                      <span class="radio-desc">Adicionar sessões Extras (Manhã e Tarde)</span>
                    </div>
                  </label>
                </div>

                <!-- Input Único -->
                <div v-if="store.horarioModeRecorrente === 'mesmo'" class="time-config-card">
                  <p class="helper-text-bold">Regra GERAL de Horário</p>
                  <div class="time-inputs-massive">
                    <div class="input-block-massive">
                      <label>Início</label>
                      <input type="time" v-model="store.horarioRecorrente.inicio" :min="minInicioRecorrente" @input="handleRecorrenteStartChange" class="time-field-massive"/>
                    </div>
                    <span class="time-separator-massive"><Icon name="i-lucide-arrow-right" /></span>
                    <div class="input-block-massive">
                      <label>Fim</label>
                      <input type="time" v-model="store.horarioRecorrente.fim" :min="store.horarioRecorrente.minFim" @input="handleRecorrenteEndChange" class="time-field-massive"/>
                    </div>
                  </div>
                </div>

                <!-- Múltiplos Turnos (Diferentes) -->
                <div v-if="store.horarioModeRecorrente === 'diferente'" class="different-times-list">
                  <p class="helper-text-bold" style="margin-bottom: 1rem;">Turnos Aplicados em Lote</p>
                  <div class="time-config-card-nested" style="padding: 1.5rem;">
                    <div class="nested-body">
                      <div v-for="(slot, idx) in store.recorrenteSlots" :key="slot.id" class="time-inputs-row">
                        <div class="time-field-wrapper">
                          <label>Início do Turno</label>
                          <input type="time" v-model="slot.inicio" :min="minInicioRecorrente" @input="handleRecorrenteSlotStartChange(idx)" class="time-input"/>
                        </div>
                        <span class="row-separator"><Icon name="i-lucide-minus" /></span>
                        <div class="time-field-wrapper">
                          <label>Fim do Turno</label>
                          <input type="time" v-model="slot.fim" :min="slot.minFim" @input="handleRecorrenteSlotEndChange(idx)" class="time-input"/>
                        </div>
                        <button type="button" class="btn-remove-session" @click="store.removerRecorrenteSlot(idx)" aria-label="Remover turno"><Icon name="i-lucide-trash" /></button>
                      </div>
                      <button type="button" class="btn-add-session-large" @click="store.adicionarRecorrenteSlot"><Icon name="i-lucide-plus" /> Cadastrar novo turno na recorrência</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </template>

        </div>
      </div>
          
      <!-- Footer fixo -->
      <div class="panel-footer">
        <div v-if="erroMsg" class="inline-error-alert" style="margin-right: auto; margin-bottom: 0;">
          <Icon name="heroicons:exclamation-triangle" class="error-icon" />
          <span>{{ erroMsg }}</span>
        </div>
        <button class="btn btn-primary btn-flow" @click="irParaInfo">
          <span>Prosseguir</span> <Icon name="i-lucide-arrow-right" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useAgendamentoStore } from '~/stores/agendamento';
import { useRouter } from 'vue-router';
import CustomDateSelector from '~/components/CustomDateSelector.vue';
import { formatarDataCurta as formatarData } from '~/utils/formatters';

definePageMeta({ middleware: 'auth' });
const router = useRouter();
const store = useAgendamentoStore();
const isCalendarOpen = ref(false);
const calendarKey = ref(0);
const isLoading = ref(true);
const erroMsg = ref('');


const isRecurrentCalendarOpen = ref(false);
const tempRecurrentRange = ref<Date[]>([]);

const isPeriodSelected = computed(() => !!(store.dataInicioRecorrente && store.dataFimRecorrente));

const recurrentPeriodText = computed(() => {
  if (store.dataInicioRecorrente && store.dataFimRecorrente) {
    const formatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
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

function closeRecurrentModal(shouldConfirm: boolean) {
  if (shouldConfirm && tempRecurrentRange.value.length === 2) {
    const [start, end] = tempRecurrentRange.value;
    store.dataInicioRecorrente = formatDateToLocal(start);
    store.dataFimRecorrente = formatDateToLocal(end);
  }
  isRecurrentCalendarOpen.value = false;
}

const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const safeNewDate = (date: string | Date) => (typeof date === 'string' ? new Date(date) : date);

const formatDateToLocal = (date: string | Date) => {
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
const minInicio = (dateStr: string) => (dateStr === hojeStr ? horaAgora() : '');

watch(() => store.datasSelecionadas, () => store.syncHorariosMultiplos(), { deep: true });
watch([() => store.dataInicioRecorrente, () => store.dataFimRecorrente, () => store.diasSemanaSelecionados], () => {
  if (store.recorrenteSlots.length === 0) store.adicionarRecorrenteSlot();
});

const handleStartTimeChange = (horarioRef: { inicio: string; fim: string; minFim: string }) => {
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
      erroMsg.value = validacao.mensagem;
      store.horarioUnico.inicio = ''; store.horarioUnico.fim = ''; store.horarioUnico.minFim = '';
    } else { erroMsg.value = ''; }
  }
};

const handleUnicoEndChange = () => {
  if (store.horarioUnico.fim && store.datasSelecionadas.length > 0) {
    const validacao = store.validarHorarioUnico();
    if (validacao.conflito) {
      erroMsg.value = validacao.mensagem;
      store.horarioUnico.fim = store.horarioUnico.minFim || '';
    } else { erroMsg.value = ''; }
  }
};

const handleSlotStartChange = (dateIndex: number, slotIndex: number) => {
  const slot = store.horariosMultiplos[dateIndex].slots[slotIndex];
  handleStartTimeChange(slot);
  if (slot.inicio) {
    const validacao = store.validarSlotMultiplo(dateIndex, slotIndex);
    if (validacao.conflito) {
      erroMsg.value = validacao.mensagem;
      slot.inicio = ''; slot.fim = ''; slot.minFim = '';
    } else { erroMsg.value = ''; }
  }
};

const handleSlotEndChange = (dateIndex: number, slotIndex: number) => {
  const slot = store.horariosMultiplos[dateIndex].slots[slotIndex];
  if (slot.fim) {
    const validacao = store.validarSlotMultiplo(dateIndex, slotIndex);
    if (validacao.conflito) {
      erroMsg.value = validacao.mensagem;
      slot.fim = slot.minFim || '';
    } else { erroMsg.value = ''; }
  }
};

const handleRecorrenteStartChange = () => {
  handleStartTimeChange(store.horarioRecorrente);
  if (store.horarioRecorrente.inicio && store.datasRecorrentes.length > 0) {
    const validacao = store.validarHorarioRecorrente();
    if (validacao.conflito) {
      erroMsg.value = validacao.mensagem;
      store.horarioRecorrente.inicio = ''; store.horarioRecorrente.fim = ''; store.horarioRecorrente.minFim = '';
    } else { erroMsg.value = ''; }
  }
};

const handleRecorrenteEndChange = () => {
  if (store.horarioRecorrente.fim && store.datasRecorrentes.length > 0) {
    const validacao = store.validarHorarioRecorrente();
    if (validacao.conflito) {
      erroMsg.value = validacao.mensagem;
      store.horarioRecorrente.fim = store.horarioRecorrente.minFim || '';
    } else { erroMsg.value = ''; }
  }
};

const handleRecorrenteSlotStartChange = (slotIndex: number) => {
  const slot = store.recorrenteSlots[slotIndex];
  handleStartTimeChange(slot);
  if (slot.inicio && store.datasRecorrentes.length > 0) {
    const validacao = store.validarSlotRecorrente(slotIndex);
    if (validacao.conflito) {
      erroMsg.value = validacao.mensagem;
      slot.inicio = ''; slot.fim = ''; slot.minFim = '';
    } else { erroMsg.value = ''; }
  }
};

const handleRecorrenteSlotEndChange = (slotIndex: number) => {
  const slot = store.recorrenteSlots[slotIndex];
  if (slot.fim && store.datasRecorrentes.length > 0) {
    const validacao = store.validarSlotRecorrente(slotIndex);
    if (validacao.conflito) {
      erroMsg.value = validacao.mensagem;
      slot.fim = slot.minFim || '';
    } else { erroMsg.value = ''; }
  }
};


function validarCampos() {
  store.compilarAgendamentosParaSalvar();
  const agendamentos = store.agendamentos;
  if (agendamentos.length === 0) {
    erroMsg.value = 'Nenhuma data válida foi selecionada ou gerada para o agendamento.';
    return false;
  }
  for (let i = 0; i < agendamentos.length; i++) {
    const ag = agendamentos[i];
    if (!ag.hora_inicio || !ag.hora_fim) {
      erroMsg.value = `Por favor, preencha todos os horários para a data ${formatarData(new Date(ag.data + 'T00:00:00'))}.`;
      return false;
    }
    if (ag.hora_fim <= ag.hora_inicio) {
      erroMsg.value = `Na data ${formatarData(new Date(ag.data + 'T00:00:00'))}, o horário de término deve ser maior que o de início.`;
      return false;
    }
    if (ag.data === hojeStr && ag.hora_inicio < horaAgora()) {
      erroMsg.value = `Na data de hoje, não é possível agendar um horário que já passou.`;
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
    erroMsg.value = "Nenhum recurso selecionado. Redirecionando...";
    router.push('/agendamentoSelectRecurso');
    return;
  }
  try {
    const hoje = new Date();
    await store.fetchDisponibilidade(hoje.getFullYear(), hoje.getMonth() + 1);
    calendarKey.value++;
  } catch (error: unknown) {
    console.error("Falha ao carregar dados de disponibilidade:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* OVERRIDES do layout global */
.panel-head { flex-wrap: wrap; gap: 1rem; }
.panel-scroll { background-color: #f3f4f6; display: flex; flex-direction: column; }
.panel-padding { max-width: 800px; margin: 0 auto; width: 100%; }

/* SELEÇÃO DE TIPO (Passo 0) */
.reservation-type-selector { display: flex; gap: 1rem; margin-bottom: 2rem; }
.type-card-btn { flex: 1; display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; background: #fff; border: 2px solid #e5e7eb; border-radius: 12px; cursor: pointer; text-align: left; transition: all 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
.type-card-btn:hover { border-color: #d1d5db; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.type-card-btn.active { border-color: #2563eb; background: #eff6ff; }
.type-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 10px; background: #f3f4f6; color: #4b5563; font-size: 1.5rem; flex-shrink: 0; }
.type-card-btn.active .type-icon { background: #2563eb; color: #fff; }
.type-info { display: flex; flex-direction: column; gap: 0.25rem; }
.type-title { font-size: 1.05rem; font-weight: 700; color: #111827; }
.type-card-btn.active .type-title { color: #1e40af; }
.type-desc { font-size: 0.85rem; color: #6b7280; line-height: 1.4; }

/* CONTAINER GERAL VERTICAL */
.agendamento-content-vertical { display: flex; flex-direction: column; gap: 2rem; width: 100%; }

/* BLOCOS DE PASSO (Step Cards) */
.step-block { background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 1.5rem 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 1.5rem; }

.step-header { display: flex; align-items: flex-start; gap: 1rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 1.25rem; }
.step-number { width: 32px; height: 32px; border-radius: 50%; background: #111827; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
.step-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #111827; }
.step-subtitle { margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #6b7280; }

.step-body { display: flex; flex-direction: column; gap: 1.5rem; }

/* CALENDÁRIO */
.loading-calendar { text-align: center; color: #6b7280; padding: 2rem; font-weight: 500; background: #f9fafb; border-radius: 8px; }
.datepicker-wrapper-desktop { width: 100%; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; background: #fafafa; padding: 0.5rem; }
.btn-open-calendar { display: none; } /* Mobile Apenas */

/* SELETOR HORIZONTAL DE MODOS (MENSAGEM/DIFERENTE) */
.mode-radios-horizontal { display: flex; gap: 1rem; }
.radio-label-large { flex: 1; display: flex; align-items: flex-start; gap: 0.75rem; padding: 1.25rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; cursor: pointer; transition: all 0.2s; }
.radio-label-large input[type="radio"] { margin-top: 0.2rem; width: 18px; height: 18px; accent-color: #2563eb; }
.radio-label-large:hover { background: #f3f4f6; }
.radio-label-large.active { border-color: #2563eb; background: #eff6ff; }
.radio-title { display: block; font-weight: 600; font-size: 0.95rem; color: #111827; margin-bottom: 0.2rem; }
.radio-desc { display: block; font-size: 0.85rem; color: #6b7280; }

/* INPUTS MASSIVOS (Estilo Formulário Largo) */
.time-config-card { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 1.5rem; }
.helper-text-bold { margin: 0 0 1rem 0; font-weight: 600; color: #334155; font-size: 0.95rem; }

.time-inputs-massive { display: flex; align-items: center; gap: 1.5rem; }
.input-block-massive { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
.input-block-massive label { font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.time-field-massive { width: 100%; border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 1rem; font-size: 1.25rem; font-weight: 600; color: #0f172a; text-align: center; transition: all 0.2s; outline: none; }
.time-field-massive:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
.time-separator-massive { color: #94a3b8; font-size: 1.5rem; margin-top: 1.5rem; }

/* HORÁRIOS DIFERENTES (Sessões/Slots) */
.different-times-list { display: flex; flex-direction: column; gap: 1.25rem; }
.time-config-card-nested { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.card-nested-header { display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
.nested-date { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: #0f172a; font-size: 1.05rem; }
.btn-add-session { background: transparent; border: none; font-size: 0.85rem; font-weight: 600; color: #2563eb; display: flex; align-items: center; gap: 0.25rem; cursor: pointer; padding: 0; }
.btn-add-session:hover { text-decoration: underline; color: #1d4ed8; }

.nested-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.time-inputs-row { display: flex; align-items: center; gap: 1rem; }
.time-field-wrapper { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; }
.time-field-wrapper label { font-size: 0.8rem; font-weight: 600; color: #64748b; }
.time-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.75rem; font-size: 1rem; font-weight: 500; color: #0f172a; outline: none; transition: border-color 0.2s; }
.time-input:focus { border-color: #3b82f6; }
.row-separator { color: #94a3b8; font-weight: bold; margin-top: 1.2rem; }
.btn-remove-session { margin-top: 1.2rem; background: #fee2e2; color: #ef4444; border: none; width: 42px; height: 42px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; flex-shrink: 0; }
.btn-remove-session:hover { background: #fecaca; }
.btn-add-session-large { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; color: #64748b; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem; }
.btn-add-session-large:hover { border-color: #94a3b8; color: #475569; background: #f1f5f9; }

/* RECORRENTE - PERÍODO E DIAS ÚTEIS */
.section-label-bold { display: block; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; font-size: 0.95rem; }
.btn-open-calendar-recurrent-large { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem 1.5rem; font-size: 1.05rem; font-weight: 600; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; cursor: pointer; transition: all 0.2s; text-align: left; }
.btn-open-calendar-recurrent-large:hover { border-color: #94a3b8; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.recurrent-icon { font-size: 1.5rem; color: #94a3b8; }
.recurrent-icon.selected { color: #3b82f6; }

.weekdays-grid-large { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.75rem; }
.weekday-item-large { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.75rem 0.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; font-size: 0.9rem; color: #64748b; cursor: pointer; transition: all 0.2s; }
.weekday-item-large:hover { background: #f1f5f9; border-color: #cbd5e1; }
.weekday-item-large.active-day { background: #4f46e5; border-color: #4f46e5; color: #fff; box-shadow: 0 2px 4px rgba(79,70,229,0.2); }
.weekday-item-large input { display: none; margin: 0; }

/* BADGES DE DATAS AFETADAS (Recorrente Geral) */
.dates-list-simple { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; }
.date-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.85rem; background-color: #f1f5f9; color: #334155; border-radius: 999px; font-size: 0.85rem; font-weight: 600; border: 1px solid #e2e8f0; }

/* MODALS */
.calendar-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(4px); }
.calendar-modal-content { background: #fff; border-radius: 16px; width: 100%; height: 90%; max-width: 500px; max-height: 650px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); display: flex; flex-direction: column; overflow: hidden; }
.calendar-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; flex-shrink: 0; }
.calendar-modal-header h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0; }
.btn-close-modal { background: #f1f5f9; border: none; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s; }
.btn-close-modal:hover { background: #e2e8f0; color: #0f172a; }
.calendar-modal-body { padding: 1.5rem 1rem; flex-grow: 1; min-height: 0; overflow-y: auto; }
.calendar-modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #f1f5f9; text-align: right; flex-shrink: 0; background: #f8fafc; }
.btn-confirm { background-color: #0f172a; color: white; padding: 0.75rem 2rem; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; transition: background 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-confirm:hover { background-color: #334155; }

/* INLINE ERROR */
.inline-error-alert { display: flex; align-items: center; gap: 0.5rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 0.6rem 1rem; color: #b91c1c; font-size: 0.85rem; font-weight: 500; }
.error-icon { font-size: 1.25rem; flex-shrink: 0; }

/* RESPONSIVIDADE */
@media (max-width: 768px) {
  .panel-padding { background: #f8fafc; flex: 1; min-height: 0; }
  .btn-flow { width: 100%; font-size: 1.05rem; padding: 1rem; justify-content: center; }
  
  /* Quebrando Botões de Tipo e Rádios Horizontal p/ Vertical Múltiplo */
  .reservation-type-selector { flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
  .mode-radios-horizontal { flex-direction: column; gap: 0.75rem; }
  
  /* Ajustando Blocos Pessoais */
  .step-block { padding: 1.25rem; border-radius: 12px; }
  .step-header { padding-bottom: 1rem; }
  
  /* Escondendo Grid Desktop de Datas, Forçando Modal */
  .datepicker-wrapper-desktop { display: none; }
  .btn-open-calendar { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 1rem; font-size: 1rem; font-weight: 600; border: 2px solid #cbd5e1; border-radius: 10px; background-color: #fff; cursor: pointer; color: #334155; }
  .calendar-modal-content { max-height: 90vh; border-radius: 16px; top: auto; bottom: 0; position: absolute; max-width: 100%; border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
  
  /* Massivos / Inputs Quebram em Pilha */
  .time-inputs-massive { flex-direction: column; gap: 1rem; }
  .time-separator-massive { display: none; }
  .time-inputs-row { flex-direction: column; align-items: stretch; gap: 0.5rem; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 8px; background: #fafafa; position: relative;}
  .row-separator { display: none; }
  .nested-body { padding: 1rem; }
  .btn-remove-session { position: absolute; right: 0.5rem; top: 0.5rem; width: 32px; height: 32px; border: 1px solid #fca5a5; background: #fff; margin: 0;}
  
  /* Dias Úteis Recorrente */
  .weekdays-grid-large { grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
}

@media (max-width: 480px) {
  .progress-bar { flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; margin-bottom: 0; }
  .line { display: none; }
  .weekdays-grid-large { grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
}
</style>