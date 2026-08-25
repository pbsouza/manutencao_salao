import React from 'react';
import {
  FolderKanban,
  LayoutDashboard,
  LogIn,
  Menu,
  Plus,
  Trello,
  User,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { isOverdue } from '../utils/priority';

interface BottomNavBarProps {
  onOpenMobileMenu: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ onOpenMobileMenu }) => {
  const {
    activeTab,
    setActiveTab,
    openNewServiceModal,
    setIsAuthModalOpen,
    firebaseUser,
    services,
    currentUser,
    hasRestrictedAccess,
    isUserApproved,
  } = useMaintenance();

  const isPublic = !hasRestrictedAccess;
  const currentName = (currentUser.name || '').toLowerCase().trim();

  // Count active tasks for current user
  const myTasksCount = services.filter((s) => {
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

  const openCount = services.filter(
    (s) => s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO'
  ).length;

  if (isPublic) {
    return (
      <nav
        id="mobile-bottom-navbar-public"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-1.5 flex items-center justify-around shadow-lg select-none"
      >
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-blue-600 font-bold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span className="text-[11px] leading-tight tracking-tight">Dashboard</span>
        </button>

        {/* 2. Kanban */}
        <button
          type="button"
          onClick={() => setActiveTab('kanban')}
          className={`relative flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'kanban'
              ? 'text-blue-600 font-bold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trello className="w-4 h-4 mb-0.5" />
          <span className="text-[11px] leading-tight tracking-tight">Kanban</span>
          {openCount > 0 && (
            <span className="absolute top-1 right-1/4 min-w-3.5 h-3.5 px-0.5 bg-blue-600 text-white rounded-full text-[8px] font-black flex items-center justify-center">
              {openCount > 99 ? '99+' : openCount}
            </span>
          )}
        </button>

        {/* 3. Auth Status Button */}
        {!firebaseUser ? (
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 transition-colors cursor-pointer font-semibold"
          >
            <LogIn className="w-4 h-4 mb-0.5" />
            <span className="text-[11px] leading-tight tracking-tight">Entrar</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer font-semibold"
          >
            <User className="w-4 h-4 mb-0.5 text-amber-600" />
            <span className="text-[10px] leading-tight tracking-tight text-amber-700">Pendente ADM</span>
          </button>
        )}
      </nav>
    );
  }

  return (
    <nav
      id="mobile-bottom-navbar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg select-none"
    >
      {/* 1. Dashboard */}
      <button
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-1 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'dashboard'
            ? 'text-blue-600 font-bold bg-blue-50/80'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutDashboard className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] leading-tight tracking-tight">Painel</span>
      </button>

      {/* 2. Kanban */}
      <button
        type="button"
        onClick={() => setActiveTab('kanban')}
        className={`relative flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-1 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'kanban'
            ? 'text-blue-600 font-bold bg-blue-50/80'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Trello className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] leading-tight tracking-tight">Quadro</span>
        {openCount > 0 && (
          <span className="absolute top-1 right-2.5 min-w-3.5 h-3.5 px-0.5 bg-blue-600 text-white rounded-full text-[8px] font-black flex items-center justify-center">
            {openCount > 99 ? '99+' : openCount}
          </span>
        )}
      </button>

      {/* 3. Central Action: + NOVO */}
      <button
        type="button"
        id="btn-bottom-bar-new-problem"
        onClick={() => openNewServiceModal()}
        className="flex flex-col items-center justify-center -mt-4 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full w-11 h-11 shadow-md hover:shadow-lg active:scale-95 transition cursor-pointer border-2 border-white shrink-0"
        title="Registrar Novo Problema"
        aria-label="Registrar Novo Problema"
      >
        <Plus className="w-5 h-5 font-black" />
      </button>

      {/* 4. Minhas Tarefas */}
      <button
        type="button"
        onClick={() => setActiveTab('mytasks')}
        className={`relative flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-1 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'mytasks'
            ? 'text-blue-600 font-bold bg-blue-50/80'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <User className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] leading-tight tracking-tight">Tarefas</span>
        {myTasksCount > 0 && (
          <span className="absolute top-1 right-2.5 min-w-3.5 h-3.5 px-0.5 bg-emerald-600 text-white rounded-full text-[8px] font-black flex items-center justify-center">
            {myTasksCount}
          </span>
        )}
      </button>

      {/* 5. Mais / Menu Drawer */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-1 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <Menu className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] leading-tight tracking-tight">Menu</span>
      </button>
    </nav>
  );
};
