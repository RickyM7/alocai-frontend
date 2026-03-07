export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  const userStore = useUserStore();
  if (!userStore.isAuthenticated) return navigateTo('/login');
  if (!userStore.isAdmin) return navigateTo('/');
});