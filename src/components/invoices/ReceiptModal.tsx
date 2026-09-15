import React, { useState } from 'react';
import { Sale } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, X, CheckCircle2, Phone, MapPin, UserCheck, Wallet, Banknote, Clock, Store, ShieldCheck, Tag } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
  isNewSale?: boolean;
}

// Vector SVG Barcode generator for thermal and screen rendering
const InvoiceBarcode: React.FC<{ value: string }> = ({ value }) => {
  const bars = React.useMemo(() => {
    const chars = value.split('');
    const pattern: number[] = [2, 1, 2, 1]; // start pattern
    chars.forEach((c) => {
      const code = c.charCodeAt(0) % 7;
      pattern.push(code % 2 === 0 ? 3 : 1, code % 3 === 0 ? 2 : 1, 1, code > 3 ? 2 : 1);
    });
    pattern.push(2, 1, 2); // stop pattern
    return pattern;
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center my-2 text-center">
      <svg className="h-9 w-48 max-w-full" viewBox="0 0 160 38">
        <g fill="#000">
          {bars.reduce((acc: { x: number; elements: React.ReactNode[] }, width, idx) => {
            if (idx % 2 === 0) {
              acc.elements.push(
                <rect key={idx} x={acc.x} y={0} width={Math.max(1, width)} height={idx < 4 || idx > bars.length - 4 ? 38 : 32} />
              );
            }
            acc.x += width + 1;
            return acc;
          }, { x: 6, elements: [] }).elements}
        </g>
      </svg>
      <span className="font-mono text-[10px] tracking-widest text-slate-800 font-bold mt-0.5">{value}</span>
    </div>
  );
};

// Compact verification QR Code simulation for thermal receipt
const InvoiceQRCode: React.FC<{ value: string }> = ({ value }) => {
  return (
    <div className="flex flex-col items-center justify-center my-1.5 p-1 bg-white border border-slate-300 rounded inline-block mx-auto">
      <svg className="w-14 h-14" viewBox="0 0 29 29" fill="#000">
        <path d="M0 0h7v7H0zM1 1h5v5H1zM2 2h3v3H2z M22 0h7v7h-7zM23 1h5v5h-5zM24 2h3v3h-3z M0 22h7v7H0zM1 23h5v5H1zM2 24h3v3H2z" />
        <path d="M9 2h2v1H9zM13 2h1v1h-1zM16 2h2v1h-2z M9 4h1v1H9zM12 4h3v1h-3z M9 6h1v1H9zM11 6h1v1h-1zM14 6h2v1h-2z M2 9h1v2H2zM4 9h2v1H4zM7 9h1v2H7z M10 9h1v1h-1zM12 9h2v1h-2zM16 9h1v1h-1zM19 9h2v1h-2zM23 9h2v1h-2z M9 11h2v2H9zM13 11h1v1h-1zM16 11h2v1h-2zM20 11h1v2h-1zM24 11h1v1h-1z M10 14h2v1h-2zM13 14h3v2h-3zM18 14h2v1h-2zM22 14h1v1h-1z M9 17h3v1H9zM14 17h2v1h-2zM17 17h1v1h-1zM20 17h2v2h-2z M2 19h2v1H2zM5 19h1v2H5zM8 19h1v1H8z M10 20h2v1h-2zM13 20h2v1h-2zM17 20h2v1h-2z M9 23h1v1H9zM11 23h2v1h-2zM15 23h1v2h-1zM18 23h2v1h-2zM22 23h3v1h-3z M9 26h2v1H9zM12 26h1v1h-1zM15 26h3v1h-3zM20 26h2v1h-2zM24 26h1v1h-1z" />
      </svg>
      <span className="text-[8px] text-slate-500 font-sans mt-0.5">رمز تحقق الفاتورة</span>
    </div>
  );
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose, isNewSale }) => {
  const { settings, t } = useApp();
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  const handlePrint = async () => {
    if (printFormat === 'thermal' && window.bayaaDesktop?.isDesktop) {
      const printed = await window.bayaaDesktop.app.print();
      if (printed) return;
    }
    window.print();
  };

  const getPaymentBadge = () => {
    if (sale.paymentMethod === 'credit') {
      return {
        label: 'فاتورة بيع آجل (على الحساب)',
        bg: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: <Clock className="w-3.5 h-3.5 text-amber-700" />,
      };
    }
    if (sale.paymentMethod === 'wallet') {
      return {
        label: `محفظة إلكترونية ${sale.walletProvider ? `(${sale.walletProvider})` : ''}`,
        bg: 'bg-purple-100 text-purple-900 border-purple-300',
        icon: <Wallet className="w-3.5 h-3.5 text-purple-700" />,
      };
    }
    return {
      label: 'فاتورة بيع نقدي (كاش)',
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: <Banknote className="w-3.5 h-3.5 text-emerald-700" />,
    };
  };

  const badge = getPaymentBadge();

  return (
    <div className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4 overflow-y-auto ${printFormat === 'thermal' ? 'print-thermal' : 'print-a4'}`}>
      {/* On-screen modal card (hidden during print) */}
      <div className="no-print bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-4 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            {isNewSale && (
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{sale.isRefund ? t.refundInvoice : 'فاتورة مبيعات'}</span>
                <span className="font-mono text-blue-600">({sale.invoiceNumber})</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {new Date(sale.createdAt).toLocaleString('ar-EG')} • كاشير: {sale.cashierName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-3 text-xs font-semibold shrink-0">
          <button
            onClick={() => setPrintFormat('thermal')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              printFormat === 'thermal'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.printReceipt} (ورق حراري 80mm)
          </button>
          <button
            onClick={() => setPrintFormat('a4')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              printFormat === 'a4'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.printInvoice} (A4 تفصيلي)
          </button>
        </div>

        {/* Preview Container */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 overflow-y-auto flex-1 font-mono text-xs">
          {printFormat === 'thermal' ? (
            /* 80mm Thermal Receipt Look */
            <div className="w-full max-w-[320px] mx-auto bg-white p-4 shadow-md rounded-xl border border-slate-300 text-slate-950 text-[12px] leading-relaxed relative selection:bg-slate-200">
              {/* Paper top tear decoration */}
              <div className="flex justify-between items-center px-1 pb-2 mb-2 border-b-2 border-dashed border-slate-300 text-slate-400 text-[10px] font-mono">
                <span>••• إيصال إلكتروني •••</span>
                <span>80MM THERMAL</span>
              </div>

              {/* Store Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <div className="w-9 h-9 mx-auto mb-1.5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Store className="w-5 h-5" />
                </div>
                <div className="font-extrabold text-base tracking-tight text-slate-950 font-sans">{settings.storeName}</div>
                {settings.storeAddress && (
                  <div className="text-[11px] text-slate-600 flex items-center justify-center gap-1 mt-0.5 font-sans">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{settings.storeAddress}</span>
                  </div>
                )}
                {settings.storePhone && (
                  <div className="text-[11px] text-slate-700 flex items-center justify-center gap-1 font-sans mt-0.5 font-bold">
                    <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                    <span dir="ltr">هاتف: {settings.storePhone}</span>
                  </div>
                )}
                {settings.taxNumber && (
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5">الرقم الضريبي: {settings.taxNumber}</div>
                )}
                <div className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full border text-[11px] font-bold mt-2 font-sans shadow-2xs ${badge.bg}`}>
                  {badge.icon}
                  <span>{badge.label}</span>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">رقم الفاتورة:</span>
                  <span className="font-bold font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">التاريخ والوقت:</span>
                  <span className="font-mono text-slate-800">
                    {new Date(sale.createdAt).toLocaleDateString('ar-EG')}{' '}
                    {new Date(sale.createdAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">اسم الكاشير:</span>
                  <span className="font-semibold text-slate-900">{sale.cashierName}</span>
                </div>

                {/* Customer info */}
                {sale.customerName && (
                  <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2 mt-1.5 text-[11px] text-amber-950 font-sans">
                    <div className="flex justify-between font-bold">
                      <span>العميل:</span>
                      <span>{sale.customerName}</span>
                    </div>
                    {sale.customerPhone && (
                      <div className="flex justify-between text-amber-800 text-[10px] mt-0.5">
                        <span>رقم الجوال:</span>
                        <span className="font-mono" dir="ltr">{sale.customerPhone}</span>
                      </div>
                    )}
                  </div>
                )}

                {sale.isRefund && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-1.5 text-center font-bold rounded-lg mt-1 text-xs">
                    ⚠️ فاتورة مرتجع بضاعة
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="py-2.5 border-b border-dashed border-slate-300">
                <table className="w-full text-right text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-sans text-[10px]">
                      <th className="pb-1 text-right">الصنف</th>
                      <th className="pb-1 text-center">الكمية</th>
                      <th className="pb-1 text-center">السعر</th>
                      <th className="pb-1 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sale.items.map((item) => (
                      <tr key={item.id} className="py-1.5">
                        <td className="py-1 font-sans font-medium text-slate-900 max-w-[120px] truncate">{item.productName}</td>
                        <td className="py-1 text-center font-bold text-slate-800 font-mono">{item.quantity}</td>
                        <td className="py-1 text-center text-slate-500 font-mono text-[10px]">{item.unitPrice}</td>
                        <td className="py-1 text-left font-bold text-slate-950 font-mono">{item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="py-2.5 space-y-1.5 text-[11px] border-b border-dashed border-slate-300">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono font-semibold">{sale.subtotal.toLocaleString()} {settings.currency}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>الخصم الممنوح:</span>
                    <span className="font-mono">-{sale.discount.toLocaleString()} {settings.currency}</span>
                  </div>
                )}
                {sale.tax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>ضريبة القيمة المضافة ({settings.taxRate}%):</span>
                    <span className="font-mono">+{sale.tax.toLocaleString()} {settings.currency}</span>
                  </div>
                )}

                {/* Grand Total Box */}
                <div className="p-2.5 bg-slate-900 text-white rounded-lg flex justify-between items-center font-bold text-sm my-1.5 shadow-2xs">
                  <span>إجمالي الحساب:</span>
                  <span className="text-base font-mono font-black">{sale.total.toLocaleString()} {settings.currency}</span>
                </div>

                {/* Payment method breakdown */}
                {sale.paymentMethod === 'cash' && sale.cashReceived !== undefined && (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] space-y-1 mt-1 font-sans">
                    <div className="flex justify-between text-slate-600">
                      <span>المدفوع نقداً:</span>
                      <span className="font-mono font-bold">{sale.cashReceived.toLocaleString()} {settings.currency}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-1">
                      <span>المتبقي للعميل (فكة):</span>
                      <span className="font-mono">{sale.changeGiven?.toLocaleString() || 0} {settings.currency}</span>
                    </div>
                  </div>
                )}

                {sale.paymentMethod === 'credit' && (
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-300 mt-2 space-y-1 text-[11px] font-sans">
                    <div className="flex justify-between text-amber-900">
                      <span>المدفوع مقدماً الآن:</span>
                      <span className="font-bold font-mono">{sale.creditPaidAmount?.toLocaleString() || 0} {settings.currency}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-extrabold border-t border-amber-300 pt-1 text-xs">
                      <span>المتبقي آجل على العميل:</span>
                      <span className="font-mono">{sale.creditRemainingDebt?.toLocaleString() || 0} {settings.currency}</span>
                    </div>
                  </div>
                )}

                {sale.paymentMethod === 'wallet' && sale.walletRefNumber && (
                  <div className="text-[10px] text-purple-800 bg-purple-50 p-1.5 rounded border border-purple-200 font-sans">
                    رقم عملية التحويل: <span className="font-mono font-bold">{sale.walletRefNumber}</span>
                  </div>
                )}
              </div>

              {/* QR Code & Barcode */}
              <div className="pt-2 text-center">
                <InvoiceQRCode value={sale.invoiceNumber} />
                <InvoiceBarcode value={sale.invoiceNumber} />
              </div>

              {/* Receipt Footer Message */}
              <div className="pt-2 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-600 font-sans leading-relaxed space-y-0.5">
                <div className="font-bold text-slate-800">
                  {settings.receiptFooter || 'نسعد بخدمتكم دائماً • شكراً لزيارتكم'}
                </div>
                <div className="text-[9px] text-slate-500">
                  البضاعة المباعة ترد وتستبدل خلال 14 يوماً بموجب إحضار أصل الفاتورة
                </div>
              </div>
            </div>
          ) : (
            /* A4 Detailed Layout */
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-900 font-sans">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{settings.storeName}</h2>
                  {settings.storeAddress && <p className="text-xs text-slate-500">{settings.storeAddress}</p>}
                  <p className="text-xs text-slate-500">
                    هاتف: {settings.storePhone} {settings.taxNumber ? `| الرقم الضريبي: ${settings.taxNumber}` : ''}
                  </p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold mt-2 ${badge.bg}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                </div>
                <div className="text-left font-mono">
                  <div className="text-sm font-bold text-blue-600">{sale.invoiceNumber}</div>
                  <div className="text-xs text-slate-500">{new Date(sale.createdAt).toLocaleDateString('ar-EG')}</div>
                  <div className="text-xs text-slate-500">كاشير: {sale.cashierName}</div>
                  {sale.customerName && (
                    <div className="text-xs text-amber-700 font-bold mt-1">العميل: {sale.customerName}</div>
                  )}
                </div>
              </div>

              <table className="w-full text-right text-xs mb-4">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">الباركود</th>
                    <th className="p-2">المنتج</th>
                    <th className="p-2 text-center">الكمية</th>
                    <th className="p-2 text-left">السعر</th>
                    <th className="p-2 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {sale.items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="p-2 text-slate-400">{idx + 1}</td>
                      <td className="p-2 text-[11px] text-slate-500">{it.productBarcode || '-'}</td>
                      <td className="p-2 font-sans font-semibold">{it.productName}</td>
                      <td className="p-2 text-center font-bold">{it.quantity}</td>
<td className="p-2 text-left font-semibold whitespace-nowrap">{it.price.toLocaleString()} {settings.currency}</td>
              <td className="p-2 text-left font-extrabold whitespace-nowrap">{it.subtotal.toLocaleString()} {settings.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-72 space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">المجموع الفرعي:</span>
                    <span>{sale.subtotal.toLocaleString()} {settings.currency}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>الخصم:</span>
                      <span>-{sale.discount.toLocaleString()} {settings.currency}</span>
                    </div>
                  )}
                  {sale.tax > 0 && (
                    <div className="flex justify-between">
                      <span>الضريبة ({settings.taxRate}%):</span>
                      <span>+{sale.tax.toLocaleString()} {settings.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-1 text-slate-900">
                    <span>إجمالي الفاتورة:</span>
                    <span>{sale.total.toLocaleString()} {settings.currency}</span>
                  </div>
                  {sale.paymentMethod === 'credit' && (
                    <div className="pt-2 border-t border-slate-200 text-xs">
                      <div className="flex justify-between text-slate-700">
                        <span>المدفوع نقداً:</span>
                        <span>{sale.creditPaidAmount?.toLocaleString() || 0} {settings.currency}</span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-bold mt-1">
                        <span>المتبقي دين مسجل:</span>
                        <span>{sale.creditRemainingDebt?.toLocaleString() || 0} {settings.currency}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3 gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-1.5"
          >
            <span>{isNewSale ? 'تخطي الطباعة (بدء بيع جديد)' : t.cancel}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإيصال الآن</span>
          </button>
        </div>
      </div>

      {/* Hidden container strictly for browser native window.print() */}
      <div className="print-only text-black p-4 w-full">
        {printFormat === 'thermal' ? (
          <div style={{ maxWidth: '300px', margin: '0 auto', fontFamily: 'monospace, sans-serif', fontSize: '11px', color: '#000' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '-0.5px' }}>{settings.storeName}</div>
              {settings.storeAddress && <div style={{ fontSize: '10px' }}>{settings.storeAddress}</div>}
              {settings.storePhone && <div style={{ fontSize: '10px', fontWeight: 'bold' }}>هاتف: {settings.storePhone}</div>}
              {settings.taxNumber && <div style={{ fontSize: '9px' }}>الرقم الضريبي: {settings.taxNumber}</div>}
              <div style={{ margin: '4px 0', borderTop: '1px dashed #000' }}></div>
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                {sale.isRefund ? '••• فاتورة مرتجع بضاعة •••' : `[ ${badge.label} ]`}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>رقم الفاتورة:</span>
                <span style={{ fontWeight: 'bold' }}>{sale.invoiceNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>التاريخ:</span>
                <span>{new Date(sale.createdAt).toLocaleString('ar-EG')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>الكاشير:</span>
                <span>{sale.cashierName}</span>
              </div>
              {sale.customerName && (
                <div style={{ fontWeight: 'bold', marginTop: '4px', textAlign: 'right', background: '#f5f5f5', padding: '3px 6px' }}>
                  العميل: {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}
                </div>
              )}
              <div style={{ margin: '6px 0', borderTop: '1px dashed #000' }}></div>
            </div>
            <table style={{ width: '100%', textAlign: 'right', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #000' }}>
                  <th style={{ paddingBottom: '3px' }}>الصنف</th>
                  <th style={{ textAlign: 'center', paddingBottom: '3px' }}>الكمية</th>
                  <th style={{ textAlign: 'center', paddingBottom: '3px' }}>السعر</th>
                  <th style={{ textAlign: 'left', paddingBottom: '3px' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((i) => (
                  <tr key={i.id} style={{ borderBottom: '1px dotted #ccc' }}>
                    <td style={{ padding: '3px 0' }}>{i.productName}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{i.quantity}</td>
                    <td style={{ textAlign: 'center', fontSize: '10px' }}>{i.unitPrice}</td>
                    <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{i.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '8px', borderTop: '1px dashed #000', paddingTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>المجموع الفرعي:</span>
                <span>{sale.subtotal} {settings.currency}</span>
              </div>
              {sale.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>خصم ممنوح:</span>
                  <span>-{sale.discount} {settings.currency}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>الضريبة ({settings.taxRate}%):</span>
                  <span>+{sale.tax} {settings.currency}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '6px', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 0' }}>
                <span>إجمالي الحساب:</span>
                <span>{sale.total} {settings.currency}</span>
              </div>
              {sale.paymentMethod === 'cash' && sale.cashReceived !== undefined && (
                <div style={{ marginTop: '4px', fontSize: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>المدفوع نقداً:</span>
                    <span>{sale.cashReceived} {settings.currency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>المتبقي للعميل (فكة):</span>
                    <span>{sale.changeGiven || 0} {settings.currency}</span>
                  </div>
                </div>
              )}
              {sale.paymentMethod === 'credit' && (
                <div style={{ marginTop: '6px', border: '1px solid #000', padding: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>المدفوع مقدماً:</span>
                    <span>{sale.creditPaidAmount || 0} {settings.currency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>المتبقي دين على العميل:</span>
                    <span>{sale.creditRemainingDebt || 0} {settings.currency}</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <InvoiceQRCode value={sale.invoiceNumber} />
              <InvoiceBarcode value={sale.invoiceNumber} />
            </div>

            <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '10px', borderTop: '1px dashed #000', paddingTop: '6px' }}>
              <div style={{ fontWeight: 'bold' }}>{settings.receiptFooter || 'نسعد بخدمتكم دائماً • شكراً لزيارتكم'}</div>
              <div style={{ fontSize: '8px', marginTop: '2px' }}>البضاعة المباعة ترد وتستبدل خلال 14 يوماً مع أصل الفاتورة</div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
              <div>
                <h2>{settings.storeName}</h2>
                <p>{settings.storeAddress} - {settings.storePhone}</p>
                <p><strong>{badge.label}</strong></p>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3>{sale.invoiceNumber}</h3>
                <p>{new Date(sale.createdAt).toLocaleString('ar-EG')}</p>
                {sale.customerName && <p>العميل: {sale.customerName}</p>}
              </div>
            </div>
            <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#eee' }}>
                  <th style={{ padding: '8px', textAlign: 'right' }}>المنتج</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>الكمية</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>السعر</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((it) => (
                  <tr key={it.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px' }}>{it.productName}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ padding: '8px', textAlign: 'left' }}>{it.price}</td>
                    <td style={{ padding: '8px', textAlign: 'left' }}>{it.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '20px', textAlign: 'left', fontWeight: 'bold' }}>
              المجموع الإجمالي: {sale.total} {settings.currency}
              {sale.paymentMethod === 'credit' && (
                <div style={{ color: '#b91c1c', marginTop: '6px' }}>
                  المسجل كمديونية آجلة: {sale.creditRemainingDebt} {settings.currency}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
