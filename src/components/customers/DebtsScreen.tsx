import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, DebtPayment } from '../../types';
import { DebtReceiptModal } from '../invoices/DebtReceiptModal';
import {
  Users,
  Search,
  Plus,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Wallet,
  Banknote,
  Edit2,
  Trash2,
  Receipt,
  Printer,
  X,
  History,
} from 'lucide-react';

export const DebtsScreen: React.FC = () => {
  const {
    customers,
    debtPayments,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    payCustomerDebt,
    settings,
    currentShift,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'with_debt' | 'settled'>('all');
  const [activeTab, setActiveTab] = useState<'customers' | 'history'>('customers');

  // Customer Add/Edit Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  // Debt Payment Modal
  const [paymentModalCustomer, setPaymentModalCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'wallet'>('cash');
  const [payWalletProvider, setPayWalletProvider] = useState('فودافون كاش');
  const [payNotes, setPayNotes] = useState('');

  // Printable receipt state
  const [receiptToShow, setReceiptToShow] = useState<{
    payment: DebtPayment;
    customer?: Customer;
  } | null>(null);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterMode === 'with_debt') return (c.totalDebt || 0) > 0;
      if (filterMode === 'settled') return (c.totalDebt || 0) === 0;
      return true;
    });
  }, [customers, searchQuery, filterMode]);

  // Overall statistics
  const totalOutstandingDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0);
  }, [customers]);

  const countWithDebt = useMemo(() => {
    return customers.filter((c) => (c.totalDebt || 0) > 0).length;
  }, [customers]);

  // Handle open customer modal
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({ name: '', phone: '', address: '', notes: '' });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setCustomerForm({
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      notes: c.notes || '',
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        address: customerForm.address.trim(),
        notes: customerForm.notes.trim(),
      });
    } else {
      addCustomer({
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        address: customerForm.address.trim(),
        notes: customerForm.notes.trim(),
      });
    }

    setIsCustomerModalOpen(false);
  };

  // Open Pay Debt Modal
  const handleOpenPayDebt = (c: Customer) => {
    setPaymentModalCustomer(c);
    setPayAmount(c.totalDebt);
    setPayMethod('cash');
    setPayWalletProvider('فودافون كاش');
    setPayNotes('');
  };

  // Execute Pay Debt
  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalCustomer || !payAmount || payAmount <= 0) return;

    const payment = payCustomerDebt(
      paymentModalCustomer.id,
      Number(payAmount),
      payMethod,
      payMethod === 'wallet' ? payWalletProvider : undefined,
      payNotes.trim() || undefined
    );

    // Get refreshed customer state
    const updatedCust = customers.find((c) => c.id === paymentModalCustomer.id);
    const simulatedCust = updatedCust
      ? { ...updatedCust, totalDebt: Math.max(0, updatedCust.totalDebt - Number(payAmount)) }
      : paymentModalCustomer;

    setPaymentModalCustomer(null);
    // Show printable receipt immediately
    setReceiptToShow({ payment, customer: simulatedCust });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Banner / Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">إجمالي ديون العملاء الحالية</div>
            <div className="text-xl md:text-2xl font-black text-rose-600 font-mono mt-1">
              {totalOutstandingDebt.toLocaleString()} {settings.currency}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">مستحقات آجلة للمحل طرف العملاء</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">العملاء المدينون</div>
            <div className="text-xl md:text-2xl font-black text-amber-600 font-mono mt-1">
              {countWithDebt} <span className="text-xs font-normal text-slate-500">من إجمالي {customers.length}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">عملاء عليهم مبالغ متبقية</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">تحصيلات الوردية الحالية</div>
            <div className="text-xl md:text-2xl font-black text-emerald-600 font-mono mt-1">
              {(currentShift?.totalDebtCollectionsCash || 0).toLocaleString()} {settings.currency}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">كاش تم تحصيله ومضاف لدرج النقدية</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Card with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Card Header & Controls */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'customers'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>قائمة العملاء والمديونيات</span>
              <span className="px-1.5 py-0.2 bg-black/15 rounded-full text-[10px]">
                {customers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>سجل التحصيلات وسندات القبض</span>
              <span className="px-1.5 py-0.2 bg-black/15 rounded-full text-[10px]">
                {debtPayments.length}
              </span>
            </button>
          </div>

          {/* Add Customer Button */}
          <button
            onClick={handleOpenAddCustomer}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عميل جديد</span>
          </button>
        </div>

        {/* Tab 1: Customers & Debts */}
        {activeTab === 'customers' && (
          <div>
            {/* Search & Filter bar */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم العميل أو رقم الهاتف..."
                  className="w-full pr-9 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    filterMode === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  الكل ({customers.length})
                </button>
                <button
                  onClick={() => setFilterMode('with_debt')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    filterMode === 'with_debt'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white text-rose-600 border border-slate-200 hover:bg-rose-50'
                  }`}
                >
                  عليه دين ({countWithDebt})
                </button>
                <button
                  onClick={() => setFilterMode('settled')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    filterMode === 'settled'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-emerald-600 border border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  خالص الحساب ({customers.length - countWithDebt})
                </button>
              </div>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3.5">اسم العميل</th>
                    <th className="p-3.5">رقم الهاتف</th>
                    <th className="p-3.5">العنوان / المنطقة</th>
                    <th className="p-3.5 text-center">المديونية الحالية</th>
                    <th className="p-3.5">ملاحظات</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        لا يوجد عملاء يطابقون البحث
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const hasDebt = (cust.totalDebt || 0) > 0;
                      return (
                        <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {cust.name.slice(0, 1)}
                              </div>
                              <span>{cust.name}</span>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">
                            {cust.phone ? (
                              <a
                                href={`tel:${cust.phone}`}
                                className="flex items-center gap-1 hover:text-blue-600"
                              >
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{cust.phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {cust.address ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{cust.address}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center font-mono">
                            {hasDebt ? (
                              <span className="inline-block px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-black border border-rose-200">
                                {cust.totalDebt.toLocaleString()} {settings.currency}
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                خالص الحساب (0)
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-500 max-w-[200px] truncate">
                            {cust.notes || '-'}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {hasDebt && (
                                <button
                                  onClick={() => handleOpenPayDebt(cust)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                  title="سداد مديونية العميل"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>سداد دين</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditCustomer(cust)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                title="تعديل بيانات العميل"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!hasDebt && (
                                <button
                                  onClick={() => {
                                    if (confirm(`هل أنت متأكد من حذف العميل "${cust.name}"؟`)) {
                                      deleteCustomer(cust.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="حذف العميل"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Debt Repayments History */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3.5">رقم الإيصال</th>
                  <th className="p-3.5">اسم العميل</th>
                  <th className="p-3.5">المبلغ المسدد</th>
                  <th className="p-3.5">طريقة السداد</th>
                  <th className="p-3.5">التاريخ والوقت</th>
                  <th className="p-3.5">الكاشير</th>
                  <th className="p-3.5 text-center">طباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {debtPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      لا يوجد سندات سداد مديونيات مسجلة حتى الآن
                    </td>
                  </tr>
                ) : (
                  debtPayments.map((dp) => (
                    <tr key={dp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-600">
                        {dp.receiptNumber}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{dp.customerName}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-600">
                        {dp.amount.toLocaleString()} {settings.currency}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          {dp.paymentMethod === 'cash' ? (
                            <>
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                              <span>كاش (خزينة الوردية)</span>
                            </>
                          ) : (
                            <>
                              <Wallet className="w-3.5 h-3.5 text-purple-600" />
                              <span>محفظة {dp.walletProvider ? `(${dp.walletProvider})` : ''}</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {new Date(dp.createdAt).toLocaleString('ar-EG')}
                      </td>
                      <td className="p-3.5 text-slate-600">{dp.cashierName}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            const foundCust = customers.find((c) => c.id === dp.customerId);
                            setReceiptToShow({ payment: dp, customer: foundCust });
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1 cursor-pointer font-bold"
                          title="عرض وطباعة الإيصال"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>إيصال</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Add / Edit Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="مثال: أحمد محمد علي"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="مثال: 01012345678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">العنوان / المنطقة</label>
                <input
                  type="text"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder="مثال: شارع التحرير - الدقي"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  placeholder="أي تفاصيل عن فترات السداد أو الاتفاق..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {paymentModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">سداد مديونية عميل</h3>
                  <div className="text-[11px] text-slate-500">{paymentModalCustomer.name}</div>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-4 text-xs">
              {/* Current Debt Badge */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                <span className="text-rose-800 font-semibold">إجمالي المديونية المستحقة:</span>
                <span className="font-black text-rose-700 text-sm font-mono">
                  {paymentModalCustomer.totalDebt.toLocaleString()} {settings.currency}
                </span>
              </div>

              {/* Amount to pay */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-800">المبلغ المسدد الآن *</label>
                  <button
                    type="button"
                    onClick={() => setPayAmount(paymentModalCustomer.totalDebt)}
                    className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    سداد كامل المبلغ
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={paymentModalCustomer.totalDebt}
                    required
                    value={payAmount}
                    onChange={(e) =>
                      setPayAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-base font-bold focus:outline-hidden focus:border-blue-500"
                    placeholder="0"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    {settings.currency}
                  </span>
                </div>
              </div>

              {/* Remaining calculation preview */}
              {payAmount && (
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg flex justify-between">
                  <span>المتبقي بعد هذا السداد:</span>
                  <span className="font-bold font-mono text-slate-800">
                    {Math.max(0, paymentModalCustomer.totalDebt - Number(payAmount)).toLocaleString()}{' '}
                    {settings.currency}
                  </span>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">طريقة التحصيل</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      payMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>نقداً (كاش بالخزينة)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('wallet')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      payMethod === 'wallet'
                        ? 'border-purple-600 bg-purple-50 text-purple-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-purple-600" />
                    <span>محفظة إلكترونية</span>
                  </button>
                </div>
              </div>

              {/* If Wallet, select provider */}
              {payMethod === 'wallet' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نوع المحفظة</label>
                  <select
                    value={payWalletProvider}
                    onChange={(e) => setPayWalletProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 text-xs"
                  >
                    <option value="فودافون كاش">فودافون كاش (Vodafone Cash)</option>
                    <option value="إنستاباي">إنستاباي (InstaPay)</option>
                    <option value="أورنج كاش">أورنج كاش (Orange Cash)</option>
                    <option value="اتصالات كاش">اتصالات كاش (Etisalat Cash)</option>
                    <option value="وي باي">وي باي (WE Pay)</option>
                    <option value="محفظة بنكية">محفظة بنكية أخرى</option>
                  </select>
                </div>
              )}

              {/* Shift drawer alert */}
              {payMethod === 'cash' && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-start gap-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                  <span>
                    سيتم ترحيل هذا المبلغ ({Number(payAmount || 0).toLocaleString()} {settings.currency}) فوراً إلى درج نقدية الوردية الحالية في الخزينة.
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات سند القبض</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="مثال: دفعة أسبوعية نقداً باليد"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalCustomer(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>تأكيد التحصيل وإصدار الإيصال</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt Payment Receipt Modal */}
      {receiptToShow && (
        <DebtReceiptModal
          payment={receiptToShow.payment}
          customer={receiptToShow.customer}
          onClose={() => setReceiptToShow(null)}
        />
      )}
    </div>
  );
};
