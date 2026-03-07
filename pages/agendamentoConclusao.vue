<template>
  <div class="flow-layout">
    <div class="flow-panel">
      <!-- Header do painel -->
      <div class="panel-head">
        <div class="head-left">
          <button @click="voltarParaInicio" class="btn-back" title="Início" v-if="erro || agendamentoSalvo">
            <Icon name="i-lucide-home" />
          </button>
          <div>
            <h2>Status da Solicitação</h2>
            <p>Resumo e processamento de sua reserva.</p>
          </div>
        </div>
        <div class="progress-bar hidden-mobile">
          <Icon name="i-lucide-calendar" class="icon-completed"/>
          <div class="line"></div>
          <Icon name="i-lucide-file-text" class="icon-completed"/>
          <div class="line"></div>
          <Icon name="i-lucide-check-circle-2" class="icon-active"/>
        </div>
      </div>

      <!-- Corpo do painel rolável -->
      <div class="panel-scroll">
        <div class="panel-padding conclusao-center-content">
          <div v-if="isLoading" class="status-container">
            <Icon name="i-lucide-loader-2" class="spinner" />
            <h1 class="title">Processando reserva...</h1>
            <p class="subtitle">Enviando sua solicitação ao servidor. Por favor, aguarde.</p>
          </div>

          <div v-else-if="erro" class="status-container status-error">
            <Icon name="i-lucide-x-circle" class="icon-error" />
            <h1 class="title-error">Erro ao Salvar</h1>
            <p class="error-message">{{ erro }}</p>
          </div>

          <div v-else-if="agendamentoSalvo" class="sucesso-container">
            <div class="success-icon-wrapper">
              <Icon name="i-lucide-check" class="icon-success-large" />
            </div>
            <h1 class="title">Solicitação Enviada!</h1>
            <p class="subtitle mt-1">Sua solicitação foi registrada e está pendente de aprovação.</p>
            
            <div class="resumo-box mt-4">
              <h3 class="resumo-box-title">Resumo do Agendamento</h3>
              <div class="resumo-grid">
                <div class="resumo-item">
                  <span class="label">Recurso</span>
                  <strong class="value truncate" :title="agendamentoInfo.recurso">{{ agendamentoInfo.recurso }}</strong>
                </div>
                <div class="resumo-item">
                  <span class="label">Total de Sessões</span>
                  <strong class="value">{{ agendamentoInfo.totalDatas }} {{ agendamentoInfo.totalDatas === 1 ? 'Data' : 'Datas' }}</strong>
                </div>
                <div class="resumo-item">
                  <span class="label">Finalidade</span>
                  <strong class="value">{{ agendamentoInfo.finalidade }}</strong>
                </div>
                <div class="resumo-item">
                  <span class="label">Período</span>
                  <strong class="value">{{ agendamentoInfo.periodo }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="status-container">
            <Icon name="i-lucide-alert-circle" class="icon-warning" />
            <p class="subtitle">Dados incompletos. Redirecionando...</p>
          </div>
        </div>
      </div>

      <!-- Footer fixo (ações) -->
      <div class="panel-footer" v-if="erro || agendamentoSalvo">
        <div v-if="erro" class="footer-buttons">
          <button class="btn btn-outline" @click="voltarParaInicio">
            <Icon name="i-lucide-arrow-left" /> Voltar ao Início
          </button>
          <button class="btn btn-primary" @click="tentarSalvarNovamente">
            <Icon name="i-lucide-refresh-cw" /> Tentar Novamente
          </button>
        </div>
        <div v-if="agendamentoSalvo" class="footer-buttons">
          <button class="btn btn-outline" @click="irParaMinhasReservas">
            <Icon name="i-lucide-list" /> Minhas Reservas
          </button>
          <button class="btn btn-outline" @click="voltarParaInicio" v-if="userStore.isAdmin">
             <Icon name="i-lucide-inbox" /> Solicitações
          </button>
          <button class="btn btn-primary" @click="novoAgendamento">
            <Icon name="i-lucide-plus" /> Novo Agendamento
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAgendamentoStore } from '~/stores/agendamento';
import { useUserStore } from '~/stores/user';
import { useAdminStore } from '~/stores/admin';
import { useRouter, onBeforeRouteLeave } from 'vue-router';

definePageMeta({ middleware: 'auth' });
const store = useAgendamentoStore();
const router = useRouter();

const isLoading = ref(true);
const agendamentoSalvo = ref(false);
const erro = ref('');

interface AgendamentoResumo {
  recurso: string | undefined;
  finalidade: string;
  totalDatas: number;
  periodo: string;
}

const agendamentoInfo = ref<AgendamentoResumo>({
  recurso: '',
  finalidade: '',
  totalDatas: 0,
  periodo: ''
});

const parseDateAsLocal = (dateStr: string) => new Date(dateStr + 'T00:00:00');

function popularResumo() {
  if (store.agendamentos.length === 0) return;

  const primeiraData = parseDateAsLocal(store.agendamentos[0].data);
  const ultimaData = parseDateAsLocal(store.agendamentos[store.agendamentos.length - 1].data);
  const formatar = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  agendamentoInfo.value = {
    recurso: store.recursoSelecionado?.nome_recurso,
    finalidade: store.finalidade,
    totalDatas: store.agendamentos.length,
    periodo: store.agendamentos.length === 1 ? formatar(primeiraData) : `${formatar(primeiraData)} a ${formatar(ultimaData)}`,
  };
}

function voltarParaInicio() { router.push('/'); }
function irParaMinhasReservas() { router.push('/minhasReservas'); }
function novoAgendamento() { router.push('/agendamentoSelectRecurso'); }

const userStore = useUserStore(); // Re-adicionado uso do userStore para o botão extra de admin

onMounted(() => {
  const isAlreadySaved = sessionStorage.getItem('alocai_agendamento_salvo');
  if (isAlreadySaved === 'true') {
    sessionStorage.removeItem('alocai_agendamento_salvo');
    router.push('/');
    return;
  }
  executarSalvamento();
});

async function executarSalvamento() {
  if (store.agendamentos.length === 0) {
    isLoading.value = false;
    agendamentoSalvo.value = false;
    return;
  }

  popularResumo();

  const userData = userStore.user;
  if (!userData) {
    erro.value = 'Dados do usuário não encontrados.';
    isLoading.value = false;
    return;
  }
  
  store.setResponsavel(userData);

  try {
    const resultados = await store.salvarAgendamento();
    if (resultados) {
      agendamentoSalvo.value = true;
      sessionStorage.setItem('alocai_agendamento_salvo', 'true');
      store.limparStore(); // Limpa estado para que o F5 não reenvie.
      // Invalida o cache para que o index mostre a nova solicitação
      const adminStore = useAdminStore();
      adminStore.lastFetchSolicitacoes = 0;
    }
  } catch (err: unknown) {
    erro.value = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
  } finally {
    isLoading.value = false;
  }
}

function tentarSalvarNovamente() {
  isLoading.value = true;
  erro.value = '';
  executarSalvamento();
}

onBeforeRouteLeave(() => {
  store.limparStore();
  sessionStorage.removeItem('alocai_agendamento_salvo');
});
</script>

<style scoped>
/* OVERRIDES do layout global */
.flow-panel { height: auto; min-height: 85dvh; max-height: 90vh; }
.panel-head { padding: 1rem 1.5rem; }
.panel-scroll { display: flex; flex-direction: column; }
.panel-padding { width: 100%; display: flex; flex-direction: column; }
.panel-footer { align-items: center; }

.progress-bar { display: flex; align-items: center; }
.icon-active { font-size: 1.3rem; color: #2563eb; }
.icon-completed { font-size: 1.3rem; color: #16a34a; }
.line { width: 40px; height: 0.125rem; background-color: #16a34a; margin: 0 0.5rem; border-radius: 2px;}

.conclusao-center-content { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; }

/* STATUS CONTAINERS */
.status-container, .sucesso-container { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; width: 100%; max-width: 600px; margin: 0 auto; }
.mt-1 { margin-top: 0.25rem; }
.mt-4 { margin-top: 1.25rem; }

.title { font-size: 1.55rem; font-weight: 800; margin: 0; color: #111827; line-height: 1.2; }
.subtitle { color: #4b5563; margin: 0; font-size: 0.95rem; line-height: 1.5; }
.title-error { font-size: 1.55rem; font-weight: 800; color: #dc2626; margin: 0; line-height: 1.2; }

.spinner { font-size: 2.75rem; color: #3b82f6; margin-bottom: 1rem; }
.icon-error { font-size: 3.25rem; color: #dc2626; margin-bottom: 0.5rem; }
.icon-warning { font-size: 2.75rem; color: #f59e0b; margin-bottom: 0.5rem; }
.error-message { background-color: #fef2f2; color: #991b1b; padding: 1rem; border-radius: 8px; border: 1px solid #fecaca; width: 100%; font-size: 0.9rem; font-weight: 500; margin-top: 0.75rem; }

.success-icon-wrapper { width: 64px; height: 64px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; box-shadow: 0 0 0 6px #f0fdf4; }
.icon-success-large { font-size: 2.75rem; color: #16a34a; }

/* RESUMO BOX */
.resumo-box { background: #fff; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 12px; width: 100%; text-align: left; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.resumo-box-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem;}
.resumo-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
.resumo-item { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.resumo-item .label { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.resumo-item .value { font-size: 0.95rem; font-weight: 600; color: #0f172a; display: block; }
@media (min-width: 769px) {
  .resumo-item .value.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
}
@media (max-width: 768px) {
  .resumo-item .value { white-space: normal; word-break: break-word; }
}

/* FOOTER BUTTONS */
.footer-buttons { display: flex; gap: 0.75rem; width: 100%; justify-content: flex-end; }
.footer-buttons .btn { flex: 1; max-width: 260px; justify-content: center; }

/* OVERRIDE: btn nesta page */
.btn { padding: 0.75rem 1.75rem; white-space: nowrap; }
.btn-primary:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transform: translateY(-1px); }
.btn-outline { background: #fff; color: #4b5563; border: 1px solid #d1d5db; }
.btn-outline:hover { background: #f9fafb; color: #111827; border-color: #9ca3af; }

@media (max-width: 768px) {
  .panel-padding { flex: 1; min-height: 0; padding: 1.5rem 1rem; }
  .hidden-mobile { display: none; }
  .title, .title-error { font-size: 1.5rem; }
  .footer-buttons { flex-direction: column-reverse; gap: 0.75rem; }
  .footer-buttons .btn { max-width: 100%; }
}
</style>