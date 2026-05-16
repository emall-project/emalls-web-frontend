import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FiCopy, FiCreditCard, FiEdit2, FiEye, FiMoreVertical, FiSlash, FiClock } from "react-icons/fi";

import { isPayableRequest, isPendingRequest, useThemeContainer } from "./adsUtils";

export default function AdActionsMenu({ request, onView, onEdit, onCancel, onPay, onHistory, onCopy }) {
  const isPending   = isPendingRequest(request);
  const isPayable   = isPayableRequest(request);
  const container   = useThemeContainer();

  return (
    <DropdownMenu.Root dir="rtl">
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition outline-none"
          style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)", color: "var(--gray-10)" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--blue-a7)"; e.currentTarget.style.color = "var(--blue-9)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gray-a5)"; e.currentTarget.style.color = "var(--gray-10)"; }}
        >
          <FiMoreVertical size={16} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal container={container}>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-[90] min-w-52 rounded-2xl border p-2 shadow-2xl outline-none"
          style={{ background: "var(--gray-2)", borderColor: "var(--gray-a5)" }}
        >
          <ActionItem icon={<FiEye size={15} />}        label="عرض التفاصيل"  onSelect={() => onView?.(request)} />
          {isPending ? <ActionItem icon={<FiEdit2 size={15} />}      label="تعديل"          onSelect={() => onEdit?.(request)} /> : null}
          {isPending ? <ActionItem icon={<FiSlash size={15} />}      label="إلغاء الطلب"    onSelect={() => onCancel?.(request)} danger /> : null}
          {isPayable ? <ActionItem icon={<FiCreditCard size={15} />} label="دفع الإعلان"    onSelect={() => onPay?.(request)} /> : null}
          <ActionItem icon={<FiClock size={15} />}      label="سجل الدفع"      onSelect={() => onHistory?.(request)} />
          <ActionItem icon={<FiCopy size={15} />}       label="نسخ رقم الطلب"  onSelect={() => onCopy?.(request)} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ActionItem({ icon, label, onSelect, danger = false }) {
  const color      = danger ? "var(--red-10)"  : "var(--gray-11)";
  const iconColor  = danger ? "var(--red-8)"   : "var(--gray-8)";
  const hoverBg    = danger ? "var(--red-a3)"  : "var(--gray-a3)";
  const hoverColor = danger ? "var(--red-11)"  : "var(--gray-12)";

  return (
    <DropdownMenu.Item
      onSelect={(e) => { e.preventDefault(); onSelect?.(); }}
      className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors"
      style={{ color }}
      onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = hoverColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = color; }}
    >
      <span>{label}</span>
      <span style={{ color: iconColor }}>{icon}</span>
    </DropdownMenu.Item>
  );
}
