<template>
  <BackgroundImage />
  <TheHeader />

  <div class="container">
    <h1 class="title">Selecione um Recurso</h1>
    <div v-if="isLoading" class="status-container">
      <Icon name="i-lucide-loader-2" class="spinner" />
      <p>Carregando recursos...</p>
    </div>
    <div v-else-if="error" class="status-container">
      <Icon name="i-lucide-x-circle" class="icon-error" />
      <p class="text-error">{{ error }}</p>
    </div>
    
    <div v-else class="recursos-grid">
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

    <div class="botoes">
      <button 
        class="botao-prosseguir" 
        :disabled="!recursoSelecionado" 
        @click="irParaData"
      >
        Prosseguir
      </button>
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
  } else {
    alert('Por favor, selecione um recurso para continuar.');
  }
}

const getStatusClass = (status) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('disponivel')) return 'status-success';
  if (statusLower.includes('manutencao')) return 'status-warning';
  return 'status-error';
};

onMounted(() => {
  store.limparStore(); // Garante que qualquer agendamento anterior seja descartado  
  fetchRecursos();
});
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
.title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #1f2937;
  text-align: center;
}
.recursos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
.recurso-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.recurso-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}
.recurso-card.selected {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}
.recurso-nome {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.recurso-descricao {
  color: #6b7280;
  margin-bottom: 1rem;
  min-height: 40px;
}
.recurso-info {
  font-size: 0.875rem;
  color: #4b5563;
}
.botoes {
  text-align: center;
  margin-top: 2rem;
}
.botao-prosseguir {
  background-color: #374151;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
  border: none;
}
.botao-prosseguir:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
  margin-top: 1rem;
}
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
.status-container { text-align: center; padding: 2rem; }
.spinner { font-size: 2.5rem; margin-bottom: 1rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>