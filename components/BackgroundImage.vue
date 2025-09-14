<template>
  <div ref="backgroundImage" class="background-image"></div>
</template>

<style scoped>
.background-image {
  background-image: url('/img/background.webp');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

@media (max-width: 768px) {
  .background-image {
    background-image: url('/img/bg_tela_pequena.webp');
  }
}
</style>