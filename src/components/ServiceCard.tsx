import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightCircle,
  Calendar,
  ChevronDown,
  DollarSign,
  FileImage,
  HardHat,
  MapPin,
  ShieldAlert,
  Trash2,
  UserCheck,
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
  const { moveService, deleteService, currentUser } = useMaintenance();
  const [isMoving, setIsMoving] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const overdue = isOverdue(service.dueDate, service.status);
  const isCompleted = service.status === 'CONCLUÍDO';

  const getEffectiveDisplayName = () => {
    if (service.executorName && !isDummyPerson(service.executorName)) {
      return service.executorName;
    }
    if (service.responsibleName && !isDummyPerson(service.responsibleName)) {
      return service.responsibleName;
    }
    return currentUser?.name || 'Pedro Belchior';
  };
  const displayName = getEffectiveDisplayName();
  const hasValidSupervisor = service.supervisorName && !isDummyPerson(service.supervisorName);

  const getBorderColor = () => {
    if (isCompleted) return 'border-l-emerald-500';
    if (service.priority === 'Alta') return 'border-l-red-500';
    if (service.priority === 'Média') return 'border-l-amber-500';
    return 'border-l-blue-500';
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
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

  return (
    <>
      <div
        id={`card-service-${service.id}`}
        draggable
        onDragStart={(e) => onDragStart && onDragStart(e, service.id)}
        onClick={() => onSelect(service)}
        className={`group bg-white p-2.5 sm:p-3 rounded-lg shadow-2xs border border-gray-200 border-l-4 ${getBorderColor()} flex flex-col gap-1.5 hover:shadow-xs transition-shadow cursor-grab active:cursor-grabbing select-none ${
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

          {/* Quick Card Delete Button */}
          <button
            type="button"
            title="Excluir este card"
            onClick={handleDeleteClick}
            className="text-gray-300 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
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
              title={`Supervisor: ${service.supervisorName}`}
              className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5"
            >
              <UserCheck className="w-2.5 h-2.5" />
              {service.supervisorName.split(' ')[0]}
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

        {/* Quick Status Mover for touch screens / mobile */}
        <div
          className="mt-1 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1 text-[10px]"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-gray-400 text-[9px] font-medium shrink-0">Coluna:</span>
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
        </div>

        {/* Footer: Executor / Responsible, Due Date, Cost */}
        <div className="pt-1.5 mt-0.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
          {/* Executor / Responsible */}
          <div className="flex items-center gap-1 truncate max-w-[100px]">
            <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold shrink-0">
              {displayName.charAt(0)}
            </div>
            <span className="truncate text-gray-700 font-medium" title={displayName}>
              {displayName.split(' ')[0]}
            </span>
          </div>

          {/* Due Date & Cost */}
          <div className="flex items-center gap-1.5 shrink-0">
            {overdue ? (
              <span className="text-[9px] font-bold text-red-700 bg-red-100 px-1 py-0.5 rounded flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />
                {formatDateBR(service.dueDate)}
              </span>
            ) : (
              <span className="text-gray-500 flex items-center gap-0.5 text-[10px]">
                <Calendar className="w-2.5 h-2.5" />
                {formatDateBR(service.dueDate)}
              </span>
            )}

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

