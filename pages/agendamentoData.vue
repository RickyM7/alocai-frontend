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
            <button type="button" class="btn-open-calendar" @click="isCalendarOpen = true">
              <Icon name="heroicons:calendar-days-20-solid" />
              <span>{{ store.datasSelecionadas.length > 0 ? `Datas Selecionadas (${store.datasSelecionadas.length})` : 'Selecionar Datas' }}</span>
            </button>

            <div class="datepicker-wrapper-desktop">
              <Datepicker 
                v-model="store.datasSelecionadas" 
                multi-dates 
                inline 
                auto-apply 
                :enable-time-picker="false" 
                locale="pt-BR"
                :min-date="new Date()"
                @update-month-year="handleMonthChange"
                :markers="dateMarkers"
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
                  <Datepicker 
                    v-model="store.datasSelecionadas" 
                    multi-dates 
                    inline 
                    auto-apply 
                    :enable-time-picker="false" 
                    locale="pt-BR"
                    :min-date="new Date()"
                    @update-month-year="handleMonthChange"
                    :markers="dateMarkers"
                  />
                </div>
                <div class="calendar-modal-footer">
                  <button class="btn-confirm" @click="isCalendarOpen = false">Confirmar</button>
                </div>
              </div>
            </div>
          </div>

          <div class="col-dates" v-if="store.datasSelecionadas.length">
            <h4 class="section-title">Datas Selecionadas</h4>
            <div class="dates-list">
              <div v-for="(data, index) in store.horariosMultiplos" :key="data.data" class="date-item">
                <span class="date-label">{{ formatarData(new Date(data.data + 'T00:00:00')) }}</span>
                <div v-if="store.horarioMode === 'diferente'" class="slots-container">
                  <div v-for="(slot, sIdx) in data.slots" :key="slot.id" class="time-inputs">
                    <input type="time" v-model="slot.inicio" :min="minInicio(data.data)" @input="handleStartTimeChange(slot)" class="time-field"/>
                    <span class="time-separator">até</span>
                    <input type="time" v-model="slot.fim" :min="slot.minFim" class="time-field"/>
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
                <input type="time" v-model="store.horarioUnico.inicio" :min="minInicioParaMesmo" @input="handleStartTimeChange(store.horarioUnico)" class="time-field"/>
                <span class="time-separator">até</span>
                <input type="time" v-model="store.horarioUnico.fim" :min="store.horarioUnico.minFim" class="time-field"/>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="store.tipoAgendamento === 'Período Recorrente'" class="content-grid">
          <div class="col-calendar">
            <div class="recurrent-config">
              <div class="date-period">
                <div class="field-group">
                  <label>Data de Início</label>
                  <input type="date" v-model="store.dataInicioRecorrente" :min="formatDateToLocal(new Date())"/>
                </div>
                <div class="field-group">
                  <label>Data de Fim</label>
                  <input type="date" v-model="store.dataFimRecorrente" :min="store.dataInicioRecorrente"/>
                </div>
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
                <input type="time" v-model="store.horarioRecorrente.inicio" :min="minInicioRecorrente" @input="handleStartTimeChange(store.horarioRecorrente)" class="time-field"/>
                <span class="time-separator">até</span>
                <input type="time" v-model="store.horarioRecorrente.fim" :min="store.horarioRecorrente.minFim" class="time-field"/>
              </div>
            </div>

            <div v-if="store.horarioModeRecorrente === 'diferente'" class="different-times-section">
              <h4 class="section-title">Horários</h4>
              <div class="slots-container">
                <div v-for="(slot, idx) in store.recorrenteSlots" :key="slot.id" class="time-inputs">
                  <input type="time" v-model="slot.inicio" :min="minInicioRecorrente" @input="handleStartTimeChange(slot)" class="time-field"/>
                  <span class="time-separator">até</span>
                  <input type="time" v-model="slot.fim" :min="slot.minFim" class="time-field"/>
                  <button type="button" class="btn-remove" @click="store.removerRecorrenteSlot(idx)">×</button>
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
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useAgendamentoStore } from '~/stores/agendamento';
import { useRouter } from 'vue-router';

const router = useRouter();
const store = useAgendamentoStore();
const isCalendarOpen = ref(false);

const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const formatDateToLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
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
  const hasToday = store.datasSelecionadas.some(d => formatDateToLocal(d) === hojeStr);
  return hasToday ? horaAgora() : '';
});

const incluiHojeNaRecorrencia = computed(() => {
  if (!store.dataInicioRecorrente || !store.dataFimRecorrente || store.diasSemanaSelecionados.length === 0) return false;
  const hoje = new Date();
  const inicio = new Date(store.dataInicioRecorrente + 'T00:00:00');
  const fim = new Date(store.dataFimRecorrente + 'T00:00:00');
  if (hoje < inicio || hoje > fim) return false;
  return store.diasSemanaSelecionados.includes(hoje.getDay());
});

const minInicioRecorrente = computed(() => incluiHojeNaRecorrencia.value ? horaAgora() : '');

const minInicio = (dateStr) => {
  return dateStr === hojeStr ? horaAgora() : '';
};

watch(() => store.datasSelecionadas, () => {
  store.syncHorariosMultiplos();
}, { deep: true });

watch([() => store.dataInicioRecorrente, () => store.dataFimRecorrente, () => store.diasSemanaSelecionados], () => {
  if (store.recorrenteSlots.length === 0) store.adicionarRecorrenteSlot();
});

const dateMarkers = computed(() => {
  const markers = [];
  for (const dateStr in store.horariosOcupados) {
    const times = store.horariosOcupados[dateStr];
    if (times && times.length > 0) {
      const formattedTimes = times.map(t => `${t.start} - ${t.end}`).join('\n');
      markers.push({
        date: new Date(dateStr + 'T00:00:00'),
        type: 'dot',
        color: '#ef4444',
        tooltip: [{ text: `Ocupado:\n${formattedTimes}` }]
      });
    }
  }
  return markers;
});

const handleMonthChange = (payload) => {
  store.fetchDisponibilidade(payload.year, payload.month + 1);
};

const handleStartTimeChange = (horarioRef) => {
  if (!horarioRef.inicio) {
    horarioRef.minFim = '';
    horarioRef.fim = '';
    return;
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

function formatarData(data) {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function validarCampos() {
  const sobrepoe = (aIni, aFim, bIni, bFim) => aIni < bFim && aFim > bIni;

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
    const slotsOcupados = store.horariosOcupados[ag.data] || [];
    for (const slot of slotsOcupados) {
      if (sobrepoe(ag.hora_inicio, ag.hora_fim, slot.start, slot.end)) {
        alert(`Conflito! O horário de ${ag.hora_inicio} às ${ag.hora_fim} no dia ${formatarData(new Date(ag.data + 'T00:00:00'))} sobrepõe uma reserva existente.`);
        return false;
      }
    }
    for (let j = i + 1; j < agendamentos.length; j++) {
        const outroAg = agendamentos[j];
        if (ag.data === outroAg.data && sobrepoe(ag.hora_inicio, ag.hora_fim, outroAg.hora_inicio, outroAg.hora_fim)) {
            alert(`Você selecionou horários que se sobrepõem no dia ${formatarData(new Date(ag.data + 'T00:00:00'))}.`);
            return false;
        }
    }
  }
  return true;
}

async function irParaInfo() {
  if (validarCampos()) {
    router.push('/agendamentoInfo');
  }
}

onMounted(() => {
  if (!store.recursoSelecionado) {
    alert("Nenhum recurso selecionado. Redirecionando...");
    router.push('/agendamentoSelectRecurso');
    return;
  }
  const hoje = new Date();
  store.fetchDisponibilidade(hoje.getFullYear(), hoje.getMonth() + 1);
});
</script>

<style>
.dp__marker_tooltip{background:#27272a!important;color:#fff!important;border-radius:6px!important;padding:6px 10px!important;font-size:.8rem!important;white-space:pre-line!important;border:1px solid #3f3f46!important;box-shadow:0 2px 8px rgba(0,0,0,.2)!important}.dp__tooltip_text{color:#fff!important}.dp__main{width:100%!important}.dp__calendar_wrapper{width:100%!important}.dp__calendar{max-width:100%!important}
</style>

<style scoped>
.page-container{width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:1rem;box-sizing:border-box;background:transparent}
.card{width:100%;max-width:75rem;background-color:#fff;border-radius:0.75rem;box-shadow:0 0.625rem 1.875rem rgba(0,0,0,0.1);display:flex;flex-direction:column;height:90vh;max-height:50rem}
.card-header{padding:1.5rem 2rem;border-bottom:0.063rem solid #e5e7eb;flex-shrink:0}
.card-content{flex-grow:1;overflow:hidden;min-height:0;padding:1.5rem 2rem}
.card-footer{padding:1rem 2rem;border-top:0.063rem solid #e5e7eb;text-align:right;flex-shrink:0;background-color:#fff;box-shadow:0 -0.125rem 0.5rem rgba(0,0,0,0.05)}
.progress-bar{display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem}
.icon-active{font-size:1.5rem;color:#2563eb}
.icon-inactive{font-size:1.5rem;color:#d1d5db}
.line{flex-grow:1;height:0.125rem;background-color:#e5e7eb;margin:0 1rem}
.title{font-size:1.75rem;font-weight:700;text-align:center;margin:0 0 1rem}
.section-title{font-size:1rem;font-weight:600;margin:0 0 1rem;padding-bottom:0.5rem;border-bottom:1px solid #e5e7eb}
.section-label{display:block;margin-bottom:0.75rem;font-weight:600;font-size:0.9rem}
.opcoes{display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap}
.radio-label,.checkbox-label{display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-weight:500}
.radio-label-sm{font-size:0.9rem}
input[type="date"],select{width:100%;padding:0.5rem;border:0.063rem solid #d1d5db;border-radius:0.375rem;box-sizing:border-box;font-size:0.9rem}
.field-group{flex:1}
.field-group label{display:block;margin-bottom:0.5rem;font-weight:500;font-size:0.9rem}
.content-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2rem;height:100%;align-items:flex-start}
.col-calendar,.col-dates,.col-times{min-width:0;height:100%;display:flex;flex-direction:column;overflow:hidden}
.dates-list{flex-grow:1;overflow-y:auto;border:1px solid #f3f4f6;border-radius:0.5rem;background:#f9fafb}
.date-item{padding:0.75rem;border-bottom:1px solid #e5e7eb}
.date-item:last-child{border-bottom:none}
.date-item-simple{padding:0.5rem 0.75rem;border-bottom:1px dashed #e5e7eb;font-size:0.9rem}
.date-item-simple:last-child{border-bottom:none}
.date-label{font-weight:600;color:#374151;font-size:0.9rem;display:block;margin-bottom:0.5rem}
.time-mode{display:flex;gap:1rem;margin-bottom:1rem;flex-wrap:wrap}
.same-time-section,.different-times-section{border:1px solid #f3f4f6;border-radius:0.5rem;padding:1rem;background:#f9fafb}
.time-inputs{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem}
.time-field{border:0.063rem solid #d1d5db;border-radius:0.375rem;padding:0.5rem;font-size:0.9rem;min-width:0;flex:1}
.time-separator{background:#eef2ff;color:#4338ca;border-radius:9999px;padding:0.25rem 0.5rem;font-size:0.75rem;font-weight:700;line-height:1;white-space:nowrap}
.time-preview{font-size:0.85rem;color:#6b7280;margin-top:0.5rem}
.slots-container{display:flex;flex-direction:column;gap:0.5rem;max-height:15rem;overflow-y:auto}
.recurrent-config{display:flex;flex-direction:column;gap:1.5rem}
.date-period{display:flex;gap:1rem}
.weekdays-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:0.5rem}
.weekday-item{display:flex;flex-direction:column;align-items:center;gap:0.25rem;padding:0.5rem;border:1px solid #e5e7eb;border-radius:0.375rem;cursor:pointer;font-size:0.8rem;text-align:center}
.weekday-item:has(input:checked){background:#eef2ff;border-color:#4338ca}
.weekday-item input{margin:0}
.btn-add{background:#10b981;color:#fff;border:none;border-radius:0.375rem;padding:0.5rem 0.75rem;cursor:pointer;font-size:0.85rem;align-self:flex-start}
.btn-remove{background:#ef4444;color:#fff;border:none;border-radius:0.375rem;padding:0.25rem 0.5rem;cursor:pointer;font-size:0.75rem;min-width:auto}
.btn-continue{background-color:#374151;color:#fff;padding:0.75rem 2rem;border-radius:0.5rem;border:none;cursor:pointer;font-weight:500}
.btn-open-calendar{display:none}
.calendar-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center}
.calendar-modal-content{background:white;border-radius:0.75rem;width:auto;max-width:calc(100vw - 2rem);box-shadow:0 10px 30px rgba(0,0,0,0.2);display:flex;flex-direction:column;overflow:hidden}
.calendar-modal-header{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;border-bottom:1px solid #e5e7eb}
.calendar-modal-header h2{font-size:1.25rem;margin:0}
.btn-close-modal{background:none;border:none;cursor:pointer;padding:0.5rem;line-height:1;font-size:1.5rem;color:#6b7280}
.calendar-modal-body{padding:0 1.5rem}
.calendar-modal-footer{padding:1rem 1.5rem;border-top:1px solid #e5e7eb;text-align:right}
.btn-confirm{background-color:#374151;color:white;padding:0.75rem 2rem;border-radius:0.5rem;border:none;cursor:pointer}
@media (max-width:64rem){.content-grid{grid-template-columns:1fr 1fr;gap:1.5rem}.col-times{grid-column:1/-1}}
@media (max-width:48rem){.page-container{padding:0}.card{margin:0;border-radius:0;height:calc(100vh - 64px);box-shadow:none}.card-header{padding:1rem;position:sticky;top:0;z-index:10;background-color:#fff}.card-content{padding:1rem;flex-grow:1;overflow-y:auto}.card-footer{padding:1rem;position:sticky;bottom:0;z-index:10}.content-grid{grid-template-columns:1fr;gap:1.5rem;height:auto}.col-calendar,.col-dates,.col-times{height:auto}.opcoes{flex-direction:column;gap:0.75rem;align-items:stretch}.radio-label,.checkbox-label{justify-content:center;padding:0.75rem;border:1px solid #e5e7eb;border-radius:0.5rem;background:#f9fafb}.time-mode{flex-direction:column;gap:1rem}.date-period{flex-direction:column;gap:1rem}.weekdays-grid{grid-template-columns:repeat(4,1fr);gap:0.75rem}.dates-list{max-height:20rem}.slots-container{max-height:12rem}.datepicker-wrapper-desktop{display:none}.btn-open-calendar{display:flex;align-items:center;justify-content:center;gap:0.75rem;width:100%;padding:0.75rem 1rem;font-size:1rem;font-weight:500;border:1px solid #d1d5db;border-radius:0.5rem;background-color:#f9fafb;cursor:pointer}}
@media (max-width:31.25rem){.title{font-size:1.25rem;margin-bottom:0.75rem}.progress-bar{flex-direction:column;gap:0.5rem;margin-bottom:1rem}.line{display:none}.card-header{padding:0.75rem}.card-content{padding:0.75rem}.card-footer{padding:0.75rem}.content-grid{gap:1rem}.weekdays-grid{grid-template-columns:repeat(3,1fr);gap:0.5rem}.weekday-item{padding:0.375rem;font-size:0.75rem}.btn-continue{width:100%;padding:0.875rem 1rem}.opcoes{gap:0.5rem}.radio-label,.checkbox-label{padding:0.5rem;font-size:0.9rem}.same-time-section,.different-times-section{padding:0.75rem}.dates-list{max-height:15rem}.slots-container{max-height:10rem}}
</style>