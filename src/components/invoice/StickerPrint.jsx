import React from 'react';

// Sticker Printable Component (100mm x 150mm scale generally, but auto scaling for thermal ribbons)
export const StickerPrint = React.forwardRef(({ order, orderItems }, ref) => {
  if (!order || !orderItems) return null;
  
  const totalQuantity = orderItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

  return (
    <div ref={ref} className="hidden print:block bg-white text-black print:text-xs font-sans w-[80mm] max-w-[80mm] p-2 mx-auto" dir="rtl">
      {/* Brand Header */}
      <div className="text-center border-b-2 border-black pb-2 mb-2">
        <h1 className="text-2xl font-black uppercase tracking-tight">FRIENDS WEAR</h1>
        <p className="font-bold text-sm mt-1">{order.invoice} #</p>
        <div className="mt-2 border border-black px-2 py-1 flex items-center justify-center font-mono tracking-widest text-[10px]">
          *{order.barcode || `ORD-${order.invoice}`}*
        </div>
      </div>

      {/* Basic Customer Info */}
      <div className="mb-3">
        <div className="flex justify-between font-bold mb-1 pb-1 border-b border-gray-300">
           <span>بيانات المستلم:</span>
           <span>عنصر ({totalQuantity})</span>
        </div>
        <p className="mb-1 text-base font-bold truncate">{order.customer_name || 'غير محدد'}</p>
        <p className="mb-1 text-sm font-semibold tracking-wider font-sans" dir="ltr">{order.customer_phone || 'غير محدد'}</p>
        <p className="text-xs leading-relaxed max-w-full break-words">
           {order.customer_address || 'غير محدد'}
        </p>
      </div>

      {/* Items Compact List */}
      <div className="border-t-2 border-dashed border-black pt-2 mb-2">
         {orderItems.map((item, idx) => (
            <div key={item.id} className="flex justify-between items-center text-[10px] mb-1">
               <span className="truncate w-3/4 font-semibold">{item.quantity}x {item.name}</span>
               <span className="w-1/4 text-left">{item.size || '-'}/{item.color || '-'}</span>
            </div>
         ))}
      </div>

      {/* Footer / COD */}
      <div className="border-t-2 border-black pt-2 mt-2 text-center text-lg font-black bg-black text-white px-2 py-1 rounded-sm flex justify-between items-center">
         <span>مطلوب الدفع: </span>
         <span dir="ltr">{order.total_price} EGP</span>
      </div>
    </div>
  );
});
