import React from 'react';
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
  Database,
  Users,
} from 'lucide-react';
import { ActiveTab } from '../../types';

export const Sidebar: React.FC = () => {
  const { t, activeTab, setActiveTab, products, customers, currentUser } = useApp();

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const debtCustomersCount = customers.filter((c) => c.totalDebt > 0).length;

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
    { id: 'products', label: t.products, icon: Boxes },
    { id: 'stock-alerts', label: t.stockAlerts, icon: AlertTriangle, badge: lowStockCount },
    { id: 'expenses', label: t.expenses, icon: Wallet },
    { id: 'sessions', label: t.sessions, icon: CalendarDays },
    { id: 'reports', label: t.reports, icon: BarChart3, managerOnly: true },
    { id: 'settings', label: t.settings, icon: Settings, managerOnly: true },
  ];

  const isManager = currentUser.role === 'admin' || currentUser.role === 'manager';

  return (
    <aside className="no-print w-64 max-w-[35vw] bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand area */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <img
          src="/assets/icon.png"
          alt="Bayaa POS"
          className="w-9 h-9 rounded-lg object-contain bg-blue-500/10 p-1"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div>
          <div className="text-white font-black tracking-wide text-base flex items-center gap-2">
            <span>{t.appName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
              PRO
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Desktop & Web POS</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.managerOnly && !isManager) return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
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
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            تخزين محلي نشط
          </span>
          <span className="text-slate-500 font-mono text-[10px]">v1.0.0</span>
        </div>
        <div className="text-[10px] text-slate-500 leading-tight">
          يعمل بدون اتصال بالإنترنت مع حفظ دائم في المتصفح.
        </div>
      </div>
    </aside>
  );
};
