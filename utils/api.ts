let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

function getAccessToken(): string | null {
    if (!import.meta.client) return null;
    // Prefere a store (reativa, fonte única de verdade), fallback para localStorage
    try {
        const store = useUserStore();
        if (store.accessToken) return store.accessToken;
    } catch {
        // A store pode não estar inicializada ainda (ex: durante setup de plugin)
    }
    return localStorage.getItem('access');
}

async function refreshToken(): Promise<string | null> {
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
            if (import.meta.client) {
                localStorage.setItem('access', data.access);
                try {
                    useUserStore().setToken(data.access);
                } catch { /* store may not exist */ }
            }
            return data.access;
        }
        return null;
    } catch (error: unknown) {
        console.error('Falha ao renovar o token:', error);
        return null;
    }
}

function clearAuthState() {
    if (!import.meta.client) return;
    localStorage.removeItem('access');
    localStorage.removeItem('user_data');
    try {
        useUserStore().clear();
    } catch { /* store may not exist */ }
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getAccessToken();
    const config = useRuntimeConfig();

    const fullUrl = url.startsWith('http')
        ? url
        : `${config.public.apiUrl}${url}`;

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };
    // Só define Content-Type para bodies que não são FormData (FormData precisa do boundary definido pelo navegador)
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let response = await fetch(fullUrl, { ...options, credentials: 'include', headers });

    if (response.status === 401) {
        if (isRefreshing) {
            return new Promise<Response>((resolve, reject) => {
                failedQueue.push({
                    resolve: (newToken: string) => {
                        headers['Authorization'] = `Bearer ${newToken}`;
                        resolve(fetch(fullUrl, { ...options, credentials: 'include', headers }));
                    },
                    reject
                });
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
                const sessionError = new Error('Sua sessão expirou. Por favor, faça login novamente.');
                processQueue(sessionError);
                clearAuthState();
                if (import.meta.client) {
                    window.location.href = '/login';
                }
                throw sessionError;
            }
        } finally {
            isRefreshing = false;
        }
    }

    return response;
}
