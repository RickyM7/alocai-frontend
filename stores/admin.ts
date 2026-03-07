import { defineStore } from 'pinia';
import { authenticatedFetch } from '~/utils/api';
import { calcularStatusGeral } from '~/utils/formatters';
import type { Recurso } from '~/types/recurso';
import type { User } from '~/types/user';

interface Solicitacao {
    id_agendamento_pai: number;
    recurso: string;
    finalidade: string;
    observacoes: string;
    solicitante: string;
    data_criacao: string;
    status_geral: string;
    agendamentos_filhos: Array<{
        id_agendamento: number;
        data_inicio: string;
        hora_inicio: string;
        hora_fim: string;
        status_agendamento: string;
        gerenciado_por_nome: string | null;
        data_ultima_atualizacao: string;
    }>;
    [key: string]: any;
}

interface AdminStoreState {
    recursos: Recurso[];
    usuarios: User[];
    solicitacoes: Solicitacao[];
    lastFetchRecursos: number;
    lastFetchUsuarios: number;
    lastFetchSolicitacoes: number;
    loadingRecursos: boolean;
    loadingUsuarios: boolean;
    loadingSolicitacoes: boolean;
}

const CACHE_TIME = 60000; // 1 minuto de cache

export const useAdminStore = defineStore('admin', {
    state: (): AdminStoreState => ({
        recursos: [],
        usuarios: [],
        solicitacoes: [],
        lastFetchRecursos: 0,
        lastFetchUsuarios: 0,
        lastFetchSolicitacoes: 0,
        loadingRecursos: false,
        loadingUsuarios: false,
        loadingSolicitacoes: false,
    }),

    actions: {
        async fetchRecursos(force = false) {
            if (this.loadingRecursos) return;
            const now = Date.now();
            if (!force && this.recursos.length > 0 && (now - this.lastFetchRecursos) < CACHE_TIME) return;

            this.loadingRecursos = true;
            try {
                const config = useRuntimeConfig();
                const r = await authenticatedFetch(`${config.public.apiUrl}/api/admin/recursos/`);
                if (r.ok) {
                    this.recursos = await r.json();
                    this.lastFetchRecursos = now;
                }
            } catch (e) {
                console.error('Falha ao buscar recursos no admin store:', e);
            } finally {
                this.loadingRecursos = false;
            }
        },

        async fetchUsuarios(force = false) {
            if (this.loadingUsuarios) return;
            const now = Date.now();
            if (!force && this.usuarios.length > 0 && (now - this.lastFetchUsuarios) < CACHE_TIME) return;

            this.loadingUsuarios = true;
            try {
                const config = useRuntimeConfig();
                const r = await authenticatedFetch(`${config.public.apiUrl}/api/admin/users/`);
                if (r.ok) {
                    this.usuarios = await r.json();
                    this.lastFetchUsuarios = now;
                }
            } catch (e) {
                console.error('Falha ao buscar usuários no admin store:', e);
            } finally {
                this.loadingUsuarios = false;
            }
        },

        async fetchSolicitacoes(force = false) {
            if (this.loadingSolicitacoes) return;
            const now = Date.now();
            if (!force && this.solicitacoes.length > 0 && (now - this.lastFetchSolicitacoes) < CACHE_TIME) return;

            this.loadingSolicitacoes = true;
            try {
                const config = useRuntimeConfig();
                const r = await authenticatedFetch(`${config.public.apiUrl}/api/admin/agendamentos/`);
                if (r.ok) {
                    const d = await r.json();
                    d.forEach((s: Solicitacao) => {
                        s.status_geral = calcularStatusGeral(s.agendamentos_filhos);
                    });
                    this.solicitacoes = d;
                    this.lastFetchSolicitacoes = now;
                }
            } catch (e) {
                console.error('Falha ao buscar solicitações no admin store:', e);
            } finally {
                this.loadingSolicitacoes = false;
            }
        },

        clearCache() {
            this.recursos = [];
            this.usuarios = [];
            this.solicitacoes = [];
            this.lastFetchRecursos = 0;
            this.lastFetchUsuarios = 0;
            this.lastFetchSolicitacoes = 0;
        }
    }
});
