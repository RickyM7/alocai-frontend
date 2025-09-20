<template>
  <div class="page-container">
    <div class="login-card">
      <div class="logo-section">
        <img src="/img/logo.webp" alt="Logo Instituição" class="logo" />
        <h1 class="app-title">Acesso Administrativo</h1>
        <p class="description">Utilize suas credenciais para gerenciar o sistema.</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-content">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="email" required placeholder="email@institucional.com" />
          </div>
          <div class="form-group">
            <label for="password">Senha</label>
            <div class="password-input-wrapper">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                id="password" 
                v-model="password" 
                required 
                placeholder="••••••••" />
              <button type="button" @click="showPassword = !showPassword" class="password-toggle-btn" :title="showPassword ? 'Ocultar senha' : 'Mostrar senha'">
                <Icon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
              </button>
            </div>
          </div>
           <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </div>

        <div class="action-container">
          <button type="submit" class="login-button" :disabled="isLoading">
            <Icon v-if="isLoading" name="i-lucide-loader-2" class="animate-spin" />
            <span v-else>Entrar</span>
          </button>
          <div class="back-link-container">
            <NuxtLink to="/login" class="back-link">Voltar para o login de usuário</NuxtLink>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

definePageMeta({ layout: false });

const config = useRuntimeConfig();
const router = useRouter();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const error = ref(null);
const showPassword = ref(false);

const handleLogin = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch(`${config.public.apiUrl}/api/admin/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha na autenticação.');
    }

    localStorage.setItem('access', data.access);
    localStorage.setItem('user_data', JSON.stringify(data.user_data));

    router.push('/admin');

  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.page-container { background-color: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 0 1rem ; font-family: 'Arial', sans-serif; }
.login-card { background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); width: 100%; max-width: 480px; display: flex; flex-direction: column; }
.logo-section { padding: 2rem; text-align: center; border-bottom: 1px solid #f0f0f0; }
.logo { max-width: 80px; height: auto; margin-bottom: 1rem; }
.app-title { font-size: 1.75rem; color: #333; font-weight: bold; margin: 0 0 0.75rem 0; }
.description { color: #666; font-size: 1rem; line-height: 1.5; margin: 0; }
.form-content { padding: 2rem; }
.form-group { text-align: left; margin-bottom: 1.5rem; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
.form-group input { width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 1em; box-sizing: border-box; background-color: #ffffff; color: #111; transition: border-color 0.2s, box-shadow 0.2s; }
.form-group input::placeholder { color: #9aa0a6; opacity: 1; }
:deep(input:-webkit-autofill), :deep(textarea:-webkit-autofill), :deep(select:-webkit-autofill), input:-webkit-autofill, textarea:-webkit-autofill, select:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important; box-shadow: 0 0 0px 1000px #ffffff inset !important; -webkit-text-fill-color: #111 !important; caret-color: #111 !important; transition: background-color 5000s ease-in-out 0s; }
:deep(input:-moz-autofill), input:-moz-autofill { box-shadow: 0 0 0px 1000px #ffffff inset !important; -moz-text-fill-color: #111 !important; }
.form-group input:focus { outline: none; border-color: #515E54; box-shadow: 0 0 0 3px rgba(81,94,84,0.15); }
.password-input-wrapper { position: relative; display: flex; align-items: center; }
.password-input-wrapper input { padding-right: 45px; }
.password-toggle-btn { position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: #6b7280; font-size: 1.25rem; padding: 0.25rem; display: flex; align-items: center; }
.action-container { padding: 1.5rem 2rem 2rem 2rem; text-align: center; border-top: 1px solid #f0f0f0; }
.login-button { background-color: #515E54; color: white; padding: 14px 32px; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 500; cursor: pointer; transition: background-color 0.3s ease; min-width: 150px; width: 100%; display: inline-flex; justify-content: center; align-items: center; gap: 0.5rem; }
.login-button:hover { background-color: #3d473f; }
.login-button:disabled { background-color: #9ca3af; cursor: not-allowed; }
.error-message { background-color: #fef2f2; color: #991b1b; padding: 12px; border-radius: 8px; font-size: 0.9em; margin-top: 1.5rem; text-align: left; }
.back-link-container { margin-top: 1.5rem; }
.back-link { font-size: 0.9em; color: #515E54; text-decoration: none; font-weight: 500; }
.back-link:hover { text-decoration: underline; }
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@media (max-width:768px) {
  .logo-section { padding: 1.5rem; }
  .app-title { font-size: 1.5rem; }
  .description { font-size: 0.9rem; }
  .form-content { padding: 1.5rem; }
  .action-container { padding: 1rem 1.5rem 1.5rem 1.5rem; }
  .login-button { padding: 12px 24px; font-size: 1rem; width: 100%; max-width: 300px; }
}
@media (max-width:480px) {
  .login-card { max-width: 100%; }
  .logo-section { padding: 1.25rem; }
  .app-title { font-size: 1.3rem; }
  .description { font-size: 0.85rem; }
  .form-content { padding: 1.25rem; }
  .action-container { padding: 1rem 1.25rem; }
}
</style>