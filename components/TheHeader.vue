<template>
  <div class="navbar">
    <div class="navbar-content">
      <NuxtLink to="/">
        <img src="/img/logo.webp" alt="Logo UFAPE" class="navbar-logo" />
      </NuxtLink>
      <div class="navbar-actions">
        <div class="notification-container" ref="notificationRef">
          <button @click="toggleNotificacoes" class="notification-button">
            <Icon name="i-lucide-bell" class="navbar-icon" />
            <span v-if="notificacaoStore.naoLidas > 0" class="notification-badge">{{ notificacaoStore.naoLidas }}</span>
          </button>
          <Transition name="dropdown">
            <div v-if="isNotificacoesOpen" class="notification-dropdown">
              <div class="notification-header">
                <h3>Notificações</h3>
                <button v-if="notificacaoStore.naoLidas > 0" @click.stop="marcarTodasComoLidas" class="mark-all-read-btn">
                  Marcar todas como lidas
                </button>
              </div>
              <ul class="notification-list">
                <li v-for="notificacao in notificacaoStore.notificacoes" :key="notificacao.id_notificacao" :class="{ 'unread': !notificacao.lida }" class="notification-item-wrapper">
                  <div @click="irParaAgendamento(notificacao)" class="notification-item">
                    <span class="unread-dot" v-if="!notificacao.lida"></span>
                    <div class="notification-content">
                      <p class="notification-message">{{ notificacao.mensagem }}</p>
                      <span class="notification-time">{{ formatarTempoRelativo(notificacao.data_criacao) }}</span>
                    </div>
                  </div>
                  <button @click.stop="excluirNotificacao(notificacao.id_notificacao)" class="delete-notification-btn" title="Excluir notificação">
                    <Icon name="i-lucide-x" />
                  </button>
                </li>
                <li v-if="notificacaoStore.notificacoes.length === 0" class="empty-notifications">
                  Nenhuma notificação.
                </li>
              </ul>
            </div>
          </Transition>
        </div>
        
        <div class="dropdown-container" ref="dropdownRef">
          <template v-if="isLoggedIn">
            <img 
              v-if="userProfilePicture && !imageLoadError"
              :src="userProfilePicture"
              alt="Foto do perfil"
              class="profile-picture"
              @click="toggleDropdown"
              crossorigin="anonymous"
              @error="handleImageError" />
            <div v-else class="profile-picture-placeholder logged-in-placeholder" @click="toggleDropdown">
              <Icon name="i-lucide-user" /> 
            </div>
          </template>
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
import type { User } from '~/types/user';
import type { Notificacao } from '~/types/notificacao';
import { useNotificacaoStore } from '~/stores/notificacao';

const router = useRouter();
const user = ref<User | null>(null);
const isLoggedIn = ref(false);
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const notificationRef = ref<HTMLElement | null>(null);
const userProfilePicture = ref<string | null>(null);
const imageLoadError = ref(false);
const notificacaoStore = useNotificacaoStore();
const isNotificacoesOpen = ref(false);

const formatarTempoRelativo = (dataString: string) => {
  const data = new Date(dataString);
  const agora = new Date();
  const diffSegundos = Math.round((agora.getTime() - data.getTime()) / 1000);

  if (diffSegundos < 60) return 'agora mesmo';
  const diffMinutos = Math.round(diffSegundos / 60);
  if (diffMinutos < 60) return `há ${diffMinutos} min`;
  const diffHoras = Math.round(diffMinutos / 60);
  if (diffHoras < 24) return `há ${diffHoras} h`;
  const diffDias = Math.round(diffHoras / 24);
  return `há ${diffDias} d`;
};

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('access');
  
  const userDataString = localStorage.getItem('user_data');
  if (userDataString) {
    try {
      user.value = JSON.parse(userDataString) as User;
      userProfilePicture.value = user.value.foto_perfil || null;
      imageLoadError.value = false; 
    } catch (error) {
      console.warn('Erro ao parsear dados do usuário:', error);
    }
  }
  
  document.addEventListener('click', handleClickOutside);

  if (isLoggedIn.value) {
    notificacaoStore.fetchNotificacoes();
    setInterval(() => {
      notificacaoStore.fetchNotificacoes();
    }, 15000);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdowns = () => {
  isDropdownOpen.value = false;
  isNotificacoesOpen.value = false;
};

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  const isClickInsideUserDropdown = dropdownRef.value && dropdownRef.value.contains(target);
  const isClickInsideNotificationDropdown = notificationRef.value && notificationRef.value.contains(target);

  if (!isClickInsideUserDropdown && !isClickInsideNotificationDropdown) {
    closeDropdowns();
  }
};

const handleImageError = () => {
  imageLoadError.value = true;
};

const logout = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('user_data');
  isLoggedIn.value = false;
  user.value = null;
  userProfilePicture.value = null;
  imageLoadError.value = false;
  closeDropdowns();
  window.location.href = '/';
};

const goToProfile = () => {
  closeDropdowns();
  router.push('/profile');
};

const goToLogin = () => {
  closeDropdowns();
  router.push('/login');
};

const goToAdmin = () => {
  closeDropdowns();
  router.push('/admin');
};

const toggleNotificacoes = () => {
  isNotificacoesOpen.value = !isNotificacoesOpen.value;
};

const marcarTodasComoLidas = () => {
  notificacaoStore.marcarComoLidas();
};

const excluirNotificacao = (id: number) => {
  notificacaoStore.excluirNotificacao(id);
};

const irParaAgendamento = (notificacao: Notificacao) => {
  if (!notificacao.lida) {
      notificacaoStore.marcarComoLidas();
  }
  closeDropdowns();
  if (user.value?.nome_perfil === 'Administrador') {
    router.push('/admin');
  } else {
    router.push('/minhasReservas');
  }
};

const menuItems = computed(() => {
  const items = [];

  if (isLoggedIn.value) {
    if (user.value?.nome_perfil === 'Administrador') {
      items.push({
        label: 'Painel do Admin',
        icon: 'i-lucide-shield-check',
        action: goToAdmin
      });
    }

    items.push(
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
    );
  } else {
    items.push({
      label: 'Entrar',
      icon: 'i-lucide-log-in',
      action: goToLogin
    });
  }
  
  return items;
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

.user-icon {
  font-size: 2.2rem;
  color: #9ca3af;
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

.profile-picture-placeholder.logged-in-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #4338ca;
  border: 2px solid #a5b4fc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.profile-picture-placeholder.logged-in-placeholder:hover {
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

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.notification-container {
  position: relative;
}

.notification-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -8px;
  background-color: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  width: 350px;
  z-index: 50;
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.notification-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.mark-all-read-btn {
  background: none;
  border: none;
  color: #4f46e5;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}

.notification-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
}

.notification-item-wrapper {
  display: flex;
  align-items: center;
  transition: background-color 0.15s;
}

.notification-item-wrapper:hover {
  background-color: #f9fafb;
}

.notification-item {
  flex-grow: 1;
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  gap: 12px;
}

.notification-item-wrapper.unread {
  background-color: #eff6ff;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #3b82f6;
  flex-shrink: 0;
  margin-top: 5px;
}

.notification-content {
  flex-grow: 1;
}

.notification-message {
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.4;
}

.notification-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.delete-notification-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 8px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.delete-notification-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.empty-notifications {
  padding: 24px;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .navbar-content {
    padding: 0 16px;
  }

  .navbar-logo {
    height: 40px;
    margin-right: 16px;
  }

  .navbar-actions {
    gap: 16px;
  }

  .navbar-icon {
    font-size: 1.4rem;
  }

  .user-icon {
    font-size: 1.8rem;
  }

  .notification-dropdown {
    width: calc(100vw - 32px);

    max-width: 320px;
  }

  .notification-header h3 {
    font-size: 0.9rem;
  }

  .mark-all-read-btn {
    font-size: 0.75rem;
  }

  .notification-message {
    font-size: 0.85rem;
  }

  .notification-time {
    font-size: 0.7rem;
  }

  .empty-notifications {
    font-size: 0.85rem;
    padding: 20px;
  }
}
</style>