import { defineStore } from 'pinia';
import { authenticatedFetch } from '~/utils/api';
import type { Notificacao } from '~/types/notificacao';

export const useNotificacaoStore = defineStore('notificacao', {
  state: () => ({
    notificacoes: [] as Notificacao[],
    naoLidas: 0,
  }),

  actions: {
    async fetchNotificacoes() {
      const config = useRuntimeConfig();
      try {
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/notificacoes/`);
        if (response.ok) {
          const data: Notificacao[] = await response.json();
          this.notificacoes = data;
          this.naoLidas = data.filter(n => !n.lida).length;
        }
      } catch (error) {
        console.error('Falha ao buscar notificações:', error);
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
      } catch (error) {
        console.error('Falha ao marcar notificações como lidas:', error);
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
      } catch (error) {
        console.error('Falha ao excluir notificação:', error);
      }
    },
  },
});