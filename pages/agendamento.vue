<template>
  <div class="tela fundo-centro centralizado">
    <div class="caixa">
      <!-- Linha de progresso -->
      <Icon name="heroicons:calendar" class="icone-fase-atual" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <Icon name="heroicons:user" class="icone-fase-seguinte" />

      <h1 class="titulo">Agendar para:</h1>

      <div class="opcoes">
        <label class="circulo">
          <input
            type="radio"
            name="tipo-agendamento"
            value="data"
            v-model="tipoAgendamento"
          />
          Data
        </label>
        <label class="circulo">
          <input
            type="radio"
            name="tipo-agendamento"
            value="recorrente"
            v-model="tipoAgendamento"
          />
          Período Recorrente
        </label>
      </div>

      <!-- Caixa com calendário visível apenas se "Data" for selecionado -->
      <div v-if="tipoAgendamento === 'data'" class="caixa-calendario"
      >
        <Datepicker
        v-model="datasSelecionadas" 
        :multiple="true"
        :teleport="true"
        placeholder="Selecione os dias desejados" 
        />

        <div
          v-for="(data, index) in datasSelecionadas"
          :key="index" 
          class="horario-por-data"
          >
            <p>{{ formatarData(data) }}</p>
            <input 
              type="time"
              v-model="horariosSelecionados[data.toISOString().split('T')[0]]"
          />
        </div>
      </div>

      <button class="botao-prosseguir">Prosseguir</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const tipoAgendamento = ref('')
const datasSelecionadas = ref([])
const horariosSelecionados = ref({})

function formatarData(data){
  return data.toLocaleDatesString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

</script>

<style scoped>
.tela {
  height: 100vh;
  width: 100%;
  display: flex;
  background-size: cover;
  background-position: center;
}

.fundo-centro {
  background-image: url('/img/ufape-fundo.jpg');
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
  height: 30em;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
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

.titulo {
  font-size: 1.25rem;
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
  padding-left: 12rem;
  gap: 0.5rem;
}

.caixa-calendario {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.caixa-calendario .dp__main{
  transform: scale(0.8);
  transform-origin: top center;
}

.horario-por-data{
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
}

.botao-prosseguir {
  margin-top: 1.5rem;
  background-color: #374151;
  color: white;
  padding: 0.5rem 1rem;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  border-radius: 0.375rem;
  transition: background-color 0.3s;
}

.botao-prosseguir:hover {
  background-color: #1f2937;
}
</style>
