import { FiInfo, FiPackage } from "react-icons/fi";

function Counter({ value, max, warningAt = 0.85 }) {
  const ratio = max ? value.length / max : 0;
  const color = ratio >= 1 ? "var(--red-10)" : ratio >= warningAt ? "var(--amber-10)" : "var(--gray-8)";

  return (
    <span className="text-[11px] font-semibold" style={{ color }}>
      {value.length}/{max}
    </span>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs" style={{ color: "var(--red-10)" }}>
      {message}
    </p>
  );
}

const inputStyle = {
  background: "var(--gray-1)",
  border: "1px solid var(--gray-a6)",
  borderRadius: 18,
  color: "var(--gray-12)",
  outline: "none",
  padding: "13px 15px",
  width: "100%",
};

export default function BasicInfoStep({ form, errors, onFieldChange, onNameChange }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_320px]">
      <div className="space-y-5">
        <section className="rounded-[30px] border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "var(--blue-a2)", color: "var(--blue-11)" }}>
              <FiPackage size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                معلومات المنتج الأساسية
              </h2>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--gray-9)" }}>
                اكتب اسمًا واضحًا ووصفًا مختصرًا وكاملًا، ثم راجع الرابط المختصر قبل الانتقال للخطوة التالية.
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)]">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                    اسم المنتج
                  </label>
                  <Counter value={form.name} max={50} />
                </div>
                <input
                  value={form.name}
                  onChange={(event) => onNameChange(event.target.value)}
                  placeholder="مثال: حقيبة ظهر يومية"
                  style={inputStyle}
                />
                <FieldError message={errors.name} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  الرابط المختصر
                </label>
                <input
                  value={form.slug}
                  onChange={(event) => onFieldChange("slug", event.target.value)}
                  placeholder="daily-backpack"
                  dir="ltr"
                  style={{ ...inputStyle, textAlign: "left" }}
                />
                <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                  يتم توليده تلقائيًا من اسم المنتج ويمكنك تعديله يدويًا.
                </p>
                <FieldError message={errors.slug} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  وصف قصير
                </label>
                <Counter value={form.shortDescription} max={100} />
              </div>
              <textarea
                value={form.shortDescription}
                onChange={(event) => onFieldChange("shortDescription", event.target.value)}
                placeholder="نبذة مختصرة تظهر في القوائم وبطاقات المنتجات."
                rows={3}
                maxLength={100}
                style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
              />
              <FieldError message={errors.shortDescription} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  الوصف الكامل
                </label>
                <Counter value={form.description} max={2500} />
              </div>
              <textarea
                value={form.description}
                onChange={(event) => onFieldChange("description", event.target.value)}
                placeholder="أضف تفاصيل المنتج، الخامات، المزايا، وطريقة الاستخدام."
                rows={8}
                maxLength={2500}
                style={{ ...inputStyle, minHeight: 220, resize: "vertical" }}
              />
              <FieldError message={errors.description} />
            </div>
          </div>
        </section>
      </div>

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
              <FiInfo size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                إرشادات سريعة
              </h3>
              <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                هذه الخطوة تؤثر مباشرة على وضوح العرض داخل المتجر.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm leading-7" style={{ color: "var(--gray-11)" }}>
            <p>استخدم اسمًا واضحًا ومختصرًا ليسهل العثور على المنتج في القائمة.</p>
            <p>اجعل الوصف القصير بيعّيًا ومباشرًا، والوصف الكامل مناسبًا لشرح المزايا المهمة.</p>
            <p>إذا أردت نشر المنتج مباشرة لاحقًا، راقب حالة المنتج من نفس الصفحة.</p>
          </div>
        </section>

        <section className="rounded-[30px] border p-6" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
              حالة المنتج
            </h3>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold"
              style={{
                background: form.isActive ? "var(--green-a3)" : "var(--amber-a3)",
                color: form.isActive ? "var(--green-11)" : "var(--amber-11)",
              }}
            >
              {form.isActive ? "نشط" : "غير نشط"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[24px] border px-4 py-4" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                {form.isActive ? "سيظهر المنتج للعملاء" : "سيُحفظ كمسودة غير ظاهرة"}
              </p>
              <p className="mt-1 text-xs leading-6" style={{ color: "var(--gray-9)" }}>
                يمكنك تغيير الحالة الآن أو أثناء المعاينة النهائية قبل الإرسال.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onFieldChange("isActive", !form.isActive)}
              className="relative h-7 w-12 rounded-full transition-colors"
              style={{ background: form.isActive ? "var(--blue-9)" : "var(--gray-a5)" }}
            >
              <span
                className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform"
                style={{ transform: form.isActive ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
}
