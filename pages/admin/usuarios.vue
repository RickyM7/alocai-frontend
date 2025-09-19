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
    
    <div v-if="viewMode === 'list'" class="scrollable-content">
      <div class="usuarios-grid">
        <div v-for="usuario in usuarios" :key="usuario.id_usuario" class="usuario-card">
          <div class="usuario-header">
            <div class="usuario-info">
              <div class="usuario-avatar">
                <Icon name="i-lucide-user" class="avatar-icon" />
              </div>
              <div class="usuario-details">
                <h3 class="usuario-nome">{{ usuario.nome }}</h3>
                <p class="usuario-email">{{ usuario.email }}</p>
              </div>
            </div>
            <div class="usuario-actions">
              <button @click="iniciarEdicao(usuario)" class="btn-action btn-primary" title="Alterar Perfil">
                <Icon name="i-lucide-user-cog" />
              </button>
              <button 
                @click="confirmarDelecao(usuario)" 
                class="btn-action btn-danger"
                :disabled="usuario.id_usuario === loggedInUser?.id_usuario"
                title="Remover usuário">
                <Icon name="i-lucide-trash-2" />
              </button>
            </div>
          </div>
          
          <div class="usuario-content">
            <div class="usuario-detail">
              <div class="detail-label">
                <Icon name="i-lucide-shield-check" class="detail-icon" />
                <span>Perfil de Acesso</span>
              </div>
              <span class="profile-badge">{{ usuario.nome_perfil || 'Não definido' }}</span>
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
.page-content-layout{display:flex;flex-direction:column;height:100%;overflow:hidden;padding:1rem}
.page-header{display:flex;justify-content:space-between;align-items:center;flex-shrink:0;padding-bottom:1rem}
.page-title{font-size:1.75rem;font-weight:700;color:#111827}
.scrollable-content{flex-grow:1;overflow-y:auto;padding:0rem}
.card{background-color:white;border-radius:.75rem;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.06);overflow:hidden}
.card-header,.card-body,.card-footer{padding:1.5rem}
.card-header{border-bottom:1px solid #e5e7eb;background-color:#f9fafb}
.card-footer{border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:.75rem;background-color:#f9fafb}
.form-group{margin-bottom:1rem}
.form-label{display:block;margin-bottom:.5rem;font-size:.875rem;font-weight:500;color:#374151}
.form-select{width:100%;padding:.5rem .75rem;border:1px solid #d1d5db;border-radius:.375rem;background-color:white;transition:border-color .2s,box-shadow .2s}
.form-select:focus{outline:none;border-color:#4f46e5;box-shadow:0 0 0 2px rgba(79,70,229,0.3)}
.usuarios-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1rem;padding:1rem}
.usuario-card{background-color:white;border-radius:.75rem;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.06);overflow:hidden;transition:all .2s;border:1px solid #e5e7eb}
.usuario-card:hover{box-shadow:0 4px 6px rgba(0,0,0,0.1),0 2px 4px rgba(0,0,0,0.06);border-color:#d1d5db}
.usuario-header{display:flex;justify-content:space-between;align-items:flex-start;padding:1.25rem 1.25rem 1rem;border-bottom:1px solid #f3f4f6}
.usuario-info{display:flex;align-items:center;gap:1rem;flex:1;min-width:0}
.usuario-avatar{width:48px;height:48px;border-radius:50%;background-color:#e5e7eb;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.avatar-icon{font-size:1.5rem;color:#6b7280}
.usuario-details{flex:1;min-width:0}
.usuario-nome{font-size:1.125rem;font-weight:600;color:#111827;margin:0 0 .25rem 0;line-height:1.4}
.usuario-email{font-size:.875rem;color:#6b7280;margin:0;word-break:break-all}
.usuario-actions{display:flex;gap:.375rem;flex-shrink:0}
.usuario-content{padding:1.25rem}
.usuario-detail{display:flex;flex-direction:column;gap:.5rem}
.detail-label{display:flex;align-items:center;gap:.5rem;font-size:.8125rem;color:#6b7280;font-weight:500;text-transform:uppercase;letter-spacing:.025em}
.detail-icon{font-size:.875rem}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border-radius:.375rem;border:1px solid transparent;cursor:pointer;font-weight:500;transition:all .2s;font-size:.875rem}
.btn-primary{background-color:#4f46e5;color:white;border-color:#4f46e5}
.btn-primary:hover{background-color:#4338ca}
.btn-outline{background-color:transparent;color:#4b5563;border-color:#d1d5db}
.btn-outline:hover{background-color:#f9fafb}
.btn:disabled{opacity:.7;cursor:not-allowed}
.btn-action{width:36px;height:36px;border:none;border-radius:.375rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;font-size:1rem}
.btn-action.btn-primary{background-color:#4f46e5;color:white}
.btn-action.btn-primary:hover{background-color:#4338ca}
.btn-action.btn-danger{background-color:#ef4444;color:white}
.btn-action.btn-danger:hover:not(:disabled){background-color:#dc2626}
.btn-action:disabled{opacity:.5;cursor:not-allowed}
.profile-badge{background-color:#e0e7ff;color:#4338ca;padding:.375rem .875rem;border-radius:9999px;font-size:.8125rem;font-weight:600;display:inline-block}
.text-sm{font-size:.875rem}
.text-gray-500{color:#6b7280}
.text-lg{font-size:1.125rem}
.font-medium{font-weight:500}
.mt-4{margin-top:1rem}
.w-full{width:100%}
.max-w-lg{max-width:32rem}
.mx-auto{margin-left:auto;margin-right:auto}

@media (max-width:1024px){
.usuarios-grid{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem}
.usuario-header{padding:1rem 1rem .875rem}
.usuario-content{padding:1rem}
.usuario-nome{font-size:1.0625rem}
}

@media (max-width:768px){
.page-header{flex-direction:column;align-items:flex-start;gap:1rem}
.page-title{font-size:1.5rem}
.scrollable-content{padding-right:.5rem}
.usuarios-grid{grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.875rem}
.usuario-header{padding:.875rem .875rem .75rem}
.usuario-content{padding:.875rem}
.usuario-info{gap:.75rem}
.usuario-avatar{width:40px;height:40px}
.avatar-icon{font-size:1.25rem}
.usuario-nome{font-size:1rem}
.usuario-email{font-size:.8125rem}
.btn-action{width:32px;height:32px;font-size:.875rem}
}

@media (max-width:480px){
.page-title{font-size:1.25rem}
.scrollable-content{padding-right:0}
.usuarios-grid{grid-template-columns:1fr;gap:.75rem}
.usuario-header{padding:.75rem .75rem .625rem}
.usuario-content{padding:.75rem}
.usuario-info{gap:.625rem}
.usuario-avatar{width:36px;height:36px}
.avatar-icon{font-size:1.125rem}
.usuario-nome{font-size:.9375rem}
.usuario-email{font-size:.75rem}
.btn-action{width:28px;height:28px;font-size:.8125rem}
.profile-badge{font-size:.75rem;padding:.25rem .625rem}
}
</style>