export interface Recurso {
    id_recurso: number;
    nome_recurso: string;
    descricao: string | null;
    capacidade: number | null;
    localizacao: string;
    status_recurso: string;
    politicas_uso_especificas: string | null;
    data_cadastro: string;
    data_atualizacao: string;
}
