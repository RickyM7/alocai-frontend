<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isLoggedIn = ref(false);

onMounted(() => {
  // Verifica se o usuário está logado
  isLoggedIn.value = !!localStorage.getItem('access');
});
</script>

<template>
  <BackgroundImage />

  <TheHeader />

  <div>
    <NuxtLink to="/agendamentoSelectRecurso">
      <UButton icon="i-lucide-rocket" size="md" color="primary" variant="solid">Nova Reserva</UButton>
    </NuxtLink>
    <NuxtLink to="/minhasReservas">
      <UButton icon="i-lucide-calendar" size="md" color="secondary" variant="outline">Minhas Reservas</UButton>
    </NuxtLink>
  </div>

  <!-- Área de conteúdo após login -->
  <div v-if="isLoggedIn">
    <h1>Bem-vindo ao Alocaí</h1>
    <p>Você está logado e pode fazer reservas.</p>
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