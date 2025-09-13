import { defineStore } from 'pinia';
import { authenticatedFetch } from '~/utils/api';

export const useAgendamentoStore = defineStore('agendamento', {
  state: () => ({
    agendamentos: [], // Formato: [{ data, hora_inicio, hora_fim }]
    finalidade: '',
    observacoes: '',
    recursoSelecionado: null,
    responsavel: null,
    salvando: false,
  }),

  actions: {
    setDatasEHorarios(agendamentos) {
      this.agendamentos = agendamentos;
    },
    setInfo(dados) {
      this.finalidade = dados.finalidade;
      this.observacoes = dados.observacoes;
    },
    setRecurso(recurso) {
      this.recursoSelecionado = recurso;
    },
    setResponsavel(usuario) {
      this.responsavel = usuario;
    },
    async salvarAgendamento() {
      if (this.salvando) return;
      this.salvando = true;
      const config = useRuntimeConfig();
      try {
        const datasParaEnviar = this.agendamentos.map(ag => ({
          data_inicio: ag.data,
          hora_inicio: ag.hora_inicio,
          data_fim: ag.data,
          hora_fim: ag.hora_fim,
        }));
        if (datasParaEnviar.length === 0) {
          throw new Error("Nenhuma data válida foi selecionada para o agendamento.");
        }
        const payload = {
          id_recurso: this.recursoSelecionado.id_recurso,
          finalidade: this.finalidade,
          observacoes: this.observacoes,
          id_responsavel: this.responsavel.id_usuario,
          datas_agendamento: datasParaEnviar,
        };
        const response = await authenticatedFetch(`${config.public.apiUrl}/api/agendamentos/`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido do servidor.' }));
          throw new Error(`Erro na API: ${JSON.stringify(errorData.detail || errorData)}`);
        }
        return await response.json();
      } finally {
        this.salvando = false;
      }
    },
    limparStore() {
      this.agendamentos = [];
      this.finalidade = '';
      this.observacoes = '';
      this.recursoSelecionado = null;
      this.responsavel = null;
      this.salvando = false;
    }
  },
  persist: true,
});