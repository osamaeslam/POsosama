import React from 'react';

type ErrorBoundaryState = { hasError: boolean };
type ErrorBoundaryProps = React.PropsWithChildren;

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly children: React.ReactNode;
  state: ErrorBoundaryState = { hasError: false };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.children = props.children;
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[v0] Renderer error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-center" dir="rtl">
        <section className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-xl">
          <h1 className="text-xl font-bold text-slate-900">حدث خطأ غير متوقع</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">لم تُحذف بياناتك. أعد تحميل الواجهة للمتابعة.</p>
          <button
            type="button"
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            إعادة تحميل البرنامج
          </button>
        </section>
      </main>
    );
  }
}
