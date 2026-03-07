<template>
  <div class="page-content-layout">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button @click="$router.push('/')" class="btn-back">
          <Icon name="i-lucide-arrow-left" />
        </button>
        <h1 class="page-title">Meu Perfil</h1>
      </div>
    </div>
    <div class="scrollable-list">
      <div class="profile-card-container">
        <div class="card">

        <div v-if="isLoading" class="status-container">
          <Icon name="i-lucide-loader-2" class="spinner" />
          <p>Carregando perfil...</p>
        </div>

        <div v-else-if="!user" class="status-container">
          <p class="text-error">Não foi possível carregar os dados do usuário.</p>
        </div>

        <div v-else class="profile-card-content" :class="{ 'is-admin': user.nome_perfil === 'Administrador' }">
          <div class="profile-col profile-col-left">
            <div class="profile-header">
              <img 
                v-if="user.foto_perfil && !imageLoadError" 
                :src="user.foto_perfil" 
                alt="Foto do Perfil" 
                class="profile-picture" 
                crossorigin="anonymous" 
                @error="handleImageError" />
              <div v-else class="profile-picture-placeholder profile-page-placeholder">
                <Icon name="i-lucide-user" />
              </div>
              
              <div class="profile-info">
                <h2 class="user-name">{{ user.nome }}</h2>
                <p class="user-email">{{ user.email }}</p>
              </div>
            </div>

            <div class="profile-details">
              <div class="detail-item">
                <span class="detail-label">Tipo de Conta</span>
                <span class="detail-value profile-badge">{{ user.nome_perfil || 'Não definido' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Membro desde</span>
                <span class="detail-value">{{ formatarData(user.data_criacao_conta) }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="user.nome_perfil === 'Administrador'" class="profile-col profile-col-right admin-section">
            <h3 class="section-title">Integrações e Segurança</h3>
            <div class="detail-item">
              <div class="detail-label">
                <strong>Conta Google</strong><br>
                <small>Vincule para fazer login rápido pelo botão Google.</small>
              </div>
              <div class="action-area">
                <div v-if="!user.google_id">
                  <GoogleSignInButton @success="(payload: any) => linkGoogleAccount(payload)" @error="handleLinkError" />
                </div>
                <span v-else class="profile-badge-success">Vinculada</span>
              </div>
            </div>
            <p v-if="linkError" class="text-error">{{ linkError }}</p>
            <p v-if="linkSuccess" class="text-success">{{ linkSuccess }}</p>
            
            <div v-if="!isEditingPassword" class="detail-item">
              <div class="detail-label">
                <strong>Senha de Acesso</strong><br>
                <small>Permite login offline por Email e Senha.</small>
              </div>
              <div class="action-area">
                <button @click="startPasswordEdit" class="btn btn-secondary">{{ user.tem_senha ? 'Alterar Senha' : 'Definir Senha' }}</button>
              </div>
            </div>

            <form v-else @submit.prevent="changePassword" class="password-form">
              <div class="form-group">
                <label for="new-password">Nova Senha</label>
                <div class="password-input-wrapper">
                  <input 
                    id="new-password"
                    :type="showPassword ? 'text' : 'password'" 
                    v-model="newPassword" 
                    class="form-input" 
                    placeholder="Mínimo de 8 caracteres" 
                    required 
                    minlength="8"
                    autocomplete="new-password" />
                  <button type="button" @click="showPassword = !showPassword" class="password-toggle-btn" :title="showPassword ? 'Ocultar ou mostrar' : 'Ocultar ou mostrar'">
                    <Icon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
                  </button>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" @click="cancelPasswordEdit" class="btn btn-outline">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="isSavingPassword">
                  <Icon v-if="isSavingPassword" name="i-lucide-loader-2" class="animate-spin" />
                  <span>Salvar</span>
                </button>
              </div>
            </form>
            <p v-if="passwordError" class="text-error">{{ passwordError }}</p>
            <p v-if="passwordSuccess" class="text-success">{{ passwordSuccess }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import GoogleSignInButton from '~/components/GoogleSignInButton.vue';
import { authenticatedFetch } from '~/utils/api';
import { formatarData } from '~/utils/formatters';

definePageMeta({ middleware: 'auth' });

const router = useRouter();
const userStore = useUserStore();
const user = computed(() => userStore.user);
const isLoading = ref(true);
const imageLoadError = ref(false);
const linkError = ref<string | null>(null);
const linkSuccess = ref<string | null>(null);
const passwordSuccess = ref<string | null>(null);
const config = useRuntimeConfig();

const newPassword = ref('');
const isSavingPassword = ref(false);
const passwordError = ref<string | null>(null);
const isEditingPassword = ref(false);
const showPassword = ref(false);

onMounted(() => {
  if (!userStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  isLoading.value = false;
});

const handleImageError = () => { imageLoadError.value = true; };
const handleLinkError = (error: string) => { linkError.value = `Erro: ${error}`; };

const linkGoogleAccount = async (googleResponse: { credential?: string }) => {
    if (!googleResponse.credential) {
        linkError.value = "Não foi possível obter a credencial do Google. Tente novamente.";
        return;
    }
    linkError.value = null;
    try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/link-google/`, {
            method: 'POST',
            body: JSON.stringify({ credential: googleResponse.credential }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Falha ao vincular a conta.');
        }
        userStore.setUser(data.user_data);
        linkSuccess.value = 'Conta Google vinculada com sucesso!';
    } catch (err: unknown) {
        linkError.value = err instanceof Error ? err.message : 'Erro ao vincular conta.';
    }
};

const startPasswordEdit = () => {
  isEditingPassword.value = true;
  passwordError.value = null;
  newPassword.value = '';
  showPassword.value = false;
};

const cancelPasswordEdit = () => {
  isEditingPassword.value = false;
};

const changePassword = async () => {
  if (!newPassword.value) {
    passwordError.value = "O campo de senha não pode estar vazio.";
    return;
  }
  if (newPassword.value.length < 8) {
    passwordError.value = "A senha deve ter pelo menos 8 caracteres.";
    return;
  }
  isSavingPassword.value = true;
  passwordError.value = null;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/change-password/`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword.value }),
    });
    const data = await response.json();
    if (!response.ok) {
      const errorMsg = Array.isArray(data.error) ? data.error.join(' ') : data.error;
      throw new Error(errorMsg || 'Não foi possível alterar a senha.');
    }
    passwordSuccess.value = data.detail || 'Senha alterada com sucesso!';
    
    if (userStore.user) {
      userStore.setUser({ ...userStore.user, tem_senha: true });
    }
    cancelPasswordEdit();
  } catch (err: unknown) {
    passwordError.value = err instanceof Error ? err.message : 'Erro ao alterar a senha.';
  } finally {
    isSavingPassword.value = false;
  }
};
</script>

<style scoped>
.page-content-layout {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 64px);
  padding: 1.5rem;
  box-sizing: border-box;
  background-color: #f9fafb;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.btn-back{ background: none; border: none; cursor: pointer; color: #4b5563; padding: 0.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: none; flex-shrink: 0; }
.btn-back:hover{ background: #f3f4f6; color: #111827; }

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.scrollable-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-bottom: 2rem;
}

.profile-card-container {
  width: 100%;
  max-width: 850px;
}

.card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

.profile-card-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.profile-col { flex: 1; min-width: 0; }
.profile-col-left { display: flex; flex-direction: column; gap: 1.25rem; }
.profile-col-right {
  display: flex; flex-direction: column; gap: 1rem;
  padding-top: 1.25rem; border-top: 1px solid #e5e7eb;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.profile-picture, .profile-picture-placeholder {
  width: 64px; height: 64px; border-radius: 50%;
  object-fit: cover; background-color: #e5e7eb;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; color: #9ca3af; flex-shrink: 0;
}

.profile-info { flex: 1; min-width: 0; }
.user-name { font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0 0 0.3rem 0; }
.user-email { font-size: 0.95rem; color: #6b7280; margin: 0; word-break: break-all; }

.profile-details {
  display: flex; flex-direction: column; gap: 1.25rem;
  padding-top: 1rem; border-top: 1px solid #f3f4f6;
}

.detail-item {
  display: flex; justify-content: space-between; align-items: center;
}

.detail-label { font-weight: 500; color: #4b5563; font-size: 0.95rem; }
.detail-label strong { color: #111827; }
.detail-label small { color: #6b7280; font-weight: 400; font-size: 0.85rem; display: block; margin-top: 0.2rem; line-height: 1.3; }
.detail-value { font-weight: 500; color: #111827; font-size: 0.95rem; }

.profile-badge {
  background-color: #e0e7ff; color: #4338ca;
  padding: 0.35rem 0.85rem; border-radius: 9999px;
  font-size: 0.85rem; font-weight: 600;
}

.section-title { font-size: 1.15rem; font-weight: 600; color: #111827; margin: 0 0 0.5rem 0; }

.action-area { min-width: 150px; text-align: right; max-width: 100%; overflow-x: auto; padding-bottom: 2px; }

.profile-badge-success {
  background-color: #dcfce7; color: #166534;
  padding: 0.35rem 0.85rem; border-radius: 9999px;
  font-size: 0.85rem; font-weight: 600; display: inline-block;
}

.text-error { color: #b91c1c; font-size: 0.85rem; margin-top: 0.5rem; text-align: right; }
.text-success { color: #15803d; font-size: 0.85rem; margin-top: 0.5rem; text-align: right; }

.password-form {
  background-color: #f9fafb; padding: 1.25rem;
  border-radius: 8px; border: 1px solid #e5e7eb;
}

.form-group { width: 100%; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem; color: #374151; }

.password-input-wrapper { position: relative; display: flex; align-items: center; }
.form-input {
  flex-grow: 1; padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem;
}
.form-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79,70,229,0.15); }

.password-toggle-btn {
  position: absolute; right: 0.5rem; background: none; border: none;
  cursor: pointer; color: #6b7280; font-size: 1.15rem; padding: 0.25rem;
}

.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid transparent;
  cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: 0.2s;
}
.btn-primary { background-color: var(--color-primary); color: white; }
.btn-primary:hover:not(:disabled) { background-color: var(--color-primary-hover); }
.btn-secondary { background-color: #fff; color: #4b5563; border-color: #d1d5db; }
.btn-secondary:hover { background-color: #f9fafb; }
.btn-outline { background-color: transparent; color: #4b5563; border-color: #d1d5db; border: 1px solid #d1d5db; }
.btn-outline:hover { background-color: #f9fafb; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.status-container { text-align: center; padding: 3rem; color: #6b7280; font-size: 0.95rem; }
.spinner { font-size: 2rem; animation: spin 1s linear infinite; margin-bottom: 0.5rem; }

@media (max-width: 768px) {
  .page-content-layout { padding: 1rem; }
  .profile-card-content.is-admin { flex-direction: column; }
  .profile-col-right { padding-left: 0; border-left: none; padding-top: 2rem; border-top: 1px solid #e5e7eb; }
  .card { padding: 1.5rem; }
  
  .detail-item { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .action-area { text-align: left; width: 100%; }
  .text-error { text-align: left; }
  
  .form-actions { justify-content: flex-start; width: 100%; }
  .form-actions .btn { flex: 1; }
}
@media (max-width: 480px) {
  .profile-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
}
</style>