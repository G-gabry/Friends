import fs from "fs";
import { SHIPPING_RATES } from "./src/lib/shippingRates.js";

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
