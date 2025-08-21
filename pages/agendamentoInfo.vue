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
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <Icon name="heroicons:chevron-right" class="icone-fase-seguinte" />
      <!-- Fase - Agendamento - Conclusão: -->      
      <Icon name="heroicons:check" class="icone-fase-seguinte"/>

      <h1 class="titulo">Informações Adicionais:</h1>

      <!-- Campos do formulário -->
      <form class="formulario">
        <div class="campo">
          <label for="finalidade">Finalidade do Agendamento</label>
          <input
            type="text"
            id="finalidade"
            v-model="finalidade"
            placeholder="Digite a finalidade..."
          />
        </div>

        <div class="campo">
          <label for="participantes">Número de Participantes</label>
          <input
            type="number"
            id="participantes"
            v-model="participantes"
            placeholder="Ex: 20"
            min="1"
          />
        </div>

        <div class="campo">
          <label for="observacoes">Observações</label>
          <textarea
            id="observacoes"
            v-model="observacoes"
            placeholder="Ex: Notebook, Projetor, etc..."
          ></textarea>
        </div>
        <!-- Botões -->
        <div class="botoes">
          <button type="button" class="btn-secundario">Solicitar Recurso</button>
          <button type="button" class="btn-primario" @click="irParaConclusao">Concluir Agendamento</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import '@vuepic/vue-datepicker/dist/main.css'
import { useRouter } from 'vue-router'
import { useAgendamentoStore } from '~/stores/agendamento'

const finalidade = ref("");
const participantes = ref("");
const observacoes = ref("");

const router = useRouter()
const store = useAgendamentoStore()

function irParaConclusao() {
  store.setInfo({
    finalidade: finalidade.value,
    participantes: participantes.value,
    observacoes: observacoes.value
  })

  router.push('/agendamentoConclusao')
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

.formulario {
  margin-top: 1.5rem;
  text-align: left;
}

.campo {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
}

.campo label {
  font-weight: 500;
  margin-bottom: 0.4rem;
}

.campo input,
.campo textarea {
  border: 0.1rem solid #d1d5db;
  width: 25rem;
  border-radius: 0.5rem;
  padding: 0.6rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.campo input:focus,
.campo textarea:focus {
  border-color: #2563eb;
}

.campo textarea {
  min-height: 5rem;
  width: 25rem;
  resize: vertical;
}

.botoes {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-primario {
  background-color: #374151;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primario:hover {
  background-color: #1f2937;
}

.btn-secundario {
  background-color: #ffffff;
  color: #111827;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secundario:hover {
  background-color: #d1d5db;
}

</style>