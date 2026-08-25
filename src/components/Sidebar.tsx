import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  ChevronDown,
  DollarSign,
  FileText,
  HardHat,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Settings,
  Shield,
  ShieldCheck,
  Tag,
  Trello,
  User,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { isOverdue } from '../utils/priority';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, setMobileOpen }) => {
  const {
    activeTab,
    setActiveTab,
    openNewServiceModal,
    openProblemTemplatesModal,
    openUserManagementModal,
    setIsAuthModalOpen,
    logout,
    firebaseUser,
    services,
    currentUser,
    setCurrentUser,
    problemTemplates,
    members,
  } = useMaintenance();

  const myTasksCount = services.filter((s) => {
    const currentName = currentUser.name.toLowerCase().trim();
    const rName = (s.responsibleName || '').toLowerCase().trim();
    const eName = (s.executorName || '').toLowerCase().trim();
    const sName = (s.supervisorName || '').toLowerCase().trim();
    const sNames = (s.supervisorNames || []).map((n) => n.toLowerCase().trim());
    return (
      (rName === currentName || eName === currentName || sName === currentName || sNames.includes(currentName)) &&
      s.status !== 'CONCLUÍDO' &&
      s.status !== 'CANCELADO'
    );
  }).length;

  const overdueCount = services.filter((s) => isOverdue(s.dueDate, s.status)).length;
  const highRiskCount = services.filter(
    (s) => s.isHighRisk && s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO'
  ).length;
  const needsTMCount = services.filter(
    (s) => s.needsTM && s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO'
  ).length;

  const isPublic = !firebaseUser;

  const navPrincipal = isPublic
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        {
          id: 'kanban',
          label: 'Kanban',
          icon: Trello,
          badge: services.filter((s) => s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO').length,
        },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        {
          id: 'kanban',
          label: 'Kanban',
          icon: Trello,
          badge: services.filter((s) => s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO').length,
        },
        {
          id: 'mytasks',
          label: 'Minhas Tarefas & Supervisão',
          icon: User,
          badge: myTasksCount > 0 ? myTasksCount : null,
          badgeColor: 'bg-blue-600 text-white',
        },
        { id: 'categories', label: 'Categorias', icon: Tag, badge: null },
      ];

  const navGestao = [
    { id: 'responsibles', label: 'Equipe & Responsáveis', icon: Users, badge: members.length },
    { id: 'locations', label: 'Locais do Salão', icon: MapPin, badge: null },
    { id: 'budget', label: 'Orçamento', icon: DollarSign, badge: null },
    { id: 'reports', label: 'Relatórios', icon: FileText, badge: null },
    { id: 'settings', label: 'Configurações', icon: Settings, badge: null },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      <aside
        id="main-sidebar"
        className={`w-64 bg-[#111827] flex flex-col shrink-0 text-gray-400 text-xs font-medium z-50 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'fixed inset-y-0 left-0 translate-x-0' : 'fixed inset-y-0 left-0 -translate-x-full lg:relative lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-xs">
              SR
            </div>
            <div>
              <span className="text-white font-semibold text-sm leading-tight block">
                Manutenção SR
              </span>
              <span className="text-[10px] text-gray-400 font-normal">
                Salão do Reino (Oficial)
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="px-3 pt-3 pb-1 space-y-1.5">
          <button
            id="btn-sidebar-new-problem"
            onClick={() => {
              if (!firebaseUser) {
                setIsAuthModalOpen(true);
              } else {
                openNewServiceModal();
              }
              if (setMobileOpen) setMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NOVO PROBLEMA</span>
          </button>

          {!isPublic && (
            <button
              onClick={() => {
                openProblemTemplatesModal();
                if (setMobileOpen) setMobileOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-[11px] rounded transition-colors border border-gray-700 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Base Pré-fixada</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 font-bold text-[10px]">
                {problemTemplates.length}
              </span>
            </button>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-2 text-gray-400 text-xs font-medium space-y-3">
          {/* Menu Principal */}
          <div>
            <div className="px-4 py-1.5 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
              Menu Principal
            </div>
            <div className="space-y-0.5 px-2">
              {navPrincipal.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 text-[10px] rounded font-bold ${
                          isActive
                            ? 'bg-blue-700 text-white'
                            : item.badgeColor || 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gestão (Somente visível para usuários autenticados) */}
          {!isPublic && (
            <div>
              <div className="flex items-center justify-between px-4 py-1.5 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                <span>Gestão</span>
                <button
                  onClick={() => openUserManagementModal()}
                  className="text-[10px] font-normal text-blue-400 hover:text-blue-300 flex items-center gap-0.5 cursor-pointer lowercase"
                  title="Cadastrar novo membro"
                >
                  <UserPlus className="w-3 h-3" /> +usuário
                </button>
              </div>
              <div className="space-y-0.5 px-2">
                {navGestao.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-item-${item.id}`}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== null && item.badge !== undefined && (
                        <span className="px-1.5 py-0.2 text-[10px] rounded font-bold bg-gray-800 text-gray-400">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status de Atenção */}
          <div className="pt-1">
            <div className="px-4 py-1 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
              Status de Atenção
            </div>
            <div className="space-y-1 px-3 mt-1">
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-gray-800/80 rounded text-[11px]">
                <span className="flex items-center gap-1.5 text-red-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> Atrasados
                </span>
                <span className="font-bold text-red-400">{overdueCount}</span>
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 bg-gray-800/80 rounded text-[11px]">
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <HardHat className="w-3.5 h-3.5" /> Alto Risco
                </span>
                <span className="font-bold text-amber-400">{highRiskCount}</span>
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 bg-gray-800/80 rounded text-[11px]">
                <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Consulta TM
                </span>
                <span className="font-bold text-blue-400">{needsTMCount}</span>
              </div>
            </div>
          </div>
        </nav>

        {/* User Role Profile Switcher & Auth status */}
        <div className="p-3 bg-gray-900 border-t border-gray-800 space-y-2">
          {isPublic ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                  Área Pública
                </span>
                <span className="text-[10px] text-gray-500 font-medium">Modo Visualização</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(true);
                  if (setMobileOpen) setMobileOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-colors shadow-xs cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                  Perfil Conectado
                </span>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                >
                  Opções
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs"
                  style={{ backgroundColor: currentUser.avatarColor || '#2563EB' }}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <select
                      id="select-current-user"
                      value={currentUser.id}
                      onChange={(e) => {
                        const found = members.find((m) => m.id === e.target.value);
                        if (found) setCurrentUser(found);
                      }}
                      className="w-full bg-gray-800 text-white text-xs font-semibold rounded px-2 py-1 pr-6 border border-gray-700 focus:outline-none appearance-none cursor-pointer truncate"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-2 pointer-events-none" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                    <span className="truncate">{currentUser.role}</span>
                    <span className="text-emerald-400 font-bold ml-1">• Online</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

