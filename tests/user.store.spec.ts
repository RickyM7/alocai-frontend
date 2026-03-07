import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '../stores/user';
import type { User } from '~/types/user';

vi.stubGlobal('useRuntimeConfig', () => ({
    public: { apiUrl: 'http://localhost:8000' }
}));

const mockUser: User = {
    id_usuario: 1,
    email: 'test@example.com',
    nome: 'Test User',
    foto_perfil: 'https://example.com/photo.jpg',
    data_criacao_conta: '2025-01-01',
    id_perfil: 1,
    nome_perfil: 'Servidor',
    google_id: 'google-123',
};

describe('useUserStore — Getters', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
    });

    it('isAuthenticated returns false when no token or user', () => {
        const store = useUserStore();
        expect(store.isAuthenticated).toBe(false);
    });

    it('isAuthenticated returns false when only token set', () => {
        const store = useUserStore();
        store.accessToken = 'token123';
        expect(store.isAuthenticated).toBe(false);
    });

    it('isAuthenticated returns false when only user set', () => {
        const store = useUserStore();
        store.user = mockUser;
        expect(store.isAuthenticated).toBe(false);
    });

    it('isAuthenticated returns true when both token and user set', () => {
        const store = useUserStore();
        store.accessToken = 'token123';
        store.user = mockUser;
        expect(store.isAuthenticated).toBe(true);
    });

    it('isAdmin returns true for Administrador profile', () => {
        const store = useUserStore();
        store.user = { ...mockUser, nome_perfil: 'Administrador' };
        expect(store.isAdmin).toBe(true);
    });

    it('isAdmin returns false for non-admin profile', () => {
        const store = useUserStore();
        store.user = mockUser;
        expect(store.isAdmin).toBe(false);
    });

    it('isAdmin returns false when user is null', () => {
        const store = useUserStore();
        expect(store.isAdmin).toBe(false);
    });

    it('isServidor returns true for Servidor profile', () => {
        const store = useUserStore();
        store.user = { ...mockUser, nome_perfil: 'Servidor' };
        expect(store.isServidor).toBe(true);
    });

    it('isServidor returns false for other profiles', () => {
        const store = useUserStore();
        store.user = { ...mockUser, nome_perfil: 'Administrador' };
        expect(store.isServidor).toBe(false);
    });

    it('isTerceirizado returns true for Terceirizado profile', () => {
        const store = useUserStore();
        store.user = { ...mockUser, nome_perfil: 'Terceirizado' };
        expect(store.isTerceirizado).toBe(true);
    });

    it('isTerceirizado returns false for other profiles', () => {
        const store = useUserStore();
        store.user = mockUser;
        expect(store.isTerceirizado).toBe(false);
    });

    it('hasPerfil returns true when id_perfil exists', () => {
        const store = useUserStore();
        store.user = mockUser;
        expect(store.hasPerfil).toBe(true);
    });

    it('hasPerfil returns false when id_perfil is null', () => {
        const store = useUserStore();
        store.user = { ...mockUser, id_perfil: null };
        expect(store.hasPerfil).toBe(false);
    });

    it('hasPerfil returns false when user is null', () => {
        const store = useUserStore();
        expect(store.hasPerfil).toBe(false);
    });
});

describe('useUserStore — Actions', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
    });

    it('setUser updates user state', () => {
        const store = useUserStore();
        store.setUser(mockUser);
        expect(store.user).toEqual(mockUser);
    });

    it('setToken updates accessToken state', () => {
        const store = useUserStore();
        store.setToken('abc123');
        expect(store.accessToken).toBe('abc123');
    });

    it('handleLoginSuccess sets token and user from data', () => {
        const store = useUserStore();
        store.handleLoginSuccess({
            access: 'jwt-token-xyz',
            user_data: mockUser,
        });
        expect(store.accessToken).toBe('jwt-token-xyz');
        expect(store.user).toEqual(mockUser);
        expect(localStorage.getItem('access')).toBe('jwt-token-xyz');
        expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual(mockUser);
    });

    it('handleLoginSuccess handles missing access gracefully', () => {
        const store = useUserStore();
        store.handleLoginSuccess({
            access: '',
            user_data: mockUser,
        });
        expect(store.accessToken).toBeNull();
        expect(store.user).toEqual(mockUser);
    });

    it('clear resets user and token to null', () => {
        const store = useUserStore();
        store.user = mockUser;
        store.accessToken = 'token';
        store.clear();
        expect(store.user).toBeNull();
        expect(store.accessToken).toBeNull();
    });
});
