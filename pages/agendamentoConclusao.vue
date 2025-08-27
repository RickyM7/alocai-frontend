<template>
  <backgroundImage />
  <TheHeader />

  <div class="tela fundo-centro centralizado">
    <div class="caixa">
      <Icon name="heroicons:calendar" class="icone-fase-atual" id="incompleto"/>
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <Icon name="heroicons:user" class="icone-fase-atual" id="incompleto"/>
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <Icon name="heroicons:chevron-right" class="icone-fase-atual" />
      <Icon name="heroicons:check" class="icone-fase-atual" :id="agendamentoSalvo ? 'completo' : 'incompleto'"/>

      <div v-if="isLoading" class="loading-container">
        <Icon name="i-lucide-loader-2" class="spinner" />
        <h1 class="titulo">Salvando seu agendamento...</h1>
        <p>Por favor, aguarde.</p>
      </div>

      <div v-else-if="erro" class="erro-container">
        <Icon name="i-lucide-x-circle" class="icon-error" />
        <h1 class="titulo-erro">Erro ao salvar agendamento</h1>
        <p class="mensagem-erro">{{ erro }}</p>
        <div class="botoes">
          <button class="btn-primario" @click="tentarSalvarNovamente">
            Tentar Novamente
          </button>
          <button class="btn-secundario" @click="voltarParaInicio">
            Voltar ao Início
          </button>
        </div>
      </div>

      <div v-else-if="agendamentoSalvo" class="sucesso-container">
        <h1 class="titulo">Solicitação concluída com sucesso!</h1>
        <p class="subtitulo">{{ agendamentosCriados.length }} agendamento(s) criado(s)</p>

        <div class="resumo">
          <p><strong>Recurso:</strong> {{ store.recursoSelecionado?.nome_recurso || 'Não especificado' }}</p>
          <p><strong>Tipo:</strong> {{ store.tipoAgendamento }}</p>

          <div v-if="store.tipoAgendamento === 'Datas Específicas' && store.datasSelecionadas.length">
            <strong>Datas:</strong>
            <ul>
              <li v-for="(data, i) in store.datasSelecionadas" :key="i">
                {{ new Date(data).toLocaleDateString('pt-BR') }}
                — Horário: {{ store.horariosSelecionados[new Date(data).toISOString().split('T')[0]] || 'Não definido' }}
              </li>
            </ul>
          </div>

          <div v-else-if="store.tipoAgendamento === 'Período Recorrente'">
            <p><strong>Dia da Semana:</strong> {{ store.diaDaSemana }}</p>
            <p><strong>Horário:</strong> {{ store.horarioPeriodo }}</p>
            <p><strong>Período:</strong> 
              {{ store.dataInicio ? new Date(store.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR') : '-' }}
              até 
              {{ store.dataFim ? new Date(store.dataFim + 'T00:00:00').toLocaleDateString('pt-BR') : '-' }}
            </p>
          </div>

          <p><strong>Finalidade:</strong> {{ store.finalidade }}</p>
          <p><strong>Participantes:</strong> {{ store.participantes }}</p>
          <p><strong>Observações:</strong> {{ store.observacoes || 'Nenhuma' }}</p>
        </div>

        <div class="botoes">
          <button class="btn-secundario" @click="irParaMinhasReservas">
            Ver Minhas Reservas
          </button>
          <button class="btn-primario" @click="novoAgendamento">
            Novo Agendamento
          </button>
        </div>
      </div>
      
      </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAgendamentoStore } from '~/stores/agendamento'
import { useRouter } from 'vue-router'

const store = useAgendamentoStore()
const router = useRouter()

// Variáveis de estado locais para controlar a UI
const isLoading = ref(true)
const agendamentoSalvo = ref(false)
const agendamentosCriados = ref([])
const erro = ref('')

async function executarSalvamento() {
  const userDataString = localStorage.getItem('user_data');
  if (!userDataString) {
    erro.value = 'Dados do usuário não encontrados. Faça login novamente.';
    isLoading.value = false;
    return;
  }
  const userData = JSON.parse(userDataString);
  store.setResponsavel(userData);

  try {
    const resultados = await store.salvarAgendamento();
    if (resultados) {
        agendamentosCriados.value = resultados;
        agendamentoSalvo.value = true;
    }
  } catch (err) {
    if (err instanceof Error) {
      erro.value = err.message;
    } else {
      erro.value = 'Ocorreu um erro desconhecido.';
    }
    console.error('Erro ao salvar:', err);
  } finally {
    isLoading.value = false;
  }
}

function tentarSalvarNovamente() {
  isLoading.value = true;
  erro.value = '';
  agendamentoSalvo.value = false;
  executarSalvamento();
}

// Função para voltar ao início
function voltarParaInicio() {
  store.limparStore()
  router.push('/')
}

// Função para ir para minhas reservas
function irParaMinhasReservas() {
  router.push('/minhasReservas')
}

// Função para novo agendamento
function novoAgendamento() {
  store.limparStore()
  router.push('/recursos') // ou onde começa o fluxo de agendamento
}

// Executar automaticamente ao carregar a página
onMounted(() => {
  executarSalvamento();
})
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
  overflow-y: auto;
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

#incompleto {
  color: black;
}

#completo {
  color: rgb(10, 182, 10);
}

.titulo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.subtitulo {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.titulo-erro {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #dc2626;
}

.mensagem-erro {
  color: #dc2626;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #fef2f2;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
}

.loading-container,
.erro-container,
.sucesso-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  font-size: 3rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.icon-error {
  font-size: 3rem;
  color: #dc2626;
}

.resumo {
  text-align: left;
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  border: 1px solid #e5e7eb;
}

.resumo p {
  margin-bottom: 0.5rem;
}

.resumo ul {
  margin-left: 1rem;
  margin-top: 0.5rem;
}

.resumo li {
  margin-bottom: 0.25rem;
}

.botoes {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn-primario {
  background-color: #374151;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: 500;
}

.btn-primario:hover {
  background-color: #1f2937;
}

.btn-secundario {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-secundario:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}
</style>