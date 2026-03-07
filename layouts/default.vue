<template>
  <div class="default-layout">
    <BackgroundImage />
    <TheHeader class="app-header" />
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import BackgroundImage from '~/components/BackgroundImage.vue';
import TheHeader from '~/components/TheHeader.vue';
</script>

<style scoped>
.default-layout { position: relative; height: 100dvh; width: 100dvw; overflow: hidden; display: flex; flex-direction: column; }
.app-header { flex-shrink: 0; }
.main-content { flex: 1; display: flex; flex-direction: column; padding-top: 64px; overflow: hidden; width: 100%; box-sizing: border-box; }
</style>