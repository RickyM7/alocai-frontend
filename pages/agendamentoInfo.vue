<template>
  <div class="flow-layout">
    <div class="panel flow-panel">
      <!-- Header do fluxo -->
      <div class="panel-head">
        <div class="head-left">
          <button @click="$router.push('/agendamentoData')" class="btn-back">
            <Icon name="i-lucide-arrow-left" />
          </button>
          <div>
            <h2>Informações Adicionais</h2>
            <p>Preencha os detalhes da sua solicitação.</p>
          </div>
        </div>
        <div class="progress-bar">
          <Icon name="heroicons:calendar-days-20-solid" class="icon-inactive"/>
          <div class="line"></div>
          <Icon name="heroicons:information-circle" class="icon-active"/>
          <div class="line"></div>
          <Icon name="heroicons:check-circle" class="icon-inactive"/>
        </div>
      </div>

      <!-- Corpo com scroll -->
      <div class="panel-scroll panel-padding">
        <div class="agendamento-content-vertical">
          <!-- Bloco resumo -->
          <div class="step-block">
            <div class="step-header">
              <div class="step-number">3</div>
              <div>
                <h3 class="step-title">Resumo da Solicitação</h3>
                <p class="step-subtitle">Confira o recurso e as datas selecionadas.</p>
              </div>
            </div>
            <div class="step-body">
              <div class="resumo-cards-row">
                <div v-if="store.recursoSelecionado" class="resumo-card">
                  <div class="icon-box blue"><Icon name="i-lucide-box" /></div>
                  <div class="res-info">
                    <span class="res-label">Recurso</span>
                    <strong class="res-value truncate" :title="store.recursoSelecionado.nome_recurso">{{ store.recursoSelecionado.nome_recurso }}</strong>
                  </div>
                </div>
                
                <div class="resumo-card">
                  <div class="icon-box indigo"><Icon name="i-lucide-hash" /></div>
                  <div class="res-info">
                    <span class="res-label">Sessões</span>
                    <strong class="res-value">{{ store.agendamentos.length }} {{ store.agendamentos.length === 1 ? 'Data' : 'Datas' }}</strong>
                  </div>
                </div>

                <div v-if="store.agendamentos.length > 0" class="resumo-card">
                  <div class="icon-box emerald"><Icon name="i-lucide-calendar-range" /></div>
                  <div class="res-info">
                    <span class="res-label">Período</span>
                    <strong class="res-value">{{ resumoPeriodo }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bloco formulário -->
          <div class="step-block">
            <div class="step-header">
              <div class="step-number">4</div>
              <div>
                <h3 class="step-title">Detalhes da Reserva</h3>
                <p class="step-subtitle">Preencha as informações da finalidade e participantes.</p>
              </div>
            </div>
            <div class="step-body">
              <form class="formulario">
                <div class="campo">
                  <label for="finalidade">Finalidade do Agendamento</label>
                  <input
                    type="text"
                    id="finalidade"
                    v-model="finalidade"
                    placeholder="Ex: Aula da disciplina de Programação I"
                  />
                </div>

                <div class="campo num-stepper-box">
                  <label for="participantes">Número de Participantes (Máx: {{ maxParticipantes || 'N/A' }})</label>
                  <div class="stepper-wrapper">
                    <button type="button" class="btn-stepper" @click="decrementarParticipantes" :disabled="!participantes || participantes <= 1">
                      <Icon name="i-lucide-minus" />
                    </button>
                    <input
                      type="text"
                      inputmode="numeric"
                      id="participantes"
                      :value="participantes"
                      @input="onInputParticipantes"
                      @keydown="onKeydownStepper"
                      placeholder="Ex: 25"
                    />
                    <button type="button" class="btn-stepper" @click="incrementarParticipantes" :disabled="maxParticipantes && participantes >= maxParticipantes">
                      <Icon name="i-lucide-plus" />
                    </button>
                  </div>
                </div>
                <div class="campo">
                  <label for="observacoes">Observações (Opcional)</label>
                  <textarea
                    id="observacoes"
                    v-model="observacoes"
                    placeholder="Ex: Necessário instalação do software X, projetor, etc."
                  ></textarea>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer fixo -->
      <div class="panel-footer">
        <div v-if="erroMsg" class="inline-error-alert" style="margin-right: auto; margin-bottom: 0;">
          <Icon name="heroicons:exclamation-triangle" class="error-icon" />
          <span>{{ erroMsg }}</span>
        </div>
        <div class="action-footer-buttons">
          <button 
            type="button"
            class="btn btn-primary" 
            :disabled="!isFormularioValido" 
            @click="irParaConclusao"
          >
            Concluir Agendamento
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAgendamentoStore } from '~/stores/agendamento'

definePageMeta({ middleware: 'auth' });

const finalidade = ref("");
const participantes = ref<number | ''>("");
const observacoes = ref("");
const erroMsg = ref("");

const router = useRouter();
const store = useAgendamentoStore();

const parseDateAsLocal = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};


const maxParticipantes = computed(() => store.recursoSelecionado?.capacidade);

const resumoPeriodo = computed(() => {
  if (store.agendamentos.length === 0) return '';

  const datasOrdenadas = [...store.agendamentos].sort((a, b) => a.data.localeCompare(b.data));
  const primeiraData = parseDateAsLocal(datasOrdenadas[0].data);
  const ultimaData = parseDateAsLocal(datasOrdenadas[datasOrdenadas.length - 1].data);
  const formatar = (d: Date) => d.toLocaleDateString('pt-BR');

  if (store.agendamentos.length === 1) return formatar(primeiraData);
  return `${formatar(primeiraData)} até ${formatar(ultimaData)}`;
});

const onInputParticipantes = (e: Event) => {
  const target = e.target as HTMLInputElement;
  let val = target.value.replace(/\D/g, '');
  let finalValue: number | '' = val ? parseInt(val, 10) : '';
  
  if (finalValue !== '') {
    if (finalValue < 1) finalValue = 1;
    if (maxParticipantes.value && finalValue > maxParticipantes.value) {
      finalValue = maxParticipantes.value;
    }
  }
  
  target.value = String(finalValue);
  participantes.value = finalValue;
};

const incrementarParticipantes = () => {
  const num = typeof participantes.value === 'number' ? participantes.value : 0;
  atualizarParticipantes(num + 1);
};

const decrementarParticipantes = () => {
  const num = typeof participantes.value === 'number' ? participantes.value : 0;
  if (num > 1) atualizarParticipantes(num - 1);
};

const onKeydownStepper = (e: KeyboardEvent) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    incrementarParticipantes();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    decrementarParticipantes();
  }
};

const atualizarParticipantes = (num: number | '') => {
  if (num === '') {
    participantes.value = '';
    return;
  }
  
  let validado = num;
  if (validado < 1) validado = 1;
  if (maxParticipantes.value && validado > maxParticipantes.value) {
    validado = maxParticipantes.value;
  }
  participantes.value = validado;
  
  const inputEl = document.getElementById('participantes') as HTMLInputElement | null;
  if (inputEl) inputEl.value = String(validado);
};

const isFormularioValido = computed(() => {
  return finalidade.value.trim().length > 0 &&
         participantes.value !== '' && 
         participantes.value > 0;
});

function irParaConclusao() {
  if (!finalidade.value.trim()) {
    erroMsg.value = 'Por favor, informe a finalidade do agendamento.';
    return;
  }

  if (!participantes.value || participantes.value < 1) {
    erroMsg.value = 'Por favor, informe um número de participantes válido.';
    return;
  }

  store.setInfo({
    finalidade: finalidade.value,
    participantes: typeof participantes.value === 'number' ? participantes.value : 0,
    observacoes: observacoes.value
  });

  router.push('/agendamentoConclusao');
}

onMounted(() => {
  if (!store.recursoSelecionado || store.agendamentos.length === 0) {
    erroMsg.value = "Dados incompletos. Redirecionando...";
    router.push('/agendamentoSelectRecurso');
    return;
  }
});
</script>

<style scoped>
/* OVERRIDES do layout global */
.panel-head { flex-wrap: wrap; gap: 1rem; }
.panel-scroll { background-color: #f3f4f6; display: flex; flex-direction: column; }
.panel-padding { max-width: 800px; margin: 0 auto; width: 100%; }

.agendamento-content-vertical { display: flex; flex-direction: column; gap: 2rem; width: 100%; }

/* BLOCOS DE PASSO (Step Cards) */
.step-block { background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 1.5rem 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 1.5rem; }
.step-header { display: flex; align-items: flex-start; gap: 1rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 1.25rem; }
.step-number { width: 32px; height: 32px; border-radius: 50%; background: #111827; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
.step-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #111827; }
.step-subtitle { margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #6b7280; }
.step-body { display: flex; flex-direction: column; gap: 1.5rem; }

/* RESUMO CARDS (INTERNO DO PASSO) */
.resumo-cards-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.resumo-card { display: flex; align-items: center; gap: 1rem; background: #fff; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.resumo-card .icon-box { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
.resumo-card .icon-box.blue { background: #eff6ff; color: #3b82f6; }
.resumo-card .icon-box.indigo { background: #eef2ff; color: #6366f1; }
.resumo-card .icon-box.emerald { background: #ecfdf5; color: #10b981; }
.res-info { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.res-label { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.res-value { font-size: 1.05rem; font-weight: 700; color: #0f172a; display: block; }
@media (min-width: 769px) {
  .res-value.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
}
@media (max-width: 768px) {
  .res-value { white-space: normal; word-break: break-word; }
}

/* FORMULÁRIO */
.formulario { display: flex; flex-direction: column; gap: 1.5rem; }
.campo { display: flex; flex-direction: column; gap: 0.5rem; }
.campo label { font-weight: 600; color: #334155; font-size: 0.95rem; }
.campo input, .campo textarea { width: 100%; padding: 0.85rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: all 0.2s; background: #fff; outline: none; }
.campo input:focus, .campo textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
.campo textarea { min-height: 8rem; resize: none; }

/* STEPPER NUMÉRICO CUSTOMIZADO */
.stepper-wrapper { display: flex; align-items: center; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff; width: 100%; max-width: 250px;}
.stepper-wrapper:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
.stepper-wrapper input { border: none !important; border-radius: 0 !important; box-shadow: none !important; text-align: center; width: 100%; appearance: none; -moz-appearance: textfield; padding: 0.85rem 0.5rem; font-weight: 600; color: #0f172a;}
.btn-stepper { display: flex; align-items: center; justify-content: center; width: 44px; align-self: stretch; background: #f8fafc; border: none; border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color: #475569; cursor: pointer; transition: background 0.15s; font-size: 1.1rem;}
.btn-stepper:first-child { border-left: none; }
.btn-stepper:last-child { border-right: none; }
.btn-stepper:hover:not(:disabled) { background: #e2e8f0; color: #0f172a;}
.btn-stepper:disabled { opacity: 0.4; cursor: not-allowed; }

/* FOOTER BUTTONS */
.action-footer-buttons { display: flex; gap: 1rem; justify-content: flex-end; align-items: center; width: 100%; }

/* OVERRIDE: btn padding nesta page */
.btn { padding: 0.75rem 1.75rem; }

/* RESPONSIVIDADE */
@media (max-width: 768px) {
  .panel-padding { flex: 1; min-height: 0; background: #f8fafc; }
  
  .step-block { padding: 1.25rem; border-radius: 12px; }
  .step-header { padding-bottom: 1rem; }
  
  .resumo-grid { grid-template-columns: 1fr; gap: 1rem; padding: 1rem; }

  .action-footer-buttons { flex-direction: column-reverse; width: 100%; gap: 0.75rem; }
  .btn { width: 100%; padding: 1rem; font-size: 1.1rem; justify-content: center; }
}
</style>