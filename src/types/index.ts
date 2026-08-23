export type PriorityLevel = 'Alta' | 'Média' | 'Baixa';

export type RiskLevel = 1 | 2 | 3 | 4 | 5;

export type GUTLevel = 1 | 2 | 3 | 4 | 5;

export type OfficialStatus = 'Planejado' | 'Em andamento' | 'Concluído' | 'Cancelado';

export type YesNoEmpty = 'Sim' | 'Não' | '';

export type MonthName =
  | 'Janeiro'
  | 'Fevereiro'
  | 'Março'
  | 'Abril'
  | 'Maio'
  | 'Junho'
  | 'Julho'
  | 'Agosto'
  | 'Setembro'
  | 'Outubro'
  | 'Novembro'
  | 'Dezembro';

export type ServiceStatus =
  | 'NOVOS PROBLEMAS'
  | 'A AVALIAR'
  | 'PLANEJADO'
  | 'EM ANDAMENTO'
  | 'AGUARDANDO MATERIAL'
  | 'AGUARDANDO TERCEIRO'
  | 'CONCLUÍDO'
  | 'CANCELADO';

export type UserRole = 'ADMINISTRADOR' | 'COORDENADOR' | 'SUPERVISOR' | 'RESPONSÁVEL' | 'COLABORADOR';

export interface UserMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarColor: string;
  assignedCategories: string[];
  active: boolean;
  uid?: string; // Firebase Auth UID
  photoURL?: string;
}

export interface BatchAssignPayload {
  serviceIds: string[];
  executorName?: string;
  responsibleName?: string;
  supervisorName?: string;
  supervisorId?: string;
  status?: ServiceStatus;
  dueDate?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  iconName: string;
  defaultResponsibleId: string;
  defaultResponsibleName: string;
  color: string;
  description?: string;
  active: boolean;
}

export interface ProblemTemplate {
  id: string;
  category: string;
  problem: string;
  recommendedSolution: string;
  risk: RiskLevel;
  defaultResponsible: string;
  defaultGravity: GUTLevel;
  defaultUrgency: GUTLevel;
  defaultTrend: GUTLevel;
  needsTM?: boolean;
  isHighRisk?: boolean;
  highRiskOption?: YesNoEmpty;
  notes?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string; // base64 or storage url
  type: 'image' | 'pdf' | 'document' | 'video';
  size?: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface HistoryEvent {
  id: string;
  timestamp: string; // ISO date string
  userName: string;
  action: string;
  details?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export interface ServiceItem {
  id: string;
  code: string; // e.g. SR-2026-001
  title: string;
  category: string;
  problem: string;
  description: string;
  location: string;
  recommendedSolution: string;
  
  // GUT Matrix & Priority (Calculados a partir do Risco conforme planilha oficial)
  gravity: GUTLevel;
  gravityText: string;
  urgency: GUTLevel;
  urgencyText: string;
  trend: GUTLevel;
  trendText: string;
  priorityScore: number;
  priority: PriorityLevel;
  
  // Risk (1 a 5)
  risk: RiskLevel;
  
  // Responsibility, Execution & Supervision
  responsibleId: string;
  responsibleName: string; // Responsável pela área ou execução
  executorName: string; // Quem executa na prática / voluntário designado
  supervisorId?: string; // ID do Supervisor designado
  supervisorName?: string; // Nome do Supervisor designado
  supervisorIds?: string[]; // Suporte a múltiplos supervisores designados
  supervisorNames?: string[]; // Nomes dos supervisores designados
  team?: string;
  assignedMember?: string;
  
  // Planning & Timing
  identifiedDate: string; // YYYY-MM-DD
  forecastMonth: string; // YYYY-MM (e.g. 2026-08)
  executionMonthName?: MonthName; // Janeiro..Dezembro
  dueDate: string; // YYYY-MM-DD
  completedDate?: string; // YYYY-MM-DD
  status: ServiceStatus; // Etapa operacional do Kanban
  officialStatus: OfficialStatus; // Status oficial da planilha
  
  // Financials
  estimatedCost: number;
  approvedCost: number;
  actualCost: number;
  
  // High Risk & TM Consultation Rules
  highRiskWork: YesNoEmpty; // "Sim" | "Não" | "" (Veja DC-82)
  isHighRisk: boolean;
  needsTMOption: YesNoEmpty; // "Sim" | "Não" | ""
  needsTM: boolean;
  tmStatus?: 'Não iniciado' | 'Consultado' | 'Aprovado pelo TM' | 'Em análise';
  safetyChecklistConfirmed?: boolean;
  safetyConfirmedBy?: string;
  safetyConfirmedAt?: string;
  
  // Notes & Attachments
  notes: string;
  attachments: Attachment[];
  history: HistoryEvent[];
  
  createdAt: string;
  updatedAt: string;
}

export interface LocationItem {
  id: string;
  name: string;
  description?: string;
  iconName?: string;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  monthName?: MonthName;
  ceilingAmount: number;
  notes?: string;
}

export interface FilterState {
  search: string;
  category: string;
  problem: string;
  responsible: string;
  supervisor?: string;
  priority: string;
  risk: string;
  status: string;
  officialStatus?: string;
  location: string;
  forecastMonth: string;
  executionMonth?: string;
  onlyOverdue: boolean;
  onlyNeedsTM: boolean;
  onlyHighRisk: boolean;
}
