const _normalize = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const parseToLocalDate = (input) => {
  if (!input && input !== 0) return null;
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === 'number') return new Date(input);

  const s = String(input).trim();
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateTimeNoTZ = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(?:\.\d+)?)?$/;
  const hasTZ = /(?:[zZ]|[+\-]\d{2}:\d{2})$/;

  if (isoDateOnly.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  if (isoDateTimeNoTZ.test(s) && !hasTZ.test(s)) {
    const [datePart, timePart] = s.split(/T| /);
    const [y, m, d] = datePart.split('-').map(Number);
    const timeParts = (timePart || '').split(':');
    const hh = Number(timeParts[0] || 0);
    const mm = Number(timeParts[1] || 0);
    let ss = 0, ms = 0;
    if (timeParts[2]) {
      if (timeParts[2].includes('.')) {
        const [sec, frac] = timeParts[2].split('.');
        ss = Number(sec);
        ms = Number((frac + '000').slice(0, 3));
      } else {
        ss = Number(timeParts[2]);
      }
    }
    return new Date(y, m - 1, d, hh, mm, ss, ms);
  }

  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
};

export const getStatusClass = (status) => {
  if (!status) return 'status-default';
  const s = _normalize(status).replace(/_/g, ' ');

  if (s.includes('negado') || s.includes('indisponivel') || s.includes('cancel')) return 'status-error';
  if (s.includes('aprovado') || s.includes('disponivel')) return 'status-success';
  if (s.includes('pendente') || s.includes('manutencao')) return 'status-warning';
  if (s.includes('concluido') || s.includes('finalizado') || s.includes('reservado')) return 'status-info';

  return 'status-default';
};

export const formatarData = (dataString) => {
  if (!dataString) return 'Data inválida';
  const date = parseToLocalDate(dataString);
  if (!date) return 'Data inválida';

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

export const formatarDataCompleta = (dataString) => formatarData(dataString);

export const formatarDataHora = (dataString) => {
  if (!dataString) return '';
  const date = parseToLocalDate(dataString);
  if (!date) return dataString;

  return date.toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatarStatus = (status) => {
  if (!status) return '';

  const raw = String(status).trim();
  const normalized = _normalize(raw);
  const key = normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

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
    'cancelado': 'Cancelado',
    'parcialmente_aprovado': 'Parcialmente Aprovado',
    'parcialmente_negado': 'Parcialmente Negado',
    'indefinido': 'Indefinido'
  };

  if (nomesStatus[key]) return nomesStatus[key];

  const human = raw.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  return human.replace(/\b\w/g, (c) => c.toUpperCase());
};
