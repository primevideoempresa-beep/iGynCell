import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { ServiceOrdersList } from './components/orders/ServiceOrdersList';
import { SalesList } from './components/sales/SalesList';
import { InventoryList } from './components/inventory/InventoryList';
import { TechPartsList } from './components/parts/TechPartsList';
import { ClientsList } from './components/clients/ClientsList';
import { FinancialDashboard } from './components/financial/FinancialDashboard';
import { CommissionsList } from './components/commissions/CommissionsList';
import { EmployeesList } from './components/employees/EmployeesList';
import { NotificationsPanel } from './components/notifications/NotificationsPanel';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { ServiceOrderModal } from './components/orders/ServiceOrderModal';
import { NewSaleModal } from './components/sales/NewSaleModal';
import { Reauth2FAModal } from './components/auth/Reauth2FAModal';

const MainAppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentTab } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNewOSOpen, setIsNewOSOpen] = useState(false);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);

  if (!currentUser) {
    return <LoginView />;
  }

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <OverviewDashboard
            onOpenNewOS={() => setIsNewOSOpen(true)}
            onOpenNewSale={() => setIsNewSaleOpen(true)}
          />
        );
      case 'orders':
        return <ServiceOrdersList />;
      case 'sales':
        return <SalesList />;
      case 'inventory':
        return <InventoryList />;
      case 'parts':
        return <TechPartsList />;
      case 'clients':
        return <ClientsList />;
      case 'financial':
        return <FinancialDashboard />;
      case 'commissions':
        return <CommissionsList />;
      case 'employees':
        return <EmployeesList />;
      case 'notifications':
        return <NotificationsPanel />;
      case 'audit':
        return <AuditLogsView />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return (
          <OverviewDashboard
            onOpenNewOS={() => setIsNewOSOpen(true)}
            onOpenNewSale={() => setIsNewSaleOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Lateral Menu Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main View Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewOS={() => setIsNewOSOpen(true)}
          onOpenNewSale={() => setIsNewSaleOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {renderActiveTab()}
          </div>
        </main>
      </div>

      {/* Quick Access Global Modals */}
      <ServiceOrderModal
        isOpen={isNewOSOpen}
        onClose={() => setIsNewOSOpen(false)}
      />

      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
      />

      {/* 2FA Session Expiration & Reauthentication Modal */}
      <Reauth2FAModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </AuthProvider>
  );
}
