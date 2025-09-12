<template>
  <div class="page-content-layout">
    <div class="page-header">
      <h1 class="page-title">{{ viewMode === 'list' ? 'Gerenciamento de Usuários' : `Editando Perfil` }}</h1>
      <button v-if="viewMode === 'edit'" @click="voltarParaLista" class="btn btn-outline">
        <Icon name="i-lucide-arrow-left" />
        <span>Voltar para a Lista</span>
      </button>
    </div>

    <div v-if="viewMode === 'edit' && usuarioSelecionado" class="scrollable-content">
      <div class="w-full max-w-lg mx-auto">
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-medium">Alterar Perfil de {{ usuarioSelecionado.nome }}</h3>
          </div>
          <form @submit.prevent="salvarPerfil">
            <div class="card-body">
              <div class="form-group">
                <label for="perfil" class="form-label">Selecione um novo perfil</label>
                <select id="perfil" v-model="perfilEditadoId" class="form-select">
                  <option v-for="perfil in perfis" :key="perfil.id_perfil" :value="perfil.id_perfil">
                    {{ perfil.nome_perfil }}
                  </option>
                </select>
              </div>
              <p class="text-sm text-gray-500 mt-4">
                Email: <strong>{{ usuarioSelecionado.email }}</strong>
              </p>
            </div>
            <div class="card-footer">
              <button type="button" class="btn btn-outline" @click="voltarParaLista">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="isSaving">
                {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <div v-if="viewMode === 'list'" class="card mt-6 scrollable-content">
      <div class="card-content">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuarios" :key="usuario.id_usuario">
              <td>{{ usuario.nome }}</td>
              <td>{{ usuario.email }}</td>
              <td>
                <span class="profile-badge">{{ usuario.nome_perfil || 'Não definido' }}</span>
              </td>
              <td class="actions-cell">
                <button @click="iniciarEdicao(usuario)" class="btn btn-ghost">
                  <Icon name="i-lucide-user-cog" />
                  <span>Alterar Perfil</span>
                </button>
                <button 
                  @click="confirmarDelecao(usuario)" 
                  class="btn btn-ghost btn-danger"
                  :disabled="usuario.id_usuario === loggedInUser?.id_usuario"
                  title="Remover usuário">
                  <Icon name="i-lucide-trash-2" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authenticatedFetch } from '~/utils/api';

definePageMeta({ layout: 'admin', middleware: 'admin-auth' });

const config = useRuntimeConfig();
const usuarios = ref([]);
const perfis = ref([]);
const isSaving = ref(false);
const usuarioSelecionado = ref(null);
const viewMode = ref('list');
const perfilEditadoId = ref(null);
const loggedInUser = ref(null);

const fetchUsuarios = async () => {
  const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/users/`);
  usuarios.value = await response.json();
};
const fetchPerfis = async () => {
  const response = await authenticatedFetch(`${config.public.apiUrl}/api/perfil-acesso/`);
  perfis.value = await response.json();
};

const voltarParaLista = () => {
  viewMode.value = 'list';
  usuarioSelecionado.value = null;
  perfilEditadoId.value = null;
};

const iniciarEdicao = (usuario) => {
  usuarioSelecionado.value = { ...usuario };
  perfilEditadoId.value = usuario.id_perfil;
  viewMode.value = 'edit';
};

const salvarPerfil = async () => {
  if (!usuarioSelecionado.value || perfilEditadoId.value === null) return;
  isSaving.value = true;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/user/${usuarioSelecionado.value.id_usuario}/`, {
      method: 'PUT',
      body: JSON.stringify({ id_perfil: perfilEditadoId.value }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar o perfil.');
    }

    alert('Perfil atualizado com sucesso!');
    voltarParaLista();
    await fetchUsuarios();
  } catch (error) {
    alert(`Erro: ${error.message}`);
  } finally {
    isSaving.value = false;
  }
};

const confirmarDelecao = async (usuario) => {
  if (confirm(`Tem certeza que deseja remover o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`)) {
    try {
      const response = await authenticatedFetch(`${config.public.apiUrl}/api/user/${usuario.id_usuario}/`, {
        method: 'DELETE',
      });

      if (response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao remover o usuário.');
      }

      alert('Usuário removido com sucesso.');
      await fetchUsuarios();
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  }
};

onMounted(async () => {
  const userDataString = localStorage.getItem('user_data');
  if (userDataString) {
    loggedInUser.value = JSON.parse(userDataString);
  }
  await Promise.all([fetchUsuarios(), fetchPerfis()]);
});
</script>

<style scoped>
.page-content-layout { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.page-header { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; padding-bottom: 1rem; }
.page-title { font-size: 1.75rem; font-weight: 700; }
.scrollable-content { flex-grow: 1; overflow-y: auto; padding-right: 1rem; }
.card { background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.card-content { padding: 0; overflow-x: auto; }
.card-header, .card-body, .card-footer { padding: 1.5rem; }
.card-header { border-bottom: 1px solid #e5e7eb; }
.card-footer { border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 0.75rem; }
.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid transparent; cursor: pointer; font-weight: 500; transition: all 0.2s; }
.btn-primary { background-color: #4f46e5; color: white; border-color: #4f46e5; }
.btn-primary:hover { background-color: #4338ca; }
.btn-outline { background-color: transparent; color: #4b5563; border-color: #d1d5db; }
.btn-outline:hover { background-color: #f9fafb; }
.btn-ghost { background-color: transparent; border-color: transparent; color: #6b7280; }
.btn-ghost:hover { background-color: #f3f4f6; }
.btn:disabled { opacity: 0.7; cursor: not-allowed; }
.form-label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #374151; }
.form-select { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; background-color: white; transition: border-color 0.2s, box-shadow 0.2s; }
.form-select:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3); }
.custom-table { width: 100%; border-collapse: collapse; }
.custom-table th, .custom-table td { padding: 0.75rem 1.5rem; text-align: left; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
.custom-table th.text-right { text-align: right; }
.custom-table tbody tr:last-child td { border-bottom: none; }
.profile-badge { background-color: #e0e7ff; color: #4338ca; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }
.actions-cell { text-align: right; display: flex; justify-content: flex-end; gap: 0.25rem; }
.btn-danger { color: #ef4444; }
.btn-danger:hover:not(:disabled) { background-color: #fee2e2; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.custom-table thead th { position: sticky; top: 0; background-color: white; z-index: 1; box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.05); }
</style>