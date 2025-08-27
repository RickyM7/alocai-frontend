<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="progress-bar">
          <Icon name="heroicons:calendar-days-20-solid" class="icon-complete"/>
          <div class="line-complete"></div>
          <Icon name="heroicons:information-circle-20-solid" class="icon-complete"/>
          <div class="line-complete"></div>
          <Icon name="heroicons:check-circle-20-solid" class="icon-active"/>
        </div>
      </div>

      <div class="card-content">
        <div v-if="isLoading" class="status-container">
          <Icon name="i-lucide-loader-2" class="spinner" />
          <h1 class="titulo">Enviando sua solicitação...</h1>
          <p>Por favor, aguarde.</p>
        </div>

        <div v-else-if="erro" class="status-container">
          <Icon name="i-lucide-x-circle" class="icon-error" />
          <h1 class="titulo-erro">Erro ao Salvar</h1>
          <p class="mensagem-erro">{{ erro }}</p>
          <div class="botoes">
            <button class="btn-secundario" @click="voltarParaInicio">Voltar ao Início</button>
            <button class="btn-primario" @click="tentarSalvarNovamente">Tentar Novamente</button>
          </div>
        </div>

        <div v-else-if="agendamentoSalvo" class="sucesso-container">
          <h1 class="titulo">Solicitação enviada!</h1>
          <p class="subtitulo">Sua solicitação está pendente de aprovação.</p>

          <div class="resumo">
            <div class="resumo-item"><strong>Recurso:</strong><span>{{ agendamentoInfo.recurso }}</span></div>
            <div class="resumo-item"><strong>Finalidade:</strong><span>{{ agendamentoInfo.finalidade }}</span></div>
            <div class="resumo-item"><strong>Total de Datas:</strong><span>{{ agendamentoInfo.totalDatas }}</span></div>
            <div class="resumo-item"><strong>Período:</strong><span>{{ agendamentoInfo.periodo }}</span></div>
          </div>

          <div class="botoes">
            <button class="btn-secundario" @click="irParaMinhasReservas">Ver Minhas Reservas</button>
            <button class="btn-primario" @click="novoAgendamento">Novo Agendamento</button>
          </div>
        </div>
        <div v-else class="status-container">
          <p>Solicitação já enviada ou dados inválidos.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAgendamentoStore } from '~/stores/agendamento';
import { useRouter, onBeforeRouteLeave } from 'vue-router';

const store = useAgendamentoStore();
const router = useRouter();

const isLoading = ref(true);
const agendamentoSalvo = ref(false);
const erro = ref('');
const agendamentoInfo = ref({});

function popularResumo() {
  if (store.agendamentos.length === 0) return;

  const primeiraData = new Date(store.agendamentos[0].data);
  const ultimaData = new Date(store.agendamentos[store.agendamentos.length - 1].data);
  const formatar = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  agendamentoInfo.value = {
    recurso: store.recursoSelecionado?.nome_recurso,
    finalidade: store.finalidade,
    totalDatas: store.agendamentos.length,
    periodo: store.agendamentos.length === 1 ? formatar(primeiraData) : `${formatar(primeiraData)} a ${formatar(ultimaData)}`,
  };
}

async function executarSalvamento() {
  if (store.agendamentos.length === 0) {
    isLoading.value = false;
    agendamentoSalvo.value = false;
    return;
  }
  
  popularResumo();
  
  const userDataString = localStorage.getItem('user_data');
  if (!userDataString) {
    erro.value = 'Dados do usuário não encontrados.';
    isLoading.value = false;
    return;
  }
  const userData = JSON.parse(userDataString);
  store.setResponsavel(userData);

  try {
    const resultados = await store.salvarAgendamento();
    if (resultados) {
      agendamentoSalvo.value = true;
    }
  } catch (err) {
    erro.value = err.message || 'Ocorreu um erro desconhecido.';
  } finally {
    isLoading.value = false;
  }
}

function tentarSalvarNovamente() {
  isLoading.value = true;
  erro.value = '';
  executarSalvamento();
}

function voltarParaInicio() { router.push('/'); }
function irParaMinhasReservas() { router.push('/minhasReservas'); }
function novoAgendamento() { router.push('/agendamentoSelectRecurso'); }

onMounted(() => {
  executarSalvamento();
});

onBeforeRouteLeave(() => {
  store.limparStore();
});
</script>

<style scoped>
.page-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.card { width: 100%; max-width: 700px; background-color: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.card-header { padding: 1.5rem 2rem; }
.progress-bar { display: flex; align-items: center; justify-content: center; }
.icon-active { font-size: 1.5rem; color: #2563eb; }
.icon-complete { font-size: 1.5rem; color: #16a34a; }
.line-complete { flex-grow: 1; height: 2px; margin: 0 1rem; background-color: #16a34a; }
.card-content { padding: 2rem; text-align: center; }
.status-container, .sucesso-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.titulo { font-size: 1.75rem; font-weight: bold; }
.subtitulo { color: #6b7280; }
.titulo-erro { font-size: 1.75rem; font-weight: bold; color: #dc2626; }
.mensagem-erro { color: #b91c1c; background-color: #fef2f2; padding: 1rem; border-radius: 8px; }
.spinner { font-size: 3rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.icon-error { font-size: 3rem; color: #dc2626; }
.resumo { text-align: left; background-color: #f9fafb; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border: 1px solid #e5e7eb; }
/* AJUSTE: Reduzido o padding vertical para aproximar os itens */
.resumo-item { display: grid; grid-template-columns: 150px 1fr; gap: 1rem; padding: 0.25rem 0; border-bottom: 1px solid #e5e7eb; }
.resumo-item:last-child { border-bottom: none; }
.resumo-item span { word-break: break-word; }
.botoes { display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; }
.btn-primario { background-color: #374151; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; }
.btn-secundario { background-color: #ffffff; color: #374151; border: 1px solid #d1d5db; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; }
</style>