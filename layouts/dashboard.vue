<template>
  <div class="dashboard-layout">
    <TheHeader class="app-header" />
    <main class="dashboard-main">
      <div class="content-wrapper">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import TheHeader from '~/components/TheHeader.vue'
</script>

<style scoped>
.dashboard-layout{height:100vh;display:flex;flex-direction:column;overflow:hidden}
.app-header{position:fixed;top:0;left:0;right:0;z-index:100;flex-shrink:0}
.dashboard-main{flex:1;display:flex;flex-direction:column;padding-top:64px;overflow:hidden;min-width:0}
.content-wrapper{padding:2rem;width:100%;max-width:1100px;margin:0 auto;display:flex;flex-direction:column;flex:1;overflow:hidden;min-width:0}
@media(max-width:48rem){.content-wrapper{padding:0rem}}
</style>