import React from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  Filter,
  HardHat,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Tag,
  User,
  X,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { formatMonthBR } from '../utils/priority';

export const FilterBar: React.FC = () => {
  const { filterState, setFilterState, resetFilters, categories, members, locations, monthlyBudgets } =
    useMaintenance();

  const priorities = ['Alta', 'Média', 'Baixa'];
  const risks = [5, 4, 3, 2, 1];
  const statuses = [
    'NOVOS PROBLEMAS',
    'A AVALIAR',
    'PLANEJADO',
    'EM ANDAMENTO',
    'AGUARDANDO MATERIAL',
    'AGUARDANDO TERCEIRO',
    'CONCLUÍDO',
    'CANCELADO',
  ];

  const hasActiveFilters =
    filterState.category ||
    filterState.problem ||
    filterState.responsible ||
    filterState.supervisor ||
    filterState.priority ||
    filterState.risk ||
    filterState.status ||
    filterState.location ||
    filterState.forecastMonth ||
    filterState.onlyOverdue ||
    filterState.onlyNeedsTM ||
    filterState.onlyHighRisk;

  // Filter members list for supervisor options
  const supervisorsList = members.filter((m) => m.role === 'SUPERVISOR' || m.role === 'COORDENADOR' || m.role === 'ADMINISTRADOR');

  return (
    <div
      id="filters-container"
      className="bg-white border-b border-gray-200 p-3 transition-all shrink-0"
    >
      <div className="max-w-7xl mx-auto space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 uppercase tracking-tight">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtros Rápidos</span>
          </div>

          {hasActiveFilters && (
            <button
              id="btn-reset-filters"
              onClick={resetFilters}
              className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {/* Categoria */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Categoria</label>
            <select
              id="filter-category"
              value={filterState.category}
              onChange={(e) => setFilterState((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full bg-gray-100 text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Responsável</label>
            <select
              id="filter-responsible"
              value={filterState.responsible}
              onChange={(e) => setFilterState((prev) => ({ ...prev, responsible: e.target.value }))}
              className="w-full bg-gray-100 text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Todos</option>
              {members.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Supervisor Filter */}
          <div className="bg-indigo-50/50 p-0.5 rounded border border-indigo-100">
            <label className="block text-[10px] font-bold uppercase text-indigo-800 mb-0.5">Supervisor</label>
            <select
              id="filter-supervisor"
              value={filterState.supervisor || ''}
              onChange={(e) => setFilterState((prev) => ({ ...prev, supervisor: e.target.value }))}
              className="w-full bg-white text-indigo-900 text-xs font-medium rounded px-2 py-1.5 border border-indigo-200 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Todos Supervisores</option>
              {(supervisorsList.length > 0 ? supervisorsList : members).map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Prioridade (GUT)</label>
            <select
              id="filter-priority"
              value={filterState.priority}
              onChange={(e) => setFilterState((prev) => ({ ...prev, priority: e.target.value }))}
              className="w-full bg-gray-100 text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Todas</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Risco */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Nível de Risco</label>
            <select
              id="filter-risk"
              value={filterState.risk}
              onChange={(e) => setFilterState((prev) => ({ ...prev, risk: e.target.value }))}
              className="w-full bg-gray-100 text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="5">5 — Crítico</option>
              <option value="4">4 — Muito Alto</option>
              <option value="3">3 — Alto</option>
              <option value="2">2 — Moderado</option>
              <option value="1">1 — Baixo</option>
            </select>
          </div>

          {/* Local */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Local no Salão</label>
            <select
              id="filter-location"
              value={filterState.location}
              onChange={(e) => setFilterState((prev) => ({ ...prev, location: e.target.value }))}
              className="w-full bg-gray-100 text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Todos</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mês Previsto */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Mês Previsto</label>
            <select
              id="filter-month"
              value={filterState.forecastMonth}
              onChange={(e) => setFilterState((prev) => ({ ...prev, forecastMonth: e.target.value }))}
              className="w-full bg-gray-100 text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Todos</option>
              {monthlyBudgets.map((b) => (
                <option key={b.month} value={b.month}>
                  {formatMonthBR(b.month)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Toggle Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <button
            id="toggle-filter-overdue"
            onClick={() =>
              setFilterState((prev) => ({ ...prev, onlyOverdue: !prev.onlyOverdue }))
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
              filterState.onlyOverdue
                ? 'bg-red-100 text-red-800 border-red-300 font-bold'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span>Atrasados</span>
          </button>

          <button
            id="toggle-filter-tm"
            onClick={() =>
              setFilterState((prev) => ({ ...prev, onlyNeedsTM: !prev.onlyNeedsTM }))
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
              filterState.onlyNeedsTM
                ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Consulta TM</span>
          </button>

          <button
            id="toggle-filter-high-risk"
            onClick={() =>
              setFilterState((prev) => ({ ...prev, onlyHighRisk: !prev.onlyHighRisk }))
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
              filterState.onlyHighRisk
                ? 'bg-orange-100 text-orange-800 border-orange-300 font-bold'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <HardHat className="w-3 h-3 text-orange-600" />
            <span>Alto Risco</span>
          </button>
        </div>
      </div>
    </div>
  );
};

