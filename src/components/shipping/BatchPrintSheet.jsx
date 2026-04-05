import React from 'react';


const formatDate = new Intl.DateTimeFormat("ar-EG", {
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default function BatchPrintSheet({ batchInfo, batchOrders }) {

  if (!batchInfo) return null;

  return (
    <div className="print-only-container hidden bg-white text-black print:block p-8" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">FRIENDS WEAR</h1>
          <p className="text-sm font-bold text-gray-800">بيان تسليم شحنات / Delivery Manifest</p>
          <p className="text-xs text-gray-600 mt-1 font-mono">ID: {batchInfo.id}</p>
        </div>
        <div className="text-left">
          <p className="font-bold text-gray-600 mb-1">شركة الشحن / المندوب</p>
          <p className="text-2xl font-bold">{batchInfo.shipping_company}</p>
          <p className="text-sm text-gray-800 mt-2 font-semibold">تاريخ الإصدار: {formatDate.format(new Date(batchInfo.date))}</p>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-bold text-lg">الطلبات المرسلة ({batchOrders.length})</h3>
      </div>

      {/* Sheet Table */}
      <table className="w-full text-right border-collapse mb-8 text-sm">
        <thead>
          <tr className="bg-gray-100 border-2 border-black">
            <th className="py-2 px-2 border-l border-black w-10 text-center">#</th>
            <th className="py-2 px-2 border-l border-black w-24">رقم الفاتورة</th>
            <th className="py-2 px-2 border-l border-black w-48">العميل / الجوال</th>
            <th className="py-2 px-2 border-l border-black">العنوان</th>
            <th className="py-2 px-2 border-l border-black w-24">صافي التحصيل</th>
            <th className="py-2 px-2 border-black w-32">حالة التسليم والتوقيع</th>
          </tr>
        </thead>
        <tbody>
          {batchOrders.map((order, idx) => (
            <tr key={order.id} className="border-b-2 border-gray-300">
              <td className="py-6 px-2 text-center border-l border-gray-300 font-bold">{idx + 1}</td>
              <td className="py-6 px-2 border-l border-gray-300 font-mono font-bold">{order.invoice}</td>
              <td className="py-6 px-2 border-l border-gray-300">
                <p className="font-bold">{order.customer_name}</p>
                <p className="text-xs font-mono" dir="ltr">{order.customer_phone}</p>
              </td>
              <td className="py-6 px-2 border-l border-gray-300 text-xs">{order.customer_address}</td>
              <td className="py-6 px-2 border-l border-gray-300 font-bold">{order.total_price} EGP</td>
              <td className="py-6 px-2 border-gray-300">
                {/* Empty Space for physical signatures/notes */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer / Summary */}
      <div className="flex justify-between items-end mt-8 pt-4 border-t-2 border-black">
        <div className="w-1/2 p-4 text-sm space-y-4">
          <p className="font-bold">توقيع المستلم (المندوب/الشركة):</p>
          <p>................................................................</p>
          <p className="mt-8">التاريخ:</p>
          <p>................................................................</p>
        </div>
        
        <div className="w-auto border-2 border-black p-4 text-center">
            <p className="text-xs mb-1 font-bold tracking-widest text-gray-500">مجموع المبالغ المتوقعة مستحقة التحصيل</p>
            <p className="text-3xl font-black">
               {batchOrders.reduce((sum, ord) => sum + (Number(ord.total_price) || 0), 0)} EGP
            </p>
        </div>
      </div>
    </div>
  );
}
