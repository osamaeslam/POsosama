import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Boxes,
  AlertTriangle,
  Wallet,
  CalendarDays,
  BarChart3,
  Settings,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Truck,
} from 'lucide-react';
import { ActiveTab } from '../../types';

export const Sidebar: React.FC = () => {
  const { t, activeTab, setActiveTab, products, customers, suppliers = [], currentUser } = useApp();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return window.innerWidth < 1100;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const debtCustomersCount = customers.filter((c) => c.totalDebt > 0).length;
  const supplierPayablesCount = suppliers.filter((s) => (s.totalPayable || 0) > 0).length;

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    managerOnly?: boolean;
  }[] = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'pos', label: t.pos, icon: ShoppingCart },
    { id: 'debts', label: 'العملاء والآجل', icon: Users, badge: debtCustomersCount, badgeColor: 'bg-amber-500' },
    { id: 'invoices', label: t.invoices, icon: Receipt },
    { id: 'suppliers', label: 'فواتير الموردين', icon: Truck, badge: supplierPayablesCount, badgeColor: 'bg-indigo-500' },
    { id: 'products', label: t.products, icon: Boxes },
    { id: 'stock-alerts', label: t.stockAlerts, icon: AlertTriangle, badge: lowStockCount },
    { id: 'expenses', label: t.expenses, icon: Wallet },
    { id: 'sessions', label: t.sessions, icon: CalendarDays },
    { id: 'reports', label: t.reports, icon: BarChart3, managerOnly: true },
    { id: 'settings', label: t.settings, icon: Settings, managerOnly: true },
  ];

  const isManager = currentUser.role === 'admin' || currentUser.role === 'manager';

  return (
    <aside
      className={`no-print bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-56 lg:w-64 max-w-[35vw]'
      }`}
    >
      {/* Brand area */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src="/assets/icon.png"
            alt="Osama Pos"
            className="w-8 h-8 rounded-lg object-contain bg-blue-500/10 p-1 shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-white font-black tracking-wide text-sm flex items-center gap-1.5 truncate">
                <span>{t.appName}</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                  PRO
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">POS أوفلاين</div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer shrink-0 transition-colors"
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.managerOnly && !isManager) return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
              } rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                    isActive ? 'bg-white text-blue-700' : 'bg-rose-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Local Status */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-400">
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                قاعدة بيانات نشطة
              </span>
              <span className="text-slate-500 font-mono text-[9px]">v1.0.0</span>
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              أوفلاين 100% دون إنترنت
            </div>
          </>
        ) : (
          <div className="flex justify-center" title="قاعدة بيانات نشطة أوفلاين">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
