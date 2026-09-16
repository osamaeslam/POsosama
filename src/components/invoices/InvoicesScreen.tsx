import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import {
  Receipt,
  Search,
  RotateCcw,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

export const InvoicesScreen: React.FC = () => {
  const { t, sales, settings, processRefund } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'refunds'>('all');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  // Refund dialog state
  const [refundingSale, setRefundingSale] = useState<Sale | null>(null);
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({});
  const [refundMode, setRefundMode] = useState<'cash' | 'debt_deduction'>('cash');
  const [refundNotes, setRefundNotes] = useState('');
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);
  const [refundErrorMsg, setRefundErrorMsg] = useState<string | null>(null);

  // Filter invoices
  const filteredSales = sales.filter((s) => {
    if (filterType === 'sales' && s.isRefund) return false;
    if (filterType === 'refunds' && !s.isRefund) return false;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      s.invoiceNumber.toLowerCase().includes(query) ||
      s.cashierName.toLowerCase().includes(query) ||
      s.items.some((i) => i.productName.toLowerCase().includes(query))
    );
  });

  const openRefundModal = (sale: Sale) => {
    setRefundingSale(sale);
    setRefundMode('cash');
    setRefundNotes('');
    setRefundErrorMsg(null);
    // Initialize refund quantities with available remaining quantities
    const initial: Record<string, number> = {};
    sale.items.forEach((item) => {
      const remaining = item.quantity - (item.refundedQuantity || 0);
      initial[item.productId] = remaining > 0 ? remaining : 0;
    });
    setRefundQuantities(initial);
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingSale) return;
    setRefundErrorMsg(null);

    const itemsToRefund = Object.entries(refundQuantities)
      .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) || 0 }))
      .filter((i) => i.quantity > 0);

    if (itemsToRefund.length === 0) {
      setRefundErrorMsg('يرجى تحديد كمية صنف واحد على الأقل للاسترجاع');
      return;
    }

    try {
      const refund = processRefund(refundingSale.id, itemsToRefund, {
        refundMode,
        notes: refundNotes.trim() || undefined,
      });

      if (refund) {
        setRefundingSale(null);
        setRefundSuccessMsg(`تم استرجاع الأصناف وصرف النقدية بنجاح! رقم إشعار الرد: ${refund.invoiceNumber}`);
        setTimeout(() => setRefundSuccessMsg(null), 4000);
      } else {
        setRefundErrorMsg('تعذر إتمام عملية الاسترجاع، يرجى مراجعة الكميات');
      }
    } catch (err) {
      setRefundErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء الاسترجاع');
    }
  };

  // Calculations for total sales and returns
  const totalSalesList = sales.filter((s) => !s.isRefund);
  const totalRefundsList = sales.filter((s) => s.isRefund);

  const totalSalesAmount = totalSalesList.reduce((sum, s) => sum + s.total, 0);
  const totalRefundsAmount = totalRefundsList.reduce((sum, s) => sum + s.total, 0);
  const netSalesAmount = totalSalesAmount - totalRefundsAmount;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>{t.invoices}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            سجل فواتير البيع والمردودات مع تفصيل إجمالي المرتجعات وصافي الإيرادات
          </p>
        </div>

        {refundSuccessMsg && (
          <div className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{refundSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* KPI Cards: Sales, Refunds, and Net Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">إجمالي المبيعات المسجلة</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
              {totalSalesAmount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {totalSalesList.length} فاتورة مبيعات
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Refunds */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between bg-rose-50/20">
          <div>
            <div className="text-xs font-semibold text-rose-700">إجمالي المرتجعات والمردودات</div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 font-mono mt-1">
              {totalRefundsAmount.toLocaleString()} <span className="text-xs font-normal text-rose-500">{settings.currency}</span>
            </div>
            <div className="text-[11px] text-rose-600/80 mt-0.5 font-semibold">
              {totalRefundsList.length} عملية استرجاع أصناف
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        {/* Net Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">صافي المبيعات بعد المرتجعات</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-1">
              {netSalesAmount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              (المبيعات - المرتجعات)
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الفاتورة أو اسم الكاشير أو المنتج..."
            className="w-full pr-9 pl-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'all' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            الكل ({sales.length})
          </button>
          <button
            onClick={() => setFilterType('sales')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'sales' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            المبيعات ({sales.filter((s) => !s.isRefund).length})
          </button>
          <button
            onClick={() => setFilterType('refunds')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'refunds' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            المرتجعات ({sales.filter((s) => s.isRefund).length})
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Receipt className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300" />
          <p className="text-sm font-semibold">{t.noData}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3.5">رقم الفاتورة</th>
                  <th className="p-3.5">التاريخ والوقت</th>
                  <th className="p-3.5">الكاشير</th>
                  <th className="p-3.5">الأصناف المشمولة</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5 text-left">المبلغ الإجمالي</th>
                  <th className="p-3.5 text-center">الطباعة والمعاينة</th>
                  <th className="p-3.5 text-center">استرجاع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => {
                  // Calculate remaining refundable quantity
                  const totalRemainingToRefund = sale.items.reduce(
                    (acc, it) => acc + (it.quantity - (it.refundedQuantity || 0)),
                    0
                  );

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-slate-900">
                        {sale.invoiceNumber}
                        {sale.isRefund && (
                          <span className="mr-2 px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-sans font-bold">
                            مرتجع
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(sale.createdAt).toLocaleDateString('ar-EG')}{' '}
                        {new Date(sale.createdAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3.5 text-slate-700">{sale.cashierName}</td>
                      <td className="p-3.5 text-slate-600">
                        <div className="truncate max-w-[240px]">
                          {sale.items.map((i) => `${i.productName} (${i.quantity})`).join('، ')}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            sale.paymentMethod === 'credit'
                              ? 'bg-amber-100 text-amber-800'
                              : sale.paymentMethod === 'wallet'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sale.paymentMethod === 'cash'
                            ? 'نقداً (كاش)'
                            : sale.paymentMethod === 'credit'
                            ? 'آجل (حساب)'
                            : sale.paymentMethod === 'wallet'
                            ? `محفظة (${sale.walletProvider || 'إلكترونية'})`
                            : t.card}
                        </span>
                      </td>
                      <td className="p-3.5 text-left font-extrabold text-slate-900 font-mono">
                        <span className={sale.isRefund ? 'text-rose-600' : 'text-blue-600'}>
                          {sale.isRefund ? '-' : ''}
                          {sale.total.toLocaleString()} {settings.currency}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer font-medium text-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>معاينة</span>
                        </button>
                      </td>
                      <td className="p-3.5 text-center">
                        {!sale.isRefund && totalRemainingToRefund > 0 ? (
                          <button
                            onClick={() => openRefundModal(sale)}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer font-bold text-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>استرجاع</span>
                          </button>
                        ) : !sale.isRefund ? (
                          <span className="text-[10px] text-slate-400 font-medium">مسترجع بالكامل</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundingSale && (() => {
        const discountRatio =
          refundingSale.subtotal > 0 ? refundingSale.total / refundingSale.subtotal : 1;
        const estimatedRefundTotal = Object.entries(refundQuantities).reduce((sum, [pId, qty]) => {
          const item = refundingSale.items.find((i) => i.productId === pId);
          if (!item || !qty) return sum;
          return sum + Math.round(item.price * Number(qty) * discountRatio * 100) / 100;
        }, 0);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleRefundSubmit}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>استرجاع من الفاتورة ({refundingSale.invoiceNumber})</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(refundingSale.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                حدد الكميات المراد استرجاعها. يتم رد البضاعة تلقائياً للمخزن وتحديث عهدة الوردية والمبيعات بدقة 100%.
              </p>

              {/* Refund Items List */}
              <div className="space-y-3 mb-4 max-h-52 overflow-y-auto pr-1">
                {refundingSale.items.map((item) => {
                  const maxRefundable = item.quantity - (item.refundedQuantity || 0);
                  const currentRefundQty = refundQuantities[item.productId] || 0;

                  if (maxRefundable <= 0) return null;

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">{item.productName}</div>
                        <div className="text-[11px] text-slate-500">
                          السعر: {item.price.toLocaleString()} {settings.currency} | المتاح للاسترجاع: {maxRefundable}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500 font-semibold">كمية الرد:</label>
                        <input
                          type="number"
                          min="0"
                          max={maxRefundable}
                          value={currentRefundQty}
                          onChange={(e) => {
                            const val = Math.min(
                              maxRefundable,
                              Math.max(0, parseInt(e.target.value, 10) || 0)
                            );
                            setRefundQuantities((prev) => ({ ...prev, [item.productId]: val }));
                          }}
                          className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center font-bold text-xs bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Refund Value Preview */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between text-xs mb-3">
                <div>
                  <div className="font-bold text-rose-900">إجمالي قيمة المرتجع المستحقة:</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    {refundMode === 'cash'
                      ? 'صرف نقدي (كاش) فوراً من درج الخزينة'
                      : 'خصم من رصيد دين العميل الآجل'}
                  </div>
                </div>
                <div className="text-xl font-black text-rose-700 font-mono">
                  {estimatedRefundTotal.toLocaleString()} {settings.currency}
                </div>
              </div>

              {/* If Credit sale, choose Cash or Debt reduction */}
              {refundingSale.paymentMethod === 'credit' && refundingSale.customerId && (
                <div className="mb-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-700">طريقة رد المبلغ:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRefundMode('cash')}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        refundMode === 'cash'
                          ? 'border-rose-500 bg-rose-50 text-rose-800 font-bold'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      💵 صرف كاش من الخزينة
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefundMode('debt_deduction')}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        refundMode === 'debt_deduction'
                          ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      📉 خصم من دين العميل
                    </button>
                  </div>
                </div>
              )}

              {/* Cash from drawer notice */}
              {refundMode === 'cash' && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>
                    المرتجع نقدي: يتم خصم المبلغ تلقائياً من نقدية الدرج الحالية في الوردية لضمان مطابقة الكاش عند الجرد.
                  </span>
                </div>
              )}

              {refundErrorMsg && (
                <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 mb-3">
                  {refundErrorMsg}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefundingSale(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={estimatedRefundTotal <= 0}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg shadow-sm cursor-pointer transition-colors"
                >
                  تأكيد الاسترجاع وصرف النقدية ({estimatedRefundTotal.toLocaleString()} {settings.currency})
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* Receipt Modal */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}
    </div>
  );
};
