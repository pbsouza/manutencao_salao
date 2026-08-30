import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Flame,
  HardHat,
  HelpCircle,
  Layers,
  PauseCircle,
  PieChart,
  ShieldAlert,
  Tag,
  TrendingUp,
  Truck,
  Users,
  Zap,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { formatCurrencyBRL, formatMonthBR, isOverdue } from '../utils/priority';

export const DashboardView: React.FC = () => {
  const {
    services,
    categories,
    members,
    monthlyBudgets,
    setActiveTab,
    setFilterState,
    openNewServiceModal,
    selectService,
  } = useMaintenance();

  const total = services.length;
  const novos = services.filter((s) => s.status === 'NOVOS PROBLEMAS').length;
  const aAvaliar = services.filter((s) => s.status === 'A AVALIAR').length;
  const planejados = services.filter((s) => s.status === 'PLANEJADO').length;
  const emAndamento = services.filter((s) => s.status === 'EM ANDAMENTO').length;
  const aguardandoMaterial = services.filter((s) => s.status === 'AGUARDANDO MATERIAL').length;
  const aguardandoTerceiro = services.filter((s) => s.status === 'AGUARDANDO TERCEIRO').length;
  const concluidos = services.filter((s) => s.status === 'CONCLUÍDO').length;
  const cancelados = services.filter((s) => s.status === 'CANCELADO').length;

  const atrasados = services.filter((s) => isOverdue(s.dueDate, s.status)).length;
  const altaPrioridade = services.filter((s) => s.priority === 'Alta' && s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO').length;
  const mediaPrioridade = services.filter((s) => s.priority === 'Média' && s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO').length;
  const baixaPrioridade = services.filter((s) => s.priority === 'Baixa' && s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO').length;

  const needsTMList = services.filter((s) => s.needsTM && s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO');
  const highRiskList = services.filter((s) => s.isHighRisk && s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO');

  // Financial totals
  const totalEstCost = services.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);
  const totalAppCost = services.reduce((acc, s) => acc + (s.approvedCost || 0), 0);
  const totalActCost = services.reduce((acc, s) => acc + (s.actualCost || 0), 0);
  const servicesWithoutCost = services.filter((s) => !s.estimatedCost || s.estimatedCost === 0).length;

  // Monthly breakdown for August 2026 / Current month
  const currentMonthStr = '2026-08';
  const currentBudget = monthlyBudgets.find((b) => b.month === currentMonthStr)?.ceilingAmount || 3500;
  const currentMonthServices = services.filter((s) => s.forecastMonth === currentMonthStr);
  const currentMonthEst = currentMonthServices.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);
  const isBudgetExceeded = currentMonthEst > currentBudget;

  const handleDrilldownCategory = (catName: string) => {
    setFilterState((prev) => ({ ...prev, category: catName }));
    setActiveTab('kanban');
  };

  const handleDrilldownResponsible = (respName: string) => {
    setFilterState((prev) => ({ ...prev, responsible: respName }));
    setActiveTab('kanban');
  };

  return (
    <div id="dashboard-view-container" className="p-4 lg:p-6 pb-32 sm:pb-36 md:pb-12 space-y-5 max-w-7xl mx-auto">
      {/* Top High Priority / Alert Alert Banner */}
      {(atrasados > 0 || needsTMList.length > 0 || isBudgetExceeded) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {atrasados > 0 && (
            <div
              onClick={() => {
                setFilterState((prev) => ({ ...prev, onlyOverdue: true }));
                setActiveTab('kanban');
              }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-red-100/60 transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 text-red-700 rounded-md">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-900 uppercase tracking-tight">
                    {atrasados} Serviços Atrasados
                  </h4>
                  <p className="text-[10px] text-red-700">Clique para filtrar no Kanban</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-red-600" />
            </div>
          )}

          {needsTMList.length > 0 && (
            <div
              onClick={() => {
                setFilterState((prev) => ({ ...prev, onlyNeedsTM: true }));
                setActiveTab('kanban');
              }}
              className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-blue-100/60 transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-tight">
                    {needsTMList.length} Requerem Consulta TM
                  </h4>
                  <p className="text-[10px] text-blue-700">Verificar parecer do responsável</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
            </div>
          )}

          {isBudgetExceeded && (
            <div
              onClick={() => setActiveTab('budget')}
              className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-md">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-tight">
                    Orçamento Acima do Teto
                  </h4>
                  <p className="text-[10px] text-amber-700">
                    Est: {formatCurrencyBRL(currentMonthEst)} vs Teto: {formatCurrencyBRL(currentBudget)}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
            </div>
          )}
        </div>
      )}

      {/* KPI Overview Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-tight">
            Status das Demandas
          </h3>
          <span className="text-[11px] text-gray-500 font-medium">{total} problemas cadastrados</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Novos</span>
            <div className="text-xl font-black text-blue-600 mt-1">{novos}</div>
            <span className="text-[9px] text-gray-400">Na triagem</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">A Avaliar</span>
            <div className="text-xl font-black text-purple-600 mt-1">{aAvaliar}</div>
            <span className="text-[9px] text-gray-400">Vistoria</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Planejados</span>
            <div className="text-xl font-black text-indigo-600 mt-1">{planejados}</div>
            <span className="text-[9px] text-gray-400">Agendados</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Em Andamento</span>
            <div className="text-xl font-black text-amber-600 mt-1">{emAndamento}</div>
            <span className="text-[9px] text-gray-400">Executando</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Ag. Material</span>
            <div className="text-xl font-black text-orange-600 mt-1">{aguardandoMaterial}</div>
            <span className="text-[9px] text-gray-400">Compras</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Ag. Terceiro</span>
            <div className="text-xl font-black text-cyan-600 mt-1">{aguardandoTerceiro}</div>
            <span className="text-[9px] text-gray-400">Empresa ext.</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Concluídos</span>
            <div className="text-xl font-black text-emerald-600 mt-1">{concluidos}</div>
            <span className="text-[9px] text-gray-400">Finalizados</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Cancelados</span>
            <div className="text-xl font-black text-gray-400 mt-1">{cancelados}</div>
            <span className="text-[9px] text-gray-400">Descartados</span>
          </div>
        </div>
      </div>

      {/* Financial & Priority Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Financial KPI Card */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight">
                Resumo Financeiro
              </h4>
            </div>
            <span className="text-[10px] text-gray-500 font-mono font-bold bg-gray-100 px-1.5 py-0.5 rounded">2026</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
              <span className="text-xs text-gray-600 font-medium">Estimado Total</span>
              <span className="text-xs font-bold text-gray-900">{formatCurrencyBRL(totalEstCost)}</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
              <span className="text-xs text-gray-600 font-medium">Aprovado Total</span>
              <span className="text-xs font-bold text-blue-700">{formatCurrencyBRL(totalAppCost)}</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
              <span className="text-xs text-gray-600 font-medium">Realizado Total</span>
              <span className="text-xs font-bold text-emerald-700">{formatCurrencyBRL(totalActCost)}</span>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-gray-500">
              <span>Sem custo informado:</span>
              <span className="font-bold text-gray-700">{servicesWithoutCost} itens</span>
            </div>
          </div>
        </div>

        {/* Priority Matrix Distribution */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-600" />
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight">
                Matriz de Prioridade GUT
              </h4>
            </div>
          </div>

          <div className="space-y-2.5 pt-0.5">
            {/* Alta */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-red-700 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Alta (GUT ≥ 48)
                </span>
                <span className="font-bold text-gray-900">{altaPrioridade}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${(altaPrioridade / (total || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Média */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-amber-700 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Média (GUT 12-47)
                </span>
                <span className="font-bold text-gray-900">{mediaPrioridade}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${(mediaPrioridade / (total || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Baixa */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Baixa (GUT &lt; 12)
                </span>
                <span className="font-bold text-gray-900">{baixaPrioridade}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${(baixaPrioridade / (total || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-1 text-[10px] text-gray-400">
              * Calculado por: Gravidade × Urgência × Tendência (Planilha Oficial)
            </div>
          </div>
        </div>

        {/* High Risk & Safety Queue */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-orange-600" />
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight">
                Alto Risco & Segurança ({highRiskList.length})
              </h4>
            </div>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {highRiskList.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-5">
                Nenhum serviço ativo de alto risco.
              </p>
            ) : (
              highRiskList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => selectService(item)}
                  className="p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="text-xs font-bold text-gray-900 block truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {item.category.replace(/_/g, ' ')} • {item.responsibleName}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      item.safetyChecklistConfirmed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.safetyChecklistConfirmed ? 'EPIs OK' : 'Checklist Pendente'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Breakdown by Category and Responsible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Category */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight">
                Problemas por Categoria
              </h4>
            </div>
            <button
              onClick={() => setActiveTab('categories')}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
            >
              Ver Todas ({categories.length}) →
            </button>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {categories.map((cat) => {
              const count = services.filter((s) => s.category === cat.name).length;
              if (count === 0) return null;
              return (
                <div
                  key={cat.id}
                  onClick={() => handleDrilldownCategory(cat.name)}
                  className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color || '#3b82f6' }}
                    />
                    <span className="text-xs font-semibold text-gray-800">
                      {cat.name.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {count} {count === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Responsible */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight">
                Carga por Responsável
              </h4>
            </div>
            <button
              onClick={() => setActiveTab('responsibles')}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              Ver Equipe →
            </button>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {members.map((member) => {
              const activeCount = services.filter(
                (s) =>
                  s.responsibleName.toLowerCase() === member.name.toLowerCase() &&
                  s.status !== 'CONCLUÍDO' &&
                  s.status !== 'CANCELADO'
              ).length;
              const overdueMember = services.filter(
                (s) =>
                  s.responsibleName.toLowerCase() === member.name.toLowerCase() &&
                  isOverdue(s.dueDate, s.status)
              ).length;

              return (
                <div
                  key={member.id}
                  onClick={() => handleDrilldownResponsible(member.name)}
                  className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: member.avatarColor || '#3b82f6' }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">
                        {member.name}
                      </span>
                      <span className="text-[10px] text-gray-500">{member.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {overdueMember > 0 && (
                      <span className="text-[9px] font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded">
                        {overdueMember} atrasado
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {activeCount} ativas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
