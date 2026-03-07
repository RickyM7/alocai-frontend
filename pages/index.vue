<template>
  <div class="home">
    <ClientOnly>
      <!-- Boas-vindas -->
      <div class="welcome">
        <h1 v-if="user">Bem-vindo, {{ user.nome.split(' ')[0] }}!</h1>
        <h1 v-else>Bem-vindo ao Alocaí</h1>
        <p v-if="!user">Faça login para gerenciar e criar suas reservas.</p>
      </div>

      <!-- Admin -->
      <template v-if="userStore.isAdmin">
        <!-- Ações rápidas -->
        <div class="quick-actions">
          <NuxtLink to="/agendamentoSelectRecurso" class="action-btn" title="Criar uma nova solicitação de reserva">
            <Icon name="i-lucide-rocket" /> Nova Reserva
          </NuxtLink>
          <NuxtLink to="/minhasReservas" class="action-btn" title="Visualizar e gerenciar as suas reservas">
            <Icon name="i-lucide-calendar" /> Minhas Reservas
          </NuxtLink>
          <NuxtLink to="/explorar" class="action-btn" title="Ver todos os recursos e suas agendas detalhadas em um único lugar">
            <Icon name="i-lucide-compass" />
            <span>Explorar</span>
          </NuxtLink>
        </div>

        <!-- Dashboard / Layout Híbrido (Tabs Mobile / Grid Desktop) -->
        <div class="admin-hybrid-layout">
          <div class="admin-nav-tabs mobile-only">
            <button :class="{ active: currentAdminTab === 'solicitacoes' }" @click="currentAdminTab = 'solicitacoes'">
              <Icon name="i-lucide-clipboard-list" /> Solicitações
              <span v-if="nPendentes > 0" class="badge-count">{{ nPendentes }}</span>
            </button>
            <button :class="{ active: currentAdminTab === 'recursos' }" @click="currentAdminTab = 'recursos'">
              <Icon name="i-lucide-box" /> Recursos
            </button>
            <button :class="{ active: currentAdminTab === 'usuarios' }" @click="currentAdminTab = 'usuarios'">
              <Icon name="i-lucide-users" /> Usuários
            </button>
          </div>

          <div class="admin-grid-panels">
            <!-- Aba/coluna: Solicitações -->
            <div class="panel-wrapper" :class="{ 'mobile-hidden': currentAdminTab !== 'solicitacoes' }">
              <div class="panel sol-panel">
                <div class="panel-head">
                  <h2><Icon name="i-lucide-clipboard-list" /> Solicitações</h2>
                  <div class="tabs">
                    <button :class="{ on: tab === 'andamento' }" @click="tab = 'andamento'">
                      Pendentes <span v-if="nPendentes > 0" class="count">{{ nPendentes }}</span>
                    </button>
                    <button :class="{ on: tab === 'hist' }" @click="tab = 'hist'">Histórico</button>
                  </div>
                </div>
                <div class="panel-scroll">
                  <div v-if="loadingSol" class="center-msg"><Icon name="i-lucide-loader-2" class="spin" /> Carregando...</div>
                  <div v-else-if="errSol" class="center-msg err">{{ errSol }}</div>
                  <div v-else-if="solFiltradas.length === 0" class="center-msg">Nenhuma solicitação.</div>
                  <div v-else class="sol-list">
                    <div v-for="s in solFiltradas" :key="s.id_agendamento_pai" class="sol-card" @click="toggleExpand(s.id_agendamento_pai)">
                      <div class="sol-top">
                        <Icon :name="expanded.includes(s.id_agendamento_pai) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="sol-expand-icon" />
                        <div class="sol-info" :class="{ 'is-expanded': expanded.includes(s.id_agendamento_pai) }">
                          <strong class="truncate-text" :title="s.recurso">{{ s.recurso }}</strong>
                          <span class="sol-sub"><Icon name="i-lucide-user" /> {{ s.solicitante }} · {{ fmtData(s.data_criacao) }}</span>
                        </div>
                        <div class="sol-right">
                          <Icon v-if="loadingIds.has(s.id_agendamento_pai)" name="i-lucide-loader-2" class="spin" style="color: #9ca3af;" />
                          <template v-else>
                            <span :class="getStatusClass(s.status_geral)" class="badge-status">{{ formatarStatus(s.status_geral) }}</span>
                            <div v-if="s.status_geral === 'pendente'" class="sol-btns" @click.stop>
                              <button class="ibtn green" @click="statusPai(s, 'aprovado')" title="Aprovar"><Icon name="i-lucide-check" /></button>
                              <button class="ibtn red" @click="statusPai(s, 'negado')" title="Negar"><Icon name="i-lucide-x" /></button>
                            </div>
                          </template>
                          <button class="ibtn gray" @click.stop="editSol(s)" title="Editar"><Icon name="i-lucide-pencil" /></button>
                        </div>
                      </div>
                      <div v-if="expanded.includes(s.id_agendamento_pai)" class="sol-detail">
                        <p v-if="s.finalidade" style="margin-bottom:0.75rem;"><strong>Finalidade:</strong> {{ s.finalidade }}</p>
                        <div v-for="ag in s.agendamentos_filhos" :key="ag.id_agendamento" class="slot flex-slot">
                          <span style="flex:1;">{{ fmtData(ag.data_inicio) }} · {{ ag.hora_inicio.substring(0, 5) }}–{{ ag.hora_fim.substring(0, 5) }}</span>
                          <Icon v-if="loadingIds.has(ag.id_agendamento)" name="i-lucide-loader-2" class="spin" style="color: #9ca3af; font-size: 0.9rem;" />
                          <template v-else>
                            <span :class="getStatusClass(ag.status_agendamento)" class="badge-status sm">{{ formatarStatus(ag.status_agendamento) }}</span>
                            <div v-if="ag.status_agendamento === 'pendente'" class="slot-btns" @click.stop>
                              <button class="ibtn green sm" @click="statusFilho(s, ag, 'aprovado')" aria-label="Aprovar"><Icon name="i-lucide-check" /></button>
                              <button class="ibtn red sm" @click="statusFilho(s, ag, 'negado')" aria-label="Negar"><Icon name="i-lucide-x" /></button>
                            </div>
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Aba/coluna: Recursos -->
            <AdminRecursos class="panel-wrapper" :class="{ 'mobile-hidden': currentAdminTab !== 'recursos' }" />

            <!-- Aba/coluna: Usuários -->
            <AdminUsuarios class="panel-wrapper" :class="{ 'mobile-hidden': currentAdminTab !== 'usuarios' }" />
          </div>
        </div>
        
        <!-- Modal de edição de solicitação -->
        <AdminSolicitacaoModal 
          :is-open="showSolModal" 
          :solicitacao-id="selectedSolId || undefined" 
          @close="showSolModal = false" 
          @updated="() => fetchSol(true)" 
          @deleted="() => fetchSol(true)" 
        />
      </template>

      <!-- Usuário comum -->
      <div v-else class="user-center">
        <div class="user-buttons">
          <template v-if="canMakeReservations">
            <NuxtLink to="/agendamentoSelectRecurso" class="action-btn lg" title="Criar uma nova solicitação de reserva">
              <Icon name="i-lucide-rocket" /> Nova Reserva
            </NuxtLink>
            <NuxtLink to="/minhasReservas" class="action-btn lg" title="Visualizar e gerenciar as suas reservas">
              <Icon name="i-lucide-calendar" /> Minhas Reservas
            </NuxtLink>
          </template>
          <template v-if="isTerceirizado">
            <NuxtLink to="/usoImediato" class="action-btn lg" title="Registrar a utilização pontual e imediata de um recurso">
              <Icon name="i-lucide-zap" /> Uso Imediato
            </NuxtLink>
          </template>
          <NuxtLink to="/explorar" class="action-btn lg" title="Ver todos os recursos e suas agendas detalhadas em um único lugar">
            <Icon name="i-lucide-compass" /> Explorar
          </NuxtLink>
        </div>
      </div>

      <template #fallback>
        <div class="welcome"><h1>Bem-vindo ao Alocaí</h1></div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, defineAsyncComponent } from 'vue';
import { authenticatedFetch } from '~/utils/api';
import { useRouter } from 'vue-router';
import { getStatusClass, formatarData, formatarStatus, calcularStatusGeral } from '~/utils/formatters';

import { useAdminStore } from '~/stores/admin';

const AdminRecursos = defineAsyncComponent(() => import('~/components/admin/AdminRecursos.vue'));
const AdminUsuarios = defineAsyncComponent(() => import('~/components/admin/AdminUsuarios.vue'));
const AdminSolicitacaoModal = defineAsyncComponent(() => import('~/components/admin/AdminSolicitacaoModal.vue'));

const userStore = useUserStore();
const adminStore = useAdminStore();
const user = computed(() => userStore.user);
const canMakeReservations = computed(() => userStore.isAdmin || userStore.isServidor);
const isTerceirizado = computed(() => userStore.isTerceirizado);
const config = useRuntimeConfig();
const router = useRouter();

const currentAdminTab = ref('solicitacoes');

const solicitacoes = computed(() => adminStore.solicitacoes);
const loadingSol = computed(() => adminStore.loadingSolicitacoes);
const errSol = ref<string | null>(null);
const expanded = ref<number[]>([]);
const tab = ref('andamento');

const showSolModal = ref(false);
const selectedSolId = ref<number | null>(null);
const loadingIds = reactive(new Set<number>());

const nPendentes = computed(() => solicitacoes.value.filter((s: any) => ['pendente', 'parcialmente_aprovado'].includes(s.status_geral)).length);
const solFiltradas = computed(() => {
  const prog = ['pendente', 'aprovado', 'parcialmente_aprovado'];
  return tab.value === 'andamento'
    ? solicitacoes.value.filter((s: any) => prog.includes(s.status_geral))
    : solicitacoes.value.filter((s: any) => !prog.includes(s.status_geral));
});

const fetchSol = async (force = false) => {
  errSol.value = null;
  try { await adminStore.fetchSolicitacoes(force); } 
  catch (e: any) { errSol.value = e.message; }
};

const toggleExpand = (id: number) => {
  const i = expanded.value.indexOf(id);
  i === -1 ? expanded.value.push(id) : expanded.value.splice(i, 1);
};

const statusPai = async (s: any, st: string) => {
  loadingIds.add(s.id_agendamento_pai);
  try {
    const r = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/pai/${s.id_agendamento_pai}/`, {
      method: 'PUT', body: JSON.stringify({ status_agendamento: st }),
    });
    if (!r.ok) throw new Error('Falha.');
    s.agendamentos_filhos.forEach((f: any) => { if (f.status_agendamento === 'pendente') f.status_agendamento = st; });
    s.status_geral = calcularStatusGeral(s.agendamentos_filhos);
  } catch (e: any) {
    errSol.value = e.message;
  } finally {
    loadingIds.delete(s.id_agendamento_pai);
  }
};

const statusFilho = async (s: any, ag: any, st: string) => {
  loadingIds.add(ag.id_agendamento);
  try {
    const r = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/${ag.id_agendamento}/status/`, {
      method: 'PUT', body: JSON.stringify({ status_agendamento: st }),
    });
    if (!r.ok) throw new Error('Falha.');
    ag.status_agendamento = st;
    s.status_geral = calcularStatusGeral(s.agendamentos_filhos);
  } catch (e: any) {
    errSol.value = e.message;
  } finally {
    loadingIds.delete(ag.id_agendamento);
  }
};

const editSol = (s: any) => {
  selectedSolId.value = s.id_agendamento_pai;
  showSolModal.value = true;
};

const fmtData = (d: string) => formatarData(d);

onMounted(() => {
  if (userStore.isAdmin) { fetchSol(); }
});
</script>

<style scoped>
/* Container: preenche viewport sem scroll */
.home {
  padding: 0 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  height: calc(100dvh - 64px - 1.5rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.welcome { padding: 1rem 0 0.5rem; flex-shrink: 0; }
.welcome h1 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.welcome p { color: #6b7280; margin: 0.2rem 0 0; font-size: 0.9rem; }

/* Ações rápidas admin */
.quick-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; flex-shrink: 0; }
.action-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1rem; border-radius: 8px;
  background: #515E54; color: #fff; font-size: 0.82rem; font-weight: 500;
  transition: background 0.15s, transform 0.1s;
}
.action-btn:hover { background: #3d473f; transform: translateY(-1px); }
.action-btn:active { transform: scale(0.97); }
.action-btn.lg { padding: 0.75rem 1.5rem; font-size: 1rem; }

/* === Usuário comum: botões embaixo === */
.user-center {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 2rem;
}
.user-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* === Admin Hub / Hybrid === */
.admin-hybrid-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: transparent;
}

.admin-nav-tabs {
  display: none; /* Esconde no desktop por padrão */
}

.admin-grid-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}

.panel-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

/* Painéis (Solicitações ainda usa panel) */
.panel {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex; flex-direction: column;
  min-height: 0;
  flex: 1;
}
.panel-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem 1.25rem; border-bottom: 1px solid #f3f4f6; flex-shrink: 0; min-height: 64px; box-sizing: border-box;
}
.panel-head h2 {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.95rem; font-weight: 600; color: #111827; margin: 0;
}
.panel-scroll { flex: 1; overflow-y: auto; min-height: 0; }

.tab-pane-full {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

/* Tabs internas (Pendentes / Historico) */
.tabs { display: flex; gap: 0.15rem; background: #f3f4f6; padding: 0.15rem; border-radius: 6px; }
.tabs button {
  flex: 1; padding: 0.35rem 0.65rem; border: none; background: transparent; border-radius: 4px; font-weight: 600; font-size: 0.8rem; color: #6b7280; cursor: pointer; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; justify-content: center; gap: 0.3rem;
}
.tabs button:hover:not(.on) { color: #374151; }
.tabs button.on { background: #fff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.tabs .count {
  background: #ef4444; color: white; padding: 0.1rem 0.45rem; border-radius: 12px; font-size: 0.75rem; font-weight: bold; margin-left: 0.3rem; text-align: center; line-height: 1.4;
}

.center-msg { text-align: center; padding: 2.5rem; color: #9ca3af; font-size: 0.9rem; }
.center-msg.err { color: #ef4444; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Cards de solicitação */
.sol-list { padding: 0; }
.sol-card {
  cursor: pointer; border-bottom: 1px solid #f6f7f8; padding: 0.85rem 1.25rem;
  transition: background 0.1s;
}
.sol-card:last-child { border-bottom: none; }
.sol-card:hover { background: #fafbfc; }
.sol-top { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
.sol-expand-icon { color: #9ca3af; font-size: 1.25rem; flex-shrink: 0; }
.sol-info { flex: 1; min-width: 0; padding-left: 0.25rem; overflow: hidden; }
.sol-info strong { font-size: 0.95rem; color: #111827; }

.truncate-text {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.is-expanded .truncate-text {
  -webkit-line-clamp: unset;
  line-clamp: unset;
  white-space: normal;
}
.sol-sub { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: #9ca3af; margin-top: 0.15rem; }
.sol-right { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
.sol-btns { display: flex; gap: 0.25rem; }

/* Botões inline */
.ibtn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
  font-size: 0.85rem; transition: all 0.12s;
}
.ibtn.sm { width: 22px; height: 22px; font-size: 0.7rem; }
.ibtn.green { background: #22c55e; color: #fff; }
.ibtn.green:hover { background: #16a34a; }
.ibtn.red { background: #ef4444; color: #fff; }
.ibtn.red:hover { background: #dc2626; }
.ibtn.gray { background: #f3f4f6; color: #6b7280; }
.ibtn.gray:hover { background: #e5e7eb; color: #374151; }
.ibtn.ghost { background: transparent; color: #d1d5db; }
.ibtn.ghost:hover { color: #ef4444; background: #fef2f2; }

.badge-status {
  display: inline-block; padding: 0.2rem 0.6rem; border-radius: 12px;
  font-size: 0.7rem; font-weight: 600; text-transform: capitalize; white-space: nowrap;
}
.badge-status.sm { font-size: 0.65rem; padding: 0.15rem 0.45rem; }

.sol-detail { padding: 0.5rem 0 0 1.5rem; font-size: 0.85rem; color: #374151; animation: fadeIn 0.15s; }
.sol-detail p { margin: 0 0 0.5rem; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.slot {
  display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem;
  padding: 0.35rem 0.6rem; background: #f8fafc; border-radius: 6px; margin-bottom: 0.3rem; border: 1px solid #e5e7eb;
}
.slot.flex-slot { display: flex; align-items: center; justify-content: space-between;}
.slot-btns { display: flex; gap: 0.25rem; margin-left: auto; }

/* === Responsivo === */
@media (max-width: 1024px) {
  .admin-grid-panels { grid-template-columns: 1fr 1fr; }
  .panel-wrapper.mobile-hidden { display: flex; } /* Mantém visível em tablets se for grid ainda */
  .admin-grid-panels > .panel-wrapper:first-child { grid-column: span 2; }
}

@media (max-width: 768px) {
  .home { padding: 0 1rem; height: calc(100dvh - 64px); min-height: 0; overflow: hidden; }
  .welcome h1 { font-size: 1.3rem; }
  .quick-actions { justify-content: center; }
  .action-btn { font-size: 0.8rem; padding: 0.5rem 0.85rem; }
  .user-buttons { flex-direction: column; align-items: stretch; max-width: 280px; }
  .action-btn.lg { justify-content: center; }
  
  /* Ativa as Abas */
  .admin-nav-tabs.mobile-only {
    display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background-color: #f3f4f6;
    padding: 0.35rem; border-radius: 8px; overflow-x: auto; scrollbar-width: none;
  }
  .admin-nav-tabs button {
    flex: 1; padding: 0.6rem 1rem; border: none; background: transparent; border-radius: 6px;
    font-weight: 600; font-size: 0.95rem; color: #6b7280; cursor: pointer;
    transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  }
  .admin-nav-tabs button.active { background-color: white; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  
  /* Desativa Grid e ativa Single Panel Mode */
  .admin-grid-panels { display: flex; flex-direction: column; align-items: stretch; }
  .panel-wrapper.mobile-hidden { display: none !important; }
}

@media (max-width: 480px) {
  .home { padding: 0 0.75rem; }
  .welcome h1 { font-size: 1.15rem; }
  .quick-actions { flex-direction: column; align-items: stretch; }
  .action-btn { justify-content: center; }
  .sol-top { flex-direction: column; align-items: flex-start; gap: 0.35rem; }
  .sol-info { padding-left: 0; width: 100%; }
  .sol-right { width: 100%; justify-content: space-between; }
}
</style>