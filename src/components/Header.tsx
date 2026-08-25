import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  Filter,
  Layers,
  LogIn,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { exportServicesToExcel, exportServicesToPDF } from '../utils/export';

interface HeaderProps {
  onToggleMobile: () => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobile,
  showFilters,
  setShowFilters,
}) => {
  const {
    activeTab,
    filterState,
    setFilterState,
    resetFilters,
    openNewServiceModal,
    openProblemTemplatesModal,
    openBatchAssignModal,
    setIsAuthModalOpen,
    currentUser,
    firebaseUser,
    services,
    problemTemplates,
  } = useMaintenance();

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Indicadores';
      case 'kanban':
        return 'Quadro Kanban';
      case 'mytasks':
        return 'Minhas Tarefas';
      case 'categories':
        return 'Categorias';
      case 'responsibles':
        return 'Equipe & Usuários';
      case 'locations':
        return 'Locais do Salão';
      case 'budget':
        return 'Orçamento';
      case 'reports':
        return 'Relatórios';
      case 'settings':
        return 'Configurações';
      default:
        return 'Manutenção SR';
    }
  };

  const getFullPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Painel de Indicadores & Métricas';
      case 'kanban':
        return 'Quadro de Manutenção & Reparos';
      case 'mytasks':
        return 'Minhas Tarefas Designadas';
      case 'categories':
        return 'Categorias e Soluções';
      case 'responsibles':
        return 'Equipe & Responsáveis';
      case 'locations':
        return 'Locais do Salão do Reino';
      case 'budget':
        return 'Controle Orçamentário';
      case 'reports':
        return 'Relatórios & Exportação';
      case 'settings':
        return 'Configurações do Sistema';
      default:
        return 'Manutenção Salão do Reino';
    }
  };

  const hasActiveFilters =
    filterState.search ||
    filterState.category ||
    filterState.problem ||
    filterState.responsible ||
    filterState.priority ||
    filterState.risk ||
    filterState.status ||
    filterState.location ||
    filterState.forecastMonth ||
    filterState.onlyOverdue ||
    filterState.onlyNeedsTM ||
    filterState.onlyHighRisk;

  return (
    <header
      id="main-app-header"
      className="min-h-12 sm:min-h-14 bg-white border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4 shrink-0 text-gray-900 shadow-2xs relative select-none"
    >
      {/* Left Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button
          id="btn-mobile-menu-toggle"
          onClick={onToggleMobile}
          className="lg:hidden p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 tracking-tight leading-none truncate">
            <span className="md:hidden">{getPageTitle()}</span>
            <span className="hidden md:inline">{getFullPageTitle()}</span>
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
              19 Cat.
            </span>
            <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
              GUT
            </span>
          </div>
        </div>
      </div>

      {/* Center / Right: Search & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile Search Toggle */}
        <button
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="md:hidden p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
          title="Buscar"
          aria-label="Buscar serviços"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Global search (Desktop) */}
        <div className="relative hidden md:block w-36 lg:w-56">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            id="input-global-search"
            type="text"
            placeholder="Buscar serviços..."
            value={filterState.search}
            onChange={(e) =>
              setFilterState((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 text-xs rounded-lg pl-8 pr-7 py-1.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {filterState.search && (
            <button
              onClick={() =>
                setFilterState((prev) => ({ ...prev, search: '' }))
              }
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Problemas Pré-fixados Button (Autenticado) */}
        {firebaseUser && (
          <button
            onClick={openProblemTemplatesModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
            title="Ver problemas e soluções técnicas pré-fixadas"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Base Pré-fixada</span>
            <span className="px-1.5 py-0.2 rounded bg-blue-200 text-blue-800 text-[10px]">
              {problemTemplates.length}
            </span>
          </button>
        )}

        {/* Designação em Massa (Autenticado) */}
        {firebaseUser && (
          <button
            onClick={() => openBatchAssignModal()}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer"
            title="Designar múltiplos problemas para executores ou supervisores"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Designar em Massa</span>
          </button>
        )}

        {/* Filter Toggle Button */}
        {(activeTab === 'kanban' || activeTab === 'mytasks') && (
          <button
            id="btn-toggle-filters"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            )}
          </button>
        )}

        {/* Export Quick Menu */}
        <div className="hidden lg:flex items-center">
          <button
            id="btn-quick-export-pdf"
            title="Exportar Relatório em PDF"
            onClick={() => exportServicesToPDF(services)}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auth / Login Status Button */}
        {firebaseUser ? (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 transition cursor-pointer"
            title="Perfil de Usuário Conectado"
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold shrink-0"
              style={{ backgroundColor: currentUser.avatarColor || '#2563eb' }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <span className="hidden xs:inline max-w-[70px] sm:max-w-[100px] truncate text-[11px] sm:text-xs">
              {firebaseUser.displayName || currentUser.name.split(' ')[0]}
            </span>
          </button>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
            title="Entrar no Sistema"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="inline">Entrar</span>
          </button>
        )}

        {/* Primary "+ NOVO PROBLEMA" Button */}
        <button
          id="btn-header-new-problem"
          onClick={() => {
            if (!firebaseUser) {
              setIsAuthModalOpen(true);
            } else {
              openNewServiceModal();
            }
          }}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">NOVO PROBLEMA</span>
          <span className="sm:hidden">NOVO</span>
        </button>
      </div>

      {/* Mobile Search Overlay Input Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 p-2 bg-white border-b border-gray-200 shadow-md z-30 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar por problema, local, responsável..."
              value={filterState.search}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 text-xs rounded-lg pl-8 pr-7 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
            {filterState.search && (
              <button
                onClick={() => setFilterState((prev) => ({ ...prev, search: '' }))}
                className="absolute right-2.5 top-2.5 text-gray-400 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}
    </header>
  );
};

