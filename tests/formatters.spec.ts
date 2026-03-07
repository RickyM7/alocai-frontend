import { describe, it, expect } from 'vitest';
import {
    getStatusClass,
    formatarData,
    formatarDataCurta,
    formatarDataHora,
    formatarStatus,
    calcularStatusGeral,
} from '../utils/formatters';

describe('getStatusClass', () => {
    it('returns status-error for negado', () => {
        expect(getStatusClass('negado')).toBe('status-error');
    });
    it('returns status-error for indisponivel', () => {
        expect(getStatusClass('indisponivel')).toBe('status-error');
    });
    it('returns status-error for cancelado', () => {
        expect(getStatusClass('cancelado')).toBe('status-error');
    });
    it('returns status-success for aprovado', () => {
        expect(getStatusClass('aprovado')).toBe('status-success');
    });
    it('returns status-success for disponivel', () => {
        expect(getStatusClass('disponivel')).toBe('status-success');
    });
    it('returns status-warning for pendente', () => {
        expect(getStatusClass('pendente')).toBe('status-warning');
    });
    it('returns status-warning for em_manutencao', () => {
        expect(getStatusClass('em_manutencao')).toBe('status-warning');
    });
    it('returns status-info for concluido', () => {
        expect(getStatusClass('concluido')).toBe('status-info');
    });
    it('returns status-info for reservado', () => {
        expect(getStatusClass('reservado')).toBe('status-info');
    });
    it('returns status-default for null/undefined', () => {
        expect(getStatusClass(null)).toBe('status-default');
        expect(getStatusClass(undefined)).toBe('status-default');
        expect(getStatusClass('')).toBe('status-default');
    });
});

describe('formatarStatus', () => {
    it('returns formatted label for known statuses', () => {
        expect(formatarStatus('disponivel')).toBe('Disponível');
        expect(formatarStatus('em_manutencao')).toBe('Em Manutenção');
        expect(formatarStatus('parcialmente_aprovado')).toBe('Parcialmente Aprovado');
        expect(formatarStatus('concluido')).toBe('Concluído');
    });
    it('returns titlecased string for unknown status', () => {
        expect(formatarStatus('status_novo')).toBe('Status Novo');
    });
    it('returns empty string for null/undefined', () => {
        expect(formatarStatus(null)).toBe('');
        expect(formatarStatus(undefined)).toBe('');
    });
});

describe('formatarData', () => {
    it('formats ISO date-only string to pt-BR locale', () => {
        const result = formatarData('2025-06-15');
        // Deve conter as partes de dia e mês
        expect(result).toContain('15');
        expect(result).toContain('06');
        expect(result).toContain('25');
    });
    it('returns "Data inválida" for null', () => {
        expect(formatarData(null)).toBe('Data inválida');
        expect(formatarData('')).toBe('Data inválida');
    });
    it('does not shift date due to timezone when given ISO date-only', () => {
        // "2025-01-01" deve exibir como 01/01/25, não o dia anterior
        const result = formatarData('2025-01-01');
        expect(result).toContain('01');
        expect(result).not.toContain('31'); // December 31 only if timezone shifted
    });
});

describe('formatarDataHora', () => {
    it('returns empty string for null', () => {
        expect(formatarDataHora(null)).toBe('');
        expect(formatarDataHora('')).toBe('');
    });
    it('formats a datetime string', () => {
        const result = formatarDataHora('2025-06-15T14:30:00');
        expect(result).toContain('14');
        expect(result).toContain('30');
    });
});

describe('formatarDataCurta', () => {
    it('returns "Data inválida" for null/undefined/empty', () => {
        expect(formatarDataCurta(null)).toBe('Data inválida');
        expect(formatarDataCurta(undefined)).toBe('Data inválida');
        expect(formatarDataCurta('')).toBe('Data inválida');
    });
    it('formats ISO date string to short pt-BR format', () => {
        const result = formatarDataCurta('2025-06-15');
        expect(result).toContain('15');
        expect(result).toContain('2025');
    });
    it('formats a Date object', () => {
        const result = formatarDataCurta(new Date(2025, 5, 15));
        expect(result).toContain('15');
        expect(result).toContain('2025');
    });
});

describe('calcularStatusGeral', () => {
    const make = (statuses: string[]) => statuses.map(s => ({ status_agendamento: s }));

    it('returns "aprovado" when all are aprovado', () => {
        expect(calcularStatusGeral(make(['aprovado', 'aprovado']))).toBe('aprovado');
    });
    it('returns "parcialmente_aprovado" when aprovado + pendente', () => {
        expect(calcularStatusGeral(make(['aprovado', 'pendente']))).toBe('parcialmente_aprovado');
    });
    it('returns "parcialmente_aprovado" when aprovado + negado', () => {
        expect(calcularStatusGeral(make(['aprovado', 'negado']))).toBe('parcialmente_aprovado');
    });
    it('returns "pendente" when all are pendente', () => {
        expect(calcularStatusGeral(make(['pendente', 'pendente']))).toBe('pendente');
    });
    it('returns "parcialmente_negado" when pendente + negado', () => {
        expect(calcularStatusGeral(make(['pendente', 'negado']))).toBe('parcialmente_negado');
    });
    it('returns "parcialmente_negado" when pendente + cancelado', () => {
        expect(calcularStatusGeral(make(['pendente', 'cancelado']))).toBe('parcialmente_negado');
    });
    it('returns "negado" when all are negado', () => {
        expect(calcularStatusGeral(make(['negado', 'negado']))).toBe('negado');
    });
    it('returns "cancelado" when all are cancelado', () => {
        expect(calcularStatusGeral(make(['cancelado', 'cancelado']))).toBe('cancelado');
    });
    it('returns "concluido" when all are concluido', () => {
        expect(calcularStatusGeral(make(['concluido', 'concluido']))).toBe('concluido');
    });
    it('returns "finalizado" when mix of concluido + negado', () => {
        expect(calcularStatusGeral(make(['concluido', 'negado']))).toBe('finalizado');
    });
    it('returns "finalizado" when mix of concluido + cancelado', () => {
        expect(calcularStatusGeral(make(['concluido', 'cancelado']))).toBe('finalizado');
    });
    it('returns "indefinido" for unknown single status', () => {
        expect(calcularStatusGeral(make(['desconhecido']))).toBe('indefinido');
    });
});
