<template>
  <div class="app-layout">
    <BackgroundImage />
    <TheHeader class="app-header" />
    <main class="main-content">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
/* Estilos Globais */
body {
  margin: 0;
  font-family: sans-serif;
  background-color: #f1f5f9;
}

.app-layout {
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  flex-shrink: 0;
}

.main-content {
  flex-grow: 1;
  padding: 5px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
}
</style>