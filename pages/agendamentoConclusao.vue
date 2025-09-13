<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="progress-bar">
          <Icon name="heroicons:calendar-days-20-solid" class="icon-inactive"/>
          <div class="line"></div>
          <Icon name="heroicons:information-circle" class="icon-inactive"/>
          <div class="line"></div>
          <Icon name="heroicons:check-circle" class="icon-active"/>
        </div>
      </div>

      <div class="card-content">
        <div v-if="isLoading" class="status-container">
          <Icon name="i-lucide-loader-2" class="spinner" />
          <h1 class="title">Enviando sua solicitação...</h1>
          <p>Por favor, aguarde.</p>
        </div>

        <div v-else-if="erro" class="status-container">
          <Icon name="i-lucide-x-circle" class="icon-error" />
          <h1 class="title-error">Erro ao Salvar</h1>
          <p class="error-message">{{ erro }}</p>
          <div class="card-footer">
            <button class="botao-secundario" @click="voltarParaInicio">Voltar ao Início</button>
            <button class="botao-prosseguir" @click="tentarSalvarNovamente">Tentar Novamente</button>
          </div>
        </div>

        <div v-else-if="agendamentoSalvo" class="sucesso-container">
          <h1 class="title">Solicitação enviada!</h1>
          <p class="subtitle">Sua solicitação está pendente de aprovação.</p>

          <div class="resumo-section">
            <div class="resumo-item">
              <span class="label">Recurso:</span>
              <span class="value">{{ agendamentoInfo.recurso }}</span>
            </div>
            <div class="resumo-item">
              <span class="label">Finalidade:</span>
              <span class="value">{{ agendamentoInfo.finalidade }}</span>
            </div>
            <div class="resumo-item">
              <span class="label">Total de Datas:</span>
              <span class="value">{{ agendamentoInfo.totalDatas }}</span>
            </div>
            <div class="resumo-item">
              <span class="label">Período:</span>
              <span class="value">{{ agendamentoInfo.periodo }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="botao-secundario" @click="irParaMinhasReservas">Ver Minhas Reservas</button>
            <button class="botao-prosseguir" @click="novoAgendamento">Novo Agendamento</button>
          </div>
        </div>

        <div v-else class="status-container">
          <p>Dados incompletos. Redirecionando...</p>
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

const parseDateAsLocal = (dateStr) => new Date(dateStr + 'T00:00:00');

function popularResumo() {
  if (store.agendamentos.length === 0) return;

  const primeiraData = parseDateAsLocal(store.agendamentos[0].data);
  const ultimaData = parseDateAsLocal(store.agendamentos[store.agendamentos.length - 1].data);
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
.card { width: 100%; max-width: 60rem; background-color: white; border-radius: 0.75rem; box-shadow: 0 0.625rem 1.875rem rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; height: 85vh; max-height: 43.75rem; }
.card-header { padding: 1.5rem 2rem; border-bottom: 0.063rem solid #e5e7eb; flex-shrink: 0; }
.progress-bar { display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
.icon-active { font-size: 1.5rem; color: #2563eb; }
.icon-inactive { font-size: 1.5rem; color: #16a34a; }
.line { flex-grow: 1; height: 0.125rem; background-color: #16a34a; margin: 0 1rem; }
.card-content { padding: 2rem; flex-grow: 1; overflow-y: auto; min-height: 0; display: flex; flex-direction: column; justify-content: center; }
.status-container, .sucesso-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; }
.title { font-size: 1.75rem; font-weight: 700; margin: 0; }
.subtitle { color: #6b7280; margin: 0; }
.title-error { font-size: 1.75rem; font-weight: 700; color: #dc2626; margin: 0; }
.error-message { color: #b91c1c; background-color: #fef2f2; padding: 1rem; border-radius: 0.5rem; border: 0.063rem solid #fecaca; }
.spinner { font-size: 3rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.icon-error { font-size: 3rem; color: #dc2626; }
.resumo-section { background-color: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; width: 100%; max-width: 25rem; }
.resumo-item { margin-bottom: 1rem; }
.resumo-item:last-child { margin-bottom: 0; }
.resumo-item .label { display: block; font-size: 0.9rem; color: #6b7280; }
.resumo-item .value { font-weight: 500; word-break: break-word; }
.card-footer { display: flex; gap: 1rem; justify-content: center; margin-top: 0.5rem; flex-wrap: wrap; }
.botao-prosseguir { background-color: #374151; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; border: none; cursor: pointer; font-size: 1rem; }
.botao-secundario { background-color: #ffffff; color: #374151; border: 0.063rem solid #d1d5db; padding: 0.75rem 2rem; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; }
.botao-prosseguir:hover { background-color: #1f2937; }
.botao-secundario:hover { background-color: #f9fafb; }
@media (max-width: 48rem) {
  .card { max-height: none; height: auto; margin: 1rem; }
  .card-footer { flex-direction: column; }
  .botao-prosseguir, .botao-secundario { width: 100%; padding: 0.75rem; }
  .resumo-section { max-width: none; }
}
@media (max-width: 31.25rem) {
  .title, .title-error { font-size: 1.25rem; }
  .progress-bar { flex-direction: column; gap: 0.5rem; }
  .line { display: none; }
}
</style>