import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  AlertTriangle,
  PackagePlus,
  CheckCircle2,
  Boxes,
  ArrowRight,
  TrendingDown,
  ShoppingBag,
} from 'lucide-react';

export const StockAlertsScreen: React.FC = () => {
  const { t, products, categories, settings, restockProduct, setActiveTab } = useApp();

  const [restockProductModal, setRestockProductModal] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('15');

  // Filter low stock and out of stock items
  const deficitProducts = products.filter((p) => p.stock <= p.minStock && p.isActive);
  const outOfStockProducts = deficitProducts.filter((p) => p.stock <= 0);
  const lowStockProducts = deficitProducts.filter((p) => p.stock > 0);

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProductModal) return;
    const qty = parseInt(restockQuantity, 10);
    if (qty > 0) {
      restockProduct(restockProductModal.id, qty);
    }
    setRestockProductModal(null);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <span>{t.stockAlerts}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            متابعة الأصناف المنتهية وقاربت على النفاد لطلب كميات جديدة وتفادي توقف المبيعات
          </p>
        </div>

        <button
          onClick={() => setActiveTab('products')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Boxes className="w-4 h-4" />
          <span>إدارة كتالوج المنتجات</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">إجمالي النواقص المطلوب توريدها</span>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {deficitProducts.length} <span className="text-xs text-slate-400 font-bold">صنف</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">أصناف رصيدها صفر (نفدت تماماً)</span>
          <div className="text-2xl font-black text-rose-700 mt-2">
            {outOfStockProducts.length} <span className="text-xs text-slate-400 font-bold">صنف</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">أصناف تحت حد الأمان الأدنى</span>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {lowStockProducts.length} <span className="text-xs text-slate-400 font-bold">صنف</span>
          </div>
        </div>
      </div>

      {/* Deficit Products Table */}
      {deficitProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-800">المخزون مكتمل تماماً</h3>
          <p className="text-xs text-slate-500 mt-1">
            لا توجد أصناف تحت حد الأمان في الوقت الحالي، جميع المنتجات متوفرة بكفاية.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>قائمة الأصناف المحتاجة للتوريد العاجل ({deficitProducts.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3.5">الباركود</th>
                  <th className="p-3.5">اسم الصنف</th>
                  <th className="p-3.5">القسم</th>
                  <th className="p-3.5 text-center">الرصيد الفعلي</th>
                  <th className="p-3.5 text-center">الحد الأدنى</th>
                  <th className="p-3.5 text-center">العجز التقديري</th>
                  <th className="p-3.5 text-left">تكلفة التوريد</th>
                  <th className="p-3.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deficitProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const deficitQty = Math.max(1, p.minStock * 2 - p.stock);
                  const isZero = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">{p.barcode}</td>
                      <td className="p-3.5 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700">
                          {cat?.name || p.categoryId}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            isZero
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-600">{p.minStock}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-blue-600">
                        +{deficitQty} قطعة
                      </td>
                      <td className="p-3.5 text-left font-mono text-slate-600">
                        {(deficitQty * p.cost).toLocaleString()} {settings.currency}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            setRestockProductModal(p);
                            setRestockQuantity(deficitQty.toString());
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 mx-auto shadow-xs cursor-pointer"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>سد العجز</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Dialog */}
      {restockProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRestockSubmit}
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95"
          >
            <h4 className="font-bold text-slate-900 text-sm mb-1">
              توريد: {restockProductModal.name}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              الرصيد الحالي بالمخزن {restockProductModal.stock} قطعة. حدد كمية التوريد الجديدة:
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الكمية المضافة
              </label>
              <input
                type="number"
                min="1"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestockProductModal(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                تأكيد التوريد
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
