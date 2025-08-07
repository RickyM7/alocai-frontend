<script setup lang="ts">
</script>

<template>
  <BackgroundImage />

  <div class="navbar">
    <div class="navbar-content">
      <img src="/img/logo.png" alt="Logo UFAPE" class="navbar-logo" />
      <div class="navbar-actions">
        <Icon name="i-lucide-bell" class="navbar-icon" />
        <Icon name="i-lucide-user-circle" class="navbar-icon" />
      </div>
    </div>
  </div>

  <div>
    <UButton icon="i-lucide-rocket" size="md" color="primary" variant="solid">Nova Reserva</UButton>
    <UButton icon="i-lucide-calendar" size="md" color="secondary" variant="outline">Minhas Reservas</UButton>
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