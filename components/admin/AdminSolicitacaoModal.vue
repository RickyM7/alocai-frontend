<template>
  <div class="modal-overlay" v-if="isOpen">
    <div class="modal-container">
      <div class="modal-header">
        <h3>Editar Solicitação</h3>
        <button @click="fechar" class="ibtn ghost"><Icon name="i-lucide-x" /></button>
      </div>

      <div class="modal-body" v-if="isLoading">
        <div class="status-container">
          <Icon name="i-lucide-loader-2" class="spinner" /> Carregando...
        </div>
      </div>
      
      <div class="modal-body" v-else-if="error">
        <div class="action-alert error">{{ error }}</div>
      </div>

      <div class="modal-body" v-else-if="agendamentoPai">
        <div v-if="actionMessage" class="action-alert" :class="actionMessageType">{{ actionMessage }}</div>

        <div class="info-section">
          <div class="info-group">
            <label>Recurso</label>
            <p class="info-text">{{ agendamentoPai.recurso }}</p>
          </div>
          <div class="info-group">
            <label>Solicitante</label>
            <p class="info-text">{{ agendamentoPai.solicitante }}</p>
          </div>
          <div class="form-group mt-3">
            <label for="finalidade">Finalidade</label>
            <input type="text" id="finalidade" v-model="agendamentoPai.finalidade" class="form-input" />
          </div>
          <div class="form-group mt-3">
            <label for="observacoes">Observações</label>
            <textarea id="observacoes" v-model="agendamentoPai.observacoes" class="form-textarea" rows="2"></textarea>
          </div>
        </div>

        <div class="times-section mt-4">
          <h4 style="margin: 0 0 1rem; color: #374151; font-weight: 600;">Datas e Horários</h4>
          <div class="date-list">
            <div v-for="(filho, index) in agendamentoPai.agendamentos_filhos" :key="filho.id_agendamento || `new-${index}`" class="date-item">
              <input type="date" v-model="filho.data_inicio" class="date-input"/>
              <div class="time-inputs-container">
                <span class="time-prefix">Das</span>
                <input type="time" v-model="filho.hora_inicio" class="time-input"/>
                <span class="time-separator">às</span>
                <input type="time" v-model="filho.hora_fim" class="time-input"/>
              </div>
              <button @click="removerHorario(index)" class="btn-icon-danger" title="Remover horário">
                  <Icon name="i-lucide-trash" />
              </button>
            </div>
          </div>
          <button @click="adicionarHorario" class="btn btn-outline btn-sm mt-3" style="width: 100%;">
              <Icon name="i-lucide-plus" /> Adicionar Horário
          </button>
        </div>
      </div>

      <div class="modal-footer" v-if="agendamentoPai">
        <button type="button" class="btn btn-outline" style="color: #ef4444; border-color: #fca5a5;" @click="excluirSolicitacao">
          <Icon name="i-lucide-trash" /> Excluir
        </button>
        <div style="flex-grow: 1;"></div>
        <button type="button" class="btn btn-outline" @click="fechar">Cancelar</button>
        <button type="button" class="btn btn-primary" @click="salvarAlteracoes" :disabled="isSaving">
          <Icon v-if="isSaving" name="i-lucide-loader-2" class="animate-spin"/>
          <span>{{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}</span>
        </button>
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
import { ref, watch } from 'vue';
import { authenticatedFetch } from '~/utils/api';
import ConfirmModal from '~/components/ConfirmModal.vue';

interface AgendamentoFilhoAdmin {
  id_agendamento: number | null;
  data_inicio: string;
  data_fim: string;
  hora_inicio: string;
  hora_fim: string;
}

interface AgendamentoPaiAdmin {
  id_agendamento_pai: number;
  recurso: string;
  solicitante: string;
  finalidade: string;
  observacoes: string;
  id_responsavel: number;
  agendamentos_filhos: AgendamentoFilhoAdmin[];
}

const props = defineProps({
  isOpen: Boolean,
  solicitacaoId: Number
});

const emit = defineEmits(['close', 'updated', 'deleted']);

const config = useRuntimeConfig();
const agendamentoPai = ref<AgendamentoPaiAdmin | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);
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

const formatarParaHoraMinuto = (hora: string) => {
  if (typeof hora === 'string' && hora.includes(':')) {
    const partes = hora.split(':');
    return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}`;
  }
  return '00:00';
};

const showMessage = (msg: string, type = 'success') => {
  actionMessage.value = msg;
  actionMessageType.value = type;
  if(type === 'success') {
    setTimeout(() => actionMessage.value = null, 3000);
  }
};

const carregarDados = async () => {
  if (!props.solicitacaoId) return;
  isLoading.value = true;
  error.value = null;
  actionMessage.value = null;

  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/pai/${props.solicitacaoId}/`);
    if (!response.ok) throw new Error('Não foi possível carregar os dados da solicitação.');
    const data = await response.json();
    
    data.agendamentos_filhos.forEach((f: AgendamentoFilhoAdmin) => {
        f.data_fim = f.data_inicio;
        f.hora_inicio = formatarParaHoraMinuto(f.hora_inicio);
        f.hora_fim = formatarParaHoraMinuto(f.hora_fim);
    });

    agendamentoPai.value = data;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar solicitação.';
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) carregarDados();
});

const fechar = () => {
  emit('close');
};

const adicionarHorario = () => {
    if (!agendamentoPai.value) return;
    const ultimoAgendamento = agendamentoPai.value.agendamentos_filhos.slice(-1)[0];
    const novaData = ultimoAgendamento ? ultimoAgendamento.data_inicio : new Date().toISOString().split('T')[0];

    agendamentoPai.value.agendamentos_filhos.push({
        id_agendamento: null,
        data_inicio: novaData,
        data_fim: novaData,
        hora_inicio: '08:00',
        hora_fim: '09:00',
    });
};

const removerHorario = (index: number) => {
    if (!agendamentoPai.value) return;
    agendamentoPai.value.agendamentos_filhos.splice(index, 1);
};

const salvarAlteracoes = async () => {
    if (!agendamentoPai.value) return;
    isSaving.value = true;
    error.value = null;
    actionMessage.value = null;

    const payload = {
        finalidade: agendamentoPai.value.finalidade,
        observacoes: agendamentoPai.value.observacoes,
        id_responsavel: agendamentoPai.value.id_responsavel,
        agendamentos_filhos: agendamentoPai.value.agendamentos_filhos.map((f: AgendamentoFilhoAdmin) => ({
            id_agendamento: f.id_agendamento,
            data_inicio: f.data_inicio,
            hora_inicio: f.hora_inicio,
            data_fim: f.data_inicio,
            hora_fim: f.hora_fim,
        })),
    };

    try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/pai/${props.solicitacaoId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        if (!response.ok) {
            const errorMessages = Object.entries(responseData).map(([key, value]) => `${key}: ${value}`).join('\n');
            throw new Error(errorMessages || 'Falha ao salvar as alterações.');
        }
        
        showMessage('Solicitação atualizada com sucesso!');
        setTimeout(() => { emit('updated'); fechar(); }, 1200);

    } catch (err: unknown) {
        showMessage(err instanceof Error ? `Erro: ${err.message}` : 'Erro ao salvar.', 'error');
    } finally {
        isSaving.value = false;
    }
};

const excluirSolicitacao = () => {
  abrirConfirmacao(
    'Excluir Solicitação',
    `Excluir toda a solicitação de "${agendamentoPai.value?.solicitante}"?`,
    'Excluir Solicitação',
    async () => {
      try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/pai/${props.solicitacaoId}/`, { method: 'DELETE' });
        if (response.status !== 204) throw new Error('Falha ao excluir a solicitação.');
        
        showMessage('Solicitação removida com sucesso!');
        emit('deleted');
        fechar();
      } catch (err: unknown) {
        showMessage(err instanceof Error ? `Erro: ${err.message}` : 'Erro ao excluir.', 'error');
      }
    }
  );
};
</script>

<style scoped>
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
.ibtn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; border: none; cursor: pointer; transition: 0.1s; }
.ibtn.ghost { background: transparent; color: #6b7280; }
.ibtn.ghost:hover { background: #f3f4f6; color: #111827; }

.modal-body {
  padding: 1.25rem; flex: 1; overflow-y: auto;
}
.modal-footer {
  padding: 1rem 1.25rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 0.5rem; background: #f9fafb; align-items: center;
}

.status-container { text-align: center; padding: 2rem; color: #6b7280; font-size: 0.95rem; }
.spinner { animation: spin 1s linear infinite; margin-right: 0.4rem; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Alertas inline */
.action-alert {
  padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 500; margin-bottom: 1rem;
}
.action-alert.success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.action-alert.error { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

/* Forms */
.info-section { background: #fff; }
.info-group { margin-bottom: 0.75rem; }
.info-group label { display: block; font-size: 0.8rem; font-weight: 600; color: #6b7280; margin-bottom: 0.2rem; text-transform: uppercase; }
.info-text { margin: 0; font-size: 0.95rem; color: #111827; padding: 0.5rem; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; }

.form-group label { display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.4rem; }
.form-input, .form-textarea { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; box-sizing: border-box; font-family: inherit; }
.form-input:focus, .form-textarea:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79,70,229,0.2); }
.mt-3 { margin-top: 1rem; }
.mt-4 { margin-top: 1.5rem; }

/* Arrays de datas */
.date-list { display: flex; flex-direction: column; gap: 0.75rem; }
.date-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
.time-inputs-container { display: flex; align-items: center; gap: 0.4rem; flex: 1; min-width: 0; }
.date-input, .time-input { padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem; }
.time-prefix, .time-separator { font-size: 0.8rem; color: #6b7280; }

.btn-icon-danger { width: 32px; height: 32px; border-radius: 6px; border: none; background: transparent; color: #9ca3af; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-icon-danger:hover { background: #fee2e2; color: #ef4444; }

.btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; border: 1px solid transparent; transition: 0.15s; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-outline { background: transparent; border-color: #d1d5db; color: #374151; }
.btn-outline:hover { background: #f9fafb; }
.btn-ghost { background: transparent; border-color: transparent; }
.btn-ghost:hover { background: #f9fafb; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-sm { font-size: 0.8rem; padding: 0.4rem 0.8rem; justify-content: center; }

@media (max-width: 480px) {
  .date-item { flex-direction: column; align-items: stretch; }
  .time-inputs-container { justify-content: space-between; margin: 0.5rem 0; width: 100%; }
  .btn-icon-danger { align-self: flex-end; }
  .modal-footer { flex-direction: column; align-items: stretch; }
  .modal-footer .btn { justify-content: center; }
}
</style>
