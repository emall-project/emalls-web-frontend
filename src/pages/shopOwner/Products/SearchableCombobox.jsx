import { useEffect, useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { FiCheck, FiChevronDown, FiSearch, FiX } from "react-icons/fi";

export default function SearchableCombobox({
  label,
  value,
  onChange,
  options = [],
  placeholder = "ابحث أو اختر",
  emptyText = "لا توجد نتائج مطابقة",
  error = "",
  hint = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const portalContainer =
    typeof document === "undefined" ? undefined : document.querySelector(".radix-themes") || document.body;

  const selected = options.find((option) => String(option.value) === String(value));

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const normalized = query.trim().toLowerCase();
    return options.filter((option) => {
      const haystack = `${option.label} ${option.searchText || ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [options, query]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(timer);
    }
    setQuery("");
    return undefined;
  }, [open]);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
          {label}
        </label>
      )}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "var(--gray-a2)",
              borderColor: error ? "var(--red-8)" : open ? "var(--blue-8)" : "var(--gray-a6)",
              boxShadow: open ? "0 0 0 4px rgba(37,99,235,0.10)" : "none",
              color: selected ? "var(--gray-12)" : "var(--gray-9)",
            }}
          >
            <span className="truncate text-right">{selected?.label || placeholder}</span>
            <FiChevronDown
              size={16}
              style={{
                color: "var(--gray-9)",
                transition: "transform 0.2s ease",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
        </Popover.Trigger>

        <Popover.Portal container={portalContainer}>
          <Popover.Content
            sideOffset={8}
            align="start"
            className="z-[70] w-[var(--radix-popover-trigger-width)] rounded-2xl border p-2 shadow-2xl"
            style={{
              background: "var(--gray-2)",
              borderColor: "var(--gray-a6)",
            }}
          >
            <div
              className="mb-2 flex items-center gap-2 rounded-2xl border px-3"
              style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a3)" }}
            >
              <FiSearch size={14} style={{ color: "var(--gray-9)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                className="h-11 flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--gray-12)" }}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ color: "var(--gray-9)", background: "var(--gray-a4)" }}
                >
                  <FiX size={12} />
                </button>
              ) : null}
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl">
              {filteredOptions.length === 0 ? (
                <div
                  className="rounded-xl px-3 py-4 text-center text-sm"
                  style={{ color: "var(--gray-9)" }}
                >
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = String(option.value) === String(value);
                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => {
                        onChange(String(option.value));
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors"
                      style={{
                        background: isSelected ? "var(--blue-a3)" : "transparent",
                        color: isSelected ? "var(--blue-11)" : "var(--gray-12)",
                      }}
                      onMouseEnter={(event) => {
                        if (!isSelected) event.currentTarget.style.background = "var(--gray-a3)";
                      }}
                      onMouseLeave={(event) => {
                        if (!isSelected) event.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected ? <FiCheck size={14} /> : null}
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {error ? (
        <p className="text-xs" style={{ color: "var(--red-10)" }}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs" style={{ color: "var(--gray-9)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
