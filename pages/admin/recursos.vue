<template>
  <div>
    <div class="page-header">
      <h1 class="text-2xl font-bold">{{ viewMode === 'list' ? 'Gerenciamento de Recursos' : (isEditing ? 'Editar Recurso' : 'Adicionar Novo Recurso') }}</h1>
      <button class="btn btn-primary" @click="toggleViewMode">
        <Icon :name="viewMode === 'list' ? 'i-lucide-plus' : 'i-lucide-arrow-left'" />
        <span>{{ viewMode === 'list' ? 'Adicionar Recurso' : 'Voltar para a Lista' }}</span>
      </button>
    </div>

    <div v-if="viewMode === 'form'" class="mt-6">
      <RecursoForm :recurso-inicial="recursoSelecionado" @salvo="handleSalvo" @cancelado="voltarParaLista" />
    </div>

    <div v-if="viewMode === 'list'" class="mt-6">
      <div class="filters-container">
        <button
          v-for="status in statusDisponiveis" :key="status"
          :class="['btn', filtroStatus === status ? 'btn-primary' : 'btn-outline']"
          @click="aplicarFiltro(status)"
        >
          {{ status.replace('_', ' ') }}
        </button>
        <button v-if="filtroStatus" @click="aplicarFiltro(null)" class="btn btn-ghost">
          <Icon name="i-lucide-x" />
          <span>Limpar</span>
        </button>
      </div>

      <div class="card mt-4">
        <div v-if="isLoading" class="p-4 text-center">Carregando recursos...</div>
        <div v-else class="card-content">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Localização</th>
                <th>Capacidade</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="recurso in recursos" :key="recurso.id_recurso">
                <td class="font-medium">{{ recurso.nome_recurso }}</td>
                <td>{{ recurso.localizacao }}</td>
                <td>{{ recurso.capacidade }}</td>
                <td>
                  <span :class="getStatusClass(recurso.status_recurso)" class="status-badge">
                    {{ recurso.status_recurso.replace('_', ' ') }}
                  </span>
                </td>
                <td class="actions-cell">
                  <button @click="iniciarEdicao(recurso)" class="btn-icon" title="Editar"><Icon name="i-lucide-pencil" /></button>
                  <button @click="confirmarDelecao(recurso)" class="btn-icon btn-icon-danger" title="Remover"><Icon name="i-lucide-trash-2" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authenticatedFetch } from '~/utils/api';
import RecursoForm from '~/components/admin/RecursoForm.vue';

definePageMeta({ layout: 'admin', middleware: 'admin-auth' });

const config = useRuntimeConfig();
const recursos = ref([]);
const isLoading = ref(true);
const recursoSelecionado = ref(null);
const viewMode = ref('list');
const isEditing = ref(false);
const statusDisponiveis = ref([]);
const filtroStatus = ref(null);

const fetchRecursos = async () => {
  isLoading.value = true;
  let url = `${config.public.apiUrl}/api/admin/recursos/`;
  if (filtroStatus.value) {
    url += `?status=${filtroStatus.value}`;
  }
  try {
    const response = await authenticatedFetch(url);
    if (!response.ok) throw new Error('Falha ao carregar recursos');
    recursos.value = await response.json();
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

const fetchStatusDisponiveis = async () => {
    try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/recursos/status_disponiveis/`);
        if (!response.ok) throw new Error('Falha ao buscar status');
        statusDisponiveis.value = (await response.json()).status_disponiveis;
    } catch (e) { console.error(e); }
};

const aplicarFiltro = (status) => {
    filtroStatus.value = status;
    fetchRecursos();
};

const toggleViewMode = () => {
  if (viewMode.value === 'list') {
    iniciarAdicao();
  } else {
    voltarParaLista();
  }
};

const voltarParaLista = () => {
  viewMode.value = 'list';
  recursoSelecionado.value = null;
  isEditing.value = false;
};

const iniciarAdicao = () => {
  isEditing.value = false;
  recursoSelecionado.value = null;
  viewMode.value = 'form';
};

const iniciarEdicao = (recurso) => {
  isEditing.value = true;
  recursoSelecionado.value = { ...recurso };
  viewMode.value = 'form';
};

const handleSalvo = () => {
  voltarParaLista();
  fetchRecursos();
};

const confirmarDelecao = async (recurso) => {
    if (confirm(`Tem certeza que deseja remover o recurso "${recurso.nome_recurso}"?`)) {
        await authenticatedFetch(`${config.public.apiUrl}/api/admin/recursos/${recurso.id_recurso}/`, { method: 'DELETE' });
        fetchRecursos();
    }
};

const getStatusClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('disponivel')) return 'status-success';
  if (s.includes('manutencao')) return 'status-warning';
  if (s.includes('reservado')) return 'status-info';
  if (s.includes('indisponivel')) return 'status-error';
  return 'status-default';
};

onMounted(() => {
    fetchRecursos();
    fetchStatusDisponiveis();
});
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; }
.card { background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.card-content { padding: 0; overflow-x: auto; }
.custom-table { width: 100%; border-collapse: collapse; }
.custom-table th, .custom-table td { padding: 0.75rem 1.5rem; text-align: left; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
.custom-table tbody tr:last-child td { border-bottom: none; }
.actions-cell { display: flex; gap: 0.25rem; }
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; text-transform: capitalize; }
.status-success { background-color: #dcfce7; color: #166534; }
.status-warning { background-color: #fef3c7; color: #92400e; }
.status-error { background-color: #fecaca; color: #991b1b; }
.status-info { background-color: #dbeafe; color: #1e40af; }
.status-default { background-color: #e5e7eb; color: #374151; }
.filters-container { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
.filters-container .btn { text-transform: capitalize; }
.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid transparent; cursor: pointer; font-weight: 500; transition: all 0.2s; }
.btn-primary { background-color: #4f46e5; color: white; border-color: #4f46e5; }
.btn-primary:hover { background-color: #4338ca; }
.btn-outline { background-color: transparent; color: #4b5563; border-color: #d1d5db; }
.btn-outline:hover { background-color: #f9fafb; }
.btn-ghost { background-color: transparent; border-color: transparent; color: #6b7280; }
.btn-ghost:hover { background-color: #f3f4f6; }
.btn-icon { padding: 0.5rem; }
.btn-icon-danger:hover { color: #dc2626; background-color: #fee2e2; }
</style>