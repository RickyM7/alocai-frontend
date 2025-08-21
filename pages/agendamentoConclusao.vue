<template>
  <backgroundImage />

  <div class="navbar">
    <div class="navbar-content">
      <img src="/img/logo.png" alt="Logo UFAPE" class="navbar-logo" />
      <div class="navbar-actions">
        <Icon name="i-lucide-bell" class="navbar-icon" />
        <Icon name="i-lucide-user-circle" class="navbar-icon" />
      </div>
    </div>
  </div>

  <div class="tela fundo-centro centralizado" :style="{ backgroundImage: `url(${backgroundImage})` }">
    <div class="caixa">
      <!-- Linha de Progresso -->
      <!-- Fase - Agendamento - Data: -->
      <Icon name="heroicons:calendar" class="icone-fase-atual" id="incompleto"/>
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <!-- Fase - Agendamento - Info: -->
      <Icon name="heroicons:user" class="icone-fase-atual" id="incompleto"/>
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <!-- Fase - Agendamento - Conclusão: -->
      <Icon name="heroicons:check" class="icone-fase-atual" id="completo"/>

      <h1 class="titulo">Solicitação concluída com sucesso!</h1>

      <div class="resumo">
        <p><strong>Tipo:</strong> {{ store.tipoAgendamento }}</p>

        <!-- Se for agendamento por datas -->
        <div v-if="store.tipoAgendamento === 'Datas Específicas' && store.datasSelecionadas.length">
          <strong>Datas:</strong>
          <ul>
            <li v-for="(data, i) in store.datasSelecionadas" :key="i">
              {{ new Date(data).toLocaleDateString('pt-BR') }}
              — Horário: {{ store.horariosSelecionados[new Date(data).toISOString().split('T')[0]] || 'Não definido' }}
            </li>
          </ul>
        </div>

        <!-- Se for agendamento recorrente -->
        <div v-else-if="store.tipoAgendamento === 'Período Recorrente'">
          <p><strong>Dia da Semana:</strong> {{ store.diaDaSemana }}</p>
          <p><strong>Horário:</strong> {{ store.horarioPeriodo }}</p>
          <p><strong>Período:</strong> 
            {{ store.dataInicio ? new Date(store.dataInicio).toLocaleDateString('pt-BR') : '-' }}
            até 
            {{ store.dataFim ? new Date(store.dataFim).toLocaleDateString('pt-BR') : '-' }}
          </p>
        </div>

        <!-- Campos comuns -->
        <p><strong>Finalidade:</strong> {{ store.finalidade }}</p>
        <p><strong>Participantes:</strong> {{ store.participantes }}</p>
        <p><strong>Observações:</strong> {{ store.observacoes }}</p>
      </div>


    </div>
</div>
</template>

<script setup>
import { ref } from 'vue'
import '@vuepic/vue-datepicker/dist/main.css'
import { useAgendamentoStore } from '~/stores/agendamento'

const store = useAgendamentoStore()

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

#completo{
  color: rgb(10, 182, 10);
}

.titulo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

</style>