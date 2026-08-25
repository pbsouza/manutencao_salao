import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle,
  DollarSign,
  Edit3,
  FileImage,
  HardHat,
  HelpCircle,
  Info,
  MapPin,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { isDummyPerson, useMaintenance } from '../context/MaintenanceContext';
import { Attachment, MonthName, RiskLevel, YesNoEmpty } from '../types';
import {
  calculateTMConsultation,
  formatCurrencyBRL,
  getSpreadsheetClassification,
  MONTH_NAMES,
  RISK_DEFINITIONS,
} from '../utils/priority';

export const NewServiceModal: React.FC = () => {
  const {
    isNewServiceModalOpen,
    closeNewServiceModal,
    addService,
    addProblemTemplate,
    categories,
    problemTemplates,
    locations,
    members,
    currentUser,
    preselectedCategoryForNew,
    getBudgetForMonth,
  } = useMaintenance();

  // Form State
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProblem, setSelectedProblem] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [recommendedSolution, setRecommendedSolution] = useState('');
  const [notes, setNotes] = useState('');

  // Risk (1 a 5) & Automatic Spreadsheet Classification
  const [risk, setRisk] = useState<RiskLevel>(3);

  // High Risk & TM
  const [highRiskWork, setHighRiskWork] = useState<YesNoEmpty>('Não');

  // Responsibility, Execution & Supervision
  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleNames, setResponsibleNames] = useState<string[]>([]);
  const [executorName, setExecutorName] = useState('');
  const [executorNames, setExecutorNames] = useState<string[]>([]);
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorNames, setSupervisorNames] = useState<string[]>([]);
  const [team, setTeam] = useState('');
  const [identifiedDate, setIdentifiedDate] = useState('');
  const [forecastMonth, setForecastMonth] = useState('');
  const [executionMonthName, setExecutionMonthName] = useState<MonthName>('Agosto');
  const [dueDate, setDueDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | string>('');

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Manual Problem Entry Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualProblemText, setManualProblemText] = useState('');
  const [manualSolutionText, setManualSolutionText] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualRisk, setManualRisk] = useState<RiskLevel>(3);
  const [manualHighRisk, setManualHighRisk] = useState<YesNoEmpty>('Não');
  const [saveAsTemplate, setSaveAsTemplate] = useState(true);

  // Classification derived directly from Risk
  const classification = getSpreadsheetClassification(risk);

  // TM Consultation derived from High Risk + Estimated Cost
  const numCost = Number(estimatedCost) || 0;
  const currentMonthBudget = getBudgetForMonth(forecastMonth);
  const ceiling = currentMonthBudget ? currentMonthBudget.ceilingAmount : 0;
  const tmCalculation = calculateTMConsultation(highRiskWork, numCost, ceiling);

  // Sorted members list
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  // Initialize dates and default category on open
  useEffect(() => {
    if (isNewServiceModalOpen) {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const initialCat = preselectedCategoryForNew || categories[0]?.name || 'Elétrica';
      const curMonth = today.substring(0, 7);
      const mIdx = parseInt(curMonth.split('-')[1] || '1', 10) - 1;

      setIdentifiedDate(today);
      setForecastMonth(curMonth);
      setExecutionMonthName(mIdx >= 0 && mIdx < 12 ? MONTH_NAMES[mIdx] : 'Agosto');
      setDueDate(nextWeek);
      setSelectedCategory(initialCat);
      setLocation(locations[0]?.name || 'Auditório Principal');
      setSupervisorName('');
      setSupervisorNames([]);
      setTeam('Comissão de Manutenção');
      setTitle('');
      setSelectedProblem('');
      setDescription('');
      setRecommendedSolution('');
      setNotes('');
      setEstimatedCost('');
      setRisk(3);
      setHighRiskWork('Não');
      setAttachments([]);
      setIsManualModalOpen(false);

      const catObj = categories.find((c) => c.name === initialCat);
      if (catObj?.defaultResponsibleName && !isDummyPerson(catObj.defaultResponsibleName)) {
        setResponsibleName(catObj.defaultResponsibleName);
        setResponsibleNames([catObj.defaultResponsibleName]);
        setExecutorName(catObj.defaultResponsibleName);
        setExecutorNames([catObj.defaultResponsibleName]);
      } else {
        const defaultName = currentUser?.name || 'Pedro Belchior';
        setResponsibleName(defaultName);
        setResponsibleNames([defaultName]);
        setExecutorName(defaultName);
        setExecutorNames([defaultName]);
      }
    }
  }, [isNewServiceModalOpen, preselectedCategoryForNew, currentUser?.name]);

  const addResponsibleChip = (name: string) => {
    if (!name) return;
    if (!responsibleNames.includes(name)) {
      const updated = [...responsibleNames, name];
      setResponsibleNames(updated);
      setResponsibleName(updated.join(', '));
      if (executorNames.length === 0) {
        setExecutorNames(updated);
        setExecutorName(updated.join(', '));
      }
    }
  };

  const removeResponsibleChip = (nameToRemove: string) => {
    if (responsibleNames.length <= 1) return;
    const updated = responsibleNames.filter((n) => n !== nameToRemove);
    setResponsibleNames(updated);
    setResponsibleName(updated.join(', '));
  };

  const addExecutorChip = (name: string) => {
    if (!name) return;
    if (!executorNames.includes(name)) {
      const updated = [...executorNames, name];
      setExecutorNames(updated);
      setExecutorName(updated.join(', '));
    }
  };

  const removeExecutorChip = (nameToRemove: string) => {
    if (executorNames.length <= 1) return;
    const updated = executorNames.filter((n) => n !== nameToRemove);
    setExecutorNames(updated);
    setExecutorName(updated.join(', '));
  };

  const addSupervisorChip = (name: string) => {
    if (!name) return;
    if (!supervisorNames.includes(name)) {
      const updated = [...supervisorNames, name];
      setSupervisorNames(updated);
      setSupervisorName(updated.join(', '));
    }
  };

  const removeSupervisorChip = (nameToRemove: string) => {
    const updated = supervisorNames.filter((n) => n !== nameToRemove);
    setSupervisorNames(updated);
    setSupervisorName(updated.join(', '));
  };

  // When category changes, filter problems and set default responsible
  const categoryProblems = problemTemplates.filter((p) => p.category === selectedCategory);

  const handleCategoryChange = (newCat: string) => {
    setSelectedCategory(newCat);
    setSelectedProblem('');
    setRecommendedSolution('');

    const catObj = categories.find((c) => c.name === newCat);
    if (catObj && catObj.defaultResponsibleName && !isDummyPerson(catObj.defaultResponsibleName)) {
      setResponsibleName(catObj.defaultResponsibleName);
      setResponsibleNames([catObj.defaultResponsibleName]);
      setExecutorName(catObj.defaultResponsibleName);
      setExecutorNames([catObj.defaultResponsibleName]);
    }
  };

  // Open manual problem modal
  const openManualProblemModal = () => {
    setManualProblemText(title || selectedProblem || '');
    setManualSolutionText(recommendedSolution || '');
    setManualCategory(selectedCategory || categories[0]?.name || 'Geral');
    setManualRisk(risk);
    setManualHighRisk(highRiskWork);
    setSaveAsTemplate(true);
    setIsManualModalOpen(true);
  };

  // When problem is selected from the category list -> auto fill or trigger modal!
  const handleProblemChange = (probText: string) => {
    if (probText === '__MANUAL__') {
      openManualProblemModal();
      return;
    }

    setSelectedProblem(probText);
    const template = problemTemplates.find(
      (p) => p.category === selectedCategory && p.problem === probText
    );

    if (template) {
      setTitle(template.problem);
      setRecommendedSolution(template.recommendedSolution);
      setRisk(template.risk);
      setHighRiskWork(template.highRiskOption || (template.isHighRisk ? 'Sim' : 'Não'));
      if (template.defaultResponsible && !isDummyPerson(template.defaultResponsible)) {
        setResponsibleName(template.defaultResponsible);
        setResponsibleNames([template.defaultResponsible]);
        setExecutorName(template.defaultResponsible);
        setExecutorNames([template.defaultResponsible]);
      }
    }
  };

  // Save manual problem from the modal
  const handleSaveManualProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProblemText.trim()) {
      alert('Por favor, informe a descrição do problema.');
      return;
    }

    const probName = manualProblemText.trim();
    const solText = manualSolutionText.trim();
    const chosenCat = manualCategory || selectedCategory || 'Geral';

    setTitle(probName);
    setSelectedProblem(probName);
    setRecommendedSolution(solText);
    setSelectedCategory(chosenCat);
    setRisk(manualRisk);
    setHighRiskWork(manualHighRisk);

    if (saveAsTemplate) {
      try {
        const manualClassification = getSpreadsheetClassification(manualRisk);
        await addProblemTemplate({
          category: chosenCat,
          problem: probName,
          recommendedSolution: solText,
          risk: manualRisk,
          gravity: manualClassification.gravityLevel,
          urgency: manualClassification.urgencyLevel,
          trend: manualClassification.trendLevel,
          priority: manualClassification.priority,
          priorityScore: manualClassification.score,
          highRiskOption: manualHighRisk,
          isHighRisk: manualHighRisk === 'Sim',
          defaultResponsible: responsibleName || currentUser.name,
        });
      } catch (err) {
        console.error('Error saving manual problem to templates:', err);
      }
    }

    setIsManualModalOpen(false);
  };

  // Handle Photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const newAtt: Attachment = {
          id: `att-${Date.now()}-${Math.random()}`,
          name: file.name,
          url: result,
          type: 'image',
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser.name,
        };
        setAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, informe o título do problema.');
      return;
    }

    const finalResponsibleNames =
      responsibleNames.length > 0
        ? responsibleNames
        : responsibleName
        ? [responsibleName]
        : [currentUser.name];

    const finalResponsibleIds = finalResponsibleNames.map(
      (rn) => members.find((m) => m.name === rn)?.id || currentUser.id
    );

    const finalExecutorNames =
      executorNames.length > 0
        ? executorNames
        : executorName
        ? [executorName]
        : finalResponsibleNames;

    const finalExecutorIds = finalExecutorNames.map(
      (en) => members.find((m) => m.name === en)?.id || ''
    ).filter(Boolean);

    const finalSupervisorNames =
      supervisorNames.length > 0
        ? supervisorNames
        : supervisorName
        ? [supervisorName]
        : [];

    const finalSupervisorIds = finalSupervisorNames.map(
      (sn) => members.find((m) => m.name === sn)?.id || ''
    ).filter(Boolean);

    await addService({
      title: title.trim(),
      category: selectedCategory || (categories[0]?.name ?? 'Geral'),
      problem: selectedProblem || title,
      description: description.trim(),
      location: location || (locations[0]?.name ?? 'Auditório Principal'),
      recommendedSolution: recommendedSolution.trim(),
      risk,
      responsibleId: finalResponsibleIds[0] || currentUser.id,
      responsibleName: finalResponsibleNames.join(', '),
      responsibleIds: finalResponsibleIds,
      responsibleNames: finalResponsibleNames,
      executorName: finalExecutorNames.join(', '),
      executorIds: finalExecutorIds,
      executorNames: finalExecutorNames,
      supervisorId: finalSupervisorIds[0] || '',
      supervisorName: finalSupervisorNames.join(', '),
      supervisorIds: finalSupervisorIds,
      supervisorNames: finalSupervisorNames,
      team,
      identifiedDate,
      forecastMonth,
      executionMonthName,
      dueDate,
      status: 'NOVOS PROBLEMAS',
      estimatedCost: numCost,
      highRiskWork,
      isHighRisk: highRiskWork === 'Sim',
      needsTMOption: tmCalculation.needsTMOption,
      needsTM: tmCalculation.needsTM,
      notes: notes.trim(),
      attachments,
    });

    closeNewServiceModal();
  };

  if (!isNewServiceModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Registrar Serviço de Manutenção</h2>
              <p className="text-xs text-slate-500">
                Cadastro estruturado no Firebase com atribuição de Executor e Supervisor
              </p>
            </div>
          </div>
          <button
            onClick={closeNewServiceModal}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-2 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-700">
          {/* Step 1 & 2: Categoria e Problema Cadastrado */}
          <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4" /> 1. Categoria & 2. Problema Cadastrado
              </span>
              <span className="text-xs text-slate-500">
                {categoryProblems.length} problema(s) cadastrado(s) nesta categoria
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  required
                >
                  {categories.length === 0 ? (
                    <option value="Geral">Geral</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Problem Template Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Problema Cadastrado (Tabela)
                  </label>
                  <button
                    type="button"
                    onClick={openManualProblemModal}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                    title="Abrir caixa modal para digitar o problema manualmente"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Digitar Manualmente</span>
                  </button>
                </div>
                <select
                  value={selectedProblem}
                  onChange={(e) => handleProblemChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                >
                  <option value="">-- Selecione o problema cadastrado --</option>
                  <option value="__MANUAL__" className="font-bold text-blue-700 bg-blue-50">
                    ✏️ Digitar problema manualmente... (Abrir Modal)
                  </option>
                  <optgroup label={`Problemas Cadastrados (${selectedCategory})`}>
                    {categoryProblems.map((prob) => (
                      <option key={prob.id} value={prob.problem}>
                        {prob.problem}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Title / Specific Problem */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título do Serviço / Descrição do Problema <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Tomada do púlpito sem energia ou goteira sobre a fileira 8"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Step 3: Solução Recomendada */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>3. Solução Recomendada</span>
              <span className="text-xs text-slate-400 font-normal">Preenchida automaticamente da base técnica</span>
            </label>
            <textarea
              rows={2}
              value={recommendedSolution}
              onChange={(e) => setRecommendedSolution(e.target.value)}
              placeholder="Procedimento técnico recomendado para sanar o problema com segurança..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Step 4 & 5: Nível de Risco & Tabela Determinística GUT / Prioridade */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                4. Avaliação de Risco & 5. Matriz GUT / Prioridade (Planilha Oficial)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Prioridade Calculada:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    classification.priority === 'Alta'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : classification.priority === 'Média'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {classification.priority} (Score: {classification.score})
                </span>
              </div>
            </div>

            {/* Risk Selection Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Selecione o Nível de Risco (1 a 5)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as RiskLevel[]).map((r) => {
                  const rDef = RISK_DEFINITIONS[r];
                  const isSelected = risk === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRisk(r)}
                      className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? `${rDef.bgClass} ${rDef.borderClass} ring-2 ring-blue-500 shadow-xs`
                          : 'bg-white border-slate-200 hover:bg-slate-100/80 text-slate-600'
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-900">{r}</span>
                      <span className="text-[11px] leading-tight font-medium text-slate-600">{rDef.label.split('—')[1] || ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Readonly Deterministic Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Gravidade (G):</span>
                <span className="font-semibold text-slate-800">
                  Nível {classification.gravityLevel} — {classification.gravityText}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Urgência (U):</span>
                <span className="font-semibold text-slate-800">
                  Nível {classification.urgencyLevel} — {classification.urgencyText}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Tendência (T):</span>
                <span className="font-semibold text-slate-800">
                  Nível {classification.trendLevel} — {classification.trendText}
                </span>
              </div>
            </div>
          </div>

          {/* Step 6, 7 & 8: Alto Risco, Custos e Consulta ao TM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Alto Risco (DC-82) */}
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
              <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                <HardHat className="w-4 h-4 text-amber-600" />
                6. Trabalho de Alto Risco?
              </label>
              <p className="text-[11px] text-amber-700/80 mb-2">
                Altura &gt;2m, QGBT, telhado, eletricidade primária ou gás (Diretriz DC-82).
              </p>
              <select
                value={highRiskWork}
                onChange={(e) => setHighRiskWork(e.target.value as YesNoEmpty)}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
              >
                <option value="Não">Não (Trabalho comum / solo)</option>
                <option value="Sim">Sim (Alto risco / EPI obrigatório)</option>
                <option value="">(Em branco / A definir)</option>
              </select>
            </div>

            {/* Custo Estimado */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                7. Custo Estimado (R$)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Teto do mês ({forecastMonth}): {formatCurrencyBRL(ceiling)}
              </p>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Consulta ao TM (Calculado) */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                tmCalculation.needsTM
                  ? 'bg-red-50/80 border-red-200'
                  : 'bg-emerald-50/80 border-emerald-200'
              }`}
            >
              <div>
                <label
                  className={`block text-xs font-bold mb-1 flex items-center gap-1 ${
                    tmCalculation.needsTM ? 'text-red-900' : 'text-emerald-900'
                  }`}
                >
                  <ShieldAlert
                    className={`w-4 h-4 ${
                      tmCalculation.needsTM ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  />
                  8. Precisa Consultar o TM?
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      tmCalculation.needsTM
                        ? 'bg-red-600 text-white shadow-xs'
                        : tmCalculation.needsTMOption === 'Não'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tmCalculation.needsTMOption || 'A definir'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 font-medium">
                {tmCalculation.reason}
              </p>
            </div>
          </div>

          {/* Step 9, 10 & 11: Responsáveis, Executores e Supervisores Designados */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>9. Responsabilidade, Execução e Supervisão</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Você pode adicionar mais de um responsável ou executor
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Responsáveis Gerais */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Responsáveis da Área ({responsibleNames.length})
                  </span>
                </label>

                {/* Selected chips */}
                <div className="flex flex-wrap gap-1 min-h-[32px] items-center p-1.5 bg-slate-50 rounded-md border border-slate-200">
                  {responsibleNames.map((rn) => (
                    <span
                      key={rn}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-xs font-medium"
                    >
                      {rn}
                      {responsibleNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeResponsibleChip(rn)}
                          className="text-blue-600 hover:text-red-600 cursor-pointer"
                          title="Remover este responsável"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {members.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addResponsibleChip(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">+ Adicionar Responsável...</option>
                    {sortedMembers
                      .filter((m) => !responsibleNames.includes(m.name))
                      .map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Executores Designados */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Executores Designados ({executorNames.length})
                  </span>
                </label>

                {/* Selected chips */}
                <div className="flex flex-wrap gap-1 min-h-[32px] items-center p-1.5 bg-slate-50 rounded-md border border-slate-200">
                  {executorNames.map((en) => (
                    <span
                      key={en}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium"
                    >
                      {en}
                      {executorNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExecutorChip(en)}
                          className="text-emerald-700 hover:text-red-600 cursor-pointer"
                          title="Remover este executor"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {members.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addExecutorChip(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">+ Adicionar Executor...</option>
                    {sortedMembers
                      .filter((m) => !executorNames.includes(m.name))
                      .map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Supervisores Designados */}
              <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-200 shadow-2xs space-y-2">
                <label className="block text-xs font-bold text-indigo-900 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Supervisores ({supervisorNames.length})
                  </span>
                </label>

                {/* Selected chips */}
                <div className="flex flex-wrap gap-1 min-h-[32px] items-center p-1.5 bg-white rounded-md border border-indigo-100">
                  {supervisorNames.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">Nenhum supervisor designado</span>
                  ) : (
                    supervisorNames.map((sn) => (
                      <span
                        key={sn}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-md text-xs font-medium"
                      >
                        {sn}
                        <button
                          type="button"
                          onClick={() => removeSupervisorChip(sn)}
                          className="text-indigo-700 hover:text-red-600 cursor-pointer"
                          title="Remover este supervisor"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {members.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addSupervisorChip(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 font-semibold text-indigo-950"
                  >
                    <option value="">+ Designar Supervisor...</option>
                    {sortedMembers
                      .filter((m) => !supervisorNames.includes(m.name))
                      .map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Planejamento de Datas e Local */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Local no Salão
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {locations.length === 0 ? (
                  <option value="Auditório Principal">Auditório Principal</option>
                ) : (
                  locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mês de Execução
              </label>
              <select
                value={executionMonthName}
                onChange={(e) => {
                  const mName = e.target.value as MonthName;
                  setExecutionMonthName(mName);
                  const mIdx = MONTH_NAMES.indexOf(mName) + 1;
                  const curYear = new Date().getFullYear();
                  setForecastMonth(`${curYear}-${String(mIdx).padStart(2, '0')}`);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>
                    {m} / {new Date().getFullYear()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prazo Limite (Vencimento)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Observações Adicionais */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações e Detalhes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais, marca de peças, histórico prévio..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fotos e Anexos */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Fotos do Problema (Opcional)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 transition">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Adicionar Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-xs"
                >
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              * O serviço será gravado diretamente no <span className="font-semibold text-blue-700">Firebase Firestore</span>.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeNewServiceModal}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                Registrar no Firestore
              </button>
            </div>
          </div>
        </form>

        {/* Modal para Digitar Problema Manualmente */}
        {isManualModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Digitar Problema Manualmente</h3>
                    <p className="text-[11px] text-blue-100">
                      Cadastre e preencha as informações do serviço
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveManualProblem} className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Category select inside manual modal */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Categoria do Problema
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Problem Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Descrição do Problema / Serviço <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualProblemText}
                    onChange={(e) => setManualProblemText(e.target.value)}
                    placeholder="Ex: Refletor do estacionamento queimado / Troca de lâmpadas"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                {/* Recommended Solution */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Solução Técnica Recomendada
                  </label>
                  <textarea
                    rows={3}
                    value={manualSolutionText}
                    onChange={(e) => setManualSolutionText(e.target.value)}
                    placeholder="Ex: Desligar disjuntor geral, utilizar escada com apoio duplo, substituir por refletor LED 50W IP65..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Risk Level Selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Nível de Risco (1 a 5 - Matriz GUT)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as RiskLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setManualRisk(lvl)}
                        className={`p-2 text-center rounded-lg border transition font-bold cursor-pointer ${
                          manualRisk === lvl
                            ? lvl >= 4
                              ? 'bg-red-600 text-white border-red-600 shadow-xs'
                              : lvl === 3
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-sm">{lvl}</div>
                        <div className="text-[9px] uppercase tracking-tighter">
                          {lvl === 5 ? 'Extremo' : lvl === 4 ? 'Alto' : lvl === 3 ? 'Médio' : lvl === 2 ? 'Baixo' : 'Mínimo'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* High Risk Work */}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-900 block text-xs">Trabalho de Alto Risco?</span>
                      <span className="text-[10px] text-amber-700">Altura &gt; 2m, eletricidade viva, telhado, etc.</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(['Não', 'Sim'] as YesNoEmpty[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setManualHighRisk(opt)}
                        className={`px-3 py-1 rounded text-xs font-bold cursor-pointer transition ${
                          manualHighRisk === opt
                            ? opt === 'Sim'
                              ? 'bg-red-600 text-white'
                              : 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save to Templates Checkbox */}
                <label className="flex items-start gap-2.5 p-3 bg-blue-50/60 rounded-lg border border-blue-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-blue-900 block">
                      Salvar também como modelo reutilizável no catálogo
                    </span>
                    <span className="text-[11px] text-blue-700">
                      Ficará disponível na lista de problemas cadastrados desta categoria para futuros chamados.
                    </span>
                  </div>
                </label>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar e Preencher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
