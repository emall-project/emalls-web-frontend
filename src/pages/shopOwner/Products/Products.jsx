// ═══════════════════════════════════════════════════════════════════════════════
// Products.jsx — إدارة المنتجات والفئات
// ═══════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiAlertCircle, FiLoader,
  FiSearch, FiChevronDown, FiChevronLeft, FiChevronRight,
  FiCheck, FiMoreVertical, FiFolder, FiFolderPlus, FiPackage,
  FiArrowLeft, FiImage, FiLayers, FiTag,
} from "react-icons/fi";
import { productsApi } from "./api";
import { AUDIENCE_OPTIONS, AGE_GROUP_OPTIONS } from "./constants";

const FIELD_BASE_CLASS = "w-full rounded-[14px] px-3.5 py-3 text-sm border outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const FIELD_BASE_STYLE = {
  background: "var(--gray-a2)",
  borderColor: "var(--gray-a6)",
  color: "var(--gray-12)",
};

const CARD_TONES = {
  default: {
    background: "var(--gray-1)",
    borderColor: "var(--gray-a5)",
    headerBackground: "var(--gray-2)",
    headerBorder: "var(--gray-a4)",
  },
  accent: {
    background: "linear-gradient(180deg, var(--blue-a2), var(--gray-1))",
    borderColor: "var(--blue-a4)",
    headerBackground: "transparent",
    headerBorder: "var(--blue-a4)",
  },
};

// ─── Theme Container ──────────────────────────────────────────────────────────
function useThemeContainer() {
  if (typeof document === "undefined") return null;
  return document.querySelector(".radix-themes") || document.body;
}

// ─── Primitive Helpers ────────────────────────────────────────────────────────
function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}
function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-medium"
      style={{
        background: type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color: type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}>
      {type === "success" ? <FiCheck size={15} /> : <FiAlertCircle size={15} />}
      <span>{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 mr-1"><FiX size={14} /></button>
    </div>
  );
}
function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-11)" }}>
      {children}{required && <span style={{ color: "var(--red-9)" }}> *</span>}
    </label>
  );
}
function FieldHint({ children, className = "" }) {
  return (
    <p className={`text-[11px] leading-5 ${className}`.trim()} style={{ color: "var(--gray-9)" }}>
      {children}
    </p>
  );
}
function StatusBadge({ isActive }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: isActive ? "var(--green-a3)" : "var(--red-a3)", color: isActive ? "var(--green-11)" : "var(--red-11)" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? "var(--green-9)" : "var(--red-9)" }} />
      {isActive ? "نشط" : "غير نشط"}
    </span>
  );
}
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
      className="relative flex-shrink-0 rounded-full transition-colors duration-200"
      style={{ width: 44, height: 24, background: checked ? "var(--blue-9)" : "var(--gray-a6)" }}>
      <span className="absolute top-0.5 rounded-full transition-transform duration-200"
        style={{ width: 20, height: 20, background: "#fff", transform: checked ? "translateX(22px)" : "translateX(2px)", boxShadow: "0 1px 4px rgba(0,0,0,.25)" }} />
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, action, children, tone = "default", contentClassName = "" }) {
  const toneStyle = CARD_TONES[tone] || CARD_TONES.default;
  return (
    <div className="rounded-[26px] border shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
      style={{ background: toneStyle.background, borderColor: toneStyle.borderColor }}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b"
          style={{ borderColor: toneStyle.headerBorder, background: toneStyle.headerBackground }}>
          {title && (
            <div className="space-y-1">
              <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{title}</h3>
              {subtitle && <p className="text-xs leading-5" style={{ color: "var(--gray-9)" }}>{subtitle}</p>}
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`px-5 py-5 space-y-5 ${contentClassName}`.trim()}>{children}</div>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ steps, current }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 pt-5 pb-4" dir="rtl">
      {steps.map((step, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        const label = typeof step === "string" ? step : step.label;
        const description = typeof step === "string" ? "" : step.description;
        return (
          <div key={num} className="rounded-2xl border px-4 py-3 transition-all"
            style={{
              background: active ? "var(--blue-a2)" : done ? "var(--green-a2)" : "var(--gray-a2)",
              borderColor: active ? "var(--blue-a5)" : done ? "var(--green-a5)" : "var(--gray-a5)",
              boxShadow: active ? "0 10px 30px rgba(59,130,246,0.10)" : "none",
            }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background: done ? "var(--green-9)" : active ? "var(--blue-9)" : "var(--gray-a4)",
                  color: "#fff",
                }}>
                {done ? <FiCheck size={15} /> : num}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-bold" style={{ color: active ? "var(--blue-10)" : done ? "var(--green-10)" : "var(--gray-8)" }}>
                  {done ? "تمت المراجعة" : active ? "الخطوة الحالية" : "الخطوة التالية"}
                </p>
                <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{label}</p>
                {description && <p className="text-xs leading-5" style={{ color: "var(--gray-9)" }}>{description}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Inline Dropdown Select ───────────────────────────────────────────────────
function InlineSelect({ value, onChange, options, placeholder = "اختر..." }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`${FIELD_BASE_CLASS} flex items-center justify-between gap-3 pr-4 pl-3 text-right`}
        style={{
          ...FIELD_BASE_STYLE,
          color: selected ? "var(--gray-12)" : "var(--gray-9)",
          direction: "rtl",
          borderColor: open ? "var(--blue-8)" : "var(--gray-a6)",
          boxShadow: open ? "0 0 0 4px rgba(59,130,246,0.12)" : "none",
        }}>
        <span className="flex-1 truncate">{selected?.label || placeholder}</span>
        <FiChevronDown size={15}
          style={{ color: "var(--gray-9)", flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div className="absolute z-[9999] w-full mt-2 rounded-2xl shadow-2xl border overflow-hidden p-1.5"
          style={{ background: "var(--gray-2)", borderColor: "var(--gray-a6)", maxHeight: 200, overflowY: "auto" }}>
          {options.map((o, i) => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="w-full flex items-center justify-end rounded-xl px-3 py-2.5 text-sm transition"
              style={{
                background: value === o.value ? "var(--blue-a3)" : "transparent",
                color: value === o.value ? "var(--blue-11)" : "var(--gray-12)",
                borderBottom: i < options.length - 1 ? "1px solid var(--gray-a3)" : "none",
              }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SearchableSelect ─────────────────────────────────────────────────────────
function SearchableSelect({ value, onChange, options, placeholder = "ابحث أو اختر..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 rounded-[14px] px-3.5 py-2.5 border transition cursor-text"
        style={{
          ...FIELD_BASE_STYLE,
          minHeight: 48,
          borderColor: open ? "var(--blue-8)" : "var(--gray-a6)",
          boxShadow: open ? "0 0 0 4px rgba(59,130,246,0.12)" : "none",
        }}
        onClick={() => setOpen(true)}>
        {selected && !open ? (
          <>
            <span className="flex-1 text-sm text-right truncate" style={{ color: "var(--gray-12)", direction: "rtl" }}>{selected.label}</span>
            <button type="button" onClick={e => { e.stopPropagation(); onChange(""); setQuery(""); }}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:opacity-70" style={{ color: "var(--gray-9)", background: "var(--gray-a3)" }}>
              <FiX size={11} />
            </button>
          </>
        ) : (
          <input autoFocus={open}
            className="flex-1 text-sm bg-transparent outline-none text-right"
            style={{ color: "var(--gray-12)", direction: "rtl" }}
            placeholder={selected ? selected.label : placeholder}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)} />
        )}
        <FiChevronDown size={15}
          style={{ color: "var(--gray-9)", flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </div>
      {open && (
        <div className="absolute z-[9999] w-full mt-2 rounded-2xl shadow-2xl border overflow-hidden p-1.5"
          style={{ background: "var(--gray-2)", borderColor: "var(--gray-a6)", maxHeight: 200, overflowY: "auto" }}>
          {filtered.length === 0
            ? <div className="px-3 py-3 text-xs text-right" style={{ color: "var(--gray-9)" }}>لا توجد نتائج مطابقة</div>
            : filtered.map((o, i) => (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setQuery(""); setOpen(false); }}
                className="w-full flex items-center justify-end rounded-xl px-3 py-2.5 text-sm transition"
                style={{
                  background: String(value) === String(o.value) ? "var(--blue-a3)" : "transparent",
                  color: String(value) === String(o.value) ? "var(--blue-11)" : "var(--gray-12)",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--gray-a3)" : "none",
                }}>
                {o.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── TagInput ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange, readOnly = false }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const debRef = useRef(null);
  const wRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (wRef.current && !wRef.current.contains(e.target)) setShowSugg(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const fetchSugg = (val) => {
    clearTimeout(debRef.current);
    if (!val.trim()) { setSuggestions([]); return; }
    debRef.current = setTimeout(async () => {
      try { const r = await productsApi.getTags(val); setSuggestions((r?.data || []).filter(t => !tags.find(x => x.name === t.name))); }
      catch { setSuggestions([]); }
    }, 300);
  };
  const add = (name) => {
    const n = name.trim();
    if (!n || tags.find(t => t.name === n)) return;
    onChange([...tags, { name: n }]);
    setInput(""); setSuggestions([]); setShowSugg(false);
  };
  const remove = (name) => onChange(tags.filter(t => t.name !== name));
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); }
    else if (e.key === "Backspace" && !input && tags.length) remove(tags[tags.length - 1].name);
  };
  return (
    <div ref={wRef} className="relative">
      <div className="flex flex-wrap items-center gap-2 min-h-[52px] w-full rounded-[16px] px-3.5 py-3 border transition"
        style={{
          ...FIELD_BASE_STYLE,
          borderColor: showSugg ? "var(--blue-8)" : "var(--gray-a6)",
          boxShadow: showSugg ? "0 0 0 4px rgba(59,130,246,0.12)" : "none",
        }}>
        {tags.map(t => (
          <span key={t.name} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
            {t.name}
            {!readOnly && <button type="button" onClick={() => remove(t.name)} className="hover:opacity-70"><FiX size={11} /></button>}
          </span>
        ))}
        {!readOnly && (
          <input className="flex-1 min-w-[140px] text-sm bg-transparent outline-none"
            style={{ color: "var(--gray-12)", direction: "rtl", textAlign: "right" }}
            value={input}
            onChange={e => { setInput(e.target.value); fetchSugg(e.target.value); setShowSugg(true); }}
            onKeyDown={onKey}
            onFocus={() => input && setShowSugg(true)}
            placeholder="اكتب وسمًا واضغط إدخال..." />
        )}
      </div>
      {showSugg && suggestions.length > 0 && (
        <div className="absolute z-[9999] w-full mt-2 rounded-2xl border shadow-2xl overflow-hidden p-1.5"
          style={{ background: "var(--gray-2)", borderColor: "var(--gray-a6)", maxHeight: 160, overflowY: "auto" }}>
          {suggestions.map(s => (
            <button key={s.id} type="button" onClick={() => add(s.name)}
              className="w-full text-right rounded-xl px-3 py-2.5 text-sm hover:opacity-80"
              style={{ color: "var(--gray-12)", borderBottom: "1px solid var(--gray-a3)" }}>
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Attribute Form Dialog ────────────────────────────────────────────────────
function AttributeFormDialog({ open, onOpenChange, onSuccess, themeContainer }) {
  const empty = () => ({ name: "", slug: "", isActive: true, options: [{ value: "", sortOrder: 1 }] });
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setForm(empty()); setError(""); } }, [open]);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const genSlug = (n) => n.toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "");
  const setOption = (i, v) => setForm(f => { const o = [...f.options]; o[i] = { ...o[i], value: v }; return { ...f, options: o }; });
  const addOption = () => setForm(f => ({ ...f, options: [...f.options, { value: "", sortOrder: f.options.length + 1 }] }));
  const removeOption = (i) => setForm(f => ({ ...f, options: f.options.filter((_, x) => x !== i) }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("الاسم مطلوب");
    if (form.options.some(o => !o.value.trim())) return setError("جميع قيم الخيارات مطلوبة");
    setSaving(true); setError("");
    try {
      await productsApi.createAttribute({ name: form.name.trim(), slug: form.slug.trim(), type: "SELECT", isActive: form.isActive, options: form.options });
      onSuccess?.(); onOpenChange(false);
    } catch (err) { setError(err.message || "حدث خطأ"); }
    finally { setSaving(false); }
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9990]" style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-[9991] flex items-center justify-center p-4" aria-describedby={undefined}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--gray-a6)" }}>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>خاصية جديدة</Dialog.Title>
              <Dialog.Close asChild><button type="button" className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--gray-10)" }}><FiX size={17} /></button></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
              {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ background: "var(--red-a3)", color: "var(--red-11)" }}><FiAlertCircle size={14} />{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>الاسم</FieldLabel>
                  <input className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none border" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl" }}
                    value={form.name} onChange={e => { setF("name", e.target.value); setF("slug", genSlug(e.target.value)); }} placeholder="مثال: اللون" />
                </div>
                <div>
                  <FieldLabel>الرابط (Slug)</FieldLabel>
                  <input className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none border" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-10)", direction: "ltr" }}
                    value={form.slug} onChange={e => setF("slug", e.target.value)} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel required>القيم</FieldLabel>
                  <button type="button" onClick={addOption} className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--blue-9)" }}>
                    <FiPlus size={12} /> إضافة قيمة
                  </button>
                </div>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input className="flex-1 rounded-[10px] px-3 py-2 text-sm outline-none border" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl" }}
                        value={opt.value} onChange={e => setOption(i, e.target.value)} placeholder={`قيمة ${i + 1}`} />
                      {form.options.length > 1 && (
                        <button type="button" onClick={() => removeOption(i)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--red-9)" }}><FiTrash2 size={13} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--gray-a2)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--gray-11)" }}>الحالة</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--gray-10)" }}>{form.isActive ? "نشط" : "غير نشط"}</span>
                  <Toggle checked={form.isActive} onChange={v => setF("isActive", v)} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <Dialog.Close asChild><button type="button" className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>إلغاء</button></Dialog.Close>
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "var(--blue-9)", color: "#fff" }}>
                  {saving && <Spinner size={13} />} إنشاء
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Tag Form Dialog ──────────────────────────────────────────────────────────
function TagFormDialog({ open, onOpenChange, onSuccess, themeContainer }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setName(""); setError(""); } }, [open]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("الاسم مطلوب");
    setSaving(true); setError("");
    try { await productsApi.createTag({ name: name.trim() }); onSuccess?.(); onOpenChange(false); }
    catch (err) { setError(err.message || "حدث خطأ"); }
    finally { setSaving(false); }
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9990]" style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-[9991] flex items-center justify-center p-4" aria-describedby={undefined}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--gray-a6)" }}>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>وسم جديد</Dialog.Title>
              <Dialog.Close asChild><button type="button" className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--gray-10)" }}><FiX size={17} /></button></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              {error && <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "var(--red-a3)", color: "var(--red-11)" }}><FiAlertCircle size={13} />{error}</div>}
              <div>
                <FieldLabel required>اسم الوسم</FieldLabel>
                <input className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none border" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl" }}
                  value={name} onChange={e => setName(e.target.value)} placeholder="مثال: مميز" autoFocus />
              </div>
              <div className="flex justify-end gap-3">
                <Dialog.Close asChild><button type="button" className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>إلغاء</button></Dialog.Close>
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "var(--blue-9)", color: "#fff" }}>
                  {saving && <Spinner size={13} />} إنشاء
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Brand Form Dialog ────────────────────────────────────────────────────────
function BrandFormDialog({ open, onOpenChange, onSuccess, themeContainer }) {
  const empty = () => ({ name: "", slug: "", targetedAudience: "", ageGroup: "", isActive: true });
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setForm(empty()); setError(""); } }, [open]);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const genSlug = (n) => n.toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("الاسم مطلوب");
    setSaving(true); setError("");
    try {
      const res = await productsApi.createBrand({ name: form.name.trim(), slug: form.slug.trim(), targetedAudience: form.targetedAudience, ageGroup: form.ageGroup, isActive: form.isActive });
      onSuccess?.(res?.data); onOpenChange(false);
    } catch (err) { setError(err.message || "حدث خطأ"); }
    finally { setSaving(false); }
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9992]" style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-[9993] flex items-center justify-center p-4" aria-describedby={undefined}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--gray-a6)" }}>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>براند جديد</Dialog.Title>
              <Dialog.Close asChild><button type="button" className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--gray-10)" }}><FiX size={17} /></button></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              {error && <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "var(--red-a3)", color: "var(--red-11)" }}><FiAlertCircle size={13} />{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>الاسم</FieldLabel>
                  <input className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none border" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl" }}
                    value={form.name} onChange={e => { setF("name", e.target.value); setF("slug", genSlug(e.target.value)); }} placeholder="اسم البراند" />
                </div>
                <div>
                  <FieldLabel>الرابط (Slug)</FieldLabel>
                  <input className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none border" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-10)", direction: "ltr" }}
                    value={form.slug} onChange={e => setF("slug", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><FieldLabel>الجمهور</FieldLabel><InlineSelect value={form.targetedAudience} onChange={v => setF("targetedAudience", v)} options={AUDIENCE_OPTIONS} placeholder="اختر..." /></div>
                <div><FieldLabel>الفئة العمرية</FieldLabel><InlineSelect value={form.ageGroup} onChange={v => setF("ageGroup", v)} options={AGE_GROUP_OPTIONS} placeholder="اختر..." /></div>
              </div>
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--gray-a2)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--gray-11)" }}>الحالة</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--gray-10)" }}>{form.isActive ? "نشط" : "غير نشط"}</span>
                  <Toggle checked={form.isActive} onChange={v => setF("isActive", v)} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Dialog.Close asChild><button type="button" className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>إلغاء</button></Dialog.Close>
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "var(--blue-9)", color: "#fff" }}>
                  {saving && <Spinner size={13} />} إنشاء
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Category Form Dialog ─────────────────────────────────────────────────────
function CategoryFormDialog({ open, onOpenChange, onSuccess, themeContainer, parentId = null, parentName = null, editCategory = null }) {
  const empty = () => ({ name: "", slug: "", targetedAudience: "", ageGroup: "", isActive: true });
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!editCategory;
  useEffect(() => {
    if (open) {
      setError("");
      if (isEdit) setForm({ name: editCategory.name || "", slug: editCategory.slug || "", targetedAudience: editCategory.targetedAudience || "", ageGroup: editCategory.ageGroup || "", isActive: editCategory.isActive ?? true });
      else setForm(empty());
    }
  }, [open, editCategory, isEdit]);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const genSlug = (n) => n.toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("الاسم مطلوب");
    setSaving(true); setError("");
    try {
      const body = { name: form.name.trim(), slug: form.slug.trim(), targetedAudience: form.targetedAudience, ageGroup: form.ageGroup, isActive: form.isActive, ...(parentId ? { parentId } : {}) };
      let res;
      if (isEdit) res = await productsApi.updateCategory({ ...body, id: editCategory.id });
      else res = await productsApi.createCategory(body);
      onSuccess?.(res?.data); onOpenChange(false);
    } catch (err) { setError(err.message || "حدث خطأ"); }
    finally { setSaving(false); }
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9992]" style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-[9993] flex items-center justify-center p-4" aria-describedby={undefined}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--gray-a6)" }}>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                {isEdit ? "تعديل الفئة" : parentName ? `فئة فرعية في "${parentName}"` : "فئة جديدة"}
              </Dialog.Title>
              <Dialog.Close asChild><button type="button" className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--gray-10)" }}><FiX size={17} /></button></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              {error && <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "var(--red-a3)", color: "var(--red-11)" }}><FiAlertCircle size={13} />{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>الاسم</FieldLabel>
                  <input className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none border" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl" }}
                    value={form.name} onChange={e => { setF("name", e.target.value); if (!isEdit) setF("slug", genSlug(e.target.value)); }} placeholder="اسم الفئة" />
                </div>
                <div>
                  <FieldLabel>الرابط (Slug)</FieldLabel>
                  <input className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none border" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-10)", direction: "ltr" }}
                    value={form.slug} onChange={e => setF("slug", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><FieldLabel>الجمهور</FieldLabel><InlineSelect value={form.targetedAudience} onChange={v => setF("targetedAudience", v)} options={AUDIENCE_OPTIONS} placeholder="اختر..." /></div>
                <div><FieldLabel>الفئة العمرية</FieldLabel><InlineSelect value={form.ageGroup} onChange={v => setF("ageGroup", v)} options={AGE_GROUP_OPTIONS} placeholder="اختر..." /></div>
              </div>
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--gray-a2)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--gray-11)" }}>الحالة</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--gray-10)" }}>{form.isActive ? "نشط" : "غير نشط"}</span>
                  <Toggle checked={form.isActive} onChange={v => setF("isActive", v)} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Dialog.Close asChild><button type="button" className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>إلغاء</button></Dialog.Close>
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "var(--blue-9)", color: "#fff" }}>
                  {saving && <Spinner size={13} />} {isEdit ? "حفظ" : "إنشاء"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────
function DeleteDialog({ open, onOpenChange, title, message, onConfirm, loading }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={document.querySelector(".radix-themes") || document.body}>
        <Dialog.Overlay className="fixed inset-0 z-[9992]" style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-[9993] flex items-center justify-center p-4" aria-describedby={undefined}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="px-6 pt-6 pb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--red-a3)" }}>
                <FiTrash2 size={20} style={{ color: "var(--red-9)" }} />
              </div>
              <Dialog.Title className="text-base font-bold mb-1.5" style={{ color: "var(--gray-12)" }}>{title}</Dialog.Title>
              <Dialog.Description className="text-sm leading-relaxed" style={{ color: "var(--gray-10)" }}>{message}</Dialog.Description>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <Dialog.Close asChild><button className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>إلغاء</button></Dialog.Close>
              <button onClick={onConfirm} disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--red-9)", color: "#fff" }}>
                {loading ? <Spinner size={13} /> : <FiTrash2 size={13} />} حذف
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Variant Card ─────────────────────────────────────────────────────────────
function StepIntro({ eyebrow, title, description, aside }) {
  return (
    <div className="flex flex-col gap-3 rounded-[26px] border px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
      <div className="space-y-1.5">
        <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold"
          style={{ background: "var(--blue-a2)", color: "var(--blue-10)" }}>
          {eyebrow}
        </span>
        <div>
          <h3 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>{title}</h3>
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--gray-9)" }}>{description}</p>
        </div>
      </div>
      {aside && <div className="sm:pt-1">{aside}</div>}
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value, direction = "rtl" }) {
  return (
    <div className="rounded-2xl border px-3.5 py-3 space-y-2"
      style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}>
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--gray-1)", color: "var(--blue-10)" }}>
            <Icon size={15} />
          </span>
        )}
        <span className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>{label}</span>
      </div>
      <p className="text-sm font-semibold truncate"
        style={{ color: "var(--gray-12)", direction, textAlign: direction === "ltr" ? "left" : "right" }}>
        {value || "غير محدد"}
      </p>
    </div>
  );
}

function getOptionLabel(options, value, fallback = "غير محدد") {
  if (value === undefined || value === null || value === "") return fallback;
  const found = options.find(opt => String(opt.value) === String(value));
  return found?.label || fallback;
}

function getMediaPreviewUrl(media = []) {
  const first = Array.isArray(media) ? media.find(Boolean) : null;
  if (!first) return "";
  if (typeof first === "string") return /^https?:\/\//i.test(first) ? first : "";
  return first.mediumFileUrl || first.smallFileUrl || first.originalFileUrl || first.url || first.imageUrl || "";
}

function VariantCard({ variant, index, isDefault, onChange, onRemove, onSetDefault, canRemove, attrOptions = [], productAttrIds = [] }) {
  const activeAttrs = attrOptions.filter(a => productAttrIds.includes(String(a.id)));

  const setOptionForAttr = (attributeId, optionId) => {
    const updated = variant.attributes ? [...variant.attributes] : [];
    const idx = updated.findIndex(a => String(a.attributeId) === String(attributeId));
    if (idx >= 0) updated[idx] = { ...updated[idx], optionId };
    else updated.push({ attributeId: String(attributeId), optionId });
    onChange(index, "attributes", updated);
  };

  const getOptionForAttr = (attributeId) => {
    const found = (variant.attributes || []).find(a => String(a.attributeId) === String(attributeId));
    return found?.optionId || "";
  };

  const selectedAttributes = activeAttrs
    .map(attr => {
      const optionId = getOptionForAttr(attr.id);
      if (!optionId) return null;
      const label = (attr.options || []).find(option => String(option.id) === String(optionId))?.value;
      return label ? `${attr.name}: ${label}` : null;
    })
    .filter(Boolean);

  return (
    <div className="rounded-[24px] border overflow-hidden transition-all shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
      style={{
        borderColor: isDefault ? "var(--blue-a5)" : "var(--gray-a5)",
        background: isDefault ? "linear-gradient(180deg, var(--blue-a2), var(--gray-1))" : "var(--gray-1)",
      }}>
      <div className="flex flex-col gap-3 border-b px-4 py-4 lg:flex-row lg:items-start lg:justify-between"
        style={{ borderColor: isDefault ? "var(--blue-a4)" : "var(--gray-a4)" }}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: isDefault ? "var(--blue-9)" : "var(--gray-a3)", color: isDefault ? "#fff" : "var(--gray-11)" }}>
            <FiLayers size={18} />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>متغير {index + 1}</span>
              {isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                  <FiCheck size={11} />
                  المتغير الافتراضي
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                {variant.basePrice ? `${Number(variant.basePrice).toLocaleString("ar-SA")} ₪` : "أدخل السعر الأساسي"}
              </span>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: selectedAttributes.length ? "var(--green-a3)" : "var(--gray-a3)", color: selectedAttributes.length ? "var(--green-11)" : "var(--gray-10)" }}>
                {activeAttrs.length ? `${selectedAttributes.length}/${activeAttrs.length} خصائص مكتملة` : "بدون خصائص إضافية"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onSetDefault(index)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
            style={{
              background: isDefault ? "var(--blue-9)" : "var(--gray-a3)",
              color: isDefault ? "#fff" : "var(--gray-11)",
            }}>
            {isDefault ? <FiCheck size={12} /> : null}
            {isDefault ? "الافتراضي" : "تعيين كافتراضي"}
          </button>
          {canRemove && (
            <button type="button" onClick={() => onRemove(index)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
              style={{ background: "var(--red-a2)", color: "var(--red-10)" }}>
              <FiTrash2 size={12} />
              حذف
            </button>
          )}
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_200px]">
          <div>
            <FieldLabel required>اسم المتغير</FieldLabel>
            <input className={`${FIELD_BASE_CLASS} text-right`}
              style={{ ...FIELD_BASE_STYLE, direction: "rtl" }}
              value={variant.name}
              onChange={e => onChange(index, "name", e.target.value)}
              placeholder="مثال: أحمر - L" />
            <FieldHint className="mt-1.5">اسم قصير وواضح يساعدك على تمييز هذا المتغير بسرعة.</FieldHint>
          </div>
          <div>
            <FieldLabel required>السعر الأساسي</FieldLabel>
            <div className="relative">
              <input className={`${FIELD_BASE_CLASS} pl-10 text-left`}
                style={{ ...FIELD_BASE_STYLE, direction: "ltr", textAlign: "left" }}
                type="text" inputMode="decimal" value={variant.basePrice}
                onChange={e => onChange(index, "basePrice", e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: "var(--gray-8)" }}>₪</span>
            </div>
            <FieldHint className="mt-1.5">أدخل السعر الذي سيظهر لهذا المتغير.</FieldHint>
          </div>
        </div>
        {activeAttrs.length > 0 && (
          <div className="rounded-2xl border px-4 py-4 space-y-3"
            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>خصائص هذا المتغير</p>
                <p className="text-xs mt-1" style={{ color: "var(--gray-9)" }}>اختر القيم المناسبة حتى تبقى تركيبة المتغيرات واضحة أثناء المراجعة.</p>
              </div>
              <span className="rounded-full px-3 py-1 text-[11px] font-semibold w-fit"
                style={{ background: "var(--gray-1)", color: "var(--gray-10)" }}>
                {selectedAttributes.length}/{activeAttrs.length} مكتملة
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {activeAttrs.map(attr => (
                <div key={attr.id}>
                  <FieldLabel>{attr.name}</FieldLabel>
                  <InlineSelect
                    value={getOptionForAttr(attr.id)}
                    onChange={optId => setOptionForAttr(attr.id, optId)}
                    options={(attr.options || []).map(o => ({ value: String(o.id), label: o.value }))}
                    placeholder="اختر قيمة..." />
                </div>
              ))}
            </div>
            {selectedAttributes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedAttributes.map(label => (
                  <span key={label} className="rounded-full px-3 py-1 text-[11px] font-semibold"
                    style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT FORM DIALOG — 2-step wizard
// ═══════════════════════════════════════════════════════════════════════════════
const FORM_STEPS = [
  { label: "معلومات المنتج", description: "الاسم والتصنيف والوصف والوسوم" },
  { label: "المتغيرات والخصائص", description: "تنظيم المتغيرات وتحديد الافتراضي" },
];

function ProductFormDialog({ open, onOpenChange, product, onSuccess }) {
  const themeContainer = useThemeContainer();
  const isEdit = !!product;

  const createVariant = useCallback((isDefault = false) => ({
    _key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    basePrice: "",
    isDefault,
    attributes: [],
    media: [],
  }), []);

  const emptyForm = useCallback(() => ({
    name: "", slug: "", isActive: true,
    targetedAudience: "", ageGroup: "",
    categoryId: "", brandId: "",
    shortDescription: "", description: "",
    tags: [],
    variants: [createVariant(true)],
  }), [createVariant]);

  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attrOptions, setAttrOptions] = useState([]);
  const [productAttrIds, setProductAttrIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [attrDialog, setAttrDialog] = useState(false);
  const [tagDialog, setTagDialog] = useState(false);
  const [brandDialog, setBrandDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1); setError("");
    productsApi.getCategories().then(r => setCategories((r?.data || []).map(c => ({ value: String(c.id), label: c.name })))).catch(() => {});
    productsApi.getBrands().then(r => setBrands((r?.data || []).map(b => ({ value: String(b.id), label: b.name })))).catch(() => {});
    productsApi.getAttributes().then(r => setAttrOptions(r?.data || [])).catch(() => {});
    if (isEdit) {
      const p = product;
      const sourceVariants = p.variants?.length
        ? p.variants
        : [{ name: "", basePrice: "", isDefault: true, attributes: [], media: [] }];
      setProductAttrIds([...new Set(sourceVariants.flatMap(v => (v.attributes || []).map(a => String(a.attributeId))))]);
      setForm({
        name: p.name || "", slug: p.slug || "", isActive: p.isActive ?? true,
        targetedAudience: p.targetedAudience || "", ageGroup: p.ageGroup || "",
        categoryId: String(p.categoryId || ""), brandId: String(p.brandId || ""),
        shortDescription: p.shortDescription || "", description: p.description || "",
        tags: p.tags || [],
        variants: sourceVariants.map((v, variantIndex) => ({
          _key: v.id ? `existing-${v.id}` : `existing-${variantIndex}`, id: v.id,
          name: v.name || "", basePrice: v.basePrice || "",
          isDefault: v.isDefault ?? variantIndex === 0,
          attributes: (v.attributes || []).map(a => ({ attributeId: String(a.attributeId), optionId: String(a.optionId) })),
          media: v.media || [],
        })),
      });
    } else {
      setProductAttrIds([]);
      setForm(emptyForm());
    }
  }, [open, product, isEdit, emptyForm]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleNameChange = (v) => {
    set("name", v);
    if (!isEdit) set("slug", v.toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, ""));
  };
  const toggleAttrId = (id) => {
    const s = String(id);
    setProductAttrIds(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };
  const handleVariantChange = (idx, field, value) => {
    setForm(f => { const v = [...f.variants]; v[idx] = { ...v[idx], [field]: value }; return { ...f, variants: v }; });
  };
  const handleVariantDefault = (idx) => {
    setForm(f => ({ ...f, variants: f.variants.map((v, i) => ({ ...v, isDefault: i === idx })) }));
  };
  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, createVariant(false)] }));
  const removeVariant = (idx) => {
    setForm(f => {
      const updated = f.variants.filter((_, i) => i !== idx);
      if (!updated.some(v => v.isDefault) && updated.length) updated[0].isDefault = true;
      return { ...f, variants: updated };
    });
  };

  const primaryVariant = form.variants.find(v => v.isDefault) || form.variants[0];
  const previewUrl = getMediaPreviewUrl(primaryVariant?.media);
  const selectedAttributes = attrOptions.filter(a => productAttrIds.includes(String(a.id)));
  const categoryLabel = getOptionLabel(categories, form.categoryId);
  const brandLabel = getOptionLabel(brands, form.brandId);
  const audienceLabel = getOptionLabel(AUDIENCE_OPTIONS, form.targetedAudience);
  const ageGroupLabel = getOptionLabel(AGE_GROUP_OPTIONS, form.ageGroup);
  const completedBasics = [form.name.trim(), form.categoryId, form.brandId, form.shortDescription.trim()].filter(Boolean).length;
  const readyVariants = form.variants.filter(v => v.name.trim() && v.basePrice !== "").length;

  const validateStep1 = () => {
    if (!form.name.trim()) { setError("اسم المنتج مطلوب"); return false; }
    setError(""); return true;
  };

  const handleSubmit = async () => {
    if (form.variants.length === 0) { setError("أضف متغيراً واحداً على الأقل"); return; }
    if (form.variants.some(v => !v.name.trim())) { setError("جميع أسماء المتغيرات مطلوبة"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        ...(isEdit && { id: product.id }),
        name: form.name.trim(), slug: form.slug.trim(), isActive: form.isActive,
        targetedAudience: form.targetedAudience, ageGroup: form.ageGroup,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        brandId: form.brandId ? Number(form.brandId) : undefined,
        shortDescription: form.shortDescription.trim(), description: form.description.trim(),
        tags: form.tags,
        variants: form.variants.map(v => ({
          ...(v.id && { id: v.id }),
          name: v.name, basePrice: Number(v.basePrice) || 0,
          isDefault: v.isDefault,
          attributes: (v.attributes || [])
            .filter(a => productAttrIds.includes(String(a.attributeId)) && a.optionId)
            .map(a => ({ attributeId: Number(a.attributeId), optionId: Number(a.optionId) })),
          media: v.media || [],
        })),
      };
      if (isEdit) await productsApi.update(payload);
      else await productsApi.create(payload);
      onSuccess?.(); onOpenChange(false);
    } catch (err) { setError(err.message || "حدث خطأ"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal container={themeContainer}>
          <Dialog.Overlay className="fixed inset-0 z-[9980]" style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(3px)" }} />
          <Dialog.Content dir="rtl" className="fixed inset-0 z-[9981] flex items-center justify-center p-3 sm:p-5" aria-describedby={undefined}>
            <div className="w-full max-w-6xl rounded-[30px] shadow-2xl flex flex-col overflow-hidden"
              style={{ background: "var(--gray-2)", border: "1px solid var(--gray-a6)", maxHeight: "94vh" }}>

              {/* Header */}
              <div className="flex items-center justify-between gap-4 px-6 py-5 shrink-0"
                style={{ background: "var(--gray-1)", borderBottom: "1px solid var(--gray-a5)" }}>
                <div className="min-w-0">
                  <Dialog.Title className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>
                    {isEdit ? "تعديل المنتج" : "منتج جديد"}
                  </Dialog.Title>
                  <p className="text-sm mt-1" style={{ color: "var(--gray-9)" }}>
                    {step === 1 ? "رتّب المعلومات الأساسية بشكل واضح قبل الانتقال للمتغيرات." : "راجع المتغير الافتراضي والخصائص قبل الحفظ النهائي."}
                  </p>
                </div>
                <Dialog.Close asChild>
                  <button type="button" className="w-10 h-10 rounded-2xl flex items-center justify-center transition hover:opacity-80"
                    style={{ color: "var(--gray-10)", background: "var(--gray-a2)" }}>
                    <FiX size={18} />
                  </button>
                </Dialog.Close>
              </div>

              {/* Stepper */}
              <div className="shrink-0" style={{ background: "var(--gray-1)", borderBottom: "1px solid var(--gray-a5)" }}>
                <Stepper steps={FORM_STEPS} current={step} />
              </div>

              {/* Error */}
              {error && (
                <div className="mx-6 mt-5 shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
                  style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a5)" }}>
                  <FiAlertCircle size={14} /><span>{error}</span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

                {/* ── Step 1: Basic Info ── */}
                {step === 1 && (
                  <>
                    <StepIntro
                      eyebrow="الخطوة 1"
                      title="ابنِ هوية المنتج الأساسية"
                      description="رتّب الاسم والوصف والتصنيف بشكل مريح حتى تصبح تعبئة البيانات أسرع وأسهل أثناء المراجعة."
                      aside={
                        <span className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold"
                          style={{
                            background: form.name.trim() ? "var(--green-a3)" : "var(--gray-a3)",
                            color: form.name.trim() ? "var(--green-11)" : "var(--gray-10)",
                          }}>
                          {form.name.trim() ? "المنتج جاهز للخطوة التالية" : "ابدأ باسم المنتج"}
                        </span>
                      }
                    />

                    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                      <div className="order-2 xl:order-1 self-start xl:sticky xl:top-0">
                        <SectionCard title="ملخص سريع" subtitle="مرجع بصري سريع أثناء كتابة البيانات" tone="accent">
                          <div className="rounded-[28px] overflow-hidden border"
                            style={{ borderColor: previewUrl ? "var(--blue-a4)" : "var(--gray-a4)", background: "var(--gray-1)" }}>
                            {previewUrl ? (
                              <div className="aspect-[4/3]" style={{ background: "var(--gray-a2)" }}>
                                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="min-h-[220px] flex flex-col items-center justify-center gap-3 px-5 text-center"
                                style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(255,255,255,0.85))" }}>
                                <span className="w-16 h-16 rounded-[22px] flex items-center justify-center"
                                  style={{ background: "var(--gray-1)", color: "var(--blue-10)" }}>
                                  <FiImage size={26} />
                                </span>
                                <div className="space-y-1">
                                  <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>معاينة المنتج</p>
                                  <p className="text-xs leading-6" style={{ color: "var(--gray-9)" }}>
                                    ستظهر الصورة هنا عندما يحتوي المتغير الافتراضي على وسائط جاهزة في البيانات الحالية.
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                                  style={{ background: "var(--blue-a3)", color: "var(--blue-10)" }}>
                                  <FiPackage size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold truncate" style={{ color: "var(--gray-12)" }}>
                                    {form.name || "اسم المنتج سيظهر هنا"}
                                  </p>
                                  <p className="text-xs leading-5 mt-1" style={{ color: "var(--gray-9)" }}>
                                    {form.shortDescription || "أضف وصفاً مختصراً ليظهر هنا كملخص سريع أثناء التحرير."}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <StatusBadge isActive={form.isActive} />
                                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                  style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                                  <FiLayers size={11} />
                                  {form.variants.length} متغير
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                  style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                                  <FiTag size={11} />
                                  {form.tags.length ? `${form.tags.length} وسم` : "بدون وسوم"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <SummaryStat icon={FiFolder} label="الفئة" value={categoryLabel} />
                            <SummaryStat icon={FiTag} label="البراند" value={brandLabel} />
                            <SummaryStat icon={FiLayers} label="المتغير الافتراضي" value={primaryVariant?.name || "لم يحدد بعد"} />
                            <SummaryStat
                              icon={FiPackage}
                              label="السعر الافتراضي"
                              value={primaryVariant?.basePrice ? `${Number(primaryVariant.basePrice).toLocaleString("ar-SA")} ₪` : "غير محدد"}
                              direction="ltr" />
                          </div>

                          <SummaryStat icon={FiImage} label="الرابط" value={form.slug || "سيُولّد تلقائياً"} direction="ltr" />

                          <div className="rounded-2xl border px-4 py-4 space-y-3"
                            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>جاهزية المعلومات</p>
                                <p className="text-sm font-bold mt-1" style={{ color: "var(--gray-12)" }}>
                                  {completedBasics}/4 عناصر أساسية مكتملة
                                </p>
                              </div>
                              <span className="rounded-full px-3 py-1 text-[11px] font-semibold"
                                style={{ background: "var(--gray-1)", color: "var(--gray-10)" }}>
                                الخطوة الأولى
                              </span>
                            </div>
                            <FieldHint>كلما كان الاسم والتصنيف والوصف المختصر أوضح، أصبحت إدارة القائمة أسهل لاحقاً.</FieldHint>
                          </div>
                        </SectionCard>
                      </div>

                      <div className="order-1 xl:order-2 space-y-4">
                        <SectionCard title="الهوية الأساسية" subtitle="اسم المنتج، الرابط، وحالة ظهوره" tone="accent">
                          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
                            <div>
                              <FieldLabel required>اسم المنتج</FieldLabel>
                              <input className={`${FIELD_BASE_CLASS} text-right`}
                                style={{ ...FIELD_BASE_STYLE, direction: "rtl" }}
                                value={form.name} onChange={e => handleNameChange(e.target.value)}
                                placeholder="مثال: حذاء رياضي كلاسيكي" autoFocus />
                              <FieldHint className="mt-1.5">استخدم اسماً واضحاً يسهّل العثور على المنتج داخل لوحة التحكم.</FieldHint>
                            </div>
                            <div>
                              <FieldLabel>الرابط (Slug)</FieldLabel>
                              <input className={`${FIELD_BASE_CLASS} text-left`}
                                style={{ ...FIELD_BASE_STYLE, direction: "ltr", textAlign: "left", color: "var(--gray-10)" }}
                                value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="product-slug" />
                              <FieldHint className="mt-1.5">يتم توليده تلقائياً ويمكن تعديله عند الحاجة.</FieldHint>
                            </div>
                          </div>

                          <div className="rounded-[22px] border px-4 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}>
                            <div>
                              <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>حالة المنتج</p>
                              <p className="text-xs mt-1 leading-5" style={{ color: "var(--gray-9)" }}>
                                {form.isActive ? "سيبقى المنتج ظاهراً للعملاء ضمن القوائم النشطة." : "سيبقى المنتج مخفياً حتى تقرر تفعيله لاحقاً."}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge isActive={form.isActive} />
                              <Toggle checked={form.isActive} onChange={v => set("isActive", v)} />
                            </div>
                          </div>
                        </SectionCard>

                        <SectionCard title="التصنيف والاستهداف" subtitle="رتّب المنتج داخل الفئة المناسبة وحدد جمهوره">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                              <div className="flex items-center justify-between gap-3 mb-1.5">
                                <FieldLabel>الفئة</FieldLabel>
                                <button type="button" onClick={() => setCategoryDialog(true)}
                                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                                  style={{ background: "var(--blue-a2)", color: "var(--blue-10)" }}>
                                  <FiPlus size={11} />
                                  فئة جديدة
                                </button>
                              </div>
                              <SearchableSelect value={form.categoryId} onChange={v => set("categoryId", v)} options={categories} placeholder="اختر فئة..." />
                            </div>
                            <div>
                              <div className="flex items-center justify-between gap-3 mb-1.5">
                                <FieldLabel>البراند</FieldLabel>
                                <button type="button" onClick={() => setBrandDialog(true)}
                                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                                  style={{ background: "var(--blue-a2)", color: "var(--blue-10)" }}>
                                  <FiPlus size={11} />
                                  براند جديد
                                </button>
                              </div>
                              <SearchableSelect value={form.brandId} onChange={v => set("brandId", v)} options={brands} placeholder="اختر براند..." />
                            </div>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                              <FieldLabel>الجمهور المستهدف</FieldLabel>
                              <InlineSelect value={form.targetedAudience} onChange={v => set("targetedAudience", v)} options={AUDIENCE_OPTIONS} placeholder="اختر..." />
                            </div>
                            <div>
                              <FieldLabel>الفئة العمرية</FieldLabel>
                              <InlineSelect value={form.ageGroup} onChange={v => set("ageGroup", v)} options={AGE_GROUP_OPTIONS} placeholder="اختر..." />
                            </div>
                          </div>
                        </SectionCard>

                        <SectionCard title="الوصف" subtitle="وصف مختصر للعرض ووصف كامل للتفاصيل">
                          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                            <div>
                              <div className="flex items-center justify-between gap-3 mb-1.5">
                                <FieldLabel>وصف مختصر</FieldLabel>
                                <span className="text-[11px] font-semibold" style={{ color: "var(--gray-8)" }}>{form.shortDescription.length}/200</span>
                              </div>
                              <textarea className={`${FIELD_BASE_CLASS} resize-none text-right`}
                                style={{ ...FIELD_BASE_STYLE, direction: "rtl", minHeight: 124 }}
                                rows={4} maxLength={200} value={form.shortDescription}
                                onChange={e => set("shortDescription", e.target.value)}
                                placeholder="وصف موجز يظهر في قائمة المنتجات ويعطي انطباعاً سريعاً." />
                              <FieldHint className="mt-1.5">يفضل أن يكون مختصراً ومباشراً ليسهل قراءته في القوائم.</FieldHint>
                            </div>
                            <div>
                              <FieldLabel>الوصف الكامل</FieldLabel>
                              <textarea className={`${FIELD_BASE_CLASS} resize-none text-right`}
                                style={{ ...FIELD_BASE_STYLE, direction: "rtl", minHeight: 220 }}
                                rows={8} value={form.description}
                                onChange={e => set("description", e.target.value)}
                                placeholder="أضف التفاصيل المهمة مثل المواد أو الاستخدام أو المزايا." />
                              <FieldHint className="mt-1.5">رتّب الأفكار في جمل قصيرة حتى يبقى الوصف أسهل في المسح والمراجعة.</FieldHint>
                            </div>
                          </div>
                        </SectionCard>

                        <SectionCard title="الوسوم" subtitle="وسوم تساعد على تنظيم المنتجات والبحث عنها"
                          action={
                            <button type="button" onClick={() => setTagDialog(true)}
                              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                              style={{ background: "var(--blue-a2)", color: "var(--blue-10)" }}>
                              <FiPlus size={11} />
                              وسم جديد
                            </button>
                          }>
                          <TagInput tags={form.tags} onChange={v => set("tags", v)} />
                          <FieldHint>اضغط إدخال أو فاصلة لإضافة الوسوم، وستظهر هنا كبطاقات واضحة يسهل تعديلها.</FieldHint>
                        </SectionCard>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Step 2: Variants ── */}
                {step === 2 && (
                  <>
                    <StepIntro
                      eyebrow="الخطوة 2"
                      title="نظّم المتغيرات والخصائص"
                      description="اختر الخصائص التي تفرق بين المتغيرات ثم راجع الأسعار والمتغير الافتراضي بشكل أوضح وأسهل."
                      aside={
                        <span className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold"
                          style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                          {form.variants.length} متغير
                        </span>
                      }
                    />

                    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                      <div className="order-2 xl:order-1 space-y-4">
                        <SectionCard title="خصائص المنتج" subtitle="اختر الخصائص التي تميّز المتغيرات"
                          action={
                            <button type="button" onClick={() => setAttrDialog(true)}
                              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                              style={{ background: "var(--blue-a2)", color: "var(--blue-10)" }}>
                              <FiPlus size={11} />
                              خاصية جديدة
                            </button>
                          }>
                          {attrOptions.length === 0 ? (
                            <div className="rounded-2xl border px-4 py-6 text-center space-y-2"
                              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}>
                              <p className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>لا توجد خصائص متاحة حالياً</p>
                              <FieldHint>أنشئ خاصية جديدة مثل اللون أو المقاس لتصبح إدارة المتغيرات أوضح.</FieldHint>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <FieldHint>اختر فقط الخصائص التي تحتاجها لهذا المنتج لتبقى المتغيرات مرتبة.</FieldHint>
                                <span className="rounded-full px-3 py-1 text-[11px] font-semibold"
                                  style={{ background: "var(--gray-a2)", color: "var(--gray-10)" }}>
                                  {selectedAttributes.length} محددة
                                </span>
                              </div>
                              <div className="space-y-2.5">
                                {attrOptions.map(a => {
                                  const active = productAttrIds.includes(String(a.id));
                                  return (
                                    <button key={a.id} type="button" onClick={() => toggleAttrId(a.id)}
                                      className="w-full text-right rounded-2xl border px-4 py-3.5 transition"
                                      style={{
                                        background: active ? "var(--blue-a2)" : "var(--gray-a2)",
                                        borderColor: active ? "var(--blue-a5)" : "var(--gray-a4)",
                                        boxShadow: active ? "0 10px 30px rgba(59,130,246,0.08)" : "none",
                                      }}>
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-semibold" style={{ color: active ? "var(--blue-11)" : "var(--gray-12)" }}>
                                            {a.name}
                                          </p>
                                          <p className="text-xs mt-1" style={{ color: active ? "var(--blue-10)" : "var(--gray-9)" }}>
                                            {(a.options || []).length} قيم متاحة
                                          </p>
                                        </div>
                                        <span className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0"
                                          style={{
                                            borderColor: active ? "var(--blue-9)" : "var(--gray-a6)",
                                            background: active ? "var(--blue-9)" : "transparent",
                                            color: "#fff",
                                          }}>
                                          {active && <FiCheck size={12} />}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </SectionCard>

                        <SectionCard title="ملخص المتغيرات" subtitle="مرجع سريع قبل الحفظ">
                          <div className="grid grid-cols-2 gap-3">
                            <SummaryStat icon={FiLayers} label="المتغيرات الجاهزة" value={`${readyVariants}/${form.variants.length}`} direction="ltr" />
                            <SummaryStat icon={FiFolder} label="الخصائص النشطة" value={`${selectedAttributes.length}`} direction="ltr" />
                            <SummaryStat icon={FiPackage} label="المتغير الافتراضي" value={primaryVariant?.name || "غير محدد"} />
                            <SummaryStat icon={FiTag} label="الاستهداف" value={ageGroupLabel === "غير محدد" ? audienceLabel : `${audienceLabel} · ${ageGroupLabel}`} />
                          </div>
                          <FieldHint>احرص على تحديد متغير افتراضي واحد على الأقل لتبقى قراءة الأسعار والحالة أوضح داخل القائمة.</FieldHint>
                        </SectionCard>
                      </div>

                      <div className="order-1 xl:order-2 space-y-4">
                        <SectionCard title={`المتغيرات (${form.variants.length})`} subtitle="أدخل الاسم والسعر لكل متغير ونظّم القيم المرتبطة به"
                          action={
                            <button type="button" onClick={addVariant}
                              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                              style={{ background: "var(--green-a2)", color: "var(--green-10)" }}>
                              <FiPlus size={11} />
                              إضافة متغير
                            </button>
                          }>
                          {selectedAttributes.length > 0 ? (
                            <div className="rounded-2xl border px-4 py-3 flex flex-wrap gap-2"
                              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}>
                              {selectedAttributes.map(attribute => (
                                <span key={attribute.id} className="rounded-full px-3 py-1 text-[11px] font-semibold"
                                  style={{ background: "var(--gray-1)", color: "var(--gray-11)" }}>
                                  {attribute.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-2xl border px-4 py-3"
                              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}>
                              <FieldHint>يمكنك إنشاء المتغيرات باسم وسعر فقط إذا لم تكن بحاجة إلى خصائص مثل اللون أو المقاس.</FieldHint>
                            </div>
                          )}

                          <div className="space-y-4">
                            {form.variants.map((v, i) => (
                              <VariantCard key={v._key} variant={v} index={i}
                                isDefault={v.isDefault}
                                onChange={handleVariantChange}
                                onRemove={removeVariant}
                                onSetDefault={handleVariantDefault}
                                canRemove={form.variants.length > 1}
                                attrOptions={attrOptions}
                                productAttrIds={productAttrIds} />
                            ))}
                          </div>
                        </SectionCard>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-3 px-6 py-5 shrink-0 sm:flex-row sm:items-center sm:justify-between"
                style={{ background: "var(--gray-1)", borderTop: "1px solid var(--gray-a5)" }}>
                <div className="space-y-1">
                  <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>الخطوة {step} من {FORM_STEPS.length}</p>
                  <p className="text-sm" style={{ color: "var(--gray-10)" }}>
                    {step === 1 ? "تحقق من الاسم والتصنيف ثم انتقل لتنظيم المتغيرات." : "راجع المتغير الافتراضي ثم احفظ المنتج."}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  {step === 1 ? (
                    <Dialog.Close asChild>
                      <button type="button" className="px-5 py-2.5 rounded-2xl text-sm border font-medium"
                        style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>إلغاء</button>
                    </Dialog.Close>
                  ) : (
                    <button type="button" onClick={() => { setError(""); setStep(1); }}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm border font-medium"
                      style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>
                      <FiArrowLeft size={15} /> السابق
                    </button>
                  )}
                  {step === 1 ? (
                    <button type="button" onClick={() => { if (validateStep1()) setStep(2); }}
                      className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl text-sm font-bold"
                      style={{ background: "var(--blue-9)", color: "#fff" }}>
                      التالي <FiChevronLeft size={15} />
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmit} disabled={saving}
                      className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl text-sm font-bold disabled:opacity-50"
                      style={{ background: "var(--blue-9)", color: "#fff" }}>
                      {saving && <Spinner size={14} />}
                      {isEdit ? "حفظ التعديلات" : "إنشاء المنتج"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Sub-dialogs rendered outside main dialog to avoid z-index conflicts */}
      <AttributeFormDialog open={attrDialog} onOpenChange={setAttrDialog} themeContainer={themeContainer}
        onSuccess={() => productsApi.getAttributes().then(r => setAttrOptions(r?.data || [])).catch(() => {})} />
      <TagFormDialog open={tagDialog} onOpenChange={setTagDialog} themeContainer={themeContainer} onSuccess={() => {}} />
      <BrandFormDialog open={brandDialog} onOpenChange={setBrandDialog} themeContainer={themeContainer}
        onSuccess={b => { if (b) { setBrands(p => [...p, { value: String(b.id), label: b.name }]); set("brandId", String(b.id)); } }} />
      <CategoryFormDialog open={categoryDialog} onOpenChange={setCategoryDialog} themeContainer={themeContainer}
        onSuccess={c => { if (c) { setCategories(p => [...p, { value: String(c.id), label: c.name }]); set("categoryId", String(c.id)); } }} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY MANAGEMENT — Tree View
// ═══════════════════════════════════════════════════════════════════════════════

function buildTree(flat) {
  const map = {};
  flat.forEach(c => { map[c.id] = { ...c, children: [] }; });
  const roots = [];
  flat.forEach(c => {
    if (c.parentId && map[c.parentId]) map[c.parentId].children.push(map[c.id]);
    else roots.push(map[c.id]);
  });
  return roots;
}

function filterTree(nodes, query) {
  if (!query.trim()) return nodes;
  const normalized = query.trim().toLowerCase();

  return nodes.reduce((acc, node) => {
    const children = filterTree(node.children || [], query);
    const matchesNode = `${node.name} ${node.slug || ""}`.toLowerCase().includes(normalized);
    if (matchesNode || children.length) acc.push({ ...node, children });
    return acc;
  }, []);
}

function getCategoryPath(categoryId, categoriesMap) {
  const path = [];
  let current = categoriesMap.get(categoryId);
  while (current) {
    path.unshift(current.name);
    current = current.parentId ? categoriesMap.get(current.parentId) : null;
  }
  return path;
}

function CategoryNode({ node, depth = 0, selectedId, onSelect, onEdit, onDelete, onAddChild }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;
  const selected = selectedId === node.id;

  return (
    <div>
      <div className="relative">
        <div className="absolute inset-y-2 rounded-2xl"
          style={{
            right: depth * 20,
            width: 2,
            background: depth > 0 ? "var(--gray-a4)" : "transparent",
            opacity: 0.7,
          }} />
        <div
          className="group flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all cursor-pointer"
          style={{
            marginRight: depth * 20,
            background: selected ? "var(--blue-a2)" : "var(--gray-1)",
            borderColor: selected ? "var(--blue-a5)" : "transparent",
            boxShadow: selected ? "0 12px 30px rgba(59,130,246,0.08)" : "none",
          }}
          onClick={() => onSelect(node)}>
          <button type="button" onClick={(e) => { e.stopPropagation(); if (hasChildren) setExpanded(value => !value); }}
            className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              color: hasChildren ? "var(--gray-10)" : "transparent",
              background: hasChildren ? "var(--gray-a3)" : "transparent",
              cursor: hasChildren ? "pointer" : "default",
            }}>
            {hasChildren ? (expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />) : null}
          </button>

          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: selected ? "var(--blue-9)" : depth === 0 ? "var(--blue-a3)" : "var(--gray-a3)", color: selected ? "#fff" : depth === 0 ? "var(--blue-10)" : "var(--gray-10)" }}>
            <FiFolder size={17} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold truncate" style={{ color: "var(--gray-12)" }}>{node.name}</span>
              {selected && (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                  محددة الآن
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs" style={{ color: "var(--gray-8)" }}>{node.slug}</span>
              {hasChildren && (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: "var(--gray-a3)", color: "var(--gray-10)" }}>
                  {node.children.length} فرع
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <StatusBadge isActive={node.isActive} />
            <button type="button" onClick={(e) => { e.stopPropagation(); onAddChild(node); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              title="إضافة فئة فرعية"
              style={{ color: "var(--green-10)", background: "var(--green-a2)" }}>
              <FiFolderPlus size={13} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(node); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              title="تعديل"
              style={{ color: "var(--blue-10)", background: "var(--blue-a2)" }}>
              <FiEdit2 size={13} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(node); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              title="حذف"
              style={{ color: "var(--red-10)", background: "var(--red-a2)" }}>
              <FiTrash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-1 mr-4 space-y-1 border-r pr-2" style={{ borderColor: "var(--gray-a4)" }}>
          {node.children.map(child => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryManagement() {
  const themeContainer = useThemeContainer();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [catDialog, setCatDialog] = useState(false);
  const [parentNode, setParentNode] = useState(null);
  const [editNode, setEditNode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true); setError("");
    try { const r = await productsApi.getCategories(); setCategories(r?.data || []); }
    catch (e) { setError(e.message || "فشل جلب الفئات"); }
    finally { setLoading(false); }
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach(category => map.set(category.id, category));
    return map;
  }, [categories]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => {
    if (selectedId && !categoryMap.has(selectedId)) setSelectedId(null);
  }, [selectedId, categoryMap]);

  const tree = useMemo(() => filterTree(buildTree(categories), search), [categories, search]);
  const selectedNode = selectedId ? categoryMap.get(selectedId) : null;
  const selectedPath = selectedNode ? getCategoryPath(selectedNode.id, categoryMap) : [];

  const handleAddChild = (node) => { setSelectedId(node.id); setParentNode(node); setEditNode(null); setCatDialog(true); };
  const handleEdit = (node) => { setSelectedId(node.id); setParentNode(null); setEditNode(node); setCatDialog(true); };
  const handleDelete = (node) => { setSelectedId(node.id); setDeleteTarget(node); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try { await productsApi.deleteCategory(deleteTarget.id); setToast({ message: "تم حذف الفئة", type: "success" }); fetchCategories(); setDeleteTarget(null); }
    catch (e) { setToast({ message: e.message || "فشل الحذف", type: "error" }); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة الفئات</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--gray-9)" }}>{categories.length > 0 ? `${categories.length} فئة` : "فئات المنتجات وتنظيمها"}</p>
        </div>
        <button onClick={() => { setParentNode(null); setEditNode(null); setCatDialog(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--blue-9)", color: "#fff" }}>
          <FiPlus size={15} /> فئة جديدة
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SectionCard title="شجرة الفئات" subtitle="اختر فئة من الشجرة لمعرفة مكانها وإدارة تفرعاتها">
          <div className="relative">
            <FiSearch size={14} className="absolute top-1/2 -translate-y-1/2 right-3.5" style={{ color: "var(--gray-8)" }} />
            <input className={`${FIELD_BASE_CLASS} pr-10 text-right`}
              style={{ ...FIELD_BASE_STYLE, direction: "rtl" }}
              value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث في الفئات..." />
          </div>

          {loading && <div className="flex justify-center py-16"><Spinner size={28} /></div>}
          {error && (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: "var(--red-a2)", border: "1px solid var(--red-a5)" }}>
              <span className="text-sm" style={{ color: "var(--red-11)" }}>{error}</span>
              <button onClick={fetchCategories} className="text-xs font-semibold underline" style={{ color: "var(--red-11)" }}>إعادة المحاولة</button>
            </div>
          )}
          {!loading && !error && tree.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 rounded-[24px] border"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}>
              <FiFolder size={40} className="mb-4" style={{ color: "var(--gray-7)" }} />
              <p className="font-semibold" style={{ color: "var(--gray-10)" }}>
                {search ? "لا توجد نتائج مطابقة" : "لا توجد فئات بعد"}
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--gray-8)" }}>
                {search ? "جرّب كلمة بحث مختلفة أو امسح البحث." : "اضغط \"فئة جديدة\" للبدء ببناء الشجرة."}
              </p>
            </div>
          )}
          {!loading && !error && tree.length > 0 && (
            <div className="rounded-[24px] border p-3 space-y-2"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}>
              {tree.map(node => (
                <CategoryNode
                  key={node.id}
                  node={node}
                  selectedId={selectedId}
                  onSelect={nodeData => setSelectedId(nodeData.id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="الفئة المحددة" subtitle="تفاصيل سريعة لتوضيح مكان الإضافة أو التعديل" tone="accent">
          {selectedNode ? (
            <>
              <div className="rounded-[24px] border px-4 py-4 space-y-4"
                style={{ background: "var(--gray-1)", borderColor: "var(--blue-a4)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--blue-a3)", color: "var(--blue-10)" }}>
                    <FiFolder size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>{selectedNode.name}</h3>
                      <StatusBadge isActive={selectedNode.isActive} />
                    </div>
                    <p className="text-xs mt-1 leading-6" style={{ color: "var(--gray-9)" }}>
                      {selectedPath.join(" / ")}
                    </p>
                  </div>
                </div>

                <SummaryStat icon={FiFolder} label="المسار" value={selectedPath.join(" / ")} />
                <SummaryStat icon={FiPackage} label="الرابط" value={selectedNode.slug || "غير محدد"} direction="ltr" />
                <SummaryStat icon={FiTag} label="الاستهداف" value={
                  selectedNode.ageGroup
                    ? `${getOptionLabel(AUDIENCE_OPTIONS, selectedNode.targetedAudience)} · ${getOptionLabel(AGE_GROUP_OPTIONS, selectedNode.ageGroup)}`
                    : getOptionLabel(AUDIENCE_OPTIONS, selectedNode.targetedAudience)
                } />

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => handleAddChild(selectedNode)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-sm font-semibold"
                    style={{ background: "var(--green-a2)", color: "var(--green-10)" }}>
                    <FiFolderPlus size={14} />
                    إضافة فرعية
                  </button>
                  <button type="button" onClick={() => handleEdit(selectedNode)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-sm font-semibold"
                    style={{ background: "var(--blue-a2)", color: "var(--blue-10)" }}>
                    <FiEdit2 size={14} />
                    تعديل
                  </button>
                  <button type="button" onClick={() => handleDelete(selectedNode)}
                    className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-sm font-semibold"
                    style={{ background: "var(--red-a2)", color: "var(--red-10)" }}>
                    <FiTrash2 size={14} />
                    حذف الفئة
                  </button>
                </div>
              </div>
              <FieldHint>إضافة فئة فرعية من هذه اللوحة تضمن بقاء السياق واضحاً وعدم الضياع داخل الشجرة.</FieldHint>
            </>
          ) : (
            <div className="rounded-[24px] border px-4 py-10 text-center space-y-3"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}>
              <div className="w-14 h-14 rounded-[22px] flex items-center justify-center mx-auto"
                style={{ background: "var(--gray-1)", color: "var(--blue-10)" }}>
                <FiFolder size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>اختر فئة من الشجرة</p>
                <p className="text-xs mt-2 leading-6" style={{ color: "var(--gray-9)" }}>
                  ستظهر هنا تفاصيل الفئة الحالية لتعرف مباشرة أين ستضيف فئة فرعية أو ما الذي ستعدله.
                </p>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <CategoryFormDialog open={catDialog} onOpenChange={setCatDialog} themeContainer={themeContainer}
        parentId={parentNode?.id || null} parentName={parentNode?.name || null} editCategory={editNode}
        onSuccess={(category) => {
          fetchCategories();
          if (category?.id) setSelectedId(category.id);
          setToast({ message: editNode ? "تم تعديل الفئة" : "تم إنشاء الفئة", type: "success" });
        }} />
      <DeleteDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}
        title="حذف الفئة" message={`هل أنت متأكد من حذف فئة "${deleteTarget?.name}"؟`}
        onConfirm={confirmDelete} loading={deleteLoading} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PRODUCTS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "true", label: "نشط" },
  { value: "false", label: "غير نشط" },
];

export default function Products() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCats, setFilterCats] = useState([]);
  const [filterBrands, setFilterBrands] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rowLoading, setRowLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const debRef = useRef(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    productsApi.getCategories().then(r => setFilterCats([{ value: "", label: "كل الفئات" }, ...(r?.data || []).map(c => ({ value: String(c.id), label: c.name }))])).catch(() => {});
    productsApi.getBrands().then(r => setFilterBrands([{ value: "", label: "كل البراندات" }, ...(r?.data || []).map(b => ({ value: String(b.id), label: b.name }))])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await productsApi.getAll({ page, size: 15, name: search, categoryId: filterCat, brandId: filterBrand, isActive: filterStatus });
      const d = r?.data || {};
      setProducts(d.content || []);
      setTotalPages(d.meta?.totalPages || 1);
      setTotalElements(d.meta?.totalItems || 0);
    } catch (e) { setError(e.message || "فشل جلب المنتجات"); }
    finally { setLoading(false); }
  }, [page, search, filterCat, filterBrand, filterStatus]);

  useEffect(() => { if (tab === "products") fetchProducts(); }, [fetchProducts, tab]);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setSearch(val); setPage(0); }, 400);
  };

  const clearFilters = () => { setSearchInput(""); setSearch(""); setFilterCat(""); setFilterBrand(""); setFilterStatus(""); setPage(0); };
  const hasFilters = search || filterCat || filterBrand || filterStatus;

  const handleToggle = async (p) => {
    setRowLoading(prev => ({ ...prev, [p.id]: true }));
    try {
      await productsApi.updateStatus(p.id, !p.isActive);
      showToast(p.isActive ? "تم إخفاء المنتج" : "تم تفعيل المنتج");
      fetchProducts();
    } catch (e) { showToast(e.message || "فشل تغيير الحالة", "error"); }
    finally { setRowLoading(prev => ({ ...prev, [p.id]: false })); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try { await productsApi.delete(deleteTarget.id); showToast("تم حذف المنتج"); fetchProducts(); setDeleteOpen(false); }
    catch (e) { showToast(e.message || "فشل الحذف", "error"); }
    finally { setDeleteLoading(false); }
  };

  const defaultVariant = (p) => (p.variants || []).find(v => v.isDefault) || (p.variants || [])[0];

  const pageNums = useMemo(() => {
    const nums = []; const start = Math.max(0, page - 2); const end = Math.min(totalPages - 1, page + 2);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  return (
    <div dir="rtl" className="p-4 sm:p-6 space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة المنتجات</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--gray-9)" }}>
            {tab === "products" ? (totalElements > 0 ? `${totalElements} منتج` : "منتجات وخصائص المتجر") : "هيكل الفئات وتنظيمها"}
          </p>
        </div>
        {tab === "products" && (
          <button onClick={() => { setSelectedProduct(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold hover:opacity-90 transition"
            style={{ background: "var(--blue-9)", color: "#fff" }}>
            <FiPlus size={15} /> منتج جديد
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl w-fit" style={{ background: "var(--gray-a3)" }}>
        {[
          { key: "products", label: "المنتجات", Icon: FiPackage },
          { key: "categories", label: "الفئات", Icon: FiFolder },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{
              background: tab === t.key ? "var(--gray-1)" : "transparent",
              color: tab === t.key ? "var(--gray-12)" : "var(--gray-9)",
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,.12)" : "none",
            }}>
            <t.Icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Categories Tab */}
      {tab === "categories" && <CategoryManagement />}

      {/* Products Tab */}
      {tab === "products" && (
        <>
          {/* Filters */}
          <SectionCard title="فلترة المنتجات" subtitle="ابحث بسرعة وقلّل الضوضاء داخل القائمة">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <FiSearch size={14} className="absolute top-1/2 -translate-y-1/2 right-3.5" style={{ color: "var(--gray-8)" }} />
                <input className={`${FIELD_BASE_CLASS} pr-10 text-right`}
                  style={{ ...FIELD_BASE_STYLE, direction: "rtl" }}
                  value={searchInput} onChange={e => handleSearchInput(e.target.value)} placeholder="ابحث باسم المنتج..." />
              </div>
              {filterCats.length > 1 && (
                <div className="min-w-[170px]">
                  <InlineSelect value={filterCat} onChange={v => { setFilterCat(v); setPage(0); }} options={filterCats} placeholder="كل الفئات" />
                </div>
              )}
              {filterBrands.length > 1 && (
                <div className="min-w-[170px]">
                  <InlineSelect value={filterBrand} onChange={v => { setFilterBrand(v); setPage(0); }} options={filterBrands} placeholder="كل البراندات" />
                </div>
              )}
              <div className="min-w-[140px]">
                <InlineSelect value={filterStatus} onChange={v => { setFilterStatus(v); setPage(0); }} options={STATUS_OPTIONS} placeholder="الكل" />
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold border"
                  style={{ borderColor: "var(--gray-a5)", color: "var(--gray-10)", background: "var(--gray-a2)" }}>
                  <FiX size={12} /> مسح الفلاتر
                </button>
              )}
            </div>
          </SectionCard>

          {/* Error */}
          {error && (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{ background: "var(--red-a2)", border: "1px solid var(--red-a5)" }}>
              <span className="text-sm" style={{ color: "var(--red-11)" }}>{error}</span>
              <button onClick={fetchProducts} className="text-xs font-semibold underline" style={{ color: "var(--red-11)" }}>إعادة المحاولة</button>
            </div>
          )}

          {/* Loading */}
          {loading && <div className="flex justify-center py-20"><Spinner size={30} /></div>}

          {/* Empty */}
          {!loading && !error && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
              style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a5)" }}>
              <FiPackage size={42} className="mb-4" style={{ color: "var(--gray-7)" }} />
              <p className="font-semibold text-base" style={{ color: "var(--gray-10)" }}>لا توجد منتجات</p>
              <p className="text-sm mt-1 mb-5" style={{ color: "var(--gray-8)" }}>
                {hasFilters ? "جرّب تغيير الفلاتر أو مسحها" : "اضغط «منتج جديد» للبدء"}
              </p>
              {!hasFilters && (
                <button onClick={() => { setSelectedProduct(null); setFormOpen(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "var(--blue-9)", color: "#fff" }}>
                  <FiPlus size={14} /> منتج جديد
                </button>
              )}
            </div>
          )}

          {/* Table */}
          {!loading && products.length > 0 && (
            <div className="rounded-[26px] border overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.04)]" style={{ borderColor: "var(--gray-a5)" }}>
              <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr style={{ background: "var(--gray-a2)", borderBottom: "1px solid var(--gray-a4)" }}>
                    {["المنتج", "الفئة", "المتغيرات", "السعر", "الحالة", ""].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-right text-xs font-bold" style={{ color: "var(--gray-9)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => {
                    const defV = defaultVariant(p);
                    return (
                      <tr key={p.id} className="group transition-colors" style={{ borderBottom: idx < products.length - 1 ? "1px solid var(--gray-a3)" : "none", background: "var(--gray-1)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--gray-a2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "var(--gray-1)"}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--blue-a3)" }}>
                              <FiPackage size={14} style={{ color: "var(--blue-9)" }} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate max-w-[200px]" style={{ color: "var(--gray-12)" }}>{p.name}</p>
                              {p.shortDescription && <p className="text-xs truncate max-w-[200px] mt-0.5" style={{ color: "var(--gray-9)" }}>{p.shortDescription}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {p.categoryId
                            ? <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--purple-a3)", color: "var(--purple-11)" }}>
                                {filterCats.find(c => c.value === String(p.categoryId))?.label || `#${p.categoryId}`}
                              </span>
                            : <span style={{ color: "var(--gray-7)" }}>—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-medium" style={{ color: "var(--gray-11)" }}>{(p.variants || []).length} متغير</span>
                        </td>
                        <td className="px-4 py-3.5">
                          {defV
                            ? <span className="font-semibold text-sm" style={{ color: "var(--gray-12)" }}>{Number(defV.basePrice).toLocaleString("ar-SA")} ₪</span>
                            : <span style={{ color: "var(--gray-7)" }}>—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => handleToggle(p)} disabled={!!rowLoading[p.id]} className="transition hover:opacity-80 disabled:opacity-50">
                            {rowLoading[p.id] ? <Spinner size={14} /> : <StatusBadge isActive={p.isActive} />}
                          </button>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                              className="p-2 rounded-xl transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              style={{ color: "var(--gray-10)", background: openMenuId === p.id ? "var(--gray-a3)" : "transparent" }}>
                              <FiMoreVertical size={15} />
                            </button>
                            {openMenuId === p.id && (
                              <div className="absolute left-0 top-full z-50 mt-1 rounded-xl shadow-xl border py-1 min-w-[130px]"
                                style={{ background: "var(--gray-2)", borderColor: "var(--gray-a6)" }}
                                onMouseLeave={() => setOpenMenuId(null)}>
                                <button onClick={() => { setSelectedProduct(p); setFormOpen(true); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-right hover:opacity-80"
                                  style={{ color: "var(--gray-12)" }}>
                                  <FiEdit2 size={13} /> تعديل
                                </button>
                                <button onClick={() => { setDeleteTarget(p); setDeleteOpen(true); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-right hover:opacity-80"
                                  style={{ color: "var(--red-10)" }}>
                                  <FiTrash2 size={13} /> حذف
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border disabled:opacity-40"
                style={{ borderColor: "var(--gray-a5)", color: "var(--gray-11)" }}>
                <FiChevronRight size={13} /> السابق
              </button>
              {pageNums.map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className="w-8 h-8 rounded-xl text-xs font-bold transition"
                  style={{ background: n === page ? "var(--blue-9)" : "var(--gray-a2)", color: n === page ? "#fff" : "var(--gray-11)" }}>
                  {n + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border disabled:opacity-40"
                style={{ borderColor: "var(--gray-a5)", color: "var(--gray-11)" }}>
                التالي <FiChevronLeft size={13} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={selectedProduct}
        onSuccess={() => { fetchProducts(); showToast(selectedProduct ? "تم تعديل المنتج" : "تم إنشاء المنتج بنجاح"); }} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen}
        title="حذف المنتج"
        message={`هل أنت متأكد من حذف المنتج "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={confirmDelete} loading={deleteLoading} />
    </div>
  );
}
