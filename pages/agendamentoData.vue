<template>
  <backgroundImage />

  <TheHeader />

  <div class="tela fundo-centro centralizado">
    <div class="caixa">
      <!-- Linha de Progresso -->
       <!-- Fase - Agendamento - Data: -->
      <Icon name="heroicons:calendar" class="icone-fase-atual" id="incompleto"/>
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <!-- Fase - Agendamento - Info: -->
      <Icon name="heroicons:user" class="icone-fase-seguinte" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <!-- Fase- Agendamento - Conclusão -->
      <Icon name="heroicons:check" class="icone-fase-seguinte" />

      <h1 class="titulo">Agendar para:</h1>

      <div class="opcoes">
        <label class="circulo">
          <input
            type="radio"
            name="tipo-agendamento"
            value="Datas Específicas"
            v-model="tipoAgendamento"
          />
          Datas Específicas
        </label>
        <label class="circulo">
          <input
            type="radio"
            name="tipo-agendamento"
            value="Período Recorrente"
            v-model="tipoAgendamento"
          />
          Período Recorrente
        </label>
      </div>

      <!-- Caixa com calendário visível apenas se "Data" for selecionado -->
      <div v-if="tipoAgendamento === 'Datas Específicas'" class="caixa-data">
        <label>
          Selecionar datas:
          <Datepicker
            v-model="datasSelecionadas"
            :multi-dates="true"
            :teleport="true"
            placeholder="Selecione datas"
          />
        </label>
        <div
          v-if="datasSelecionadas.length"
          class="lista-datas-selecionadas"
        >
          <h2>Datas selecionadas:</h2>
          <ul>
            <li
              v-for="(data, index) in datasSelecionadas"
              :key="index"
            >
              {{ formatarData(data) }} —
              Horário:
              {{ horariosSelecionados[data.toISOString().split('T')[0]] || 'Não definido' }}
            </li>
          </ul>
        </div>

        <div
          v-for="(data, index) in datasSelecionadas"
          :key="index"
          class="bloco-horario"
        >
          <label>
            {{ formatarData(data) }}:
            <input
              type="time"
              v-model="horariosSelecionados[data.toISOString().split('T')[0]]"
            />
          </label>
        </div>
      </div>


      <!-- Caixa com calendário visível apenas se "Período Recorrente" for selecionado -->
      <div v-if="tipoAgendamento === 'Período Recorrente'" class="caixa-periodo">
      <label>
        Dia da semana:
        <select v-model="diaDaSemana">
          <option disabled value="">Selecione</option>
          <option v-for="(dia, index) in diasSemana" :key="index" :value="dia">
            {{ dia }}
          </option>
        </select>
      </label>

      <label>
        Horário:
        <input type="time" v-model="horarioPeriodo" />
      </label>

      <label>
        Início:
        <input type="date" v-model="dataInicio" />
      </label>

      <label>
        Fim:
        <input type="date" v-model="dataFim" />
      </label>
    </div>

      <button class="botao-prosseguir" @click="irParaInfo">Prosseguir</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useAgendamentoStore } from '~/stores/agendamento'
import { useRouter } from 'vue-router'

const tipoAgendamento = ref('')
const datasSelecionadas = ref([])
const horariosSelecionados = ref({})
const diaDaSemana = ref('')
const horarioPeriodo = ref('')
const dataInicio = ref('')
const dataFim = ref('')

const store = useAgendamentoStore()
const router = useRouter()

const diasSemana = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
]

function formatarData(data){
  return data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function irParaInfo() {
  // Salva os dados no store antes de navegar
  store.setAgendamento({
    tipo: tipoAgendamento.value,
    datas: datasSelecionadas.value,
    horarios: horariosSelecionados.value,
    diaSemana: diaDaSemana.value,
    horarioPeriodo: horarioPeriodo.value,
    inicio: dataInicio.value,
    fim: dataFim.value
  })

  router.push('/agendamentoInfo')
}


</script>

<style scoped>

.navbar {
  width: 100%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  height: 64px;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 10;
}

.navbar-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 32px;
}

.navbar-logo {
  height: 48px;
  margin-right: 32px;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

.navbar-icon {
  font-size: 1.6rem;
  color: #888;
  cursor: pointer;
}

.tela {
  height: 100vh;
  width: 100vw;
  display: flex;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  justify-content: center;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.fundo-centro {
  background-size: cover;
  background-position: center;
  height: 100vh;
  width: 100%;
}

.centralizado {
  justify-content: center;
  align-items: center;
}

.caixa {
  background-color: white;
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
  position: relative;
  padding: 1rem;
  border-radius: 1rem;
  width: 50em;
  min-height: 25em; 
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  overflow-y: auto; /* adiciona rolagem*/
}

.icone-fase-atual,
.icone-fase-seguinte {
  width: 2rem;
  height: 2rem;
  margin-bottom: 0.5rem;
}

.icone-fase-atual {
  color: #2563eb;
}

.icone-fase-seguinte {
  color: hsla(223, 3%, 55%, 0.233);
}

#incompleto{
  color: black;
}

.titulo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.opcoes {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding-top: 1.5rem;
  align-items: center;
}

.circulo {
  display: flex;
  align-items: center;
  padding-left: 10rem;
  gap: 0.5rem;
}

.horario-por-data{
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
}

.caixa-data {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
  max-height: 20em;
  overflow-y: auto;  align-items: flex-start;
  text-align: left;
  padding: 1rem;
  border: 0.1rem solid #ccc;
  border-radius: 0.5rem;
}

.dp__main {
  max-width: 300px;
  font-size: 14px;
}

.bloco-horario label {
  display: flex;
  flex-direction: column;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.caixa-periodo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
  max-height: 20em;
  overflow-y: auto;
  align-items: flex-start;
  text-align: left;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
}
.caixa-periodo label {
  display: flex;
  flex-direction: column;
  font-weight: bold;
}

.botao-prosseguir {
  margin-top: 1.5rem;
  background-color: #374151;
  color: white;
  padding: 0.5rem 1rem;
  bottom: 1rem;
  right: 1rem;
  border-radius: 0.375rem;
  transition: background-color 0.3s;
}

.botao-prosseguir:hover {
  background-color: #1f2937;
}
</style>
