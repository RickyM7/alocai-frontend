<template>
  <div class="default-layout">
    <BackgroundImage />
    <TheHeader class="app-header" />
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import BackgroundImage from '~/components/BackgroundImage.vue';
import TheHeader from '~/components/TheHeader.vue';
</script>

<style scoped>
.default-layout { position: relative; height: 100vh; width: 100vw; overflow: hidden; display: flex; flex-direction: column; }
.app-header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; flex-shrink: 0; }
.main-content { flex-grow: 1; padding: 5px; padding-top: 64px; overflow-y: auto; width: 100%; box-sizing: border-box; }
</style>