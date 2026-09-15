import React from 'react';
import { SupplierInvoice } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Printer, Building2, Phone, Calendar, User, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface SupplierInvoiceDetailsModalProps {
  invoice: SupplierInvoice;
  onClose: () => void;
  onPayRemaining?: () => void;
}

export const SupplierInvoiceDetailsModal: React.FC<SupplierInvoiceDetailsModalProps> = ({
  invoice,
  onClose,
  onPayRemaining,
}) => {
  const { settings } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    if (invoice.paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" />
          مسددة بالكامل
        </span>
      );
    }
    if (invoice.paymentStatus === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          سداد جزئي (متبقي آجل)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
        <AlertCircle className="w-3.5 h-3.5" />
        آجل بالكامل (غير مسددة)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base">فاتورة توريد {invoice.invoiceNumber}</h3>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-500">
                إذن استلام بضاعة ومشتريات مخزنية • {new Date(invoice.createdAt).toLocaleString('ar-EG')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              title="طباعة"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Supplier and Meta Info Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">اسم المورد:</span>
                <span className="text-slate-800 font-black">{invoice.supplierName}</span>
              </div>
              {invoice.supplierPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700 font-mono">{invoice.supplierPhone}</span>
                </div>
              )}
              {invoice.supplierInvoiceRef && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold">رقم فاتورة المورد الدفترية:</span>
                  <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                    {invoice.supplierInvoiceRef}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 sm:text-left">
              <div className="flex items-center gap-2 sm:justify-end">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">المسؤول:</span>
                <span className="text-slate-700 font-bold">{invoice.userName}</span>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 font-mono">
                  {new Date(invoice.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                <span className="text-slate-500 font-bold">طريقة الدفع:</span>
                <span className="text-slate-700 font-bold">
                  {invoice.paymentMethod === 'cash'
                    ? 'نقدي (كاش)'
                    : invoice.paymentMethod === 'credit'
                    ? 'آجل'
                    : invoice.paymentMethod === 'bank'
                    ? 'تحويل بنكي'
                    : 'محفظة إلكترونية'}
                  {invoice.paidFromCashDrawer && ' (خصم من الدرج)'}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>الأصناف والكميات الموردة للمخزن</span>
              <span className="text-slate-500">({invoice.items.length} صنف)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">المنتج والباركود</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3">سعر الشراء (التكلفة)</th>
                    <th className="py-2.5 px-3">سعر البيع</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-800">{item.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.productBarcode}</div>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono">
                        {item.unitCost.toLocaleString()} {settings.currency}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono">
                        {item.sellingPrice ? `${item.sellingPrice.toLocaleString()} ${settings.currency}` : '—'}
                      </td>
                      <td className="py-2 px-3 text-left font-black text-slate-800 font-mono">
                        {item.subtotal.toLocaleString()} {settings.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>إجمالي قيمة فاتورة الشراء:</span>
              <span className="font-bold text-slate-800 text-sm">
                {invoice.totalAmount.toLocaleString()} {settings.currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-700">
              <span>المبلغ المدفوع للمورد:</span>
              <span className="font-bold text-sm">
                {invoice.paidAmount.toLocaleString()} {settings.currency}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-800">الرصيد المتبقي آجل على المحل:</span>
              <span className="font-black text-rose-600 text-base">
                {invoice.remainingDebt.toLocaleString()} {settings.currency}
              </span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
              <span className="font-bold block mb-0.5">ملاحظات:</span>
              <span>{invoice.notes}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            طباعة إذن التوريد
          </button>

          <div className="flex items-center gap-2">
            {invoice.remainingDebt > 0 && onPayRemaining && (
              <button
                type="button"
                onClick={onPayRemaining}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
              >
                <DollarSign className="w-4 h-4" />
                سداد دفعة للمورد
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
