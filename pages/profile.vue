<template>
  <div>
    <div class="page-container">
      <div class="card">
        <div class="card-header">
          <button @click="$router.push('/')" class="back-button">
            <Icon name="i-lucide-arrow-left" />
          </button>
          <h1 class="title">Meu Perfil</h1>
        </div>

        <div v-if="isLoading" class="status-container">
          <Icon name="i-lucide-loader-2" class="spinner" />
          <p>Carregando perfil...</p>
        </div>

        <div v-else-if="!user" class="status-container">
          <p class="text-error">Não foi possível carregar os dados do usuário.</p>
        </div>

        <div v-else class="profile-card-content">
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
          
          <div v-if="user.nome_perfil === 'Administrador'" class="admin-section">
            <h3 class="section-title">Integrações e Segurança</h3>
            <div class="detail-item">
              <div class="detail-label">
                <strong>Conta Google</strong><br>
                <small>Vincule sua conta para fazer login com o Google.</small>
              </div>
              <div class="action-area">
                <div v-if="!user.google_id">
                  <GoogleSignInButton @success="linkGoogleAccount" @error="handleLinkError" />
                </div>
                <span v-else class="profile-badge-success">Vinculada</span>
              </div>
            </div>
            <p v-if="linkError" class="text-error">{{ linkError }}</p>
            
            <div v-if="!isEditingPassword" class="detail-item">
              <div class="detail-label">
                <strong>Senha de Acesso</strong><br>
                <small>Use para entrar pela tela de login de administrador.</small>
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
                  <button type="button" @click="showPassword = !showPassword" class="password-toggle-btn" :title="showPassword ? 'Ocultar senha' : 'Mostrar senha'">
                    <Icon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
                  </button>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" @click="cancelPasswordEdit" class="btn btn-outline">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="isSavingPassword">
                  <Icon v-if="isSavingPassword" name="i-lucide-loader-2" class="animate-spin" />
                  <span>Salvar Nova Senha</span>
                </button>
              </div>
            </form>
            <p v-if="passwordError" class="text-error">{{ passwordError }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { User } from '~/types/user';
import GoogleSignInButton from '~/components/GoogleSignInButton.vue';
import { authenticatedFetch } from '~/utils/api';

const router = useRouter();
const user = ref<User | null>(null);
const isLoading = ref(true);
const imageLoadError = ref(false);
const linkError = ref<string | null>(null);
const config = useRuntimeConfig();

const newPassword = ref('');
const isSavingPassword = ref(false);
const passwordError = ref<string | null>(null);
const isEditingPassword = ref(false);
const showPassword = ref(false);

onMounted(() => {
  const userDataString = localStorage.getItem('user_data');
  if (!userDataString) {
    router.push('/login');
    return;
  }
  user.value = JSON.parse(userDataString);
  isLoading.value = false;
});

const formatarData = (dataString: string): string => {
  try {
    return new Date(dataString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return 'Data inválida';
  }
};

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
        localStorage.setItem('user_data', JSON.stringify(data.user_data));
        user.value = data.user_data;
        alert('Conta Google vinculada com sucesso!');
    } catch (err: any) {
        linkError.value = err.message;
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
  isSavingPassword.value = true;
  passwordError.value = null;
  try {
    const response = await authenticatedFetch(`${config.public.apiUrl}/api/admin/change-password/`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword.value }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Não foi possível alterar a senha.');
    }
    alert(data.detail);
    
    if (user.value) {
        user.value.tem_senha = true;
        localStorage.setItem('user_data', JSON.stringify(user.value));
    }

    cancelPasswordEdit();
  } catch (err: any) {
    passwordError.value = err.message;
  } finally {
    isSavingPassword.value = false;
  }
};
</script>

<style scoped>
.page-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.card {
  width: 100%;
  max-width: 600px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.back-button {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  transition: all 0.2s;
  font-size: 1.2rem;
}

.back-button:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.profile-picture {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.profile-picture-placeholder.profile-page-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #9ca3af;
  border: 3px solid #fff;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.user-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.user-email {
  color: #6b7280;
  margin: 0;
}

.profile-details {
  display: grid;
  gap: 1rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label {
  font-weight: 500;
  color: #4b5563;
}

.detail-label small {
  color: #6b7280;
  font-weight: 400;
  font-size: 0.8em;
  display: block;
  margin-top: 4px;
}

.detail-value {
  font-weight: normal;
}

.profile-badge {
  background-color: #e0e7ff;
  color: #4338ca;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-container {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.spinner {
  font-size: 2.5rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.admin-section {
  margin-top: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
}

.action-area {
  min-width: 220px;
  text-align: right;
}

.profile-badge-success {
  background-color: #dcfce7;
  color: #166534;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.text-error {
  color: #b91c1c;
  font-size: 0.9em;
  margin-top: 0.5rem;
  text-align: right;
}

.password-form {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.form-group {
  width: 100%;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9em;
  color: #374151;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  flex-grow: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.password-toggle-btn {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 1.25rem;
  padding: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
}

.btn-secondary {
  background-color: #fff;
  color: #4b5563;
  border-color: #d1d5db;
  border: 1px solid #d1d5db;
}

.btn-outline {
  background-color: transparent;
  color: #4b5563;
  border-color: #d1d5db;
  border: 1px solid #d1d5db;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@media (max-width: 768px) {
  .page-container {
    padding: 0rem;
    font-size: 0.8rem;
  }

    .card {
    padding: 1rem;
    margin: 0.5rem;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .action-area {
    min-width: unset;
    text-align: left;
    width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>