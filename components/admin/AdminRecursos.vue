<template>
  <div class="panel">
    <div class="panel-head">
      <h2><Icon name="i-lucide-box" /> Recursos</h2>
      <button @click="iniciarAdicao" class="ibtn ghost sm" title="Adicionar Recurso">
        <Icon name="i-lucide-plus" />
      </button>
    </div>

    <!-- Modo lista -->
    <div class="panel-scroll" style="position: relative; padding: 0.5rem;">
      <div v-if="actionMessage" class="action-alert" :class="actionMessageType">{{ actionMessage }}</div>
      
      <div v-if="isLoading" class="center-msg"><Icon name="i-lucide-loader-2" class="spin" /> Carregando...</div>
      <div v-else-if="recursos.length === 0" class="center-msg">Nenhum recurso encontrado.</div>
      <div v-else class="rec-list">
        <div v-for="r in recursos" :key="r.id_recurso" class="rec-item-wrapper">
          <div class="rec-item" @click="toggleExpand(r.id_recurso)">
            <div class="rec-info" :class="{ 'is-expanded': expandedRecursoId === r.id_recurso }" style="cursor: pointer;">
              <strong :title="r.nome_recurso">{{ r.nome_recurso }}</strong>
              <span class="rec-sub">
                <Icon :name="expandedRecursoId === r.id_recurso ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" style="margin-right: 0.1rem;" />
                {{ expandedRecursoId === r.id_recurso ? 'Ocultar detalhes' : 'Ver detalhes' }}
              </span>
            </div>
            <div class="rec-actions">
              <span class="rec-status" :class="getStatusClass(r.status_recurso)">{{ formatarStatus(r.status_recurso) }}</span>
              <button class="ibtn gray sm" @click.stop="iniciarEdicao(r)" title="Editar"><Icon name="i-lucide-pencil" /></button>
            </div>
          </div>
          <div v-if="expandedRecursoId === r.id_recurso" class="rec-details">
            <div class="rec-detail-row">
              <Icon name="i-lucide-users" /> <strong>Capacidade:</strong> {{ r.capacidade }}
            </div>
            <div v-if="r.localizacao" class="rec-detail-row">
              <Icon name="i-lucide-map-pin" /> <strong>Local:</strong> {{ r.localizacao }}
            </div>
            <div v-if="r.descricao" class="rec-detail-row">
              <Icon name="i-lucide-align-left" /> <strong>Descrição:</strong> {{ r.descricao }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modo formulário (modal tela cheia) -->
    <div v-if="viewMode === 'form'" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Recurso' : 'Adicionar Recurso' }}</h3>
          <button @click="voltarParaLista" class="ibtn ghost"><Icon name="i-lucide-x" /></button>
        </div>
        <div class="modal-body">
          <RecursoForm 
            :recurso-inicial="recursoSelecionado" 
            @salvo="handleSalvo" 
            @cancelado="voltarParaLista" 
            @excluir="handleExcluirFromForm" 
          />
        </div>
      </div>
    </div>
    
    <ConfirmModal 
      :is-open="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      @confirm="executarConfirmacao"
      @cancel="fecharConfirmacao"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { authenticatedFetch } from '~/utils/api';
import RecursoForm from '~/components/admin/RecursoForm.vue';
import ConfirmModal from '~/components/ConfirmModal.vue';
import { getStatusClass, formatarStatus } from '~/utils/formatters';
import { useAdminStore } from '~/stores/admin';
import type { Recurso } from '~/types/recurso';

const adminStore = useAdminStore();

const recursos = computed(() => adminStore.recursos);
const isLoading = computed(() => adminStore.loadingRecursos);
const recursoSelecionado = ref<Recurso | null>(null);
const viewMode = ref('list');
const isEditing = ref(false);
const expandedRecursoId = ref<number | null>(null);

const toggleExpand = (id: number) => {
  expandedRecursoId.value = expandedRecursoId.value === id ? null : id;
};

const actionMessage = ref<string | null>(null);
const actionMessageType = ref('');

const confirmDialog = ref<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  action: (() => void) | null;
}>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Excluir',
  action: null
});

const abrirConfirmacao = (title: string, message: string, confirmText: string, action: () => void) => {
  confirmDialog.value = { isOpen: true, title, message, confirmText, action };
};

const fecharConfirmacao = () => {
  confirmDialog.value.isOpen = false;
  setTimeout(() => confirmDialog.value.action = null, 200);
};

const executarConfirmacao = () => {
  if (confirmDialog.value.action) confirmDialog.value.action();
  fecharConfirmacao();
};

const showMessage = (msg: string, type = 'success') => {
  actionMessage.value = msg;
  actionMessageType.value = type;
  setTimeout(() => actionMessage.value = null, 3000);
};

const fetchRecursos = async (force = false) => {
  await adminStore.fetchRecursos(force);
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

const iniciarEdicao = (recurso: Recurso) => {
  isEditing.value = true;
  recursoSelecionado.value = { ...recurso };
  viewMode.value = 'form';
};

const handleSalvo = async () => {
  voltarParaLista();
  showMessage('Recurso salvo com sucesso!');
  await fetchRecursos(true);
};

const handleExcluirFromForm = () => {
    if (!recursoSelecionado.value) return;
    const recurso = recursoSelecionado.value;
    abrirConfirmacao(
      'Excluir Recurso',
      `Tem certeza que deseja remover o recurso "${recurso.nome_recurso}"?`,
      'Excluir',
      async () => {
        try {
            const config = useRuntimeConfig();
            await authenticatedFetch(`${config.public.apiUrl}/api/admin/recursos/${recurso.id_recurso}/`, { method: 'DELETE' });
            voltarParaLista();
            showMessage('Recurso excluído com sucesso!');
            await fetchRecursos(true);
        } catch(e) {
            showMessage('Erro ao excluir recurso.', 'error');
        }
      }
    );
};

onMounted(() => {
    fetchRecursos();
});
</script>

<style scoped>
.panel {
  display: flex; flex-direction: column; height: 100%;
}
.panel-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem 1.25rem; border-bottom: 1px solid #f3f4f6; flex-shrink: 0; min-height: 64px; box-sizing: border-box;
}
.panel-head h2 {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.95rem; font-weight: 600; color: #111827; margin: 0;
}
.panel-scroll { flex: 1; overflow-y: auto; min-height: 0; }

/* Alertas inline */
.action-alert {
  padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 500; margin-bottom: 1rem;
}
.action-alert.success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.action-alert.error { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

.center-msg { text-align: center; padding: 2.5rem; color: #9ca3af; font-size: 0.9rem; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.rec-list { padding: 0.15rem 0; }
.rec-item-wrapper { border-bottom: 1px solid #f6f7f8; }
.rec-item-wrapper:last-child { border-bottom: none; }
.rec-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6rem 1.25rem; transition: background-color 0.15s;
}
.rec-item:hover { background-color: #f9fafb; cursor: pointer; }
.rec-info { flex: 1; min-width: 0; padding-right: 0.5rem; }
.rec-info strong { font-size: 0.9rem; color: #111827; }
.rec-info:not(.is-expanded) strong { display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
.rec-info.is-expanded strong { white-space: normal; word-break: break-word; line-height: 1.3; display: block; }
.rec-sub { display: flex; align-items: center; gap: 0.2rem; font-size: 0.75rem; color: #6b7280; margin-top: 0.2rem; font-weight: 500; }

.rec-details {
  padding: 0.5rem 1.25rem 1rem 1.25rem; background-color: #f9fafb;
  display: flex; flex-direction: column; gap: 0.4rem;
  font-size: 0.75rem; color: #4b5563; border-top: 1px dashed #e5e7eb;
}
.rec-detail-row { display: flex; align-items: center; gap: 0.4rem; }
.rec-detail-row strong { color: #374151; font-weight: 600; }

.rec-actions { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }

.ibtn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 5px; border: none; cursor: pointer;
  font-size: 0.8rem; transition: all 0.12s;
}
.ibtn.sm { width: 22px; height: 22px; font-size: 0.7rem; }
.ibtn.gray { background: #f3f4f6; color: #6b7280; }
.ibtn.gray:hover { background: #e5e7eb; color: #374151; }
.ibtn.ghost { background: transparent; color: #d1d5db; }
.ibtn.ghost:hover { color: #ef4444; background: #fef2f2; }

.rec-status {
  font-size: 0.65rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: 12px;
  text-transform: capitalize; margin-right: 0.3rem;
}
.text-bg-success { background: #dcfce7; color: #15803d; }
.text-bg-warning { background: #fef3c7; color: #b45309; }
.text-bg-info { background: #dbeafe; color: #1e3a8a; }
.text-bg-danger { background: #fee2e2; color: #991b1b; }
.text-bg-secondary { background: #f3f4f6; color: #374151; }

/* MODAL TELA CHEIA */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem; box-sizing: border-box;
}
.modal-container {
  background: #fff; width: 100%; max-width: 600px; max-height: 90vh;
  border-radius: 12px; display: flex; flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
  overflow: hidden;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb;
}
.modal-header h3 { margin: 0; font-size: 1.1rem; color: #111827; }
.modal-body {
  padding: 1rem; flex: 1; overflow-y: auto;
}

@media (max-width: 480px) {
  .rec-item { padding: 0.75rem 1rem; flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .rec-info { width: 100%; }
  .rec-actions { width: 100%; justify-content: flex-end; }
}
</style>
