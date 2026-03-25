import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  FiMoreVertical, FiEye, FiEdit,
  FiCheckCircle, FiXCircle, FiChevronLeft,
} from "react-icons/fi";
import { MALL_STATUSES, STATUS_COLORS, STATUS_LABELS } from "./constants";
import { Spinner } from "./ui";

function useThemeContainer() {
  const [container, setContainer] = React.useState(null);
  React.useEffect(() => {
    setContainer(document.querySelector('.radix-themes') || document.body);
  }, []);
  return container;
}



// dark-mode safe dropdown surface
const menuStyle = {
  background:  "var(--color-panel-solid, var(--gray-1))",
  border:      "1px solid var(--gray-a6)",
  color:       "var(--gray-12)",
  boxShadow:   "0 14px 40px rgba(0,0,0,.35)",
};

export default function AdminActionsMenu({
  mall, loading,
  onView, onEdit,
  onActivate, onDeactivate, onChangeStatus,
}) {
  const themeContainer = useThemeContainer();
  const isActive     = mall?.status === "ACTIVE";
  const otherStatuses = MALL_STATUSES.filter((s) => s !== mall?.status);

  return (
    <DropdownMenu.Root dir="rtl">
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="p-2 rounded-lg transition outline-none hover:opacity-70"
          style={{ color: "var(--gray-12)" }}
          disabled={loading}
        >
          {loading ? <Spinner size={14} /> : <FiMoreVertical />}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal container={themeContainer}>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-50 min-w-[200px] rounded-xl p-2 outline-none"
          style={menuStyle}
        >
          <DropdownMenu.Label
            className="px-2 py-1.5 text-xs font-semibold"
            style={{ color: "var(--gray-10)" }}
          >
            الإجراءات
          </DropdownMenu.Label>

          {/* عرض التفاصيل */}
          <DDItem icon={<FiEye />} onSelect={() => onView(mall)}>
            عرض التفاصيل
          </DDItem>

          {/* تعديل */}
          <DDItem icon={<FiEdit />} onSelect={() => onEdit(mall)}>
            تعديل المول
          </DDItem>

          <DropdownMenu.Separator
            className="my-1.5 mx-2"
            style={{ height: 1, background: "var(--gray-a5)" }}
          />

          {/* تفعيل / تعطيل */}
          <DDItem
            icon={isActive ? <FiXCircle /> : <FiCheckCircle />}
            onSelect={() => isActive ? onDeactivate(mall) : onActivate(mall)}
          >
            {isActive ? "تعطيل المول" : "تفعيل المول"}
          </DDItem>

          {/* ── تحويل الحالة Sub Menu ── */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger
              className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm
                         cursor-pointer select-none outline-none transition-colors
                         hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: "var(--gray-12)" }}
            >
              <span className="text-base opacity-70 flex items-center">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ background: STATUS_COLORS[mall?.status]?.dot }}
                />
              </span>
              <span className="font-medium flex-1">تحويل الحالة</span>
              <FiChevronLeft size={13} style={{ color: "var(--gray-10)", flexShrink: 0 }} />
            </DropdownMenu.SubTrigger>

            <DropdownMenu.Portal container={themeContainer}>
              <DropdownMenu.SubContent
                sideOffset={4}
                alignOffset={-6}
                className="z-[9999] min-w-[180px] rounded-xl p-2 outline-none"
                style={menuStyle}
              >
                {otherStatuses.map((s) => (
                  <DDItem
                    key={s}
                    icon={
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: STATUS_COLORS[s]?.dot }}
                      />
                    }
                    onSelect={() => onChangeStatus(mall, s)}
                  >
                    {STATUS_LABELS[s]}
                  </DDItem>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function DDItem({ children, icon, onSelect, danger }) {
  return (
    <DropdownMenu.Item
      className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm
                 cursor-pointer select-none outline-none transition-colors
                 hover:bg-black/5 dark:hover:bg-white/5"
      onSelect={(e) => { e.preventDefault(); onSelect?.(); }}
      style={{ color: danger ? "#f87171" : "var(--gray-12)" }}
    >
      <span className="text-base" style={{ opacity: danger ? 1 : 0.75 }}>{icon}</span>
      <span className="font-medium">{children}</span>
    </DropdownMenu.Item>
  );
}