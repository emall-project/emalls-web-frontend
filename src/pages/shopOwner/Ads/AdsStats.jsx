import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEye,
  FiLayers,
  FiSlash,
  FiXCircle,
} from "react-icons/fi";

const STATS_CONFIG = [
  { key: "total", label: "إجمالي الإعلانات", icon: FiLayers, tone: "blue" },
  { key: "pending", label: "قيد المراجعة", icon: FiClock, tone: "amber", status: "PENDING" },
  { key: "approved", label: "مقبولة", icon: FiCheckCircle, tone: "emerald", status: "APPROVED" },
  { key: "rejected", label: "مرفوضة", icon: FiXCircle, tone: "red", status: "REJECTED" },
  { key: "unpaid", label: "غير مدفوعة", icon: FiDollarSign, tone: "slate", paymentStatus: "UNPAID" },
  { key: "paid", label: "مدفوعة", icon: FiCheckCircle, tone: "emerald", paymentStatus: "PAID" },
  { key: "overdue", label: "متأخرة الدفع", icon: FiSlash, tone: "red", paymentStatus: "OVERDUE" },
  { key: "displayed", label: "معروضة حاليًا", icon: FiEye, tone: "blue", displayStatus: "DISPLAYED" },
];

const TONE_CLASSES = {
  blue: {
    hoverBorder: "var(--blue-a7)",
    hoverBackground: "var(--blue-a2)",
    iconBackground: "var(--blue-a3)",
    iconColor: "var(--blue-9)",
    ringColor: "var(--blue-a5)",
  },
  amber: {
    hoverBorder: "var(--amber-a7)",
    hoverBackground: "var(--amber-a2)",
    iconBackground: "var(--amber-a3)",
    iconColor: "var(--amber-9)",
    ringColor: "var(--amber-a5)",
  },
  emerald: {
    hoverBorder: "var(--green-a7)",
    hoverBackground: "var(--green-a2)",
    iconBackground: "var(--green-a3)",
    iconColor: "var(--green-9)",
    ringColor: "var(--green-a5)",
  },
  red: {
    hoverBorder: "var(--red-a7)",
    hoverBackground: "var(--red-a2)",
    iconBackground: "var(--red-a3)",
    iconColor: "var(--red-9)",
    ringColor: "var(--red-a5)",
  },
  slate: {
    hoverBorder: "var(--gray-a7)",
    hoverBackground: "var(--gray-a3)",
    iconBackground: "var(--gray-a4)",
    iconColor: "var(--gray-10)",
    ringColor: "var(--gray-a6)",
  },
};

export default function AdsStats({ stats, activeFilter, onSelect }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
      {STATS_CONFIG.map((item) => {
        const tone = TONE_CLASSES[item.tone];
        const active =
          (item.status && activeFilter.status === item.status) ||
          (item.paymentStatus && activeFilter.paymentStatus === item.paymentStatus) ||
          (item.displayStatus && activeFilter.displayStatus === item.displayStatus) ||
          (item.key === "total" &&
            !activeFilter.status &&
            (!activeFilter.paymentStatus || activeFilter.paymentStatus === "ALL") &&
            (!activeFilter.displayStatus || activeFilter.displayStatus === "ALL"));

        const Icon = item.icon ?? FiActivity;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect?.(item)}
            className="rounded-[24px] border p-4 text-right shadow-sm transition hover:-translate-y-0.5"
            style={{
              background: "var(--gray-1)",
              borderColor: active ? tone.ringColor : "var(--gray-a5)",
              boxShadow: active
                ? `0 0 0 1px ${tone.ringColor}, 0 14px 34px rgba(2, 6, 23, 0.22)`
                : "0 12px 32px rgba(2, 6, 23, 0.16)",
            }}
            onMouseEnter={(event) => {
              if (!active) {
                event.currentTarget.style.borderColor = tone.hoverBorder;
                event.currentTarget.style.background = tone.hoverBackground;
              }
            }}
            onMouseLeave={(event) => {
              if (!active) {
                event.currentTarget.style.borderColor = "var(--gray-a5)";
                event.currentTarget.style.background = "var(--gray-1)";
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: tone.iconBackground, color: tone.iconColor }}
              >
                <Icon size={18} />
              </div>
              <div className="text-left">
                <div className="text-[2rem] font-black tracking-tight" style={{ color: "var(--gray-12)" }}>
                  {stats[item.key] ?? 0}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
              {item.label}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
              اضغط للتصفية
            </p>
          </button>
        );
      })}
    </section>
  );
}
