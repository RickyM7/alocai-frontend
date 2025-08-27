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
          <UButton icon="i-lucide-rocket" size="lg" color="primary" variant="solid">Nova Reserva</UButton>
        </NuxtLink>
        <NuxtLink to="/minhasReservas">
          <UButton icon="i-lucide-calendar" size="lg" color="secondary" variant="outline">Minhas Reservas</UButton>
        </NuxtLink>
      </template>
      
      <NuxtLink to="/dashboard">
        <UButton icon="i-lucide-layout-dashboard" size="lg" color="secondary" variant="outline">Dashboard</UButton>
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
</style>