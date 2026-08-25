import React, { useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { BatchAssignModal } from './components/BatchAssignModal';
import { BottomNavBar } from './components/BottomNavBar';
import { BudgetView } from './components/BudgetView';
import { CategoriesView } from './components/CategoriesView';
import { DashboardView } from './components/DashboardView';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { LocationsView } from './components/LocationsView';
import { MyTasksView } from './components/MyTasksView';
import { NewServiceModal } from './components/NewServiceModal';
import { ProblemTemplatesModal } from './components/ProblemTemplatesModal';
import { ReportsView } from './components/ReportsView';
import { ResponsiblesView } from './components/ResponsiblesView';
import { SafetyConfirmationModal } from './components/SafetyConfirmationModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { UserManagementModal } from './components/UserManagementModal';
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
  } = useMaintenance();

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const isPublic = !firebaseUser;
  const currentActiveTab = isPublic && activeTab !== 'dashboard' && activeTab !== 'kanban'
    ? 'dashboard'
    : activeTab;

  React.useEffect(() => {
    if (isPublic && activeTab !== 'dashboard' && activeTab !== 'kanban') {
      setActiveTab('dashboard');
    }
  }, [isPublic, activeTab, setActiveTab]);

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

        {/* Global Filter Bar (shown on Kanban/MyTasks when toggled on) */}
        {(currentActiveTab === 'kanban' || currentActiveTab === 'mytasks') && showFilters && <FilterBar />}

        {/* Dynamic Workspace Views with bottom safe padding on mobile for bottom bar */}
        <main className="flex-1 min-h-0 relative bg-gray-100/60 pb-16 md:pb-0">
          {currentActiveTab === 'kanban' && (
            <KanbanBoard
              onSelectService={(service) => selectService(service)}
              onRequireSafetyModal={(service) => openSafetyModal(service)}
            />
          )}
          {currentActiveTab === 'dashboard' && <DashboardView />}
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
