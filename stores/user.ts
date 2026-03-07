import { defineStore } from 'pinia';
import type { User } from '~/types/user';

export const useUserStore = defineStore('user', {
    state: () => ({
        user: null as User | null,
        accessToken: null as string | null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.accessToken && !!state.user,
        isAdmin: (state) => state.user?.nome_perfil === 'Administrador',
        isServidor: (state) => state.user?.nome_perfil === 'Servidor',
        isTerceirizado: (state) => state.user?.nome_perfil === 'Terceirizado',
        hasPerfil: (state) => !!state.user?.id_perfil,
    },

    actions: {
        setUser(user: User) {
            this.user = user;
        },
        setToken(token: string) {
            this.accessToken = token;
        },
        handleLoginSuccess(data: { access: string; user_data: User }) {
            if (data.access) {
                localStorage.setItem('access', data.access);
                this.accessToken = data.access;
            }
            if (data.user_data) {
                localStorage.setItem('user_data', JSON.stringify(data.user_data));
                this.user = data.user_data;
            }
        },
        clear() {
            this.user = null;
            this.accessToken = null;
        },
    },

    persist: {
        storage: import.meta.client ? localStorage : undefined,
    },
});
