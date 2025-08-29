<template>
  <div>
    <div class="page-container">
      <div class="card">
        <h1 class="title">Meu Perfil</h1>

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
          
          <div class="profile-actions">
            <button class="btn-primary" @click="handleSave">Salvar Alterações</button>
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

const router = useRouter();
const user = ref<User | null>(null);
const isLoading = ref(true);
const imageLoadError = ref(false);

onMounted(() => {
  const userDataString = localStorage.getItem('user_data');
  if (!userDataString) {
    router.push('/login');
    return;
  }
  user.value = JSON.parse(userDataString);
  isLoading.value = false;
  imageLoadError.value = false;
});

const formatarData = (dataString: string): string => {
  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return 'Data inválida';
  }
};

const handleImageError = () => {
  imageLoadError.value = true;
  console.warn('Falha ao carregar a foto do perfil na página de perfil.');
};

const handleSave = () => {
  alert('Funcionalidade de salvar ainda não implementada.');
};
</script>

<style scoped>
.page-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  width: 100%;
  max-width: 700px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}
.title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #1f2937;
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

.user-name { font-size: 1.5rem; font-weight: 600; }
.user-email { color: #6b7280; }
.profile-details { display: grid; gap: 1rem; }
.detail-item { display: flex; justify-content: space-between; align-items: center; }
.detail-label { font-weight: 500; color: #4b5563; }
.profile-badge {
  background-color: #e0e7ff;
  color: #4338ca;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}
.profile-actions { margin-top: 2rem; text-align: right; }
.btn-primary { background-color: #374151; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; }
.status-container { text-align: center; padding: 2rem; color: #6b7280; }
.spinner { font-size: 2.5rem; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>