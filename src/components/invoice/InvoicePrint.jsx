import React from 'react';

const formatCurrency = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
});

const formatDate = new Intl.DateTimeFormat("ar-EG", {
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "numeric",
});

// A4 Invoice Printable Component
export const InvoicePrint = React.forwardRef(({ order, orderItems, profilesMap }, ref) => {
  if (!order || !orderItems) return null;
  
  const creator = profilesMap ? profilesMap[order.user_id] : "الموظف";
  const totalQuantity = orderItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

  // Tiered pricing logic — mirrors NewOrder exactly
  const computeTiered = (pieces) => {
    if (pieces === 0) return 0;
    if (pieces === 1) return 500;
    if (pieces === 2) return 950;
    if (pieces === 3) return 1350;
    return 1350 + (pieces - 3) * 450;
  };

  const tieredTotal = computeTiered(totalQuantity);
  const fullPriceTotal = totalQuantity * 500; // if no discount
  const discountSaved = fullPriceTotal - tieredTotal;
  // Shipping = stored total - tiered product total (or 0 if negative)
  const shippingCost = Math.max(0, (order.total_price || 0) - tieredTotal);

  return (
    <div ref={ref} className="print-only-container hidden bg-white text-black print:block p-8" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">FRIENDS WEAR</h1>
          <p className="text-sm text-gray-600">فاتورة طلب / Order Invoice</p>
          <p className="text-sm text-gray-800 mt-2 font-semibold">تاريخ الطلب: {formatDate.format(new Date(order.created_at))}</p>
        </div>
        <div className="text-left">
          <p className="font-bold text-gray-600 mb-1">رقم الفاتورة</p>
          <p className="text-3xl font-bold">#{order.invoice}</p>
          {/* Barcode Placeholder (or actual barcode if a library was available) */}
          <div className="mt-4 border border-black px-4 py-2 text-center text-xs tracking-widest font-mono">
            *{order.barcode || `ORD-${order.invoice}`}*
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="flex justify-between mb-8">
        <div className="w-1/2">
          <h3 className="font-bold text-lg mb-2 border-b border-gray-300 pb-1">بيانات العميل</h3>
          <p><span className="font-semibold">الاسم:</span> {order.customer_name || 'غير محدد'}</p>
          <p><span className="font-semibold">رقم الهاتف:</span> <span dir="ltr" className="inline-block">{order.customer_phone || 'غير محدد'}</span></p>
          <p><span className="font-semibold">العنوان:</span> {order.customer_address || 'غير محدد'}</p>
        </div>
        <div className="w-1/3 border border-gray-300 p-4 rounded-md">
           <h3 className="font-bold text-md mb-2">معلومات الشحن</h3>
           <p className="text-sm"><span className="font-semibold">بواسطة:</span> {creator}</p>
           <p className="text-sm mt-3"><span className="font-semibold">حالة الطلب:</span> {order.status}</p>
        </div>
      </div>

      {/* Order Items Table */}
      <table className="w-full text-right border-collapse mb-8">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-black">
            <th className="py-3 px-2 font-bold w-12 text-center">#</th>
            <th className="py-3 px-2 font-bold">المنتج</th>
            <th className="py-3 px-2 font-bold text-center">المقاس/اللون</th>
            <th className="py-3 px-2 font-bold text-center">الكمية</th>
            <th className="py-3 px-2 font-bold">سعر الوحدة</th>
            <th className="py-3 px-2 font-bold bg-gray-50">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {orderItems.map((item, idx) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-3 px-2 text-center">{idx + 1}</td>
              <td className="py-3 px-2 font-semibold">
                {item.name}
                {item.notes && <p className="text-xs text-gray-500 font-normal mt-1">{item.notes}</p>}
              </td>
              <td className="py-3 px-2 text-center text-sm">{item.size || '-'} / {item.color || '-'}</td>
              <td className="py-3 px-2 text-center font-bold px-2">{item.quantity}</td>
              <td className="py-3 px-2">{formatCurrency.format(item.unit_price)}</td>
              <td className="py-3 px-2 font-bold bg-gray-50">{formatCurrency.format(item.unit_price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer / Summary */}
      <div className="flex justify-end items-start mt-8 pt-4">
        <div className="w-1/3">
          <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
            <span>عدد القطع:</span>
            <span className="font-bold text-black">{totalQuantity}</span>
          </div>
          <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
            <span>سعر القطع ({totalQuantity} قطعة):</span>
            <span className="font-bold text-black">{tieredTotal.toLocaleString()} ج.م</span>
          </div>
          {discountSaved > 0 && (
            <div className="flex justify-between py-2 text-green-700 border-b border-gray-200 font-bold">
              <span>🎉 خصم الكمية:</span>
              <span>-{discountSaved.toLocaleString()} ج.م</span>
            </div>
          )}
          {shippingCost > 0 && (
            <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
              <span>مصاريف الشحن:</span>
              <span className="font-bold text-black">{shippingCost.toLocaleString()} ج.م</span>
            </div>
          )}
          {shippingCost === 0 && (
            <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
              <span>مصاريف الشحن:</span>
              <span>مشمولة ضمن الإجمالي</span>
            </div>
          )}
          <div className="flex justify-between py-3 text-2xl font-black bg-black text-white px-4 rounded-b-md mt-2 shadow-sm">
             <span>الإجمالي:</span>
             <span dir="ltr">{(order.total_price || 0).toLocaleString()} ج.م</span>
          </div>
        </div>
      </div>
    </div>
  );
});
