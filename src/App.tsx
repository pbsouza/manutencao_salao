import React, { useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { BatchAssignModal } from './components/BatchAssignModal';
import { BottomNavBar } from './components/BottomNavBar';
import { BudgetView } from './components/BudgetView';
import { CategoriesView } from './components/CategoriesView';
import { DashboardView } from './components/DashboardView';
import { EquipmentInventoryView } from './components/EquipmentInventoryView';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { LocationsView } from './components/LocationsView';
import { MyTasksView } from './components/MyTasksView';
import { NewServiceModal } from './components/NewServiceModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { PreventiveScheduleView } from './components/PreventiveScheduleView';
import { ProblemTemplatesModal } from './components/ProblemTemplatesModal';
import { ReportsView } from './components/ReportsView';
import { ResponsiblesView } from './components/ResponsiblesView';
import { SafetyConfirmationModal } from './components/SafetyConfirmationModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { UserManagementModal } from './components/UserManagementModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { NotificationToast } from './components/NotificationToast';
import { MaintenanceProvider, useMaintenance } from './context/MaintenanceContext';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedService,
    closeServiceDetail,
    selectService,
    openSafetyModal,
    firebaseUser,
    hasRestrictedAccess,
    isUserApproved,
    currentUser,
    setIsAuthModalOpen,
  } = useMaintenance();

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Sem liberação do ADM, mesmo logado, aparece somente a área pública (dashboard, kanban e preventivas)
  const isPublic = !hasRestrictedAccess;
  const isPublicAllowedTab = activeTab === 'dashboard' || activeTab === 'kanban' || activeTab === 'preventive';
  const currentActiveTab = isPublic && !isPublicAllowedTab
    ? 'dashboard'
    : activeTab;

  React.useEffect(() => {
    if (isPublic && !isPublicAllowedTab) {
      setActiveTab('dashboard');
    }
  }, [isPublic, isPublicAllowedTab, setActiveTab]);

  return (
    <div id="main-app-root" className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden select-none">
      {/* Fixed Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Workspace - Unified scrollable container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden">
        {/* Top Header */}
        <Header
          onToggleMobile={() => setMobileSidebarOpen((prev) => !prev)}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />

        {/* Pending Admin Approval Banner */}
        {firebaseUser && !isUserApproved && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>
                <strong>Acesso Pendente:</strong> Olá, <strong>{currentUser.name}</strong>! Você está logado, mas o acesso à área restrita aguarda liberação pelo Administrador. Você está visualizando a <strong>área pública</strong>.
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-md border border-amber-300 transition text-[11px] cursor-pointer shrink-0"
            >
              Ver Status da Conta
            </button>
          </div>
        )}

        {/* Global Filter Bar (shown on Kanban/MyTasks when toggled on) */}
        {(currentActiveTab === 'kanban' || currentActiveTab === 'mytasks') && showFilters && <FilterBar />}

        {/* Dynamic Workspace Views with generous bottom safe padding on mobile for bottom bar */}
        <main className="flex-1 min-h-0 relative bg-gray-100/60 pb-32 sm:pb-36 md:pb-12">
          {currentActiveTab === 'kanban' && (
            <KanbanBoard
              onSelectService={(service) => selectService(service)}
              onRequireSafetyModal={(service) => openSafetyModal(service)}
            />
          )}
          {currentActiveTab === 'dashboard' && <DashboardView />}
          {currentActiveTab === 'preventive' && <PreventiveScheduleView />}
          {!isPublic && currentActiveTab === 'equipments' && <EquipmentInventoryView />}
          {!isPublic && currentActiveTab === 'mytasks' && (
            <MyTasksView onSelectService={(service) => selectService(service)} />
          )}
          {!isPublic && currentActiveTab === 'categories' && <CategoriesView />}
          {!isPublic && currentActiveTab === 'responsibles' && <ResponsiblesView />}
          {!isPublic && currentActiveTab === 'locations' && <LocationsView />}
          {!isPublic && currentActiveTab === 'budget' && <BudgetView />}
          {!isPublic && currentActiveTab === 'reports' && <ReportsView />}
          {!isPublic && currentActiveTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar onOpenMobileMenu={() => setMobileSidebarOpen(true)} />

      {/* Modals & Dialogs */}
      <NewServiceModal />
      <ServiceDetailModal service={selectedService} onClose={closeServiceDetail} />
      <SafetyConfirmationModal />
      <AuthModal />
      <UserManagementModal />
      <ProblemTemplatesModal />
      <BatchAssignModal />
      <NotificationCenterModal />
      <NotificationToast />
      <PWAInstallBanner />
    </div>
  );
};

export default function App() {
  return (
    <MaintenanceProvider>
      <MainAppContent />
    </MaintenanceProvider>
  );
}
