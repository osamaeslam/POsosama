import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  User as UserIcon,
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  Globe,
  AlertCircle,
  Store,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, language, setLanguage, t, settings } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = login(username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || (language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
    }
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
    const result = login(user, pass);
    if (!result.success) {
      setError(result.error || 'خطأ في تسجيل الدخول');
    }
  };

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-between p-4 sm:p-6 font-sans select-none overflow-y-auto"
    >
      {/* Top Bar with Language Switcher & System Badge */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <img
              src="/assets/iconr.png"
              alt="Bayaa"
              className="w-7 h-7 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Store className="w-5 h-5 hidden" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">
              {settings.storeName || 'بياع POS'}
            </h1>
            <p className="text-[11px] text-slate-400">
              {language === 'ar' ? 'نظام نقاط البيع المحلي' : 'Offline Point of Sale'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 sm:p-8 bg-slate-50/70 border-b border-slate-100 text-center relative">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 border border-blue-200/60 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">
              {language === 'ar' ? 'تسجيل الدخول للنظام' : 'Sign In to System'}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {language === 'ar'
                ? 'يرجى إدخال اسم المستخدم وكلمة المرور للمتابعة'
                : 'Enter your username and password to continue'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-medium animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'ar' ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  className="w-full ps-9 pe-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full ps-9 pe-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70"
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
            </button>

            {/* Quick Access Helper */}
            <div className="pt-4 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 text-center mb-2">
                {language === 'ar' ? 'الحسابات الجاهزة للاختبار:' : 'Quick demo accounts:'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', '123')}
                  className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-lg text-left text-xs transition-colors cursor-pointer group"
                >
                  <div className="font-bold text-blue-900 group-hover:text-blue-700 flex items-center justify-between">
                    <span>المدير (admin)</span>
                    <span className="text-[10px] font-mono bg-blue-200 text-blue-800 px-1 rounded">123</span>
                  </div>
                  <div className="text-[10px] text-blue-600/90 mt-0.5">كامل الصلاحيات</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('cashier', '123')}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg text-left text-xs transition-colors cursor-pointer group"
                >
                  <div className="font-bold text-slate-800 group-hover:text-slate-900 flex items-center justify-between">
                    <span>الكاشير (cashier)</span>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1 rounded">123</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">نقطة البيع فقط</div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer info */}
      <div className="w-full max-w-md mx-auto text-center text-xs text-slate-400">
        <span>Bayaa POS • نظام مشفر ومحفوظ محلياً أوفلاين 100%</span>
      </div>
    </div>
  );
};
