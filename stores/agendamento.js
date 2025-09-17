import { defineStore } from 'pinia';
import { authenticatedFetch } from '~/utils/api';

const formatDateToLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const gerarId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const criarSlot = () => ({ inicio: '', fim: '', minFim: '', id: gerarId() });

export const useAgendamentoStore = defineStore('agendamento', {
  state: () => ({
    // Estado do agendamento
    recursoSelecionado: null,
    agendamentos: [], // Formato final: [{ data, hora_inicio, hora_fim }]
    finalidade: '',
    observacoes: '',
    responsavel: null,
    
    // Estado da UI de agendamentoData
    tipoAgendamento: 'Data', // 'Data' ou 'Período Recorrente'
    horarioMode: 'mesmo', // 'mesmo' ou 'diferente'
    datasSelecionadas: [], // Array de objetos Date
    horarioUnico: { inicio: '', fim: '', minFim: '' },
    horariosMultiplos: [], // Formato: [{ data: 'YYYY-MM-DD', slots: [...] }]

    // Estado para agendamento recorrente
    dataInicioRecorrente: '',
    dataFimRecorrente: '',
    diasSemanaSelecionados: [],
    horarioModeRecorrente: 'mesmo',
    horarioRecorrente: { inicio: '', fim: '', minFim: '' },
    recorrenteSlots: [{ inicio: '', fim: '', minFim: '', id: gerarId() }],

    // Estado de controle
    salvando: false,
    horariosOcupados: {},
  }),

  getters: {
    datasRecorrentes(state) {
      if (!state.dataInicioRecorrente || !state.dataFimRecorrente || state.diasSemanaSelecionados.length === 0) return [];
      const inicio = new Date(state.dataInicioRecorrente + 'T00:00:00');
      const fim = new Date(state.dataFimRecorrente + 'T00:00:00');
      if (fim < inicio) return [];
      
      const datas = [];
      const d = new Date(inicio.getTime());
      while (d <= fim) {
        if (state.diasSemanaSelecionados.includes(d.getDay())) {
          datas.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
        }
        d.setDate(d.getDate() + 1);
      }
      return datas;
    },
  },

  actions: {
    setRecurso(recurso) {
      this.recursoSelecionado = recurso;
    },
    setInfo(dados) {
      this.finalidade = dados.finalidade;
      this.observacoes = dados.observacoes;
    },
    setResponsavel(usuario) {
      this.responsavel = usuario;
    },
    
    // Ações para o formulário de data
    adicionarSlot(dateIndex) {
      this.horariosMultiplos[dateIndex].slots.push(criarSlot());
    },
    removerSlot(dateIndex, slotIndex) {
      this.horariosMultiplos[dateIndex].slots.splice(slotIndex, 1);
    },
    adicionarRecorrenteSlot() {
      this.recorrenteSlots.push(criarSlot());
    },
    removerRecorrenteSlot(idx) {
      this.recorrenteSlots.splice(idx, 1);
      if (!this.recorrenteSlots.length) this.recorrenteSlots.push(criarSlot());
    },
    
    // Sincroniza o array de horários múltiplos com as datas selecionadas
    syncHorariosMultiplos() {
      const novasDatas = this.datasSelecionadas.sort((a, b) => a - b);
      const antigasMap = new Map(this.horariosMultiplos.map(item => [item.data, item]));
      const novas = novasDatas.map(data => {
        const dStr = formatDateToLocal(data);
        return antigasMap.get(dStr) || { data: dStr, slots: [criarSlot()] };
      });
      this.horariosMultiplos = novas;
    },

    async fetchDisponibilidade(ano, mes) {
        const recursoId = this.recursoSelecionado?.id_recurso;
        if (!recursoId) return;
        const config = useRuntimeConfig();
        try {
            const response = await authenticatedFetch(`${config.public.apiUrl}/api/recursos/${recursoId}/disponibilidade/?ano=${ano}&mes=${mes}`);
            if(response.ok) {
                const data = await response.json();
                this.horariosOcupados = { ...this.horariosOcupados, ...data };
            }
        } catch (e) {
            console.error("Erro ao buscar disponibilidade:", e);
        }
    },

    compilarAgendamentosParaSalvar() {
      const agendamentosParaSalvar = [];
      if (this.tipoAgendamento === 'Data') {
          if (this.horarioMode === 'mesmo') {
              this.datasSelecionadas.forEach(data => {
                  agendamentosParaSalvar.push({
                      data: formatDateToLocal(data),
                      hora_inicio: this.horarioUnico.inicio,
                      hora_fim: this.horarioUnico.fim
                  });
              });
          } else {
              this.horariosMultiplos.forEach(item => {
                  item.slots.forEach(slot => {
                      if (slot.inicio && slot.fim) {
                          agendamentosParaSalvar.push({
                              data: item.data,
                              hora_inicio: slot.inicio,
                              hora_fim: slot.fim
                          });
                      }
                  });
              });
          }
      } else { // Período Recorrente
          const datas = this.datasRecorrentes;
          if (this.horarioModeRecorrente === 'mesmo') {
              datas.forEach(d => {
                  agendamentosParaSalvar.push({
                      data: formatDateToLocal(d),
                      hora_inicio: this.horarioRecorrente.inicio,
                      hora_fim: this.horarioRecorrente.fim
                  });
              });
          } else {
              datas.forEach(d => {
                  this.recorrenteSlots.forEach(s => {
                      if (s.inicio && s.fim) {
                          agendamentosParaSalvar.push({
                              data: formatDateToLocal(d),
                              hora_inicio: s.inicio,
                              hora_fim: s.fim
                          });
                      }
                  });
              });
          }
      }
      this.agendamentos = agendamentosParaSalvar;
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
      this.tipoAgendamento = 'Data';
      this.horarioMode = 'mesmo';
      this.datasSelecionadas = [];
      this.horarioUnico = { inicio: '', fim: '', minFim: '' };
      this.horariosMultiplos = [];
      this.dataInicioRecorrente = '';
      this.dataFimRecorrente = '';
      this.diasSemanaSelecionados = [];
      this.horarioModeRecorrente = 'mesmo';
      this.horarioRecorrente = { inicio: '', fim: '', minFim: '' };
      this.recorrenteSlots = [{ inicio: '', fim: '', minFim: '', id: gerarId() }];
      this.horariosOcupados = {};
    }
  },
  persist: true,
});