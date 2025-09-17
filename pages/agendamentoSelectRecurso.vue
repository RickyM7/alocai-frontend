<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <h1 class="title">Nova Reserva</h1>
        <p class="subtitle">Selecione um recurso para iniciar o agendamento.</p>
      </div>

      <div class="card-content">
        <div v-if="isLoading" class="status-container">
          <Icon name="i-lucide-loader-2" class="spinner" />
          <p>Carregando recursos...</p>
        </div>
        <div v-else-if="error" class="status-container">
          <Icon name="i-lucide-x-circle" class="icon-error" />
          <p class="text-error">{{ error }}</p>
        </div>
        
        <div v-else class="recursos-container">
          <div class="recursos-grid">
            <div 
              v-for="recurso in recursos" 
              :key="recurso.id_recurso" 
              class="recurso-card"
              :class="{ 'selected': recursoSelecionado?.id_recurso === recurso.id_recurso }"
              @click="selecionarRecurso(recurso)"
            >
              <h2 class="recurso-nome">{{ recurso.nome_recurso }}</h2>
              <p class="recurso-descricao">{{ recurso.descricao }}</p>
              <p class="recurso-info">Capacidade: {{ recurso.capacidade || 'N/A' }}</p>
              <p class="recurso-info">Local: {{ recurso.localizacao }}</p>
              <span :class="getStatusClass(recurso.status_recurso)" class="status-badge">
                {{ recurso.status_recurso }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="card-footer">
        <button 
          class="botao-prosseguir" 
          :disabled="!recursoSelecionado" 
          @click="irParaData"
        >
          Prosseguir com Recurso Selecionado
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAgendamentoStore } from '~/stores/agendamento';
import { useRouter } from 'vue-router';
import { authenticatedFetch } from '~/utils/api';
import { getStatusClass } from '~/utils/formatters';

const store = useAgendamentoStore();
const router = useRouter();
const config = useRuntimeConfig();

const recursos = ref([]);
const recursoSelecionado = ref(null);
const isLoading = ref(true);
const error = ref('');

async function fetchRecursos() {
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/recursos/`);
    if (!response.ok) throw new Error('Não foi possível buscar os recursos.');
    recursos.value = await response.json();
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

function selecionarRecurso(recurso) {
  recursoSelecionado.value = recurso;
}

function irParaData() {
  if (recursoSelecionado.value) {
    store.setRecurso(recursoSelecionado.value);
    router.push('/agendamentoData');
  }
}

onMounted(() => {
  store.limparStore();
  fetchRecursos();
});
</script>

<style scoped>
.page-container{width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:1rem;box-sizing:border-box}
.card{width:100%;max-width:90vw;height:85vh;max-height:50rem;background-color:#fff;border-radius:.75rem;box-shadow:0 .625rem 1.875rem rgba(0,0,0,.1);display:flex;flex-direction:column;overflow:hidden}
.card-header{padding:1.5rem 2rem;border-bottom:.063rem solid #e5e7eb;flex-shrink:0}
.title{font-size:1.75rem;font-weight:700;margin:0}
.subtitle{color:#6b7280;margin-top:.25rem;margin-bottom:0}
.card-content{flex-grow:1;overflow:hidden;position:relative;display:flex;align-items:stretch}
.status-container{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;gap:1rem}
.spinner{animation:spin 1s linear infinite}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.recursos-container{width:100%;display:flex;flex-direction:column;overflow:hidden}
.recursos-grid{display:grid;gap:1.5rem;padding:2rem;overflow-y:auto;height:100%}
.recurso-card{border:.063rem solid #e5e7eb;border-radius:.75rem;padding:1.5rem;cursor:pointer;transition:all .2s ease;background:#fff}
.recurso-card:hover{transform:translateY(-.125rem);box-shadow:0 .25rem .625rem rgba(0,0,0,.1)}
.recurso-card.selected{border-color:#2563eb;box-shadow:0 0 0 .125rem rgba(37,99,235,.2)}
.recurso-nome{font-size:1.25rem;font-weight:600;margin:0 0 .5rem 0}
.recurso-descricao{color:#6b7280;margin:0 0 1rem 0;line-height:1.4}
.recurso-info{font-size:.875rem;color:#4b5563;margin:.25rem 0}
.status-badge{display:inline-block;padding:.25rem .75rem;border-radius:624.94rem;font-size:.875rem;margin-top:1rem;font-weight:500}
.status-success{background-color:#dcfce7;color:#166534}
.status-warning{background-color:#fef3c7;color:#92400e}
.status-error{background-color:#fecaca;color:#991b1b}
.card-footer{padding:1.5rem 2rem;border-top:.063rem solid #e5e7eb;text-align:right;flex-shrink:0}
.botao-prosseguir{background-color:#374151;color:#fff;padding:.875rem 2rem;border-radius:.5rem;border:none;cursor:pointer;font-weight:500;transition:background-color .2s ease}
.botao-prosseguir:hover:not(:disabled){background-color:#1f2937}
.botao-prosseguir:disabled{background-color:#9ca3af;cursor:not-allowed}
@media (min-width:1024px){.recursos-grid{grid-template-columns:repeat(auto-fit,minmax(300px,1fr));max-width:none}}
@media (min-width:768px) and (max-width:1023px){.recursos-grid{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}.card{max-width:95vw;height:90vh}}
@media (max-width:767px){.page-container{padding:.5rem;height:calc(100vh - 85px);align-items:stretch}.card{max-width:100%;height:100%;max-height:none}.card-header{padding:1rem 1.5rem}.title{font-size:1.5rem}.recursos-grid{grid-template-columns:1fr;padding:1.5rem;gap:1rem}.recurso-card{padding:1.25rem}.card-footer{padding:1rem 1.5rem;position:sticky;bottom:0;background:#fff;border-top:2px solid #e5e7eb}.botao-prosseguir{width:100%;padding:1rem;font-size:1rem}}
@media (max-width:480px){.page-container{padding:.25rem}.card-header{padding:.75rem 1rem}.title{font-size:1.25rem}.subtitle{font-size:.875rem}.recursos-grid{padding:1rem}.recurso-card{padding:1rem}.card-footer{padding:.75rem 1rem}}
</style>