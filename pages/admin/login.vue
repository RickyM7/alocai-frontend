<template>
  <div class="admin-login-container">
    <div class="login-card">
      <div class="logo-section">
        <img src="/img/logo.webp" alt="Logo Instituição" class="logo" />
        <h1 class="welcome-text">Acesso Administrativo</h1>
        <h2 class="app-title">Alocaí</h2>
      </div>

      <form @submit.prevent="handleLogin">
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

        <button type="submit" class="login-button" :disabled="isLoading">
          <Icon v-if="isLoading" name="i-lucide-loader-2" class="animate-spin" />
          <span v-else>Entrar</span>
        </button>
      </form>
       <div class="back-link-container">
          <NuxtLink to="/login" class="back-link">Voltar para o login de usuário</NuxtLink>
        </div>
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
.admin-login-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f0f2f5; }
.login-card { background-color: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); text-align: center; width: 100%; max-width: 400px; }
.logo-section { margin-bottom: 30px; }
.logo { max-width: 60px; height: auto; margin-bottom: 10px; }
.welcome-text { font-size: 1.5em; color: #333; font-weight: bold; }
.app-title { font-size: 1.2em; color: #666; }
.form-group { text-align: left; margin-bottom: 1.5rem; }
.form-group label { display: block; margin-bottom: 8px; font-weight: bold; color: #333; }
.form-group input { width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em; box-sizing: border-box; }
.password-input-wrapper { position: relative; display: flex; align-items: center; }
.password-input-wrapper input { padding-right: 40px; /* Espaço para o ícone */ }
.password-toggle-btn { position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: #6b7280; font-size: 1.25rem; padding: 0.25rem; }
.login-button { background-color: #374151; color: white; padding: 14px 20px; border: none; border-radius: 5px; font-size: 1.1em; cursor: pointer; width: 100%; margin-top: 1rem; display: inline-flex; justify-content: center; align-items: center; gap: 0.5rem; }
.login-button:disabled { background-color: #9ca3af; }
.error-message { background-color: #fecaca; color: #991b1b; padding: 12px; border-radius: 5px; margin-top: 1rem; font-size: 0.9em; }
.back-link-container { margin-top: 1.5rem; }
.back-link { font-size: 0.9em; color: #4f46e5; text-decoration: none; }
.back-link:hover { text-decoration: underline; }
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>