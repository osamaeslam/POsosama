import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Store,
  Printer,
  Database,
  Users,
  Download,
  Upload,
  Save,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { User } from '../../types';

export const SettingsScreen: React.FC = () => {
  const {
    t,
    settings,
    updateSettings,
    users,
    addUser,
    currentUser,
    exportDataJson,
    importDataJson,
    clearToEmptyStore,
  } = useApp();

  // Store form state
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress);
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber);
  const [currency, setCurrency] = useState(settings.currency);
  const [enableTax, setEnableTax] = useState(settings.enableTax);
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');

  const desktopApp = window.bayaaDesktop;

  const handleExportSqlite = async () => {
    if (!desktopApp) return;
    const path = await desktopApp.app.exportBackup();
    setBackupMessage(path ? 'تم تصدير قاعدة البيانات كاملة بنجاح.' : 'تم إلغاء التصدير.');
  };

  const handleRestoreSqlite = async () => {
    if (!desktopApp) return;
    if (!confirm('سيتم استبدال كل بيانات النظام بقاعدة البيانات المختارة ثم إعادة تشغيل التطبيق. هل تريد المتابعة؟')) return;
    try {
      await desktopApp.app.restoreBackup();
    } catch (error) {
      setBackupMessage('فشل الاستعادة: ملف SQLite غير صالح أو تالف.');
    }
  };

  // New User Modal State
  const [isAddUserModal, setIsAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'cashier'>('cashier');
  const [newUserPin, setNewUserPin] = useState('');

  // Save general settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName,
      storeAddress,
      storePhone,
      taxNumber,
      currency,
      enableTax,
      taxRate: parseFloat(taxRate) || 0,
      receiptFooter,
    });
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Handle file import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJson(content);
        if (success) {
          alert('تمت استعادة البيانات بنجاح!');
        } else {
          alert('فشل استيراد الملف: تنسيق غير صالح');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle Add User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPin.trim()) return;

    addUser({
      name: newUserName,
      role: newUserRole,
      pin: newUserPin,
      isActive: true,
    });

    setNewUserName('');
    setNewUserPin('');
    setIsAddUserModal(false);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>{t.settings}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إعدادات المحل، الفاتورة الضريبية، النسخ الاحتياطي وإدارة طاقم الكاشير
          </p>
        </div>

        {saveSuccessMsg && (
          <div className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم حفظ الإعدادات بنجاح!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store & Receipt Configuration (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
          >
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
              <Store className="w-4 h-4 text-blue-600" />
              <span>بيانات المنشأة وتفاصيل الفاتورة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  اسم المتجر / المحل *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  عملة الحسابات
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="ج.م أو SAR أو $"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  عنوان المحل / الفرع
                </label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  رقم الهاتف للتواصل
                </label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  الرقم الضريبي للمنشأة (إن وجد)
                </label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  نسبة الضريبة (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    disabled={!enableTax}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                  />
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableTax}
                      onChange={(e) => setEnableTax(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>تفعيل احتساب الضريبة</span>
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  رسالة تذييل الإيصال (تظهر أسفل الفاتورة)
                </label>
                <textarea
                  rows={2}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </form>

          {/* User Management */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>المستخدمون وموظفو الكاشير</span>
              </h3>

              <button
                onClick={() => setIsAddUserModal(true)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>إضافة كاشير جديد</span>
              </button>
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      {(u.displayName || u.username || '؟').charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{u.displayName || u.username || 'مستخدم'}</span>
                        {u.id === currentUser.id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            الحالي
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        الدور: {u.role === 'admin' ? 'مدير عام' : u.role === 'manager' ? 'مشرف فرع' : 'كاشير مبيعات'}
                      </div>
                    </div>
                  </div>

                  <div className="font-mono text-xs text-slate-400">
                    رمز الدخول: <span className="font-bold text-slate-700">••••</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Local Storage & Backup Panel (1 column) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>النسخ الاحتياطي واستعادة البيانات</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              يعمل التطبيق محلياً (Offline-First) ويحفظ جميع الأصناف والفواتير والورديات بأمان في جهازك. يمكنك تنزيل نسخة احتياطية دورية أو نقلها لجهاز آخر:
            </p>

            {/* Export Button */}
            <button
              onClick={exportDataJson}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير نسخة احتياطية (JSON)</span>
            </button>

              {backupMessage && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[11px] font-semibold text-emerald-800">
                  {backupMessage}
                </div>
              )}

              {desktopApp && (
                <>
                  <button type="button" onClick={handleExportSqlite} className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer">
                    <Download className="w-4 h-4" />
                    <span>تصدير قاعدة SQLite كاملة</span>
                  </button>
                  <button type="button" onClick={handleRestoreSqlite} className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-200">
                    <Upload className="w-4 h-4" />
                    <span>استعادة قاعدة SQLite كاملة</span>
                  </button>
                  <button type="button" onClick={() => desktopApp.app.openBackups()} className="w-full py-2 px-4 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer">
                    فتح مجلد النسخ الاحتياطية
                  </button>
                </>
              )}

              {/* Import Button */}
              <label className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200">
              <Upload className="w-4 h-4" />
              <span>استعادة نسخة احتياطية من ملف</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Reset Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  if (
                    confirm(
                      'تأكيد البدء الفعلي: هل ترغب في مسح كافة البيانات الوهمية والتجريبية والبدء بمتجر فارغ نظيف لإدخال بضاعتك وعملائك الحقيقيين؟ لن تتكرر البيانات الوهمية أبداً.'
                    )
                  ) {
                    clearToEmptyStore();
                    alert('تم تفريغ المتجر بنجاح! يمكنك الآن إضافة منتجاتك وعملائك الحقيقيين.');
                  }
                }}
                className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-amber-300"
              >
                <Database className="w-3.5 h-3.5 text-amber-700" />
                <span>تصفير النظام والبدء بمتجر فارغ حقيقي (بدون أي بيانات وهمية)</span>
              </button>

            </div>
          </div>

          {/* Privacy & Offline Guarantee */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>تطبيق محلي 100% دون خا��م سحابي</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              جميع بياناتك الحساسة كالأسعار، التكلفة، سجلات المبيعات والعملاء مخزنة في متصفحك أو جهازك دون إرسالها لأي خادم خارجي.
            </p>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddUser}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95"
          >
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>إضافة كاشير أو مستخدم جديد</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  اسم الموظف *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: أحمد مصطفى"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  الدور / الصلاحية
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="cashier">كاشير مبيعات (نقطة البيع فقط)</option>
                  <option value="manager">مشرف فرع (فواتير وتقارير)</option>
                  <option value="admin">مدير عام (كافة الصلاحيات)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  رمز المرور السريع (PIN) *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value)}
                  placeholder="مثال: 1234"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-center tracking-widest text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setIsAddUserModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                حفظ المستخدم
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
