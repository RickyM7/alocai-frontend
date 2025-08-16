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
        <span></span>
        <div>
          <label :for="'perfil-' + perfil.id_perfil" class="profile-label">
            {{ perfil.nome_perfil }}
          </label>
          <p class="profile-description">
            {{ perfil.descricao }}
          </p>
        </div>
        <span class="profile-radio-custom">
          <span :class="{ checked: perfilSelecionado === perfil.id_perfil }"></span>
        </span>
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
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin: 2rem 0;
}

.user-profile-card {
  position: relative;
  background: #fff;
  border: 1.5px solid #bbb;
  border-radius: 12px;
  padding: 1.5rem 2rem 1.5rem 1.5rem;
  min-width: 260px;
  max-width: 320px;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
}

.user-profile-card.selected {
  border-color: #3d4e43;
  box-shadow: 0 4px 16px 0 rgba(61,78,67,0.08);
}

.profile-radio-input {
  display: none;
}

.profile-card-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.profile-icon {
  font-size: 2rem;
  margin-top: 0.2rem;
  color: #3d4e43;
  min-width: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-label {
  font-weight: bold;
  font-size: 1.15rem;
  color: #222;
  cursor: pointer;
}

.profile-description {
  color: #666;
  font-size: 0.98rem;
  margin: 0.3rem 0 0 0;
}

.profile-radio-custom {
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #bbb;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.user-profile-card.selected .profile-radio-custom {
  border-color: #3d4e43;
}

.profile-radio-custom span {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.2s;
}

.profile-radio-custom span.checked {
  background: #3d4e43;
}
</style>