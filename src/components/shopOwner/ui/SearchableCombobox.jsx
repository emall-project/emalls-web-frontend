import { useState, useRef, useMemo, useCallback, useEffect, memo } from "react";
import { Popover } from "@radix-ui/themes";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  FiSearch, FiCheck, FiX, FiChevronDown, FiAlertCircle,
} from "react-icons/fi";

// ── Constants ─────────────────────────────────────────────────────────────────
const ITEM_H          = 36;   // px — fixed row height for virtualizer
const VIRTUAL_CUTOFF  = 50;   // use virtualizer when list exceeds this
const DEBOUNCE_MS     = 300;

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round"
      style={{ animation: "spin 0.75s linear infinite", flexShrink: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Option row — memoised so virtualizer skips unchanged rows ─────────────────
const OptionItem = memo(function OptionItem({ itemValue, label, isSelected, isActive, onSelect }) {
  const handleClick = useCallback(() => onSelect(itemValue), [itemValue, onSelect]);

  let bg = "transparent";
  if (isSelected) bg = "var(--blue-a2)";
  if (isActive && !isSelected) bg = "var(--gray-a3)";

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={handleClick}
      style={{
        height: ITEM_H,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        cursor: "pointer",
        fontSize: 13,
        color: isSelected ? "var(--blue-11)" : "var(--gray-12)",
        background: bg,
        userSelect: "none",
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--gray-a3)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
        {label}
      </span>
      {isSelected && <FiCheck size={13} style={{ color: "var(--blue-9)", flexShrink: 0, marginInlineStart: 6 }} />}
    </div>
  );
});

// ── Main component ────────────────────────────────────────────────────────────
/**
 * SearchableCombobox — for large dynamic lists (brands, categories).
 *
 * Props
 *   value             string   – selected value ("" = none)
 *   onChange          fn       – (v: string) => void
 *   placeholder       string   – trigger label when nothing selected
 *   searchPlaceholder string   – search input placeholder
 *   options           array    – { value: string|number, label: string }[]  (pre-loaded)
 *   onSearch          async fn – (q: string) => { value, label }[]  (optional server-side)
 *   isLoading         bool     – outer loading state (initial fetch)
 *   emptyText         string   – shown when no results
 *   style             object   – applied to trigger button
 *   dir               string   – "rtl" | "ltr"
 */
export function SearchableCombobox({
  value      = "",
  onChange,
  placeholder       = "اختر...",
  searchPlaceholder = "ابحث...",
  options    = [],
  onSearch,
  isLoading  = false,
  emptyText  = "لا توجد نتائج",
  style,
  dir        = "rtl",
}) {
  const [open,          setOpen]          = useState(false);
  const [search,        setSearch]        = useState("");
  const [serverOptions, setServerOptions] = useState(null);  // null = not yet searched
  const [fetchLoading,  setFetchLoading]  = useState(false);
  const [fetchError,    setFetchError]    = useState(null);
  const [activeIdx,     setActiveIdx]     = useState(-1);

  const searchRef = useRef(null);
  const listRef   = useRef(null);

  const debouncedSearch = useDebounce(search, DEBOUNCE_MS);

  // ── Reset on close ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    setSearch("");
    setActiveIdx(-1);
    setServerOptions(null);
    setFetchError(null);
  }, [open]);

  // ── Server-side search — fires 300ms after typing stops ───────────────────
  useEffect(() => {
    if (!onSearch || !open) return;
    let cancelled = false;
    setFetchLoading(true);
    setFetchError(null);
    onSearch(debouncedSearch)
      .then(r  => { if (!cancelled) setServerOptions(r ?? []); })
      .catch(e => { if (!cancelled) setFetchError(e?.message || "حدث خطأ"); })
      .finally(() => { if (!cancelled) setFetchLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedSearch, onSearch, open]);

  // ── Client-side filter (used when no onSearch prop) ───────────────────────
  const clientFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const displayOptions = serverOptions ?? clientFiltered;
  const isWorking      = isLoading || fetchLoading;

  // Label for the selected value
  const selectedLabel = useMemo(
    () => options.find(o => String(o.value) === String(value))?.label ?? null,
    [options, value]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelect = useCallback((val) => {
    onChange(String(val) === String(value) ? "" : val);
    setOpen(false);
  }, [value, onChange]);

  const handleClear = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
  }, [onChange]);

  function retryFetch() {
    setFetchError(null);
    setServerOptions(null);
  }

  // ── Keyboard navigation ────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(displayOptions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(-1, i - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      if (displayOptions[activeIdx]) handleSelect(displayOptions[activeIdx].value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Scroll active row into view when keyboard-navigating
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const top    = activeIdx * ITEM_H;
    const bottom = top + ITEM_H;
    const { scrollTop, clientHeight } = listRef.current;
    if (top < scrollTop)                    listRef.current.scrollTop = top;
    else if (bottom > scrollTop + clientHeight) listRef.current.scrollTop = bottom - clientHeight;
  }, [activeIdx]);

  // ── Virtualizer ────────────────────────────────────────────────────────────
  const useVirtual = displayOptions.length > VIRTUAL_CUTOFF;
  const virtualizer = useVirtualizer({
    count:            displayOptions.length,
    getScrollElement: () => listRef.current,
    estimateSize:     () => ITEM_H,
    overscan:         6,
    enabled:          useVirtual,
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {/* ── Trigger ── */}
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          style={{
            display:    "inline-flex",
            alignItems: "center",
            gap:        6,
            padding:    "0 10px",
            height:     36,
            width:      "100%",
            background: "var(--gray-1)",
            border:     `1px solid ${open ? "var(--blue-a7)" : "var(--gray-a6)"}`,
            borderRadius: 10,
            fontSize:   13,
            color:      value ? "var(--gray-12)" : "var(--gray-9)",
            cursor:     "pointer",
            outline:    "none",
            overflow:   "hidden",
            transition: "border-color 0.15s",
            ...style,
          }}
          onMouseEnter={e => {
            if (!open) e.currentTarget.style.borderColor = "var(--gray-a8)";
          }}
          onMouseLeave={e => {
            if (!open) e.currentTarget.style.borderColor = "var(--gray-a6)";
          }}
        >
          <span style={{
            flex:         1,
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
            textAlign:    dir === "rtl" ? "right" : "left",
          }}>
            {selectedLabel ?? placeholder}
          </span>

          {value ? (
            <span
              role="button"
              aria-label="مسح"
              onClick={handleClear}
              style={{ display: "flex", alignItems: "center", flexShrink: 0, cursor: "pointer",
                color: "var(--gray-8)", padding: 2, borderRadius: 4 }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--red-10)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--gray-8)"; }}
            >
              <FiX size={12} />
            </span>
          ) : (
            <FiChevronDown size={13} style={{
              flexShrink:  0,
              color:       "var(--gray-8)",
              transition:  "transform 0.2s",
              transform:   open ? "rotate(180deg)" : "none",
            }} />
          )}
        </button>
      </Popover.Trigger>

      {/* ── Dropdown ── */}
      <Popover.Content
        dir={dir}
        sideOffset={5}
        avoidCollisions
        onOpenAutoFocus={e => e.preventDefault()}
        onKeyDown={handleKeyDown}
        style={{
          padding:      0,
          width:        "var(--radix-popover-trigger-width)",
          minWidth:     200,
          maxWidth:     360,
          border:       "1px solid var(--gray-a5)",
          borderRadius: 12,
          overflow:     "hidden",
          boxShadow:    "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          background:   "var(--gray-1)",
        }}
      >
        {/* Search input */}
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          8,
          padding:      "8px 10px",
          borderBottom: "1px solid var(--gray-a4)",
          direction:    dir,
        }}>
          <FiSearch size={14} style={{ color: "var(--gray-8)", flexShrink: 0 }} />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            dir={dir}
            style={{
              flex:       1,
              border:     "none",
              outline:    "none",
              background: "transparent",
              fontSize:   13,
              color:      "var(--gray-12)",
              minWidth:   0,
            }}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              style={{ display: "flex", alignItems: "center", color: "var(--gray-7)",
                background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--gray-11)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--gray-7)"}
            >
              <FiX size={12} />
            </button>
          )}
        </div>

        {/* Option list */}
        <div
          ref={listRef}
          role="listbox"
          style={{
            maxHeight:      280,
            overflowY:      "auto",
            scrollbarWidth: "thin",
            direction:      dir,
          }}
        >
          {isWorking ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, padding: "20px 0", color: "var(--gray-9)", fontSize: 13 }}>
              <Spinner /> جاري التحميل...
            </div>

          ) : fetchError ? (
            <div style={{ padding: "16px 12px", textAlign: "center" }}>
              <FiAlertCircle size={18} style={{ color: "var(--red-9)", margin: "0 auto 6px", display: "block" }} />
              <p style={{ color: "var(--gray-10)", fontSize: 12, marginBottom: 8 }}>{fetchError}</p>
              <button type="button" onClick={retryFetch} style={{
                fontSize: 12, color: "var(--blue-11)", background: "var(--blue-a2)",
                border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer",
              }}>
                إعادة المحاولة
              </button>
            </div>

          ) : displayOptions.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--gray-9)", fontSize: 13 }}>
              {emptyText}
            </div>

          ) : useVirtual ? (
            /* Virtualized rendering — only DOM nodes for visible rows */
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map(vItem => {
                const item       = displayOptions[vItem.index];
                const isSelected = String(item.value) === String(value);
                return (
                  <div
                    key={vItem.key}
                    data-index={vItem.index}
                    ref={virtualizer.measureElement}
                    style={{ position: "absolute", top: vItem.start, left: 0, right: 0 }}
                  >
                    <OptionItem
                      itemValue={item.value}
                      label={item.label}
                      isSelected={isSelected}
                      isActive={activeIdx === vItem.index}
                      onSelect={handleSelect}
                    />
                  </div>
                );
              })}
            </div>

          ) : (
            /* Regular rendering for short lists */
            displayOptions.map((item, idx) => (
              <OptionItem
                key={item.value}
                itemValue={item.value}
                label={item.label}
                isSelected={String(item.value) === String(value)}
                isActive={idx === activeIdx}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
