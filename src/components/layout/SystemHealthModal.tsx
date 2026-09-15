import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
  X,
  Zap,
  Layers,
  Database,
} from 'lucide-react';
import { CacheCleanupResult } from '../../types';

interface SystemHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemHealthModal: React.FC<SystemHealthModalProps> = ({ isOpen, onClose }) => {
  const { isOnline, getStorageStats, cleanTempCache, settings } = useApp();
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<CacheCleanupResult | null>(null);

  if (!isOpen) return null;

  const stats = getStorageStats();

  const handleCleanCache = async () => {
    setCleaning(true);
    setCleanResult(null);
    try {
      // Small simulated delay for optical feedback
      await new Promise((resolve) => setTimeout(resolve, 600));
      const result = await cleanTempCache();
      setCleanResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">حالة النظام والأداء المحلي</h3>
              <p className="text-xs text-slate-500">نظام أوفلاين مستقل 100% عالي السرعة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Banner */}
        <div className="mt-4 p-3.5 rounded-xl border bg-emerald-50/80 border-emerald-200 text-emerald-900 flex items-start gap-3">
          <div className="mt-0.5 w-7 h-7 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold flex items-center gap-2">
              <span>النظام يعمل بكامل طاقته ومحلي 100%</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-mono font-bold">
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-emerald-800 mt-1 leading-relaxed">
              {isOnline
                ? 'متصل بالشبكة ومع ذلك جميع العمليات المحاسبية، المخزون، والطباعة تعمل محلياً وفورياً دون أي تأخير أو اعتمادية على الإنترنت.'
                : 'أوفلاين بالكامل! يمكنك البيع ومسح الباركود وإصدار الفواتير وطباعتها بدون إنترنت على الإطلاق وبدون أي توقف.'}
            </p>
          </div>
        </div>

        {/* Storage & Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="flex items-center justify-center text-blue-600 mb-1">
              <Database className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-slate-500">محرك البيانات</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              {stats.storageType === 'sqlite' ? 'SQLite Desktop' : 'IndexedDB Engine'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="flex items-center justify-center text-purple-600 mb-1">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-slate-500">حجم البيانات التقديري</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono">
              {stats.estimatedSizeKb} KB
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="flex items-center justify-center text-emerald-600 mb-1">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-slate-500">سرعة الاستجابة</div>
            <div className="text-xs font-bold text-emerald-700 mt-0.5 font-mono">
              &lt; 2ms (لحظي)
            </div>
          </div>
        </div>

        {/* Data counts bar */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 mb-4">
          <div className="flex justify-between text-slate-600">
            <span>المنتجات المسجلة في المتجر:</span>
            <span className="font-bold text-slate-900">{stats.totalProducts} منتج</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>الفواتير والعمليات المخزنة:</span>
            <span className="font-bold text-slate-900">{stats.totalSales} فاتورة</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>سجلات العملاء والمديونيات:</span>
            <span className="font-bold text-slate-900">{stats.totalCustomers} عميل</span>
          </div>
          {stats.lastCleanedAt && (
            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200">
              <span>آخر تنظيف دوري للذاكرة:</span>
              <span className="font-mono">
                {new Date(stats.lastCleanedAt).toLocaleTimeString('ar-EG', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Clean Result Alert */}
        {cleanResult && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{cleanResult.message}</span>
            </div>
            <span className="font-bold font-mono text-[11px] bg-blue-200/70 px-2 py-0.5 rounded text-blue-950">
              +{(cleanResult.freedBytes / 1024).toFixed(1)} KB
            </span>
          </div>
        )}

        {/* Speed Optimization & Periodic Cleanup Button */}
        <div className="space-y-2">
          <button
            onClick={handleCleanCache}
            disabled={cleaning}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {cleaning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري تنظيف الذاكرة المؤقتة وضغط السجلات...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>تنظيف الذاكرة المؤقتة وتسريع الأداء الآن</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            يقوم بتفريغ الفهارس المؤقتة غير المستخدمة وضغط كتل البيانات لضمان أعلى سرعة لمسح الباركود والطباعة.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
