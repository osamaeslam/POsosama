import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Zap,
  Truck,
  Wrench,
  Package,
  MoreHorizontal,
  DollarSign,
} from 'lucide-react';

export const ExpensesScreen: React.FC = () => {
  const { t, expenses, settings, addExpense, deleteExpense, currentShift, currentUser } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('operations');
  const [notes, setNotes] = useState('');

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  const shiftExpenseAmount = currentShift ? currentShift.totalExpenses : 0;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount) || 0;
    if (!title.trim() || parsedAmount <= 0) return;

    addExpense({
      title,
      amount: parsedAmount,
      category,
      notes,
    });

    setTitle('');
    setAmount('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const getCategoryBadge = (cat: Expense['category']) => {
    switch (cat) {
      case 'rent':
        return { label: t.rent, icon: Building2, color: 'bg-indigo-50 text-indigo-700' };
      case 'utilities':
        return { label: t.utilities, icon: Zap, color: 'bg-amber-50 text-amber-700' };
      case 'operations':
        return { label: t.operations, icon: Truck, color: 'bg-blue-50 text-blue-700' };
      case 'maintenance':
        return { label: t.maintenance, icon: Wrench, color: 'bg-emerald-50 text-emerald-700' };
      case 'supplies':
        return { label: t.supplies, icon: Package, color: 'bg-purple-50 text-purple-700' };
      default:
        return { label: t.other, icon: MoreHorizontal, color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-500" />
            <span>{t.expenses}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تسجيل ومتابعة المصروفات التشغيلية والنثرية وخصمها من أرباح ونقدية الوردية
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addExpense}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">إجمالي المصروفات المسجلة</span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalExpenseAmount.toLocaleString()} <span className="text-xs text-slate-400 font-bold">{settings.currency}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">كافة الفواتير والمصروفات المسجلة بالنظام</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">مصروفات الوردية الحالية المفتوحة</span>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {shiftExpenseAmount.toLocaleString()} <span className="text-xs text-slate-400 font-bold">{settings.currency}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">يتم خصمها من رصيد الدرج عند تقفيل اليومية</p>
        </div>
      </div>

      {/* Expenses Table */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Wallet className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300" />
          <p className="text-sm font-semibold">{t.noData}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3.5">بيان المصروف</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">التاريخ والوقت</th>
                  <th className="p-3.5">ملاحظات</th>
                  <th className="p-3.5 text-left">المبلغ</th>
                  <th className="p-3.5 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((expense) => {
                  const badge = getCategoryBadge(expense.category);
                  const Icon = badge.icon;

                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{expense.title}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(expense.createdAt).toLocaleDateString('ar-EG')}{' '}
                        {new Date(expense.createdAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3.5 text-slate-500">{expense.notes || '—'}</td>
                      <td className="p-3.5 text-left font-black text-rose-600 font-mono">
                        -{expense.amount.toLocaleString()} {settings.currency}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`حذف مصروف: "${expense.title}"؟`)) {
                              deleteExpense(expense.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95"
          >
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-500" />
              <span>{t.addExpense}</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.expenseTitle} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء المحل"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.expenseAmount} * ({settings.currency})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.expenseCategory}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="operations">{t.operations}</option>
                  <option value="utilities">{t.utilities}</option>
                  <option value="rent">{t.rent}</option>
                  <option value="maintenance">{t.maintenance}</option>
                  <option value="supplies">{t.supplies}</option>
                  <option value="other">{t.other}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.notes}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي تفاصيل إضافية أو اسم المستلم..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
