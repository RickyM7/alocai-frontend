<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { User } from '~/types/user';

const user = ref<User | null>(null);

onMounted(() => {
  const userDataString = localStorage.getItem('user_data');
  if (userDataString) {
    user.value = JSON.parse(userDataString);
  }
});

// Computed property para verificar se o usuário pode fazer reservas
const canMakeReservations = computed(() => {
  if (!user.value || !user.value.nome_perfil) {
    return false;
  }
  // Verifica se o perfil do usuário é um dos permitidos
  return ['Administrador', 'Servidor'].includes(user.value.nome_perfil);
});
</script>

<template>
  <div class="page-container">
    <div v-if="user" class="welcome-message">
      <h1>Bem-vindo, {{ user.nome.split(' ')[0] }}!</h1>
    </div>
    <div v-else class="welcome-message">
      <h1>Bem-vindo ao Alocaí</h1>
      <p>Faça login para gerenciar e criar suas reservas.</p>
    </div>

    <div class="actions-container">
      <template v-if="canMakeReservations">
        <NuxtLink to="/agendamentoSelectRecurso">
          <UButton class="botoes" icon="i-lucide-rocket">Nova Reserva</UButton>
        </NuxtLink>
        <NuxtLink to="/minhasReservas">
          <UButton class="botoes" icon="i-lucide-calendar">Minhas Reservas</UButton>
        </NuxtLink>
      </template>
      
      <NuxtLink to="/dashboard">
        <UButton class="botoes" icon="i-lucide-layout-dashboard">Dashboard</UButton>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.navbar {
  width: 100%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  height: 64px;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 10;
}

.navbar-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 32px;
}

.navbar-logo {
  height: 48px;
  margin-right: 32px;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

.navbar-icon {
  font-size: 1.6rem;
  color: #888;
  cursor: pointer;
}

.page-container {
  min-height: 90vh;
  display: flex;
  flex-direction: column;
}

.actions-container {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: auto;
  margin-bottom: 2rem;
}

:deep(.botoes) {
  background-color: #515E54;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 14px 28px;
  font-size: 1.1em;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.7em;
}

:deep(.botoes:hover) {
  background-color: #3d473f;
  box-shadow: 0 4px 16px rgba(81,94,84,0.12);
  transform: translateY(-2px) scale(1.03);
}

:deep(.botoes:active) {
  background-color: #6b7c6f;
  transform: scale(0.98);
}

:deep(.botoes .u-icon) {
  font-size: 1.3em;
  margin-right: 0.5em;
}
</style>