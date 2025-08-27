<template>
  <div class="navbar">
    <div class="navbar-content">
      <NuxtLink to="/">
        <img src="/img/logo.png" alt="Logo UFAPE" class="navbar-logo" />
      </NuxtLink>
      <div class="navbar-actions">
        <Icon name="i-lucide-bell" class="navbar-icon" />
        
        <div class="dropdown-container" ref="dropdownRef">
          <img 
            v-if="isLoggedIn && userProfilePicture"
            :src="userProfilePicture"
            alt="Foto do perfil"
            class="profile-picture"
            @click="toggleDropdown"
          />
          <Icon 
            v-else
            name="i-lucide-user-circle" 
            class="navbar-icon user-icon" 
            @click="toggleDropdown"
          />
          
          <Transition name="dropdown">
            <div v-if="isDropdownOpen" class="dropdown-menu">
              <div 
                v-for="item in menuItems" 
                :key="item.label"
                class="dropdown-item"
                @click="item.action"
              >
                <Icon :name="item.icon" class="dropdown-icon" />
                <span>{{ item.label }}</span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoggedIn = ref(false);
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const userProfilePicture = ref<string | null>(null);

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('access');
  
  const userData = localStorage.getItem('user_data');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      userProfilePicture.value = user.foto_perfil || null;
    } catch (error) {
      console.warn('Erro ao parsear dados do usuário:', error);
    }
  }
  
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (dropdownRef.value && !dropdownRef.value.contains(target)) {
    closeDropdown();
  }
};

const logout = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('user_data');
  isLoggedIn.value = false;
  userProfilePicture.value = null;
  closeDropdown();
  window.location.href = '/';
};

const goToProfile = () => {
  closeDropdown();
  router.push('/profile');
};

const goToLogin = () => {
  closeDropdown();
  router.push('/login');
};

const menuItems = computed(() => {
  if (isLoggedIn.value) {
    return [
      {
        label: 'Meu Perfil',
        icon: 'i-lucide-user',
        action: goToProfile
      },
      {
        label: 'Sair',
        icon: 'i-lucide-log-out',
        action: logout
      }
    ];
  } else {
    return [
      {
        label: 'Entrar',
        icon: 'i-lucide-log-in',
        action: goToLogin
      }
    ];
  }
});
</script>

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
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s ease;
}

.navbar-icon:hover {
  color: #374151;
}

.user-icon:hover {
  color: #2563eb;
}

.profile-picture {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid #e5e7eb;
  transition: all 0.2s ease;
}

.profile-picture:hover {
  border-color: #2563eb;
  transform: scale(1.05);
}

.dropdown-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 200px;
  z-index: 50;
  overflow: hidden;
  transform-origin: top right;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: #f8fafc;
  color: #1f2937;
}

.dropdown-item:hover .dropdown-icon {
  color: #2563eb;
}

.dropdown-icon {
  font-size: 18px;
  color: #6b7280;
  transition: color 0.15s ease;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>