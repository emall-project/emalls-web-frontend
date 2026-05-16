import { REQUEST_STATUS_LABELS } from "./adsUtils";

const STATUS_MAP = {
  PENDING: { background: "var(--amber-a3)", color: "var(--amber-11)", dot: "var(--amber-9)" },
  APPROVED: { background: "var(--green-a3)", color: "var(--green-11)", dot: "var(--green-9)" },
  REJECTED: { background: "var(--red-a3)", color: "var(--red-11)", dot: "var(--red-9)" },
  DEFAULT: { background: "var(--gray-a3)", color: "var(--gray-11)", dot: "var(--gray-8)" },
};

export default function AdStatusBadge({ status }) {
  const style = STATUS_MAP[status] ?? STATUS_MAP.DEFAULT;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: style.background, color: style.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
      {REQUEST_STATUS_LABELS[status] ?? status}
    </span>
  );
}
