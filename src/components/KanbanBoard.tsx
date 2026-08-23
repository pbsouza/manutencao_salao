import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Archive,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns,
  Download,
  HelpCircle,
  Layers,
  LayoutGrid,
  List,
  PauseCircle,
  Plus,
  SlidersHorizontal,
  Smartphone,
  Truck,
  Upload,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { ServiceItem, ServiceStatus } from '../types';
import { formatCurrencyBRL, isOverdue, normalizeServiceStatus } from '../utils/priority';
import { ServiceCard } from './ServiceCard';

interface ColumnDef {
  status: ServiceStatus;
  label: string;
  shortLabel: string;
  color: string;
  icon: React.ElementType;
  description: string;
}

export const KANBAN_COLUMNS: ColumnDef[] = [
  {
    status: 'NOVOS PROBLEMAS',
    label: 'Novos Problemas',
    shortLabel: 'Novos',
    color: 'border-blue-500/40 bg-blue-500/5',
    icon: Zap,
    description: 'Problemas recém-identificados aguardando triagem',
  },
  {
    status: 'A AVALIAR',
    label: 'A Avaliar',
    shortLabel: 'Avaliar',
    color: 'border-purple-500/40 bg-purple-500/5',
    icon: HelpCircle,
    description: 'Necessita de vistoria no local ou cotação de material',
  },
  {
    status: 'PLANEJADO',
    label: 'Planejado',
    shortLabel: 'Planejado',
    color: 'border-indigo-500/40 bg-indigo-500/5',
    icon: Clock,
    description: 'Serviços aprovados com data e voluntários agendados',
  },
  {
    status: 'EM ANDAMENTO',
    label: 'Em Andamento',
    shortLabel: 'Andamento',
    color: 'border-amber-500/40 bg-amber-500/5',
    icon: Users,
    description: 'Serviço sendo executado pela equipe no Salão',
  },
  {
    status: 'AGUARDANDO MATERIAL',
    label: 'Aguardando Material',
    shortLabel: 'Material',
    color: 'border-orange-500/40 bg-orange-500/5',
    icon: PauseCircle,
    description: 'Paralisado aguardando entrega ou compra de insumos',
  },
  {
    status: 'AGUARDANDO TERCEIRO',
    label: 'Aguardando Terceiro',
    shortLabel: 'Terceiro',
    color: 'border-cyan-500/40 bg-cyan-500/5',
    icon: Truck,
    description: 'Aguardando visita técnica especializada (empresa externa)',
  },
  {
    status: 'CONCLUÍDO',
    label: 'Concluído',
    shortLabel: 'Concluído',
    color: 'border-emerald-500/40 bg-emerald-500/5',
    icon: CheckCircle2,
    description: 'Serviço finalizado e inspecionado com sucesso',
  },
  {
    status: 'CANCELADO',
    label: 'Cancelado',
    shortLabel: 'Cancelado',
    color: 'border-slate-600/40 bg-slate-800/10',
    icon: XCircle,
    description: 'Serviço descontinuado ou considerado desnecessário',
  },
];

interface KanbanBoardProps {
  onSelectService: (service: ServiceItem) => void;
  onRequireSafetyModal?: (service: ServiceItem, nextStatus: ServiceStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onSelectService,
  onRequireSafetyModal,
}) => {
  const {
    services,
    moveService,
    openNewServiceModal,
    openProblemTemplatesModal,
    exportDatabaseJSON,
    importDatabaseJSON,
    filterState,
    monthlyBudgets,
  } = useMaintenance();

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [jsonRestoreStatus, setJsonRestoreStatus] = useState<string | null>(null);
  const [draggedServiceId, setDraggedServiceId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<ServiceStatus | null>(null);

  // Responsive View Mode: 'columns' (scroll), 'tabs' (single column focus for phone/smartwatch), 'list' (compact stream)
  const [viewMode, setViewMode] = useState<'columns' | 'tabs' | 'list'>('columns');
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number>(0);

  const handleJSONFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJsonRestoreStatus('Restaurando backup...');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const success = await importDatabaseJSON(text);
        if (success) {
          setJsonRestoreStatus('Backup restaurado com sucesso!');
        } else {
          setJsonRestoreStatus('Erro ao ler arquivo JSON.');
        }
      } catch (err) {
        setJsonRestoreStatus('Erro ao processar JSON.');
      }
      setTimeout(() => setJsonRestoreStatus(null), 4000);
    };
    reader.readAsText(file);

    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
  };

  // Filter services
  const filteredServices = services.filter((item) => {
    // Search query
    if (filterState.search) {
      const q = filterState.search.toLowerCase();
      const matchSearch =
        item.title.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.responsibleName.toLowerCase().includes(q) ||
        item.problem.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    // Category
    if (filterState.category && item.category !== filterState.category) {
      return false;
    }

    // Responsible
    if (filterState.responsible && item.responsibleName !== filterState.responsible) {
      return false;
    }

    // Priority
    if (filterState.priority && item.priority !== filterState.priority) {
      return false;
    }

    // Risk
    if (filterState.risk && String(item.risk) !== filterState.risk) {
      return false;
    }

    // Status
    if (filterState.status && item.status !== filterState.status) {
      return false;
    }

    // Location
    if (filterState.location && item.location !== filterState.location) {
      return false;
    }

    // Forecast Month
    if (filterState.forecastMonth && item.forecastMonth !== filterState.forecastMonth) {
      return false;
    }

    // Overdue
    if (filterState.onlyOverdue && !isOverdue(item.dueDate, item.status)) {
      return false;
    }

    // Needs TM
    if (filterState.onlyNeedsTM && !item.needsTM) {
      return false;
    }

    // High Risk
    if (filterState.onlyHighRisk && !item.isHighRisk) {
      return false;
    }

    return true;
  });

  // Top Metrics calculation
  const totalOpen = services.filter(
    (s) => s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO'
  ).length;

  const totalHigh = services.filter(
    (s) => s.priority === 'Alta' && s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO'
  ).length;

  const totalTM = services.filter(
    (s) => s.needsTM && s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO'
  ).length;

  const totalEstimated = services
    .filter((s) => s.status !== 'CANCELADO')
    .reduce((acc, s) => acc + (s.estimatedCost || 0), 0);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, serviceId: string) => {
    e.dataTransfer.setData('text/plain', serviceId);
    setDraggedServiceId(serviceId);
  };

  const handleDragOver = (e: React.DragEvent, status: ServiceStatus) => {
    e.preventDefault();
    if (activeDropColumn !== status) {
      setActiveDropColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ServiceStatus) => {
    e.preventDefault();
    setActiveDropColumn(null);
    const serviceId = e.dataTransfer.getData('text/plain') || draggedServiceId;
    if (!serviceId) return;

    const targetService = services.find((s) => s.id === serviceId);
    if (!targetService) return;

    if (targetService.status === targetStatus) return;

    // Check if moving to "EM ANDAMENTO" and requires safety checklist confirmation
    if (
      targetStatus === 'EM ANDAMENTO' &&
      targetService.isHighRisk &&
      !targetService.safetyChecklistConfirmed
    ) {
      if (onRequireSafetyModal) {
        onRequireSafetyModal(targetService, targetStatus);
      } else {
        moveService(serviceId, targetStatus, true);
      }
      return;
    }

    moveService(serviceId, targetStatus);
    setDraggedServiceId(null);
  };

  const activeColumn = KANBAN_COLUMNS[selectedColumnIndex] || KANBAN_COLUMNS[0];
  const activeColServices = filteredServices.filter((s) => normalizeServiceStatus(s.status) === activeColumn.status);
  const activeColCost = activeColServices.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);

  return (
    <div id="kanban-board-workspace" className="flex flex-col min-h-full bg-[#F3F4F6]">
      {/* Top Quick Metrics Bar - Responsive grid for phone/tablet/desktop */}
      <section className="p-2.5 sm:p-3 md:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-gray-50 border-b border-gray-200 shrink-0">
        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-gray-200 flex flex-col justify-between min-h-[64px] sm:h-18 shadow-2xs">
          <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-tight truncate">
            Em Aberto
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-gray-900">{totalOpen}</span>
            <span className="text-blue-600 text-[9px] sm:text-[10px] font-bold">pendentes</span>
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-gray-200 flex flex-col justify-between min-h-[64px] sm:h-18 shadow-2xs">
          <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-tight truncate">
            Alta Prioridade
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-red-600">{totalHigh}</span>
            <span className="bg-red-100 text-red-700 text-[9px] sm:text-[10px] px-1 py-0.2 rounded font-bold">
              GUT
            </span>
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-gray-200 flex flex-col justify-between min-h-[64px] sm:h-18 shadow-2xs">
          <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-tight truncate">
            Consulta TM
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-blue-600">{totalTM}</span>
            <span className="text-gray-400 text-[9px] sm:text-[10px] font-medium">supervisão</span>
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-gray-200 flex flex-col justify-between min-h-[64px] sm:h-18 shadow-2xs">
          <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-tight truncate">
            Custo Previsto
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm sm:text-lg lg:text-xl font-black text-emerald-700 truncate">
              {formatCurrencyBRL(totalEstimated)}
            </span>
            <span className="text-emerald-600 text-[9px] sm:text-[10px] font-bold hidden sm:inline">planejado</span>
          </div>
        </div>
      </section>

      {/* Hidden JSON file input */}
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleJSONFileRestore}
        className="hidden"
        id="kanban-json-restore-input"
      />

      {jsonRestoreStatus && (
        <div className="mx-3 sm:mx-4 mt-2 sm:mt-3 p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{jsonRestoreStatus}</span>
        </div>
      )}

      {/* View Mode Bar for Mobile, Tablet & Desktop */}
      <div className="px-3 sm:px-4 pt-2 pb-1 bg-gray-100 border-b border-gray-200 flex items-center justify-between gap-2 overflow-x-auto">
        {/* View Mode Toggles */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('columns')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              viewMode === 'columns'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Visualização em Colunas Completas (Scroll Horizontal)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Colunas</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('tabs')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              viewMode === 'tabs'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Visualização por Etapa (Ideal para Telas Pequenas, Smartphone e Smartwatch)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Por Etapa</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Visualização em Lista Corrida"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>

        {/* Quick Add Problem / Template Action */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => openNewServiceModal()}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo Problema</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Horizontal Tabs selector when in 'tabs' mode or on small screens */}
      {viewMode === 'tabs' && (
        <div className="px-2 sm:px-4 py-2 bg-white border-b border-gray-200 overflow-x-auto flex items-center gap-1.5 no-scrollbar select-none">
          {KANBAN_COLUMNS.map((col, idx) => {
            const count = filteredServices.filter(
              (s) => normalizeServiceStatus(s.status) === col.status
            ).length;
            const isSelected = selectedColumnIndex === idx;
            return (
              <button
                key={col.status}
                type="button"
                onClick={() => setSelectedColumnIndex(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{col.shortLabel}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : count > 0
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty Board Initial Onboarding Banner (When 0 services in board) */}
      {services.length === 0 && (
        <div className="mx-3 sm:mx-4 mt-3 p-3.5 sm:p-4 bg-white border border-blue-200 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                Quadro Pronto
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                O quadro está limpo e pronto para registrar os serviços
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-600">
              Você pode cadastrar o primeiro problema manualmente, selecionar problemas pré-fixados da base oficial ou restaurar um backup JSON.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => openNewServiceModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrar Primeiro Problema</span>
            </button>

            <button
              onClick={() => openProblemTemplatesModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Base Pré-fixada</span>
            </button>

            <label
              htmlFor="kanban-json-restore-input"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Restaurar JSON</span>
            </label>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: SINGLE COLUMN TAB FOCUS (Optimal for Mobile, Tablet, Smartwatches) */}
      {viewMode === 'tabs' && (
        <div className="flex-1 p-2.5 sm:p-4 max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col min-h-[400px]">
            {/* Column Title with Prev / Next navigators */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setSelectedColumnIndex((prev) =>
                    prev > 0 ? prev - 1 : KANBAN_COLUMNS.length - 1
                  )
                }
                className="p-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 cursor-pointer shadow-2xs"
                title="Coluna Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  {React.createElement(activeColumn.icon, { className: 'w-4 h-4 text-blue-600' })}
                  <h2 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-tight">
                    {activeColumn.label}
                  </h2>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 flex items-center justify-center gap-2">
                  <span>{activeColServices.length} serviços</span>
                  {activeColCost > 0 && (
                    <span className="font-bold text-emerald-700">
                      • {formatCurrencyBRL(activeColCost)}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedColumnIndex((prev) =>
                    prev < KANBAN_COLUMNS.length - 1 ? prev + 1 : 0
                  )
                }
                className="p-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 cursor-pointer shadow-2xs"
                title="Próxima Coluna"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Column Cards */}
            <div className="p-2.5 sm:p-3 flex-1 space-y-2.5 bg-gray-50/50 overflow-y-auto">
              {activeColServices.length === 0 ? (
                <div className="py-12 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
                  <p className="text-xs font-bold text-gray-600">Nenhum serviço nesta etapa</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                    {activeColumn.description}
                  </p>
                  {activeColumn.status === 'NOVOS PROBLEMAS' && (
                    <button
                      onClick={() => openNewServiceModal()}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cadastrar Problema</span>
                    </button>
                  )}
                </div>
              ) : (
                activeColServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onSelect={onSelectService}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>

            {/* Footer quick add */}
            {activeColumn.status === 'NOVOS PROBLEMAS' && activeColServices.length > 0 && (
              <div className="p-2 bg-white border-t border-gray-200">
                <button
                  onClick={() => openNewServiceModal()}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Mais um Problema</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: LIST VIEW STREAM (Compact for all devices) */}
      {viewMode === 'list' && (
        <div className="flex-1 p-2.5 sm:p-4 max-w-3xl mx-auto w-full space-y-4">
          {KANBAN_COLUMNS.map((col) => {
            const colServices = filteredServices.filter(
              (s) => normalizeServiceStatus(s.status) === col.status
            );
            if (colServices.length === 0) return null;
            const Icon = col.icon;
            const colCost = colServices.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);

            return (
              <div
                key={col.status}
                className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden"
              >
                <div className="p-2.5 sm:p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                      {col.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {colCost > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {formatCurrencyBRL(colCost)}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full font-bold text-[10px]">
                      {colServices.length}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-gray-50/30">
                  {colServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onSelect={onSelectService}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: STANDARD MULTI-COLUMN BOARD (Horizontal Scroll) */}
      {viewMode === 'columns' && (
        <div id="kanban-board-container" className="flex-1 overflow-x-auto p-2.5 sm:p-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-[1720px] pb-12">
            {KANBAN_COLUMNS.map((col) => {
              const colServices = filteredServices.filter(
                (s) => normalizeServiceStatus(s.status) === col.status
              );
              const totalCost = colServices.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);
              const Icon = col.icon;
              const isDropActive = activeDropColumn === col.status;

              return (
                <div
                  key={col.status}
                  id={`kanban-column-${col.status.toLowerCase().replace(/\s+/g, '-')}`}
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.status)}
                  className={`w-72 shrink-0 bg-gray-200/60 rounded-xl border flex flex-col min-h-[450px] transition-all shadow-2xs ${
                    isDropActive
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50'
                      : 'border-gray-300/80'
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-2.5 border-b border-gray-300 bg-gray-100/95 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-gray-600" />
                      <h2 className="text-[11px] font-black uppercase text-gray-700 tracking-tight">
                        {col.label}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {totalCost > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {formatCurrencyBRL(totalCost)}
                        </span>
                      )}
                      <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        {colServices.length}
                      </span>
                    </div>
                  </div>

                  {/* Column Cards List */}
                  <div className="flex-1 p-2 space-y-2">
                    {colServices.length === 0 ? (
                      <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-[11px] text-gray-500 font-medium">Nenhum serviço</p>
                        <span className="text-[9px] text-gray-400 mt-0.5">
                          Arraste um card aqui
                        </span>
                      </div>
                    ) : (
                      colServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onSelect={onSelectService}
                          onDragStart={handleDragStart}
                        />
                      ))
                    )}
                  </div>

                  {/* Column Footer: Quick Add for "NOVOS PROBLEMAS" */}
                  {col.status === 'NOVOS PROBLEMAS' && (
                    <div className="p-1.5 border-t border-gray-300 bg-gray-100/80 rounded-b-xl mt-auto">
                      <button
                        id="btn-kanban-quick-add"
                        onClick={() => openNewServiceModal()}
                        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold hover:bg-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Problema</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

