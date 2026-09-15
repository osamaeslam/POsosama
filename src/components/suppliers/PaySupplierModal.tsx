import React, { useState } from 'react';
import { Supplier, SupplierPayment } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, DollarSign, Wallet, Banknote, Building2, Printer, AlertCircle } from 'lucide-react';

interface PaySupplierModalProps {
  supplier: Supplier;
  onClose: () => void;
  onPaymentSuccess?: (payment: SupplierPayment) => void;
}

export const PaySupplierModal: React.FC<PaySupplierModalProps> = ({ supplier, onClose, onPaymentSuccess }) => {
  const { paySupplierDebt, currentShift, settings } = useApp();
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet' | 'bank'>('cash');
  const [paidFromCashDrawer, setPaidFromCashDrawer] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [completedPayment, setCompletedPayment] = useState<SupplierPayment | null>(null);

  const outstanding = Math.max(0, supplier.totalPayable || 0);

  const handleQuickAmount = (val: number) => {
    setAmount(Math.min(val, outstanding));
    setError('');
  };

  const handlePayFull = () => {
    setAmount(outstanding);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError('يرجى كتابة مبلغ سداد صحيح أكبر من الصفر');
      return;
    }
    if (num > outstanding) {
      setError(`المبلغ المدخل أكبر من إجمالي المديونية المستحقة (${outstanding.toLocaleString()} ${settings.currency})`);
      return;
    }

    try {
      const payment = paySupplierDebt(
        supplier.id,
        num,
        paymentMethod,
        paidFromCashDrawer && !!currentShift,
        notes.trim() || undefined
      );
      setCompletedPayment(payment);
      if (onPaymentSuccess) {
        onPaymentSuccess(payment);
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل عملية السداد');
    }
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">سداد دفعة للمورد</h3>
              <p className="text-xs text-slate-500">سند صرف وسداد مديونية توريد</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {completedPayment ? (
          /* Payment Confirmation View */
          <div className="p-5 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-emerald-900 text-base">تم تسجيل سند الصرف بنجاح!</h4>
              <p className="text-xs text-emerald-700">
                رقم السند: <span className="font-mono font-bold">{completedPayment.receiptNumber}</span>
              </p>
              <div className="text-2xl font-black text-emerald-800 pt-1">
                {completedPayment.amount.toLocaleString()} {settings.currency}
              </div>
              <p className="text-[11px] text-slate-600">
                المتبقي على حساب المورد: {Math.max(0, outstanding - completedPayment.amount).toLocaleString()} {settings.currency}
              </p>
            </div>

            {completedPayment.paidFromCashDrawer && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600 shrink-0" />
                <span>تم خصم المبلغ تلقائياً من درج النقدية بالوردية المفتوحة</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrintVoucher}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                طباعة سند الصرف
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          /* Payment Input Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Supplier Summary Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 text-sm">{supplier.name}</div>
                <div className="text-xs text-slate-500">{supplier.companyName || 'مورد تجاري'}</div>
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">الرصيد المستحق</div>
                <div className="text-base font-black text-rose-600">
                  {outstanding.toLocaleString()} {settings.currency}
                </div>
              </div>
            </div>

            {/* Amount input & Quick buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                مبلغ السداد المطلوب ({settings.currency}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={outstanding}
                  required
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setAmount(val);
                    if (error) setError('');
                  }}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {settings.currency}
                </span>
              </div>

              {/* Shortcuts */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors shrink-0"
                >
                  سداد كامل الرصيد ({outstanding.toLocaleString()})
                </button>
                {[500, 1000, 2000, 5000].map((val) => {
                  if (val >= outstanding) return null;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors shrink-0"
                    >
                      {val.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">طريقة السداد</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('cash');
                    setPaidFromCashDrawer(true);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>نقدي (كاش)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('bank');
                    setPaidFromCashDrawer(false);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'bank'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>تحويل بنكي / إنستاباي</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('wallet');
                    setPaidFromCashDrawer(false);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>محفظة إلكترونية</span>
                </button>
              </div>
            </div>

            {/* Cash Drawer Deduction Checkbox */}
            {paymentMethod === 'cash' && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paidFromCashDrawer}
                  onChange={(e) => setPaidFromCashDrawer(e.target.checked)}
                  disabled={!currentShift}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-950 block">خصم المبلغ من درج النقدية للوردية الحالية</span>
                  <span className="text-[11px] text-amber-800 block">
                    {currentShift
                      ? 'سيتم تسجيل المبلغ كمصروف درج ليطابق الجرد الفعلي عند الإغلاق'
                      : 'لا توجد وردية كاشير مفتوحة حالياً (سيتم التسجيل بدون خصم درج)'}
                  </span>
                </div>
              </label>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات السند (اختياري)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: دفعة تحت حساب فاتورة SUP-101 أو رقم تحويل بنكي"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                تأكيد السداد وإصدار السند
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
