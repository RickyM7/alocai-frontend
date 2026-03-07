import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotificacaoStore } from '../stores/notificacao';

vi.stubGlobal('useRuntimeConfig', () => ({
    public: { apiUrl: 'http://localhost:8000' }
}));

// vi.mock é hoistado para o topo — o mockFetch deve ser declarado via vi.hoisted()
const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));

vi.mock('../utils/api', () => ({
    authenticatedFetch: mockFetch,
}));

describe('useNotificacaoStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('initializes with empty state', () => {
        const store = useNotificacaoStore();
        expect(store.notificacoes).toHaveLength(0);
        expect(store.naoLidas).toBe(0);
    });

    it('fetchNotificacoes — populates state and counts unread', async () => {
        const store = useNotificacaoStore();
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { id_notificacao: 1, lida: false, mensagem: 'Teste', destinatario: 1, agendamento_pai: null, data_criacao: '' },
                { id_notificacao: 2, lida: true, mensagem: 'Lida', destinatario: 1, agendamento_pai: null, data_criacao: '' },
            ]
        });

        await store.fetchNotificacoes();

        expect(store.notificacoes).toHaveLength(2);
        expect(store.naoLidas).toBe(1);
    });

    it('fetchNotificacoes — does not update state on error response', async () => {
        const store = useNotificacaoStore();
        mockFetch.mockResolvedValueOnce({ ok: false });

        await store.fetchNotificacoes();

        expect(store.notificacoes).toHaveLength(0);
        expect(store.naoLidas).toBe(0);
    });

    it('marcarComoLidas — sets naoLidas to 0 and marks all as lida', async () => {
        const store = useNotificacaoStore();
        store.notificacoes = [
            { id_notificacao: 1, lida: false, mensagem: 'A', destinatario: 1, agendamento_pai: null, data_criacao: '' },
        ];
        store.naoLidas = 1;

        mockFetch.mockResolvedValueOnce({ ok: true });

        await store.marcarComoLidas();

        expect(store.naoLidas).toBe(0);
        expect(store.notificacoes[0].lida).toBe(true);
    });

    it('excluirNotificacao — removes from list and recalculates naoLidas', async () => {
        const store = useNotificacaoStore();
        store.notificacoes = [
            { id_notificacao: 1, lida: false, mensagem: 'A', destinatario: 1, agendamento_pai: null, data_criacao: '' },
            { id_notificacao: 2, lida: false, mensagem: 'B', destinatario: 1, agendamento_pai: null, data_criacao: '' },
        ];
        store.naoLidas = 2;

        mockFetch.mockResolvedValueOnce({ ok: true });

        await store.excluirNotificacao(1);

        expect(store.notificacoes).toHaveLength(1);
        expect(store.notificacoes[0].id_notificacao).toBe(2);
        expect(store.naoLidas).toBe(1);
    });

    it('marcarComoLida — marks single notification and decrements naoLidas', async () => {
        const store = useNotificacaoStore();
        store.notificacoes = [
            { id_notificacao: 1, lida: false, mensagem: 'A', destinatario: 1, agendamento_pai: null, data_criacao: '' },
            { id_notificacao: 2, lida: false, mensagem: 'B', destinatario: 1, agendamento_pai: null, data_criacao: '' },
        ];
        store.naoLidas = 2;

        mockFetch.mockResolvedValueOnce({ ok: true });

        await store.marcarComoLida(1);

        expect(store.notificacoes[0].lida).toBe(true);
        expect(store.notificacoes[1].lida).toBe(false);
        expect(store.naoLidas).toBe(1);
    });

    it('marcarComoLida — does not decrement if already lida', async () => {
        const store = useNotificacaoStore();
        store.notificacoes = [
            { id_notificacao: 1, lida: true, mensagem: 'A', destinatario: 1, agendamento_pai: null, data_criacao: '' },
        ];
        store.naoLidas = 0;

        mockFetch.mockResolvedValueOnce({ ok: true });

        await store.marcarComoLida(1);

        expect(store.naoLidas).toBe(0);
    });

    it('marcarComoLida — does nothing on error response', async () => {
        const store = useNotificacaoStore();
        store.notificacoes = [
            { id_notificacao: 1, lida: false, mensagem: 'A', destinatario: 1, agendamento_pai: null, data_criacao: '' },
        ];
        store.naoLidas = 1;

        mockFetch.mockResolvedValueOnce({ ok: false });

        await store.marcarComoLida(1);

        expect(store.notificacoes[0].lida).toBe(false);
        expect(store.naoLidas).toBe(1);
    });

    it('excluirNotificacao — does nothing on error response', async () => {
        const store = useNotificacaoStore();
        store.notificacoes = [
            { id_notificacao: 1, lida: false, mensagem: 'A', destinatario: 1, agendamento_pai: null, data_criacao: '' },
        ];
        store.naoLidas = 1;

        mockFetch.mockResolvedValueOnce({ ok: false });

        await store.excluirNotificacao(1);

        expect(store.notificacoes).toHaveLength(1);
        expect(store.naoLidas).toBe(1);
    });

    it('fetchNotificacoes — handles network error gracefully', async () => {
        const store = useNotificacaoStore();
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await store.fetchNotificacoes();

        expect(store.notificacoes).toHaveLength(0);
        consoleSpy.mockRestore();
    });
});
