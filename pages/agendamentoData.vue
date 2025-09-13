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
            <input type="radio" value="Data" v-model="tipoAgendamento" />
            Datas Específicas
          </label>
          <label class="radio-label">
            <input type="radio" value="Período Recorrente" v-model="tipoAgendamento" />
            Período Recorrente
          </label>
        </div>
      </div>

      <div class="card-content">
        <div v-if="tipoAgendamento === 'Data'" class="card-content-grid">
          <div class="col-left">
            <Datepicker 
              v-model="datasSelecionadas" 
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
          <div class="col-right">
            <div class="horario-toggle">
              <label class="radio-label-sm">
                <input type="radio" value="mesmo" v-model="horarioMode" />
                Mesmo horário
              </label>
              <label class="radio-label-sm">
                <input type="radio" value="diferente" v-model="horarioMode" />
                Horários diferentes
              </label>
            </div>
            <div v-if="horarioMode === 'mesmo' && datasSelecionadas.length" class="horario-fixo">
              <span>Para todas as datas</span>
              <div class="time-inputs">
                <input type="time" v-model="horarioUnico.inicio" @change="handleUnicoStartTimeChange" />
                <span>até</span>
                <input type="time" v-model="horarioUnico.fim" :min="horarioUnico.minFim" ref="horarioUnicoFimInput" />
              </div>
            </div>
            <h4 v-if="datasSelecionadas.length" class="datas-selecionadas-title">Datas Selecionadas:</h4>
            <div class="horarios-lista">
              <div v-for="(data, index) in datasSelecionadas" :key="data.toISOString()" class="horario-item">
                <span>{{ formatarData(data) }}</span>
                <div v-if="horarioMode === 'diferente'" class="time-inputs">
                  <input type="time" v-model="horariosMultiplos[index].inicio" @change="handleMultiploStartTimeChange(index)"/>
                  <span>até</span>
                  <input type="time" v-model="horariosMultiplos[index].fim" :min="horariosMultiplos[index].minFim" :ref="el => setMultiploFimInputRef(el, index)" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="tipoAgendamento === 'Período Recorrente'" class="card-content-grid">
          <div class="col-left">
            <div class="campo-recorrente">
              <label>Selecione os dias da semana:</label>
              <div class="dias-semana-checkboxes">
                <label v-for="(dia, index) in diasSemana" :key="index" class="checkbox-label">
                  <input type="checkbox" :value="index" v-model="diasSemanaSelecionados" />
                  {{ dia }}
                </label>
              </div>
            </div>
          </div>
          <div class="col-right-recorrente">
            <div class="campo-recorrente">
              <label>Data de Início:</label>
              <input type="date" v-model="dataInicioRecorrente" :min="formatDateToLocal(new Date())" />
            </div>
            <div class="campo-recorrente">
              <label>Data de Fim:</label>
              <input type="date" v-model="dataFimRecorrente" :min="dataInicioRecorrente" />
            </div>
            <div class="campo-recorrente">
              <label>Horário:</label>
              <div class="time-inputs">
                <input type="time" v-model="horarioRecorrente.inicio" @change="handleRecorrenteStartTimeChange" />
                <span>até</span>
                <input type="time" v-model="horarioRecorrente.fim" :min="horarioRecorrente.minFim" ref="horarioRecorrenteFimInput" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card-footer">
        <button class="botao-prosseguir" @click="irParaInfo">Prosseguir</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useAgendamentoStore } from '~/stores/agendamento';
import { useRouter } from 'vue-router';
import { authenticatedFetch } from '~/utils/api';

const router = useRouter();
const store = useAgendamentoStore();
const config = useRuntimeConfig();

const horarioUnicoFimInput = ref(null);
const horariosMultiplosFimInputs = ref([]);
const horarioRecorrenteFimInput = ref(null);
const tipoAgendamento = ref('Data');
const horarioMode = ref('mesmo');
const datasSelecionadas = ref([]);
const horarioUnico = ref({ inicio: '', fim: '', minFim: '' });
const horariosMultiplos = ref([]);
const dataInicioRecorrente = ref('');
const dataFimRecorrente = ref('');
const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const diasSemanaSelecionados = ref([]);
const horarioRecorrente = ref({ inicio: '', fim: '', minFim: '' });
const horariosOcupados = ref({});

const formatDateToLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateAsLocal = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const dateMarkers = computed(() => {
  const markers = [];
  for (const dateStr in horariosOcupados.value) {
    const times = horariosOcupados.value[dateStr];
    if (times && times.length > 0) {
      const formattedTimes = times.map(t => `${t.start} - ${t.end}`).join('\n');
      markers.push({
        date: parseDateAsLocal(dateStr),
        type: 'dot',
        color: '#ef4444',
        tooltip: [{ text: `Ocupado:\n${formattedTimes}` }]
      });
    }
  }
  return markers;
});

const setMultiploFimInputRef = (el, index) => {
  if (el) {
    horariosMultiplosFimInputs.value[index] = el;
  }
};

watch(datasSelecionadas, () => {
  horariosMultiplosFimInputs.value = [];
});

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

const handleUnicoStartTimeChange = async () => {
  handleStartTimeChange(horarioUnico.value);
  await nextTick();
  horarioUnicoFimInput.value?.focus();
};

const handleMultiploStartTimeChange = async (index) => {
  handleStartTimeChange(horariosMultiplos.value[index]);
  await nextTick();
  horariosMultiplosFimInputs.value[index]?.focus();
};

const handleRecorrenteStartTimeChange = async () => {
  handleStartTimeChange(horarioRecorrente.value);
  await nextTick();
  horarioRecorrenteFimInput.value?.focus();
};

const fetchDisponibilidade = async (ano, mes) => {
  const recursoId = store.recursoSelecionado?.id_recurso;
  if (!recursoId) return;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/recursos/${recursoId}/disponibilidade/?ano=${ano}&mes=${mes}`);
    if(response.ok) {
      horariosOcupados.value = await response.json();
    } else {
      horariosOcupados.value = {};
    }
  } catch (error) {
    horariosOcupados.value = {};
  }
};

const handleMonthChange = (payload) => {
    fetchDisponibilidade(payload.year, payload.month + 1);
};

watch(datasSelecionadas, (novasDatas) => {
  novasDatas.sort((a, b) => a - b);
  horariosMultiplos.value = novasDatas.map(data => ({
    data: formatDateToLocal(data),
    inicio: '',
    fim: '',
    minFim: ''
  }));
}, { deep: true });

function formatarData(data) {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function validarConflitos(agendamentos) {
    for (const agendamento of agendamentos) {
        const dataStr = agendamento.data;
        const slotsOcupados = horariosOcupados.value[dataStr] || [];
        const novoInicio = agendamento.hora_inicio;
        const novoFim = agendamento.hora_fim;

        if (novoFim <= novoInicio) {
            alert(`Na data ${formatarData(parseDateAsLocal(dataStr))}, o horário de término deve ser maior que o de início.`);
            return true;
        }

        for (const slot of slotsOcupados) {
            const inicioOcupado = slot.start;
            const fimOcupado = slot.end;
            if (novoInicio < fimOcupado && novoFim > inicioOcupado) {
                const dataFormatada = parseDateAsLocal(dataStr).toLocaleDateString('pt-BR');
                alert(`Conflito! O horário de ${novoInicio} às ${novoFim} na data ${dataFormatada} sobrepõe uma reserva existente das ${inicioOcupado} às ${fimOcupado}.`);
                return true;
            }
        }
    }
    return false;
}

function irParaInfo() {
  const agendamentosParaSalvar = [];
  if (tipoAgendamento.value === 'Data') {
    if (horarioMode.value === 'mesmo') {
      if (!horarioUnico.value.inicio || !horarioUnico.value.fim) {
        alert('Por favor, defina o horário de início e fim.'); return;
      }
      datasSelecionadas.value.forEach(data => {
        agendamentosParaSalvar.push({
          data: formatDateToLocal(data),
          hora_inicio: horarioUnico.value.inicio,
          hora_fim: horarioUnico.value.fim
        });
      });
    } else {
      for (const horario of horariosMultiplos.value) {
        if (!horario.inicio || !horario.fim) {
          alert(`Defina o horário para a data ${formatarData(parseDateAsLocal(horario.data))}.`); return;
        }
        agendamentosParaSalvar.push({
          data: horario.data,
          hora_inicio: horario.inicio,
          hora_fim: horario.fim
        });
      }
    }
  } else if (tipoAgendamento.value === 'Período Recorrente') {
    if (!dataInicioRecorrente.value || !dataFimRecorrente.value || diasSemanaSelecionados.value.length === 0 || !horarioRecorrente.value.inicio || !horarioRecorrente.value.fim) {
      alert('Preencha todos os campos do período recorrente.'); return;
    }
    let dataAtual = parseDateAsLocal(dataInicioRecorrente.value);
    const dataFim = parseDateAsLocal(dataFimRecorrente.value);
    while (dataAtual <= dataFim) {
      if (diasSemanaSelecionados.value.includes(dataAtual.getDay())) {
        agendamentosParaSalvar.push({
          data: formatDateToLocal(dataAtual),
          hora_inicio: horarioRecorrente.value.inicio,
          hora_fim: horarioRecorrente.value.fim
        });
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
  }

  if (agendamentosParaSalvar.length === 0) {
    alert('Nenhuma data foi selecionada ou gerada.'); return;
  }
  if (validarConflitos(agendamentosParaSalvar)) {
      return;
  }
  store.setDatasEHorarios(agendamentosParaSalvar);
  router.push('/agendamentoInfo');
}

onMounted(() => {
  if (!store.recursoSelecionado) {
    alert("Nenhum recurso selecionado. Redirecionando...");
    router.push('/agendamentoSelectRecurso');
    return;
  }
  const hoje = new Date();
  fetchDisponibilidade(hoje.getFullYear(), hoje.getMonth() + 1);
});
</script>

<style>
.dp__marker_tooltip {
  background: #27272a !important;
  color: white !important;
  border-radius: 6px !important;
  padding: 6px 10px !important;
  font-size: 0.8rem !important;
  white-space: pre-line !important;
  border: 1px solid #3f3f46 !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
}
.dp__tooltip_text {
  color: white !important;
}
</style>

<style scoped>
.page-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.card { width: 100%; max-width: 60rem; background-color: white; border-radius: 0.75rem; box-shadow: 0 0.625rem 1.875rem rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; height: 85vh; max-height: 43.75rem; }
.card-header { padding: 1.5rem 2rem; border-bottom: 0.063rem solid #e5e7eb; flex-shrink: 0; }
.progress-bar { display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
.icon-active { font-size: 1.5rem; color: #2563eb; }
.icon-inactive { font-size: 1.5rem; color: #d1d5db; }
.line { flex-grow: 1; height: 0.125rem; background-color: #e5e7eb; margin: 0 1rem; }
.title { font-size: 1.75rem; font-weight: 700; text-align: center; margin: 0 0 1rem; }
.opcoes { display: flex; justify-content: center; gap: 1.5rem; }
.radio-label, .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; }
.radio-label-sm { font-size: 0.9rem; }
.card-content { flex-grow: 1; overflow-y: none; min-height: 0; }
.card-content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem; align-items: flex-start; }
.col-right { display: flex; flex-direction: column; height: 21.875rem; overflow: hidden; }
.horario-toggle { flex-shrink: 0; display: flex; gap: 1rem; padding-bottom: 1rem; }
.horario-fixo { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 0.063rem solid #f3f4f6; }
.datas-selecionadas-title { flex-shrink: 0; margin: 1rem 0 0.5rem; font-weight: bold; }
.horarios-lista { flex-grow: 1; overflow-y: auto; padding-right: 1rem; border-top: 0.063rem solid #f3f4f6; min-height: 0; position: relative; z-index: 1; }
.horario-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 0.063rem solid #f3f4f6; }
.time-inputs { display: flex; align-items: center; gap: 0.5rem; }
input[type="time"] { border: 0.063rem solid #d1d5db; border-radius: 0.375rem; padding: 0.25rem; }
.col-right-recorrente { display: flex; flex-direction: column; gap: 1.5rem; }
.campo-recorrente { width: 100%; }
.campo-recorrente label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.dias-semana-checkboxes { display: flex; flex-direction: column; gap: 0.75rem; }
input[type="date"], select { width: 100%; padding: 0.5rem; border: 0.063rem solid #d1d5db; border-radius: 0.375rem; box-sizing: border-box; }
.card-footer { padding: 1rem 2rem; border-top: 0.063rem solid #e5e7eb; text-align: right; flex-shrink: 0; position: relative; z-index: 10; background-color: white; box-shadow: 0 -0.125rem 0.5rem rgba(0,0,0,0.05); }
.botao-prosseguir { background-color: #374151; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; border: none; cursor: pointer; }
@media (max-width: 48rem) {
  .card-content-grid { grid-template-columns: 1fr; gap: 1rem; padding: 1rem; }
  .card { max-height: none; height: auto; margin: 1rem; }
  .col-right, .col-right-recorrente { height: auto; overflow: visible; }
  .opcoes { flex-direction: column; gap: 0.75rem; }
  .botao-prosseguir { width: 100%; padding: 0.75rem; font-size: 1rem; }
}
@media (max-width: 31.25rem) {
  .title { font-size: 1.25rem; }
  .progress-bar { flex-direction: column; gap: 0.5rem; }
  .line { display: none; }
}
</style>