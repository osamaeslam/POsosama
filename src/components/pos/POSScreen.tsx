import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CartItem, Product, Sale } from '../../types';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Split,
  ShoppingCart,
  Receipt,
  AlertCircle,
  Tag,
  CheckCircle2,
  Printer,
  Clock,
  Wallet,
} from 'lucide-react';
import { ReceiptModal } from '../invoices/ReceiptModal';
import { Customer, PaymentMethod } from '../../types';

export const POSScreen: React.FC = () => {
  const {
    t,
    products,
    categories,
    customers,
    settings,
    checkoutCart,
    currentShift,
    currentUser,
    setActiveTab,
  } = useApp();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeFeedback, setBarcodeFeedback] = useState<string | null>(null);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Credit / Debt payment state
  const [creditCustomerId, setCreditCustomerId] = useState<string>('');
  const [creditCustomerName, setCreditCustomerName] = useState<string>('');
  const [creditCustomerPhone, setCreditCustomerPhone] = useState<string>('');
  const [creditAdvancePaid, setCreditAdvancePaid] = useState<number | ''>('');

  // Wallet payment state
  const [walletProvider, setWalletProvider] = useState<string>('فودافون كاش');
  const [walletRefNumber, setWalletRefNumber] = useState<string>('');

  // Form error
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [quickSavedSale, setQuickSavedSale] = useState<Sale | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Normalize Arabic/Latin input so keyboard and scanner searches behave consistently.
  const normalizeSearch = (value: string) => value
    .toLocaleLowerCase('ar-EG')
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\s\-_/\\.]+/g, '');

  const filteredProducts = useMemo(() => {
    const query = normalizeSearch(searchQuery);
    return products
      .filter((product) => product.isActive && (selectedCategory === 'all' || product.categoryId === selectedCategory))
      .map((product) => ({ product, name: normalizeSearch(product.name), barcode: normalizeSearch(product.barcode || '') }))
      .filter(({ name, barcode }) => !query || name.includes(query) || barcode.includes(query))
      .sort((a, b) => {
        if (!query) return 0;
        const aExact = a.barcode === query || a.name === query;
        const bExact = b.barcode === query || b.name === query;
        return Number(bExact) - Number(aExact);
      })
      .map(({ product }) => product);
  }, [products, searchQuery, selectedCategory]);

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      setBarcodeFeedback(`المنتج "${product.name}" نفد رصيده من المخزن!`);
      setTimeout(() => setBarcodeFeedback(null), 3000);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setBarcodeFeedback(`وصلت لأقصى رصيد متاح بالمخزن (${product.stock})`);
          setTimeout(() => setBarcodeFeedback(null), 3000);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            price: product.price,
            discount: 0,
            subtotal: product.price,
          },
        ];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              setBarcodeFeedback(`الرصيد المتاح ${item.product.stock} فقط`);
              setTimeout(() => setBarcodeFeedback(null), 2500);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove single item
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Handle barcode scanner input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;
    const normalizedCode = normalizeSearch(code);

    const matched = products.find(
      (p) => normalizeSearch(p.barcode || '') === normalizedCode && p.isActive
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
      setBarcodeFeedback(`تمت إضافة: ${matched.name}`);
      setTimeout(() => setBarcodeFeedback(null), 2000);
    } else {
      setBarcodeFeedback(`لم يتم العثور على منتج بهذا الباركود (${code})`);
      setTimeout(() => setBarcodeFeedback(null), 3500);
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = settings.enableTax ? (subtotal * settings.taxRate) / 100 : 0;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  const parsedCashReceived = parseFloat(cashReceived) || grandTotal;
  const changeDue =
    paymentMethod === 'cash' && parsedCashReceived > grandTotal
      ? parsedCashReceived - grandTotal
      : 0;

  // Checkout submission
  const handleCheckout = (shouldPrint: boolean = false) => {
    if (cart.length === 0) return;
    setCheckoutError(null);

    // If credit payment, validate customer
    let targetCustomerId: string | undefined = undefined;
    let targetCustomerName: string | undefined = undefined;
    let targetCustomerPhone: string | undefined = undefined;

    if (paymentMethod === 'credit') {
      if (creditCustomerId && creditCustomerId !== 'new') {
        const found = customers.find((c) => c.id === creditCustomerId);
        if (found) {
          targetCustomerId = found.id;
          targetCustomerName = found.name;
          targetCustomerPhone = found.phone;
        }
      } else {
        if (!creditCustomerName.trim()) {
          setCheckoutError('يرجى تحديد أو كتابة اسم العميل لتسجيل الفاتورة الآجلة');
          return;
        }
        targetCustomerName = creditCustomerName.trim();
        targetCustomerPhone = creditCustomerPhone.trim();
      }
    }

    const advancePaid = Number(creditAdvancePaid) || 0;
    if (paymentMethod === 'credit' && advancePaid > grandTotal) {
      setCheckoutError('المبلغ المدفوع مقدماً لا يمكن أن يتجاوز إجمالي الفاتورة');
      return;
    }

    const sale = checkoutCart(
      cart,
      paymentMethod,
      discountAmount,
      paymentMethod === 'cash' ? parsedCashReceived : undefined,
      notes,
      {
        customerId: targetCustomerId,
        customerName: targetCustomerName,
        customerPhone: targetCustomerPhone,
        creditPaidAmount: advancePaid,
        walletProvider: paymentMethod === 'wallet' ? walletProvider : undefined,
        walletRefNumber: paymentMethod === 'wallet' ? walletRefNumber.trim() : undefined,
      }
    );

    if (shouldPrint) {
      setCompletedSale(sale);
    } else {
      setQuickSavedSale(sale);
      setTimeout(() => setQuickSavedSale(null), 4000);
      barcodeInputRef.current?.focus();
    }

    setCart([]);
    setDiscountAmount(0);
    setCashReceived('');
    setNotes('');
    setCreditCustomerId('');
    setCreditCustomerName('');
    setCreditCustomerPhone('');
    setCreditAdvancePaid('');
    setWalletRefNumber('');
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100">
      {/* LEFT AREA: Catalog, Barcode, Categories, Product Grid */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-white">
        {/* Top search & barcode bar */}
        <div className="p-3 border-b border-slate-200 bg-white space-y-2">
          <div className="flex items-center gap-2">
            {/* Barcode scanner input */}
            <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Barcode className="w-5 h-5 text-blue-600" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="امسح الباركود واضغط Enter..."
                className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </form>

            {/* General search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو الكود..."
                className="w-full pr-9 pl-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {barcodeFeedback && (
            <div className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{barcodeFeedback}</span>
            </div>
          )}

          {quickSavedSale && (
            <div className="text-xs px-3 py-2 rounded-xl bg-emerald-600 text-white flex items-center justify-between shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>
                  تم حفظ الفاتورة <strong className="font-mono">#{quickSavedSale.invoiceNumber}</strong> بمبلغ{' '}
                  <strong>{quickSavedSale.total.toLocaleString()} {settings.currency}</strong> بنجاح بدون طباعة!
                </span>
              </div>
              <button
                onClick={() => setCompletedSale(quickSavedSale)}
                className="underline text-[11px] font-bold hover:text-emerald-100 cursor-pointer ml-2"
              >
                معاينة أو طباعة
              </button>
            </div>
          )}

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.allCategories} ({products.filter((p) => p.isActive).length})
            </button>
            {categories.map((cat) => {
              const count = products.filter(
                (p) => p.categoryId === cat.id && p.isActive
              ).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <ShoppingCart className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
              <p className="text-sm font-semibold">{t.noData}</p>
              <p className="text-xs text-slate-400 mt-1">
                جرب البحث بكلمات أخرى أو اختر قسماً مختلفاً
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock <= product.minStock && !isOutOfStock;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`relative bg-white border rounded-xl p-3 flex flex-col justify-between transition-all select-none ${
                      isOutOfStock
                        ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                        : 'hover:border-blue-500 hover:shadow-md cursor-pointer active:scale-[0.98] border-slate-200'
                    }`}
                  >
                    {/* Top barcode & status tags */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {product.barcode || 'NO-BARCODE'}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                          {t.outOfStock}
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          متبقي {product.stock}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">
                          رصيد: {product.stock}
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-2 min-h-[32px] leading-snug">
                      {product.name}
                    </h4>

                    {/* Price & Cart counter badge */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="font-extrabold text-blue-600 text-sm">
                        {product.price.toLocaleString()} {settings.currency}
                      </div>

                      {inCart && (
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT AREA: Cart, Totals & Checkout Panel */}
      <div className="w-full lg:w-[420px] bg-white flex flex-col h-auto lg:h-full shrink-0 border-t lg:border-t-0 shadow-lg z-10">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">{t.cartTitle}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              {cart.reduce((acc, i) => acc + i.quantity, 0)} {t.itemsCount}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearCart}</span>
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingCart className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">{t.emptyCart}</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-slate-900 truncate">{item.product.name}</h5>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>
                      {item.price.toLocaleString()} {settings.currency}
                    </span>
                    <span>× {item.quantity}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ({item.product.barcode})
                    </span>
                  </div>
                </div>

                {/* Counter controls */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-slate-800 text-xs">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="text-left flex items-center gap-2">
                  <div className="font-extrabold text-slate-900 text-xs whitespace-nowrap">
                    {item.subtotal.toLocaleString()} {settings.currency}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & Checkout controls */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white space-y-2.5 overflow-y-auto max-h-[55vh] lg:max-h-[65vh]">
          {/* Subtotal, Discount & Tax lines */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>{t.subtotal}:</span>
              <span className="font-semibold text-slate-900">
                {subtotal.toLocaleString()} {settings.currency}
              </span>
            </div>

            {/* Discount input line */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-slate-500">
                <Tag className="w-3.5 h-3.5" />
                <span>{t.discount}:</span>
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-20 px-2 py-0.5 border border-slate-200 rounded text-left font-bold text-xs"
                />
                <span className="text-[11px] text-slate-400">{settings.currency}</span>
              </div>
            </div>

            {settings.enableTax && (
              <div className="flex justify-between text-slate-500">
                <span>
                  {t.tax} ({settings.taxRate}%):
                </span>
                <span>
                  +{taxAmount.toLocaleString()} {settings.currency}
                </span>
              </div>
            )}

            {/* Grand Total */}
            <div className="flex justify-between items-center text-base font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>{t.total}:</span>
              <span className="text-xl text-blue-600">
                {grandTotal.toLocaleString()} {settings.currency}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setPaymentMethod('cash');
                setCheckoutError(null);
              }}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === 'cash'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>نقداً (كاش)</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('credit');
                setCheckoutError(null);
              }}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === 'credit'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>دفع آجل (حساب)</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('wallet');
                setCheckoutError(null);
              }}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === 'wallet'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>محفظة إلكترونية</span>
            </button>
          </div>

          {/* Checkout Error banner */}
          {checkoutError && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Payment Method Details Panel */}
          {/* 1. Cash Method */}
          {paymentMethod === 'cash' && grandTotal > 0 && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-700">{t.cashReceived}:</span>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={grandTotal.toString()}
                  className="w-28 px-2.5 py-1 border border-slate-300 rounded-lg text-left font-bold text-sm bg-white"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCashReceived(grandTotal.toString())}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  {t.exactAmount}
                </button>
                {[50, 100, 200, 500, 1000].map((val) => {
                  const preset = Math.ceil(grandTotal / val) * val;
                  if (preset <= grandTotal && preset !== 0) return null;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashReceived(preset.toString())}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              {changeDue > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-bold border-t border-slate-200 pt-1.5">
                  <span>{t.changeDue}:</span>
                  <span className="text-sm">
                    {changeDue.toLocaleString()} {settings.currency}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 2. Credit (Debt) Method */}
          {paymentMethod === 'credit' && grandTotal > 0 && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-amber-950 mb-1">
                  اختيار العميل لتسجيل المديونية:
                </label>
                <select
                  value={creditCustomerId}
                  onChange={(e) => {
                    setCreditCustomerId(e.target.value);
                    if (e.target.value && e.target.value !== 'new') {
                      const found = customers.find((c) => c.id === e.target.value);
                      if (found) {
                        setCreditCustomerName(found.name);
                        setCreditCustomerPhone(found.phone || '');
                      }
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold focus:outline-hidden"
                >
                  <option value="">-- اختر العميل من القائمة --</option>
                  <option value="new">+ إضافة عميل جديد سريعاً</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.totalDebt > 0 ? `(عليه دين: ${c.totalDebt} ${settings.currency})` : '(خالص)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* If new customer or empty, show text fields */}
              {(!creditCustomerId || creditCustomerId === 'new') && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-0.5">اسم العميل *</label>
                    <input
                      type="text"
                      value={creditCustomerName}
                      onChange={(e) => setCreditCustomerName(e.target.value)}
                      placeholder="اسم العميل كاملاً"
                      className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-0.5">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={creditCustomerPhone}
                      onChange={(e) => setCreditCustomerPhone(e.target.value)}
                      placeholder="010..."
                      className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Partial Cash Advance Payment */}
              <div className="pt-2 border-t border-amber-200">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800 text-[11px]">المدفوع نقداً الآن (إن وجد):</span>
                    <div className="text-[10px] text-slate-500">يدخل درج كاش الوردية فوراً</div>
                  </div>
                  <div className="relative w-28">
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={creditAdvancePaid}
                      onChange={(e) =>
                        setCreditAdvancePaid(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="0"
                      className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-left font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Remaining Debt Highlight */}
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg flex justify-between items-center text-xs">
                <span className="font-bold text-rose-800">المبلغ المتبقي كدين على العميل:</span>
                <span className="font-black text-rose-700 font-mono text-sm">
                  {Math.max(0, grandTotal - (Number(creditAdvancePaid) || 0)).toLocaleString()}{' '}
                  {settings.currency}
                </span>
              </div>
            </div>
          )}

          {/* 3. E-Wallet Method */}
          {paymentMethod === 'wallet' && grandTotal > 0 && (
            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-purple-900 mb-1">نوع المحفظة</label>
                  <select
                    value={walletProvider}
                    onChange={(e) => setWalletProvider(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="فودافون كاش">فودافون كاش (Vodafone)</option>
                    <option value="إنستاباي">إنستاباي (InstaPay)</option>
                    <option value="أورنج كاش">أورنج كاش (Orange)</option>
                    <option value="اتصالات كاش">اتصالات كاش (Etisalat)</option>
                    <option value="وي باي">وي باي (WE Pay)</option>
                    <option value="محفظة بنكية">محفظة بنكية أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-purple-900 mb-1">رقم المعاملة / المحول منها</label>
                  <input
                    type="text"
                    value={walletRefNumber}
                    onChange={(e) => setWalletRefNumber(e.target.value)}
                    placeholder="رقم مرجعي اختياري"
                    className="w-full px-2 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div className="text-[10px] text-purple-700">
                • مبيعات المحافظ الإلكترونية يتم تتبعها منفصلة ولا تحتسب ضمن نقدية الدرج الكاش.
              </div>
            </div>
          )}

          {/* Checkout Buttons */}
          <div className="space-y-2 pt-1">
            {/* Button 1: Save invoice without printing */}
            <button
              onClick={() => handleCheckout(false)}
              disabled={cart.length === 0}
              className={`w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-700/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>إتمام وحفظ الفاتورة (بدون طباعة)</span>
              <span className="font-mono text-xs opacity-90">
                ({grandTotal.toLocaleString()} {settings.currency})
              </span>
            </button>

            {/* Button 2: Save & Print receipt */}
            <button
              onClick={() => handleCheckout(true)}
              disabled={cart.length === 0}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                cart.length === 0
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 active:scale-[0.99]'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>إتمام البيع مع طباعة الإيصال (حراري / A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
          isNewSale={true}
        />
      )}
    </div>
  );
};
