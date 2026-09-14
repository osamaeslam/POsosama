import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  CreditCard,
  Banknote,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { t, sales, products, expenses, settings } = useApp();

  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Filter sales according to timeframe
  const now = new Date();
  const filteredSales = sales.filter((s) => {
    if (s.isRefund) return false;
    const saleDate = new Date(s.createdAt);

    if (timeframe === 'today') {
      return saleDate.toDateString() === now.toDateString();
    }
    if (timeframe === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return saleDate >= oneWeekAgo;
    }
    if (timeframe === 'month') {
      return (
        saleDate.getMonth() === now.getMonth() &&
        saleDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  // Calculations
  const salesList = filteredSales.filter((s) => !s.isRefund);
  const refundsList = filteredSales.filter((s) => s.isRefund);

  const grossSalesRevenue = salesList.reduce((sum, s) => sum + s.total, 0);
  const totalRefundsAmount = refundsList.reduce((sum, s) => sum + s.total, 0);
  const netRevenue = Math.max(0, grossSalesRevenue - totalRefundsAmount);

  const totalCost = salesList.reduce((sum, s) => {
    const saleCost = s.items.reduce((c, it) => c + (it.cost || 0) * (it.quantity - (it.refundedQuantity || 0)), 0);
    return sum + saleCost;
  }, 0);

  const grossProfit = netRevenue - totalCost;
  const profitMarginPercent = netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(1) : '0';

  const cashSalesTotal = salesList
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.total, 0);

  const creditSalesTotal = salesList
    .filter((s) => s.paymentMethod === 'credit')
    .reduce((sum, s) => sum + s.total, 0);

  const walletSalesTotal = salesList
    .filter((s) => s.paymentMethod === 'wallet')
    .reduce((sum, s) => sum + s.total, 0);

  const cardSalesTotal = creditSalesTotal + walletSalesTotal;

  // Top selling products
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

  filteredSales.forEach((s) => {
    s.items.forEach((it) => {
      if (!productSalesMap[it.productId]) {
        productSalesMap[it.productId] = {
          name: it.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSalesMap[it.productId].quantity += it.quantity;
      productSalesMap[it.productId].revenue += it.subtotal;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>{t.reports}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تحليل الأداء المالي، هوامش الربح، والأصناف الأكثر مبيعاً
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe pill switch */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'today' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'week' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              أسبوع
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'month' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'all' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              الكل
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="no-print px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">إجمالي الإيرادات (المبيعات)</span>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {netRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-bold">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{filteredSales.length} فاتورة مسجلة</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">تكلفة البضاعة المباعة (COGS)</span>
          <div className="text-2xl font-black text-slate-700 mt-2 font-mono">
            {totalCost.toLocaleString()} <span className="text-xs text-slate-400 font-bold">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">تكلفة الشراء الأصلية للبضاعة</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">إجمالي الأرباح الإجمالية</span>
          <div className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            {grossProfit.toLocaleString()} <span className="text-xs text-emerald-400 font-bold">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">هامش ربح {profitMarginPercent}%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">المبيعات نقدية مقابل شبكة</span>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">كاش:</span>
              <span className="font-bold text-slate-800 font-mono">{cashSalesTotal.toLocaleString()} {settings.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">فيزا/شبكة:</span>
              <span className="font-bold text-blue-600 font-mono">{cardSalesTotal.toLocaleString()} {settings.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Products & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top selling products table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span>الأصناف الأكثر مبيعاً وتحقيقاً للإيراد</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">المنتجات الأكثر طلباً في الفترة المحددة</p>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              لا توجد مبيعات مسجلة في هذا النطاق الزمني.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">اسم المنتج</th>
                    <th className="p-3 text-center">الكمية المباعة</th>
                    <th className="p-3 text-left">إجمالي الإيراد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{item.name}</td>
                      <td className="p-3 text-center font-bold text-slate-700 font-mono">
                        {item.quantity} قطعة
                      </td>
                      <td className="p-3 text-left font-black text-blue-600 font-mono">
                        {item.revenue.toLocaleString()} {settings.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Channels card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>توزيع قنوات الدفع</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">نسبة الدفع النقدي مقابل الدفع الإلكتروني</p>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>النقد (كاش)</span>
                  </span>
                  <span className="font-mono">
                    {netRevenue > 0 ? Math.round((cashSalesTotal / netRevenue) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{
                      width: `${netRevenue > 0 ? (cashSalesTotal / netRevenue) * 100 : 0}%`,
                    }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1 text-slate-700">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>البطاقات والشبكة</span>
                  </span>
                  <span className="font-mono">
                    {netRevenue > 0 ? Math.round((cardSalesTotal / netRevenue) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{
                      width: `${netRevenue > 0 ? (cardSalesTotal / netRevenue) * 100 : 0}%`,
                    }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 mt-6">
            <strong>نصيحة النظام:</strong> نسبة الدفع النقدي تمثل أغلبية السيولة بالدرج، احرص على مطابقة الدرج بانتظام عند إغلاق الورديات.
          </div>
        </div>
      </div>
    </div>
  );
};
