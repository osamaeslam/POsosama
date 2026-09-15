import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Coins,
  Globe,
  Lock,
  LogOut,
  PlusCircle,
  ShieldCheck,
  Store,
  UserCheck,
  CheckCircle2,
  Monitor,
  X,
  Activity,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { SystemHealthModal } from './SystemHealthModal';

export const Header: React.FC = () => {
  const {
    t,
    language,
    setLanguage,
    currentUser,
    setCurrentUser,
    users,
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    } else {
      setShowDesktopModal(true);
    }
  };

  const drawerCash = currentShift
    ? currentShift.openingCash +
      currentShift.totalSales -
      currentShift.totalRefunds -
      currentShift.totalExpenses
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
              <button
                onClick={() => setShowHealthModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-300 transition-all cursor-pointer shadow-2xs group shrink-0"
                title="حالة النظام: أوفلاين محلي نشط 100% • انقر لعرض فحص الأداء وتنظيف الذاكرة المؤقتة"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">
                  {isOnline ? 'أوفلاين محلي (نشط 100%)' : 'أوفلاين كامل (بدون نت)'}
                </span>
                <span className="sm:hidden">أوفلاين نشط</span>
                <Sparkles className="w-3 h-3 text-emerald-600 group-hover:rotate-12 transition-transform shrink-0" />
              </button>
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
        <div className="flex items-center gap-2.5">
          {/* Desktop Install / Offline button */}
          <button
            onClick={handleInstallClick}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200"
            title="تشغيل وتثبيت التطبيق على سطح المكتب ديسكتوب بدون إنترنت"
          >
            <Monitor className="w-3.5 h-3.5 text-blue-600" />
            <span>تثبيت ديسكتوب</span>
          </button>

          {/* Quick Speed & Health Check */}
          <button
            onClick={() => setShowHealthModal(true)}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-emerald-200/80"
            title="فحص حالة الأداء وتنظيف الذاكرة المؤقتة"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>تسريع وتنظيف</span>
          </button>

          {/* Quick POS action */}
          <button
            onClick={() => setActiveTab('pos')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.pos}</span>
          </button>

          {/* Language Switch */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Globe className="w-4 h-4" />
            <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* User selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-right cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
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

            {showUserMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">رصيد البداية:</span>
                    <span className="font-semibold">
                      {currentShift.openingCash.toLocaleString()} {settings.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">مبيعات الوردية:</span>
                    <span className="font-semibold text-emerald-600">
                      +{currentShift.totalSales.toLocaleString()} {settings.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">المصروفات:</span>
                    <span className="font-semibold text-rose-600">
                      -{currentShift.totalExpenses.toLocaleString()} {settings.currency}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
                    <span>{t.expectedBalance}:</span>
                    <span>
                      {drawerCash.toLocaleString()} {settings.currency}
                    </span>
                  </div>
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

      {/* Desktop App Installation Guidance Modal */}
      {showDesktopModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                <span>تشغيل وتثبيت Osama Pos كبرنامج ديسكتوب أوفلاين</span>
              </h3>
              <button
                onClick={() => setShowDesktopModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-medium">
                ✅ <strong>نعم له حل كامل!</strong> يمكنك تشغيل البرنامج ديسكتوب أوفلاين بطريقتين مضمونتين 100%:
              </div>

              {/* Method 1: PWA Desktop Install */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <h4 className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>الطريقة الأسرع (تثبيت بنقرة واحدة - بدون أي برامج تجميع):</span>
                </h4>
                <p className="text-slate-700">
                  من متصفح <strong>Google Chrome</strong> أو <strong>Microsoft Edge</strong>:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pr-1">
                  <li>
                    ستجد في شريط العنوان بالأعلى أيقونة شاشة كمبيوتر صغيرة مكتوب عليها <strong>تثبيت التطبيق / Install App</strong>.
                  </li>
                  <li>
                    أو اضغط على زر القائمة (⋮) ثم اختر <strong>"تثبيت Osama Pos"</strong>.
                  </li>
                  <li>
                    سيتم إنشاء أيقونة على سطح المكتب للبرنامج ويفتح في نافذة مستقلة كبرنامج أصلي بدون إنترنت!
                  </li>
                </ul>
              </div>

              {/* Method 2: Local Windows Launcher / .exe */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>تشغيل كبرنامج ويندوز أو تحويله إلى ملف تنفيذي (.exe):</span>
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <p>
                    • تم إنشاء ملف تشغيل سريع في المجلد الرئيسي اسمه: <code className="bg-slate-200 text-slate-900 px-1 py-0.5 rounded font-mono text-[11px]">تشغيل-الديسكتوب.bat</code> — اضغط عليه مرتين وسيعمل فوراً كنافذة مستقلة.
                  </p>
                  <p>
                    • تم حل مشكلة التحويل إلى <code className="bg-slate-200 text-slate-900 px-1 py-0.5 rounded font-mono text-[11px]">.exe</code> عبر جعل التخزين مرناً لا يعتمد على مكتبات C++ المعقدة. يمكنك تشغيل ملف: <code className="bg-slate-200 text-slate-900 px-1 py-0.5 rounded font-mono text-[11px]">بناء-ملف-exe.bat</code> لتوليد البرنامج التنفيذي مباشرة.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <div className="font-bold">💡 ملاحظة هامة لحفظ البيانات:</div>
                <div>البيانات تُحفظ بالكامل محلياً على جهازك، ويمكنك في أي وقت تصدير نسخة احتياطية بنقرة واحدة من شاشة الإعدادات.</div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setShowDesktopModal(false)}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer shadow-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Health & Cache Maintenance Modal */}
      <SystemHealthModal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
      />
    </header>
  );
};
