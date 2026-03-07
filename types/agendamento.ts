export interface AgendamentoFilho {
    id_agendamento: number;
    data_inicio: string;
    data_fim: string;
    hora_inicio: string;
    hora_fim: string;
    status_agendamento: string;
}

export interface AgendamentoPai {
    id_agendamento_pai: number;
    recurso: string;
    finalidade: string;
    observacoes: string;
    status_geral: string;
    agendamentos_filhos: AgendamentoFilho[];
}

export interface AgendamentoParaSalvar {
    data: string;
    hora_inicio: string;
    hora_fim: string;
}

export type ValidacaoResult =
    | { conflito: false }
    | { conflito: true; mensagem: string };

export interface Slot {
    inicio: string;
    fim: string;
    minFim: string;
    id: string;
}

export interface HorarioMultiplo {
    data: string;
    slots: Slot[];
}
