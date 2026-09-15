import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, SupplierInvoice, SupplierPayment } from '../../types';
import {
  Truck,
  Plus,
  Search,
  Building2,
  DollarSign,
  Receipt,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Wallet,
  ArrowUpRight,
  Filter,
  Eye,
  Trash2,
  Edit,
} from 'lucide-react';
import { SupplierInvoiceModal } from './SupplierInvoiceModal';
import { SupplierEditModal } from './SupplierEditModal';
import { PaySupplierModal } from './PaySupplierModal';
import { SupplierInvoiceDetailsModal } from './SupplierInvoiceDetailsModal';

export const SuppliersScreen: React.FC = () => {
  const { suppliers = [], supplierInvoices = [], supplierPayments = [], deleteSupplier, settings } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'suppliers' | 'vouchers'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  // Modals state
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<Supplier | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<Supplier | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<SupplierInvoice | null>(null);

  // Financial KPIs
  const totalPayableDebt = useMemo(() => {
    return suppliers.reduce((acc, s) => acc + (s.totalPayable || 0), 0);
  }, [suppliers]);

  const totalPurchasesVolume = useMemo(() => {
    return supplierInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  }, [supplierInvoices]);

  const totalPaymentsMade = useMemo(() => {
    return supplierPayments.reduce((acc, p) => acc + p.amount, 0);
  }, [supplierPayments]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return supplierInvoices.filter((inv) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.supplierName.toLowerCase().includes(q) ||
        (inv.supplierInvoiceRef && inv.supplierInvoiceRef.toLowerCase().includes(q)) ||
        (inv.supplierPhone && inv.supplierPhone.includes(q));

      const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [supplierInvoices, searchQuery, statusFilter]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        sup.name.toLowerCase().includes(q) ||
        (sup.companyName && sup.companyName.toLowerCase().includes(q)) ||
        (sup.phone && sup.phone.includes(q));

      if (statusFilter === 'unpaid' || statusFilter === 'partial') {
        return matchesSearch && (sup.totalPayable || 0) > 0;
      }
      if (statusFilter === 'paid') {
        return matchesSearch && (sup.totalPayable || 0) === 0;
      }
      return matchesSearch;
    });
  }, [suppliers, searchQuery, statusFilter]);

  // Filtered Payments / Vouchers
  const filteredPayments = useMemo(() => {
    return supplierPayments.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      return (
        !q ||
        p.receiptNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    });
  }, [supplierPayments, searchQuery]);

  const handleDeleteSupplier = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المورد "${name}"؟`)) {
      try {
        deleteSupplier(id);
      } catch (err: any) {
        alert(err.message || 'فشل حذف المورد');
      }
    }
  };

  const handleOpenPayForSupplier = (supplierId: string) => {
    const s = suppliers.find((sup) => sup.id === supplierId);
    if (s) {
      setSelectedSupplierForPay(s);
      setShowPayModal(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100/60 overflow-hidden">
      {/* Top Header & Metrics */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-200 shrink-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black text-slate-900">إدارة الموردين وفواتير الشراء</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة توريد البضاعة، تحديث المخزون التلقائي، وإدارة ديون وسندات دفعات الموردين
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedSupplierForEdit(null);
                setShowEditSupplierModal(true);
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              إضافة مورد جديد
            </button>
            <button
              type="button"
              onClick={() => setShowNewInvoiceModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              + تسجيل فاتورة توريد جديدة
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Payable */}
          <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl">
            <div className="flex items-center justify-between text-xs text-rose-600 font-bold mb-1">
              <span>إجمالي مستحقات الموردين (آجل)</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-rose-700">
              {totalPayableDebt.toLocaleString()} {settings.currency}
            </div>
            <div className="text-[10px] text-rose-500 mt-0.5">
              على {suppliers.filter((s) => (s.totalPayable || 0) > 0).length} موردين تجاريين
            </div>
          </div>

          {/* Card 2: Total Invoices */}
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
            <div className="flex items-center justify-between text-xs text-indigo-600 font-bold mb-1">
              <span>فواتير التوريد المسجلة</span>
              <Receipt className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-indigo-900">{supplierInvoices.length}</div>
            <div className="text-[10px] text-indigo-600 mt-0.5">
              إجمالي مشتريات: {totalPurchasesVolume.toLocaleString()} {settings.currency}
            </div>
          </div>

          {/* Card 3: Total Suppliers */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
              <span>إجمالي الموردين</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-black text-slate-800">{suppliers.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">شركات وموزعين معتمدين</div>
          </div>

          {/* Card 4: Payments Settled */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <div className="flex items-center justify-between text-xs text-emerald-600 font-bold mb-1">
              <span>سندات الصرف والمسددات</span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-800">
              {totalPaymentsMade.toLocaleString()} {settings.currency}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{supplierPayments.length} سند صرف مسجل</div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('invoices');
                setStatusFilter('all');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'invoices' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              فواتير التوريد والمشتريات ({supplierInvoices.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('suppliers');
                setStatusFilter('all');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'suppliers' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              دليل الموردين والأرصدة ({suppliers.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('vouchers');
                setStatusFilter('all');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'vouchers' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سندات سداد الدفعات ({supplierPayments.length})
            </button>
          </div>

          {/* Search Bar & Filter */}
          <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeSubTab === 'invoices'
                    ? 'بحث برقم الفاتورة أو المورد أو المرجع...'
                    : activeSubTab === 'suppliers'
                    ? 'بحث باسم المورد أو الشركة أو الهاتف...'
                    : 'بحث برقم السند أو اسم المورد...'
                }
                className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            {activeSubTab !== 'vouchers' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">كل الحالات</option>
                <option value="paid">مسددة بالكامل</option>
                <option value="partial">سداد جزئي</option>
                <option value="unpaid">آجل (متبقي)</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: Supplier Invoices List */}
      {activeSubTab === 'invoices' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredInvoices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">لا توجد فواتير توريد مطابقة</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'لم يتم العثور على فواتير مطابقة لبحثك. جرب كلمة بحث أخرى.'
                  : 'ابدأ بتسجيل أول فاتورة شراء أو توريد بضاعة للمحل وسيتم تحديث المخزون وحسابات الموردين فوراً.'}
              </p>
              <button
                type="button"
                onClick={() => setShowNewInvoiceModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                تسجيل فاتورة توريد جديدة
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">رقم الفاتورة</th>
                      <th className="py-3 px-4">مرجع المورد</th>
                      <th className="py-3 px-4">المورد التجاري</th>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">الأصناف</th>
                      <th className="py-3 px-4">الإجمالي</th>
                      <th className="py-3 px-4">المدفوع</th>
                      <th className="py-3 px-4">المتبقي (الآجل)</th>
                      <th className="py-3 px-4">حالة السداد</th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-indigo-700">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{inv.supplierInvoiceRef || '—'}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{inv.supplierName}</div>
                          {inv.supplierPhone && (
                            <div className="text-[10px] text-slate-400 font-mono">{inv.supplierPhone}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(inv.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{inv.items.length} صنف</td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {inv.totalAmount.toLocaleString()} {settings.currency}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700">
                          {inv.paidAmount.toLocaleString()} {settings.currency}
                        </td>
                        <td className="py-3 px-4 font-black text-rose-600">
                          {inv.remainingDebt.toLocaleString()} {settings.currency}
                        </td>
                        <td className="py-3 px-4">
                          {inv.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3" />
                              مسددة
                            </span>
                          ) : inv.paymentStatus === 'partial' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              سداد جزئي
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertCircle className="w-3 h-3" />
                              آجل
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceForDetails(inv);
                                setShowDetailsModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="عرض تفاصيل الفاتورة وطباعة إذن التوريد"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              عرض
                            </button>

                            {inv.remainingDebt > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenPayForSupplier(inv.supplierId)}
                                className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="سداد دفعة للمورد"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                سداد
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Suppliers & Accounts Directory */}
      {activeSubTab === 'suppliers' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredSuppliers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">لا يوجد موردين مطابقين</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                قم بإضافة بيانات الشركات والموزعين لتتبع كشوف الحسابات والمديونيات.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedSupplierForEdit(null);
                  setShowEditSupplierModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                إضافة مورد تجاري جديد
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSuppliers.map((sup) => {
                const supInvoices = supplierInvoices.filter((inv) => inv.supplierId === sup.id);
                const hasPayable = (sup.totalPayable || 0) > 0;

                return (
                  <div
                    key={sup.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-indigo-200 transition-colors"
                  >
                    {/* Top Row */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm truncate">{sup.name}</h3>
                            <p className="text-xs text-slate-500 truncate">{sup.companyName || 'مؤسسة تجارية'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplierForEdit(sup);
                              setShowEditSupplierModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="تعديل بيانات المورد"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف المورد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Contact and address */}
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        {sup.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono text-slate-700">{sup.phone}</span>
                          </div>
                        )}
                        {sup.address && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{sup.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary & Actions */}
                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">الرصيد المستحق (الآجل):</span>
                        <span
                          className={`text-sm font-black ${
                            hasPayable ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {(sup.totalPayable || 0).toLocaleString()} {settings.currency}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>فواتير مسجلة: {supInvoices.length}</span>
                        <span>آخر تحديث: {new Date(sup.updatedAt).toLocaleDateString('ar-EG')}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupplierForPay(sup);
                            setShowPayModal(true);
                          }}
                          disabled={!hasPayable}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            hasPayable
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          سداد دفعة
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Payment Vouchers Log */}
      {activeSubTab === 'vouchers' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredPayments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">لا توجد سندات سداد مسجلة</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                عند سداد دفعات للموردين ستظهر جميع السندات هنا موثقة مع مصدر الصرف (الدرج أو البنك).
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">رقم السند</th>
                      <th className="py-3 px-4">المورد التجاري</th>
                      <th className="py-3 px-4">التاريخ والوقت</th>
                      <th className="py-3 px-4">المبلغ المسدد</th>
                      <th className="py-3 px-4">طريقة السداد</th>
                      <th className="py-3 px-4">درج النقدية</th>
                      <th className="py-3 px-4">المسؤول</th>
                      <th className="py-3 px-4">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-emerald-700">{pay.receiptNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{pay.supplierName}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(pay.createdAt).toLocaleString('ar-EG')}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900 text-sm">
                          {pay.amount.toLocaleString()} {settings.currency}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-700">
                            {pay.paymentMethod === 'cash'
                              ? 'نقدي (كاش)'
                              : pay.paymentMethod === 'bank'
                              ? 'تحويل بنكي'
                              : 'محفظة إلكترونية'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {pay.paidFromCashDrawer ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                              خصم من الدرج
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">خارج الدرج</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{pay.userName}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{pay.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showNewInvoiceModal && (
        <SupplierInvoiceModal
          onClose={() => setShowNewInvoiceModal(false)}
          onCreated={(inv) => {
            setSelectedInvoiceForDetails(inv);
            setShowDetailsModal(true);
          }}
        />
      )}

      {showEditSupplierModal && (
        <SupplierEditModal
          supplier={selectedSupplierForEdit}
          onClose={() => setShowEditSupplierModal(false)}
        />
      )}

      {showPayModal && selectedSupplierForPay && (
        <PaySupplierModal
          supplier={selectedSupplierForPay}
          onClose={() => {
            setShowPayModal(false);
            setSelectedSupplierForPay(null);
          }}
        />
      )}

      {showDetailsModal && selectedInvoiceForDetails && (
        <SupplierInvoiceDetailsModal
          invoice={selectedInvoiceForDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedInvoiceForDetails(null);
          }}
          onPayRemaining={() => {
            handleOpenPayForSupplier(selectedInvoiceForDetails.supplierId);
            setShowDetailsModal(false);
          }}
        />
      )}
    </div>
  );
};
