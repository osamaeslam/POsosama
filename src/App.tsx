import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { POSScreen } from './components/pos/POSScreen';
import { ProductsScreen } from './components/products/ProductsScreen';
import { StockAlertsScreen } from './components/stock/StockAlertsScreen';
import { InvoicesScreen } from './components/invoices/InvoicesScreen';
import { ExpensesScreen } from './components/expenses/ExpensesScreen';
import { DebtsScreen } from './components/customers/DebtsScreen';
import { SessionsScreen } from './components/shifts/SessionsScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

const MainAppContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'pos':
        return <POSScreen />;
      case 'debts':
        return <DebtsScreen />;
      case 'products':
        return <ProductsScreen />;
      case 'stock-alerts':
        return <StockAlertsScreen />;
      case 'invoices':
        return <InvoicesScreen />;
      case 'expenses':
        return <ExpensesScreen />;
      case 'sessions':
        return <SessionsScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="app-shell flex h-screen w-screen min-w-0 overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased select-none">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header />
        <main className="app-main flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden relative flex flex-col">
          {renderActiveScreen()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
