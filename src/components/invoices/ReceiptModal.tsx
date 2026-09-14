import React, { useState } from 'react';
import { Sale } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, X, CheckCircle2, Phone, MapPin, UserCheck, Wallet, Banknote, Clock } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
  isNewSale?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose, isNewSale }) => {
  const { settings, t } = useApp();
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  const handlePrint = () => {
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4 overflow-y-auto">
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
            /* 80mm Receipt Look */
            <div className="max-w-[320px] mx-auto bg-white p-4 shadow-xs rounded-xl border border-slate-200 text-slate-800">
              {/* Store Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <div className="font-extrabold text-base text-slate-900 font-sans">{settings.storeName}</div>
                {settings.storeAddress && (
                  <div className="text-[10px] text-slate-600 flex items-center justify-center gap-1 mt-1 font-sans">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{settings.storeAddress}</span>
                  </div>
                )}
                {settings.storePhone && (
                  <div className="text-[10px] text-slate-600 flex items-center justify-center gap-1 font-sans mt-0.5">
                    <Phone className="w-2.5 h-2.5" />
                    <span>هاتف: {settings.storePhone}</span>
                  </div>
                )}
                {settings.taxNumber && (
                  <div className="text-[10px] text-slate-500 font-sans">الرقم الضريبي: {settings.taxNumber}</div>
                )}
                <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold mt-2 font-sans ${badge.bg}`}>
                  {badge.icon}
                  <span>{badge.label}</span>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الفاتورة:</span>
                  <span className="font-bold">{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">التاريخ:</span>
                  <span>
                    {new Date(sale.createdAt).toLocaleDateString('ar-EG')}{' '}
                    {new Date(sale.createdAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الكاشير:</span>
                  <span>{sale.cashierName}</span>
                </div>

                {/* Customer info for credit sales */}
                {sale.customerName && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-1.5 mt-1 text-[10px] text-amber-900 font-sans">
                    <div className="flex justify-between font-bold">
                      <span>العميل:</span>
                      <span>{sale.customerName}</span>
                    </div>
                    {sale.customerPhone && (
                      <div className="flex justify-between text-amber-800 text-[9px] mt-0.5">
                        <span>الهاتف:</span>
                        <span className="font-mono">{sale.customerPhone}</span>
                      </div>
                    )}
                  </div>
                )}

                {sale.isRefund && (
                  <div className="bg-rose-50 text-rose-700 p-1 text-center font-bold rounded">
                    فاتورة مرتجع بضاعة
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="py-2 border-b border-dashed border-slate-300">
                <table className="w-full text-right text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-sans">
                      <th className="pb-1">الصنف</th>
                      <th className="pb-1 text-center">الكمية</th>
                      <th className="pb-1 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sale.items.map((item) => (
                      <tr key={item.id} className="py-1">
                        <td className="py-1 font-sans">{item.productName}</td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-left font-bold">{item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
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
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300 text-slate-900">
                  <span>إجمالي الفاتورة:</span>
                  <span>{sale.total.toLocaleString()} {settings.currency}</span>
                </div>

                {/* Specific payment breakdowns */}
                {sale.paymentMethod === 'cash' && sale.cashReceived !== undefined && (
                  <>
                    <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                      <span>المدفوع نقداً:</span>
                      <span>{sale.cashReceived.toLocaleString()} {settings.currency}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-emerald-700 font-bold">
                      <span>المتبقي للعميل (فكة):</span>
                      <span>{sale.changeGiven?.toLocaleString() || 0} {settings.currency}</span>
                    </div>
                  </>
                )}

                {sale.paymentMethod === 'credit' && (
                  <div className="bg-amber-50 p-2 rounded border border-amber-200 mt-2 space-y-1 text-[10px] font-sans">
                    <div className="flex justify-between text-amber-900">
                      <span>المدفوع الآن مقدماً:</span>
                      <span className="font-bold font-mono">{sale.creditPaidAmount?.toLocaleString() || 0} {settings.currency}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-extrabold border-t border-amber-200 pt-1">
                      <span>المتبقي دين على العميل:</span>
                      <span className="font-mono">{sale.creditRemainingDebt?.toLocaleString() || 0} {settings.currency}</span>
                    </div>
                  </div>
                )}

                {sale.paymentMethod === 'wallet' && sale.walletRefNumber && (
                  <div className="text-[10px] text-purple-700 pt-1 font-sans">
                    رقم عملية التحويل: <span className="font-mono">{sale.walletRefNumber}</span>
                  </div>
                )}
              </div>

              {settings.receiptFooter && (
                <div className="pt-3 text-center text-[9px] text-slate-500 font-sans leading-tight">
                  {settings.receiptFooter}
                </div>
              )}
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
                      <td className="p-2 text-left">{it.price.toLocaleString()} {settings.currency}</td>
                      <td className="p-2 text-left font-bold">{it.subtotal.toLocaleString()} {settings.currency}</td>
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
          <div style={{ maxWidth: '300px', margin: '0 auto', fontFamily: 'monospace', fontSize: '11px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{settings.storeName}</div>
              {settings.storeAddress && <div>{settings.storeAddress}</div>}
              {settings.storePhone && <div>هاتف: {settings.storePhone}</div>}
              {settings.taxNumber && <div>ض.ق.م: {settings.taxNumber}</div>}
              <div>--------------------------------</div>
              <div style={{ fontWeight: 'bold' }}>
                {sale.isRefund ? '** فاتورة مرتجع **' : badge.label}
              </div>
              <div>رقم الفاتورة: {sale.invoiceNumber}</div>
              <div>التاريخ: {new Date(sale.createdAt).toLocaleString('ar-EG')}</div>
              <div>كاشير: {sale.cashierName}</div>
              {sale.customerName && (
                <div style={{ fontWeight: 'bold', marginTop: '3px' }}>
                  العميل: {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}
                </div>
              )}
              <div>--------------------------------</div>
            </div>
            <table style={{ width: '100%', textAlign: 'right', fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th style={{ textAlign: 'center' }}>العدد</th>
                  <th style={{ textAlign: 'left' }}>القيمة</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.productName}</td>
                    <td style={{ textAlign: 'center' }}>{i.quantity}</td>
                    <td style={{ textAlign: 'left' }}>{i.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '10px', borderTop: '1px dashed #000', paddingTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>المجموع:</span>
                <span>{sale.subtotal} {settings.currency}</span>
              </div>
              {sale.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>خصم:</span>
                  <span>-{sale.discount} {settings.currency}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>
                <span>الإجمالي:</span>
                <span>{sale.total} {settings.currency}</span>
              </div>
              {sale.paymentMethod === 'credit' && (
                <div style={{ marginTop: '4px', borderTop: '1px dotted #000', paddingTop: '4px' }}>
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
            {settings.receiptFooter && (
              <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '10px' }}>
                {settings.receiptFooter}
              </div>
            )}
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
