import { defineStore } from 'pinia';
import { authenticatedFetch } from '~/utils/api';
import type { Notificacao } from '~/types/notificacao';

export const useNotificacaoStore = defineStore('notificacao', {
  state: () => ({
    notificacoes: [] as Notificacao[],
    naoLidas: 0,
    _loading: false,
  }),

  actions: {
    async fetchNotificacoes() {
      if (this._loading) return;
      this._loading = true;
      const config = useRuntimeConfig();
      try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/notificacoes/`);
        if (response.ok) {
          const data: Notificacao[] = await response.json();
          this.notificacoes = data;
          this.naoLidas = data.filter(n => !n.lida).length;
        }
      } catch (error: unknown) {
        console.error('Falha ao buscar notificações:', error);
      } finally {
        this._loading = false;
      }
    },
    async marcarComoLidas() {
      const config = useRuntimeConfig();
      try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/notificacoes/marcar-como-lidas/`, {
          method: 'PUT',
        });
        if (response.ok) {
          this.naoLidas = 0;
          this.notificacoes.forEach(n => n.lida = true);
        }
      } catch (error: unknown) {
        console.error('Falha ao marcar notificações como lidas:', error);
      }
    },
    async marcarComoLida(id: number) {
      const config = useRuntimeConfig();
      try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/notificacoes/${id}/marcar-como-lida/`, {
          method: 'PUT',
        });
        if (response.ok) {
          const notif = this.notificacoes.find(n => n.id_notificacao === id);
          if (notif && !notif.lida) {
            notif.lida = true;
            this.naoLidas = Math.max(0, this.naoLidas - 1);
          }
        }
      } catch (error: unknown) {
        console.error('Falha ao marcar notificação como lida:', error);
      }
    },
    async excluirNotificacao(id: number) {
      const config = useRuntimeConfig();
      try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/notificacoes/${id}/`, {
          method: 'DELETE',
        });
        if (response.ok) {
          this.notificacoes = this.notificacoes.filter(n => n.id_notificacao !== id);
          this.naoLidas = this.notificacoes.filter(n => !n.lida).length;
        }
      } catch (error: unknown) {
        console.error('Falha ao excluir notificação:', error);
      }
    },
  },
});