import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAdminStore } from '../stores/admin';

vi.stubGlobal('useRuntimeConfig', () => ({
    public: { apiUrl: 'http://localhost:8000' }
}));

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));

vi.mock('../utils/api', () => ({
    authenticatedFetch: mockFetch,
}));

describe('useAdminStore — fetchRecursos', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('fetches and populates recursos on success', async () => {
        const store = useAdminStore();
        const mockRecursos = [
            { id_recurso: 1, nome_recurso: 'Lab A', status_recurso: 'disponivel' },
            { id_recurso: 2, nome_recurso: 'Lab B', status_recurso: 'em_manutencao' },
        ];
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockRecursos,
        });

        await store.fetchRecursos();

        expect(store.recursos).toEqual(mockRecursos);
        expect(store.loadingRecursos).toBe(false);
        expect(store.lastFetchRecursos).toBeGreaterThan(0);
    });

    it('does not fetch again within cache time', async () => {
        const store = useAdminStore();
        store.recursos = [{ id_recurso: 1, nome_recurso: 'Cached' }] as any;
        store.lastFetchRecursos = Date.now();

        await store.fetchRecursos();

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('force bypasses cache', async () => {
        const store = useAdminStore();
        store.recursos = [{ id_recurso: 1, nome_recurso: 'Cached' }] as any;
        store.lastFetchRecursos = Date.now();

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id_recurso: 2, nome_recurso: 'Fresh' }],
        });

        await store.fetchRecursos(true);

        expect(mockFetch).toHaveBeenCalled();
        expect(store.recursos[0].nome_recurso).toBe('Fresh');
    });

    it('does not update state on failed response', async () => {
        const store = useAdminStore();
        mockFetch.mockResolvedValueOnce({ ok: false });

        await store.fetchRecursos();

        expect(store.recursos).toHaveLength(0);
        expect(store.loadingRecursos).toBe(false);
    });

    it('handles network error gracefully', async () => {
        const store = useAdminStore();
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await store.fetchRecursos();

        expect(store.recursos).toHaveLength(0);
        expect(store.loadingRecursos).toBe(false);
        consoleSpy.mockRestore();
    });

    it('prevents concurrent fetches', async () => {
        const store = useAdminStore();
        store.loadingRecursos = true;

        await store.fetchRecursos();

        expect(mockFetch).not.toHaveBeenCalled();
    });
});

describe('useAdminStore — fetchUsuarios', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('fetches and populates usuarios on success', async () => {
        const store = useAdminStore();
        const mockUsers = [{ id_usuario: 1, nome: 'Admin' }];
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockUsers,
        });

        await store.fetchUsuarios();

        expect(store.usuarios).toEqual(mockUsers);
        expect(store.loadingUsuarios).toBe(false);
    });

    it('does not fetch within cache time', async () => {
        const store = useAdminStore();
        store.usuarios = [{ id_usuario: 1 }] as any;
        store.lastFetchUsuarios = Date.now();

        await store.fetchUsuarios();

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not update state on failed response', async () => {
        const store = useAdminStore();
        mockFetch.mockResolvedValueOnce({ ok: false });

        await store.fetchUsuarios();

        expect(store.usuarios).toHaveLength(0);
    });
});

describe('useAdminStore — fetchSolicitacoes', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('fetches, calculates status_geral and populates solicitacoes', async () => {
        const store = useAdminStore();
        const mockData = [{
            id_agendamento_pai: 1,
            recurso: 'Lab',
            finalidade: 'Aula',
            observacoes: '',
            solicitante: 'User',
            data_criacao: '2025-01-01',
            status_geral: '',
            agendamentos_filhos: [
                { id_agendamento: 1, status_agendamento: 'pendente', data_inicio: '', hora_inicio: '', hora_fim: '', gerenciado_por_nome: null, data_ultima_atualizacao: '' },
            ],
        }];
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData,
        });

        await store.fetchSolicitacoes();

        expect(store.solicitacoes).toHaveLength(1);
        expect(store.solicitacoes[0].status_geral).toBe('pendente');
        expect(store.loadingSolicitacoes).toBe(false);
    });

    it('does not update on error response', async () => {
        const store = useAdminStore();
        mockFetch.mockResolvedValueOnce({ ok: false });

        await store.fetchSolicitacoes();

        expect(store.solicitacoes).toHaveLength(0);
    });
});

describe('useAdminStore — clearCache', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('resets all data and timestamps', () => {
        const store = useAdminStore();
        store.recursos = [{ id_recurso: 1 }] as any;
        store.usuarios = [{ id_usuario: 1 }] as any;
        store.solicitacoes = [{ id_agendamento_pai: 1 }] as any;
        store.lastFetchRecursos = Date.now();
        store.lastFetchUsuarios = Date.now();
        store.lastFetchSolicitacoes = Date.now();

        store.clearCache();

        expect(store.recursos).toHaveLength(0);
        expect(store.usuarios).toHaveLength(0);
        expect(store.solicitacoes).toHaveLength(0);
        expect(store.lastFetchRecursos).toBe(0);
        expect(store.lastFetchUsuarios).toBe(0);
        expect(store.lastFetchSolicitacoes).toBe(0);
    });
});
