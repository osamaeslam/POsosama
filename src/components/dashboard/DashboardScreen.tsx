import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Receipt,
  PlusCircle,
  Package,
  Wallet,
  Clock,
  ArrowUpRight,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { Sale } from '../../types';
import { ReceiptModal } from '../invoices/ReceiptModal';

export const DashboardScreen: React.FC = () => {
  const {
    t,
    sales,
    products,
    expenses,
    settings,
    currentShift,
    setActiveTab,
    restockProduct,
  } = useApp();

  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [restockModalProduct, setRestockModalProduct] = useState<{ id: string; name: string } | null>(null);
  const [restockQty, setRestockQty] = useState('10');

  // Today calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(
    (s) => !s.isRefund && s.createdAt.startsWith(todayStr)
  );
  const todayRefunds = sales.filter(
    (s) => s.isRefund && s.createdAt.startsWith(todayStr)
  );

  const todayGrossRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayRefundsTotal = todayRefunds.reduce((sum, s) => sum + s.total, 0);
  const todayRevenue = Math.max(0, todayGrossRevenue - todayRefundsTotal);

  // Profit calculation (Sale Price - Cost)
  const todayProfit = todaySales.reduce((sum, s) => {
    const saleCost = s.items.reduce((c, it) => c + (it.cost || 0) * it.quantity, 0);
    return sum + (s.total - saleCost);
  }, 0) - todayRefundsTotal;

  const todayExpenses = expenses
    .filter((e) => e.createdAt.startsWith(todayStr))
    .reduce((sum, e) => sum + e.amount, 0);

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // Last 7 days chart data
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dStr = d.toISOString().split('T')[0];
    const daySalesList = sales.filter(
      (s) => !s.isRefund && s.createdAt.startsWith(dStr)
    );
    const dayTotal = daySalesList.reduce((acc, s) => acc + s.total, 0);
    return {
      dayName: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
      date: dStr,
      total: dayTotal,
    };
  });

  const maxDailySale = Math.max(...last7Days.map((d) => d.total), 1000);

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalProduct) return;
    const qty = parseInt(restockQty, 10);
    if (qty > 0) {
      restockProduct(restockModalProduct.id, qty);
    }
    setRestockModalProduct(null);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold mb-1">
            <Clock className="w-4 h-4" />
            <span>
              {new Date().toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h2 className="text-2xl font-black">{settings.storeName}</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            نظام بياع لإدارة نقاط البيع والتجزئة يعمل بكفاءة كاملة على جهازك محلياً دون الحاجة للإنترنت.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('pos')}
            className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>فتح نقطة البيع</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className="px-4 py-2.5 bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-blue-400/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة صنف</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Today's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">{t.todaySales}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {todayRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-0.5">
            <span className="font-semibold text-slate-700">{todaySales.length} عملية بيع ناجحة</span>
            {todayRefundsTotal > 0 && (
              <span className="text-rose-600 font-bold">
                مرتجعات اليوم: -{todayRefundsTotal.toLocaleString()} {settings.currency} ({todayRefunds.length})
              </span>
            )}
          </div>
        </div>

        {/* 2. Today's Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">{t.todayProfit}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {todayProfit.toLocaleString()} <span className="text-xs font-bold text-emerald-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            صافي هامش الربح بعد خصم التكلفة
          </div>
        </div>

        {/* 3. Expenses Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">{t.totalExpenses}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {todayExpenses.toLocaleString()} <span className="text-xs font-bold text-slate-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            مصروفات نثرية وفواتير مسجلة اليوم
          </div>
        </div>

        {/* 4. Low Stock Warning */}
        <div
          onClick={() => setActiveTab('stock-alerts')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">{t.stockAlerts}</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">
            {lowStockProducts.length} <span className="text-xs font-bold text-slate-400">صنف</span>
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
            <span>انقر لمراجعة النواقص وإعادة التوريد</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Sales Trend Chart + Recent Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{t.revenueAnalytics}</h3>
              <p className="text-xs text-slate-500">حجم المبيعات اليومية خلال الـ 7 أيام الماضية</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
              تحديث تلقائي
            </span>
          </div>

          {/* Bar chart visualization */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {last7Days.map((d, idx) => {
              const heightPercent = Math.max(8, Math.round((d.total / maxDailySale) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.total > 0 ? `${(d.total / 1000).toFixed(1)}k` : '0'}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[38px] bg-blue-600 hover:bg-blue-500 transition-all rounded-t-lg shadow-xs"
                    title={`${d.dayName} (${d.date}): ${d.total.toLocaleString()} ${settings.currency}`}
                  />
                  <div className="text-[11px] font-medium text-slate-600 truncate w-full text-center">
                    {d.dayName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stock Deficit list (1 column) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>نواقص تتطلب توريداً</span>
            </h3>
            <button
              onClick={() => setActiveTab('stock-alerts')}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              عرض الكل
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[220px]">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                المخزون مكتمل ولا توجد أي عواجز حالياً 🎉
              </div>
            ) : (
              lowStockProducts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold text-slate-900 truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-500">
                      رصيد حالي: <span className="font-bold text-rose-600">{p.stock}</span> (الحد الأدنى: {p.minStock})
                    </div>
                  </div>
                  <button
                    onClick={() => setRestockModalProduct({ id: p.id, name: p.name })}
                    className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[11px] rounded-lg cursor-pointer shrink-0"
                  >
                    + توريد
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Operations Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>أحدث عمليات البيع والفواتير</span>
            </h3>
            <p className="text-xs text-slate-500">سجل الفواتير الصادرة مؤخراً من نقطة البيع</p>
          </div>
          <button
            onClick={() => setActiveTab('invoices')}
            className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
          >
            عرض سجل الفواتير كاملاً
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">الكاشير</th>
                <th className="p-3">الأصناف</th>
                <th className="p-3">طريقة الدفع</th>
                <th className="p-3">الإجمالي</th>
                <th className="p-3 text-center">معاينة وطباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 6).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold font-mono text-slate-900">
                    {sale.invoiceNumber}
                    {sale.isRefund && (
                      <span className="mr-2 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-sans">
                        مرتجع
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500">
                    {new Date(sale.createdAt).toLocaleDateString('ar-EG')}{' '}
                    {new Date(sale.createdAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-3 text-slate-700">{sale.cashierName}</td>
                  <td className="p-3 text-slate-600">{sale.itemsCount} صنف</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 font-medium">
                      {sale.paymentMethod === 'cash'
                        ? t.cash
                        : sale.paymentMethod === 'card'
                        ? t.card
                        : t.split}
                    </span>
                  </td>
                  <td className="p-3 font-extrabold text-slate-900">
                    {sale.total.toLocaleString()} {settings.currency}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedSaleForReceipt(sale)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="عرض وطباعة الفاتورة"
                    >
                      <Printer className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRestockSubmit}
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95"
          >
            <h4 className="font-bold text-slate-900 text-sm mb-1">
              توريد مخزون: {restockModalProduct.name}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              أدخل الكمية المستلمة لإضافتها مباشرة إلى الرصيد بالمخزن.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الكمية المضافة (قطعة)
              </label>
              <input
                type="number"
                min="1"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestockModalProduct(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                تأكيد التوريد
              </button>
            </div>
          </form>
        </div>
      )}

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
