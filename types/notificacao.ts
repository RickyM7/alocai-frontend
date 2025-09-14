export interface Notificacao {
  id_notificacao: number;
  destinatario: number;
  agendamento_pai: number | null;
  mensagem: string;
  lida: boolean;
  data_criacao: string;
}