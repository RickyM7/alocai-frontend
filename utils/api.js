let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
      .then(newToken => {
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, { ...options, headers });
      })
      .catch(err => {
        return Promise.reject(err);
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshToken();

      if (newToken) {
        processQueue(null, newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        processQueue(new Error('Sua sessão expirou. Por favor, faça login novamente.'));
        localStorage.removeItem('access');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
        throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
      }
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}