import { FiArrowRight, FiPackage, FiRefreshCw, FiX } from "react-icons/fi";

function HeaderBadge({ children, tone = "blue" }) {
  const tones = {
    blue: {
      background: "color-mix(in srgb, var(--blue-9) 12%, transparent)",
      borderColor: "color-mix(in srgb, var(--blue-9) 22%, transparent)",
      color: "var(--blue-11)",
    },
    gray: {
      background: "var(--gray-a3)",
      borderColor: "var(--gray-a5)",
      color: "var(--gray-11)",
    },
  };

  const style = tones[tone] || tones.blue;

  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold"
      style={style}
    >
      {children}
    </span>
  );
}

function IconButton({ onClick, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-all hover:-translate-y-0.5"
      style={{
        background: "var(--gray-1)",
        borderColor: "var(--gray-a5)",
        color: "var(--gray-11)",
        boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
      }}
    >
      {children}
    </button>
  );
}

function ActionButton({ onClick, icon: Icon, children, tone = "secondary" }) {
  const tones = {
    secondary: {
      background: "var(--gray-1)",
      borderColor: "var(--gray-a5)",
      color: "var(--gray-11)",
    },
    ghost: {
      background: "transparent",
      borderColor: "var(--red-a5)",
      color: "var(--red-10)",
    },
  };

  const style = tones[tone] || tones.secondary;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
      style={style}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

export default function AddProductHeader({ onBack, onRefresh, onCancel }) {
  return (
    <header
      className="rounded-[28px] border px-5 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] lg:px-6"
      style={{
        background: "var(--gray-1)",
        borderColor: "var(--gray-a5)",
      }}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          <IconButton onClick={onBack} label="العودة">
            <FiArrowRight size={16} />
          </IconButton>

          <div className="min-w-0 space-y-3">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border"
                style={{
                  background: "color-mix(in srgb, var(--blue-9) 10%, transparent)",
                  borderColor: "color-mix(in srgb, var(--blue-9) 18%, transparent)",
                  color: "var(--blue-11)",
                }}
              >
                <FiPackage size={17} />
              </span>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--gray-12)" }}>
                  إضافة منتج جديد
                </h1>
                <p className="text-sm leading-6" style={{ color: "var(--gray-9)" }}>
                  أضف بيانات المنتج والصور والمتغيرات ثم راجعه قبل النشر
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <HeaderBadge tone="blue">5 خطوات واضحة</HeaderBadge>
              <HeaderBadge tone="gray">متوافق مع قواعد backend</HeaderBadge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <ActionButton onClick={onRefresh} icon={FiRefreshCw}>
            تحديث المراجع
          </ActionButton>
          <ActionButton onClick={onCancel} icon={FiX} tone="ghost">
            إلغاء
          </ActionButton>
        </div>
      </div>
    </header>
  );
}
