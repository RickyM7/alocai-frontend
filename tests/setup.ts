import { vi } from 'vitest';

// Stub dos auto-imports do Nuxt indisponíveis no ambiente de teste
vi.stubGlobal('useRuntimeConfig', () => ({
    public: { apiUrl: '', googleClientId: '' },
}));
vi.stubGlobal('useRouter', () => ({ push: vi.fn(), replace: vi.fn() }));
vi.stubGlobal('useRoute', () => ({ params: {}, query: {} }));
vi.stubGlobal('navigateTo', vi.fn());
vi.stubGlobal('definePageMeta', vi.fn());
vi.stubGlobal('useUserStore', vi.fn());
