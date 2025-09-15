<template>
  <div class="onboarding-container">
    <div class="onboarding-card">
      <div class="logo-section">
        <img src="/img/logo.webp" alt="Logo Instituição" class="logo" />
        <h2 class="app-title">Tipo de Conta</h2>
        <p class="description">Escolha o tipo de conta que melhor descreve sua função para que possamos personalizar sua experiência:</p>
      </div>

      <form class="onboarding-form" @submit.prevent="handleSubmit">
        <div class="profile-list-container">
          <UserProfileList
            v-model:perfilSelecionado="perfilSelecionado"
            :onSuccess="(data) => { perfis = data; }"
            :onError="(error) => { console.error('Erro ao buscar perfis de usuário:', error); }"
          />
        </div>
        <div class="button-container">
          <button type="submit" class="onboarding-button">Concluir</button>
        </div>
      </form>
    </div>
  </div>
  <NuxtLoadingIndicator />
  <NuxtPage />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UserProfileList from '~/components/UserProfileList.vue';
import type { User } from '~/types/user';

const config = useRuntimeConfig();
const router = useRouter();
const apiUrl = config.public.apiUrl;

const perfilSelecionado = ref<number | null>(null);
const user = ref<User | null>(null);
const userId = ref<number | null>(null);
const perfis = ref<any[]>([]);

// Ao montar o componente, busca os dados do usuário do localStorage
onMounted(() => {
  const userJson = localStorage.getItem('user_data');
  if (userJson) {
    user.value = JSON.parse(userJson) as User;
    userId.value = user.value?.id_usuario || null;
  } else {
    // Se não encontrar dados do usuário, redireciona para o login
    router.push('/login');
  }
});

const handleSubmit = async (event: Event) => {
  event.preventDefault();
  if (perfilSelecionado.value === null) {
    alert('Por favor, selecione um perfil antes de continuar.');
    return;
  }

  if (!userId.value) {
    alert('Não foi possível identificar o usuário. Por favor, faça login novamente.');
    router.push('/login');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/api/user/${userId.value}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access') || ''}`,
      },
      body: JSON.stringify({ id_perfil: perfilSelecionado.value }),
    });

    if (response.ok) {
      alert('Perfil definido com sucesso!');

      if (user.value) {
        const perfilEscolhido = perfis.value.find(p => p.id_perfil === perfilSelecionado.value);
        
        user.value.id_perfil = perfilSelecionado.value;
        if (perfilEscolhido) {
          user.value.nome_perfil = perfilEscolhido.nome_perfil;
        }
        
        localStorage.setItem('user_data', JSON.stringify(user.value));
      }
      
      router.push('/'); // Redireciona para a página inicial
    } else {
      const errorData = await response.json();
      console.error('Erro ao atualizar o perfil:', errorData);
      alert(`Erro ao salvar perfil: ${errorData.error || response.statusText}`);
    }
  } catch (error) {
    console.error('Erro de conexão:', error);
    alert('Erro de conexão ao tentar salvar o perfil.');
  }
};
</script>

<style scoped>
.onboarding-container {
  background-color: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  font-family: 'Arial', sans-serif;
}

.onboarding-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 800px;
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
  font-size: 1.75rem;
  color: #333;
  font-weight: bold;
  margin: 0 0 0.75rem 0;
}

.description {
  color: #666;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
}

.onboarding-form {
  display: flex;
  flex-direction: column;
}

.profile-list-container {
  padding: 2rem;
  max-height: 400px;
  overflow-y: auto;
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

.onboarding-button:disabled {
  background-color: #6b7c6f;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .onboarding-container {
    padding: 1.5rem;
  }
  
  .logo-section {
    padding: 1.5rem;
  }
  
  .app-title {
    font-size: 1.5rem;
  }
  
  .description {
    font-size: 0.9rem;
  }
  
  .profile-list-container {
    padding: 1.5rem;
    max-height: 300px;
  }
  
  .button-container {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
  }
  
  .onboarding-button {
    padding: 12px 24px;
    font-size: 1rem;
    width: 100%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .onboarding-container {
    padding: 1rem;
  }
  
  .onboarding-card {
    max-width: 100%;
  }
  
  .logo-section {
    padding: 1.25rem;
  }
  
  .app-title {
    font-size: 1.3rem;
  }
  
  .description {
    font-size: 0.85rem;
  }
  
  .profile-list-container {
    padding: 1.25rem;
    max-height: 250px;
  }
  
  .button-container {
    padding: 1rem 1.25rem;
  }
}
</style>