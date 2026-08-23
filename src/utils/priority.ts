import { GUTLevel, MonthName, OfficialStatus, PriorityLevel, RiskLevel, ServiceStatus, YesNoEmpty } from '../types';

export interface GUTDetail {
  value: GUTLevel;
  gravityLabel: string;
  urgencyLabel: string;
  trendLabel: string;
  description: string;
}

export const MONTH_NAMES: MonthName[] = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * Tabela Oficial da Planilha:
 * Risco 5 -> Extremamente grave | Precisa ser resolvido de imediato | Piorar rapidamente | Prioridade: Alta
 * Risco 4 -> Muito grave | É urgente | Piorar em curto prazo | Prioridade: Alta
 * Risco 3 -> Grave | O mais rápido possível | Piorar em médio prazo | Prioridade: Média
 * Risco 2 -> Pouco grave | Pouco urgente | Piorar em longo prazo | Prioridade: Média
 * Risco 1 -> Sem gravidade | Pode esperar | Não muda nada | Prioridade: Baixa
 */
export const SPREADSHEET_RISK_MAP: Record<
  RiskLevel,
  {
    gravityLevel: GUTLevel;
    gravityText: string;
    urgencyLevel: GUTLevel;
    urgencyText: string;
    trendLevel: GUTLevel;
    trendText: string;
    priority: PriorityLevel;
    score: number;
  }
> = {
  5: {
    gravityLevel: 5,
    gravityText: 'Extremamente grave',
    urgencyLevel: 5,
    urgencyText: 'Precisa ser resolvido de imediato',
    trendLevel: 5,
    trendText: 'Piorar rapidamente',
    priority: 'Alta',
    score: 125,
  },
  4: {
    gravityLevel: 4,
    gravityText: 'Muito grave',
    urgencyLevel: 4,
    urgencyText: 'É urgente',
    trendLevel: 4,
    trendText: 'Piorar em curto prazo',
    priority: 'Alta',
    score: 64,
  },
  3: {
    gravityLevel: 3,
    gravityText: 'Grave',
    urgencyLevel: 3,
    urgencyText: 'O mais rápido possível',
    trendLevel: 3,
    trendText: 'Piorar em médio prazo',
    priority: 'Média',
    score: 27,
  },
  2: {
    gravityLevel: 2,
    gravityText: 'Pouco grave',
    urgencyLevel: 2,
    urgencyText: 'Pouco urgente',
    trendLevel: 2,
    trendText: 'Piorar em longo prazo',
    priority: 'Média',
    score: 8,
  },
  1: {
    gravityLevel: 1,
    gravityText: 'Sem gravidade',
    urgencyLevel: 1,
    urgencyText: 'Pode esperar',
    trendLevel: 1,
    trendText: 'Não muda nada',
    priority: 'Baixa',
    score: 1,
  },
};

export const GUT_DEFINITIONS: Record<GUTLevel, GUTDetail> = {
  5: {
    value: 5,
    gravityLabel: 'Extremamente grave',
    urgencyLabel: 'Precisa ser resolvido de imediato',
    trendLabel: 'Piorar rapidamente',
    description: 'Impacto severo na segurança, reuniões ou estrutura.',
  },
  4: {
    value: 4,
    gravityLabel: 'Muito grave',
    urgencyLabel: 'É urgente',
    trendLabel: 'Piorar em curto prazo',
    description: 'Alto impacto funcional, risco de dano progressivo.',
  },
  3: {
    value: 3,
    gravityLabel: 'Grave',
    urgencyLabel: 'O mais rápido possível',
    trendLabel: 'Piorar em médio prazo',
    description: 'Compromete a operação regular ou estética do Salão.',
  },
  2: {
    value: 2,
    gravityLabel: 'Pouco grave',
    urgencyLabel: 'Pouco urgente',
    trendLabel: 'Piorar em longo prazo',
    description: 'Pequeno incômodo ou manutenção preventiva rotineira.',
  },
  1: {
    value: 1,
    gravityLabel: 'Sem gravidade',
    urgencyLabel: 'Pode esperar',
    trendLabel: 'Não muda nada',
    description: 'Item estético menor ou sem impacto na utilização.',
  },
};

export const RISK_DEFINITIONS: Record<
  RiskLevel,
  { level: RiskLevel; label: string; bgClass: string; textClass: string; borderClass: string; badgeColor: string }
> = {
  5: {
    level: 5,
    label: 'Risco 5 — Crítico',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700 font-semibold',
    borderClass: 'border-red-200',
    badgeColor: '#dc2626',
  },
  4: {
    level: 4,
    label: 'Risco 4 — Muito Alto',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700 font-semibold',
    borderClass: 'border-orange-200',
    badgeColor: '#ea580c',
  },
  3: {
    level: 3,
    label: 'Risco 3 — Alto',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700 font-semibold',
    borderClass: 'border-amber-200',
    badgeColor: '#d97706',
  },
  2: {
    level: 2,
    label: 'Risco 2 — Moderado',
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-700 font-semibold',
    borderClass: 'border-yellow-200',
    badgeColor: '#ca8a04',
  },
  1: {
    level: 1,
    label: 'Risco 1 — Baixo',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700 font-semibold',
    borderClass: 'border-emerald-200',
    badgeColor: '#16a34a',
  },
};

/**
 * Regra 10: Cálculo da Prioridade
 * A lógica efetivamente implementada na planilha associa Risco -> Gravidade -> Prioridade:
 * Risco 5 -> Gravidade "Extremamente grave" -> Alta
 * Risco 4 -> Gravidade "Muito grave" -> Alta
 * Risco 3 -> Gravidade "Grave" -> Média
 * Risco 2 -> Gravidade "Pouco grave" -> Média
 * Risco 1 -> Gravidade "Sem gravidade" -> Baixa
 */
export function getPriorityFromRisk(risk: RiskLevel): PriorityLevel {
  return SPREADSHEET_RISK_MAP[risk]?.priority || 'Baixa';
}

export function getSpreadsheetClassification(risk: RiskLevel) {
  return SPREADSHEET_RISK_MAP[risk] || SPREADSHEET_RISK_MAP[1];
}

/**
 * Regra 13: Consulta ao Representante de Manutenção (TM)
 * Se Alto Risco = vazio -> Consulta TM = vazio
 * Se Alto Risco = Sim -> Consulta TM = Sim
 * Se Custo estimado > Previsão de gastos -> Consulta TM = Sim
 * Se Alto Risco = Não E custo não ultrapassa o limite -> Consulta TM = Não
 */
export function calculateTMConsultation(
  highRiskOption: YesNoEmpty | boolean | undefined,
  estimatedCost: number = 0,
  budgetCeiling: number = 0
): {
  needsTMOption: YesNoEmpty;
  needsTM: boolean;
  reason?: string;
} {
  // Normalize boolean or empty string
  let highRiskVal: YesNoEmpty = '';
  if (typeof highRiskOption === 'boolean') {
    highRiskVal = highRiskOption ? 'Sim' : 'Não';
  } else if (highRiskOption === 'Sim' || highRiskOption === 'Não') {
    highRiskVal = highRiskOption;
  }

  // Se Alto Risco não foi preenchido, mantém vazio
  if (highRiskVal === '') {
    return {
      needsTMOption: '',
      needsTM: false,
      reason: 'Aguardando definição de Alto Risco',
    };
  }

  // Se Alto Risco = Sim
  if (highRiskVal === 'Sim') {
    return {
      needsTMOption: 'Sim',
      needsTM: true,
      reason: 'Envolve trabalho de alto risco (Diretriz DC-82)',
    };
  }

  // Se Custo Estimado > Previsão / Teto de Gastos (quando teto > 0)
  if (budgetCeiling > 0 && estimatedCost > budgetCeiling) {
    return {
      needsTMOption: 'Sim',
      needsTM: true,
      reason: `Custo estimado (${formatCurrencyBRL(estimatedCost)}) excede a previsão mensal (${formatCurrencyBRL(budgetCeiling)})`,
    };
  }

  // Alto Risco = Não e Custo <= Previsão
  return {
    needsTMOption: 'Não',
    needsTM: false,
    reason: 'Trabalho rotineiro dentro do limite aprovado',
  };
}

export function normalizeServiceStatus(rawStatus?: string): ServiceStatus {
  if (!rawStatus) return 'NOVOS PROBLEMAS';
  const s = rawStatus.trim().toUpperCase();
  if (s === 'NOVOS PROBLEMAS' || s === 'NOVOS' || s === 'NOVO PROBLEMA' || s === 'NOVO') return 'NOVOS PROBLEMAS';
  if (s === 'A AVALIAR' || s === 'AVALIAR' || s === 'EM AVALIAÇÃO' || s === 'EM AVALIACAO' || s === 'AVALIAÇÃO') return 'A AVALIAR';
  if (s === 'PLANEJADO' || s === 'PLANEJADA' || s === 'PLANEJAMENTO' || s === 'PLANEJADOS') return 'PLANEJADO';
  if (s === 'EM ANDAMENTO' || s === 'ANDAMENTO' || s === 'EM EXECUÇÃO' || s === 'EM EXECUCAO' || s === 'EXECUÇÃO') return 'EM ANDAMENTO';
  if (s === 'AGUARDANDO MATERIAL' || s === 'MATERIAL' || s === 'AGUARDANDO MATERIAIS' || s === 'MATERIAIS') return 'AGUARDANDO MATERIAL';
  if (s === 'AGUARDANDO TERCEIRO' || s === 'TERCEIRO' || s === 'AGUARDANDO TERCEIROS' || s === 'TERCEIROS') return 'AGUARDANDO TERCEIRO';
  if (s === 'CONCLUÍDO' || s === 'CONCLUIDO' || s === 'FINALIZADO' || s === 'CONCLUÍDA' || s === 'CONCLUIDA') return 'CONCLUÍDO';
  if (s === 'CANCELADO' || s === 'CANCELADA' || s === 'DESCONTINUADO') return 'CANCELADO';
  return 'NOVOS PROBLEMAS';
}

/**
 * Regra 20 e 22: Mapeamento entre Etapa do Kanban e Status Oficial da Planilha
 */
export function mapKanbanToOfficialStatus(stage: ServiceStatus): OfficialStatus {
  switch (stage) {
    case 'NOVOS PROBLEMAS':
    case 'A AVALIAR':
    case 'PLANEJADO':
      return 'Planejado';
    case 'EM ANDAMENTO':
    case 'AGUARDANDO MATERIAL':
    case 'AGUARDANDO TERCEIRO':
      return 'Em andamento';
    case 'CONCLUÍDO':
      return 'Concluído';
    case 'CANCELADO':
      return 'Cancelado';
    default:
      return 'Planejado';
  }
}

export function formatCurrencyBRL(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBR(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatMonthBR(monthStr: string | undefined | null): string {
  if (!monthStr) return '-';
  try {
    const [year, month] = monthStr.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTH_NAMES[monthIndex]} / ${year}`;
    }
    return monthStr;
  } catch {
    return monthStr;
  }
}

export function getMonthNameFromDate(dateStr?: string): MonthName {
  const date = dateStr ? new Date(dateStr) : new Date();
  const monthIdx = date.getMonth();
  return MONTH_NAMES[monthIdx];
}

export function isOverdue(dueDateStr: string, status: string): boolean {
  if (!dueDateStr || status === 'CONCLUÍDO' || status === 'CANCELADO') {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [year, month, day] = dueDateStr.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  return due < today;
}
