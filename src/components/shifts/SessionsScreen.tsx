import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  User,
  LogOut,
  LogIn,
  Receipt,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  MinusCircle,
  PlusCircle,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

export const SessionsScreen: React.FC = () => {
  const {
    t,
    currentShift,
    shifts,
    settings,
    currentUser,
    openShift,
    closeShift,
    expenses,
  } = useApp();

  // Dialogs
  const [isOpenShiftModal, setIsOpenShiftModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('500');

  const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);
  const [actualClosingCash, setActualClosingCash] = useState('');

  // Expected Cash calculation for active shift
  const cashSales = currentShift?.totalCashSales || 0;
  const debtCollections = currentShift?.totalDebtCollectionsCash || 0;
  const refunds = currentShift?.totalRefunds || 0;
  const currentExpenses = currentShift?.totalExpenses || 0;
  const openingCash = currentShift?.openingCash || 0;

  const expectedCashInDrawer = currentShift
    ? openingCash + cashSales + debtCollections - refunds - currentExpenses
    : 0;

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseFloat(openingBalance) || 0;
    openShift(cash);
    setIsOpenShiftModal(false);
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualClosingCash) || expectedCashInDrawer;
    closeShift(actual);
    setIsCloseShiftModal(false);
    setActualClosingCash('');
  };

  const closedShifts = shifts.filter((s) => !s.isOpen);

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            <span>إدارة وتقفيل الورديات والخزينة</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            جرد نقدية الدرج، فصل الكاش عن الآجل والمحافظ، واحتساب المصروفات وسندات القبض بدقة
          </p>
        </div>

        {currentShift ? (
          <button
            onClick={() => {
              setActualClosingCash(expectedCashInDrawer.toString());
              setIsCloseShiftModal(true);
            }}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تقفيل وإغلاق الوردية</span>
          </button>
        ) : (
          <button
            onClick={() => setIsOpenShiftModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>فتح وردية جديدة</span>
          </button>
        )}
      </div>

      {/* Active Shift Card */}
      {currentShift ? (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-5 md:p-6 shadow-xs space-y-5">
          {/* Status Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-extrabold text-slate-900 text-base md:text-lg">
                  وردية نشطة ومفتوحة حالياً
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-4">
                <span>
                  المسؤول (الكاشير): <strong className="text-slate-800">{currentShift.userName}</strong>
                </span>
                <span>
                  وقت الفتح: <strong className="text-slate-800">{new Date(currentShift.openTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</strong>
                </span>
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:px-5 sm:py-3 text-right md:text-left">
              <span className="text-xs font-bold text-emerald-800">النقدية المتوقعة بالدرج (الخزينة):</span>
              <div className="text-2xl md:text-3xl font-black text-emerald-700 font-mono mt-0.5">
                {expectedCashInDrawer.toLocaleString()} {settings.currency}
              </div>
            </div>
          </div>

          {/* Detailed Drawer Breakdown Matrix */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2.5">
              تفاصيل حركة الخزينة الفعلية للوردية (ما يدخل وما يخرج من الدرج):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* 1. Opening Cash */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block">العهدة الافتتاحية:</span>
                <div className="text-base font-bold text-slate-900 mt-1 font-mono">
                  {openingCash.toLocaleString()} {settings.currency}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">رصيد بداية الدرج</div>
              </div>

              {/* 2. Cash Sales */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>مبيعات نقدية (كاش):</span>
                </span>
                <div className="text-base font-bold text-emerald-700 mt-1 font-mono">
                  +{cashSales.toLocaleString()} {settings.currency}
                </div>
                <div className="text-[10px] text-emerald-600/80 mt-0.5">مبيعات كاش بالدرج</div>
              </div>

              {/* 3. Debt Collections */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                <span className="text-blue-800 font-semibold flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>سداد مديونيات آجلة:</span>
                </span>
                <div className="text-base font-bold text-blue-700 mt-1 font-mono">
                  +{debtCollections.toLocaleString()} {settings.currency}
                </div>
                <div className="text-[10px] text-blue-600/80 mt-0.5">كاش تم تحصيله من العملاء</div>
              </div>

              {/* 4. Expenses */}
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
                <span className="text-rose-800 font-semibold flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                  <span>مصروفات من الدرج:</span>
                </span>
                <div className="text-base font-bold text-rose-700 mt-1 font-mono">
                  -{currentExpenses.toLocaleString()} {settings.currency}
                </div>
                <div className="text-[10px] text-rose-600/80 mt-0.5">فواتير ونثريات منصرفة</div>
              </div>
            </div>
          </div>

          {/* Non-Cash / External Movements Notice */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700 mb-2">
              عمليات لا تؤثر على درج النقدية الكاش (تُسجل للإحصاء فقط):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Wallets */}
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-purple-900 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-purple-600" />
                    <span>مبيعات المحافظ الإلكترونية (فودافون كاش / إنستاباي)</span>
                  </div>
                  <div className="text-[11px] text-purple-700 mt-0.5">
                    محولة على الحسابات الرقمية (لا توجد نقدية ورقية بالدرج)
                  </div>
                </div>
                <div className="text-base font-black text-purple-800 font-mono shrink-0 mr-2">
                  {(currentShift.totalWalletSales || 0).toLocaleString()} {settings.currency}
                </div>
              </div>

              {/* Outstanding Credit Sales */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>مبيعات آجلة غير مسددة (ديون على العملاء)</span>
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    تظهر في حسابات العملاء، ولا تدخل الدرج إلا عند التحصيل
                  </div>
                </div>
                <div className="text-base font-black text-amber-800 font-mono shrink-0 mr-2">
                  {(currentShift.totalCreditSales || 0).toLocaleString()} {settings.currency}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">لا توجد وردية مفتوحة حالياً</h3>
            <p className="text-xs text-slate-600 mt-1">
              يرجى فتح وردية جديدة واستلام العهدة لبدء تسجيل الفواتير والمبيعات بدقة.
            </p>
          </div>
          <button
            onClick={() => setIsOpenShiftModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>بدء وفتح وردية جديدة</span>
          </button>
        </div>
      )}

      {/* Shifts History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs">سجل الورديات السابقة المقفلة</h3>
          <span className="text-xs text-slate-500 font-semibold">{closedShifts.length} وردية مقفلة</span>
        </div>

        {closedShifts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            لا توجد ورديات سابقة مسجلة بعد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3.5">الكاشير</th>
                  <th className="p-3.5">وقت البدء</th>
                  <th className="p-3.5">وقت الإغلاق</th>
                  <th className="p-3.5 text-left">العهدة</th>
                  <th className="p-3.5 text-left">مبيعات كاش</th>
                  <th className="p-3.5 text-left">تحصيلات ديون</th>
                  <th className="p-3.5 text-left">المصروفات</th>
                  <th className="p-3.5 text-left">المتوقع</th>
                  <th className="p-3.5 text-left">الفعلي المسلّم</th>
                  <th className="p-3.5 text-center">الفارق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closedShifts.map((s) => {
                  const diff = s.cashDifference || 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{s.userName}</td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {new Date(s.openTime).toLocaleDateString('ar-EG')}{' '}
                        {new Date(s.openTime).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {s.closeTime
                          ? new Date(s.closeTime).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="p-3.5 text-left font-mono text-slate-600">
                        {s.openingCash.toLocaleString()} {settings.currency}
                      </td>
                      <td className="p-3.5 text-left font-mono text-emerald-600 font-bold">
                        +{(s.totalCashSales || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-left font-mono text-blue-600 font-bold">
                        +{(s.totalDebtCollectionsCash || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-left font-mono text-rose-600 font-bold">
                        -{(s.totalExpenses || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-left font-mono text-slate-700">
                        {(s.expectedCash || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-left font-mono font-bold text-slate-900">
                        {(s.closingCash || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold">
                        {diff === 0 ? (
                          <span className="text-emerald-600">مطابق (0)</span>
                        ) : diff > 0 ? (
                          <span className="text-blue-600">+{diff.toLocaleString()} (زيادة)</span>
                        ) : (
                          <span className="text-rose-600">{diff.toLocaleString()} (عجز)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Open Shift Modal */}
      {isOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleOpenShift}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95"
          >
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <LogIn className="w-4 h-4 text-emerald-600" />
              <span>فتح وبدء وردية جديدة</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              أدخل رصيد العهدة النقدية الافتتاحية الموجودة بالدرج حالياً:
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                رصيد البداية ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 font-mono"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOpenShiftModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                تأكيد فتح الوردية
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCloseShift}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>تقفيل وإغلاق الوردية الحالية</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              قم بعد النقود الفعلية الموجودة بدرج الكاشير وتسجيلها لمطابقتها مع النظام.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>العهدة الافتتاحية:</span>
                <span className="font-mono">{openingCash.toLocaleString()} {settings.currency}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>المبيعات النقدية (كاش):</span>
                <span className="font-mono">+{cashSales.toLocaleString()} {settings.currency}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>تحصيلات سداد الديون (كاش):</span>
                <span className="font-mono">+{debtCollections.toLocaleString()} {settings.currency}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>المصروفات المنصرفة من الدرج:</span>
                <span className="font-mono">-{currentExpenses.toLocaleString()} {settings.currency}</span>
              </div>
              {refunds > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>مرتجعات نقدية:</span>
                  <span className="font-mono">-{refunds.toLocaleString()} {settings.currency}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-300 pt-1.5 text-sm">
                <span>النقدية المتوقعة بالدرج:</span>
                <span className="font-mono text-blue-600">
                  {expectedCashInDrawer.toLocaleString()} {settings.currency}
                </span>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                النقدية الفعلية المحصية بالدرج ({settings.currency}) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={actualClosingCash}
                onChange={(e) => setActualClosingCash(e.target.value)}
                placeholder={expectedCashInDrawer.toString()}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 font-mono"
                autoFocus
              />
            </div>

            {actualClosingCash !== '' && (
              <div className="text-xs font-bold mb-3 p-2.5 rounded-xl bg-slate-100 flex items-center justify-between">
                <span>فارق الجرد:</span>
                <span
                  className={
                    parseFloat(actualClosingCash) - expectedCashInDrawer < 0
                      ? 'text-rose-600'
                      : parseFloat(actualClosingCash) - expectedCashInDrawer > 0
                      ? 'text-blue-600'
                      : 'text-emerald-600'
                  }
                >
                  {(parseFloat(actualClosingCash) - expectedCashInDrawer).toLocaleString()} {settings.currency}{' '}
                  {parseFloat(actualClosingCash) - expectedCashInDrawer === 0
                    ? '(مطابق تماماً ✓)'
                    : parseFloat(actualClosingCash) - expectedCashInDrawer > 0
                    ? '(فائض بالخزينة)'
                    : '(عجز بالخزينة)'}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCloseShiftModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                تأكيد الإغلاق النهائي
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
