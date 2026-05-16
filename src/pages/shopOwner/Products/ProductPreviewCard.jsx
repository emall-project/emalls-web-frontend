import { useMemo, useState } from "react";
import { FiCheckCircle, FiImage, FiTag } from "react-icons/fi";
import { AGE_GROUP_OPTIONS, AUDIENCE_OPTIONS } from "./constants";
import { getOptionLabel, getPreviewVariant, getVariantMediaItems } from "./productFormUtils";

function Badge({ children, tone = "blue" }) {
  const tones = {
    blue: { bg: "var(--blue-a2)", fg: "var(--blue-11)" },
    green: { bg: "var(--green-a2)", fg: "var(--green-11)" },
    amber: { bg: "var(--amber-a2)", fg: "var(--amber-11)" },
    gray: { bg: "var(--gray-a3)", fg: "var(--gray-11)" },
  };

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: tones[tone].bg, color: tones[tone].fg }}>
      {children}
    </span>
  );
}

export default function ProductPreviewCard({ form, categories, brands }) {
  const [previewVariantKey, setPreviewVariantKey] = useState(form.variants.find((variant) => variant.isDefault)?.key || form.variants[0]?.key);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const previewVariant = getPreviewVariant(form, previewVariantKey);
  const previewMedia = useMemo(() => getVariantMediaItems(form, previewVariant), [form, previewVariant]);
  const currentImage = previewMedia[activeImageIndex] || previewMedia[0];

  const category = categories.find((item) => String(item.id) === String(form.categoryId));
  const brand = brands.find((item) => String(item.id) === String(form.brandId));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="overflow-hidden rounded-[32px] border" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,1.05fr)]">
          <div className="border-b p-5 lg:border-b-0 lg:border-l" style={{ borderColor: "var(--gray-a4)" }}>
            <div className="overflow-hidden rounded-[28px] border" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
              {currentImage?.previewUrl ? (
                <img src={currentImage.previewUrl} alt={form.name} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center">
                  <FiImage size={28} style={{ color: "var(--gray-8)" }} />
                </div>
              )}
            </div>

            {previewMedia.length > 1 ? (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {previewMedia.map((item, index) => (
                  <button
                    key={item.localId}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className="overflow-hidden rounded-2xl border transition-all"
                    style={{
                      borderColor: index === activeImageIndex ? "var(--blue-7)" : "var(--gray-a5)",
                      boxShadow: index === activeImageIndex ? "0 12px 28px rgba(37,99,235,0.12)" : "none",
                    }}
                  >
                    <img src={item.previewUrl} alt={item.fileName} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-5 p-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={form.isActive ? "green" : "amber"}>
                  {form.isActive ? "نشط" : "غير نشط"}
                </Badge>
                <Badge tone="gray">{brand?.name || "بدون ماركة"}</Badge>
                <Badge tone="gray">{category?.name || "بدون فئة"}</Badge>
              </div>

              <div>
                <h2 className="text-3xl font-bold leading-tight" style={{ color: "var(--gray-12)" }}>
                  {form.name || "اسم المنتج سيظهر هنا"}
                </h2>
                <p className="mt-2 text-lg font-semibold" style={{ color: "var(--blue-11)" }}>
                  {previewVariant?.basePrice ? `${Number(previewVariant.basePrice).toLocaleString("ar-SA")} ₪` : "أضف السعر لعرضه هنا"}
                </p>
              </div>

              <p className="text-sm leading-7" style={{ color: "var(--gray-10)" }}>
                {form.shortDescription || "الوصف القصير سيظهر هنا أثناء المعاينة."}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                المتغيرات المتاحة
              </h3>
              <div className="flex flex-wrap gap-2">
                {form.variants.map((variant) => (
                  <button
                    key={variant.key}
                    type="button"
                    onClick={() => {
                      setPreviewVariantKey(variant.key);
                      setActiveImageIndex(0);
                    }}
                    className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
                    style={{
                      background: previewVariant?.key === variant.key ? "var(--blue-9)" : "var(--gray-a3)",
                      color: previewVariant?.key === variant.key ? "#fff" : "var(--gray-11)",
                    }}
                  >
                    {variant.name || "متغير جديد"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                  الجمهور والعمر
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge>{getOptionLabel(AUDIENCE_OPTIONS, form.targetedAudience)}</Badge>
                  <Badge>{getOptionLabel(AGE_GROUP_OPTIONS, form.ageGroup)}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                  الوسوم
                </h3>
                <div className="flex flex-wrap gap-2">
                  {form.tags.length ? form.tags.map((tag) => (
                    <Badge key={tag.name} tone="gray">
                      <FiTag size={11} />
                      {tag.name}
                    </Badge>
                  )) : <p className="text-sm" style={{ color: "var(--gray-9)" }}>لا توجد وسوم بعد</p>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                الوصف الكامل
              </h3>
              <p className="text-sm leading-8 whitespace-pre-wrap" style={{ color: "var(--gray-10)" }}>
                {form.description || "الوصف الكامل سيظهر هنا قبل النشر."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-5 xl:sticky xl:top-0 xl:self-start">
        <section
          className="rounded-[30px] border p-6"
          style={{
            background: "linear-gradient(180deg, var(--blue-a2), var(--gray-1))",
            borderColor: "var(--blue-a5)",
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "var(--gray-1)", color: "var(--blue-10)" }}>
              <FiCheckCircle size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                مراجعة نهائية
              </h3>
              <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                نفس البيانات التي سترسل إلى الـ backend.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-[24px] border px-4 py-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
                الرابط المختصر
              </p>
              <p className="mt-2 text-sm font-bold" dir="ltr" style={{ color: "var(--gray-12)" }}>
                {form.slug || "—"}
              </p>
            </div>

            <div className="rounded-[24px] border px-4 py-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
                عدد المتغيرات
              </p>
              <p className="mt-2 text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                {form.variants.length} متغير
              </p>
            </div>

            <div className="rounded-[24px] border px-4 py-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
                الصور المربوطة بالمتغير الحالي
              </p>
              <p className="mt-2 text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                {previewMedia.length} صورة
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
