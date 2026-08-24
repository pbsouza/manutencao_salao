import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightCircle,
  Calendar,
  Check,
  ChevronDown,
  DollarSign,
  Edit2,
  FileImage,
  HardHat,
  MapPin,
  ShieldAlert,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { isDummyPerson, useMaintenance } from '../context/MaintenanceContext';
import { ServiceItem, ServiceStatus } from '../types';
import {
  formatCurrencyBRL,
  formatDateBR,
  isOverdue,
  RISK_DEFINITIONS,
} from '../utils/priority';
import { ConfirmModal } from './ConfirmModal';

const STATUS_OPTIONS: { status: ServiceStatus; label: string }[] = [
  { status: 'NOVOS PROBLEMAS', label: '1. Novos Problemas' },
  { status: 'A AVALIAR', label: '2. A Avaliar' },
  { status: 'PLANEJADO', label: '3. Planejado' },
  { status: 'EM ANDAMENTO', label: '4. Em Andamento' },
  { status: 'AGUARDANDO MATERIAL', label: '5. Aguardando Material' },
  { status: 'AGUARDANDO TERCEIRO', label: '6. Aguardando Terceiro' },
  { status: 'CONCLUÍDO', label: '7. Concluído' },
  { status: 'CANCELADO', label: '8. Cancelado' },
];

interface ServiceCardProps {
  service: ServiceItem;
  onSelect: (service: ServiceItem) => void;
  onQuickMove?: (service: ServiceItem) => void;
  onDragStart?: (e: React.DragEvent, serviceId: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onSelect,
  onDragStart,
}) => {
  const {
    moveService,
    updateService,
    deleteService,
    currentUser,
    firebaseUser,
    canEditServices,
    setIsAuthModalOpen,
  } = useMaintenance();
  const [isMoving, setIsMoving] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [newDueDate, setNewDueDate] = useState(service.dueDate || '');
  const [isSavingDate, setIsSavingDate] = useState(false);

  const overdue = isOverdue(service.dueDate, service.status);
  const isCompleted = service.status === 'CONCLUÍDO';

  const getEffectiveDisplayName = () => {
    if (service.executorNames && service.executorNames.length > 0) {
      return service.executorNames.join(', ');
    }
    if (service.executorName && !isDummyPerson(service.executorName)) {
      return service.executorName;
    }
    if (service.responsibleNames && service.responsibleNames.length > 0) {
      return service.responsibleNames.join(', ');
    }
    if (service.responsibleName && !isDummyPerson(service.responsibleName)) {
      return service.responsibleName;
    }
    return currentUser?.name || 'Pedro Belchior';
  };
  const displayName = getEffectiveDisplayName();
  const peopleCount =
    (service.executorNames && service.executorNames.length > 0
      ? service.executorNames.length
      : service.responsibleNames && service.responsibleNames.length > 0
      ? service.responsibleNames.length
      : 1);

  const hasValidSupervisor =
    (service.supervisorNames && service.supervisorNames.length > 0) ||
    (service.supervisorName && !isDummyPerson(service.supervisorName));

  const supervisorDisplay =
    service.supervisorNames && service.supervisorNames.length > 0
      ? service.supervisorNames.join(', ')
      : service.supervisorName || '';

  const getBorderColor = () => {
    if (isCompleted) return 'border-l-emerald-500';
    if (service.priority === 'Alta') return 'border-l-red-500';
    if (service.priority === 'Média') return 'border-l-amber-500';
    return 'border-l-blue-500';
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    if (!firebaseUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!canEditServices) {
      alert('Você não tem permissão para alterar o status. O Administrador precisa autorizar seu usuário.');
      return;
    }
    const newStatus = e.target.value as ServiceStatus;
    if (newStatus && newStatus !== service.status) {
      setIsMoving(true);
      try {
        await moveService(service.id, newStatus);
      } finally {
        setIsMoving(false);
      }
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firebaseUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!canEditServices) {
      alert('Você não tem permissão para excluir serviços.');
      return;
    }
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteService(service.id);
      setIsConfirmDeleteOpen(false);
    } catch (err) {
      console.error('Error deleting service from card:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveDueDate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firebaseUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!canEditServices) {
      alert('Você não tem permissão para alterar datas.');
      return;
    }
    if (!newDueDate) return;
    setIsSavingDate(true);
    try {
      const forecastM = newDueDate.substring(0, 7);
      await updateService(service.id, {
        dueDate: newDueDate,
        forecastMonth: forecastM,
      });
      setIsEditingDueDate(false);
    } catch (err) {
      console.error('Error saving due date from card:', err);
    } finally {
      setIsSavingDate(false);
    }
  };

  return (
    <>
      <div
        id={`card-service-${service.id}`}
        draggable={!!firebaseUser}
        onDragStart={(e) => onDragStart && onDragStart(e, service.id)}
        onClick={() => onSelect(service)}
        className={`group bg-white p-2.5 sm:p-3 rounded-lg shadow-2xs border border-gray-200 border-l-4 ${getBorderColor()} flex flex-col gap-1.5 hover:shadow-xs transition-shadow cursor-pointer select-none relative ${
          isCompleted ? 'opacity-80' : ''
        } ${overdue ? 'ring-1 ring-red-400' : ''}`}
      >
        {/* Top row: Code & Category + Delete button */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {service.code}
            </span>

            <span
              title={`Categoria: ${service.category}`}
              className="text-[10px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[120px]"
            >
              {service.category.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Quick Card Delete Button (Visible for logged-in user with edit permissions) */}
          {firebaseUser && canEditServices && (
            <button
              type="button"
              title="Excluir este card"
              onClick={handleDeleteClick}
              className="text-gray-300 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xs font-bold leading-snug text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {service.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="truncate">{service.location}</span>
        </div>

        {/* Badges: Risk, Priority, Flags */}
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {/* Priority */}
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
              service.priority === 'Alta'
                ? 'bg-red-100 text-red-800'
                : service.priority === 'Média'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {service.priority} ({service.priorityScore || 'GUT'})
          </span>

          {/* Risk */}
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
              service.risk >= 4
                ? 'bg-red-100 text-red-800'
                : service.risk === 3
                ? 'bg-amber-100 text-amber-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Risco {service.risk}
          </span>

          {/* Supervisor Badge */}
          {hasValidSupervisor && (
            <span
              title={`Supervisor: ${supervisorDisplay}`}
              className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5"
            >
              <UserCheck className="w-2.5 h-2.5" />
              {supervisorDisplay.split(',')[0].trim().split(' ')[0]}
              {service.supervisorNames && service.supervisorNames.length > 1 && ` +${service.supervisorNames.length - 1}`}
            </span>
          )}

          {/* TM Badge */}
          {service.needsTM && (
            <span
              title="Consulta ao Representante de Manutenção (TM)"
              className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
            >
              <ShieldAlert className="w-2.5 h-2.5" />
              TM
            </span>
          )}

          {/* High Risk Badge */}
          {service.isHighRisk && (
            <span
              title="Trabalho de Alto Risco"
              className="text-[9px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
            >
              <HardHat className="w-2.5 h-2.5" />
              Alto Risco
            </span>
          )}

          {/* Attachments */}
          {service.attachments && service.attachments.length > 0 && (
            <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <FileImage className="w-2.5 h-2.5 text-blue-500" />
              {service.attachments.length}
            </span>
          )}
        </div>

        {/* Quick Status Mover */}
        <div
          className="mt-1 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1 text-[10px]"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-gray-400 text-[9px] font-medium shrink-0">Etapa:</span>
          {firebaseUser && canEditServices ? (
            <select
              value={service.status}
              onChange={handleStatusChange}
              disabled={isMoving}
              aria-label="Mover card de coluna"
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.status} value={opt.status}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="w-full bg-gray-50 border border-gray-200 text-gray-600 rounded px-1.5 py-0.5 text-[10px] font-medium truncate">
              {STATUS_OPTIONS.find((o) => o.status === service.status)?.label || service.status}
            </span>
          )}
        </div>

        {/* Inline Due Date Quick Changer Popover */}
        {isEditingDueDate && firebaseUser && canEditServices && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5 my-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-950 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" /> Alterar Data Prevista
              </span>
              <button
                type="button"
                onClick={() => setIsEditingDueDate(false)}
                className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="flex-1 bg-white border border-blue-300 rounded px-1.5 py-1 text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSaveDueDate}
                disabled={isSavingDate}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5"
              >
                <Check className="w-3 h-3" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer: Executor / Responsible, Due Date, Cost */}
        <div className="pt-1.5 mt-0.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
          {/* Executor / Responsible */}
          <div className="flex items-center gap-1 truncate max-w-[130px]" title={displayName}>
            <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold shrink-0">
              {displayName.charAt(0)}
            </div>
            <span className="truncate text-gray-700 font-medium">
              {displayName.split(',')[0].trim().split(' ')[0]}
              {peopleCount > 1 && (
                <span className="text-[9px] text-blue-600 font-bold ml-0.5">
                  +{peopleCount - 1}
                </span>
              )}
            </span>
          </div>

          {/* Due Date & Cost */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Due Date trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!firebaseUser) {
                  setIsAuthModalOpen(true);
                  return;
                }
                if (!canEditServices) {
                  onSelect(service);
                  return;
                }
                setIsEditingDueDate(!isEditingDueDate);
              }}
              title={canEditServices ? "Clique para alterar a data de previsão" : "Data de previsão da atividade"}
              className={`flex items-center gap-0.5 text-[10px] rounded px-1 py-0.5 transition cursor-pointer hover:underline ${
                overdue
                  ? 'font-bold text-red-700 bg-red-100 hover:bg-red-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {overdue ? (
                <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
              ) : (
                <Calendar className="w-2.5 h-2.5 text-gray-500" />
              )}
              <span>{formatDateBR(service.dueDate)}</span>
              {firebaseUser && canEditServices && <Edit2 className="w-2 h-2 text-gray-400 opacity-60 ml-0.5" />}
            </button>

            {service.estimatedCost > 0 && (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 text-[10px]">
                {formatCurrencyBRL(service.estimatedCost)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Card Deletion */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Excluir Card de Manutenção"
        message={`Deseja realmente excluir permanentemente o card "${service.title}" (${service.code})?`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </>
  );
};

