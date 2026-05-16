import { Select } from "@radix-ui/themes";

/**
 * Shared Radix UI Select for all Shop Owner screens.
 *
 * Props:
 *   value          – string | number (use "" for "nothing selected")
 *   onValueChange  – (value: string) => void
 *   options        – { value: string | number, label: string }[]
 *   placeholder    – string  (shown when value === ""; also the first "clear" item in the list)
 *   disabled       – boolean
 *   error          – boolean (red ring)
 *   style          – React.CSSProperties  (e.g. { minWidth: 150, width: "auto" })
 */

// Sentinel used internally so Radix never receives "" as an Item value
const EMPTY = "__rx_empty__";

export function RxSelect({
  value,
  onValueChange,
  options = [],
  placeholder = "اختر...",
  disabled = false,
  error = false,
  style,
}) {
  const inner = value === "" || value == null ? EMPTY : String(value);
  const container =
    typeof document === "undefined" ? undefined : document.querySelector(".radix-themes") || document.body;

  return (
    <Select.Root
      value={inner}
      onValueChange={v => onValueChange(v === EMPTY ? "" : v)}
      disabled={disabled}
      dir="rtl"
    >
      <Select.Trigger
        variant="surface"
        placeholder={placeholder}
        style={{
          width: "100%",
          minHeight: 48,
          borderRadius: 10,
          background: "var(--gray-a2)",
          border: "1px solid var(--gray-a6)",
          color: "var(--gray-12)",
          cursor: disabled ? "not-allowed" : "pointer",
          ...(error && { boxShadow: "0 0 0 2px var(--red-8)" }),
          ...style,
        }}
      />
      <Select.Content
        position="popper"
        sideOffset={6}
        container={container}
        className="z-[9999] overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          background: "var(--gray-2)",
          borderColor: "var(--gray-a6)",
          minWidth: "var(--radix-select-trigger-width)",
          maxHeight: 280,
        }}
      >
        {placeholder && (
          <Select.Item value={EMPTY}>{placeholder}</Select.Item>
        )}
        {options.map(o => (
          <Select.Item key={String(o.value)} value={String(o.value)}>
            {o.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
