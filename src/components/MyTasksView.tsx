import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { ServiceItem } from '../types';
import { formatCurrencyBRL, formatDateBR, isOverdue, RISK_DEFINITIONS } from '../utils/priority';
import { ServiceCard } from './ServiceCard';

interface MyTasksViewProps {
  onSelectService: (service: ServiceItem) => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({ onSelectService }) => {
  const { services, currentUser, openNewServiceModal } = useMaintenance();
  const [roleFilter, setRoleFilter] = useState<'all' | 'executing' | 'supervising'>('all');
  const [subFilter, setSubFilter] = useState<'all' | 'overdue' | 'high' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  const currentName = (currentUser.name || '').toLowerCase().trim();

  // Tasks where the currentUser is the designated EXECUTOR or Area Responsible
  const executingTasks = services.filter((s) => {
    const rName = (s.responsibleName || '').toLowerCase().trim();
    const eName = (s.executorName || '').toLowerCase().trim();
    return rName === currentName || eName === currentName;
  });

  // Tasks where the currentUser is the designated SUPERVISOR
  const supervisingTasks = services.filter((s) => {
    const sName = (s.supervisorName || '').toLowerCase().trim();
    const sNames = (s.supervisorNames || []).map((n) => n.toLowerCase().trim());
    return sName === currentName || sNames.includes(currentName);
  });

  // Combined according to role filter
  let baseServices = services;
  if (roleFilter === 'executing') {
    baseServices = executingTasks;
  } else if (roleFilter === 'supervising') {
    baseServices = supervisingTasks;
  } else {
    // 'all' my scope: executing OR supervising
    baseServices = services.filter((s) => {
      const rName = (s.responsibleName || '').toLowerCase().trim();
      const eName = (s.executorName || '').toLowerCase().trim();
      const sName = (s.supervisorName || '').toLowerCase().trim();
      const sNames = (s.supervisorNames || []).map((n) => n.toLowerCase().trim());
      return rName === currentName || eName === currentName || sName === currentName || sNames.includes(currentName);
    });
  }

  const overdueList = baseServices.filter((s) => isOverdue(s.dueDate, s.status));
  const highPriorityList = baseServices.filter((s) => s.priority === 'Alta' && s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO');
  const completedList = baseServices.filter((s) => s.status === 'CONCLUÍDO');

  let displayedServices = baseServices;
  if (subFilter === 'overdue') displayedServices = overdueList;
  if (subFilter === 'high') displayedServices = highPriorityList;
  if (subFilter === 'completed') displayedServices = completedList;

  return (
    <div id="mytasks-view-container" className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-2xs"
            style={{ backgroundColor: currentUser.avatarColor || '#2563eb' }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">{currentUser.name}</h2>
              <span className="px-2 py-0.2 text-[10px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">
                {currentUser.role}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Área de Atuação: Execução e Supervisão de Manutenções do Salão do Reino
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="bg-gray-100 p-0.5 rounded flex items-center border border-gray-200">
            <button
              onClick={() => setViewMode('list')}
              title="Visualização em Lista"
              className={`p-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Visualização em Cartões"
              className={`p-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => openNewServiceModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Problema</span>
          </button>
        </div>
      </div>

      {/* Scope Selector: Todas vs Minhas Execuções vs Sob Minha Supervisão */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 shadow-2xs">
        <span className="text-xs font-bold text-gray-600 px-1">Escopo de Atuação:</span>
        <button
          onClick={() => setRoleFilter('all')}
          className={`px-3 py-1 text-xs font-bold rounded transition cursor-pointer ${
            roleFilter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Meu Painel Completo ({executingTasks.length + supervisingTasks.length})
        </button>
        <button
          onClick={() => setRoleFilter('executing')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition cursor-pointer ${
            roleFilter === 'executing'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Sob Minha Execução ({executingTasks.length})</span>
        </button>
        <button
          onClick={() => setRoleFilter('supervising')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition cursor-pointer ${
            roleFilter === 'supervising'
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Sob Minha Supervisão ({supervisingTasks.length})</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSubFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
            subFilter === 'all'
              ? 'bg-gray-900 text-white shadow-2xs'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>Todas</span>
          <span className="px-1.5 py-0.2 rounded bg-black/10 text-[10px]">
            {baseServices.length}
          </span>
        </button>

        <button
          onClick={() => setSubFilter('overdue')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
            subFilter === 'overdue'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Atrasadas</span>
          <span className="px-1.5 py-0.2 rounded bg-black/10 text-[10px]">
            {overdueList.length}
          </span>
        </button>

        <button
          onClick={() => setSubFilter('high')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
            subFilter === 'high'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Flame className="w-3 h-3" />
          <span>Alta Prioridade</span>
          <span className="px-1.5 py-0.2 rounded bg-black/10 text-[10px]">
            {highPriorityList.length}
          </span>
        </button>

        <button
          onClick={() => setSubFilter('completed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
            subFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Concluídas</span>
          <span className="px-1.5 py-0.2 rounded bg-black/10 text-[10px]">
            {completedList.length}
          </span>
        </button>
      </div>

      {/* Services List / Grid View */}
      {displayedServices.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-bold text-gray-800">Nenhuma tarefa encontrada neste filtro</h3>
          <p className="text-xs text-gray-500 mt-1">
            {roleFilter === 'supervising'
              ? 'Não há manutenções designadas para sua supervisão no momento.'
              : 'Você está em dia com as manutenções designadas para o seu perfil.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onSelect={onSelectService}
            />
          ))}
        </div>
      ) : (
        /* List Mode */
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="divide-y divide-gray-100">
            {displayedServices.map((item) => {
              const overdue = isOverdue(item.dueDate, item.status);
              const isMySupervision =
                (item.supervisorName || '').toLowerCase().trim() === currentName ||
                (item.supervisorNames || []).some((n) => n.toLowerCase().trim() === currentName);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectService(item)}
                  className="p-3 hover:bg-gray-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                        {item.code}
                      </span>
                      <span className="text-[11px] font-bold text-blue-700">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {item.location}
                      </span>
                      {isMySupervision && (
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded border border-indigo-200 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Sob Sua Supervisão
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.title}</h4>

                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span>Executado por: <strong className="text-gray-700">{item.executorName || item.responsibleName}</strong></span>
                      {item.supervisorName && (
                        <span>• Supervisor: <strong className="text-indigo-700">{item.supervisorName}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Badges & Status */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Priority & Risk */}
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        item.priority === 'Alta'
                          ? 'bg-red-100 text-red-800'
                          : item.priority === 'Média'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.priority} (GUT {item.priorityScore})
                    </span>

                    {/* Status Badge */}
                    <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {item.status}
                    </span>

                    {/* Due Date */}
                    <div className="text-right">
                      {overdue ? (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {formatDateBR(item.dueDate)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDateBR(item.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
