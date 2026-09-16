import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Coins,
  Globe,
  Lock,
  LogOut,
  ShieldCheck,
  Store,
  UserCheck,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    t,
    language,
    setLanguage,
    currentUser,
    setCurrentUser,
    users,
    logout,
    currentShift,
    openShift,
    closeShift,
    setActiveTab,
    settings,
    isOnline,
  } = useApp();

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState('1000');
  const [closingCashInput, setClosingCashInput] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const drawerCash = currentShift
    ? Number(currentShift.openingCash || 0) +
      Number(currentShift.totalCashSales || 0) +
      Number(currentShift.totalDebtCollectionsCash || 0) -
      Number(currentShift.totalRefunds || 0) -
      Number(currentShift.totalExpenses || 0)
    : 0;

  const handleOpenShift = () => {
    openShift(parseFloat(openingCashInput) || 0);
    setShowShiftModal(false);
  };

  const handleCloseShift = () => {
    closeShift(parseFloat(closingCashInput) || 0);
    setShowShiftModal(false);
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 min-w-0">
        {/* Logo & Store name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm overflow-hidden shrink-0">
            <img
              src="/assets/iconr.png"
              alt="Bayaa"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Store className="w-5 h-5 hidden" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-lg leading-tight truncate">
                {settings.storeName || t.appName}
              </h1>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs shrink-0"
                title="حالة النظام: أوفلاين محلي نشط 100%"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">
                  {isOnline ? 'أوفلاين محلي (نشط 100%)' : 'أوفلاين كامل (بدون نت)'}
                </span>
                <span className="sm:hidden">أوفلاين نشط</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 truncate">{t.systemSubtitle}</p>
          </div>
        </div>

        {/* Center: Shift status */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-50 border border-slate-200/80 px-4 py-1.5 rounded-xl">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                currentShift ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs font-medium text-slate-700">
              {currentShift ? t.shiftOpen : t.shiftClosed}
            </span>
          </div>

          {currentShift && (
            <>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Coins className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.drawerCash}:</span>
                <span className="font-bold text-slate-900">
                  {drawerCash.toLocaleString()} {settings.currency}
                </span>
              </div>
            </>
          )}

          <button
            onClick={() => setShowShiftModal(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            {currentShift ? t.closeShift : t.openShift}
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Globe className="w-4 h-4" />
            <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* User selector & Logout */}
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-right cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                {currentUser.displayName.charAt(0)}
              </div>
              <div className="hidden sm:block text-xs">
                <div className="font-semibold text-slate-900 leading-tight">
                  {currentUser.displayName}
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentUser.role === 'manager' || currentUser.role === 'admin'
                    ? t.roleManager
                    : t.roleCashier}
                </div>
              </div>
            </button>

            {/* Quick Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
              title="تسجيل الخروج / قفل الشاشة"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {showUserMenu && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  {t.switchUser}
                </div>
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setShowUserMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                      currentUser.id === user.id ? 'bg-blue-50/70 text-blue-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user.displayName}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {user.role === 'manager' || user.role === 'admin' ? t.roleManager : t.roleCashier}
                    </span>
                  </button>
                ))}

                <div className="pt-1 mt-1 border-t border-slate-100 px-1.5">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-bold cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج (قفل)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              {currentShift ? t.closeShift : t.openShift}
            </h3>

            {currentShift ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  عند إغلاق الوردية، يتم مطابقة المبلغ الفعلي المسلم من الكاشير مع مبيعات النظام.
                </p>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-500">رصيد عهدة البداية:</span>
                    <span className="font-semibold font-mono">
                      {Number(currentShift.openingCash || 0).toLocaleString()} {settings.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">مبيعات نقدية (كاش الدرج):</span>
                    <span className="font-semibold text-emerald-600 font-mono">
                      +{Number(currentShift.totalCashSales || 0).toLocaleString()} {settings.currency}
                    </span>
                  </div>
                  {(currentShift.totalDebtCollectionsCash || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">تحصيلات ديون نقدية:</span>
                      <span className="font-semibold text-emerald-600 font-mono">
                        +{Number(currentShift.totalDebtCollectionsCash).toLocaleString()} {settings.currency}
                      </span>
                    </div>
                  )}
                  {(currentShift.totalRefunds || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">مرتجعات نقدية مستردة للعملاء:</span>
                      <span className="font-semibold text-rose-600 font-mono">
                        -{Number(currentShift.totalRefunds).toLocaleString()} {settings.currency}
                      </span>
                    </div>
                  )}
                  {(currentShift.totalExpenses || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">مصروفات ومسحوبات نقدية:</span>
                      <span className="font-semibold text-rose-600 font-mono">
                        -{Number(currentShift.totalExpenses).toLocaleString()} {settings.currency}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                    <span>النقدية المتوقعة بالدرج:</span>
                    <span className="text-emerald-700 font-mono">
                      {drawerCash.toLocaleString()} {settings.currency}
                    </span>
                  </div>
                  {((currentShift.totalWalletSales || 0) > 0 || (currentShift.totalCreditSales || 0) > 0) && (
                    <div className="pt-2 border-t border-dashed border-slate-200 text-[10px] text-slate-500 space-y-0.5">
                      {(currentShift.totalWalletSales || 0) > 0 && (
                        <div>• مبيعات محافظ إلكترونية (لا تدخل الدرج): {Number(currentShift.totalWalletSales).toLocaleString()} {settings.currency}</div>
                      )}
                      {(currentShift.totalCreditSales || 0) > 0 && (
                        <div>• مبيعات آجل على الحساب (لا تدخل الدرج): {Number(currentShift.totalCreditSales).toLocaleString()} {settings.currency}</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.closingBalance} ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={closingCashInput}
                    onChange={(e) => setClosingCashInput(e.target.value)}
                    placeholder={drawerCash.toString()}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowShiftModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleCloseShift}
                    className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-sm"
                  >
                    {t.closeShift}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  ابدأ وردية بيع جديدة باسم ({currentUser.displayName}). حدد رصيد العهدة النقدية في الدرج.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.openingBalance} ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowShiftModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleOpenShift}
                    className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer shadow-sm"
                  >
                    {t.openShift}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
