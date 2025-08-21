<template>
  <BackgroundImage />
  <div class="onboarding-container">

    <div class="onboarding-card">
      <div class="logo-section">
        <img src="/img/logo.png" alt="Logo Instituição" class="logo" />
        <h2 class="app-title">Tipo de Conta</h2>
        <p>Escolha o tipo de conta que melhor descreve sua função para que possamos personalizar sua experiência:</p>
      </div>

        <form class="onboarding-form">
            <UserProfileList
                v-model:perfilSelecionado="perfilSelecionado"
                :onSuccess="(data) => { console.log('Perfis de usuário:', data); }"
                :onError="(error) => { console.error('Erro ao buscar perfis de usuário:', error); }"
            />
            <!-- submit -->
            <button type="submit" class="onboarding-button" @click="handleSubmit">Concluir</button>
        </form>

    </div>
  </div>
  <NuxtLoadingIndicator />
  <NuxtPage />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UserProfileList from '~/components/UserProfileList.vue';

const config = useRuntimeConfig();
const apiUrl = config.public.apiUrl;

const perfilSelecionado = ref<number | null>(null);
const user = ref<any>(null);
const userId = ref<number | null>(null);

onMounted(() => {
  const userJson = localStorage.getItem('user');
  user.value = userJson ? JSON.parse(userJson) : null;
  userId.value = user.value ? user.value.id_usuario : null;
});

const handleSubmit = async (event: Event) => {
  event.preventDefault();
  if (perfilSelecionado.value === null) {
    alert('Por favor, selecione um perfil antes de continuar.');
    return;
  }

  const backendResponse = await fetch(`${apiUrl}/api/user/${userId.value}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access') || ''}`,
      },
      body: JSON.stringify({ id_perfil: perfilSelecionado.value }),
    });
  

  if (backendResponse.ok) {
    const data = await backendResponse.json();
    alert('Perfil atualizado com sucesso!');
    
    // Adiciona um loading até que o usuário seja redirecionado
    useRouter().push('/'); // Redireciona para a página inicial após o onboarding
  } else {
    console.error('Erro ao atualizar dados do usuário:', backendResponse.statusText);
  }
};
</script>

<style scoped>
/* Variáveis CSS para cores e fontes, para facilitar a manutenção */
:root {
  --primary-color: #4CAF50; /* Um verde semelhante ao do botão */
  --text-color: #333;
  --light-text-color: #666;
  --border-color: #ddd;
  --background-color: #f0f2f5;
  --card-background: #fff;
  --link-color: #007bff;
}

.onboarding-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--background-color);
  font-family: 'Arial', sans-serif; /* Considere usar uma fonte mais adequada, se houver */
}

.onboarding-card {
  background-color: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  box-sizing: border-box;
  height: 500px;
}

.logo-section {
  margin-bottom: 30px;
}

.logo {
  max-width: 80px; /* Ajuste o tamanho do logo conforme a imagem */
  height: auto;
  margin-bottom: 10px;
}

.app-title {
  font-size: 1.5em;
  color: var(--text-color);
  font-weight: bold;
}

.onboarding-form {
  display: flex;
  flex-direction: column;
}

.onboarding-button {
  background-color: #515E54;
  color: white;
  padding: 14px 20px;
  border: none;
  border-radius: 5px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 150px;
  /* Centraliza o botão */
  margin: 0 auto;
}

.onboarding-button:hover {
  background-color: #3d473f; /* Um pouco mais escuro no hover */
}

.onboarding-button:disabled {
  background-color: #6b7c6f;
  cursor: not-allowed;
}

/* Mensagem de erro */
.error-message {
  background-color: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
  padding: 12px;
  border-radius: 5px;
  margin: 20px 0;
  font-size: 0.9em;
  text-align: center;
}

.success-message {
  background-color: #e8f5e9;
  border: 1px solid #4caf50;
  color: #2e7d32;
  padding: 12px;
  border-radius: 5px;
  margin: 20px 0;
  font-size: 0.9em;
  text-align: center;
}

@media (max-width: 600px) {
  .onboarding-card {
    margin: 20px; /* Adiciona um pouco de margem em telas menores */
    padding: 30px 20px;
  }
  .app-title {
    font-size: 1.3em;
  }
  .onboarding-button {
    padding: 12px 15px;
    font-size: 1em;
  }
}
</style>