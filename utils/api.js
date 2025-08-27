async function refreshToken() {
  const config = useRuntimeConfig();
  try {
    const response = await fetch(`${config.public.apiUrl}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.access) {
      localStorage.setItem('access', data.access);
      return data.access;
    }
    return null;
  } catch (error) {
    console.error('Falha ao renovar o token:', error);
    return null;
  }
}

export async function authenticatedFetch(url, options = {}) {
  let token = localStorage.getItem('access');

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  let response = await fetch(url, { ...options, headers });

  // Se a requisição falhar com 401 (Unauthorized), tenta renovar o token
  if (response.status === 401) {
    const newToken = await refreshToken();

    if (newToken) {
      // Se a renovação for bem-sucedida, atualiza os headers e tenta a requisição novamente
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    } else {
      // Se a renovação falhar, desloga o usuário
      localStorage.removeItem('access');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
      throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
    }
  }

  return response;
}