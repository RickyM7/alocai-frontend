<template>
  <div class="page-content-layout">
    <div class="page-header">
      <h1 class="page-title">{{ viewMode === 'list' ? 'Gerenciamento de Recursos' : (isEditing ? 'Editar Recurso' : 'Adicionar Novo Recurso') }}</h1>
      <button class="btn btn-primary" @click="toggleViewMode">
        <Icon :name="viewMode === 'list' ? 'i-lucide-plus' : 'i-lucide-arrow-left'" />
        <span>{{ viewMode === 'list' ? 'Adicionar Recurso' : 'Voltar para a Lista' }}</span>
      </button>
    </div>

    <div v-if="viewMode === 'form'" class="scrollable-content">
      <RecursoForm :recurso-inicial="recursoSelecionado" @salvo="handleSalvo" @cancelado="voltarParaLista" />
    </div>

    <div v-if="viewMode === 'list'" class="scrollable-content">
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

      <div v-if="isLoading" class="status-container">Carregando recursos...</div>
      <div v-else class="recursos-grid">
        <div v-for="recurso in recursos" :key="recurso.id_recurso" class="recurso-card">
          <div class="recurso-header">
            <div class="recurso-info">
              <h3 class="recurso-nome">{{ recurso.nome_recurso }}</h3>
              <span :class="getStatusClass(recurso.status_recurso)" class="status-badge">
                {{ recurso.status_recurso.replace('_', ' ') }}
              </span>
            </div>
            <div class="recurso-actions">
              <button @click="iniciarEdicao(recurso)" class="btn-action" title="Editar">
                <Icon name="i-lucide-pencil" />
              </button>
              <button @click="confirmarDelecao(recurso)" class="btn-action btn-danger" title="Remover">
                <Icon name="i-lucide-trash-2" />
              </button>
            </div>
          </div>
          
          <div class="recurso-content">
            <div class="recurso-detail">
              <div class="detail-label">
                <Icon name="i-lucide-map-pin" class="detail-icon" />
                <span>Localização</span>
              </div>
              <div class="detail-value">{{ recurso.localizacao }}</div>
            </div>
            
            <div class="recurso-detail">
              <div class="detail-label">
                <Icon name="i-lucide-users" class="detail-icon" />
                <span>Capacidade</span>
              </div>
              <div class="detail-value">{{ recurso.capacidade }} pessoas</div>
            </div>
          </div>
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
.page-content-layout{display:flex;flex-direction:column;height:100%;overflow:hidden}
.page-header{display:flex;justify-content:space-between;align-items:center;flex-shrink:0;padding-bottom:1rem}
.page-title{font-size:1.75rem;font-weight:700;color:#111827}
.scrollable-content{flex-grow:1;overflow-y:auto;padding:0rem}
.filters-container{display:flex;gap:0.5rem;margin-bottom:1.5rem;flex-wrap:wrap}
.filters-container .btn{text-transform:capitalize}
.btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;border-radius:6px;border:1px solid transparent;cursor:pointer;font-weight:500;transition:all 0.2s;white-space:nowrap}
.btn-primary{background-color:#4f46e5;color:white;border-color:#4f46e5}
.btn-primary:hover{background-color:#4338ca}
.btn-outline{background-color:transparent;color:#4b5563;border-color:#d1d5db}
.btn-outline:hover{background-color:#f9fafb}
.btn-ghost{background-color:transparent;border-color:transparent;color:#6b7280}
.btn-ghost:hover{background-color:#f3f4f6}
.recursos-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.25rem;padding:1rem}
.recurso-card{background-color:white;border-radius:.75rem;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.06);overflow:hidden;transition:all .2s;border:1px solid #e5e7eb}
.recurso-card:hover{box-shadow:0 4px 6px rgba(0,0,0,0.1),0 2px 4px rgba(0,0,0,0.06);border-color:#d1d5db}

.recurso-header{display:flex;justify-content:space-between;align-items:flex-start;padding:1.25rem 1.25rem 1rem;border-bottom:1px solid #f3f4f6}
.recurso-info{flex:1;min-width:0}
.recurso-nome{font-size:1.125rem;font-weight:600;color:#111827;margin:0 0 .5rem 0;line-height:1.4}
.recurso-actions{display:flex;gap:.375rem;flex-shrink:0}
.btn-action{width:32px;height:32px;border:none;border-radius:.375rem;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#6b7280;background:transparent;transition:all .2s}
.btn-action:hover{background-color:#f3f4f6;color:#374151}
.btn-action.btn-danger{color:#ef4444}
.btn-action.btn-danger:hover{background-color:#fee2e2;color:#dc2626}

.recurso-content{padding:1.25rem}
.recurso-detail{display:flex;flex-direction:column;gap:.375rem;margin-bottom:1rem}
.recurso-detail:last-child{margin-bottom:0}
.detail-label{display:flex;align-items:center;gap:.5rem;font-size:.8125rem;color:#6b7280;font-weight:500;text-transform:uppercase;letter-spacing:.025em}
.detail-icon{font-size:.875rem}
.detail-value{font-size:.9375rem;color:#374151;font-weight:500;padding-left:1.375rem}

.status-badge{display:inline-block;padding:.375rem .875rem;border-radius:9999px;font-size:.8125rem;font-weight:600;text-transform:capitalize;letter-spacing:.025em}
.status-success{background-color:#dcfce7;color:#14532d}
.status-warning{background-color:#fef3c7;color:#713f12}
.status-error{background-color:#fee2e2;color:#7f1d1d}
.status-info{background-color:#dbeafe;color:#1e3a8a}
.status-default{background-color:#f3f4f6;color:#374151}

.status-container{text-align:center;padding:3rem;color:#6b7280;font-size:1.125rem}

@media (max-width:1024px){
.recursos-grid{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem}
.recurso-header{padding:1rem 1rem .875rem}
.recurso-content{padding:1rem}
.recurso-nome{font-size:1.0625rem}
}

@media (max-width:768px){
.page-header{flex-direction:column;align-items:flex-start;gap:1rem}
.page-title{font-size:1.5rem}
.btn{font-size:0.875rem;padding:0.5rem 0.75rem}
.filters-container{gap:0.375rem;margin-bottom:1rem}
.scrollable-content{padding-right:.5rem}
.recursos-grid{grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.875rem}
.recurso-header{padding:.875rem .875rem .75rem}
.recurso-content{padding:.875rem}
.recurso-nome{font-size:1rem}
.btn-action{width:28px;height:28px}
}

@media (max-width:480px){
.page-title{font-size:1.25rem}
.btn{font-size:0.8125rem;padding:0.4375rem 0.625rem}
.filters-container{gap:0.25rem}
.scrollable-content{padding-right:0}
.recursos-grid{grid-template-columns:1fr;gap:.75rem}
.recurso-header{padding:.75rem .75rem .625rem}
.recurso-content{padding:.75rem}
.recurso-nome{font-size:.9375rem}
.detail-value{font-size:.875rem}
.status-badge{font-size:.75rem;padding:.25rem .625rem}
}
</style>