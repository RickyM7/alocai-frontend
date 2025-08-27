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
            <Datepicker v-model="datasSelecionadas" multi-dates inline auto-apply :enable-time-picker="false" locale="pt-BR" />
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
                <input type="time" v-model="horarioUnico.inicio" />
                <span>até</span>
                <input type="time" v-model="horarioUnico.fim" />
              </div>
            </div>
            <h4 v-if="datasSelecionadas.length" class="datas-selecionadas-title">Datas Selecionadas:</h4>
            <div class="horarios-lista">
              <div v-for="(data, index) in datasSelecionadas" :key="data.toISOString()" class="horario-item">
                <span>{{ formatarData(data) }}</span>
                <div v-if="horarioMode === 'diferente'" class="time-inputs">
                  <input type="time" v-model="horariosMultiplos[index].inicio" />
                  <span>até</span>
                  <input type="time" v-model="horariosMultiplos[index].fim" />
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
              <input type="date" v-model="dataInicioRecorrente" />
            </div>
            <div class="campo-recorrente">
              <label>Data de Fim:</label>
              <input type="date" v-model="dataFimRecorrente" />
            </div>
            <div class="campo-recorrente">
              <label>Horário:</label>
              <div class="time-inputs">
                <input type="time" v-model="horarioRecorrente.inicio" />
                <span>até</span>
                <input type="time" v-model="horarioRecorrente.fim" />
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
import { ref, watch } from 'vue';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useAgendamentoStore } from '~/stores/agendamento';
import { useRouter } from 'vue-router';

// State for both modes
const tipoAgendamento = ref('Data');
const router = useRouter();
const store = useAgendamentoStore();

// State for "Datas Específicas"
const horarioMode = ref('mesmo');
const datasSelecionadas = ref([]);
const horarioUnico = ref({ inicio: '', fim: '' });
const horariosMultiplos = ref([]);

// State for "Período Recorrente"
const dataInicioRecorrente = ref('');
const dataFimRecorrente = ref('');
const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const diasSemanaSelecionados = ref([]);
const horarioRecorrente = ref({ inicio: '', fim: '' });

// Watchers and Functions
watch(datasSelecionadas, (novasDatas) => {
  novasDatas.sort((a, b) => a - b);
  horariosMultiplos.value = novasDatas.map(data => ({
    data: data.toISOString().split('T')[0],
    inicio: '',
    fim: ''
  }));
}, { deep: true });

function formatarData(data) {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function irParaInfo() {
  const agendamentosParaSalvar = [];

  if (tipoAgendamento.value === 'Data') {
    // Logic for "Datas Específicas"
    if (horarioMode.value === 'mesmo') {
      if (!horarioUnico.value.inicio || !horarioUnico.value.fim) {
        alert('Por favor, defina o horário de início e fim.'); return;
      }
      datasSelecionadas.value.forEach(data => {
        agendamentosParaSalvar.push({
          data: data.toISOString().split('T')[0],
          hora_inicio: horarioUnico.value.inicio,
          hora_fim: horarioUnico.value.fim
        });
      });
    } else { // modo 'diferente'
      for (const horario of horariosMultiplos.value) {
        if (!horario.inicio || !horario.fim) {
          alert(`Por favor, defina o horário de início e fim para a data ${formatarData(new Date(horario.data))}.`); return;
        }
        agendamentosParaSalvar.push({
          data: horario.data,
          hora_inicio: horario.inicio,
          hora_fim: horario.fim
        });
      }
    }
  } else if (tipoAgendamento.value === 'Período Recorrente') {
    // Logic for "Período Recorrente"
    if (!dataInicioRecorrente.value || !dataFimRecorrente.value || diasSemanaSelecionados.value.length === 0 || !horarioRecorrente.value.inicio || !horarioRecorrente.value.fim) {
      alert('Por favor, preencha todos os campos do período recorrente.'); return;
    }

    let dataAtual = new Date(dataInicioRecorrente.value);
    const dataFim = new Date(dataFimRecorrente.value);

    while (dataAtual <= dataFim) {
      if (diasSemanaSelecionados.value.includes(dataAtual.getUTCDay())) {
        agendamentosParaSalvar.push({
          data: dataAtual.toISOString().split('T')[0],
          hora_inicio: horarioRecorrente.value.inicio,
          hora_fim: horarioRecorrente.value.fim
        });
      }
      dataAtual.setUTCDate(dataAtual.getUTCDate() + 1);
    }
  }

  if (agendamentosParaSalvar.length === 0) {
    alert('Nenhuma data foi selecionada ou gerada. Verifique os filtros.'); return;
  }

  store.setDatasEHorarios(agendamentosParaSalvar);
  router.push('/agendamentoInfo');
}
</script>

<style scoped>
.page-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.card { width: 100%; max-width: 950px; background-color: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; height: 85vh; max-height: 700px; }
.card-header { padding: 1.5rem 2rem; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
.progress-bar { display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
.icon-active { font-size: 1.5rem; color: #2563eb; }
.icon-inactive { font-size: 1.5rem; color: #d1d5db; }
.line { flex-grow: 1; height: 2px; background-color: #e5e7eb; margin: 0 1rem; }
.title { font-size: 1.75rem; font-weight: 700; text-align: center; margin: 0 0 1rem; }
.opcoes { display: flex; justify-content: center; gap: 1.5rem; }
.radio-label, .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; }
.radio-label-sm { font-size: 0.9rem; }
.card-content { flex-grow: 1; overflow-y: none; min-height: 0; }
.card-content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem; align-items: flex-start; }
.col-right { display: flex; flex-direction: column; height: 350px; overflow: hidden; }
.horario-toggle { flex-shrink: 0; display: flex; gap: 1rem; padding-bottom: 1rem; }
.horario-fixo { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; }
.datas-selecionadas-title { flex-shrink: 0; margin: 1rem 0 0.5rem; font-weight: bold; }
.horarios-lista { flex-grow: 1; overflow-y: auto; padding-right: 1rem; border-top: 1px solid #f3f4f6; min-height: 0; position: relative; z-index: 1; }
.horario-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; }
.time-inputs { display: flex; align-items: center; gap: 0.5rem; }
input[type="time"] { border: 1px solid #d1d5db; border-radius: 6px; padding: 0.25rem; }
.col-right-recorrente { display: flex; flex-direction: column; gap: 1.5rem; }
.campo-recorrente { width: 100%; }
.campo-recorrente label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.dias-semana-checkboxes { display: flex; flex-direction: column; gap: 0.75rem; }
input[type="date"], select { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; }
.card-footer { padding: 1rem 2rem; border-top: 1px solid #e5e7eb; text-align: right; flex-shrink: 0; position: relative; z-index: 10; background-color: white; box-shadow: 0 -2px 8px rgba(0,0,0,0.05); }
.botao-prosseguir { background-color: #374151; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; border: none; cursor: pointer; }
</style>