import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileImage,
  FileText,
  HardHat,
  History,
  Info,
  Loader2,
  MapPin,
  Maximize2,
  Receipt,
  Save,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { isDummyPerson, useMaintenance } from '../context/MaintenanceContext';
import {
  Attachment,
  MonthName,
  PhotoStage,
  RiskLevel,
  ServiceItem,
  ServiceStatus,
  YesNoEmpty,
} from '../types';
import {
  calculateTMConsultation,
  formatCurrencyBRL,
  formatDateBR,
  getSpreadsheetClassification,
  isOverdue,
  MONTH_NAMES,
  RISK_DEFINITIONS,
} from '../utils/priority';
import { formatBytes, optimizePhoto } from '../utils/imageOptimizer';
import { downloadCalendarEvent, shareServiceOnWhatsApp } from '../utils/shareAndCalendar';
import { KANBAN_COLUMNS } from './KanbanBoard';
import { ConfirmModal } from './ConfirmModal';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
}

interface ServiceDetailModalContentProps {
  service: ServiceItem;
  onClose: () => void;
}

const ServiceDetailModalContent: React.FC<ServiceDetailModalContentProps> = ({
  service,
  onClose,
}) => {
  const {
    updateService,
    deleteService,
    categories,
    locations,
    members,
    currentUser,
    firebaseUser,
    canEditServices,
    isAdmin,
    setIsAuthModalOpen,
    getBudgetForMonth,
  } = useMaintenance();

  const [activeSubTab, setActiveSubTab] = useState<'details' | 'history' | 'safety' | 'photos'>('details');

  // Multi-person initializers
  const initialResponsibleNames: string[] =
    service.responsibleNames && service.responsibleNames.length > 0
      ? service.responsibleNames
      : service.responsibleName && !isDummyPerson(service.responsibleName)
      ? service.responsibleName.split(',').map((s) => s.trim()).filter(Boolean)
      : [currentUser.name || 'Pedro Belchior'];

  const initialExecutorNames: string[] =
    service.executorNames && service.executorNames.length > 0
      ? service.executorNames
      : service.executorName && !isDummyPerson(service.executorName)
      ? service.executorName.split(',').map((s) => s.trim()).filter(Boolean)
      : initialResponsibleNames;

  const initialSupervisorNames: string[] =
    service.supervisorNames && service.supervisorNames.length > 0
      ? service.supervisorNames
      : service.supervisorName && !isDummyPerson(service.supervisorName)
      ? service.supervisorName.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  // Editable fields
  const [title, setTitle] = useState(service.title);
  const [category, setCategory] = useState(service.category);
  const [problem, setProblem] = useState(service.problem);
  const [location, setLocation] = useState(service.location);
  const [recommendedSolution, setRecommendedSolution] = useState(service.recommendedSolution);
  const [description, setDescription] = useState(service.description);
  const [notes, setNotes] = useState(service.notes);
  const [status, setStatus] = useState<ServiceStatus>(service.status);
  const [responsibleNames, setResponsibleNames] = useState<string[]>(initialResponsibleNames);
  const [responsibleName, setResponsibleName] = useState(initialResponsibleNames.join(', '));
  const [executorNames, setExecutorNames] = useState<string[]>(initialExecutorNames);
  const [executorName, setExecutorName] = useState(initialExecutorNames.join(', '));
  const [supervisorNames, setSupervisorNames] = useState<string[]>(initialSupervisorNames);
  const [supervisorName, setSupervisorName] = useState(initialSupervisorNames.join(', '));
  const [team, setTeam] = useState(service.team || '');
  const [dueDate, setDueDate] = useState(service.dueDate || '');
  const [forecastMonth, setForecastMonth] = useState(service.forecastMonth || '');
  const [executionMonthName, setExecutionMonthName] = useState<MonthName>(
    service.executionMonthName || 'Agosto'
  );

  // Financials
  const [estimatedCost, setEstimatedCost] = useState(service.estimatedCost);
  const [approvedCost, setApprovedCost] = useState(service.approvedCost);
  const [actualCost, setActualCost] = useState(service.actualCost);

  // Risk & Spreadsheet Deterministic Classification
  const [risk, setRisk] = useState<RiskLevel>(service.risk || 3);

  // TM & Safety
  const [highRiskWork, setHighRiskWork] = useState<YesNoEmpty>(
    service.highRiskWork || (service.isHighRisk ? 'Sim' : 'Não')
  );
  const [tmStatus, setTmStatus] = useState(service.tmStatus || 'Não iniciado');
  const [safetyConfirmed, setSafetyConfirmed] = useState(service.safetyChecklistConfirmed || false);

  // Attachments & Before/After/Receipt management
  const [attachments, setAttachments] = useState<Attachment[]>(service.attachments || []);
  const [uploadPhotoStage, setUploadPhotoStage] = useState<PhotoStage>('general');
  const [photoStageFilter, setPhotoStageFilter] = useState<'all' | PhotoStage>('all');
  const [isOptimizingPhotos, setIsOptimizingPhotos] = useState(false);
  const [optimizingProgress, setOptimizingProgress] = useState({ current: 0, total: 0 });
  const [previewPhoto, setPreviewPhoto] = useState<Attachment | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<Attachment | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Security check: Only logged-in Administrators can delete photos
  const canDeletePhoto = Boolean(firebaseUser && isAdmin);

  const overdue = isOverdue(dueDate, status);

  // Sorted members list for fast selection
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  // Dynamic calculations
  const classification = getSpreadsheetClassification(risk);
  const monthBudget = getBudgetForMonth(forecastMonth);
  const ceiling = monthBudget ? monthBudget.ceilingAmount : 0;
  const numEstimated = Number(estimatedCost) || 0;
  const tmCalculation = calculateTMConsultation(highRiskWork, numEstimated, ceiling);

  const addResponsibleChip = (name: string) => {
    if (!name || !canEditServices) return;
    if (!responsibleNames.includes(name)) {
      const updated = [...responsibleNames, name];
      setResponsibleNames(updated);
      setResponsibleName(updated.join(', '));
    }
  };

  const removeResponsibleChip = (nameToRemove: string) => {
    if (!canEditServices || responsibleNames.length <= 1) return;
    const updated = responsibleNames.filter((n) => n !== nameToRemove);
    setResponsibleNames(updated);
    setResponsibleName(updated.join(', '));
  };

  const addExecutorChip = (name: string) => {
    if (!name || !canEditServices) return;
    if (!executorNames.includes(name)) {
      const updated = [...executorNames, name];
      setExecutorNames(updated);
      setExecutorName(updated.join(', '));
    }
  };

  const removeExecutorChip = (nameToRemove: string) => {
    if (!canEditServices || executorNames.length <= 1) return;
    const updated = executorNames.filter((n) => n !== nameToRemove);
    setExecutorNames(updated);
    setExecutorName(updated.join(', '));
  };

  const addSupervisorChip = (name: string) => {
    if (!name || !canEditServices) return;
    if (!supervisorNames.includes(name)) {
      const updated = [...supervisorNames, name];
      setSupervisorNames(updated);
      setSupervisorName(updated.join(', '));
    }
  };

  const removeSupervisorChip = (nameToRemove: string) => {
    if (!canEditServices) return;
    const updated = supervisorNames.filter((n) => n !== nameToRemove);
    setSupervisorNames(updated);
    setSupervisorName(updated.join(', '));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canEditServices) {
      alert('Você não tem permissão para editar dados. O Administrador precisa autorizar seu usuário.');
      return;
    }

    const finalResponsibleNames =
      responsibleNames.length > 0 ? responsibleNames : [currentUser.name || 'Pedro Belchior'];
    const finalResponsibleIds = finalResponsibleNames.map(
      (rn) => members.find((m) => m.name === rn)?.id || service.responsibleId
    );

    const finalExecutorNames =
      executorNames.length > 0 ? executorNames : finalResponsibleNames;
    const finalExecutorIds = finalExecutorNames
      .map((en) => members.find((m) => m.name === en)?.id || '')
      .filter(Boolean);

    const finalSupervisorNames = supervisorNames;
    const finalSupervisorIds = finalSupervisorNames
      .map((sn) => members.find((m) => m.name === sn)?.id || '')
      .filter(Boolean);

    await updateService(service.id, {
      title,
      category,
      problem,
      location,
      recommendedSolution,
      description,
      notes,
      status,
      responsibleId: finalResponsibleIds[0] || service.responsibleId,
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
      dueDate,
      forecastMonth,
      executionMonthName,
      estimatedCost: numEstimated,
      approvedCost: Number(approvedCost) || 0,
      actualCost: Number(actualCost) || 0,
      risk,
      highRiskWork,
      isHighRisk: highRiskWork === 'Sim',
      needsTMOption: tmCalculation.needsTMOption,
      needsTM: tmCalculation.needsTM,
      tmStatus: tmCalculation.needsTM ? tmStatus : undefined,
      safetyChecklistConfirmed: safetyConfirmed,
      safetyConfirmedBy: safetyConfirmed ? currentUser.name : undefined,
      safetyConfirmedAt: safetyConfirmed ? new Date().toISOString() : undefined,
      attachments,
    });

    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditServices) {
      alert('Você não tem permissão para adicionar fotos. Solicite autorização ao Administrador.');
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    setIsOptimizingPhotos(true);
    setOptimizingProgress({ current: 0, total: fileList.length });

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file: File = fileList[i];
      setOptimizingProgress({ current: i + 1, total: fileList.length });

      try {
        if (file.type.startsWith('image/')) {
          const opt = await optimizePhoto(file, {
            maxWidth: 1440,
            maxHeight: 1440,
            initialQuality: 0.82,
            targetMaxBytes: 190 * 1024,
            applySharpen: true,
          });

          newAttachments.push({
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: opt.name,
            url: opt.dataUrl,
            type: 'image',
            photoStage: uploadPhotoStage,
            size: opt.size,
            originalSize: opt.originalSize,
            width: opt.width,
            height: opt.height,
            savedPercentage: opt.savedPercentage,
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUser.name || 'Pedro Belchior',
          });
        } else {
          // Non-image fallback (documents/receipts)
          const reader = new FileReader();
          await new Promise<void>((resolve) => {
            reader.onload = (event) => {
              const result = event.target?.result as string;
              newAttachments.push({
                id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: file.name,
                url: result,
                type: file.type.includes('pdf') ? 'pdf' : 'document',
                photoStage: uploadPhotoStage,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                uploadedBy: currentUser.name || 'Pedro Belchior',
              });
              resolve();
            };
            reader.readAsDataURL(file);
          });
        }
      } catch (err) {
        console.error('Erro ao otimizar foto:', err);
      }
    }

    const updatedAtts = [...attachments, ...newAttachments];
    setAttachments(updatedAtts);
    await updateService(service.id, { attachments: updatedAtts });
    setIsOptimizingPhotos(false);
    // Reset file input
    e.target.value = '';
  };

  const handleRequestDeletePhoto = (att: Attachment) => {
    if (!canDeletePhoto) {
      alert('Apenas administradores têm permissão para excluir fotos.');
      return;
    }
    setPhotoToDelete(att);
  };

  const handleConfirmDeletePhoto = async () => {
    if (!photoToDelete || !canDeletePhoto) return;
    setIsDeletingPhoto(true);
    try {
      const updated = attachments.filter((a) => a.id !== photoToDelete.id);
      setAttachments(updated);
      await updateService(service.id, { attachments: updated });
      if (previewPhoto?.id === photoToDelete.id) {
        setPreviewPhoto(null);
      }
      setPhotoToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir foto:', err);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteService(service.id);
      setIsConfirmDeleteOpen(false);
      onClose();
    } catch (err) {
      console.error('Error in handleConfirmDelete:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div
          id="modal-service-detail"
          className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Read-Only Notice Banner */}
          {!canEditServices && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-800 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Modo Somente Leitura:</strong> Seu usuário não possui autorização para salvar alterações nos dados. Peça ao Administrador para conceder permissão.
                </span>
              </div>
              <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded font-bold text-[10px]">
                Acesso Limitado
              </span>
            </div>
          )}

          {/* Top Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-300 shadow-2xs">
                {service.code}
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight line-clamp-1">
                  {title || service.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span>Registrado em {formatDateBR(service.identifiedDate)}</span>
                  <span>•</span>
                  <span className="text-blue-700 font-semibold">{category}</span>
                  <span>•</span>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.2 rounded text-[11px] font-bold">
                    Status Oficial: {service.officialStatus}
                  </span>
                  {supervisorNames.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.2 rounded text-[11px] font-bold flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Sup: {supervisorNames.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={() => shareServiceOnWhatsApp(service)}
                title="Compartilhar resumo no WhatsApp"
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              {/* Add to Calendar (.ics) Button */}
              <button
                type="button"
                onClick={() => {
                  downloadCalendarEvent({
                    title: `[SR] ${service.code} • ${title || service.title}`,
                    description: `Categoria: ${category}\\nLocal: ${location}\\nPrioridade: ${classification.priority}\\nResponsável: ${responsibleName}\\nSolução: ${recommendedSolution || 'Verificar no local'}`,
                    location: `Salão do Reino • ${location || 'Principal'}`,
                    startDate: dueDate || service.identifiedDate || new Date().toISOString().split('T')[0],
                  }, `manutencao_${service.code}.ics`);
                }}
                title="Adicionar data do serviço na sua agenda (.ics)"
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Agenda</span>
              </button>

              {firebaseUser && canEditServices && (
                <button
                  id="btn-delete-service"
                  onClick={handleDeleteClick}
                  title="Excluir serviço"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                id="btn-close-detail-modal"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('details')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'details'
                ? 'text-blue-700 border-blue-600 bg-white shadow-2xs'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Ficha & Planejamento</span>
          </button>

          <button
            onClick={() => setActiveSubTab('photos')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'photos'
                ? 'text-blue-700 border-blue-600 bg-white shadow-2xs'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>Fotos & Anexos ({attachments.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('safety')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'safety'
                ? 'text-blue-700 border-blue-600 bg-white shadow-2xs'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Segurança & TM {(highRiskWork === 'Sim' || tmCalculation.needsTM) && '⚠️'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'history'
                ? 'text-blue-700 border-blue-600 bg-white shadow-2xs'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico ({service.history?.length || 0})</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: DETAILS & PLANNING */}
          {activeSubTab === 'details' && (
            <div className="space-y-4">
              {/* Status & Priority Banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                {/* Status selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-bold">Etapa Kanban:</span>
                  {firebaseUser ? (
                    <select
                      id="detail-select-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                      className="bg-white text-slate-900 text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {KANBAN_COLUMNS.map((col) => (
                        <option key={col.status} value={col.status}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="bg-white text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-300">
                      {KANBAN_COLUMNS.find((c) => c.status === status)?.label || status}
                    </span>
                  )}
                </div>

                {/* Priority & Risk Badges */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border ${
                      classification.priority === 'Alta'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : classification.priority === 'Média'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    PRIORIDADE {classification.priority.toUpperCase()} (Score: {classification.score})
                  </span>

                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${RISK_DEFINITIONS[risk]?.bgClass} ${RISK_DEFINITIONS[risk]?.textClass} ${RISK_DEFINITIONS[risk]?.borderClass}`}
                  >
                    RISCO {risk}
                  </span>
                </div>
              </div>

              {/* Recommended Solution Card */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 uppercase tracking-tight">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Solução Recomendada Oficial (Base Técnica)</span>
                </div>
                <textarea
                  rows={2}
                  value={recommendedSolution}
                  onChange={(e) => setRecommendedSolution(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs rounded-lg p-2.5 border border-blue-200 focus:ring-2 focus:ring-blue-500"
                  placeholder="Recomendação técnica para sanar o problema..."
                />
              </div>

              {/* Identification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título do Serviço
                  </label>
                  <input
                    type="text"
                    disabled={!firebaseUser}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Local Exato no Salão
                  </label>
                  <select
                    disabled={!firebaseUser}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-100 disabled:text-gray-600"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date & Forecast Controls (Data de Previsão para Conclusão) */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-tight">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Previsão de Conclusão & Prazos de Manutenção</span>
                  </div>
                  {overdue && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-600" /> Prazo Vencido
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data de Previsão para Conclusão
                    </label>
                    <input
                      type="date"
                      disabled={!firebaseUser}
                      value={dueDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setDueDate(newDate);
                        if (newDate) {
                          setForecastMonth(newDate.substring(0, 7));
                        }
                      }}
                      className="w-full bg-white text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300 focus:ring-2 focus:ring-blue-500 font-semibold disabled:bg-gray-100 disabled:text-gray-600"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Prazo limite planejado para entrega do serviço
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mês de Previsão (YYYY-MM)
                    </label>
                    <input
                      type="text"
                      disabled={!firebaseUser}
                      placeholder="Ex: 2026-08"
                      value={forecastMonth}
                      onChange={(e) => setForecastMonth(e.target.value)}
                      className="w-full bg-white text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Para cálculo de teto orçamentário
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mês de Execução
                    </label>
                    <select
                      disabled={!firebaseUser}
                      value={executionMonthName}
                      onChange={(e) => setExecutionMonthName(e.target.value as MonthName)}
                      className="w-full bg-white text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-100 disabled:text-gray-600"
                    >
                      {MONTH_NAMES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Referência contábil no salão
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Selection & Spreadsheet Deterministic GUT Matrix */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-tight">
                  <span>Avaliação de Risco & Matriz GUT Oficial</span>
                  <span className="font-mono text-blue-700">Score Planilha: {classification.score}</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Nível de Risco (1 a 5) — Define automaticamente Gravidade, Urgência e Tendência:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {([1, 2, 3, 4, 5] as RiskLevel[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRisk(r)}
                        className={`p-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer ${
                          risk === r
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Nível {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-lg border border-slate-200 text-xs">
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

              {/* Responsibles, Executor & Supervisor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Responsáveis da Área */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Responsáveis ({responsibleNames.length})
                    </span>
                  </label>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-1 min-h-[30px] items-center p-1.5 bg-slate-50 rounded-md border border-slate-200">
                    {responsibleNames.map((rn) => (
                      <span
                        key={rn}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-xs font-medium"
                      >
                        {rn}
                        {canEditServices && responsibleNames.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeResponsibleChip(rn)}
                            className="text-blue-600 hover:text-red-600 cursor-pointer"
                            title="Remover responsável"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  {canEditServices && members.length > 0 && (
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
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      Executores ({executorNames.length})
                    </span>
                  </label>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-1 min-h-[30px] items-center p-1.5 bg-slate-50 rounded-md border border-slate-200">
                    {executorNames.map((en) => (
                      <span
                        key={en}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium"
                      >
                        {en}
                        {canEditServices && executorNames.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExecutorChip(en)}
                            className="text-emerald-700 hover:text-red-600 cursor-pointer"
                            title="Remover executor"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  {canEditServices && members.length > 0 && (
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
                <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 shadow-2xs space-y-2">
                  <label className="block text-xs font-bold text-indigo-900 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Supervisores ({supervisorNames.length})
                    </span>
                  </label>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-1 min-h-[30px] items-center p-1.5 bg-white rounded-md border border-indigo-100">
                    {supervisorNames.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">Sem supervisor designado</span>
                    ) : (
                      supervisorNames.map((sn) => (
                        <span
                          key={sn}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-md text-xs font-medium"
                        >
                          {sn}
                          {canEditServices && (
                            <button
                              type="button"
                              onClick={() => removeSupervisorChip(sn)}
                              className="text-indigo-700 hover:text-red-600 cursor-pointer"
                              title="Remover supervisor"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))
                    )}
                  </div>

                  {canEditServices && members.length > 0 && (
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

              {/* Financials & Costs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custo Estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full bg-white text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300 font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Teto mensal ({forecastMonth}): {formatCurrencyBRL(ceiling)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custo Aprovado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={approvedCost}
                    onChange={(e) => setApprovedCost(Number(e.target.value))}
                    className="w-full bg-white text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custo Realizado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={actualCost}
                    onChange={(e) => setActualCost(Number(e.target.value))}
                    className="w-full bg-white text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300 text-emerald-700 font-bold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações e Histórico Interno
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white text-slate-900 text-xs rounded-lg p-2.5 border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  placeholder="Anotações gerais..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: PHOTOS & ATTACHMENTS */}
          {activeSubTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    Registro Fotográfico Rápido & Comprovantes
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Registre o <strong>Antes</strong>, o <strong>Depois</strong> e comprovantes com nitidez HD e compressão de 95%.
                  </span>
                </div>

                {firebaseUser && canEditServices && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Stage Selector for Upload */}
                    <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setUploadPhotoStage('before')}
                        className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                          uploadPhotoStage === 'before'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Antes
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadPhotoStage('after')}
                        className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                          uploadPhotoStage === 'after'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Depois
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadPhotoStage('receipt')}
                        className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                          uploadPhotoStage === 'receipt'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Comprovante
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadPhotoStage('general')}
                        className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                          uploadPhotoStage === 'general'
                            ? 'bg-slate-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Geral
                      </button>
                    </div>

                    <label className="cursor-pointer bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Galeria</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-2xs">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Tirar Foto ({uploadPhotoStage === 'before' ? 'Antes' : uploadPhotoStage === 'after' ? 'Depois' : uploadPhotoStage === 'receipt' ? 'Nota' : 'Geral'})</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Filter Pills for View */}
              {attachments.length > 0 && (
                <div className="flex items-center gap-1.5 pb-1 overflow-x-auto text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Filtrar:</span>
                  <button
                    type="button"
                    onClick={() => setPhotoStageFilter('all')}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                      photoStageFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({attachments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoStageFilter('before')}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                      photoStageFilter === 'before'
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    Antes ({attachments.filter((a) => a.photoStage === 'before').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoStageFilter('after')}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                      photoStageFilter === 'after'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Depois ({attachments.filter((a) => a.photoStage === 'after').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoStageFilter('receipt')}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                      photoStageFilter === 'receipt'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                    }`}
                  >
                    Comprovantes ({attachments.filter((a) => a.photoStage === 'receipt').length})
                  </button>
                </div>
              )}

              {/* Progress feedback */}
              {isOptimizingPhotos && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-900 font-medium animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                  <div className="flex-1">
                    <span>Otimizando e aplicando nitidez em foto {optimizingProgress.current} de {optimizingProgress.total}...</span>
                  </div>
                  <span className="text-[10px] bg-blue-200/80 px-2 py-0.5 rounded font-bold text-blue-950">
                    Processando
                  </span>
                </div>
              )}

              {attachments.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
                  <FileImage className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">Nenhuma foto ou comprovante anexado a este serviço.</p>
                  {firebaseUser && canEditServices && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Selecione "Antes", "Depois" ou "Comprovante" acima e fotografe pelo celular.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachments
                    .filter((att) => photoStageFilter === 'all' || att.photoStage === photoStageFilter)
                    .map((att) => {
                      const stageLabel =
                        att.photoStage === 'before'
                          ? 'Antes'
                          : att.photoStage === 'after'
                          ? 'Depois'
                          : att.photoStage === 'receipt'
                          ? 'Comprovante'
                          : 'Geral';

                      const stageBadgeColor =
                        att.photoStage === 'before'
                          ? 'bg-amber-500 text-white'
                          : att.photoStage === 'after'
                          ? 'bg-emerald-600 text-white'
                          : att.photoStage === 'receipt'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-700 text-white';

                      return (
                        <div
                          key={att.id}
                          className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-2xs bg-white flex flex-col hover:shadow-md transition"
                        >
                          <div className="aspect-video relative overflow-hidden bg-slate-100">
                            <img
                              src={att.url}
                              alt={att.name}
                              className="w-full h-full object-cover cursor-pointer transition duration-200 group-hover:scale-105"
                              onClick={() => setPreviewPhoto(att)}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => setPreviewPhoto(att)}
                                className="p-1.5 bg-white/90 text-slate-800 rounded-lg hover:bg-white transition cursor-pointer shadow-xs"
                                title="Visualizar em alta resolução"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {canDeletePhoto && (
                                <button
                                  type="button"
                                  onClick={() => handleRequestDeletePhoto(att)}
                                  className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer shadow-xs"
                                  title="Excluir foto (Apenas Administrador)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Stage Badge (Antes / Depois / Comprovante) */}
                            <span
                              className={`absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs ${stageBadgeColor}`}
                            >
                              {stageLabel}
                            </span>

                            <span className="absolute top-1.5 right-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              HD
                            </span>
                          </div>

                          <div className="p-2 text-[10px] space-y-1 border-t border-slate-100">
                            <p className="font-semibold text-slate-800 truncate" title={att.name}>
                              {att.name}
                            </p>
                            <div className="flex items-center justify-between text-slate-500">
                              <span className="font-mono">{formatBytes(att.size || 0)}</span>
                              {att.savedPercentage ? (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                                  -{att.savedPercentage}%
                                </span>
                              ) : null}
                            </div>
                            {canDeletePhoto && (
                              <button
                                type="button"
                                onClick={() => handleRequestDeletePhoto(att)}
                                className="w-full mt-1.5 py-1 px-2 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 rounded-md font-semibold text-[10px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                                title="Excluir foto do serviço (Exclusivo ADM)"
                              >
                                <Trash2 className="w-3 h-3 text-red-600 shrink-0" />
                                <span>Excluir Foto</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAFETY & TM */}
          {activeSubTab === 'safety' && (
            <div className="space-y-4">
              {/* High Risk Selection */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-xs font-bold text-amber-950">Trabalho de Alto Risco (Diretriz DC-82)</h3>
                    <p className="text-[11px] text-amber-800">
                      Classificação mandatória para segurança e proteção contra acidentes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={highRiskWork}
                    onChange={(e) => setHighRiskWork(e.target.value as YesNoEmpty)}
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="Não">Não (Trabalho comum / sem risco crítico)</option>
                    <option value="Sim">Sim (Trabalho em altura &gt;2m, QGBT, telhado ou gás)</option>
                    <option value="">(Em branco)</option>
                  </select>
                </div>
              </div>

              {/* TM Status */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  tmCalculation.needsTM ? 'bg-red-50/70 border-red-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert
                      className={`w-5 h-5 ${tmCalculation.needsTM ? 'text-red-600' : 'text-slate-400'}`}
                    />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Consulta ao TM (Instrutor de Manutenção)</h3>
                      <p className="text-[11px] text-slate-500">{tmCalculation.reason}</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      tmCalculation.needsTM
                        ? 'bg-red-600 text-white'
                        : tmCalculation.needsTMOption === 'Não'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tmCalculation.needsTMOption || 'A definir'}
                  </span>
                </div>

                {tmCalculation.needsTM && (
                  <div className="pt-2 border-t border-red-200/60 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Status da Consulta ao TM:</span>
                    <select
                      value={tmStatus}
                      onChange={(e) => setTmStatus(e.target.value as any)}
                      className="px-2.5 py-1 bg-white border border-red-300 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      <option value="Não iniciado">Não iniciado</option>
                      <option value="Enviado ao TM">Enviado ao TM (Aguardando Parecer)</option>
                      <option value="Aprovado pelo TM">Aprovado pelo TM</option>
                      <option value="Reprovado pelo TM">Reprovado pelo TM</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Safety Checklist Confirmation */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={safetyConfirmed}
                    onChange={(e) => setSafetyConfirmed(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Checklist de Segurança & EPI Validado
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6">
                  {service.safetyConfirmedBy
                    ? `Confirmado por ${service.safetyConfirmedBy} em ${formatDateBR(service.safetyConfirmedAt || '')}`
                    : 'Marque para autorizar o início dos trabalhos com conformidade de segurança.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {activeSubTab === 'history' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Linha do Tempo e Auditoria</span>
              <div className="space-y-2.5">
                {(service.history || []).map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{h.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateBR(h.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{h.details || ''}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Por: {h.userName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-3">
            {firebaseUser && canEditServices && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer self-start"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Problema</span>
              </button>
            )}
            <span className="text-[11px] text-slate-400">
              Atualizado: {formatDateBR(service.updatedAt)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
            >
              Fechar
            </button>
            {firebaseUser && canEditServices ? (
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs hover:shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-semibold">
                Somente Leitura
              </span>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Lightbox / Zoom Preview Modal */}
    {previewPhoto && (
      <div
        className="fixed inset-0 z-70 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
        onClick={() => setPreviewPhoto(null)}
      >
        <div
          className="relative max-w-4xl max-h-[90vh] w-full flex flex-col bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Lightbox Header */}
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <FileImage className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-semibold truncate">{previewPhoto.name}</span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                {formatBytes(previewPhoto.size || 0)}
              </span>
              {previewPhoto.savedPercentage ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  -{previewPhoto.savedPercentage}% espaço economizado
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={previewPhoto.url}
                download={previewPhoto.name}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                title="Baixar foto"
              >
                <Download className="w-4 h-4" />
              </a>
              {canDeletePhoto && (
                <button
                  type="button"
                  onClick={() => handleRequestDeletePhoto(previewPhoto)}
                  className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold px-2.5 shadow-xs"
                  title="Excluir esta foto permanentemente (ADM)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lightbox Image Stage */}
          <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-black/60 min-h-[300px]">
            <img
              src={previewPhoto.url}
              alt={previewPhoto.name}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-lg select-none"
            />
          </div>

          <div className="p-2 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-between px-4">
            <span>Foto nítida em alta resolução</span>
            <span className="text-[10px] text-slate-500">Clique fora ou em fechar para voltar</span>
          </div>
        </div>
      </div>
    )}

    {/* Confirm Service Deletion Modal */}
    <ConfirmModal
      isOpen={isConfirmDeleteOpen}
      title="Excluir Serviço / Problema"
      message={`Tem certeza que deseja excluir permanentemente o serviço "${title || service.title}" (${service.code})? Esta ação não pode ser desfeita.`}
      confirmLabel="Sim, Excluir"
      cancelLabel="Cancelar"
      confirmVariant="danger"
      isLoading={isDeleting}
      onConfirm={handleConfirmDelete}
      onCancel={() => setIsConfirmDeleteOpen(false)}
    />

    {/* Confirm Photo Deletion Modal (Exclusivo ADM) */}
    <ConfirmModal
      isOpen={Boolean(photoToDelete)}
      title="Excluir Foto"
      message={`Tem certeza que deseja excluir permanentemente a foto "${photoToDelete?.name}" deste serviço? Esta ação não pode ser desfeita e é restrita a Administradores.`}
      confirmLabel="Sim, Excluir Foto"
      cancelLabel="Cancelar"
      confirmVariant="danger"
      isLoading={isDeletingPhoto}
      onConfirm={handleConfirmDeletePhoto}
      onCancel={() => setPhotoToDelete(null)}
    />
  </>
  );
};

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
}) => {
  if (!service) return null;

  return <ServiceDetailModalContent key={service.id} service={service} onClose={onClose} />;
};
