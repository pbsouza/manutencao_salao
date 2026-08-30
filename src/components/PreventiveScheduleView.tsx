import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  ExternalLink,
  FileCheck,
  Flame,
  HardHat,
  Info,
  Layers,
  Plus,
  Printer,
  Shield,
  ShieldAlert,
  Sparkles,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { OFFICIAL_PREVENTIVE_SHEETS, PROGRAM_GENERAL_INSTRUCTIONS } from '../data/preventiveProgramData';
import { PreventiveEventPeriod, PreventiveWorkSheet } from '../types';

export const PreventiveScheduleView: React.FC = () => {
  const {
    services,
    createServicesFromPreventiveSheet,
    createServicesFromPreventiveEvent,
    selectService,
    currentUser,
    hasRestrictedAccess,
  } = useMaintenance();

  const [selectedPeriod, setSelectedPeriod] = useState<PreventiveEventPeriod>('PRE_CELEBRACAO');
  const [selectedSheetForModal, setSelectedSheetForModal] = useState<PreventiveWorkSheet | null>(null);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const currentSheets = OFFICIAL_PREVENTIVE_SHEETS.filter((s) => s.eventPeriod === selectedPeriod);

  // Calculate progress for current period
  const existingPeriodServices = services.filter((s) => {
    return currentSheets.some((sheet) => s.title.toLowerCase().includes(sheet.category.toLowerCase()) || s.notes.includes(sheet.id));
  });

  const completedCount = existingPeriodServices.filter((s) => s.status === 'CONCLUÍDO').length;

  const handleLaunchSingleSheet = async (sheet: PreventiveWorkSheet) => {
    try {
      const created = await createServicesFromPreventiveSheet(sheet.id);
      setSuccessMessage(`Ficha "${sheet.title}" lançada no Kanban com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      selectService(created);
    } catch (err) {
      console.error('Erro ao criar serviço:', err);
    }
  };

  const handleLaunchAllForPeriod = async () => {
    if (
      !window.confirm(
        `Deseja gerar as ${currentSheets.length} fichas do período selecionado como tarefas no Kanban?`
      )
    ) {
      return;
    }

    setIsGeneratingBatch(true);
    try {
      const count = await createServicesFromPreventiveEvent(selectedPeriod);
      setSuccessMessage(`${count} Fichas de Trabalho do Programa 06/26 geradas no Kanban com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Erro ao gerar pacote preventivo:', err);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handlePrintSheet = (sheet: PreventiveWorkSheet) => {
    window.print();
  };

  return (
    <div id="preventive-schedule-view" className="p-4 sm:p-6 pb-32 sm:pb-36 md:pb-12 max-w-7xl mx-auto space-y-6">
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Programa de Manutenção Oficial (06/26)
            </h1>
            <span className="bg-amber-100 text-amber-800 font-extrabold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Salões do Reino
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Cronograma anual periódico, fichas oficiais de trabalho e orientações do Treinador de Manutenção (TM)
          </p>
        </div>

        {/* Global Action */}
        {hasRestrictedAccess && (
          <button
            onClick={handleLaunchAllForPeriod}
            disabled={isGeneratingBatch}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer self-start md:self-auto shrink-0"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>
              {isGeneratingBatch ? 'Lançando no Kanban...' : 'Lançar Todas as Fichas no Kanban'}
            </span>
          </button>
        )}
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 4 Period Cycle Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Pré-Celebração */}
        <button
          onClick={() => setSelectedPeriod('PRE_CELEBRACAO')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedPeriod === 'PRE_CELEBRACAO'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
              : 'bg-white text-gray-800 border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
          }`}
        >
          <div>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                selectedPeriod === 'PRE_CELEBRACAO' ? 'text-blue-200' : 'text-blue-600'
              }`}
            >
              Fevereiro a Março
            </span>
            <h3 className="font-black text-sm mt-0.5">Pré-Celebração</h3>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span
              className={`font-bold ${
                selectedPeriod === 'PRE_CELEBRACAO' ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              12 Fichas Oficiais
            </span>
            <ChevronRight
              className={`w-4 h-4 ${
                selectedPeriod === 'PRE_CELEBRACAO' ? 'text-white' : 'text-gray-400'
              }`}
            />
          </div>
        </button>

        {/* Junho */}
        <button
          onClick={() => setSelectedPeriod('JUNHO')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedPeriod === 'JUNHO'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-white text-gray-800 border-gray-200 hover:border-amber-300 hover:bg-amber-50/30'
          }`}
        >
          <div>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                selectedPeriod === 'JUNHO' ? 'text-amber-200' : 'text-amber-600'
              }`}
            >
              Mês de Junho
            </span>
            <h3 className="font-black text-sm mt-0.5">Revisão de Gastos & AC</h3>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span
              className={`font-bold ${
                selectedPeriod === 'JUNHO' ? 'text-amber-100' : 'text-gray-500'
              }`}
            >
              2 Atividades (S-27b)
            </span>
            <ChevronRight
              className={`w-4 h-4 ${
                selectedPeriod === 'JUNHO' ? 'text-white' : 'text-gray-400'
              }`}
            />
          </div>
        </button>

        {/* Pós-Congresso */}
        <button
          onClick={() => setSelectedPeriod('POS_CONGRESSO')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedPeriod === 'POS_CONGRESSO'
              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
              : 'bg-white text-gray-800 border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
          }`}
        >
          <div>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                selectedPeriod === 'POS_CONGRESSO' ? 'text-purple-200' : 'text-purple-600'
              }`}
            >
              Setembro a Outubro
            </span>
            <h3 className="font-black text-sm mt-0.5">Pós-Congresso</h3>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span
              className={`font-bold ${
                selectedPeriod === 'POS_CONGRESSO' ? 'text-purple-100' : 'text-gray-500'
              }`}
            >
              11 Fichas Oficiais
            </span>
            <ChevronRight
              className={`w-4 h-4 ${
                selectedPeriod === 'POS_CONGRESSO' ? 'text-white' : 'text-gray-400'
              }`}
            />
          </div>
        </button>

        {/* Bienal TM */}
        <button
          onClick={() => setSelectedPeriod('BIENAL_TM')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedPeriod === 'BIENAL_TM'
              ? 'bg-rose-700 text-white border-rose-700 shadow-md shadow-rose-600/20'
              : 'bg-white text-gray-800 border-gray-200 hover:border-rose-300 hover:bg-rose-50/30'
          }`}
        >
          <div>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                selectedPeriod === 'BIENAL_TM' ? 'text-rose-200' : 'text-rose-600'
              }`}
            >
              A cada 1 a 2 anos
            </span>
            <h3 className="font-black text-sm mt-0.5">Orientação do TM</h3>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span
              className={`font-bold ${
                selectedPeriod === 'BIENAL_TM' ? 'text-rose-100' : 'text-gray-500'
              }`}
            >
              2 Fichas (Alto Risco)
            </span>
            <ChevronRight
              className={`w-4 h-4 ${
                selectedPeriod === 'BIENAL_TM' ? 'text-white' : 'text-gray-400'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Official Directives Banner (from Page 2 of Program) */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
            Orientações Gerais do Programa de Manutenção (06/26)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Segurança & DC-85 */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
              <HardHat className="w-4 h-4" />
              <span>Segurança & Form. DC-85</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Trabalhos de alto risco (altura/espaço confinado) exigem o formulário <strong>DC-85 enviado ao TM com no mínimo 15 dias de antecedência</strong> (docs S-283 e DC-82). Serviços elétricos apenas com irmãos capacitados.
            </p>
          </div>

          {/* Pintura e Reparos */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 font-bold text-blue-300 mb-1">
              <Wrench className="w-4 h-4" />
              <span>Pintura & Reparos Inesperados</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              A pintura dura em média de <strong>3 a 5 anos</strong> e pode ser feita apenas nas áreas desgastadas. Problemas inesperados (lâmpadas, vazamentos) devem ser corrigidos imediatamente sem esperar os eventos anuais.
            </p>
          </div>

          {/* Alimentação & Registro JW Hub */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
              <Utensils className="w-4 h-4" />
              <span>Alimentação & JW Hub</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Os voluntários cuidam da própria alimentação (recursos da congregação não devem ser usados). Após o término das tarefas, o contato da manutenção <strong>registra o andamento e conclusão no JW Hub</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Work Sheets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>Fichas de Trabalho do Período</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md">
              {currentSheets.length} Fichas
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentSheets.map((sheet, index) => (
            <div
              key={sheet.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              {/* Sheet Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-800">
                    Ficha #{index + 1} • {sheet.periodLabel}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {sheet.requiresTM && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <HardHat className="w-3 h-3 text-rose-600" />
                        Requer TM & DC-85
                      </span>
                    )}
                    <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {sheet.frequency}
                    </span>
                  </div>
                </div>

                <h3 className="font-black text-base text-gray-900 leading-snug">{sheet.title}</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{sheet.description}</p>
              </div>

              {/* Sheet Checklist Items */}
              <div className="p-5 bg-gray-50/50 flex-1 space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-gray-500 text-[10px] uppercase tracking-wider mb-2">
                    Itens da Ficha de Verificação
                  </h4>
                  <ul className="space-y-1.5">
                    {sheet.guidelines.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Safety Warning box if exists */}
                {sheet.safetyInstructions && sheet.safetyInstructions.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Instruções de Segurança & Prevenção</span>
                    </div>
                    {sheet.safetyInstructions.map((s, idx) => (
                      <p key={idx} className="leading-snug">{s}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Sheet Actions */}
              <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => handlePrintSheet(sheet)}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-[11px]"
                  title="Imprimir ficha em papel para prancheta"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-500" />
                  <span>Imprimir Ficha</span>
                </button>

                {hasRestrictedAccess && (
                  <button
                    onClick={() => handleLaunchSingleSheet(sheet)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 text-[11px] shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lançar no Kanban</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
