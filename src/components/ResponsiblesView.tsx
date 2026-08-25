import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  FileSpreadsheet,
  Filter,
  Flame,
  Info,
  Layers,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  Sparkles,
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
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'tasks' | 'role'>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(24);
  const [memberToDelete, setMemberToDelete] = useState<UserMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate high-level stats
  const stats = useMemo(() => {
    const total = members.length;
    const loginUsers = members.filter(
      (m) => m.email && !m.email.includes('@interno.app') && !m.email.endsWith('@salao.org')
    ).length;
    const internalControlOnly = total - loginUsers;
    const supervisors = members.filter((m) => m.role === 'SUPERVISOR' || m.role === 'COORDENADOR').length;
    const executors = members.filter((m) => m.role === 'EXECUTOR').length;
    const responsibles = members.filter((m) => m.role === 'RESPONSÁVEL').length;
    const collaborators = members.filter((m) => m.role === 'COLABORADOR').length;
    return {
      total,
      loginUsers,
      internalControlOnly,
      supervisors,
      executors,
      responsibles,
      collaborators,
    };
  }, [members]);

  // Extract all unique categories assigned to members
  const availableCategories = useMemo(() => {
    const catSet = new Set<string>();
    members.forEach((m) => {
      m.assignedCategories?.forEach((c) => catSet.add(c));
    });
    return Array.from(catSet).sort();
  }, [members]);

  // Filtered and sorted members
  const filteredMembers = useMemo(() => {
    const term = search.toLowerCase().trim();
    let result = members.filter((m) => {
      const matchRole = roleFilter === 'ALL' || m.role === roleFilter;
      const matchCat =
        categoryFilter === 'ALL' || (m.assignedCategories && m.assignedCategories.includes(categoryFilter));
      const matchSearch =
        !term ||
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        (m.phone || '').includes(term) ||
        (m.role || '').toLowerCase().includes(term);
      return matchRole && matchCat && matchSearch;
    });

    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else if (sortBy === 'role') {
      result.sort((a, b) => (a.role || '').localeCompare(b.role || '', 'pt-BR'));
    } else if (sortBy === 'tasks') {
      // Sort by active task counts descending
      result.sort((a, b) => {
        const countA = services.filter((s) => {
          const r = (s.responsibleName || '').toLowerCase();
          const e = (s.executorName || '').toLowerCase();
          return (r.includes(a.name.toLowerCase()) || e.includes(a.name.toLowerCase())) && s.status !== 'CONCLUÍDO';
        }).length;
        const countB = services.filter((s) => {
          const r = (s.responsibleName || '').toLowerCase();
          const e = (s.executorName || '').toLowerCase();
          return (r.includes(b.name.toLowerCase()) || e.includes(b.name.toLowerCase())) && s.status !== 'CONCLUÍDO';
        }).length;
        return countB - countA;
      });
    }

    return result;
  }, [members, search, roleFilter, categoryFilter, sortBy, services]);

  // Pagination calculation
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const paginatedMembers = useMemo(() => {
    if (itemsPerPage === -1) return filteredMembers;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              Equipe & Controle Interno de Usuários
            </h2>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-[11px] rounded-full">
              {members.length} cadastrados
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Gerencie centenas de voluntários, supervisores e executores para manutenção do Salão do Reino sem limite de logins
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (!firebaseUser) {
                setIsAuthModalOpen(true);
                return;
              }
              openBatchAssignModal();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Designação em Massa</span>
          </button>

          <button
            onClick={() => {
              if (!firebaseUser) {
                setIsAuthModalOpen(true);
                return;
              }
              openUserManagementModal();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Cadastrar Usuários (Individual / Em Lote)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for Team Management */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-tight">Total Geral</span>
          <span className="text-lg font-black text-gray-900">{stats.total}</span>
          <span className="text-[10px] text-gray-500 block">no banco de dados</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/30 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-blue-700 block tracking-tight">Controle Interno</span>
          <span className="text-lg font-black text-blue-900">{stats.internalControlOnly}</span>
          <span className="text-[10px] text-blue-600 block">sem limite de login</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-indigo-700 block tracking-tight">Supervisores</span>
          <span className="text-lg font-black text-indigo-900">{stats.supervisors}</span>
          <span className="text-[10px] text-indigo-600 block">apoio técnico</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block tracking-tight">Executores</span>
          <span className="text-lg font-black text-emerald-900">{stats.executors}</span>
          <span className="text-[10px] text-emerald-600 block">mão de obra ativa</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-amber-700 block tracking-tight">Responsáveis</span>
          <span className="text-lg font-black text-amber-900">{stats.responsibles}</span>
          <span className="text-[10px] text-amber-600 block">gestores de área</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-purple-700 block tracking-tight">Com Login Ativo</span>
          <span className="text-lg font-black text-purple-900">{stats.loginUsers || 1}</span>
          <span className="text-[10px] text-purple-600 block">limite free: até 5</span>
        </div>
      </div>

      {/* Search, Filters, Sort & Pagination Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {/* Search box */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nome, e-mail, telefone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white font-medium"
            />
          </div>

          {/* Filter by Role */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-gray-300 bg-gray-50 focus:bg-white font-medium"
            >
              <option value="ALL">Todas as Funções ({members.length})</option>
              <option value="EXECUTOR">Executores ({stats.executors})</option>
              <option value="RESPONSÁVEL">Responsáveis ({stats.responsibles})</option>
              <option value="SUPERVISOR">Supervisores ({stats.supervisors})</option>
              <option value="COLABORADOR">Colaboradores ({stats.collaborators})</option>
              <option value="COORDENADOR">Coordenadores</option>
              <option value="ADMINISTRADOR">Administradores</option>
            </select>
          </div>

          {/* Filter by Category Specialty */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-gray-300 bg-gray-50 focus:bg-white font-medium"
            >
              <option value="ALL">Todas as Especialidades</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-gray-300 bg-gray-50 focus:bg-white font-medium"
            >
              <option value="name">Ordenar: Ordem Alfabética (A-Z)</option>
              <option value="tasks">Ordenar: Mais Tarefas Ativas</option>
              <option value="role">Ordenar: Por Função</option>
            </select>
          </div>
        </div>

        {/* Status / Pagination bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>
              Exibindo <strong>{paginatedMembers.length}</strong> de <strong>{filteredMembers.length}</strong> pessoas encontradas
            </span>
            {filteredMembers.length < members.length && (
              <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                (Filtro ativo de {members.length} cadastrados)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px]">Por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-0.5 text-xs rounded border border-gray-300 bg-white"
            >
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
              <option value="96">96</option>
              <option value="-1">Todos ({members.length})</option>
            </select>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 pl-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-gray-300 bg-white disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-gray-700 px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded border border-gray-300 bg-white disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                  title="Próxima página"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members Grid */}
      {paginatedMembers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Nenhum membro encontrado</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Não encontramos nenhum usuário correspondente aos filtros de busca atuais. Tente buscar por outro nome ou limpar os filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {paginatedMembers.map((member) => {
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
                              Controle Interno
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
                      <span className="truncate">
                        {member.email?.includes('@interno.app') ? 'Registro Interno (Sem Login)' : member.email}
                      </span>
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
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 bg-white disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 7 && currentPage > 4) {
                pageNum = currentPage - 3 + i;
                if (pageNum > totalPages) pageNum = totalPages - (6 - i);
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 bg-white disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition shadow-2xs"
          >
            <span>Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

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
