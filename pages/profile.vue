<template>
  <div>
    <BackgroundImage />
    <TheHeader />
    <div class="container">
      <h1 class="title">Meu Perfil</h1>

      <div v-if="isLoading" class="status-container">
        <Icon name="i-lucide-loader-2" class="spinner" />
        <p>Carregando perfil...</p>
      </div>

      <div v-else-if="error" class="status-container">
        <Icon name="i-lucide-x-circle" class="icon-error" />
        <p class="text-error">{{ error }}</p>
      </div>

      <div v-else-if="user" class="profile-card">
        <div class="profile-header">
          <img :src="user.foto_perfil" alt="Foto do Perfil" class="profile-picture" />
          <div class="profile-info">
            <h2 class="user-name">{{ user.nome }}</h2>
            <p class="user-email">{{ user.email }}</p>
          </div>
        </div>

        <div class="profile-details">
          <div class="detail-item">
            <span class="detail-label">Tipo de Conta</span>
            <span class="detail-value profile-badge">{{ userProfileName }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Membro desde</span>
            <span class="detail-value">{{ formatarData(user.data_criacao_conta) }}</span>
          </div>
        </div>

        <div class="profile-actions">
          <button class="btn-primary" @click="handleSave">Salvar Alterações</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

interface User {
  id_usuario: number;
  email: string;
  nome: string;
  foto_perfil: string;
  data_criacao_conta: string;
  id_perfil: number | null;
}

interface Perfil {
  id_perfil: number;
  nome_perfil: string;
  descricao: string;
}

const router = useRouter();
const config = useRuntimeConfig();

const user = ref<User | null>(null);
const profiles = ref<Perfil[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const fetchProfiles = async () => {
  try {
    const response = await fetch(`${config.public.apiUrl}/api/perfil-acesso/`);
    if (!response.ok) throw new Error('Não foi possível carregar os tipos de perfil.');
    profiles.value = await response.json();
  } catch (err: any) {
    error.value = err.message;
  }
};

onMounted(async () => {
  const userDataString = localStorage.getItem('user_data');
  if (!userDataString) {
    router.push('/login');
    return;
  }
  user.value = JSON.parse(userDataString);

  await fetchProfiles();

  isLoading.value = false;
});

const userProfileName = computed(() => {
  if (user.value && user.value.id_perfil && profiles.value.length > 0) {
    const profile = profiles.value.find(p => p.id_perfil === user.value!.id_perfil);
    return profile ? profile.nome_perfil : 'Não definido';
  }
  return 'Não definido';
});

const formatarData = (dataString: string): string => {
  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return 'Data inválida';
  }
};

const handleSave = () => {
  // Lógica para salvar alterações do perfil (a ser implementada no futuro)
  alert('Funcionalidade de salvar ainda não implementada.');
};
</script>

<style scoped>
.container {
  max-width: 700px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #1f2937;
}

.profile-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1.5rem;
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

.user-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.user-email {
  color: #6b7280;
}

.profile-details {
  display: grid;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-weight: 500;
  color: #4b5563;
}

.detail-value {
  color: #1f2937;
}

.profile-badge {
  background-color: #e0e7ff;
  color: #4338ca;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.profile-actions {
  margin-top: 2rem;
  text-align: right;
}

.btn-primary {
  background-color: #374151;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.status-container { text-align: center; padding: 2rem; color: #6b7280; }
.spinner { font-size: 2.5rem; margin-bottom: 1rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>