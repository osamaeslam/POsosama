import React, { useRef } from 'react';
import { DebtPayment, Customer } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, X, CheckCircle2, Phone, MapPin, User, Wallet, Banknote } from 'lucide-react';

interface DebtReceiptModalProps {
  payment: DebtPayment;
  customer?: Customer;
  onClose: () => void;
}

export const DebtReceiptModal: React.FC<DebtReceiptModalProps> = ({
  payment,
  customer,
  onClose,
}) => {
  const { settings } = useApp();
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const remainingDebt = customer ? customer.totalDebt : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              إيصال سداد مديونية (سند قبض)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card */}
        <div className="flex-1 overflow-y-auto py-4">
          <div
            ref={printContentRef}
            className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-800 space-y-4 print:p-0 print:border-none print:bg-white"
          >
            {/* Store Information */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">
                {settings.storeName}
              </h2>
              {settings.storeAddress && (
                <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{settings.storeAddress}</span>
                </div>
              )}
              {settings.storePhone && (
                <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mt-0.5">
                  <Phone className="w-3 h-3" />
                  <span className="font-mono">{settings.storePhone}</span>
                </div>
              )}
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                سند قبض نقدية / سداد مديونية
              </div>
            </div>

            {/* Receipt Details */}
            <div className="text-xs space-y-1.5 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الإيصال:</span>
                <span className="font-mono font-bold">{payment.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">التاريخ والوقت:</span>
                <span className="font-mono text-slate-700">
                  {new Date(payment.createdAt).toLocaleString('ar-EG')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">اسم العميل:</span>
                <span className="font-bold text-slate-900">{payment.customerName}</span>
              </div>
              {payment.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم هاتف العميل:</span>
                  <span className="font-mono">{payment.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">المستلم (الكاشير):</span>
                <span>{payment.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">طريقة التحصيل:</span>
                <span className="font-semibold flex items-center gap-1">
                  {payment.paymentMethod === 'cash' ? (
                    <>
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      <span>نقداً (كاش دخل الخزينة)</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-3.5 h-3.5 text-purple-600" />
                      <span>محفظة إلكترونية {payment.walletProvider ? `(${payment.walletProvider})` : ''}</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Amount Paid Highlight */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <div className="text-xs text-emerald-800 font-semibold">المبلغ المسدد</div>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                {payment.amount.toLocaleString()} {settings.currency}
              </div>
            </div>

            {/* Remaining Debt */}
            <div className="flex justify-between items-center text-xs p-2.5 bg-slate-100 rounded-lg">
              <span className="text-slate-600">المتبقي على العميل بعد السداد:</span>
              <span className="font-bold font-mono text-slate-800">
                {remainingDebt.toLocaleString()} {settings.currency}
              </span>
            </div>

            {payment.notes && (
              <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                ملاحظات: {payment.notes}
              </div>
            )}

            <div className="text-center text-[10px] text-slate-400 pt-1">
              تم التوثيق والترحيل آلياً للخزينة • بياع POS
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            تخطي الطباعة (تم الحفظ)
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإيصال</span>
          </button>
        </div>
      </div>
    </div>
  );
};
