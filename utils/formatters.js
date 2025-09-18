export const getStatusClass = (status) => {
  if (!status) return 'status-default';
  const s = status.toLowerCase();
  
  if (s.includes('negado') || s.includes('indisponivel')) return 'status-error';

  if (s.includes('aprovado') || s.includes('disponivel')) return 'status-success';
  
  if (s.includes('pendente') || s.includes('manutencao')) return 'status-warning';
  if (s.includes('concluido') || s.includes('finalizado') || s.includes('reservado')) return 'status-info';
  
  return 'status-default';
};

export const formatarData = (dataString) => {
  if (!dataString) return 'Data inválida';
  try {
    const data = new Date(dataString);
    // Adiciona T00:00:00 para evitar problemas de fuso horário que podem mudar a data
    const dataUTC = new Date(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
    return dataUTC.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { 
    return dataString; 
  }
};

export const formatarDataHora = (dataString) => {
    if (!dataString) return '';
    try {
        const data = new Date(dataString);
        return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return dataString;
    }
};

export const formatarStatus = (status) => {
  if (!status) return '';

  const s = status.toLowerCase();

  const nomesStatus = {
    'disponivel': 'Disponível',
    'em_manutencao': 'Em Manutenção',
    'indisponivel': 'Indisponível',
    'reservado': 'Reservado',
    'aprovado': 'Aprovado',
    'negado': 'Negado',
    'pendente': 'Pendente',
    'concluido': 'Concluído',
    'finalizado': 'Finalizado',
    'parcialmente_aprovado': 'Parcialmente Aprovado',
    'parcialmente_negado': 'Parcialmente Negado',
    'indefinido': 'Indefinido'
  };

  if (nomesStatus[s]) {
    return nomesStatus[s];
  }

  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};