<template>
  <div class="admin-layout">
    <TheHeader class="app-header" />
    <div class="admin-container">
      <nav class="admin-sidebar" :class="{ 'is-collapsed': isSidebarCollapsed }">
        <div class="sidebar-content">
          <button @click="toggleSidebar" class="nav-item toggle-btn" aria-label="Alternar menu" :title="isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'">
            <Icon :name="isSidebarCollapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-left'" class="text-xl"/>
          </button>
          <NuxtLink to="/admin" class="nav-item" active-class="is-active" :title="isSidebarCollapsed ? 'Solicitações' : ''">
            <Icon v-if="isSidebarCollapsed" name="i-lucide-clipboard-list" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Solicitações</span>
          </NuxtLink>
          <NuxtLink to="/admin/recursos" class="nav-item" active-class="is-active" :title="isSidebarCollapsed ? 'Recursos' : ''">
            <Icon v-if="isSidebarCollapsed" name="i-lucide-package" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Recursos</span>
          </NuxtLink>
          <NuxtLink to="/admin/usuarios" class="nav-item" active-class="is-active" :title="isSidebarCollapsed ? 'Usuários' : ''">
            <Icon v-if="isSidebarCollapsed" name="i-lucide-users" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Usuários</span>
          </NuxtLink>
        </div>
      </nav>
      <main class="admin-main-content">
        <div class="content-wrapper">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TheHeader from '~/components/TheHeader.vue';
const isSidebarCollapsed = ref(false);
const toggleSidebar = () => { isSidebarCollapsed.value = !isSidebarCollapsed.value; };
</script>

<style scoped>
.admin-layout{height:100vh;display:flex;flex-direction:column;overflow:hidden}
.app-header{position:fixed;top:0;left:0;right:0;z-index:100;flex-shrink:0}
.admin-container{display:flex;flex-grow:1;padding-top:64px;overflow:hidden}
.admin-sidebar{width:150px;background:#fff;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;flex-shrink:0;transition:width .2s ease-in-out}
.admin-sidebar.is-collapsed{width:80px}
.sidebar-content{padding:1rem}
.nav-item{display:flex;align-items:center;gap:.75rem;padding:.75rem;margin-bottom:.5rem;border-radius:6px;text-decoration:none;color:#374151;font-weight:500;white-space:nowrap;transition:background-color .2s,color .2s}
.nav-item:hover{background:#f3f4f6}
.nav-item.is-active{background:#e0e7ff;color:#4338ca}
.toggle-btn{width:100%;border:none;background:transparent;cursor:pointer;margin-bottom:1rem}
.nav-text{transition:opacity .2s ease}
.is-collapsed .nav-item{justify-content:center}
.is-collapsed .nav-text{opacity:0;width:0;overflow:hidden}
.admin-main-content{flex-grow:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.content-wrapper{padding:2rem;width:100%;max-width:1100px;margin:0 auto;display:flex;flex-direction:column;flex-grow:1;overflow:hidden;min-width:0}
</style>