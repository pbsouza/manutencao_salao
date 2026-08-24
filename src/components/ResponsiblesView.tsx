import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  Flame,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  Tag,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { UserMember } from '../types';
import { isOverdue } from '../utils/priority';
import { ConfirmModal } from './ConfirmModal';

export const ResponsiblesView: React.FC = () => {
  const {
    members,
    services,
    currentUser,
    firebaseUser,
    isAdmin,
    canEditServices,
    toggleMemberEditPermission,
    setIsAuthModalOpen,
    switchUser,
    deleteMember,
    setActiveTab,
    setFilterState,
    openUserManagementModal,
    openBatchAssignModal,
  } = useMaintenance();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [memberToDelete, setMemberToDelete] = useState<UserMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredMembers = members.filter((m) => {
    const matchRole = roleFilter === 'ALL' || m.role === roleFilter;
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.role || '').toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const handleMemberClick = (memberName: string, filterType: 'executor' | 'supervisor' = 'executor') => {
    if (filterType === 'supervisor') {
      setFilterState((prev) => ({ ...prev, supervisor: memberName }));
    } else {
      setFilterState((prev) => ({ ...prev, responsible: memberName }));
    }
    setActiveTab('kanban');
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMember(memberToDelete.id);
      setMemberToDelete(null);
    } catch (err) {
      console.error('Error deleting member in ResponsiblesView:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="responsibles-view-container" className="p-3 sm:p-4 lg:p-6 space-y-4 max-w-7xl mx-auto pb-32 sm:pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Equipe e Usuários Cadastrados
          </h2>
          <p className="text-[11px] text-gray-500">
            Gerencie os voluntários, coordenadores, supervisores e executores designados para a manutenção do Salão do Reino
          </p>
        </div>

        <button
          onClick={() => {
            if (!firebaseUser) {
              setIsAuthModalOpen(true);
              return;
            }
            openUserManagementModal();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Nova Pessoa</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou função..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-lg border border-gray-300 bg-gray-50 focus:bg-white font-medium"
          >
            <option value="ALL">Todas as Funções ({members.length})</option>
            <option value="SUPERVISOR">Supervisores</option>
            <option value="RESPONSÁVEL">Responsáveis de Área</option>
            <option value="EXECUTOR">Executores de Manutenção</option>
            <option value="COLABORADOR">Colaboradores</option>
            <option value="COORDENADOR">Coordenadores</option>
            <option value="ADMINISTRADOR">Administradores</option>
          </select>
        </div>

        <span className="text-xs text-gray-500 font-medium">
          Exibindo {filteredMembers.length} de {members.length} membros
        </span>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredMembers.map((member) => {
          const isCurrentActive = currentUser.id === member.id || currentUser.email === member.email;
          const isMemberAdmin = member.role === 'ADMINISTRADOR' || member.email === 'belchior87@gmail.com';
          const mName = member.name.toLowerCase().trim();

          // Executing tasks (supports multi-responsible and multi-executor)
          const executingServices = services.filter((s) => {
            const r = (s.responsibleName || '').toLowerCase().trim();
            const rs = (s.responsibleNames || []).map((n) => n.toLowerCase().trim());
            const e = (s.executorName || '').toLowerCase().trim();
            const es = (s.executorNames || []).map((n) => n.toLowerCase().trim());
            return r === mName || rs.includes(mName) || e === mName || es.includes(mName);
          });

          // Supervising tasks
          const supervisingServices = services.filter((s) => {
            const sn = (s.supervisorName || '').toLowerCase().trim();
            const sns = (s.supervisorNames || []).map((n) => n.toLowerCase().trim());
            return sn === mName || sns.includes(mName);
          });

          const openExecutingCount = executingServices.filter(
            (s) => s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO'
          ).length;

          const openSupervisingCount = supervisingServices.filter(
            (s) => s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO'
          ).length;

          const overdueCount = executingServices.filter((s) => isOverdue(s.dueDate, s.status)).length;
          const completedCount = executingServices.filter((s) => s.status === 'CONCLUÍDO').length;

          return (
            <div
              key={member.id}
              className={`bg-white hover:bg-gray-50/80 p-4 rounded-xl border transition-all flex flex-col justify-between group shadow-2xs relative ${
                isCurrentActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Profile Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: member.avatarColor || '#2563eb' }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-gray-900 text-xs truncate">
                          {member.name}
                        </h3>
                        {isCurrentActive && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-blue-600 text-white rounded shrink-0">
                            Ativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200 inline-block">
                          {member.role}
                        </span>
                        {isMemberAdmin ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded border border-purple-200 inline-flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5 text-purple-600" /> Admin
                          </span>
                        ) : member.canEdit ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 inline-flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5 text-emerald-600" /> Edição OK
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded border border-gray-200 inline-flex items-center gap-0.5">
                            Leitura
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (!firebaseUser) {
                          setIsAuthModalOpen(true);
                          return;
                        }
                        openUserManagementModal(member);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      title="Editar perfil e dados no controle interno"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {firebaseUser && (isAdmin || canEditServices) && (
                      <button
                        onClick={() => setMemberToDelete(member)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Excluir este usuário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin Quick Permission Toggle */}
                {isAdmin && !isMemberAdmin && (
                  <div className="mb-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1 truncate text-slate-700">
                      <Shield className={`w-3 h-3 ${member.canEdit ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span className="truncate">{member.canEdit ? 'Pode Editar' : 'Somente Leitura'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleMemberEditPermission(member.id, !member.canEdit)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition shrink-0 border ${
                        member.canEdit
                          ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      {member.canEdit ? 'Tornar Leitura' : 'Conceder Edição'}
                    </button>
                  </div>
                )}

                {/* Contact info */}
                <div className="space-y-1 text-[11px] text-gray-500 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Categories */}
                {member.assignedCategories && member.assignedCategories.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight block mb-1">
                      Especialidades:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {member.assignedCategories.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] font-medium bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200"
                        >
                          {c.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Switch & Tasks Footer */}
              <div>
                {/* Switch active user button */}
                {!isCurrentActive && (
                  <button
                    type="button"
                    onClick={() => switchUser(member.id)}
                    className="w-full mb-2.5 py-1 px-2 text-[11px] font-bold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3 h-3" />
                    <span>Usar este perfil na sessão</span>
                  </button>
                )}

                {/* Task Metrics & Supervision */}
                <div className="pt-2.5 border-t border-gray-100 space-y-1.5 text-[11px]">
                  <div
                    onClick={() => handleMemberClick(member.name, 'executor')}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-blue-50 cursor-pointer transition"
                    title="Ver serviços executados por este irmão"
                  >
                    <span className="text-gray-600 flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-600" /> Executando
                    </span>
                    <span className="font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded text-[10px]">
                      {openExecutingCount} ativas
                    </span>
                  </div>

                  <div
                    onClick={() => handleMemberClick(member.name, 'supervisor')}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-indigo-50 cursor-pointer transition"
                    title="Ver serviços sob supervisão deste irmão"
                  >
                    <span className="text-gray-600 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-indigo-600" /> Supervisionando
                    </span>
                    <span className="font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.2 rounded text-[10px]">
                      {openSupervisingCount} sob supervisão
                    </span>
                  </div>

                  {overdueCount > 0 && (
                    <div className="flex items-center justify-between text-red-700 font-bold px-1.5 py-0.5">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Atrasadas
                      </span>
                      <span className="bg-red-100 text-red-800 px-1.5 py-0.2 rounded text-[10px]">
                        {overdueCount}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-emerald-700 px-1.5 py-0.5">
                    <span className="text-gray-500">Concluídas</span>
                    <span className="font-bold text-emerald-700">{completedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Member Deletion Modal */}
      <ConfirmModal
        isOpen={Boolean(memberToDelete)}
        title="Excluir Usuário / Membro"
        message={`Tem certeza que deseja remover o usuário "${memberToDelete?.name}" (${memberToDelete?.role})? As manutenções e registros vinculados permanecerão salvos no sistema.`}
        confirmLabel="Sim, Excluir Usuário"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setMemberToDelete(null)}
      />
    </div>
  );
};
