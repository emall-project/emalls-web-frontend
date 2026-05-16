export const AUDIENCE_OPTIONS = [
  { value: "MALE", label: "ذكور" },
  { value: "FEMALE", label: "إناث" },
  { value: "ALL", label: "للجميع" },
];

export const AGE_GROUP_OPTIONS = [
  { value: "NEWBORN", label: "حديثو الولادة" },
  { value: "INFANT", label: "الرضع" },
  { value: "TODDLER", label: "الأطفال الصغار" },
  { value: "CHILD", label: "الأطفال" },
  { value: "TEENAGER", label: "المراهقون" },
  { value: "YOUTH", label: "الشباب" },
  { value: "ADULT", label: "البالغون" },
  { value: "ALL", label: "الجميع" },
];

export const STATUS_COLORS = {
  true: { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)" },
  false: { bg: "var(--red-a3)", fg: "var(--red-11)", dot: "var(--red-9)" },
};

export const PRODUCT_FORM_STEPS = [
  { id: "basic", title: "المعلومات الأساسية", description: "اسم المنتج والرابط والوصف والحالة" },
  { id: "classification", title: "التصنيف والجمهور", description: "الفئة والماركة والجمهور والوسوم" },
  { id: "media", title: "الصور والوسائط", description: "رفع الصور وترتيبها وتحديد الصورة الرئيسية" },
  { id: "variants", title: "المتغيرات والأسعار", description: "إدارة المتغيرات والخصائص والأسعار" },
  { id: "preview", title: "المعاينة والنشر", description: "مراجعة الصفحة قبل إنشاء المنتج" },
];
