import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  HardHat,
  Printer,
  ShieldAlert,
  Tag,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { exportServicesToExcel, exportServicesToPDF } from '../utils/export';
import { formatCurrencyBRL, formatDateBR, isOverdue } from '../utils/priority';

type ReportPreset =
  | 'all'
  | 'high-priority'
  | 'overdue'
  | 'completed'
  | 'tm-required'
  | 'high-risk'
  | 'financial';

export const ReportsView: React.FC = () => {
  const { services, categories, members } = useMaintenance();

  const [preset, setPreset] = useState<ReportPreset>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Filtered dataset based on presets & selections
  let filtered = [...services];

  if (preset === 'high-priority') {
    filtered = filtered.filter((s) => s.priority === 'Alta' && s.status !== 'CANCELADO');
  } else if (preset === 'overdue') {
    filtered = filtered.filter((s) => isOverdue(s.dueDate, s.status));
  } else if (preset === 'completed') {
    filtered = filtered.filter((s) => s.status === 'CONCLUÍDO');
  } else if (preset === 'tm-required') {
    filtered = filtered.filter((s) => s.needsTM && s.status !== 'CANCELADO');
  } else if (preset === 'high-risk') {
    filtered = filtered.filter((s) => s.isHighRisk && s.status !== 'CANCELADO');
  } else if (preset === 'financial') {
    filtered = filtered.filter((s) => (s.estimatedCost || 0) > 0 || (s.actualCost || 0) > 0);
  }

  if (selectedCategory !== 'all') {
    filtered = filtered.filter((s) => s.category === selectedCategory);
  }

  if (selectedMonth !== 'all') {
    filtered = filtered.filter((s) => s.forecastMonth === selectedMonth);
  }

  // Aggregate totals
  const totalItems = filtered.length;
  const totalEstimated = filtered.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);
  const totalActual = filtered.reduce((acc, s) => acc + (s.actualCost || 0), 0);

  const getReportTitle = () => {
    switch (preset) {
      case 'high-priority':
        return 'Relatório de Serviços de Alta Prioridade';
      case 'overdue':
        return 'Relatório de Serviços Atrasados';
      case 'completed':
        return 'Relatório de Manutenções Concluídas';
      case 'tm-required':
        return 'Relatório de Serviços com Consulta ao TM';
      case 'high-risk':
        return 'Relatório de Serviços de Alto Risco & Segurança';
      case 'financial':
        return 'Relatório Financeiro de Gastos e Orçamentos';
      default:
        return 'Relatório Geral de Manutenção do Salão do Reino';
    }
  };

  const handleExportPDF = () => {
    exportServicesToPDF(filtered, getReportTitle());
  };

  const handleExportExcel = () => {
    exportServicesToExcel(filtered, `manutencao_salao_${preset}`);
  };

  return (
    <div id="reports-view-container" className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Central de Relatórios & Exportação
          </h2>
          <p className="text-[11px] text-gray-500">
            Gere relatórios customizados para reuniões de comissão e prestação de contas
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-2xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          <button
            id="btn-export-pdf"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Presets Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <button
          onClick={() => setPreset('all')}
          className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer shadow-2xs ${
            preset === 'all'
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className={`block text-[9px] uppercase font-semibold ${preset === 'all' ? 'text-blue-100' : 'text-gray-400'}`}>Todos</span>
          <span className="text-xs font-bold">Geral</span>
        </button>

        <button
          onClick={() => setPreset('high-priority')}
          className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer shadow-2xs ${
            preset === 'high-priority'
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className={`block text-[9px] uppercase font-semibold ${preset === 'high-priority' ? 'text-red-100' : 'text-gray-400'}`}>Urgentes</span>
          <span className="text-xs font-bold flex items-center gap-1">
            <Flame className="w-3 h-3" /> Alta Prioridade
          </span>
        </button>

        <button
          onClick={() => setPreset('overdue')}
          className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer shadow-2xs ${
            preset === 'overdue'
              ? 'bg-red-700 border-red-700 text-white'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className={`block text-[9px] uppercase font-semibold ${preset === 'overdue' ? 'text-red-100' : 'text-gray-400'}`}>Prazos</span>
          <span className="text-xs font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Atrasados
          </span>
        </button>

        <button
          onClick={() => setPreset('completed')}
          className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer shadow-2xs ${
            preset === 'completed'
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className={`block text-[9px] uppercase font-semibold ${preset === 'completed' ? 'text-emerald-100' : 'text-gray-400'}`}>Histórico</span>
          <span className="text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Concluídos
          </span>
        </button>

        <button
          onClick={() => setPreset('tm-required')}
          className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer shadow-2xs ${
            preset === 'tm-required'
              ? 'bg-blue-700 border-blue-700 text-white'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className={`block text-[9px] uppercase font-semibold ${preset === 'tm-required' ? 'text-blue-100' : 'text-gray-400'}`}>Supervisão</span>
          <span className="text-xs font-bold flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Consulta TM
          </span>
        </button>

        <button
          onClick={() => setPreset('high-risk')}
          className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer shadow-2xs ${
            preset === 'high-risk'
              ? 'bg-amber-600 border-amber-600 text-white'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className={`block text-[9px] uppercase font-semibold ${preset === 'high-risk' ? 'text-amber-100' : 'text-gray-400'}`}>Segurança</span>
          <span className="text-xs font-bold flex items-center gap-1">
            <HardHat className="w-3 h-3" /> Alto Risco
          </span>
        </button>

        <button
          onClick={() => setPreset('financial')}
          className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer shadow-2xs ${
            preset === 'financial'
              ? 'bg-teal-600 border-teal-600 text-white'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className={`block text-[9px] uppercase font-semibold ${preset === 'financial' ? 'text-teal-100' : 'text-gray-400'}`}>Finanças</span>
          <span className="text-xs font-bold flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Custos
          </span>
        </button>
      </div>

      {/* Secondary Controls Bar */}
      <div className="bg-white border border-gray-200 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-600 font-bold">Categoria:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-50 text-gray-900 text-xs rounded px-2.5 py-1 border border-gray-200 focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-600 font-bold">Mês Previsto:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-50 text-gray-900 text-xs rounded px-2.5 py-1 border border-gray-200 focus:outline-none"
            >
              <option value="all">Todos os Meses</option>
              <option value="2026-08">Agosto / 2026</option>
              <option value="2026-09">Setembro / 2026</option>
              <option value="2026-10">Outubro / 2026</option>
              <option value="2026-11">Novembro / 2026</option>
              <option value="2026-12">Dezembro / 2026</option>
            </select>
          </div>
        </div>

        {/* Totals Pill */}
        <div className="flex items-center gap-2.5 text-[11px]">
          <span className="text-gray-600 font-medium">
            <strong className="text-gray-900">{totalItems}</strong> registros
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600">
            Previsto: <strong className="text-amber-700">{formatCurrencyBRL(totalEstimated)}</strong>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600">
            Realizado: <strong className="text-emerald-700">{formatCurrencyBRL(totalActual)}</strong>
          </span>
        </div>
      </div>

      {/* Printable / Preview Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900">{getReportTitle()}</h3>
          <span className="text-[11px] text-gray-500 font-medium">
            Atualizado em {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-100 text-[10px] text-gray-500 uppercase font-bold border-b border-gray-200 tracking-tight">
              <tr>
                <th className="px-3 py-2">Cód</th>
                <th className="px-3 py-2">Problema / Serviço</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Local</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Prioridade (GUT)</th>
                <th className="px-3 py-2">Responsável</th>
                <th className="px-3 py-2">Prazo</th>
                <th className="px-3 py-2 text-right">Est. (R$)</th>
                <th className="px-3 py-2 text-right">Real. (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                    Nenhum registro encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const overdue = isOverdue(item.dueDate, item.status);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-3 py-2 font-mono font-bold text-gray-500 text-[10px]">{item.code}</td>
                      <td className="px-3 py-2 font-bold text-gray-900 max-w-xs truncate">
                        {item.title}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {item.category.replace(/_/g, ' ')}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{item.location}</td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            item.priority === 'Alta'
                              ? 'text-red-800 bg-red-100'
                              : item.priority === 'Média'
                              ? 'text-amber-800 bg-amber-100'
                              : 'text-emerald-800 bg-emerald-100'
                          }`}
                        >
                          {item.priority} ({item.priorityScore})
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-800 font-medium">{item.responsibleName}</td>
                      <td className="px-3 py-2">
                        <span className={overdue ? 'text-red-700 font-bold' : 'text-gray-600'}>
                          {formatDateBR(item.dueDate)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700">
                        {formatCurrencyBRL(item.estimatedCost)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-700 font-bold">
                        {formatCurrencyBRL(item.actualCost)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
