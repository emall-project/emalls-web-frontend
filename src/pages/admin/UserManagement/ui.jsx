import React, { useState, useEffect } from "react";
import { FiLoader, FiX } from "react-icons/fi";
import { ROLE_COLORS, getRoleId, getRoleLabel } from "./constants";

// ── useThemeContainer ──────────────────────────────────────────────────────────
export function useThemeContainer() {
  const [c, setC] = useState(null);
  useEffect(() => { setC(document.querySelector(".radix-themes") || document.body); }, []);
  return c;
}

// ── StyleInjector — scoped to .radix-themes for dark mode ─────────────────────
const GLOBAL_STYLES = `
  @keyframes dropIn {
    from { opacity:0; transform:translateY(-6px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  /* Light mode — scoped inside .radix-themes */
  .radix-themes {
    --f-bg: var(--gray-a2);
    --f-bg-open: var(--gray-1);
    --f-border: var(--gray-a6);
    --f-border-focus: var(--blue-8);
    --f-ring: rgba(59,130,246,.18);
    --f-text: var(--gray-12);
    --f-placeholder: var(--gray-9);
    --f-icon: var(--gray-9);
    --f-panel: var(--gray-1);
    --f-panel-border: var(--gray-a6);
    --f-panel-shadow: 0 8px 32px rgba(0,0,0,.13), 0 2px 8px rgba(0,0,0,.06);
    --f-item-hover: var(--gray-a3);
    --f-item-active: var(--blue-a3);
    --f-item-active-text: var(--blue-11);
    --f-chevron: var(--gray-9);
  }

  /* Dark mode inherits automatically via Radix variables above */
  .radix-themes.dark {
    --f-panel-shadow: 0 8px 32px rgba(0,0,0,.45), 0 2px 8px rgba(0,0,0,.30);
  }

  .f-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-radius: 12px;
    padding: 10px 16px;
    font-size: 14px;
    cursor: pointer;
    outline: none;
    transition: background .15s, border-color .15s, box-shadow .15s;
    background: var(--f-bg);
    border: 1px solid var(--f-border);
    color: var(--f-text);
    text-align: right;
  }
  .f-trigger:hover { border-color: var(--f-border-focus); }
  .f-trigger.open, .f-trigger:focus-within {
    background: var(--f-bg-open);
    border-color: var(--f-border-focus);
    box-shadow: 0 0 0 3px var(--f-ring);
  }

  .f-input {
    width: 100%;
    border-radius: 12px;
    padding: 10px 16px;
    font-size: 14px;
    outline: none;
    transition: background .15s, border-color .15s, box-shadow .15s;
    background: var(--f-bg);
    border: 1px solid var(--f-border);
    color: var(--f-text);
    text-align: right;
  }
  .f-input::placeholder { color: var(--f-placeholder); }
  .f-input:hover { border-color: var(--f-border-focus); }
  .f-input:focus {
    background: var(--f-bg-open);
    border-color: var(--f-border-focus);
    box-shadow: 0 0 0 3px var(--f-ring);
  }

  .f-panel {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    left: 0;
    z-index: 999;
    border-radius: 14px;
    overflow: hidden;
    animation: dropIn .16s cubic-bezier(.16,1,.3,1);
    background: var(--f-panel);
    border: 1px solid var(--f-panel-border);
    box-shadow: var(--f-panel-shadow);
  }

  .f-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 14px;
    text-align: right;
    cursor: pointer;
    outline: none;
    border: none;
    background: transparent;
    color: var(--f-text);
    transition: background .1s;
  }
  .f-item:hover  { background: var(--f-item-hover); }
  .f-item.active { background: var(--f-item-active); color: var(--f-item-active-text); font-weight: 600; }
`;

// Inject immediately at module load time — no flash on refresh
(function injectStyles() {
  if (typeof document === "undefined") return;
  const styleId = "user-management-filter-styles";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.innerHTML = GLOBAL_STYLES;
  document.head.appendChild(style);
})();

export function StyleInjector() {
  return null;
}

// ── Spinner ────────────────────────────────────────────────────────────────────
export function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

// ── Toast ──────────────────────────────────────────────────────────────────────
export function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium"
      style={{
        background:  type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color:       type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}>
      {message}
      <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-1"><FiX size={13} /></button>
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────────
export function StatusBadge({ active }) {
  const s = active
    ? { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)", label: "نشط" }
    : { bg: "var(--red-a3)",   fg: "var(--red-11)",   dot: "var(--red-9)",   label: "غير نشط" };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

// ── RoleBadge ──────────────────────────────────────────────────────────────────
export function RoleBadge({ user }) {
  const roleId = getRoleId(user);
  const c = ROLE_COLORS[roleId] || { bg: "rgba(100,116,139,.12)", fg: "#64748b" };
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.fg }}>
      {getRoleLabel(user)}
    </span>
  );
}

// ── FilterInput — uses f-input class ──────────────────────────────────────────
export function FilterInput({ value, onChange, placeholder, icon: Icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <Icon size={13}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            color: focused ? "var(--f-border-focus)" : "var(--f-icon)",
            transition: "color .15s",
          }} />
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

// ── CustomDropdown — uses f-trigger / f-panel / f-item classes ────────────────
export function CustomDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`f-trigger${open ? " open" : ""}`}
      >
        <span className="flex items-center gap-2">
          {selected?.dot && (
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: selected.dot }} />
          )}
          <span>{selected?.label || placeholder}</span>
        </span>
        <span style={{
          color: "var(--f-chevron)", fontSize: "12px",
          transition: "transform .15s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          display: "inline-block",
        }}>▾</span>
      </button>

      {open && (
        <div className="f-panel p-2 max-h-64 overflow-auto">
          {/* Placeholder option */}
          <button type="button"
            className={`f-item${value === "" ? " active" : ""}`}
            onClick={() => { onChange(""); setOpen(false); }}>
            {placeholder}
          </button>
          {options.map((opt) => (
            <button key={String(opt.value)} type="button"
              className={`f-item${String(value) === String(opt.value) ? " active" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.dot && (
                <span className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: opt.dot }} />
              )}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TextInput ──────────────────────────────────────────────────────────────────
export function TextInput({ label, value, onChange, placeholder, type = "text", disabled = false }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>{label}</label>
      <input
        type={type} value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="f-input"
        style={{ opacity: disabled ? 0.7 : 1, cursor: disabled ? "not-allowed" : "text" }}
      />
    </div>
  );
}

// ── InfoCard ───────────────────────────────────────────────────────────────────
export function InfoCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl p-4"
      style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a5)" }}>
      <div className="text-xs font-semibold flex items-center gap-2 mb-2" style={{ color: "var(--gray-10)" }}>
        <span>{icon}</span><span>{label}</span>
      </div>
      <div className="text-sm font-medium break-words" style={{ color: "var(--gray-12)" }}>{value}</div>
    </div>
  );
}

// ── Dialog surface ─────────────────────────────────────────────────────────────
export const dialogSurface = {
  background: "var(--gray-1)",
  border:     "1px solid var(--gray-a6)",
  boxShadow:  "0 20px 60px rgba(0,0,0,.4)",
};