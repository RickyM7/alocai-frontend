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
        
        <div v-else class="recursos-grid-container">
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

const getStatusClass = (status) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('disponivel')) return 'status-success';
  if (statusLower.includes('manutencao')) return 'status-warning';
  return 'status-error';
};

onMounted(() => {
  store.limparStore();
  fetchRecursos();
});
</script>

<style scoped>
.page-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  width: 100%;
  max-width: 90vw;
  height: 85vh;
  max-height: 800px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.card-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.title { font-size: 1.75rem; font-weight: 700; margin: 0; }
.subtitle { color: #6b7280; margin-top: 0.25rem; }
.card-content {
  flex-grow: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
}
.recursos-grid-container {
  width: 100%;
  overflow-x: auto;
  padding: 2rem 0;
}
.recursos-grid {
  display: flex;
  flex-wrap: nowrap;
  gap: 1.5rem;
  padding: 0 2rem;
}
.recurso-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 300px;
  flex-shrink: 0;
}
.recurso-card:hover { transform: translateY(-5px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.recurso-card.selected { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); }
.recurso-nome { font-size: 1.25rem; font-weight: 600; }
.recurso-descricao { color: #6b7280; margin: 0.5rem 0 1rem; min-height: 40px; }
.recurso-info { font-size: 0.875rem; color: #4b5563; }
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; margin-top: 1rem; }
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
.card-footer {
  padding: 1rem 2rem;
  border-top: 1px solid #e5e7eb;
  text-align: right;
  flex-shrink: 0;
}
.botao-prosseguir {
  background-color: #374151;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
}
.botao-prosseguir:disabled { background-color: #9ca3af; cursor: not-allowed; }
</style>