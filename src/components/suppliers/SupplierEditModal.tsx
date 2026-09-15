import React, { useState } from 'react';
import { Supplier } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Building2, Phone, MapPin, FileText, CheckCircle2, User } from 'lucide-react';

interface SupplierEditModalProps {
  supplier?: Supplier | null;
  onClose: () => void;
  onSaved?: (supplier: Supplier) => void;
}

export const SupplierEditModal: React.FC<SupplierEditModalProps> = ({ supplier, onClose, onSaved }) => {
  const { addSupplier, updateSupplier } = useApp();
  const [name, setName] = useState(supplier?.name || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [companyName, setCompanyName] = useState(supplier?.companyName || '');
  const [address, setAddress] = useState(supplier?.address || '');
  const [notes, setNotes] = useState(supplier?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم المورد');
      return;
    }

    try {
      if (supplier) {
        updateSupplier(supplier.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          companyName: companyName.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        if (onSaved) {
          onSaved({
            ...supplier,
            name: name.trim(),
            phone: phone.trim() || undefined,
            companyName: companyName.trim() || undefined,
            address: address.trim() || undefined,
            notes: notes.trim() || undefined,
          });
        }
      } else {
        const created = addSupplier({
          name: name.trim(),
          phone: phone.trim() || undefined,
          companyName: companyName.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        if (onSaved) {
          onSaved(created);
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ بيانات المورد');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {supplier ? 'تعديل بيانات المورد' : 'إضافة مورد تجاري جديد'}
              </h3>
              <p className="text-xs text-slate-500">حسابات التوريد وفواتير الشراء والآجل</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              اسم المورد / جهة التوريد <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="مثال: شركة النيل للإلكترونيات أو الحاج محمود"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                اسم الشركة أو المؤسسة
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="مثال: النيل للتوزيع"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                رقم الهاتف / واتساب
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 01012345678"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              عنوان المورد أو المخزن الرئيسي
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: شارع التحرير، الدقي، الجيزة"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              ملاحظات أو شروط السداد والخصومات
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تسهيلات دفع 30 يوم، خصم 5% عند السداد النقدي الفوري"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {supplier ? 'تحديث البيانات' : 'حفظ المورد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
