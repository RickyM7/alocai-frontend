import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAgendamentoStore } from '../stores/agendamento';

// Mock do useRuntimeConfig do Nuxt, indisponível no ambiente de teste
vi.stubGlobal('useRuntimeConfig', () => ({
    public: { apiUrl: 'http://localhost:8000' }
}));

describe('useAgendamentoStore — validarHorarioBasico', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('returns no conflict when inicio < fim', () => {
        const store = useAgendamentoStore();
        expect(store.validarHorarioBasico('08:00', '10:00')).toEqual({ conflito: false });
    });

    it('returns conflict when inicio === fim', () => {
        const store = useAgendamentoStore();
        const result = store.validarHorarioBasico('10:00', '10:00');
        expect(result.conflito).toBe(true);
    });

    it('returns conflict when fim < inicio', () => {
        const store = useAgendamentoStore();
        const result = store.validarHorarioBasico('12:00', '08:00');
        expect(result.conflito).toBe(true);
    });

    it('returns no conflict when inputs are empty', () => {
        const store = useAgendamentoStore();
        expect(store.validarHorarioBasico('', '')).toEqual({ conflito: false });
        expect(store.validarHorarioBasico('', '10:00')).toEqual({ conflito: false });
    });
});

describe('useAgendamentoStore — validarConflitosEntreSlots', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    const makeSlot = (inicio: string, fim: string, id = '1') => ({
        inicio, fim, minFim: '', id
    });

    it('detects exact duplicate slot', () => {
        const store = useAgendamentoStore();
        const slots = [makeSlot('08:00', '10:00', '1'), makeSlot('08:00', '10:00', '2')];
        const result = store.validarConflitosEntreSlots(slots, 1);
        expect(result.conflito).toBe(true);
        if (result.conflito) expect(result.mensagem).toContain('mesmo horário');
    });

    it('detects overlapping slots', () => {
        const store = useAgendamentoStore();
        const slots = [makeSlot('08:00', '10:00', '1'), makeSlot('09:00', '11:00', '2')];
        const result = store.validarConflitosEntreSlots(slots, 1);
        expect(result.conflito).toBe(true);
        if (result.conflito) expect(result.mensagem).toContain('sobrepor');
    });

    it('allows non-overlapping slots', () => {
        const store = useAgendamentoStore();
        const slots = [makeSlot('08:00', '10:00', '1'), makeSlot('10:00', '12:00', '2')];
        const result = store.validarConflitosEntreSlots(slots, 1);
        expect(result.conflito).toBe(false);
    });
});

describe('useAgendamentoStore — validarConflitosComReservas', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('returns conflict when slot overlaps existing reservation', () => {
        const store = useAgendamentoStore();
        store.horariosOcupados = {
            '2025-06-15': [{ start: '08:00', end: '10:00' }]
        };
        const result = store.validarConflitosComReservas('2025-06-15', '09:00', '11:00');
        expect(result.conflito).toBe(true);
    });

    it('returns no conflict when slot does not overlap', () => {
        const store = useAgendamentoStore();
        store.horariosOcupados = {
            '2025-06-15': [{ start: '08:00', end: '10:00' }]
        };
        const result = store.validarConflitosComReservas('2025-06-15', '10:00', '12:00');
        expect(result.conflito).toBe(false);
    });

    it('returns no conflict when no reservations exist for date', () => {
        const store = useAgendamentoStore();
        store.horariosOcupados = {};
        const result = store.validarConflitosComReservas('2025-06-15', '08:00', '10:00');
        expect(result.conflito).toBe(false);
    });
});

describe('useAgendamentoStore — compilarAgendamentosParaSalvar (tipo Data, horarioMode mesmo)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('compiles single-day same-time agendamento correctly', () => {
        const store = useAgendamentoStore();
        store.tipoAgendamento = 'Data';
        store.horarioMode = 'mesmo';
        store.datasSelecionadas = [new Date(2025, 5, 15)]; // June 15 2025 local
        store.horarioUnico = { inicio: '08:00', fim: '10:00', minFim: '' };

        store.compilarAgendamentosParaSalvar();

        expect(store.agendamentos).toHaveLength(1);
        expect(store.agendamentos[0].data).toBe('2025-06-15');
        expect(store.agendamentos[0].hora_inicio).toBe('08:00');
        expect(store.agendamentos[0].hora_fim).toBe('10:00');
    });

    it('compiles multiple dates with same time', () => {
        const store = useAgendamentoStore();
        store.tipoAgendamento = 'Data';
        store.horarioMode = 'mesmo';
        store.datasSelecionadas = [new Date(2025, 5, 15), new Date(2025, 5, 16)];
        store.horarioUnico = { inicio: '14:00', fim: '16:00', minFim: '' };

        store.compilarAgendamentosParaSalvar();

        expect(store.agendamentos).toHaveLength(2);
        expect(store.agendamentos[0].data).toBe('2025-06-15');
        expect(store.agendamentos[1].data).toBe('2025-06-16');
    });
});

describe('useAgendamentoStore — datasRecorrentes getter', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('returns empty array when no dates set', () => {
        const store = useAgendamentoStore();
        expect(store.datasRecorrentes).toHaveLength(0);
    });

    it('returns correct mondays between two dates', () => {
        const store = useAgendamentoStore();
        store.dataInicioRecorrente = '2025-06-02'; // Monday
        store.dataFimRecorrente = '2025-06-16';
        store.diasSemanaSelecionados = [1]; // Monday = 1

        const datas = store.datasRecorrentes;
        expect(datas).toHaveLength(3); // June 2, 9, 16
    });

    it('returns empty array if fim < inicio', () => {
        const store = useAgendamentoStore();
        store.dataInicioRecorrente = '2025-06-16';
        store.dataFimRecorrente = '2025-06-01';
        store.diasSemanaSelecionados = [1];
        expect(store.datasRecorrentes).toHaveLength(0);
    });
});

describe('useAgendamentoStore — hojeStr getter', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('returns today date in YYYY-MM-DD format', () => {
        const store = useAgendamentoStore();
        const hoje = new Date();
        const expected = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
        expect(store.hojeStr).toBe(expected);
    });
});

describe('useAgendamentoStore — incluiHojeNaRecorrencia getter', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('returns false when no dates set', () => {
        const store = useAgendamentoStore();
        expect(store.incluiHojeNaRecorrencia).toBe(false);
    });

    it('returns false when today is outside the range', () => {
        const store = useAgendamentoStore();
        store.dataInicioRecorrente = '2020-01-01';
        store.dataFimRecorrente = '2020-01-31';
        store.diasSemanaSelecionados = [0, 1, 2, 3, 4, 5, 6];
        expect(store.incluiHojeNaRecorrencia).toBe(false);
    });

    it('returns false when today weekday is not selected', () => {
        const store = useAgendamentoStore();
        const hoje = new Date();
        store.dataInicioRecorrente = '2025-01-01';
        store.dataFimRecorrente = '2030-12-31';
        // Seleciona apenas o dia que NÃO é hoje
        store.diasSemanaSelecionados = [(hoje.getDay() + 1) % 7];
        expect(store.incluiHojeNaRecorrencia).toBe(false);
    });
});

describe('useAgendamentoStore — actions: setRecurso, setInfo, setResponsavel', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('setRecurso sets recursoSelecionado', () => {
        const store = useAgendamentoStore();
        const recurso = { id_recurso: 1, nome_recurso: 'Lab' };
        store.setRecurso(recurso);
        expect(store.recursoSelecionado).toEqual(recurso);
    });

    it('setInfo sets finalidade, participantes and observacoes', () => {
        const store = useAgendamentoStore();
        store.setInfo({ finalidade: 'Aula', participantes: 30, observacoes: 'Teste' });
        expect(store.finalidade).toBe('Aula');
        expect(store.participantes).toBe(30);
        expect(store.observacoes).toBe('Teste');
    });

    it('setResponsavel sets responsavel', () => {
        const store = useAgendamentoStore();
        const user = { id_usuario: 1, nome: 'User' };
        store.setResponsavel(user);
        expect(store.responsavel).toEqual(user);
    });
});

describe('useAgendamentoStore — slot management actions', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('adicionarSlot adds a slot to horariosMultiplos at given index', () => {
        const store = useAgendamentoStore();
        store.horariosMultiplos = [{ data: '2025-06-15', slots: [{ inicio: '08:00', fim: '10:00', minFim: '', id: '1' }] }];
        store.adicionarSlot(0);
        expect(store.horariosMultiplos[0].slots).toHaveLength(2);
    });

    it('removerSlot removes a slot from horariosMultiplos', () => {
        const store = useAgendamentoStore();
        store.horariosMultiplos = [{
            data: '2025-06-15',
            slots: [
                { inicio: '08:00', fim: '10:00', minFim: '', id: '1' },
                { inicio: '10:00', fim: '12:00', minFim: '', id: '2' },
            ]
        }];
        store.removerSlot(0, 0);
        expect(store.horariosMultiplos[0].slots).toHaveLength(1);
        expect(store.horariosMultiplos[0].slots[0].id).toBe('2');
    });

    it('adicionarRecorrenteSlot adds a slot to recorrenteSlots', () => {
        const store = useAgendamentoStore();
        const initialLen = store.recorrenteSlots.length;
        store.adicionarRecorrenteSlot();
        expect(store.recorrenteSlots).toHaveLength(initialLen + 1);
    });

    it('removerRecorrenteSlot removes slot and ensures at least 1 remains', () => {
        const store = useAgendamentoStore();
        expect(store.recorrenteSlots).toHaveLength(1);
        store.removerRecorrenteSlot(0);
        // Deve continuar com 1 slot (cria automaticamente quando vazio)
        expect(store.recorrenteSlots).toHaveLength(1);
    });

    it('removerRecorrenteSlot with multiple slots removes correctly', () => {
        const store = useAgendamentoStore();
        store.adicionarRecorrenteSlot();
        expect(store.recorrenteSlots).toHaveLength(2);
        store.removerRecorrenteSlot(0);
        expect(store.recorrenteSlots).toHaveLength(1);
    });
});

describe('useAgendamentoStore — syncHorariosMultiplos', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('creates entries for selected dates and preserves existing', () => {
        const store = useAgendamentoStore();
        const date1 = new Date(2025, 5, 15);
        const date2 = new Date(2025, 5, 16);
        store.datasSelecionadas = [date1];
        store.horariosMultiplos = [{
            data: '2025-06-15',
            slots: [{ inicio: '08:00', fim: '10:00', minFim: '', id: 'existing' }]
        }];

        store.datasSelecionadas = [date1, date2];
        store.syncHorariosMultiplos();

        expect(store.horariosMultiplos).toHaveLength(2);
        expect(store.horariosMultiplos[0].slots[0].id).toBe('existing');
        expect(store.horariosMultiplos[1].data).toBe('2025-06-16');
    });
});

describe('useAgendamentoStore — compilarAgendamentosParaSalvar (modo diferente)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('compiles multiple-date different-time agendamento correctly', () => {
        const store = useAgendamentoStore();
        store.tipoAgendamento = 'Data';
        store.horarioMode = 'diferente';
        store.horariosMultiplos = [
            { data: '2025-06-15', slots: [{ inicio: '08:00', fim: '10:00', minFim: '', id: '1' }, { inicio: '14:00', fim: '16:00', minFim: '', id: '2' }] },
            { data: '2025-06-16', slots: [{ inicio: '09:00', fim: '11:00', minFim: '', id: '3' }] },
        ];

        store.compilarAgendamentosParaSalvar();

        expect(store.agendamentos).toHaveLength(3);
        expect(store.agendamentos[0]).toEqual({ data: '2025-06-15', hora_inicio: '08:00', hora_fim: '10:00' });
        expect(store.agendamentos[1]).toEqual({ data: '2025-06-15', hora_inicio: '14:00', hora_fim: '16:00' });
        expect(store.agendamentos[2]).toEqual({ data: '2025-06-16', hora_inicio: '09:00', hora_fim: '11:00' });
    });

    it('skips slots with empty inicio/fim', () => {
        const store = useAgendamentoStore();
        store.tipoAgendamento = 'Data';
        store.horarioMode = 'diferente';
        store.horariosMultiplos = [
            { data: '2025-06-15', slots: [{ inicio: '', fim: '', minFim: '', id: '1' }, { inicio: '14:00', fim: '16:00', minFim: '', id: '2' }] },
        ];

        store.compilarAgendamentosParaSalvar();

        expect(store.agendamentos).toHaveLength(1);
        expect(store.agendamentos[0].hora_inicio).toBe('14:00');
    });
});

describe('useAgendamentoStore — compilarAgendamentosParaSalvar (Recorrente)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('compiles recorrente with same time correctly', () => {
        const store = useAgendamentoStore();
        store.tipoAgendamento = 'Recorrente';
        store.horarioModeRecorrente = 'mesmo';
        store.dataInicioRecorrente = '2025-06-02';
        store.dataFimRecorrente = '2025-06-16';
        store.diasSemanaSelecionados = [1]; // Mondays
        store.horarioRecorrente = { inicio: '09:00', fim: '11:00', minFim: '' };

        store.compilarAgendamentosParaSalvar();

        expect(store.agendamentos).toHaveLength(3);
        expect(store.agendamentos[0].data).toBe('2025-06-02');
        expect(store.agendamentos[1].data).toBe('2025-06-09');
        expect(store.agendamentos[2].data).toBe('2025-06-16');
        expect(store.agendamentos[0].hora_inicio).toBe('09:00');
    });

    it('compiles recorrente with different slots correctly', () => {
        const store = useAgendamentoStore();
        store.tipoAgendamento = 'Recorrente';
        store.horarioModeRecorrente = 'diferente';
        store.dataInicioRecorrente = '2025-06-02';
        store.dataFimRecorrente = '2025-06-02';
        store.diasSemanaSelecionados = [1]; // Monday
        store.recorrenteSlots = [
            { inicio: '08:00', fim: '10:00', minFim: '', id: '1' },
            { inicio: '14:00', fim: '16:00', minFim: '', id: '2' },
        ];

        store.compilarAgendamentosParaSalvar();

        expect(store.agendamentos).toHaveLength(2);
        expect(store.agendamentos[0]).toEqual({ data: '2025-06-02', hora_inicio: '08:00', hora_fim: '10:00' });
        expect(store.agendamentos[1]).toEqual({ data: '2025-06-02', hora_inicio: '14:00', hora_fim: '16:00' });
    });
});

describe('useAgendamentoStore — limparStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('resets all state to defaults', () => {
        const store = useAgendamentoStore();
        store.finalidade = 'Test';
        store.participantes = 50;
        store.observacoes = 'Obs';
        store.recursoSelecionado = { id: 1 };
        store.datasSelecionadas = [new Date()];

        store.limparStore();

        expect(store.finalidade).toBe('');
        expect(store.participantes).toBeNull();
        expect(store.observacoes).toBe('');
        expect(store.recursoSelecionado).toBeNull();
        expect(store.datasSelecionadas).toHaveLength(0);
    });
});

describe('useAgendamentoStore — validarHorarioMinimo', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('returns no conflict for non-today date', () => {
        const store = useAgendamentoStore();
        const result = store.validarHorarioMinimo('2020-01-01', '00:00');
        expect(result.conflito).toBe(false);
    });

    it('returns conflict for today with past time', () => {
        const store = useAgendamentoStore();
        const result = store.validarHorarioMinimo(store.hojeStr, '00:01');
        // Só conflita se 00:01 for antes do horário atual — testa essa lógica
        const agora = new Date();
        const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
        if ('00:01' < horaAtual) {
            expect(result.conflito).toBe(true);
        } else {
            expect(result.conflito).toBe(false);
        }
    });
});
