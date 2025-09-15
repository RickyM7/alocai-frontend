<template>
  <div ref="userProfileList" class="user-profile-list">
    <div 
      v-for="perfil in perfis" 
      :key="perfil.id_perfil" 
      class="user-profile-card"
      :class="{ selected: perfilSelecionado === perfil.id_perfil }"
      @click="perfilSelecionado = perfil.id_perfil"
    >
      <input
        type="radio"
        :id="'perfil-' + perfil.id_perfil"
        :value="perfil.id_perfil"
        v-model="perfilSelecionado"
        name="perfil"
        class="profile-radio-input"
        tabindex="-1"
      />
      <div class="profile-card-content">
        <div class="profile-info">
          <label :for="'perfil-' + perfil.id_perfil" class="profile-label">
            {{ perfil.nome_perfil }}
          </label>
          <p class="profile-description">
            {{ perfil.descricao }}
          </p>
        </div>
        <div class="profile-radio-custom">
          <div class="radio-dot" :class="{ active: perfilSelecionado === perfil.id_perfil }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useRuntimeConfig } from '#app';

// Define as propriedades que o componente pode receber
interface Props {
  onSuccess: (userData: any) => void;
  onError: (error: string) => void;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:perfilSelecionado']);

const router = useRouter();
const config = useRuntimeConfig();
const userProfileList = ref<HTMLElement | null>(null);
const apiUrl = config.public.apiUrl;

// Assinatura da interface para o objeto retornado pelo Google
interface UserProfileRequest {
}

interface UserProfileResponse {
    id_perfil: number;
    nome_perfil: string;
    descricao: string;
}

const perfis = ref<UserProfileResponse[]>([]);
const perfilSelecionado = ref<number | null>(null);

const buscarPerfis = async () => {
  try {

    const backendResponse = await fetch(`${apiUrl}/api/perfil-acesso/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data: UserProfileResponse[] = await backendResponse.json();

    if (backendResponse.ok) {
      perfis.value = data;
      props.onSuccess(data);
    } else {
      props.onError('Erro ao buscar perfis de usuário');
    }

  } catch (error) {
    props.onError('Erro de conexão');
  }
};

onMounted(() => {
  buscarPerfis();
});

watch(perfilSelecionado, (novo) => {
    emit('update:perfilSelecionado', novo);
});
</script>

<style scoped>
.user-profile-list {
  display: grid;
  gap: 1.5rem;
  width: 100%;
}

@media (min-width: 1200px) {
  .user-profile-list {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .user-profile-list {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

@media (max-width: 767px) {
  .user-profile-list {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}

.user-profile-card {
  background-color: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-profile-card:hover {
  border-color: #cbd5e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-profile-card.selected {
  border-color: #515E54;
  box-shadow: 0 4px 12px rgba(81, 94, 84, 0.2);
  background-color: #ffffff;
}

.profile-radio-input {
  display: none;
}

.profile-card-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
}

.profile-info {
  flex: 1;
}

.profile-label {
  font-weight: 600;
  font-size: 1.1rem;
  color: #2d3748;
  cursor: pointer;
  display: block;
  margin-bottom: 8px;
  line-height: 1.3;
}

.profile-description {
  color: #718096;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.4;
}

.profile-radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e0;
  border-radius: 50%;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s ease;
}

.user-profile-card.selected .profile-radio-custom {
  border-color: #515E54;
  background-color: #515E54;
}

.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: transparent;
  transition: all 0.2s ease;
}

.radio-dot.active {
  background-color: #ffffff;
}

@media (max-width: 480px) {
  .user-profile-card {
    padding: 16px;
  }
  
  .profile-label {
    font-size: 1rem;
  }
  
  .profile-description {
    font-size: 0.9rem;
  }
  
  .profile-radio-custom {
    width: 18px;
    height: 18px;
  }
  
  .radio-dot {
    width: 6px;
    height: 6px;
  }
}
</style>