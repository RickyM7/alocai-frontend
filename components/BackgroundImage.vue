<template>
  <div ref="backgroundImage" class="background-image"></div>
</template>

<style scoped>
.background-image {
  background-image: url('/img/background.jpeg'); /* Ajuste o caminho da imagem */
  background-size: cover;
  background-position: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1; /* Coloca a imagem atrás do conteúdo */
}
</style>