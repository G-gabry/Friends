// Egypt governorates with flat shipping costs
// Rates are in EGP
// القاهرة، الجيزة، القليوبية = 60
// دلتا = 65
// صعيد = 85
export const SHIPPING_RATES = [
  {
    governorate: "القاهرة",
    cities: [
      { city: "مدينة نصر", price: 60 },
      { city: "المعادي", price: 60 },
      { city: "وسط البلد", price: 60 },
      { city: "مصر الجديدة", price: 60 },
      { city: "حلوان", price: 60 },
      { city: "شبرا", price: 60 },
      { city: "المقطم", price: 60 },
      { city: "التجمع الخامس", price: 60 },
      { city: "أخرى", price: 60 },
    ],
  },
  {
    governorate: "الجيزة",
    cities: [
      { city: "الدقي", price: 60 },
      { city: "المهندسين", price: 60 },
      { city: "الهرم", price: 60 },
      { city: "فيصل", price: 60 },
      { city: "6 أكتوبر", price: 60 },
      { city: "الشيخ زايد", price: 60 },
      { city: "أخرى", price: 60 },
    ],
  },
  {
    governorate: "القليوبية",
    cities: [
      { city: "بنها", price: 60 },
      { city: "شبرا الخيمة", price: 60 },
      { city: "القناطر الخيرية", price: 60 },
      { city: "أخرى", price: 60 },
    ],
  },
  {
    governorate: "الإسكندرية",
    cities: [
      { city: "محطة الرمل", price: 65 },
      { city: "سموحة", price: 65 },
      { city: "المنتزه", price: 65 },
      { city: "العجمي", price: 65 },
      { city: "برج العرب", price: 65 },
      { city: "أخرى", price: 65 },
    ],
  },
  {
    governorate: "الشرقية",
    cities: [
      { city: "الزقازيق", price: 65 },
      { city: "العاشر من رمضان", price: 65 },
      { city: "بلبيس", price: 65 },
      { city: "أخرى", price: 65 },
    ],
  },
  {
    governorate: "الدقهلية",
    cities: [
      { city: "المنصورة", price: 65 },
      { city: "طلخا", price: 65 },
      { city: "أخرى", price: 65 },
    ],
  },
  {
    governorate: "الغربية",
    cities: [
      { city: "طنطا", price: 65 },
      { city: "المحلة الكبرى", price: 65 },
      { city: "أخرى", price: 65 },
    ],
  },
  {
    governorate: "المنوفية",
    cities: [
      { city: "شبين الكوم", price: 65 },
      { city: "منوف", price: 65 },
      { city: "أخرى", price: 65 },
    ],
  },
  {
    governorate: "البحيرة",
    cities: [
      { city: "دمنهور", price: 65 },
      { city: "كفر الدوار", price: 65 },
      { city: "أخرى", price: 65 },
    ],
  },
  {
    governorate: "كفر الشيخ",
    cities: [
      { city: "كفر الشيخ مركز", price: 65 },
      { city: "دسوق", price: 65 },
      { city: "أخرى", price: 65 },
    ],
  },
  {
    governorate: "دمياط",
    cities: [
      { city: "دمياط مركز", price: 65 },
      { city: "رأس البر", price: 65 },
      { city: "أخرى", price: 65 },
    ],
  },
  {
    governorate: "الإسماعيلية",
    cities: [
      { city: "الإسماعيلية مركز", price: 65 },
      { city: "أخرى", price: 65 },
    ],
  },
  {
    governorate: "السويس",
    cities: [
      { city: "السويس مركز", price: 65 },
      { city: "أخرى", price: 65 },
    ],
  },
  {
    governorate: "بورسعيد",
    cities: [
      { city: "بورسعيد مركز", price: 65 },
      { city: "أخرى", price: 65 },
    ],
  },
  {
    governorate: "الفيوم",
    cities: [
      { city: "الفيوم مركز", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "بني سويف",
    cities: [
      { city: "بني سويف مركز", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "المنيا",
    cities: [
      { city: "المنيا مركز", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "أسيوط",
    cities: [
      { city: "أسيوط مركز", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "سوهاج",
    cities: [
      { city: "سوهاج مركز", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "قنا",
    cities: [
      { city: "قنا مركز", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "الأقصر",
    cities: [
      { city: "الأقصر مركز", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "أسوان",
    cities: [
      { city: "أسوان مركز", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "شمال سيناء",
    cities: [
      { city: "العريش", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "جنوب سيناء",
    cities: [
      { city: "شرم الشيخ", price: 85 },
      { city: "دهب", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "البحر الأحمر",
    cities: [
      { city: "الغردقة", price: 85 },
      { city: "سفاجا", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "الوادي الجديد",
    cities: [
      { city: "الخارجة", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
  {
    governorate: "مطروح",
    cities: [
      { city: "مرسى مطروح", price: 85 },
      { city: "أخرى", price: 85 },
    ],
  },
];
