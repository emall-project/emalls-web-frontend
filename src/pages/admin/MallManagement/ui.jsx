import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck, FiX, FiAlertCircle, FiLoader, FiSearch } from "react-icons/fi";
import { STATUS_COLORS, STATUS_LABELS, GLOBAL_STYLES } from "./constants";

// ── Style injector ─────────────────────────────────────────────────────────────
export function StyleInjector() {
  return <style>{GLOBAL_STYLES}</style>;
}

// ── useClickOutside ────────────────────────────────────────────────────────────
export function useClickOutside(ref, handler) {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, handler]);
}

// ── Spinner ────────────────────────────────────────────────────────────────────
export function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="spinning" style={{ color: "var(--f-border-focus)" }} />;
}

// ── Toast ──────────────────────────────────────────────────────────────────────
export function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = type === "success"
    ? { bg: "#f0fdf4", border: "#86efac", text: "#16a34a" }
    : { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626" };

  return (
    <div
      className="fade-in fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium"
      style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
    >
      {type === "success" ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
      {message}
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity mr-1">
        <FiX size={14} />
      </button>
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ── CustomDropdown (single select) ────────────────────────────────────────────
export function CustomDropdown({ value, onChange, options, placeholder = "اختر..." }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`f-trigger${open ? " open" : ""}`}
        style={{ color: selected?.value !== "all" && selected ? "var(--f-text)" : "var(--f-placeholder)" }}
      >
        <span className="flex items-center gap-2 truncate flex-1 min-w-0">
          {selected?.dot && (
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selected.dot }} />
          )}
          <span className="truncate">{selected?.label || placeholder}</span>
        </span>
        <FiChevronDown
          size={14}
          style={{
            color: "var(--f-chevron)", flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform .2s",
          }}
        />
      </button>

      {open && (
        <div className="f-panel">
          <div className="p-1.5">
            {options.map((opt) => {
              const isActive = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`f-item${isActive ? " active" : ""}`}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                >
                  {opt.dot && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.dot }} />
                  )}
                  <span className="flex-1">{opt.label}</span>
                  {isActive && (
                    <FiCheck size={13} style={{ color: "var(--f-item-active-text)", flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── FilterInput ────────────────────────────────────────────────────────────────
export function FilterInput({ value, onChange, placeholder, icon: Icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={13}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: focused ? "var(--f-border-focus)" : "var(--f-icon)", transition: "color .15s" }}
        />
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="f-input"
        style={{ paddingRight: Icon ? "2.5rem" : "1rem" }}
      />
    </div>
  );
}

// ── CityDropdown ───────────────────────────────────────────────────────────────
export function CityDropdown({ value, onChange, cities, loadingCities, onRequestCreate }) {
  const [open, setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useClickOutside(ref, () => { setOpen(false); setSearch(""); });

  const filtered = cities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const selected = cities.find((c) => String(c.cityId) === String(value));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`f-trigger${open ? " open" : ""}`}
        style={{ color: selected ? "var(--f-text)" : "var(--f-placeholder)" }}
      >
        <span className="flex items-center gap-2 truncate flex-1 min-w-0">
          {loadingCities ? (
            <><Spinner size={13} /><span>جاري التحميل...</span></>
          ) : (
            <span className="truncate">{selected ? selected.name : "اختر المدينة"}</span>
          )}
        </span>
        <FiChevronDown
          size={14}
          style={{
            color: "var(--f-chevron)", flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform .2s",
          }}
        />
      </button>

      {open && (
        <div className="f-panel" style={{ zIndex: 10010 }}>
          {/* Inner search */}
          <div className="p-2 border-b" style={{ borderColor: "var(--f-divider)" }}>
            <div className="relative">
              <FiSearch
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--f-icon)" }}
              />
              <input
                className="w-full rounded-lg pr-8 pl-3 py-1.5 text-xs outline-none"
                style={{ background: "var(--f-search-bg)", border: "1px solid var(--f-divider)", color: "var(--f-text)" }}
                placeholder="ابحث عن مدينة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* List */}
          <div className="p-1.5 max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-center py-3" style={{ color: "var(--f-placeholder)" }}>لا توجد مدن</p>
            ) : (
              filtered.map((city) => {
                const isActive = String(value) === String(city.cityId);
                return (
                  <button
                    key={city.cityId}
                    type="button"
                    className={`f-item${isActive ? " active" : ""}`}
                    onClick={() => { onChange(String(city.cityId)); setOpen(false); setSearch(""); }}
                  >
                    <span className="flex-1 text-right">{city.name}</span>
                    {city.baseFee != null && (
                      <span className="text-[10px] opacity-60">₪{city.baseFee}</span>
                    )}
                    {isActive && (
                      <FiCheck size={12} style={{ color: "var(--f-item-active-text)", flexShrink: 0 }} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Create new city */}
          <div className="p-2 border-t" style={{ borderColor: "var(--f-divider)" }}>
            <button
              type="button"
              onClick={() => { setOpen(false); onRequestCreate?.(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
              style={{ background: "rgba(37,99,235,.08)", color: "#2563eb" }}
            >
              + إضافة مدينة جديدة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}