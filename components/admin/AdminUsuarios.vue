<template>
  <div class="panel">
    <div class="panel-head">
      <h2><Icon name="i-lucide-users" /> Usuários</h2>
      <button v-if="viewMode === 'edit'" @click="voltarParaLista" class="ibtn ghost sm" title="Voltar">
        <Icon name="i-lucide-arrow-left" />
      </button>
    </div>

    <!-- Modo formulário (editar perfil) -->
    <div v-if="viewMode === 'edit' && usuarioSelecionado" class="panel-scroll" style="padding: 1rem;">
      <div v-if="actionMessage" class="action-alert" :class="actionMessageType">{{ actionMessage }}</div>
      <form @submit.prevent="salvarPerfil">
        <div class="form-group" style="margin-bottom: 1rem;">
          <label for="perfil" style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 0.3rem; color: #374151; word-break: break-word; line-height: 1.3;">Perfil de {{ usuarioSelecionado.nome }}</label>
          <select id="perfil" v-model="perfilEditadoId" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db; background: white; color: #111;">
            <option v-for="perfil in perfis" :key="perfil.id_perfil" :value="perfil.id_perfil">
              {{ perfil.nome_perfil }}
            </option>
          </select>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;">
          <!-- Excluir movido para edição -->
          <button type="button" @click="confirmarDelecao(usuarioSelecionado)" class="btn btn-outline" style="color: #ef4444; border-color: #fca5a5;" :disabled="usuarioSelecionado.id_usuario === loggedInUser?.id_usuario" title="Remover Usuário">
            <Icon name="i-lucide-trash" /> Excluir Conta
          </button>
          
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" @click="voltarParaLista" class="btn btn-outline">Cancelar</button>
            <button type="submit" :disabled="isSaving" class="btn btn-primary">
              <Icon v-if="isSaving" name="i-lucide-loader-2" class="spin" /> Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
    
    <!-- Modo lista -->
    <div v-if="viewMode === 'list'" class="panel-scroll">
      <div v-if="loadingList" class="center-msg"><Icon name="i-lucide-loader-2" class="spin" /> Carregando...</div>
      <div v-else-if="usuarios.length === 0" class="center-msg">Nenhum usuário encontrado.</div>
      <div v-else class="usr-list">
        <div v-for="usuario in usuarios" :key="usuario.id_usuario" class="usr-item">
          <div class="usr-avatar">
            <Icon name="i-lucide-user" class="avatar-icon" />
          </div>
          <div class="usr-info">
            <strong>{{ usuario.nome }}</strong>
            <span class="usr-sub">{{ usuario.nome_perfil || 'Não definido' }}</span>
          </div>
          <div class="usr-actions">
            <button @click="iniciarEdicao(usuario)" class="ibtn gray sm" :disabled="usuario.id_usuario === loggedInUser?.id_usuario" title="Alterar Perfil">
              <Icon name="i-lucide-pencil" />
            </button>
          </div>
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
import { ref, onMounted, computed, watch } from 'vue';
import { authenticatedFetch } from '~/utils/api';
import { useAdminStore } from '~/stores/admin';
import ConfirmModal from '~/components/ConfirmModal.vue';
import { useUserStore } from '~/stores/user';

interface Perfil {
  id_perfil: number;
  nome_perfil: string;
}

interface Usuario {
  id_usuario: number;
  nome: string;
  nome_perfil: string;
  id_perfil: number;
}

const config = useRuntimeConfig();
const adminStore = useAdminStore();
const usuarios = computed(() => adminStore.usuarios as Usuario[]);
const loadingList = computed(() => adminStore.loadingUsuarios);

const perfis = ref<Perfil[]>([]);
const isSaving = ref(false);
const usuarioSelecionado = ref<Usuario | null>(null);
const viewMode = ref('list');
const perfilEditadoId = ref<number | null>(null);
const loggedInUser = computed(() => useUserStore().user);

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

const fetchUsuarios = async (force = false) => {
  await adminStore.fetchUsuarios(force);
};
const fetchPerfis = async () => {
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/perfil-acesso/`);
    if(response.ok) perfis.value = await response.json();
  } catch(e: unknown) {}
};

const voltarParaLista = () => {
  viewMode.value = 'list';
  usuarioSelecionado.value = null;
  perfilEditadoId.value = null;
};

const iniciarEdicao = (usuario: Usuario) => {
  usuarioSelecionado.value = { ...usuario };
  perfilEditadoId.value = usuario.id_perfil;
  viewMode.value = 'edit';
};

const salvarPerfil = async () => {
  if (!usuarioSelecionado.value || perfilEditadoId.value === null) return;
  isSaving.value = true;
  actionMessage.value = null;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/user/${usuarioSelecionado.value.id_usuario}/`, {
      method: 'PUT',
      body: JSON.stringify({ id_perfil: perfilEditadoId.value }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar o perfil.');
    }

    showMessage('Perfil atualizado com sucesso!', 'success');
    await fetchUsuarios(true);
    setTimeout(voltarParaLista, 1000);
  } catch (error: unknown) {
    showMessage(error instanceof Error ? `Erro: ${error.message}` : 'Erro ao atualizar perfil.', 'error');
  } finally {
    isSaving.value = false;
  }
};

const confirmarDelecao = (usuario: Usuario) => {
  abrirConfirmacao(
    'Excluir Conta',
    `Tem certeza que deseja remover o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`,
    'Excluir',
    async () => {
      actionMessage.value = null;
      try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/user/${usuario.id_usuario}/`, {
          method: 'DELETE',
        });

        if (response.status !== 204) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao remover o usuário.');
        }

        showMessage('Usuário removido com sucesso.', 'success');
        await fetchUsuarios(true);
        adminStore.lastFetchSolicitacoes = 0;
        setTimeout(voltarParaLista, 1000);
      } catch (error: unknown) {
        showMessage(error instanceof Error ? `Erro: ${error.message}` : 'Erro ao remover usuário.', 'error');
      }
    }
  );
};

onMounted(async () => {
  fetchUsuarios();
  fetchPerfis();
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

.center-msg { text-align: center; padding: 2.5rem; color: #9ca3af; font-size: 0.9rem; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Alertas inline */
.action-alert {
  padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 500; margin-bottom: 1rem;
}
.action-alert.success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.action-alert.error { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

.usr-list { padding: 0.15rem 0; }
.usr-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6rem 1.25rem; border-bottom: 1px solid #f6f7f8;
}
.usr-item:last-child { border-bottom: none; }
.usr-avatar {
  width: 32px; height: 32px; border-radius: 50%; background-color: #e5e7eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 0.75rem;
}
.avatar-icon { font-size: 1rem; color: #6b7280; }
.usr-info { flex: 1; min-width: 0; padding-right: 0.5rem; }
.usr-info strong { font-size: 0.9rem; color: #111827; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; word-break: break-all;}
.usr-sub { display: flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; color: #9ca3af; margin-top: 0.15rem; }

.usr-actions { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; border: 1px solid transparent; transition: 0.15s; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-outline { background: transparent; border-color: #d1d5db; color: #374151; }
.btn-outline:hover { background: #f9fafb; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.ibtn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 5px; border: none; cursor: pointer;
  font-size: 0.8rem; transition: all 0.12s;
}
.ibtn.sm { width: 22px; height: 22px; font-size: 0.7rem; }
.ibtn.gray { background: #f3f4f6; color: #6b7280; }
.ibtn.gray:hover:not(:disabled) { background: #e5e7eb; color: #374151; }
.ibtn.ghost { background: transparent; color: #d1d5db; }
.ibtn.ghost:hover:not(:disabled) { color: #ef4444; background: #fef2f2; }
.ibtn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 480px) {
  .usr-item { padding: 0.75rem 1rem; }
}
</style>
