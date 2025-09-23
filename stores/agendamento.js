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

const horaAgora = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const sobrepoe = (aIni, aFim, bIni, bFim) => aIni < bFim && aFim > bIni;

export const useAgendamentoStore = defineStore('agendamento', {
  state: () => ({
    recursoSelecionado: null,
    agendamentos: [],
    finalidade: '',
    observacoes: '',
    responsavel: null,
    
    tipoAgendamento: 'Data',
    horarioMode: 'mesmo',
    datasSelecionadas: [],
    horarioUnico: { inicio: '', fim: '', minFim: '' },
    horariosMultiplos: [],

    dataInicioRecorrente: '',
    dataFimRecorrente: '',
    diasSemanaSelecionados: [],
    horarioModeRecorrente: 'mesmo',
    horarioRecorrente: { inicio: '', fim: '', minFim: '' },
    recorrenteSlots: [{ inicio: '', fim: '', minFim: '', id: gerarId() }],

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

    hojeStr() {
      return formatDateToLocal(new Date());
    },

    incluiHojeNaRecorrencia(state) {
      if (!state.dataInicioRecorrente || !state.dataFimRecorrente || state.diasSemanaSelecionados.length === 0) return false;
      const hoje = new Date();
      const inicio = new Date(state.dataInicioRecorrente + 'T00:00:00');
      const fim = new Date(state.dataFimRecorrente + 'T00:00:00');
      if (hoje < inicio || hoje > fim) return false;
      return state.diasSemanaSelecionados.includes(hoje.getDay());
    }
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

    validarConflitosComReservas(dataStr, inicio, fim) {
      const slots = this.horariosOcupados[dataStr] || [];
      for (const slot of slots) {
        if (sobrepoe(inicio, fim, slot.start, slot.end)) {
          return { 
            conflito: true, 
            mensagem: `Conflito com reserva existente das ${slot.start} às ${slot.end}` 
          };
        }
      }
      return { conflito: false };
    },

    validarConflitosEntreSlots(slots, indiceAtual) {
      const slotAtual = slots[indiceAtual];
      if (!slotAtual || !slotAtual.inicio || !slotAtual.fim) return { conflito: false };

      for (let i = 0; i < slots.length; i++) {
        if (i === indiceAtual) continue;
        const outroSlot = slots[i];
        if (!outroSlot.inicio || !outroSlot.fim) continue;

        if (slotAtual.inicio === outroSlot.inicio && slotAtual.fim === outroSlot.fim) {
          return { 
            conflito: true, 
            mensagem: 'Você já adicionou este mesmo horário para este dia' 
          };
        }
        
        if (sobrepoe(slotAtual.inicio, slotAtual.fim, outroSlot.inicio, outroSlot.fim)) {
          return { 
            conflito: true, 
            mensagem: 'Os horários escolhidos para este dia não podem se sobrepor' 
          };
        }
      }
      return { conflito: false };
    },

    validarHorarioMinimo(dataStr, inicio) {
      if (dataStr === this.hojeStr && inicio < horaAgora()) {
        return {
          conflito: true,
          mensagem: 'Não é possível selecionar horário anterior ao atual para hoje'
        };
      }
      return { conflito: false };
    },

    validarHorarioBasico(inicio, fim) {
      if (!inicio || !fim) return { conflito: false };
      
      if (fim <= inicio) {
        return {
          conflito: true,
          mensagem: 'O horário de término deve ser maior que o de início'
        };
      }
      return { conflito: false };
    },

    validarHorarioUnico() {
      const validacaoBasica = this.validarHorarioBasico(this.horarioUnico.inicio, this.horarioUnico.fim);
      if (validacaoBasica.conflito) return validacaoBasica;

      const hasToday = this.datasSelecionadas.some(d => formatDateToLocal(d) === this.hojeStr);
      if (hasToday) {
        const validacaoMinima = this.validarHorarioMinimo(this.hojeStr, this.horarioUnico.inicio);
        if (validacaoMinima.conflito) return validacaoMinima;
      }

      for (const data of this.datasSelecionadas) {
        const dataStr = formatDateToLocal(data);
        const validacaoReserva = this.validarConflitosComReservas(
          dataStr, 
          this.horarioUnico.inicio, 
          this.horarioUnico.fim
        );
        if (validacaoReserva.conflito) {
          return {
            conflito: true,
            mensagem: `${validacaoReserva.mensagem} na data ${data.toLocaleDateString('pt-BR')}`
          };
        }
      }

      return { conflito: false };
    },

    validarSlotMultiplo(dateIndex, slotIndex) {
      const item = this.horariosMultiplos[dateIndex];
      if (!item) return { conflito: false };

      const slot = item.slots[slotIndex];
      const validacaoBasica = this.validarHorarioBasico(slot.inicio, slot.fim);
      if (validacaoBasica.conflito) return validacaoBasica;

      const validacaoMinima = this.validarHorarioMinimo(item.data, slot.inicio);
      if (validacaoMinima.conflito) return validacaoMinima;

      const validacaoSlots = this.validarConflitosEntreSlots(item.slots, slotIndex);
      if (validacaoSlots.conflito) return validacaoSlots;

      const validacaoReserva = this.validarConflitosComReservas(item.data, slot.inicio, slot.fim);
      if (validacaoReserva.conflito) return validacaoReserva;

      return { conflito: false };
    },

    validarHorarioRecorrente() {
      const validacaoBasica = this.validarHorarioBasico(this.horarioRecorrente.inicio, this.horarioRecorrente.fim);
      if (validacaoBasica.conflito) return validacaoBasica;

      if (this.incluiHojeNaRecorrencia) {
        const validacaoMinima = this.validarHorarioMinimo(this.hojeStr, this.horarioRecorrente.inicio);
        if (validacaoMinima.conflito) return validacaoMinima;
      }

      for (const data of this.datasRecorrentes) {
        const dataStr = formatDateToLocal(data);
        const validacaoReserva = this.validarConflitosComReservas(
          dataStr, 
          this.horarioRecorrente.inicio, 
          this.horarioRecorrente.fim
        );
        if (validacaoReserva.conflito) {
          return {
            conflito: true,
            mensagem: `${validacaoReserva.mensagem} na data ${data.toLocaleDateString('pt-BR')}`
          };
        }
      }

      return { conflito: false };
    },

    validarSlotRecorrente(slotIndex) {
      const slot = this.recorrenteSlots[slotIndex];
      const validacaoBasica = this.validarHorarioBasico(slot.inicio, slot.fim);
      if (validacaoBasica.conflito) return validacaoBasica;

      if (this.incluiHojeNaRecorrencia) {
        const validacaoMinima = this.validarHorarioMinimo(this.hojeStr, slot.inicio);
        if (validacaoMinima.conflito) return validacaoMinima;
      }

      const validacaoSlots = this.validarConflitosEntreSlots(this.recorrenteSlots, slotIndex);
      if (validacaoSlots.conflito) return validacaoSlots;

      for (const data of this.datasRecorrentes) {
        const dataStr = formatDateToLocal(data);
        const validacaoReserva = this.validarConflitosComReservas(dataStr, slot.inicio, slot.fim);
        if (validacaoReserva.conflito) {
          return {
            conflito: true,
            mensagem: `${validacaoReserva.mensagem} na data ${data.toLocaleDateString('pt-BR')}`
          };
        }
      }

      return { conflito: false };
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
      } else {
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