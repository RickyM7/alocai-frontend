export interface User {
  id_usuario: number;
  email: string;
  nome: string;
  foto_perfil: string | null;
  data_criacao_conta: string;
  id_perfil: number;
  nome_perfil: string | null;
  google_id?: string | null;
  tem_senha?: boolean;
}