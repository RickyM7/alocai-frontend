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
      credentials: 'include',
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
  const config = useRuntimeConfig();

  const fullUrl = url.startsWith('http')
    ? url
    : `${config.public.apiUrl}${url}`;

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  let response = await fetch(fullUrl, { ...options, credentials: 'include', headers });

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
      .then(newToken => {
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(fullUrl, { ...options, credentials: 'include', headers });
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
        response = await fetch(fullUrl, { ...options, credentials: 'include', headers });
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