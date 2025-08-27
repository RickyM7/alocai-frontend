<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <h1 class="title">Dashboard</h1>
        <p class="subtitle">Selecione um recurso para ver seus agendamentos aprovados.</p>
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

        <div v-else-if="recursos.length === 0" class="status-container">
          <Icon name="i-lucide-search-x" class="icon-empty" />
          <p>Nenhum recurso disponível encontrado.</p>
        </div>

        <div v-else class="recursos-container">
          <div v-for="recurso in recursos" :key="recurso.id_recurso" class="recurso-item">
            <div class="recurso-header" @click="toggleRecurso(recurso.id_recurso)">
              <div>
                <h2 class="recurso-nome">{{ recurso.nome_recurso }}</h2>
                <p class="recurso-local">{{ recurso.localizacao }}</p>
              </div>
              <div class="recurso-info">
                <span class="badge">{{ recurso.agendamentos.length }} agendamento(s)</span>
                <Icon
                  :name="recursoAberto === recurso.id_recurso ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="expand-icon"
                />
              </div>
            </div>

            <div v-if="recursoAberto === recurso.id_recurso" class="agendamentos-content">
              <div v-if="recurso.agendamentos.length > 0" class="table-container">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="agendamento in recurso.agendamentos" :key="agendamento.id_agendamento">
                      <td>{{ formatarData(agendamento.data_inicio) }}</td>
                      <td>{{ agendamento.hora_inicio.substring(0, 5) }} - {{ agendamento.hora_fim.substring(0, 5) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="no-agendamentos">
                <p>Nenhum agendamento aprovado para este recurso.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Agendamento {
  id_agendamento: number;
  data_inicio: string;
  hora_inicio: string;
  data_fim: string;
  hora_fim: string;
}

interface Recurso {
  id_recurso: number;
  nome_recurso: string;
  descricao: string;
  localizacao: string;
  status_recurso: string;
  agendamentos: Agendamento[];
}

const config = useRuntimeConfig();
const recursos = ref<Recurso[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const recursoAberto = ref<number | null>(null);

const toggleRecurso = (id: number) => {
  recursoAberto.value = recursoAberto.value === id ? null : id;
};

const fetchDashboardData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${config.public.apiUrl}/api/dashboard/`);
    if (!response.ok) {
      throw new Error('Não foi possível carregar os dados do dashboard.');
    }
    recursos.value = await response.json();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const formatarData = (dataString: string): string => {
  try {
    const data = new Date(`${dataString}T00:00:00`);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dataString;
  }
};

onMounted(fetchDashboardData);
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
  max-width: 900px;
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

.title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.subtitle {
  color: #6b7280;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

.card-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

.status-container { text-align: center; padding-top: 3rem; color: #6b7280; }
.spinner { font-size: 2.5rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.recursos-container { display: flex; flex-direction: column; gap: 1rem; }
.recurso-item { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.recurso-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; cursor: pointer; }
.recurso-header:hover { background-color: #f9fafb; }
.recurso-nome { font-size: 1.25rem; font-weight: 600; }
.recurso-local { color: #6b7280; font-size: 0.9rem; }
.recurso-info { display: flex; align-items: center; gap: 1rem; }
.badge { background-color: #e5e7eb; color: #374151; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 500; }
.expand-icon { font-size: 1.5rem; color: #9ca3af; }

.agendamentos-content { padding: 0 1.5rem 1rem 1.5rem; background-color: #fdfdfd; }
.table-container { margin-top: 1rem; }
.custom-table { width: 100%; border-collapse: collapse; }
.custom-table th { padding: 0.5rem 1rem; text-align: left; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
.custom-table td { padding: 0.75rem 1rem; border-top: 1px solid #f3f4f6; }
.no-agendamentos { text-align: center; color: #6b7280; padding: 2rem 0; }

/* Ajustes para telas menores */
@media (max-width: 768px) {
  .card {
    height: 90vh; /* Ocupa mais espaço vertical em telas menores */
    border-radius: 0;
  }
  .card-header, .card-content {
    padding: 1rem;
  }
  .title {
    font-size: 1.25rem;
  }
  .recurso-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
