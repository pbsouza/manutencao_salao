import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Edit2,
  FileCheck,
  Filter,
  Flame,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { ProblemTemplate, RiskLevel, YesNoEmpty } from '../types';
import { RISK_DEFINITIONS, SPREADSHEET_RISK_MAP } from '../utils/priority';
import { ConfirmModal } from './ConfirmModal';

export const ProblemTemplatesModal: React.FC = () => {
  const {
    isProblemTemplatesModalOpen,
    closeProblemTemplatesModal,
    problemTemplates,
    categories,
    members,
    locations,
    addProblemTemplate,
    updateProblemTemplate,
    deleteProblemTemplate,
    seedPreFixedData,
    batchCreateServicesFromTemplates,
    openNewServiceModal,
    firebaseUser,
    canEditServices,
  } = useMaintenance();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProblemTemplate | null>(null);

  // Form fields for new or editing template
  const [formData, setFormData] = useState<Partial<ProblemTemplate>>({
    category: 'Elétrica',
    problem: '',
    recommendedSolution: '',
    risk: 3,
    defaultResponsible: 'Coordenador de Manutenção',
    defaultGravity: 3,
    defaultUrgency: 3,
    defaultTrend: 3,
    highRiskOption: 'Não',
    needsTM: false,
  });

  // Batch creation fields
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchLocation, setBatchLocation] = useState('Auditório Principal');
  const [batchExecutor, setBatchExecutor] = useState('');
  const [batchSupervisor, setBatchSupervisor] = useState('');
  const [batchDueDate, setBatchDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [batchSuccess, setBatchSuccess] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  if (!isProblemTemplatesModalOpen) return null;

  const filteredTemplates = problemTemplates.filter((t) => {
    const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchQuery =
      (t.problem || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.recommendedSolution || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQuery;
  });

  const toggleSelectTemplate = (id: string) => {
    if (selectedTemplates.includes(id)) {
      setSelectedTemplates(selectedTemplates.filter((t) => t !== id));
    } else {
      setSelectedTemplates([...selectedTemplates, id]);
    }
  };

  const selectAllFiltered = () => {
    if (selectedTemplates.length === filteredTemplates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(filteredTemplates.map((t) => t.id));
    }
  };

  const handleEditClick = (tpl: ProblemTemplate) => {
    setEditingTemplate(tpl);
    setFormData({ ...tpl });
    setIsCreatingNew(true);
  };

  const handleCreateNewClick = () => {
    setEditingTemplate(null);
    setFormData({
      category: categories[0]?.name || 'Elétrica',
      problem: '',
      recommendedSolution: '',
      risk: 3,
      defaultResponsible: 'Coordenador de Manutenção',
      defaultGravity: 3,
      defaultUrgency: 3,
      defaultTrend: 3,
      highRiskOption: 'Não',
      needsTM: false,
    });
    setIsCreatingNew(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.problem?.trim()) return;

    if (editingTemplate) {
      await updateProblemTemplate(editingTemplate.id, {
        category: formData.category || 'Geral',
        problem: formData.problem,
        recommendedSolution: formData.recommendedSolution || '',
        risk: formData.risk as RiskLevel,
        defaultResponsible: formData.defaultResponsible || 'Coordenador de Manutenção',
        highRiskOption: formData.highRiskOption as YesNoEmpty,
        isHighRisk: formData.highRiskOption === 'Sim',
        needsTM: formData.needsTM || false,
      });
    } else {
      await addProblemTemplate({
        category: formData.category || 'Geral',
        problem: formData.problem,
        recommendedSolution: formData.recommendedSolution || '',
        risk: (formData.risk || 3) as RiskLevel,
        defaultResponsible: formData.defaultResponsible || 'Coordenador de Manutenção',
        defaultGravity: 3,
        defaultUrgency: 3,
        defaultTrend: 3,
        highRiskOption: (formData.highRiskOption as YesNoEmpty) || 'Não',
        isHighRisk: formData.highRiskOption === 'Sim',
        needsTM: formData.needsTM || false,
      });
    }

    setIsCreatingNew(false);
    setEditingTemplate(null);
  };

  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  const handleConfirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeletingTemplate(true);
    try {
      await deleteProblemTemplate(templateToDelete.id);
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Error deleting template:', err);
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  const handleConfirmSeedRestore = async () => {
    setIsSeeding(true);
    try {
      await seedPreFixedData(true);
      setIsConfirmRestoreOpen(false);
      setBatchSuccess('36 Problemas e Soluções Oficiais restaurados com sucesso!');
      setTimeout(() => setBatchSuccess(null), 2500);
    } catch (err) {
      console.error('Error restoring seed data:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExecuteBatch = async () => {
    if (selectedTemplates.length === 0) return;

    await batchCreateServicesFromTemplates(selectedTemplates, {
      location: batchLocation,
      executorName: batchExecutor,
      supervisorName: batchSupervisor,
      dueDate: batchDueDate,
    });

    setBatchSuccess(`${selectedTemplates.length} serviços gerados e designados com sucesso!`);
    setSelectedTemplates([]);
    setIsBatchOpen(false);
    setTimeout(() => setBatchSuccess(null), 3000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          id="problem-templates-modal-dialog"
          className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]"
        >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-lg backdrop-blur-xs">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Problemas Pré-fixados & Soluções Técnicas Recomendadas
              </h3>
              <p className="text-[11px] text-blue-100">
                Base oficial de 36 diagnósticos padronizados, riscos GUT e designação em massa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfirmRestoreOpen(true)}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              title="Restaurar base oficial de 36 problemas e soluções"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>Restaurar Base Oficial</span>
            </button>

            <button
              onClick={closeProblemTemplatesModal}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action bar & Filters */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar problema ou solução..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Todas as Categorias ({problemTemplates.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {selectedTemplates.length > 0 && (
              <button
                onClick={() => setIsBatchOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Designar {selectedTemplates.length} Selecionados</span>
              </button>
            )}

            <button
              onClick={handleCreateNewClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Modelo</span>
            </button>
          </div>
        </div>

        {batchSuccess && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{batchSuccess}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {/* Create or Edit Form */}
          {isCreatingNew && (
            <form
              onSubmit={handleSaveTemplate}
              className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                <span className="text-xs font-bold text-blue-900">
                  {editingTemplate ? 'Editar Modelo de Problema' : 'Cadastrar Novo Modelo Pré-fixado'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingTemplate(null);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Descrição do Problema *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.problem || ''}
                    onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                    placeholder="Ex: Disjuntor desarmando com frequência no quadro geral"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Solução Técnica Recomendada
                </label>
                <textarea
                  rows={2}
                  value={formData.recommendedSolution || ''}
                  onChange={(e) => setFormData({ ...formData, recommendedSolution: e.target.value })}
                  placeholder="Ex: Fazer balanceamento de cargas entre fases e reaperto dos bornes."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Risco Padronizado (1 a 5)
                  </label>
                  <select
                    value={formData.risk}
                    onChange={(e) => setFormData({ ...formData, risk: Number(e.target.value) as RiskLevel })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  >
                    <option value={1}>1 - Muito Baixo (GUT 1)</option>
                    <option value={2}>2 - Baixo (GUT 8)</option>
                    <option value={3}>3 - Médio (GUT 27)</option>
                    <option value={4}>4 - Alto (GUT 64)</option>
                    <option value={5}>5 - Crítico / Emergencial (GUT 125)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Trabalho em Alto Risco (Altura/Elétrica)
                  </label>
                  <select
                    value={formData.highRiskOption}
                    onChange={(e) => setFormData({ ...formData, highRiskOption: e.target.value as YesNoEmpty })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim (Exige EPI / DC-82)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Responsável Padrão
                  </label>
                  <input
                    type="text"
                    value={formData.defaultResponsible || ''}
                    onChange={(e) => setFormData({ ...formData, defaultResponsible: e.target.value })}
                    placeholder="Ex: Coordenador de Manutenção"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                >
                  {editingTemplate ? 'Atualizar Modelo' : 'Salvar Novo Modelo'}
                </button>
              </div>
            </form>
          )}

          {/* Batch Modal / Drawer */}
          {isBatchOpen && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-700" />
                  <span className="text-xs font-bold text-indigo-900">
                    Designar {selectedTemplates.length} Problemas em Massa
                  </span>
                </div>
                <button
                  onClick={() => setIsBatchOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Local do Salão
                  </label>
                  <select
                    value={batchLocation}
                    onChange={(e) => setBatchLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Executor Designado
                  </label>
                  <select
                    value={batchExecutor}
                    onChange={(e) => setBatchExecutor(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="">Padrão do Modelo</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Supervisor Designado
                  </label>
                  <select
                    value={batchSupervisor}
                    onChange={(e) => setBatchSupervisor(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="">Nenhum Supervisor</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Data Limite
                  </label>
                  <input
                    type="date"
                    value={batchDueDate}
                    onChange={(e) => setBatchDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsBatchOpen(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBatch}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Gerar & Designar {selectedTemplates.length} Serviços</span>
                </button>
              </div>
            </div>
          )}

          {/* Select all & Count bar */}
          <div className="flex items-center justify-between text-xs text-gray-600 px-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all-tpl"
                checked={selectedTemplates.length > 0 && selectedTemplates.length === filteredTemplates.length}
                onChange={selectAllFiltered}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="select-all-tpl" className="cursor-pointer font-bold">
                Selecionar Todos ({filteredTemplates.length})
              </label>
            </div>

            <span className="text-[11px] text-gray-500">
              {problemTemplates.length} problemas pré-fixados cadastrados
            </span>
          </div>

          {/* List of Templates */}
          <div className="grid grid-cols-1 gap-2.5">
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplates.includes(tpl.id);
              const riskInfo = RISK_DEFINITIONS[tpl.risk as RiskLevel] || RISK_DEFINITIONS[3];
              const spreadsheetInfo = SPREADSHEET_RISK_MAP[tpl.risk as RiskLevel] || SPREADSHEET_RISK_MAP[3];

              return (
                <div
                  key={tpl.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400'
                      : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTemplate(tpl.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {tpl.category.replace(/_/g, ' ')}
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${riskInfo.bgClass} ${riskInfo.textClass} border ${riskInfo.borderClass}`}>
                            {riskInfo.label} (GUT {spreadsheetInfo.score})
                          </span>

                          {tpl.highRiskOption === 'Sim' && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <Flame className="w-3 h-3 text-red-600" />
                              Alto Risco (EPI)
                            </span>
                          )}

                          {tpl.needsTM && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                              Consulta TM
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-gray-900 leading-snug">
                          {tpl.problem}
                        </h4>

                        {tpl.recommendedSolution && (
                          <div className="p-2 bg-gray-50 rounded border border-gray-200 text-[11px] text-gray-700 flex items-start gap-1.5">
                            <Wrench className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-gray-900">Solução Recomendada:</strong> {tpl.recommendedSolution}
                            </div>
                          </div>
                        )}

                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                          <span>Responsável Sugerido: <strong>{tpl.defaultResponsible || 'Coordenador'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                      <button
                        onClick={() => {
                          closeProblemTemplatesModal();
                          openNewServiceModal(tpl.category);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-bold cursor-pointer transition flex items-center gap-1"
                        title="Criar serviço a partir deste problema"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Criar Serviço</span>
                      </button>

                      <button
                        onClick={() => handleEditClick(tpl)}
                        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded cursor-pointer"
                        title="Editar modelo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {firebaseUser && canEditServices && (
                        <button
                          onClick={() => setTemplateToDelete({ id: tpl.id, name: tpl.problem })}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          title="Excluir modelo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>
            {selectedTemplates.length > 0
              ? `${selectedTemplates.length} problemas selecionados para designação`
              : 'Selecione um ou mais problemas para designar a um executor/supervisor em massa'}
          </span>

          <button
            onClick={closeProblemTemplatesModal}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>

    {/* Confirm Template Deletion Modal */}
    <ConfirmModal
      isOpen={Boolean(templateToDelete)}
      title="Excluir Modelo de Problema"
      message={`Tem certeza que deseja excluir permanentemente o modelo "${templateToDelete?.name}"?`}
      confirmLabel="Sim, Excluir Modelo"
      cancelLabel="Cancelar"
      confirmVariant="danger"
      isLoading={isDeletingTemplate}
      onConfirm={handleConfirmDeleteTemplate}
      onCancel={() => setTemplateToDelete(null)}
    />

    {/* Confirm Seed Restore Modal */}
    <ConfirmModal
      isOpen={isConfirmRestoreOpen}
      title="Restaurar Modelos Pré-fixados"
      message="Deseja carregar/restaurar os 36 problemas pré-fixados e soluções recomendadas oficiais da planilha?"
      confirmLabel="Sim, Restaurar Modelos"
      cancelLabel="Cancelar"
      confirmVariant="primary"
      isLoading={isSeeding}
      onConfirm={handleConfirmSeedRestore}
      onCancel={() => setIsConfirmRestoreOpen(false)}
    />
  </>
  );
};
