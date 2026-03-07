<template>
  <div class="home">
    <!-- Header -->
    <div class="welcome">
      <button @click="$router.push('/')" class="btn-back">
        <Icon name="i-lucide-arrow-left" />
      </button>
      <h1><Icon name="i-lucide-zap" /> Uso Imediato</h1>
    </div>

    <!-- Layout Híbrido (Tabs Mobile / Grid Desktop) -->
    <div class="admin-hybrid-layout">
      <!-- Navegação Mobile (escondida no desktop) -->
      <div class="admin-nav-tabs mobile-only">
        <button :class="{ active: currentTab === 'novo' }" @click="currentTab = 'novo'">
          <Icon name="i-lucide-plus-circle" /> Novo Uso
        </button>
        <button :class="{ active: currentTab === 'em_uso' }" @click="currentTab = 'em_uso'">
          <Icon name="i-lucide-radio" /> Em Uso
          <span v-if="ativos.length > 0" class="badge-count">{{ ativos.length }}</span>
        </button>
        <button :class="{ active: currentTab === 'historico' }" @click="currentTab = 'historico'">
          <Icon name="i-lucide-history" /> Histórico
        </button>
      </div>

      <div class="admin-grid-panels">
        <!-- Coluna 1: Novo Uso -->
        <div class="panel-wrapper" :class="{ 'mobile-hidden': currentTab !== 'novo' }">
          <div class="panel">
            <div class="panel-head">
              <h2>Novo Uso</h2>
            </div>
            <div class="panel-scroll panel-padding">
              <form @submit.prevent="registrar" class="form">
                <div class="field">
                  <label>Recurso</label>
                  <select v-model="form.recurso" required class="truncate-select" :title="recursos.find(r => r.id_recurso === form.recurso)?.nome_recurso || 'Selecione...'">
                    <option :value="null" disabled>Selecione...</option>
                    <option v-for="r in recursos" :key="r.id_recurso" :value="r.id_recurso" :title="r.nome_recurso">{{ r.nome_recurso }}</option>
                  </select>
                </div>
                <div class="field">
                  <label>Duração</label>
                  <div class="dur-row">
                    <div class="dur-field">
                      <input v-model.number="durHoras" type="number" min="0" max="24" step="1" 
                        @input="sanitizeNumericInput" />
                      <span class="dur-label">h</span>
                    </div>
                    <span class="dur-sep">e</span>
                    <div class="dur-field">
                      <input v-model.number="durMinutos" type="number" min="0" max="59" step="1" 
                        @input="sanitizeNumericInput" />
                      <span class="dur-label">min</span>
                    </div>
                  </div>
                </div>
                <div class="field">
                  <label>Finalidade <span class="opt">(opcional)</span></label>
                  <input v-model="form.finalidade" type="text" placeholder="Ex: Manutenção" maxlength="255" />
                </div>
                <div class="field">
                  <label>Observações <span class="opt">(opcional)</span></label>
                  <textarea v-model="form.obs" placeholder="..." rows="2" style="resize: none;"></textarea>
                </div>
                <div v-if="duracaoTotal > 0 && duracaoTotal < 15" class="erro warning">
                  <Icon name="i-lucide-info" /> Duração mínima é de 15 minutos.
                </div>
                <p v-if="erro" class="erro"><Icon name="i-lucide-alert-circle" /> {{ erro }}</p>
                <button type="submit" class="btn btn-primary full-width" :disabled="!form.recurso || duracaoTotal < 15">
                  <Icon v-if="registrando" name="i-lucide-loader-2" class="spin" />
                  <Icon v-else name="i-lucide-play" />
                  <span>Iniciar Uso</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Coluna 2: Em Uso -->
        <div class="panel-wrapper" :class="{ 'mobile-hidden': currentTab !== 'em_uso' }">
          <div class="panel">
            <div class="panel-head">
              <h2>Em Uso</h2>
            </div>
            <div class="panel-scroll">
              <div v-if="ativos.length === 0" class="center-msg">Nenhum recurso em uso.</div>
              <div v-for="u in ativos" :key="u.id_uso" class="ativo">
                <div class="ativo-top">
                  <Icon name="i-lucide-radio" class="pulse" />
                  <span class="timer" :class="{ alerta: restante(u) <= 30 }">{{ timerFmt(u) }}</span>
                </div>
                <div class="ativo-info">
                  <strong class="truncate-text" :title="u.recurso_nome">{{ u.recurso_nome }}</strong>
                  <p v-if="u.finalidade" class="ativo-fin"><strong>Finalidade:</strong> {{ u.finalidade }}</p>
                  <p v-if="u.observacoes" class="ativo-obs"><strong>Obs:</strong> {{ u.observacoes }}</p>
                </div>
                <div class="ativo-meta mt-1">
                  <span><Icon name="i-lucide-clock" /> {{ fmtDate(u.data_inicio) }}</span>
                  <span><Icon name="i-lucide-timer" /> {{ fmtDur(u.duracao_minutos) }}</span>
                </div>
                <button class="btn btn-outline btn-sm btn-icon-danger full-width mt-2" 
                  :disabled="finId === u.id_uso" @click="finalizar(u.id_uso)">
                  <Icon v-if="finId === u.id_uso" name="i-lucide-loader-2" class="spin" />
                  <Icon v-else name="i-lucide-power" /> 
                  <span>Finalizar Uso</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna 3: Histórico -->
        <div class="panel-wrapper" :class="{ 'mobile-hidden': currentTab !== 'historico' }">
          <div class="panel">
            <div class="panel-head">
              <h2>Histórico</h2>
            </div>
            <div class="panel-scroll">
              <div v-if="loading" class="center-msg">
                <Icon name="i-lucide-loader-2" class="spin" />
              </div>
              <div v-else-if="finalizados.length === 0" class="center-msg">Nenhum registro.</div>
              <div v-else>
                <div v-for="u in finalizados" :key="u.id_uso" class="hist" @click="toggleHist(u.id_uso)">
                  <div class="hist-top">
                    <Icon :name="expandedHist.includes(u.id_uso) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="expand-icon" />
                    <div class="hist-info" :class="{ 'is-expanded': expandedHist.includes(u.id_uso) }">
                      <strong :title="u.recurso_nome">{{ u.recurso_nome }}</strong>
                      <span class="hist-sub">{{ fmtDate(u.data_inicio) }} · {{ fmtDur(u.duracao_minutos) }}</span>
                    </div>
                    <span class="status-badge" :class="u.expirado ? 'status-warning' : 'status-success'">{{ u.expirado ? 'Expirado' : 'Concluído' }}</span>
                  </div>
                  <div v-if="expandedHist.includes(u.id_uso)" class="hist-detail">
                    <p v-if="u.finalidade"><strong>Finalidade:</strong> {{ u.finalidade }}</p>
                    <p v-if="u.observacoes"><strong>Obs:</strong> {{ u.observacoes }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { authenticatedFetch } from '~/utils/api';
definePageMeta({ middleware: 'auth' });

const api = useRuntimeConfig().public.apiUrl;
const currentTab = ref('novo');
const form = reactive({ recurso: null as number | null, finalidade: '', obs: '' });
const durHoras = ref(2);
const durMinutos = ref(0);

const recursos = ref<any[]>([]);
const hist = ref<any[]>([]);
const erro = ref<string | null>(null);
const registrando = ref(false);
const finId = ref<number | null>(null);
const loading = ref(true);

const expandedHist = ref<number[]>([]);
const toggleHist = (id: number) => {
  if (expandedHist.value.includes(id)) {
    expandedHist.value = expandedHist.value.filter(i => i !== id);
  } else {
    expandedHist.value.push(id);
  }
};

const ativos = computed(() => hist.value.filter(u => u.ativo));
const finalizados = computed(() => hist.value.filter(u => !u.ativo));

// Duração total em minutos
const duracaoTotal = computed(() => durHoras.value * 60 + durMinutos.value);

const restante = (u: any) => Math.max(0, Math.round((new Date(u.data_inicio).getTime() + u.duracao_minutos * 60000 - Date.now()) / 60000));

const timerFmt = (u: any) => {
  const m = restante(u);
  if (m <= 0) return 'Expirado';
  const h = Math.floor(m / 60), min = m % 60;
  if (h > 0 && min > 0) return `${h}h e ${min}min`;
  if (h > 0) return `${h}h`;
  return `${min}min`;
};

const fmtDur = (min: number) => {
  if (min >= 60) { const h = Math.floor(min / 60), m = min % 60; return m > 0 ? `${h}h e ${m}min` : `${h}h`; }
  return `${min}min`;
};

const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const sanitizeNumericInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  input.value = input.value.replace(/\D/g, '');
};

const load = async () => { try { const r = await authenticatedFetch(`${api}/api/recursos/`); if (r.ok) recursos.value = await r.json(); } catch {} };
const loadHist = async () => { loading.value = true; try { const r = await authenticatedFetch(`${api}/api/uso-imediato/`); if (r.ok) hist.value = await r.json(); } catch {} finally { loading.value = false; } };

const registrar = async () => {
  erro.value = null; registrando.value = true;
  try {
    const r = await authenticatedFetch(`${api}/api/uso-imediato/`, {
      method: 'POST',
      body: JSON.stringify({ id_recurso: form.recurso, finalidade: form.finalidade || undefined, observacoes: form.obs || undefined, duracao_minutos: duracaoTotal.value }),
    });
    if (r.ok) { form.recurso = null; form.finalidade = ''; form.obs = ''; durHoras.value = 2; durMinutos.value = 0; await loadHist(); }
    else { const d = await r.json(); erro.value = d.error || 'Erro ao registrar.'; }
  } catch { erro.value = 'Erro de conexão.'; }
  finally { registrando.value = false; }
};

const finalizar = async (id: number) => {
  finId.value = id;
  try {
    const r = await authenticatedFetch(`${api}/api/uso-imediato/${id}/finalizar/`, { method: 'PUT' });
    if (r.ok) { await loadHist(); }
    else { const d = await r.json(); erro.value = d.error || 'Erro.'; }
  } catch { erro.value = 'Erro de conexão.'; }
  finally { finId.value = null; }
};

// Refresh periódico: re-fetcha a cada 30s para disparar auto-finalização no backend
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const startRefresh = () => {
  stopRefresh();
  refreshTimer = setInterval(async () => {
    if (ativos.value.length > 0) {
      await loadHist();
    }
  }, 30000);
};

const stopRefresh = () => {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
};

onMounted(() => { load(); loadHist(); startRefresh(); });
onUnmounted(() => { stopRefresh(); });
</script>

<style scoped>
/* Container: preenche viewport sem scroll global — idêntico ao index */
.home { padding: 0 1.5rem; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box; height: calc(100dvh - 64px - 1.5rem); display: flex; flex-direction: column; overflow: hidden; }
.welcome { padding: 1rem 0 0.5rem; flex-shrink: 0; display: flex; align-items: center; gap: 0.75rem; }
.welcome h1 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; display: flex; align-items: center; gap: 0.6rem; }
.btn-back{ background: none; border: none; cursor: pointer; color: #4b5563; padding: .5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all .2s; }
.btn-back:hover{ background: #e5e7eb }

/* === Admin Hub / Hybrid Padrão === */
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

.panel-wrapper { display: flex; flex-direction: column; min-height: 0; flex: 1; }

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
.panel-head h2 { display: flex; align-items: center; gap: 0.4rem; font-size: 0.95rem; font-weight: 600; color: #111827; margin: 0; }
.panel-scroll { flex: 1; overflow-y: auto; min-height: 0; }
.panel-padding { padding: 0.85rem 1.25rem; }

/* Status Classes / Buttons */
.badge-count { background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 700; padding: 0 0.3rem; border-radius: 8px; margin-left: 0.2rem; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid transparent; cursor: pointer; font-weight: 500; font-size: 0.85rem; transition: all 0.2s; white-space: nowrap; }
.btn-primary { background-color: var(--color-primary); color: white; }
.btn-primary:hover:not(:disabled) { background-color: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-sm { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
.btn-outline { background-color: white; color: #4b5563; border-color: #d1d5db; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-outline:hover { background-color: #f9fafb; border-color: #9ca3af; }
.btn-icon-danger:hover { color: #dc2626; border-color: #dc2626; background: #fef2f2; }
.full-width { width: 100%; }
.mt-2 { margin-top: 0.75rem; }

/* Formulário e Elementos Próprios do Uso Imediato */
.form { display: flex; flex-direction: column; gap: 0.75rem; }
.field { display: flex; flex-direction: column; gap: 0.25rem; }
.field label { display: block; font-size: 0.8rem; font-weight: 600; color: #374151; }
.opt { color: #9ca3af; font-weight: 400; font-size: 0.75rem; }
.field select, .field input:not(.dur-field input), .field textarea {
  width: 100%; padding: 0.5rem 0.6rem; border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 0.85rem; background: #fff; box-sizing: border-box; transition: all 0.2s;
}
.field select:focus, .field input:focus, .field textarea:focus {
  outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(81,94,84,0.15);
}

.truncate-select {
  text-overflow: ellipsis;
  padding-right: 1.5rem; /* give space for the dropdown arrow so it doesn't overlap ellipsis */
}

.dur-row { display: flex; align-items: center; gap: 0.5rem; }
.dur-field { display: flex; align-items: center; gap: 0.25rem; }
.dur-field input {
  width: 55px; padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 0.85rem; text-align: center; background: #fff; box-sizing: border-box;
}
.dur-field input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(81,94,84,0.15); }
.dur-label { font-size: 0.8rem; color: #6b7280; font-weight: 500; }
.dur-sep { font-size: 0.8rem; color: #9ca3af; }

.erro {
  display: flex; align-items: center; gap: 0.4rem; color: #b91c1c;
  background: #fef2f2; border: 1px solid #fca5a5; padding: 0.4rem 0.6rem;
  border-radius: 6px; font-size: 0.75rem; margin-bottom: 0.25rem;
}
.erro.warning { color: #b45309; background: #fffbeb; border-color: #fcd34d; }

/* Em uso */
.ativo {
  padding: 0.85rem 1.25rem; border-bottom: 1px solid #f3f4f6;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5); transition: background-color 0.2s;
}
.ativo:last-child { border-bottom: none; }
.ativo-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
.ativo-info { min-width: 0; overflow: hidden; }
.pulse { animation: pulse 2s infinite; color: #10b981; font-size: 0.9rem; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.timer {
  font-size: 0.75rem; font-weight: 600; color: #047857;
  background: rgba(16,185,129,0.12); padding: 0.15rem 0.5rem; border-radius: 9999px;
}
.timer.alerta { color: #b45309; background: rgba(245,158,11,0.12); }
.ativo strong { font-size: 0.95rem; color: #064e3b; margin-bottom: 0.15rem; }
.ativo-fin { color: #047857; font-size: 0.8rem; margin: 0 0 0.25rem; word-break: break-word; }
.ativo-fin strong { font-size: 0.8rem; display: inline; color: #064e3b; }
.ativo-obs { color: #4b5563; font-size: 0.8rem; margin: 0 0 0.35rem; font-style: italic; word-break: break-word; }
.ativo-obs strong { font-size: 0.8rem; display: inline; color: #374151; font-style: normal; }
.ativo-meta { display: flex; gap: 0.6rem; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem; flex-wrap: wrap; }
.mt-1 { margin-top: 0.3rem; }
.ativo-meta span { display: flex; align-items: center; gap: 0.25rem; }

/* Histórico */
.hist { display: flex; flex-direction: column; padding: 0.75rem 1.25rem; border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s; cursor: pointer; }
.hist:last-child { border-bottom: none; }
.hist:hover { background: #f9fafb; }
.hist-top { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; width: 100%; }
.expand-icon { color: #9ca3af; font-size: 1.15rem; flex-shrink: 0; }
.hist-info { flex: 1; min-width: 0; overflow: hidden; display: flex; flex-direction: column; gap: 0.15rem; }
.hist-info strong { font-size: 0.85rem; color: #111827; display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
.hist-info.is-expanded strong { -webkit-line-clamp: unset; line-clamp: unset; white-space: normal; }
.hist-sub { font-size: 0.75rem; color: #9ca3af; margin-top: 0.15rem; }
.hist-detail { padding: 0.5rem 0 0 1.9rem; font-size: 0.8rem; color: #374151; animation: fadeIn 0.15s; }
.hist-detail p { margin: 0 0 0.4rem; }
.hist-detail strong { color: #111827; }

.status-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; flex-shrink: 0; }
.status-success { background-color: #dcfce7; color: #14532d; }
.status-warning { background-color: #fef3c7; color: #713f12; }

.truncate-text {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.center-msg { text-align: center; padding: 2.5rem; color: #9ca3af; font-size: 0.9rem; }
.spinner { font-size: 2rem; animation: spin 1s linear infinite; color: var(--color-primary); display: block; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Responsivo Idêntico ao Admin Hub */
@media (max-width: 1024px) {
  .admin-grid-panels { grid-template-columns: 1fr 1fr; }
  .panel-wrapper.mobile-hidden { display: flex; } /* Mantém visível em tablets se for grid ainda */
  .admin-grid-panels > .panel-wrapper:first-child { grid-column: span 2; }
}

@media (max-width: 768px) {
  .home { padding: 0 1rem; height: calc(100dvh - 64px); min-height: 0; overflow: hidden; }
  .welcome h1 { font-size: 1.3rem; }
  
  /* Ativa as Abas */
  .admin-nav-tabs.mobile-only {
    display: flex; gap: 0.5rem; margin-bottom: 1rem; background-color: #f3f4f6;
    padding: 0.35rem; border-radius: 8px; overflow-x: auto; scrollbar-width: none; flex-shrink: 0;
  }
  .admin-nav-tabs button {
    flex: 1; padding: 0.6rem 1rem; border: none; background: transparent; border-radius: 6px;
    font-weight: 600; font-size: 0.85rem; color: #6b7280; cursor: pointer;
    transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  }
  .admin-nav-tabs button.active { background-color: white; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  
  /* Desativa Grid e ativa Single Panel Mode */
  .admin-grid-panels { display: flex; flex-direction: column; align-items: stretch; flex: 1; min-height: 0; }
  .panel-wrapper { flex: 1; min-height: 0; }
  .panel-wrapper.mobile-hidden { display: none !important; }
}
</style>
