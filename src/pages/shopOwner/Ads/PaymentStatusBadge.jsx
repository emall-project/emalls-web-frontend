import { PAYMENT_STATUS_LABELS } from "./adsUtils";

const PAY_MAP = {
  UNPAID: { background: "var(--amber-a3)", color: "var(--amber-11)" },
  PAID: { background: "var(--green-a3)", color: "var(--green-11)" },
  OVERDUE: { background: "var(--red-a3)", color: "var(--red-11)" },
  DEFAULT: { background: "var(--gray-a3)", color: "var(--gray-11)" },
};

export default function PaymentStatusBadge({ status }) {
  const style = PAY_MAP[status] ?? PAY_MAP.DEFAULT;

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: style.background, color: style.color }}
    >
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}
