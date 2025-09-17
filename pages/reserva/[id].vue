<template>
  <div class="page-container">
    <div class="card">
      <div v-if="!isDatesSectionOpen && agendamento" class="card-header">
        <NuxtLink to="/minhasReservas" class="back-link">
          <Icon name="i-lucide-arrow-left" />
          Voltar
        </NuxtLink>
        <div class="header-section">
          <div>
            <h1 class="title">{{ agendamento.recurso }}</h1>
            <p class="subtitle">{{ agendamento.finalidade }}</p>
          </div>
          <button class="btn-editar">
            <Icon name="i-lucide-pencil" />
            Editar
          </button>
        </div>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Responsável</span>
            <span class="detail-value">{{ agendamento.responsavel }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Data da Solicitação</span>
            <span class="detail-value">{{ formatarData(agendamento.data_criacao) }}</span>
          </div>
          <div class="detail-item observacoes-item" v-if="agendamento.observacoes">
            <span class="detail-label">Observações</span>
            <span class="detail-value">{{ agendamento.observacoes }}</span>
          </div>
        </div>
      </div>

      <div v-if="agendamento" class="accordion-container" :class="{ 'is-expanded': isDatesSectionOpen }">
        <div class="accordion-header" @click="toggleDatesSection">
          <div v-if="!isDatesSectionOpen" class="collapsed-header">
            <h2 class="section-title">Datas Agendadas ({{ agendamento.agendamentos_filhos.length }})</h2>
            <Icon name="i-lucide-chevrons-up-down" class="accordion-icon" />
          </div>
          <div v-else class="expanded-header">
            <button @click.stop="toggleDatesSection" class="back-link">
              <Icon name="i-lucide-arrow-left" />
              <span>Voltar</span>
            </button>
            <h2 class="section-title-expanded">{{ agendamento.recurso }}</h2>
            <div class="placeholder"></div> </div>
        </div>

        <div v-if="isDatesSectionOpen" class="accordion-content">
          <div class="table-wrapper">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="filho in agendamento.agendamentos_filhos" :key="filho.id_agendamento">
                  <td>{{ formatarData(filho.data_inicio) }}</td>
                  <td>{{ filho.hora_inicio.substring(0, 5) }} - {{ filho.hora_fim.substring(0, 5) }}</td>
                  <td>
                    <span :class="getStatusClass(filho.status_agendamento)" class="status-badge">
                      {{ filho.status_agendamento }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div v-if="isLoading || (error && !isLoading)" class="status-container">
        <Icon v-if="isLoading" name="i-lucide-loader-2" class="spinner" />
        <div v-if="error && !isLoading">
          <Icon name="i-lucide-x-circle" class="icon-error" />
          <p class="text-error">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { authenticatedFetch } from '~/utils/api';
import { getStatusClass, formatarData } from '~/utils/formatters';

const route = useRoute();
const config = useRuntimeConfig();
const agendamento = ref<any>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isDatesSectionOpen = ref(false);

const id = route.params.id;

const toggleDatesSection = () => {
  isDatesSectionOpen.value = !isDatesSectionOpen.value;
};

const fetchDetalhes = async () => {
  isLoading.value = true;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/pai/${id}/`);
    if (!response.ok) throw new Error('Não foi possível buscar os detalhes da reserva.');
    agendamento.value = await response.json();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchDetalhes);
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
  position: relative;
}
.card-header { padding: 1.5rem 2rem; }
.back-link { 
  display: inline-flex; 
  align-items: center; 
  gap: 0.5rem; 
  margin-bottom: 1.5rem; 
  color: #6b7280; 
  text-decoration: none; 
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  font-weight: 500;
}
.header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.title { font-size: 1.75rem; font-weight: 700; }
.subtitle { color: #4b5563; margin-top: 0.25rem; }
.btn-editar { background-color: #f9fafb; border: 1px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
.details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding: 1rem; background-color: #f9fafb; border-radius: 8px; }
.detail-item { display: flex; flex-direction: column; }
.detail-label { font-size: 0.8rem; color: #6b7280; }
.detail-value { font-weight: 500; }
.observacoes-item { grid-column: 1 / -1; }

.accordion-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  border-top: 1px solid #e5e7eb;
}
.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  cursor: pointer;
  background-color: #f9fafb;
}
.accordion-header:hover { background-color: #f3f4f6; }
.collapsed-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}
.section-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
.accordion-icon { font-size: 1.5rem; color: #9ca3af; }
.accordion-content { display: none; }

.accordion-container.is-expanded {
  top: 0;
  display: flex;
  flex-direction: column;
}
.is-expanded .accordion-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}
.expanded-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}
.section-title-expanded {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  flex-grow: 1;
}
.placeholder {
  width: 80px; 
  flex-shrink: 0;
}

.table-wrapper {
  overflow-y: auto;
  flex-grow: 1;
}
.custom-table { width: 100%; border-collapse: collapse; }
.custom-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: white;
  padding: 0.75rem 2rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}
.custom-table td { padding: 0.75rem 2rem; border-top: 1px solid #f3f4f6; }
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; }
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
.status-container { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
</style>