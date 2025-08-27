import { defineStore } from 'pinia';
import { authenticatedFetch } from '~/utils/api';

export const useAgendamentoStore = defineStore('agendamento', {
  state: () => ({
    tipoAgendamento: '',
    datasSelecionadas: [],
    horariosSelecionados: {},
    diaDaSemana: '',
    horarioPeriodo: '',
    dataInicio: '',
    dataFim: '',
    finalidade: '',
    participantes: '',
    observacoes: '',
    recursoSelecionado: null,
    responsavel: null,
    salvando: false,
  }),

  actions: {
    setAgendamento(dados) {
      this.tipoAgendamento = dados.tipo;
      this.datasSelecionadas = dados.datas;
      this.horariosSelecionados = dados.horarios;
      this.diaDaSemana = dados.diaSemana;
      this.horarioPeriodo = dados.horarioPeriodo;
      this.dataInicio = dados.inicio;
      this.dataFim = dados.fim;
    },

    setInfo(dados) {
      this.finalidade = dados.finalidade;
      this.participantes = dados.participantes;
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
      if (!this.temDadosCompletos) {
        throw new Error('Dados incompletos para criar o agendamento');
      }
      this.salvando = true;
      const config = useRuntimeConfig();

      try {
        const datasParaEnviar = [];

        if (this.tipoAgendamento === 'Datas Específicas') {
          for (const data of this.datasSelecionadas) {
            const dataISO = data.toISOString().split('T')[0];
            const horario = this.horariosSelecionados[dataISO];
            if (!horario) continue;

            const [horas, minutos] = horario.split(':');
            const horaFim = (parseInt(horas) + 2).toString().padStart(2, '0');

            datasParaEnviar.push({
              data_inicio: dataISO,
              hora_inicio: horario,
              data_fim: dataISO,
              hora_fim: `${horaFim}:${minutos}`,
            });
          }
        } else if (this.tipoAgendamento === 'Período Recorrente') {
          const inicio = new Date(`${this.dataInicio}T00:00:00`);
          const fim = new Date(`${this.dataFim}T00:00:00`);
          const diasMap = {'Domingo':0,'Segunda-feira':1,'Terça-feira':2,'Quarta-feira':3,'Quinta-feira':4,'Sexta-feira':5,'Sábado':6};
          const diaSemanaNum = diasMap[this.diaDaSemana];
          let dataAtual = new Date(inicio);

          while (dataAtual.getDay() !== diaSemanaNum) {
            dataAtual.setDate(dataAtual.getDate() + 1);
            if (dataAtual > fim) break;
          }

          while (dataAtual <= fim) {
            const dataISO = dataAtual.toISOString().split('T')[0];
            const [horas, minutos] = this.horarioPeriodo.split(':');
            const horaFim = (parseInt(horas) + 2).toString().padStart(2, '0');

            datasParaEnviar.push({
              data_inicio: dataISO,
              hora_inicio: this.horarioPeriodo,
              data_fim: dataISO,
              hora_fim: `${horaFim}:${minutos}`,
            });
            dataAtual.setDate(dataAtual.getDate() + 7);
          }
        }

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
          const errorData = await response.json();
          throw new Error(`Erro na API: ${JSON.stringify(errorData)}`);
        }

        return [await response.json()];

      } finally {
        this.salvando = false;
      }
    },
    
    limparStore() {
        this.tipoAgendamento = '';
        this.datasSelecionadas = [];
        this.horariosSelecionados = {};
        this.diaDaSemana = '';
        this.horarioPeriodo = '';
        this.dataInicio = '';
        this.dataFim = '';
        this.finalidade = '';
        this.participantes = '';
        this.observacoes = '';
        this.recursoSelecionado = null;
        this.responsavel = null;
        this.salvando = false;
    }
  },

  getters: {
    temDadosCompletos: (state) => {
      const temInfoBasica = state.tipoAgendamento && state.finalidade && state.recursoSelecionado;
      if (!temInfoBasica) return false;
      
      const temDataEspecifica = state.tipoAgendamento === 'Datas Específicas' && state.datasSelecionadas.length > 0;
      const temPeriodoRecorrente = state.tipoAgendamento === 'Período Recorrente' && state.diaDaSemana && state.dataInicio && state.dataFim;
      
      return temDataEspecifica || temPeriodoRecorrente;
    }
  }
});