export default defineNuxtRouteMiddleware((to, from) => {
  // Ignora o middleware no lado do servidor
  if (process.server) return;

  const userDataString = localStorage.getItem('user_data');
  if (!userDataString) {
    // Se não há dados do usuário, redireciona para o login
    return navigateTo('/login');
  }

  try {
    const user = JSON.parse(userDataString);
    if (user.nome_perfil !== 'Administrador') {
      // Se não for admin, redireciona para a página inicial
      return navigateTo('/');
    }
  } catch (e) {
    // Em caso de erro ao parsear os dados, redireciona para o login por segurança
    return navigateTo('/login');
  }
});