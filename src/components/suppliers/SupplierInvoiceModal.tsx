import React, { useState, useMemo } from 'react';
import { Product, Supplier, SupplierInvoice } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Package,
  Barcode,
  DollarSign,
  Wallet,
  AlertCircle,
  FileText,
  UserPlus,
} from 'lucide-react';
import { SupplierEditModal } from './SupplierEditModal';

interface SupplierInvoiceModalProps {
  onClose: () => void;
  onCreated?: (invoice: SupplierInvoice) => void;
  preselectedSupplierId?: string;
}

interface DraftItem {
  productId: string;
  productBarcode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  sellingPrice?: number;
  subtotal: number;
}

export const SupplierInvoiceModal: React.FC<SupplierInvoiceModalProps> = ({
  onClose,
  onCreated,
  preselectedSupplierId,
}) => {
  const { suppliers, products, createSupplierInvoice, currentShift, settings } = useApp();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    preselectedSupplierId || (suppliers[0]?.id || '')
  );
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Item entry form state
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemBarcode, setItemBarcode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState<number | ''>(1);
  const [itemUnitCost, setItemUnitCost] = useState<number | ''>('');
  const [itemSellingPrice, setItemSellingPrice] = useState<number | ''>('');

  // Invoice Items List
  const [items, setItems] = useState<DraftItem[]>([]);

  // Payment Settlement
  const [paymentType, setPaymentType] = useState<'cash' | 'partial' | 'credit' | 'bank'>('cash');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paidFromCashDrawer, setPaidFromCashDrawer] = useState<boolean>(true);

  // Modals & Errors
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [error, setError] = useState<string>('');

  // Search filter for products
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const query = productSearch.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(query) || (p.barcode && p.barcode.includes(query)))
      .slice(0, 6);
  }, [productSearch, products]);

  // Handle product selection from search
  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setItemName(prod.name);
    setItemBarcode(prod.barcode || '');
    setItemUnitCost(prod.cost || 0);
    setItemSellingPrice(prod.price || 0);
    setProductSearch('');
  };

  // Add Item to Invoice
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('يرجى كتابة أو اختيار اسم المنتج');
      return;
    }
    const qty = Number(itemQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('أدخل كمية توريد صحيحة أكبر من الصفر');
      return;
    }
    const cost = Number(itemUnitCost);
    if (!Number.isFinite(cost) || cost < 0) {
      setError('أدخل سعر شراء / تكلفة صحيح');
      return;
    }

    const sPrice = itemSellingPrice !== '' ? Number(itemSellingPrice) : undefined;
    const subtotal = qty * cost;

    // Check if item barcode or id already in draft items
    const existingIndex = items.findIndex(
      (it) => (selectedProduct && it.productId === selectedProduct.id) || (itemBarcode && it.productBarcode === itemBarcode)
    );

    if (existingIndex >= 0) {
      const updated = [...items];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + qty;
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        unitCost: cost,
        sellingPrice: sPrice ?? existing.sellingPrice,
        subtotal: newQty * cost,
      };
      setItems(updated);
    } else {
      const newItem: DraftItem = {
        productId: selectedProduct ? selectedProduct.id : `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productBarcode: itemBarcode.trim() || `${Date.now().toString().slice(-6)}`,
        productName: itemName.trim(),
        quantity: qty,
        unitCost: cost,
        sellingPrice: sPrice,
        subtotal,
      };
      setItems([...items, newItem]);
    }

    // Reset item form
    setSelectedProduct(null);
    setItemName('');
    setItemBarcode('');
    setItemQty(1);
    setItemUnitCost('');
    setItemSellingPrice('');
    setError('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    const updated = [...items];
    updated[index].quantity = newQty;
    updated[index].subtotal = newQty * updated[index].unitCost;
    setItems(updated);
  };

  const handleUpdateItemCost = (index: number, newCost: number) => {
    if (newCost < 0) return;
    const updated = [...items];
    updated[index].unitCost = newCost;
    updated[index].subtotal = updated[index].quantity * newCost;
    setItems(updated);
  };

  // Calculations
  const invoiceTotal = useMemo(() => {
    return items.reduce((acc, it) => acc + it.subtotal, 0);
  }, [items]);

  // Update paid amount based on payment type
  const computedPaidAmount = useMemo(() => {
    if (paymentType === 'cash' || paymentType === 'bank') {
      return paidAmount !== '' ? Number(paidAmount) : invoiceTotal;
    }
    if (paymentType === 'credit') {
      return 0;
    }
    return Number(paidAmount) || 0;
  }, [paymentType, paidAmount, invoiceTotal]);

  const remainingDebt = Math.max(0, invoiceTotal - computedPaidAmount);

  // Save invoice
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setError('يرجى اختيار المورد أو إضافة مورد جديد');
      return;
    }
    if (items.length === 0) {
      setError('يرجى إضافة صنف واحد على الأقل داخل الفاتورة');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) {
      setError('المورد المحدد غير موجود');
      return;
    }

    try {
      const created = createSupplierInvoice({
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierPhone: supplier.phone,
        supplierInvoiceRef: supplierInvoiceRef.trim() || undefined,
        paymentMethod: paymentType === 'partial' ? 'cash' : paymentType,
        paidAmount: computedPaidAmount,
        paidFromCashDrawer: paidFromCashDrawer && !!currentShift && computedPaidAmount > 0,
        notes: notes.trim() || undefined,
        items,
      });

      if (onCreated) {
        onCreated(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الفاتورة');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">تسجيل فاتورة توريد / مشتريات جديدة</h3>
              <p className="text-xs text-slate-500">
                إضافة بضاعة للمخزن وتحديث أسعار التكلفة وسجلات حسابات الموردين
              </p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Controls: Supplier & Invoice Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  المورد التجاري <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  + مورد جديد
                </button>
              </div>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
              >
                {suppliers.length === 0 && <option value="">لا يوجد موردين - أضف مورد جديد</option>}
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.companyName ? `(${s.companyName})` : ''} - رصيد مستحق:{' '}
                    {(s.totalPayable || 0).toLocaleString()} {settings.currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                رقم فاتورة المورد الدفترية / إذن الاستلام
              </label>
              <input
                type="text"
                value={supplierInvoiceRef}
                onChange={(e) => setSupplierInvoiceRef(e.target.value)}
                placeholder="مثال: B-9842 أو رقم إذن التوريد"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Add Item Section */}
          <div className="p-4 border border-indigo-100 bg-indigo-50/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-indigo-600" />
                إضافة أصناف واردة للفاتورة
              </span>
              <span className="text-[11px] text-slate-500">
                ابحث عن منتج موجود لتحديث رصيده وسعره، أو أدخل صنف جديد
              </span>
            </div>

            {/* Search existing products */}
            <div className="relative">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="ابحث في المخزن بالاسم أو الباركود للاختيار السريع..."
                  className="w-full pr-8 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>

              {filteredProducts.length > 0 && (
                <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p)}
                      className="w-full px-3 py-2 text-right hover:bg-indigo-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.barcode || 'بدون باركود'}</span>
                      </div>
                      <div className="text-left text-[11px]">
                        <span className="text-slate-500 block">
                          الرصيد الحالي: <b className="text-indigo-600 font-mono">{p.stock}</b>
                        </span>
                        <span className="text-slate-400 font-mono">
                          التكلفة: {p.cost || 0} {settings.currency}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Inputs Form */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الصنف</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="اسم المنتج..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">الباركود</label>
                <input
                  type="text"
                  value={itemBarcode}
                  onChange={(e) => setItemBarcode(e.target.value)}
                  placeholder="باركود..."
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">الكمية</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="1"
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">سعر الشراء (التكلفة)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={itemUnitCost}
                  onChange={(e) => setItemUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-700 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">سعر البيع (اختياري)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={itemSellingPrice}
                  onChange={(e) => setItemSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                إدراج الصنف في الفاتورة
              </button>
            </div>
          </div>

          {/* Items List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>أصناف الفاتورة الحالية ({items.length} صنف)</span>
              {items.length > 0 && (
                <span className="text-indigo-600 font-bold">
                  المجموع: {invoiceTotal.toLocaleString()} {settings.currency}
                </span>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                لم يتم إضافة أصناف بعد. ابحث عن منتج أو أدخل صنف جديد بالأعلى واضغط على "إدراج الصنف".
              </div>
            ) : (
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">المنتج</th>
                      <th className="py-2 px-3 text-center">الكمية</th>
                      <th className="py-2 px-3">سعر الشراء</th>
                      <th className="py-2 px-3">سعر البيع</th>
                      <th className="py-2 px-3 text-left">الإجمالي</th>
                      <th className="py-2 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-800 block">{it.productName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{it.productBarcode}</span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => handleUpdateItemQty(idx, Number(e.target.value))}
                            className="w-16 px-1.5 py-1 text-center font-bold border border-slate-200 rounded bg-white text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.unitCost}
                            onChange={(e) => handleUpdateItemCost(idx, Number(e.target.value))}
                            className="w-20 px-1.5 py-1 font-bold border border-slate-200 rounded bg-white text-xs text-emerald-700"
                          />
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-mono">
                          {it.sellingPrice ? `${it.sellingPrice.toLocaleString()} ${settings.currency}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-left font-black text-slate-800 font-mono">
                          {it.subtotal.toLocaleString()} {settings.currency}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment & Settlement Options */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                خيارات الدفع وتصفية الحساب
              </span>
              <div className="text-sm font-black text-slate-900">
                إجمالي الفاتورة: {invoiceTotal.toLocaleString()} {settings.currency}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentType('cash');
                  setPaidAmount(invoiceTotal);
                  setPaidFromCashDrawer(true);
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentType === 'cash'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                نقدي بالكامل (كاش)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentType('partial');
                  setPaidAmount(Math.round(invoiceTotal / 2));
                  setPaidFromCashDrawer(true);
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentType === 'partial'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 ring-1 ring-amber-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                سداد جزء والباقي آجل
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentType('credit');
                  setPaidAmount(0);
                  setPaidFromCashDrawer(false);
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentType === 'credit'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                آجل بالكامل (على الحساب)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentType('bank');
                  setPaidAmount(invoiceTotal);
                  setPaidFromCashDrawer(false);
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentType === 'bank'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                تحويل بنكي / إنستاباي
              </button>
            </div>

            {/* Paid Amount and Remaining Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المبلغ المدفوع للمورد الآن ({settings.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={invoiceTotal}
                  value={paymentType === 'credit' ? 0 : paidAmount}
                  disabled={paymentType === 'credit'}
                  onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 outline-none"
                />
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-xs text-slate-500 font-medium">الرصيد المتبقي مستحق على المحل (آجل):</span>
                <span className="text-base font-black text-rose-600">
                  {remainingDebt.toLocaleString()} {settings.currency}
                </span>
              </div>
            </div>

            {/* Cash Drawer toggle */}
            {computedPaidAmount > 0 && paymentType !== 'bank' && (
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paidFromCashDrawer}
                  onChange={(e) => setPaidFromCashDrawer(e.target.checked)}
                  disabled={!currentShift}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  خصم المدفوع ({computedPaidAmount.toLocaleString()} {settings.currency}) من درج النقدية بالوردية
                  الحالية
                </span>
              </label>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الفاتورة</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات حول الشحنة أو التوصيل أو الضمان..."
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="text-xs text-slate-500">
            {items.length} أصناف • الإجمالي: <b className="text-slate-800">{invoiceTotal.toLocaleString()}</b> {settings.currency}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmitInvoice}
              disabled={items.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
                items.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              حفظ الفاتورة وتوريد البضاعة
            </button>
          </div>
        </div>
      </div>

      {showAddSupplierModal && (
        <SupplierEditModal
          onClose={() => setShowAddSupplierModal(false)}
          onSaved={(newSup) => {
            setSelectedSupplierId(newSup.id);
            setShowAddSupplierModal(false);
          }}
        />
      )}
    </div>
  );
};
