import * as XLSX from "xlsx-js-style";

/**
 * Advanced Export using xlsx-js-style to create a professional Arabic RTL shipping manifest.
 */
export function exportOrdersToExcel(orders, profiles, allOrderItems, batches) {
  if (!orders || orders.length === 0) return false;

  const getProfileName = (id) => profiles?.find((p) => p.id === id)?.full_name || "—";
  const getBatchName = (id) => batches?.find((b) => b.id === id)?.shipping_company || "—";
  
  // Governorate guessing from address (basic fallback)
  const extractGovernorate = (addr) => {
    if (!addr) return "—";
    const commonGovs = ["القاهرة", "الجيزة", "الاسكندرية", "الدقهلية", "الشرقية", "القليوبية"];
    for (let g of commonGovs) {
      if (addr.includes(g)) return g;
    }
    return "—";
  };

  const statusMap = {
    pending: "قيد الانتظار",
    confirmed: "تم التأكيد",
    preparing: "جاري التجهيز",
    shipped: "تم الشحن",
    in_delivery: "جاري التوصيل",
    delivered: "تم التوصيل",
    returned: "مرتجع",
    cancelled: "ملغي",
  };

  // 1. Prepare Header Matrix
  const rawHeaders = [
    "رقم", "اسم العميل", "رقم الهاتف", "المحافظة", "العنوان", 
    "المنتج", "المقاس", "الكمية", "السعر", 
    "شركة الشحن", "حالة التسليم", "ملاحظات"
  ];
  
  // Reversed for strict manual RTL layout parsing per user instruction if !dir unsupported
  const headers = rawHeaders.reverse();

  let excelRows = [];
  
  // Row 1: Company Header (Merged)
  excelRows.push(["Friends Wear", "", "", "", "", "", "", "", "", "", "", ""]);
  // Row 2: Date
  const dateStr = new Intl.DateTimeFormat("ar-EG", { dateStyle: "long" }).format(new Date());
  excelRows.push([`تاريخ اليوم: ${dateStr}`, "", "", "", "", "", "", "", "", "", "", ""]);
  // Row 3: Empty spacing
  excelRows.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
  // Row 4: Table Headers
  excelRows.push(headers);

  // 2. Iterate Data
  let rowIndex = 1;
  let totalOrderCount = 0;
  let totalAmount = 0;

  orders.forEach((order) => {
    totalOrderCount++;
    if (order.total_price) totalAmount += parseFloat(order.total_price);
    const items = allOrderItems?.filter((i) => i.order_id === order.id) || [];
    
    // If no items, generate a blank row for the order wrapper
    if (items.length === 0) {
       const rowData = [
         rowIndex++,
         order.customer_name || "—",
         order.customer_phone || "—",
         extractGovernorate(order.customer_address),
         order.customer_address || "—",
         "—",
         "—",
         "—",
         order.total_price ? `EGP ${order.total_price}` : "—",
         order.batch_id ? getBatchName(order.batch_id) : "—",
         statusMap[order.delivery_status || order.status] || order.status || "—",
         order.invoice ? `Invoice: ${order.invoice}` : "—"
       ].reverse();
       excelRows.push(rowData);
    } else {
       items.forEach((item, idx) => {
         const rowData = [
           idx === 0 ? rowIndex++ : "",  // Auto Number only on first item of order
           order.customer_name || "—",
           order.customer_phone || "—",
           extractGovernorate(order.customer_address),
           order.customer_address || "—",
           item.name || "—",
           item.size || "—",
           item.quantity || "1",
           idx === 0 ? (order.total_price ? `EGP ${order.total_price}` : "—") : "—", // Show total price on first chunk
           order.batch_id ? getBatchName(order.batch_id) : "—",
           statusMap[order.delivery_status || order.status] || order.status || "—",
           order.invoice ? `Invoice: ${order.invoice}` : "—"
         ].reverse();
         excelRows.push(rowData);
       });
    }
  });

  // Footer Row
  excelRows.push(["", "", "", "", "", "", "", "", `إجمالي الفلوس: EGP ${totalAmount}`, "", "إجمالي الطلبات:", totalOrderCount].reverse());

  // 3. Build Worksheet
  const ws = XLSX.utils.aoa_to_sheet(excelRows);
  
  // Set explicit RTL direction safely
  ws['!dir'] = 'rtl';
  
  // Print Friendly Setup
  ws['!pageSetup'] = { orientation: 'landscape', paperSize: 9, fitToWidth: 1, fitToHeight: 0 };
  ws['!margins'] = { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };

  // Merges for headers
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Friends Wear Header spans all columns
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }  // Date spans all columns
  ];

  // Columns Widths mapping explicitly
  ws['!cols'] = [
    { wch: 15 }, // Notes
    { wch: 15 }, // Delivery status
    { wch: 15 }, // Shipping company
    { wch: 12 }, // Price
    { wch: 8 },  // Qty
    { wch: 8 },  // Size
    { wch: 25 }, // Product
    { wch: 35 }, // Address
    { wch: 15 }, // Governorate
    { wch: 15 }, // Phone
    { wch: 20 }, // Customer
    { wch: 5 },  // ID
  ];

  // 4. Apply Strict Styling
  const borderEdges = { style: "thin", color: { rgb: "000000" } };
  const fullBorder = { top: borderEdges, bottom: borderEdges, left: borderEdges, right: borderEdges };
  
  for (let r = 0; r < excelRows.length; r++) {
    for (let c = 0; c < 12; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' }; // Fallback empty cell

      // Base Styling defaults
      ws[cellRef].s = {
        font: { name: "Arial", sz: 12 },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: fullBorder
      };

      // Friends Wear Title
      if (r === 0) {
        ws[cellRef].s.font = { name: "Arial", sz: 18, bold: true };
        ws[cellRef].s.border = {}; // clean edges for title
      }
      
      // Date Title
      if (r === 1) {
        ws[cellRef].s.font = { name: "Arial", sz: 14, italic: true };
        ws[cellRef].s.border = {}; 
      }

      // Column Headers (row index 3)
      if (r === 3) {
        ws[cellRef].s.font = { name: "Arial", sz: 12, bold: true, color: { rgb: "FFFFFF" } };
        ws[cellRef].s.fill = { fgColor: { rgb: "333333" } };
      }
      
      // Footer Row
      if (r === excelRows.length - 1) {
         ws[cellRef].s.font = { name: "Arial", sz: 12, bold: true };
      }
    }
  }

  // 5. Generate and Download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "كشف الشحنات");

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `FriendsWear_Shipping_${todayStr}.xlsx`);
  
  return true;
}

export function exportBatchToExcel(batch, orders, allOrderItems) {
  if (!orders || orders.length === 0) return false;

  const getBatchName = () => batch?.shipping_company || "—";
  
  const extractGovernorate = (addr) => {
    if (!addr) return "—";
    const commonGovs = ["القاهرة", "الجيزة", "الاسكندرية", "الدقهلية", "الشرقية", "القليوبية"];
    for (let g of commonGovs) {
      if (addr.includes(g)) return g;
    }
    return "—";
  };

  const deliveryStatusTranslate = {
    pending: "قيد التوصيل",
    delivered: "تم التسليم",
    partially_delivered: "تسليم جزئي",
    not_delivered: "لم يتم التسليم",
    returned: "مرتجع",
  };

  const rawHeaders = [
    "رقم", "اسم العميل", "رقم الهاتف", "المحافظة", "العنوان", 
    "المنتج", "المقاس", "الكمية المطلوبة / المسلمة", "السعر", 
    "شركة الشحن", "حالة التسليم", "ملاحظات"
  ];
  
  const headers = rawHeaders.reverse();

  let excelRows = [];
  excelRows.push(["Friends Wear", "", "", "", "", "", "", "", "", "", "", ""]);
  const dateStr = new Intl.DateTimeFormat("ar-EG", { dateStyle: "long" }).format(new Date());
  excelRows.push([`تاريخ اليوم: ${dateStr}`, "", "", "", "", "", "", "", "", `كشف شحن شركة: ${getBatchName()}`, "", ""]);
  excelRows.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
  excelRows.push(headers);

  let rowIndex = 1;
  let totalOrderCount = 0;
  let totalAmount = 0;

  orders.forEach((order) => {
    totalOrderCount++;
    if (order.total_price) totalAmount += parseFloat(order.total_price);
    const items = allOrderItems?.filter((i) => i.order_id === order.id) || [];
    
    if (items.length === 0) {
       const rowData = [
         rowIndex++,
         order.customer_name || "—",
         order.customer_phone || "—",
         extractGovernorate(order.customer_address),
         order.customer_address || "—",
         "—",
         "—",
         "—",
         order.total_price ? `EGP ${order.total_price}` : "—",
         getBatchName(),
         deliveryStatusTranslate[order.delivery_status || 'pending'] || "—",
         order.invoice ? `Invoice: ${order.invoice}` : "—"
       ].reverse();
       excelRows.push(rowData);
    } else {
       items.forEach((item, idx) => {
         const qtyStr = `${item.quantity} / ${item.delivered_quantity ?? item.quantity}`;
         const rowData = [
           idx === 0 ? rowIndex++ : "",  
           order.customer_name || "—",
           order.customer_phone || "—",
           extractGovernorate(order.customer_address),
           order.customer_address || "—",
           item.name || "—",
           item.size || "—",
           qtyStr,
           idx === 0 ? (order.total_price ? `EGP ${order.total_price}` : "—") : "—", 
           getBatchName(),
           deliveryStatusTranslate[order.delivery_status || 'pending'] || "—",
           order.invoice ? `Invoice: ${order.invoice}` : "—"
         ].reverse();
         excelRows.push(rowData);
       });
    }
  });

  excelRows.push(["", "", "", "", "", "", "", "", `إجمالي الفلوس: EGP ${totalAmount}`, "", "إجمالي الطلبات:", totalOrderCount].reverse());

  const ws = XLSX.utils.aoa_to_sheet(excelRows);
  ws['!dir'] = 'rtl';
  
  ws['!pageSetup'] = { orientation: 'landscape', paperSize: 9, fitToWidth: 1, fitToHeight: 0 };
  ws['!margins'] = { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, 
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }  
  ];

  ws['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 8 }, 
    { wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 5 },
  ];

  const borderEdges = { style: "thin", color: { rgb: "000000" } };
  const fullBorder = { top: borderEdges, bottom: borderEdges, left: borderEdges, right: borderEdges };
  
  for (let r = 0; r < excelRows.length; r++) {
    for (let c = 0; c < 12; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

      ws[cellRef].s = {
        font: { name: "Arial", sz: 12 },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: fullBorder
      };

      if (r === 0) {
        ws[cellRef].s.font = { name: "Arial", sz: 18, bold: true };
        ws[cellRef].s.border = {}; 
      }
      
      if (r === 1) {
        ws[cellRef].s.font = { name: "Arial", sz: 14, italic: true };
        ws[cellRef].s.border = {}; 
      }

      if (r === 3) {
        ws[cellRef].s.font = { name: "Arial", sz: 12, bold: true, color: { rgb: "FFFFFF" } };
        ws[cellRef].s.fill = { fgColor: { rgb: "333333" } };
      }
      
      if (r === excelRows.length - 1) {
         ws[cellRef].s.font = { name: "Arial", sz: 12, bold: true };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "كشف شحنات مجمع");

  XLSX.writeFile(wb, `FriendsWear_Batch_${getBatchName()}_${new Date().getTime()}.xlsx`);
  
  return true;
}
