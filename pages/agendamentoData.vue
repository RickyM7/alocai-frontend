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
        <div v-if="tipoAgendamento === 'Data'" class="content-grid">
          <div class="col-calendar">
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

          <div class="col-dates" v-if="datasSelecionadas.length">
            <h4 class="section-title">Datas Selecionadas</h4>
            <div class="dates-list">
              <div v-for="(data, index) in datasSelecionadas" :key="data.toISOString()" class="date-item">
                <span class="date-label">{{ formatarData(data) }}</span>
                <div v-if="horarioMode === 'diferente'" class="slots-container">
                  <div v-for="(slot, sIdx) in (horariosMultiplos[index]?.slots || [])" :key="slot.id" class="time-inputs">
                    <input type="time" v-model="slot.inicio" :min="minInicio(data)" @input="handleMultiploSlotStartChange(index, sIdx)" class="time-field"/>
                    <span class="time-separator">até</span>
                    <input type="time" v-model="slot.fim" :min="slot.minFim" :ref="el => setMultiploFimInputRef(el, index, sIdx)" @input="handleMultiploSlotFimChange(index, sIdx)" class="time-field"/>
                    <button type="button" class="btn-remove" @click="removerSlot(index, sIdx)">×</button>
                  </div>
                  <button type="button" class="btn-add" @click="adicionarSlot(index)">+ Horário</button>
                </div>
                <div v-if="horarioMode === 'diferente' && (horariosMultiplos[index]?.slots || []).length" class="time-preview">
                  <div v-for="(slot, sIdx) in horariosMultiplos[index].slots" :key="slot.id + '-prev'">
                    <span v-if="slot.inicio && slot.fim">{{ slot.inicio }} - {{ slot.fim }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-times">
            <div class="time-mode">
              <label class="radio-label-sm">
                <input type="radio" value="mesmo" v-model="horarioMode" />
                Mesmo horário
              </label>
              <label class="radio-label-sm">
                <input type="radio" value="diferente" v-model="horarioMode" />
                Horários diferentes
              </label>
            </div>

            <div v-if="horarioMode === 'mesmo' && datasSelecionadas.length" class="same-time-section">
              <h4 class="section-title">Horário Único</h4>
              <div class="time-inputs">
                <input type="time" v-model="horarioUnico.inicio" :min="minInicioParaMesmo" @input="handleUnicoStartTimeChange" class="time-field"/>
                <span class="time-separator">até</span>
                <input type="time" v-model="horarioUnico.fim" :min="horarioUnico.minFim" @input="handleUnicoFimChange" ref="horarioUnicoFimInput" class="time-field"/>
              </div>
              <div v-if="horarioUnico.inicio && horarioUnico.fim" class="time-preview">{{ horarioUnico.inicio }} - {{ horarioUnico.fim }}</div>
            </div>
          </div>
        </div>
        
        <div v-if="tipoAgendamento === 'Período Recorrente'" class="content-grid">
          <div class="col-calendar">
            <div class="recurrent-config">
              <div class="date-period">
                <div class="field-group">
                  <label>Data de Início</label>
                  <input type="date" v-model="dataInicioRecorrente" :min="formatDateToLocal(new Date())"/>
                </div>
                <div class="field-group">
                  <label>Data de Fim</label>
                  <input type="date" v-model="dataFimRecorrente" :min="dataInicioRecorrente"/>
                </div>
              </div>

              <div class="weekdays-section">
                <label class="section-label">Dias da Semana</label>
                <div class="weekdays-grid">
                  <label v-for="(dia, index) in diasSemana" :key="index" class="weekday-item">
                    <input type="checkbox" :value="index" v-model="diasSemanaSelecionados"/>
                    <span>{{ dia.substring(0, 3) }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="col-dates" v-if="datasRecorrentes.length">
            <h4 class="section-title">Ocorrências ({{ datasRecorrentes.length }})</h4>
            <div class="dates-list">
              <div v-for="d in datasRecorrentes" :key="d.toISOString()" class="date-item-simple">
                {{ formatarData(d) }}
              </div>
            </div>
          </div>

          <div class="col-times">
            <div class="time-mode">
              <label class="radio-label-sm">
                <input type="radio" value="mesmo" v-model="horarioModeRecorrente"/>
                Mesmo horário
              </label>
              <label class="radio-label-sm">
                <input type="radio" value="diferente" v-model="horarioModeRecorrente"/>
                Horários diferentes
              </label>
            </div>

            <div v-if="horarioModeRecorrente === 'mesmo'" class="same-time-section">
              <h4 class="section-title">Horário Único</h4>
              <div class="time-inputs">
                <input type="time" v-model="horarioRecorrente.inicio" :min="minInicioRecorrente" @input="handleRecorrenteStartTimeChange" class="time-field"/>
                <span class="time-separator">até</span>
                <input type="time" v-model="horarioRecorrente.fim" :min="horarioRecorrente.minFim" @input="handleRecorrenteFimChange" ref="horarioRecorrenteFimInput" class="time-field"/>
              </div>
              <div v-if="horarioRecorrente.inicio && horarioRecorrente.fim" class="time-preview">{{ horarioRecorrente.inicio }} - {{ horarioRecorrente.fim }}</div>
            </div>

            <div v-if="horarioModeRecorrente === 'diferente'" class="different-times-section">
              <h4 class="section-title">Horários</h4>
              <div class="slots-container">
                <div v-for="(slot, idx) in recorrenteSlots" :key="slot.id" class="time-inputs">
                  <input type="time" v-model="slot.inicio" :min="minInicioRecorrente" @input="handleRecorrenteSlotStartChange(idx)" class="time-field"/>
                  <span class="time-separator">até</span>
                  <input type="time" v-model="slot.fim" :min="slot.minFim" @input="handleRecorrenteSlotFimChange(idx)" class="time-field"/>
                  <button type="button" class="btn-remove" @click="removerRecorrenteSlot(idx)">×</button>
                </div>
                <button type="button" class="btn-add" @click="adicionarRecorrenteSlot">+ Horário</button>
              </div>
              <div v-if="recorrenteSlots.length" class="time-preview">
                <div v-for="(slot, idx) in recorrenteSlots" :key="slot.id + '-prev'">
                  <span v-if="slot.inicio && slot.fim">{{ slot.inicio }} - {{ slot.fim }}</span>
                </div>
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
const horarioModeRecorrente = ref('mesmo');
const horarioRecorrente = ref({ inicio: '', fim: '', minFim: '' });
const recorrenteSlots = ref([{ inicio: '', fim: '', minFim: '', id: gerarId() }]);
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

const horaAgora = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const hojeStr = () => formatDateToLocal(new Date());

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

const minInicioParaMesmo = computed(() => {
  const tStr = hojeStr();
  const hasToday = datasSelecionadas.value.some(d => formatDateToLocal(d) === tStr);
  return hasToday ? horaAgora() : '';
});

const incluiHojeNaRecorrencia = computed(() => {
  if (!dataInicioRecorrente.value || !dataFimRecorrente.value || diasSemanaSelecionados.value.length === 0) return false;
  const hoje = new Date();
  const inicio = parseDateAsLocal(dataInicioRecorrente.value);
  const fim = parseDateAsLocal(dataFimRecorrente.value);
  if (hoje < inicio || hoje > fim) return false;
  return diasSemanaSelecionados.value.includes(hoje.getDay());
});

const minInicioRecorrente = computed(() => incluiHojeNaRecorrencia.value ? horaAgora() : '');

const minInicio = (dateObj) => {
  const isToday = formatDateToLocal(dateObj) === hojeStr();
  return isToday ? horaAgora() : '';
};

function gerarId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const criarSlot = () => ({ inicio: '', fim: '', minFim: '', id: gerarId() });

const setMultiploFimInputRef = (el, index, slotIndex) => {
  if (!horariosMultiplosFimInputs.value[index]) horariosMultiplosFimInputs.value[index] = [];
  horariosMultiplosFimInputs.value[index][slotIndex] = el || null;
};

watch(datasSelecionadas, (novasDatas) => {
  novasDatas.sort((a, b) => a - b);
  const antigasMap = new Map(horariosMultiplos.value.map(item => [item.data, item]));
  const novas = novasDatas.map(data => {
    const dStr = formatDateToLocal(data);
    return antigasMap.get(dStr) || { data: dStr, slots: [criarSlot()] };
  });
  horariosMultiplos.value = novas;
  horariosMultiplosFimInputs.value = [];
}, { deep: true });

watch([dataInicioRecorrente, dataFimRecorrente, diasSemanaSelecionados], () => {
  if (!recorrenteSlots.value.length) recorrenteSlots.value = [criarSlot()];
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
  if (horarioUnico.value.inicio) {
    const hasToday = datasSelecionadas.value.some(d => formatDateToLocal(d) === hojeStr());
    if (hasToday && horarioUnico.value.inicio < horaAgora()) {
      horarioUnico.value.inicio = horaAgora();
    }
  }
  handleStartTimeChange(horarioUnico.value);
  await nextTick();
  horarioUnicoFimInput.value?.focus();
  validarUnicoImediato();
};

const compararHora = (a, b) => a === b ? 0 : (a < b ? -1 : 1);
const sobrepoe = (aIni, aFim, bIni, bFim) => aIni < bFim && aFim > bIni;

const conflitoComReservas = (dataStr, ini, fim) => {
  const slots = horariosOcupados.value[dataStr] || [];
  for (const s of slots) {
    if (sobrepoe(ini, fim, s.start, s.end)) return true;
  }
  return false;
};

const conflitoEmSlotsLocais = (slots, idxAtual) => {
  const atual = slots[idxAtual];
  if (!atual || !atual.inicio || !atual.fim) return false;
  for (let i = 0; i < slots.length; i++) {
    if (i === idxAtual) continue;
    const s = slots[i];
    if (!s.inicio || !s.fim) continue;
    if (atual.inicio === s.inicio && atual.fim === s.fim) return 'dup';
    if (sobrepoe(atual.inicio, atual.fim, s.inicio, s.fim)) return 'overlap';
  }
  return false;
};

const handleMultiploSlotStartChange = async (dateIndex, slotIndex) => {
  const slot = horariosMultiplos.value[dateIndex].slots[slotIndex];
  const dataObj = datasSelecionadas.value[dateIndex];
  const min = minInicio(dataObj);
  if (slot.inicio && min && slot.inicio < min) {
    slot.inicio = min;
  }
  handleStartTimeChange(slot);
  await nextTick();
  const refEl = (horariosMultiplosFimInputs.value[dateIndex] || [])[slotIndex];
  refEl?.focus();
  validarSlotImediato(dateIndex, slotIndex);
};

const handleMultiploSlotFimChange = (dateIndex, slotIndex) => {
  validarSlotImediato(dateIndex, slotIndex);
};

const validarSlotImediato = (dateIndex, slotIndex) => {
  const item = horariosMultiplos.value[dateIndex];
  if (!item) return;
  const dataStr = item.data;
  const slot = item.slots[slotIndex];
  if (!slot.inicio || !slot.fim) return;
  if (compararHora(slot.fim, slot.inicio) <= 0) {
    alert('O horário de término deve ser maior que o de início.');
    slot.fim = slot.minFim || '';
    return;
  }
  if (dataStr === hojeStr() && slot.inicio < horaAgora()) {
    alert('Não é possível selecionar horário anterior ao atual para hoje.');
    slot.inicio = horaAgora();
    handleStartTimeChange(slot);
    return;
  }
  const conflitoDia = conflitoEmSlotsLocais(item.slots, slotIndex);
  if (conflitoDia === 'dup') {
    alert('Você já adicionou este mesmo horário para este dia.');
    slot.fim = '';
    return;
  }
  if (conflitoDia === 'overlap') {
    alert('Os horários escolhidos para este dia não podem se sobrepor.');
    slot.fim = '';
    return;
  }
  if (conflitoComReservas(dataStr, slot.inicio, slot.fim)) {
    alert('Conflito com um horário já reservado para este recurso.');
    slot.fim = '';
    return;
  }
};

const adicionarSlot = (dateIndex) => {
  horariosMultiplos.value[dateIndex].slots.push(criarSlot());
};

const removerSlot = (dateIndex, slotIndex) => {
  horariosMultiplos.value[dateIndex].slots.splice(slotIndex, 1);
  if (horariosMultiplosFimInputs.value[dateIndex]) {
    horariosMultiplosFimInputs.value[dateIndex].splice(slotIndex, 1);
  }
};

const validarUnicoImediato = async () => {
  if (!horarioUnico.value.inicio || !horarioUnico.value.fim || !datasSelecionadas.value.length) return;
  if (compararHora(horarioUnico.value.fim, horarioUnico.value.inicio) <= 0) {
    alert('O horário de término deve ser maior que o de início.');
    horarioUnico.value.fim = horarioUnico.value.minFim || '';
    return;
  }
  const hasToday = datasSelecionadas.value.some(d => formatDateToLocal(d) === hojeStr());
  if (hasToday && horarioUnico.value.inicio < horaAgora()) {
    alert('Para hoje, o horário de início não pode ser anterior ao atual.');
    horarioUnico.value.inicio = horaAgora();
    handleStartTimeChange(horarioUnico.value);
    return;
  }
  await ensureDisponibilidadeForDates(datasSelecionadas.value);
  for (const d of datasSelecionadas.value) {
    const ds = formatDateToLocal(d);
    if (conflitoComReservas(ds, horarioUnico.value.inicio, horarioUnico.value.fim)) {
      alert(`Conflito com reserva existente em ${formatarData(d)}.`);
      horarioUnico.value.fim = '';
      return;
    }
  }
};

const handleRecorrenteStartTimeChange = async () => {
  handleStartTimeChange(horarioRecorrente.value);
  await nextTick();
  horarioRecorrenteFimInput.value?.focus();
  validarRecorrenteUnicoImediato();
};

const handleRecorrenteFimChange = async () => {
  validarRecorrenteUnicoImediato();
};

const validarRecorrenteUnicoImediato = async () => {
  if (!horarioRecorrente.value.inicio || !horarioRecorrente.value.fim) return;
  if (compararHora(horarioRecorrente.value.fim, horarioRecorrente.value.inicio) <= 0) {
    alert('O horário de término deve ser maior que o de início.');
    horarioRecorrente.value.fim = horarioRecorrente.value.minFim || '';
    return;
  }
  if (incluiHojeNaRecorrencia.value && horarioRecorrente.value.inicio < horaAgora()) {
    alert('Para hoje, o horário de início não pode ser anterior ao atual.');
    horarioRecorrente.value.inicio = horaAgora();
    handleStartTimeChange(horarioRecorrente.value);
    return;
  }
  const datas = getRecurrenceDates();
  if (!datas.length) return;
  await ensureDisponibilidadeForDates(datas);
  for (const d of datas) {
    const ds = formatDateToLocal(d);
    if (conflitoComReservas(ds, horarioRecorrente.value.inicio, horarioRecorrente.value.fim)) {
      alert(`Conflito com reserva existente em ${formatarData(d)}.`);
      horarioRecorrente.value.fim = '';
      return;
    }
  }
};

const adicionarRecorrenteSlot = () => {
  recorrenteSlots.value.push(criarSlot());
};

const removerRecorrenteSlot = (idx) => {
  recorrenteSlots.value.splice(idx, 1);
  if (!recorrenteSlots.value.length) recorrenteSlots.value.push(criarSlot());
};

const handleRecorrenteSlotStartChange = async (idx) => {
  const slot = recorrenteSlots.value[idx];
  if (incluiHojeNaRecorrencia.value && slot.inicio && slot.inicio < horaAgora()) {
    slot.inicio = horaAgora();
  }
  handleStartTimeChange(slot);
  validarRecorrenteSlotImediato(idx);
};

const handleRecorrenteSlotFimChange = (idx) => {
  validarRecorrenteSlotImediato(idx);
};

const validarRecorrenteSlotImediato = async (idx) => {
  const slot = recorrenteSlots.value[idx];
  if (!slot.inicio || !slot.fim) return;
  if (compararHora(slot.fim, slot.inicio) <= 0) {
    alert('O horário de término deve ser maior que o de início.');
    slot.fim = slot.minFim || '';
    return;
  }
  const conflitoLocal = conflitoEmSlotsLocais(recorrenteSlots.value, idx);
  if (conflitoLocal === 'dup') {
    alert('Você já adicionou este mesmo horário.');
    slot.fim = '';
    return;
  }
  if (conflitoLocal === 'overlap') {
    alert('Os horários escolhidos não podem se sobrepor.');
    slot.fim = '';
    return;
  }
  const datas = getRecurrenceDates();
  if (!datas.length) return;
  await ensureDisponibilidadeForDates(datas);
  for (const d of datas) {
    const ds = formatDateToLocal(d);
    if (conflitoComReservas(ds, slot.inicio, slot.fim)) {
      alert(`Conflito com reserva existente em ${formatarData(d)}.`);
      slot.fim = '';
      return;
    }
  }
};

const fetchDisponibilidade = async (ano, mes, merge = false) => {
  const recursoId = store.recursoSelecionado?.id_recurso;
  if (!recursoId) return;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/recursos/${recursoId}/disponibilidade/?ano=${ano}&mes=${mes}`);
    if(response.ok) {
      const data = await response.json();
      if (merge) {
        const atual = horariosOcupados.value || {};
        horariosOcupados.value = { ...atual, ...data };
      } else {
        horariosOcupados.value = data;
      }
    } else {
      if (!merge) horariosOcupados.value = {};
    }
  } catch {
    if (!merge) horariosOcupados.value = {};
  }
};

const ensureDisponibilidadeForDates = async (dateObjs) => {
  const setYM = new Set();
  for (const d of dateObjs) {
    setYM.add(`${d.getFullYear()}-${d.getMonth()+1}`);
  }
  for (const ym of setYM) {
    const [y, m] = ym.split('-').map(Number);
    await fetchDisponibilidade(y, m, true);
  }
};

const handleMonthChange = (payload) => {
  fetchDisponibilidade(payload.year, payload.month + 1);
};

function getRecurrenceDates() {
  if (!dataInicioRecorrente.value || !dataFimRecorrente.value || diasSemanaSelecionados.value.length === 0) return [];
  const inicio = parseDateAsLocal(dataInicioRecorrente.value);
  const fim = parseDateAsLocal(dataFimRecorrente.value);
  if (fim < inicio) return [];
  const datas = [];
  const d = new Date(inicio.getTime());
  while (d <= fim) {
    if (diasSemanaSelecionados.value.includes(d.getDay())) {
      datas.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    d.setDate(d.getDate() + 1);
  }
  return datas;
}

const datasRecorrentes = computed(() => getRecurrenceDates());

function formatarData(data) {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function validarConflitos(agendamentos) {
  const vistos = new Set();
  const hoje = hojeStr();
  for (const agendamento of agendamentos) {
    const dataStr = agendamento.data;
    const slotsOcupados = horariosOcupados.value[dataStr] || [];
    const novoInicio = agendamento.hora_inicio;
    const novoFim = agendamento.hora_fim;

    if (novoFim <= novoInicio) {
      alert(`Na data ${formatarData(parseDateAsLocal(dataStr))}, o horário de término deve ser maior que o de início.`);
      return true;
    }

    if (dataStr === hoje && novoInicio < horaAgora()) {
      alert(`Na data de hoje (${formatarData(parseDateAsLocal(dataStr))}), não é possível escolher horário anterior ao atual.`);
      return true;
    }

    const chave = `${dataStr}|${novoInicio}|${novoFim}`;
    if (vistos.has(chave)) {
      alert(`Você adicionou horários duplicados (${novoInicio} - ${novoFim}) em ${formatarData(parseDateAsLocal(dataStr))}.`);
      return true;
    }
    vistos.add(chave);

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

const handleUnicoFimChange = async () => {
  await validarUnicoImediato();
};

async function irParaInfo() {
  const agendamentosParaSalvar = [];
  if (tipoAgendamento.value === 'Data') {
    if (horarioMode.value === 'mesmo') {
      if (!horarioUnico.value.inicio || !horarioUnico.value.fim) {
        alert('Por favor, defina o horário de início e fim.'); return;
      }
      const hasToday = datasSelecionadas.value.some(d => formatDateToLocal(d) === hojeStr());
      if (hasToday && horarioUnico.value.inicio < horaAgora()) {
        alert('Para hoje, o horário de início não pode ser anterior ao atual.');
        return;
      }
      datasSelecionadas.value.forEach(data => {
        agendamentosParaSalvar.push({
          data: formatDateToLocal(data),
          hora_inicio: horarioUnico.value.inicio,
          hora_fim: horarioUnico.value.fim
        });
      });
    } else {
      if (!horariosMultiplos.value.length) {
        alert('Selecione ao menos uma data.'); return;
      }
      for (let i = 0; i < horariosMultiplos.value.length; i++) {
        const item = horariosMultiplos.value[i];
        if (!item.slots.length) {
          alert(`Adicione ao menos um horário para a data ${formatarData(parseDateAsLocal(item.data))}.`); return;
        }
        for (const slot of item.slots) {
          if (!slot.inicio || !slot.fim) {
            alert(`Defina o horário completo para a data ${formatarData(parseDateAsLocal(item.data))}.`); return;
          }
          agendamentosParaSalvar.push({
            data: item.data,
            hora_inicio: slot.inicio,
            hora_fim: slot.fim
          });
        }
      }
    }
  } else if (tipoAgendamento.value === 'Período Recorrente') {
    if (!dataInicioRecorrente.value || !dataFimRecorrente.value || diasSemanaSelecionados.value.length === 0) {
      alert('Preencha datas e dias da semana do período recorrente.'); return;
    }
    const datas = getRecurrenceDates();
    if (!datas.length) {
      alert('Nenhuma data do período recorrente atende aos dias selecionados.'); return;
    }
    if (horarioModeRecorrente.value === 'mesmo') {
      if (!horarioRecorrente.value.inicio || !horarioRecorrente.value.fim) {
        alert('Defina o horário recorrente.'); return;
      }
      for (const d of datas) {
        agendamentosParaSalvar.push({
          data: formatDateToLocal(d),
          hora_inicio: horarioRecorrente.value.inicio,
          hora_fim: horarioRecorrente.value.fim
        });
      }
    } else {
      if (!recorrenteSlots.value.length) {
        alert('Adicione ao menos um horário recorrente.'); return;
      }
      for (const d of datas) {
        for (const s of recorrenteSlots.value) {
          if (!s.inicio || !s.fim) {
            alert(`Defina todos os horários para o período recorrente.`); return;
          }
          agendamentosParaSalvar.push({
            data: formatDateToLocal(d),
            hora_inicio: s.inicio,
            hora_fim: s.fim
          });
        }
      }
    }
  }

  if (agendamentosParaSalvar.length === 0) {
    alert('Nenhuma data foi selecionada ou gerada.'); return;
  }

  const ymSet = new Set(agendamentosParaSalvar.map(a => {
    const d = parseDateAsLocal(a.data);
    return `${d.getFullYear()}-${d.getMonth()+1}`;
  }));
  for (const ym of ymSet) {
    const [y, m] = ym.split('-').map(Number);
    await fetchDisponibilidade(y, m, true);
  }

  if (validarConflitos(agendamentosParaSalvar)) {
    return;
  }

  for (const ag of agendamentosParaSalvar) {
    const slots = horariosOcupados.value[ag.data] || [];
    for (const s of slots) {
      if (sobrepoe(ag.hora_inicio, ag.hora_fim, s.start, s.end)) {
        alert(`Conflito com reserva das ${s.start} às ${s.end} em ${formatarData(parseDateAsLocal(ag.data))}.`);
        return;
      }
    }
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
@media (max-width:64rem){.content-grid{grid-template-columns:1fr 1fr;gap:1.5rem}.col-times{grid-column:1/-1}}
@media (max-width:48rem){.page-container{padding:0}.card{margin:0;border-radius:0;height:100vh;max-height:none;box-shadow:none}.card-header{padding:1rem;position:sticky;top:0;z-index:10;background-color:#fff}.card-content{padding:1rem;flex-grow:1;overflow-y:auto}.card-footer{padding:1rem;position:sticky;bottom:0;z-index:10}.content-grid{grid-template-columns:1fr;gap:1.5rem;height:auto}.col-calendar,.col-dates,.col-times{height:auto}.opcoes{flex-direction:column;gap:0.75rem;align-items:stretch}.radio-label,.checkbox-label{justify-content:center;padding:0.75rem;border:1px solid #e5e7eb;border-radius:0.5rem;background:#f9fafb}.time-mode{flex-direction:column;gap:1rem}.date-period{flex-direction:column;gap:1rem}.weekdays-grid{grid-template-columns:repeat(4,1fr);gap:0.75rem}.dates-list{max-height:20rem}.slots-container{max-height:12rem}}
@media (max-width:31.25rem){.title{font-size:1.25rem;margin-bottom:0.75rem}.progress-bar{flex-direction:column;gap:0.5rem;margin-bottom:1rem}.line{display:none}.card-header{padding:0.75rem}.card-content{padding:0.75rem}.card-footer{padding:0.75rem}.content-grid{gap:1rem}.weekdays-grid{grid-template-columns:repeat(3,1fr);gap:0.5rem}.weekday-item{padding:0.375rem;font-size:0.75rem}.btn-continue{width:100%;padding:0.875rem 1rem}.opcoes{gap:0.5rem}.radio-label,.checkbox-label{padding:0.5rem;font-size:0.9rem}.same-time-section,.different-times-section{padding:0.75rem}.dates-list{max-height:15rem}.slots-container{max-height:10rem}}
</style>