import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit2,
  Plus,
  Save,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { formatCurrencyBRL, formatMonthBR } from '../utils/priority';

export const BudgetView: React.FC = () => {
  const { monthlyBudgets, setMonthlyBudget, services, setActiveTab, setFilterState } =
    useMaintenance();

  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editCeiling, setEditCeiling] = useState<number | string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const [newMonth, setNewMonth] = useState<string>('2026-09');
  const [newCeiling, setNewCeiling] = useState<number | string>(3000);
  const [isAddingMonth, setIsAddingMonth] = useState<boolean>(false);

  const startEdit = (month: string, ceiling: number, notes?: string) => {
    setEditingMonth(month);
    setEditCeiling(ceiling);
    setEditNotes(notes || '');
  };

  const saveEdit = (month: string) => {
    setMonthlyBudget(month, Number(editCeiling) || 0, editNotes);
    setEditingMonth(null);
  };

  const handleCreateMonth = (e: React.FormEvent) => {
    e.preventDefault();
    setMonthlyBudget(newMonth, Number(newCeiling) || 0);
    setIsAddingMonth(false);
  };

  const handleDrilldownMonth = (monthStr: string) => {
    setFilterState((prev) => ({ ...prev, forecastMonth: monthStr }));
    setActiveTab('kanban');
  };

  // Calculate grand totals across all months
  const totalBudgets = monthlyBudgets.reduce((acc, b) => acc + b.ceilingAmount, 0);
  const totalEstimated = services.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);
  const totalActual = services.reduce((acc, s) => acc + (s.actualCost || 0), 0);

  return (
    <div id="budget-view-container" className="p-4 lg:p-6 pb-32 sm:pb-36 md:pb-12 space-y-4 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Previsão e Controle Orçamentário Mensal
          </h2>
          <p className="text-[11px] text-gray-500">
            Acompanhe o teto aprovado mês a mês vs custos estimados e despesas realizadas
          </p>
        </div>

        <button
          onClick={() => setIsAddingMonth(!isAddingMonth)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-all cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Definir Novo Mês</span>
        </button>
      </div>

      {/* Grand Totals Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-gray-200 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Teto Orçamentário Total</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-gray-900">{formatCurrencyBRL(totalBudgets)}</div>
          <span className="text-[10px] text-gray-400">Soma de todos os meses planejados</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Custo Total Estimado</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700">{formatCurrencyBRL(totalEstimated)}</div>
          <span className="text-[10px] text-gray-400">
            {totalEstimated > totalBudgets ? '⚠️ Acima do teto geral' : '✓ Dentro do limite previsto'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Custo Total Realizado</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">{formatCurrencyBRL(totalActual)}</div>
          <span className="text-[10px] text-gray-400">
            Economia: {formatCurrencyBRL(Math.max(0, totalEstimated - totalActual))}
          </span>
        </div>
      </div>

      {/* Add Month Modal / Drawer */}
      {isAddingMonth && (
        <form
          onSubmit={handleCreateMonth}
          className="bg-white border border-gray-200 p-4 rounded-lg space-y-3 shadow-2xs"
        >
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-tight">Configurar Teto para Novo Mês</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Mês (AAAA-MM) *</label>
              <input
                type="month"
                required
                value={newMonth}
                onChange={(e) => setNewMonth(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 text-xs rounded px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Teto Orçamentário (R$) *
              </label>
              <input
                type="number"
                step="50"
                required
                value={newCeiling}
                onChange={(e) => setNewCeiling(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 text-xs rounded px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingMonth(false)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded hover:bg-gray-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 cursor-pointer shadow-2xs"
            >
              Salvar Mês
            </button>
          </div>
        </form>
      )}

      {/* Monthly Cards List */}
      <div className="space-y-3">
        {monthlyBudgets.map((b) => {
          const monthServices = services.filter((s) => s.forecastMonth === b.month);
          const monthEst = monthServices.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);
          const monthAct = monthServices.reduce((acc, s) => acc + (s.actualCost || 0), 0);
          const isOverLimit = monthEst > b.ceilingAmount;
          const percentUsed = Math.min(Math.round((monthEst / (b.ceilingAmount || 1)) * 100), 100);

          const isEditingThis = editingMonth === b.month;

          return (
            <div
              key={b.month}
              className={`bg-white p-4 rounded-lg border transition-all shadow-2xs ${
                isOverLimit ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Month title & notes */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {formatMonthBR(b.month)}
                    </h3>

                    {isOverLimit && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                        <AlertTriangle className="w-3 h-3" /> Excedeu (
                        {formatCurrencyBRL(monthEst - b.ceilingAmount)})
                      </span>
                    )}
                  </div>

                  {b.notes && <p className="text-[11px] text-gray-500">{b.notes}</p>}
                </div>

                {/* Numbers Comparison */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  {/* Teto */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Teto Orçado</span>
                    {isEditingThis ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          value={editCeiling}
                          onChange={(e) => setEditCeiling(e.target.value)}
                          className="w-24 bg-gray-50 text-gray-900 text-xs font-bold rounded p-1 border border-gray-300"
                        />
                        <button
                          onClick={() => saveEdit(b.month)}
                          className="p-1 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-800">
                          {formatCurrencyBRL(b.ceilingAmount)}
                        </span>
                        <button
                          onClick={() => startEdit(b.month, b.ceilingAmount, b.notes)}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Estimado */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Estimado</span>
                    <span
                      className={`text-xs font-bold ${
                        isOverLimit ? 'text-amber-700 font-extrabold' : 'text-gray-800'
                      }`}
                    >
                      {formatCurrencyBRL(monthEst)}
                    </span>
                  </div>

                  {/* Realizado */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Realizado</span>
                    <span className="text-xs font-bold text-emerald-700">
                      {formatCurrencyBRL(monthAct)}
                    </span>
                  </div>

                  {/* Drilldown button */}
                  <button
                    onClick={() => handleDrilldownMonth(b.month)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-200 transition-colors cursor-pointer"
                  >
                    <span>{monthServices.length} itens</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                  <span>Comprometimento do Orçamento</span>
                  <span className="font-bold text-gray-700">
                    {percentUsed}% ({formatCurrencyBRL(monthEst)} de {formatCurrencyBRL(b.ceilingAmount)})
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOverLimit ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
