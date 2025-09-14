<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-section">
        <img src="/img/logo.webp" alt="Logo Instituição" class="logo" />
        <h1 class="welcome-text">Bem Vindo</h1>
        <h1>Alocaí</h1>
        <h2 class="app-title">Agendamento de Recursos Compartilhados</h2>
      </div>

      <GoogleSignInButton
        @success="handleLoginSuccess"
        @error="handleLoginError"
        class="google-sign-in-button"
      />

      <div class="divider">
        <span>ou</span>
      </div>

      <div class="admin-login-container">
        <NuxtLink to="/admin/login" class="admin-login-link">
          Entrar como Administrador
        </NuxtLink>
      </div>

      <div v-if="message" class="success-message">
        {{ message }}
      </div>
      <div v-if="erro" class="error-message">
        {{ erro }}
      </div>
    </div>
  </div>
  <NuxtLoadingIndicator />
  <NuxtPage />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import GoogleSignInButton from '~/components/GoogleSignInButton.vue';
import type { User } from '~/types/user';

definePageMeta({
  layout: false
})

const message = ref<string | null>(null);
const erro = ref<string | null>(null);
const config = useRuntimeConfig();
const googleClientId = config.public.googleClientId;

const handleLoginSuccess = (userData: User) => {
  message.value = `Login bem-sucedido! Bem-vindo, ${userData.nome}!`;
  if (userData) {
    localStorage.setItem('user_data', JSON.stringify(userData));
  }

  if (userData.id_perfil) {
    window.location.href = '/';
  } else {
    useRouter().push('/onboarding');
  }
};

const handleLoginError = (error: string) => {
  erro.value = `Erro no login: ${error}`;
  console.error('Erro na autenticação:', error);
};

onMounted(() => {
  const token = localStorage.getItem('access');
  const userJson = localStorage.getItem('user_data');

  if (token && userJson) {
    try {
      const user: User = JSON.parse(userJson);
      if (user.id_perfil) {
        window.location.href = '/';
      } else {
        useRouter().push('/onboarding');
      }
    } catch (e) {
      console.error("Não foi possível ler os dados do usuário, limpando armazenamento local.", e);
      localStorage.removeItem('access');
      localStorage.removeItem('user_data');
    }
  }
});
</script>

<style scoped>
:root {
  --text-color: #333;
  --light-text-color: #666;
  --border-color: #ddd;
  --background-color: #f0f2f5;
}
.login-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 1rem; background-color: var(--background-color); font-family: 'Arial', sans-serif; }
.login-card { background-color: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); text-align: center; width: 100%; max-width: 450px; box-sizing: border-box; }
.logo-section { margin-bottom: 20px; }
.logo { max-width: 80px; height: auto; margin-bottom: 10px; }
.welcome-text { font-size: 1.2em; color: var(--light-text-color); margin-bottom: 5px; }
.app-title { font-size: 1.5em; color: var(--text-color); font-weight: bold; }
.google-sign-in-button { display: inline-block; margin-top: 1rem; }
.divider { display: flex; align-items: center; margin: 1.5rem 0; color: var(--light-text-color); }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background-color: var(--border-color); }
.divider span { padding: 0 15px; font-size: 0.9em; color: var(--light-text-color); }
.admin-login-container { text-align: center; }
.admin-login-link {
  color: #6b7280;
  text-decoration: none;
  font-size: 0.9em;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.2s, color 0.2s;
}
.admin-login-link:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}
.error-message { background-color: #ffebee; border: 1px solid #f44336; color: #c62828; padding: 12px; border-radius: 5px; margin-top: 20px; font-size: 0.9em; text-align: center; }
.success-message { background-color: #e8f5e9; border: 1px solid #4caf50; color: #2e7d32; padding: 12px; border-radius: 5px; margin-top: 20px; font-size: 0.9em; text-align: center; }
</style>