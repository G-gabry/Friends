const fs = require("fs");

const SHIPPING_RATES = [
  { governorate: "القاهرة", cities: [ { city: "مدينة نصر", price: 40 }, { city: "المعادي", price: 40 }, { city: "وسط البلد", price: 35 }, { city: "مصر الجديدة", price: 40 }, { city: "حلوان", price: 45 }, { city: "شبرا", price: 40 }, { city: "المقطم", price: 45 }, { city: "التجمع الخامس", price: 50 }, { city: "أخرى", price: 45 } ] },
  { governorate: "الجيزة", cities: [ { city: "الدقي", price: 40 }, { city: "المهندسين", price: 40 }, { city: "الهرم", price: 45 }, { city: "فيصل", price: 45 }, { city: "6 أكتوبر", price: 55 }, { city: "الشيخ زايد", price: 55 }, { city: "أخرى", price: 50 } ] },
  { governorate: "الإسكندرية", cities: [ { city: "محطة الرمل", price: 55 }, { city: "سموحة", price: 55 }, { city: "المنتزه", price: 60 }, { city: "العجمي", price: 60 }, { city: "برج العرب", price: 65 }, { city: "أخرى", price: 60 } ] },
  { governorate: "الشرقية", cities: [ { city: "الزقازيق", price: 55 }, { city: "العاشر من رمضان", price: 50 }, { city: "بلبيس", price: 55 }, { city: "أخرى", price: 60 } ] },
  { governorate: "الدقهلية", cities: [ { city: "المنصورة", price: 55 }, { city: "طلخا", price: 55 }, { city: "أخرى", price: 60 } ] },
  { governorate: "الغربية", cities: [ { city: "طنطا", price: 55 }, { city: "المحلة الكبرى", price: 55 }, { city: "أخرى", price: 60 } ] },
  { governorate: "المنوفية", cities: [ { city: "شبين الكوم", price: 55 }, { city: "منوف", price: 55 }, { city: "أخرى", price: 60 } ] },
  { governorate: "القليوبية", cities: [ { city: "بنها", price: 45 }, { city: "شبرا الخيمة", price: 40 }, { city: "القناطر الخيرية", price: 50 }, { city: "أخرى", price: 50 } ] },
  { governorate: "البحيرة", cities: [ { city: "دمنهور", price: 60 }, { city: "كفر الدوار", price: 60 }, { city: "أخرى", price: 65 } ] },
  { governorate: "كفر الشيخ", cities: [ { city: "كفر الشيخ مركز", price: 60 }, { city: "دسوق", price: 60 }, { city: "أخرى", price: 65 } ] },
  { governorate: "الفيوم", cities: [ { city: "الفيوم مركز", price: 60 }, { city: "أخرى", price: 65 } ] },
  { governorate: "بني سويف", cities: [ { city: "بني سويف مركز", price: 60 }, { city: "أخرى", price: 65 } ] },
  { governorate: "المنيا", cities: [ { city: "المنيا مركز", price: 65 }, { city: "أخرى", price: 70 } ] },
  { governorate: "أسيوط", cities: [ { city: "أسيوط مركز", price: 65 }, { city: "أخرى", price: 70 } ] },
  { governorate: "سوهاج", cities: [ { city: "سوهاج مركز", price: 70 }, { city: "أخرى", price: 75 } ] },
  { governorate: "قنا", cities: [ { city: "قنا مركز", price: 70 }, { city: "أخرى", price: 75 } ] },
  { governorate: "الأقصر", cities: [ { city: "الأقصر مركز", price: 75 }, { city: "أخرى", price: 80 } ] },
  { governorate: "أسوان", cities: [ { city: "أسوان مركز", price: 80 }, { city: "أخرى", price: 85 } ] },
  { governorate: "الإسماعيلية", cities: [ { city: "الإسماعيلية مركز", price: 55 }, { city: "أخرى", price: 60 } ] },
  { governorate: "السويس", cities: [ { city: "السويس مركز", price: 55 }, { city: "أخرى", price: 60 } ] },
  { governorate: "بورسعيد", cities: [ { city: "بورسعيد مركز", price: 55 }, { city: "أخرى", price: 60 } ] },
  { governorate: "دمياط", cities: [ { city: "دمياط مركز", price: 55 }, { city: "رأس البر", price: 60 }, { city: "أخرى", price: 60 } ] },
  { governorate: "شمال سيناء", cities: [ { city: "العريش", price: 70 }, { city: "أخرى", price: 80 } ] },
  { governorate: "جنوب سيناء", cities: [ { city: "شرم الشيخ", price: 80 }, { city: "دهب", price: 85 }, { city: "أخرى", price: 85 } ] },
  { governorate: "البحر الأحمر", cities: [ { city: "الغردقة", price: 75 }, { city: "سفاجا", price: 80 }, { city: "أخرى", price: 85 } ] },
  { governorate: "الوادي الجديد", cities: [ { city: "الخارجة", price: 85 }, { city: "أخرى", price: 90 } ] },
  { governorate: "مطروح", cities: [ { city: "مرسى مطروح", price: 70 }, { city: "أخرى", price: 80 } ] }
];

let sql = `CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  governorate text NOT NULL,
  city text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shipping rates are viewable by authenticated users" ON public.shipping_rates;
CREATE POLICY "Shipping rates are viewable by authenticated users" ON public.shipping_rates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can update shipping rates" ON public.shipping_rates;
CREATE POLICY "Admins can update shipping rates" ON public.shipping_rates FOR ALL TO authenticated USING (
  EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

TRUNCATE TABLE public.shipping_rates;

INSERT INTO public.shipping_rates (governorate, city, price) VALUES
`;

const values = [];
SHIPPING_RATES.forEach(g => {
  g.cities.forEach(c => {
    values.push(`('${g.governorate}', '${c.city}', ${c.price})`);
  });
});

sql += values.join(',\n') + ';\n';
fs.writeFileSync('./supabase/shipping_rates.sql', sql);
