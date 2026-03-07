<template>
  <div class="onboarding-container">
    <div class="onboarding-card">
      <div class="logo-section">
        <img src="/img/logo.webp" alt="Logo Instituição" class="logo" />
        <h2 class="app-title">Conta Criada com Sucesso!</h2>
      </div>

      <div class="info-section">
        <div class="info-icon">
          <Icon name="i-lucide-clock" />
        </div>
        <p class="description">
          Sua conta foi criada, mas ainda precisa ser aprovada por um administrador antes que você possa acessar o sistema.
        </p>
        <p class="sub-description">
          Um administrador será notificado e definirá seu perfil de acesso em breve.
          Após a aprovação, você poderá acessar todas as funcionalidades.
        </p>
      </div>

      <div class="button-container">
        <button class="onboarding-button" @click="voltarParaLogin">
          Voltar para o Login
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const router = useRouter();
const userStore = useUserStore();

onMounted(() => {
  if (!userStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  // Se o usuário já tem perfil, redireciona para a home
  if (userStore.hasPerfil) {
    router.push('/');
  }
});

const voltarParaLogin = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('user_data');
  userStore.clear();
  router.push('/login');
};
</script>

<style scoped>
.onboarding-container {
  background-color: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.onboarding-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 550px;
  display: flex;
  flex-direction: column;
}

.logo-section {
  padding: 2rem;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.logo {
  max-width: 80px;
  height: auto;
  margin-bottom: 1rem;
}

.app-title {
  font-size: 1.5rem;
  color: #333;
  font-weight: bold;
  margin: 0;
}

.info-section {
  padding: 2rem;
  text-align: center;
}

.info-icon {
  font-size: 3rem;
  color: #f59e0b;
  margin-bottom: 1rem;
}

.description {
  color: #374151;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
  font-weight: 500;
}

.sub-description {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.button-container {
  padding: 1.5rem 2rem 2rem 2rem;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.onboarding-button {
  background-color: #515E54;
  color: white;
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  min-width: 150px;
}

.onboarding-button:hover {
  background-color: #3d473f;
}

@media (max-width: 480px) {
  .onboarding-container { padding: 1rem; }
  .logo-section { padding: 1.25rem; }
  .app-title { font-size: 1.3rem; }
  .info-section { padding: 1.25rem; }
  .info-icon { font-size: 2.5rem; }
  .description { font-size: 0.9rem; }
  .sub-description { font-size: 0.85rem; }
  .button-container { padding: 1rem 1.25rem; }
}
</style>