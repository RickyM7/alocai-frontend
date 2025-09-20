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

const canMakeReservations = computed(() => {
  if (!user.value || !user.value.nome_perfil) {
    return false;
  }
  return ['Administrador', 'Servidor'].includes(user.value.nome_perfil);
});
</script>

<style scoped>
.page-container {
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
}

.welcome-message {
  text-align: left;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: top;
  padding: 2rem 0;
}

.welcome-message h1 {
  margin-bottom: 0.5rem;
}

.actions-container {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
  padding: 0 16px;
}

:deep(.botoes) {
  background-color: #515E54;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6em;
  min-width: 150px;
  justify-content: center;
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
  font-size: 1.2em;
}

@media (max-width: 768px) {
  .actions-container {
    gap: 1rem;
    flex-direction: column;
    align-items: stretch;
    max-width: 280px;
    margin: 0 auto 2rem auto;
  }

  :deep(.botoes) {
    padding: 10px 16px;
    font-size: 0.9rem;
    min-width: unset;
    width: 100%;
  }

  .welcome-message h1 {
    font-size: 1.5rem;
  }

  .welcome-message p {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 0 12px;
  }

  .actions-container {
    max-width: 240px;
  }

  :deep(.botoes) {
    padding: 8px 14px;
    font-size: 0.85rem;
    gap: 0.5em;
  }

  :deep(.botoes .u-icon) {
    font-size: 1.1em;
  }

  .welcome-message h1 {
    font-size: 1.3rem;
  }

  .welcome-message p {
    font-size: 0.85rem;
  }
}
</style>