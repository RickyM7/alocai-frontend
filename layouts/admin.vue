<template>
  <div class="admin-layout">
    <TheHeader class="app-header" />
    <div class="admin-container">
      <nav class="admin-sidebar" :class="{ 'is-collapsed': isSidebarCollapsed }">
        <div class="sidebar-content">
          <button @click="toggleSidebar" class="nav-item toggle-btn" aria-label="Alternar menu" :title="isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'">
            <Icon :name="isSidebarCollapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-left'" class="nav-icon"/>
          </button>
          <NuxtLink to="/admin" class="nav-item" active-class="is-active" :title="isSidebarCollapsed ? 'Solicitações' : ''">
            <Icon name="i-lucide-clipboard-list" class="nav-icon" />
            <span class="nav-text">Solicitações</span>
          </NuxtLink>
          <NuxtLink to="/admin/recursos" class="nav-item" active-class="is-active" :title="isSidebarCollapsed ? 'Recursos' : ''">
            <Icon name="i-lucide-package" class="nav-icon" />
            <span class="nav-text">Recursos</span>
          </NuxtLink>
          <NuxtLink to="/admin/usuarios" class="nav-item" active-class="is-active" :title="isSidebarCollapsed ? 'Usuários' : ''">
            <Icon name="i-lucide-users" class="nav-icon" />
            <span class="nav-text">Usuários</span>
          </NuxtLink>
        </div>
      </nav>
      <div class="mobile-nav">
        <NuxtLink to="/admin" class="mobile-nav-item" active-class="is-active">
          <Icon name="i-lucide-clipboard-list" />
          <span>Solicitações</span>
        </NuxtLink>
        <NuxtLink to="/admin/recursos" class="mobile-nav-item" active-class="is-active">
          <Icon name="i-lucide-package" />
          <span>Recursos</span>
        </NuxtLink>
        <NuxtLink to="/admin/usuarios" class="mobile-nav-item" active-class="is-active">
          <Icon name="i-lucide-users" />
          <span>Usuários</span>
        </NuxtLink>
      </div>
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
.admin-sidebar{width:150px;background:#fff;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;flex-shrink:0;transition:width .15s ease-out}
.admin-sidebar.is-collapsed{width:60px}
.sidebar-content{padding:.75rem}
.nav-item{display:flex;align-items:center;gap:.5rem;padding:.5rem;margin-bottom:.25rem;border-radius:6px;text-decoration:none;color:#374151;font-weight:500;font-size:.875rem;white-space:nowrap;transition:background-color .1s ease-out;position:relative;overflow:hidden}
.nav-item:hover{background:#f3f4f6}
.nav-item.is-active{background:#e0e7ff;color:#4338ca}
.toggle-btn{width:100%;border:none;background:transparent;cursor:pointer;margin-bottom:.75rem}
.nav-icon{width:18px;height:18px;flex-shrink:0}
.nav-text{transition:opacity .1s ease-out;white-space:nowrap;margin-left:.25rem}
.is-collapsed .nav-item{justify-content:center;gap:0;padding:.5rem}
.is-collapsed .nav-text{opacity:0;width:0;margin-left:0;overflow:hidden}
.is-collapsed .nav-item.is-active{border-radius:4px}
.admin-main-content{flex-grow:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.content-wrapper{padding:0;width:100%;max-width:none;margin:0;display:flex;flex-direction:column;flex-grow:1;overflow:auto;min-width:0}
.mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e5e7eb;z-index:90;padding:.5rem;flex-direction:row;justify-content:space-around}
.mobile-nav-item{display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.5rem;border-radius:6px;text-decoration:none;color:#374151;font-weight:500;font-size:.75rem;min-width:0;text-align:center}
.mobile-nav-item:hover{background:#f3f4f6}
.mobile-nav-item.is-active{background:#e0e7ff;color:#4338ca}
.mobile-nav-item span{font-size:.7rem;line-height:1}
@media (max-width:768px){
.admin-sidebar{display:none}
.mobile-nav{display:flex}
.admin-main-content{padding-bottom:80px}
.content-wrapper{padding:0}
}
</style>