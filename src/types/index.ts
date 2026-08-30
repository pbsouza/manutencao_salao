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

export type UserRole =
  | 'ADMINISTRADOR'
  | 'COORDENADOR'
  | 'SUPERVISOR'
  | 'RESPONSÁVEL'
  | 'EXECUTOR'
  | 'COLABORADOR';

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
  canEdit?: boolean; // Permissão de edição concedida pelo Administrador após login
  isApproved?: boolean; // Acesso liberado pelo Administrador para a área restrita
}

export interface BatchAssignPayload {
  serviceIds: string[];
  executorName?: string;
  executorNames?: string[];
  responsibleName?: string;
  responsibleNames?: string[];
  supervisorName?: string;
  supervisorNames?: string[];
  supervisorId?: string;
  supervisorIds?: string[];
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
  originalSize?: number;
  width?: number;
  height?: number;
  savedPercentage?: number;
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
  responsibleName: string; // Responsável principal ou exibição resumida
  responsibleIds?: string[]; // Suporte a múltiplos responsáveis
  responsibleNames?: string[]; // Nomes dos múltiplos responsáveis
  executorName: string; // Quem executa na prática / voluntário designado
  executorIds?: string[]; // Suporte a múltiplos executores
  executorNames?: string[]; // Nomes dos múltiplos executores
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
  
  // Linked Equipment / Patrimônio
  equipmentId?: string;
  equipmentCode?: string;
  equipmentName?: string;
  
  // Notes & Attachments
  notes: string;
  attachments: Attachment[];
  history: HistoryEvent[];
  
  createdAt: string;
  updatedAt: string;
}

export type EquipmentStatus = 'OPERACIONAL' | 'EM MANUTENÇÃO' | 'REQUER INSPEÇÃO' | 'DESATIVADO';

export interface EquipmentMaintenanceLog {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'PREVENTIVA' | 'CORRETIVA' | 'INSPEÇÃO' | 'INSTALAÇÃO';
  description: string;
  performedBy: string;
  cost?: number;
  serviceId?: string; // Link to Kanban card if created
  serviceCode?: string;
}

export interface EquipmentItem {
  id: string;
  code: string; // e.g. EQ-AC-001, EQ-SOM-001
  name: string;
  category: string;
  location: string;
  brand: string;
  model: string;
  serialNumber?: string;
  voltage?: '110V' | '220V' | 'Bivolt' | 'Trifásico' | 'Bateria / Pilha' | 'Manual / Não elétrico';
  powerRating?: string; // e.g. 24.000 BTU, 1 CV, 500W
  installDate: string; // YYYY-MM-DD
  warrantyExpiry?: string; // YYYY-MM-DD
  status: EquipmentStatus;
  lastMaintenanceDate?: string;
  nextPreventiveDate?: string;
  estimatedValue?: number;
  responsibleName?: string;
  notes?: string;
  qrCodeData?: string;
  photos?: string[];
  maintenanceHistory: EquipmentMaintenanceLog[];
  createdAt: string;
  updatedAt: string;
}

export type PreventiveEventPeriod = 'PRE_CELEBRACAO' | 'JUNHO' | 'POS_CONGRESSO' | 'BIENAL_TM';

export interface PreventiveWorkSheet {
  id: string;
  title: string;
  eventPeriod: PreventiveEventPeriod;
  periodLabel: string; // "Fevereiro a Março", "Junho", "Setembro a Outubro", "A cada 1 a 2 anos (TM)"
  category: string;
  description: string;
  guidelines: string[];
  safetyInstructions?: string[];
  requiresTM?: boolean;
  isHighRisk?: boolean;
  requiresDC85?: boolean; // Form DC-85 com 15 dias de antecedência para alto risco
  evaluationNote?: string;
  frequency: '3x ao ano' | '2x ao ano' | 'Anual' | 'A cada 1 ou 2 anos (TM)';
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'GUT_ALERT' | 'ASSIGNMENT' | 'DUE_DATE' | 'PREVENTIVE' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  linkTab?: string;
  serviceId?: string;
  equipmentId?: string;
}

export interface NotificationSettings {
  enablePush: boolean;
  alertNewProblems: boolean;
  alertHighGUT: boolean;
  alertAssignments: boolean;
  alertDueDate: boolean;
  alertPreventiveProgram: boolean;
  soundEnabled: boolean;
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
