<template>
  <div>
    <BackgroundImage />
    <TheHeader />
    <div class="container" v-if="agendamento">
      <NuxtLink to="/minhasReservas" class="back-link">
        <Icon name="i-lucide-arrow-left" />
        Voltar para Minhas Reservas
      </NuxtLink>
      
      <div class="header-section">
        <div>
          <h1 class="title">{{ agendamento.recurso }}</h1>
          <p class="subtitle">{{ agendamento.finalidade }}</p>
        </div>
        <div class="header-actions">
          <button class="btn-editar">
            <Icon name="i-lucide-pencil" />
            Editar Reserva
          </button>
        </div>
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

      <h2 class="section-title">Datas Agendadas ({{ agendamento.agendamentos_filhos.length }})</h2>
      <div class="table-container">
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
    <div v-else-if="isLoading" class="status-container">
      <Icon name="i-lucide-loader-2" class="spinner" />
      <p>Carregando detalhes da reserva...</p>
    </div>
    <div v-else-if="error" class="status-container">
      <Icon name="i-lucide-x-circle" class="icon-error" />
      <p class="text-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { authenticatedFetch } from '~/utils/api';

const route = useRoute();
const config = useRuntimeConfig();
const agendamento = ref<any>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const id = route.params.id;

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

const formatarData = (dataString: string): string => {
  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dataString;
  }
};

const getStatusClass = (status: string) => {
  if (!status) return 'status-default';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('confirmado') || statusLower.includes('aprovado')) {
    return 'status-success';
  } else if (statusLower.includes('pendente') || statusLower.includes('aguardando')) {
    return 'status-warning';
  } else if (statusLower.includes('cancelado') || statusLower.includes('rejeitado')) {
    return 'status-error';
  }
  return 'status-default';
};

onMounted(fetchDetalhes);
</script>

<style scoped>
.container { max-width: 900px; margin: 2rem auto; padding: 2rem; background-color: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.back-link { display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem; color: #6b7280; text-decoration: none; font-weight: 500; }
.header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
.title { font-size: 2.25rem; font-weight: 700; color: #1f2937; margin: 0; }
.subtitle { font-size: 1.1rem; color: #4b5563; margin-top: 0.25rem; }
.btn-editar { background-color: #f9fafb; border: 1px solid #d1d5db; color: #374151; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; }
.details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; padding: 1.5rem; background-color: #f9fafb; border-radius: 8px; margin-bottom: 2rem; }
.detail-item { display: flex; flex-direction: column; }
.detail-label { font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem; }
.detail-value { font-weight: 500; color: #1f2937; }
.observacoes-item { grid-column: 1 / -1; }
.section-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; }
.table-container { margin-top: 1rem; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
.custom-table { width: 100%; border-collapse: collapse; }
.custom-table th { background-color: #f9fafb; padding: 0.75rem 1rem; text-align: left; }
.custom-table td { padding: 0.75rem 1rem; border-top: 1px solid #e5e7eb; }
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; text-transform: capitalize; }
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
.status-default { background-color: #f3f4f6; color: #374151; }
.status-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: #6b7280; font-size: 1.1rem; }
.spinner { font-size: 2.5rem; margin-bottom: 1rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.icon-error { color: #ef4444; }
.text-error { color: #b91c1c; }
</style>