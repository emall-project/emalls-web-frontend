import { useState, useEffect, useCallback, useRef } from "react";
import * as DDMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { FiPlus, FiMoreVertical, FiEdit2, FiTrash2, FiPower, FiSearch, FiX, FiLoader, FiAlertCircle, FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronUp, FiImage } from "react-icons/fi";
import { useAuth } from "../../../auth/AuthContext";
import { productsApi } from "./api";
import { AUDIENCE_OPTIONS, AGE_GROUP_OPTIONS, STATUS_COLORS } from "./constants";
import { MediaManagerPickerDialog } from "../../../components/mediaManager/MediaManagerPickerDialog";
import { getMediaPreviewUrl } from "../../../api/mediaManager";

// ── Injected styles ────────────────────────────────────────────────────────────
const STYLES = `
  .prod-input {
    width: 100%;
    border-radius: 10px;
    padding: 9px 14px;
    font-size: 14px;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    background: var(--gray-a2);
    border: 1px solid var(--gray-a6);
    color: var(--gray-12);
    text-align: right;
    direction: rtl;
  }
  .prod-input::placeholder { color: var(--gray-9); }
  .prod-input:hover { border-color: var(--blue-7); }
  .prod-input:focus {
    border-color: var(--blue-8);
    box-shadow: 0 0 0 2px var(--blue-a4);
    background: var(--gray-1);
  }
  .prod-select {
    width: 100%;
    border-radius: 10px;
    padding: 9px 14px;
    font-size: 14px;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    background: var(--gray-a2);
    border: 1px solid var(--gray-a6);
    color: var(--gray-12);
    direction: rtl;
    cursor: pointer;
    appearance: none;
  }
  .prod-select:hover { border-color: var(--blue-7); }
  .prod-select:focus {
    border-color: var(--blue-8);
    box-shadow: 0 0 0 2px var(--blue-a4);
    background: var(--gray-1);
  }
  .prod-textarea {
    width: 100%;
    border-radius: 10px;
    padding: 9px 14px;
    font-size: 14px;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    background: var(--gray-a2);
    border: 1px solid var(--gray-a6);
    color: var(--gray-12);
    text-align: right;
    direction: rtl;
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }
  .prod-textarea::placeholder { color: var(--gray-9); }
  .prod-textarea:hover { border-color: var(--blue-7); }
  .prod-textarea:focus {
    border-color: var(--blue-8);
    box-shadow: 0 0 0 2px var(--blue-a4);
    background: var(--gray-1);
  }
`;

function StyleInjector() {
  useEffect(() => {
    const id = "products-page-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.innerHTML = STYLES;
    document.head.appendChild(el);
  }, []);
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function useThemeContainer() {
  const [c] = useState(() => document.querySelector(".radix-themes") || document.body);
  return c;
}

function normalizeVariantMedia(media = []) {
  return media.map((item, index) => ({
    ...item,
    mediumId: item.mediumId ?? item.id,
    sortOrder: item.sortOrder ?? index + 1,
  }));
}

function unwrapData(response) {
  return response?.data ?? response ?? null;
}

function nextSortState(current, field) {
  if (current.field !== field) {
    return { field, direction: "asc" };
  }

  if (current.direction === "asc") {
    return { field, direction: "desc" };
  }

  return { field: "", direction: "" };
}

function buildProductBasePayload(form) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    isActive: form.isActive,
    targetedAudience: form.targetedAudience || undefined,
    ageGroup: form.ageGroup || undefined,
    categoryId: form.categoryId ? Number(form.categoryId) : undefined,
    brandId: form.brandId ? Number(form.brandId) : undefined,
    shortDescription: form.shortDescription.trim() || undefined,
    description: form.description.trim() || undefined,
    tags: form.tags.map((t) => ({ name: t })),
  };
}

function buildVariantPayload(variant, productAttrIds) {
  return {
    ...(variant.id ? { id: variant.id } : {}),
    name: variant.name.trim(),
    basePrice: variant.basePrice,
    isDefault: variant.isDefault,
    attributes: productAttrIds
      .map((attrId) => {
        const entry = (variant.attributes || []).find(
          (item) => String(item.attributeId) === String(attrId)
        );
        return entry?.optionId
          ? { attributeId: Number(attrId), optionId: Number(entry.optionId) }
          : null;
      })
      .filter(Boolean),
    media: normalizeVariantMedia(variant.media || []).map((medium) => ({
      mediumId: medium.mediumId,
      sortOrder: medium.sortOrder,
    })),
  };
}

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium"
      style={{
        background: type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color: type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}
    >
      {message}
      <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-1">✕</button>
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

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ isActive }) {
  const key = String(isActive);
  const s = STATUS_COLORS[key] || { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {isActive ? "نشط" : "غير نشط"}
    </span>
  );
}

// ── Actions Dropdown ──────────────────────────────────────────────────────────
function ProductActionsMenu({ product, loading, onEdit, onDelete, onToggle }) {
  const themeContainer = useThemeContainer();
  const menuStyle = {
    background: "var(--gray-1)",
    border: "1px solid var(--gray-a6)",
    color: "var(--gray-12)",
    boxShadow: "0 14px 40px rgba(0,0,0,.35)",
  };

  return (
    <DDMenu.Root dir="rtl">
      <DDMenu.Trigger asChild>
        <button
          type="button"
          disabled={loading}
          className="p-2 rounded-lg transition outline-none hover:opacity-70"
          style={{ color: "var(--gray-12)" }}
        >
          {loading ? <Spinner size={14} /> : <FiMoreVertical />}
        </button>
      </DDMenu.Trigger>

      <DDMenu.Portal container={themeContainer}>
        <DDMenu.Content
          sideOffset={8}
          align="end"
          className="z-50 min-w-[180px] rounded-xl p-2 outline-none"
          style={menuStyle}
        >
          <DDMenu.Label className="px-2 py-1.5 text-xs font-semibold" style={{ color: "var(--gray-10)" }}>
            الإجراءات
          </DDMenu.Label>

          <DDItem icon={<FiEdit2 />} onSelect={() => onEdit(product)}>تعديل</DDItem>

          <DDMenu.Separator className="my-1.5 mx-2" style={{ height: 1, background: "var(--gray-a5)" }} />

          <DDItem icon={<FiPower />} onSelect={() => onToggle(product)}>
            {product.isActive ? "تعطيل" : "تفعيل"}
          </DDItem>

          <DDMenu.Separator className="my-1.5 mx-2" style={{ height: 1, background: "var(--gray-a5)" }} />

          <DDItem icon={<FiTrash2 />} onSelect={() => onDelete(product)} danger>حذف</DDItem>
        </DDMenu.Content>
      </DDMenu.Portal>
    </DDMenu.Root>
  );
}

function DDItem({ children, icon, onSelect, danger }) {
  return (
    <DDMenu.Item
      className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm cursor-pointer select-none outline-none transition-colors hover:bg-black/5"
      onSelect={(e) => { e.preventDefault(); onSelect?.(); }}
      style={{ color: danger ? "var(--red-11)" : "var(--gray-12)" }}
    >
      <span className="text-base opacity-75">{icon}</span>
      <span className="font-medium">{children}</span>
    </DDMenu.Item>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      dir="ltr"
      className="relative inline-flex items-center h-6 w-11 rounded-full transition-colors flex-shrink-0 outline-none focus-visible:ring-2"
      style={{
        background: checked ? "var(--blue-9)" : "var(--gray-a6)",
        focusRingColor: "var(--blue-a6)",
      }}
    >
      <span
        className="inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(24px)" : "translateX(4px)" }}
      />
    </button>
  );
}

// ── Simple Select ─────────────────────────────────────────────────────────────
function SelectField({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="prod-select"
        style={{ paddingLeft: "32px" }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
        style={{ color: "var(--gray-9)" }}
      >
        ▾
      </span>
    </div>
  );
}

// ── Searchable Select ─────────────────────────────────────────────────────────
function SearchableSelect({ value, onChange, options, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (val) => {
    onChange(val);
    setQuery("");
    setOpen(false);
  };

  const handleBlur = (e) => {
    if (!wrapperRef.current?.contains(e.relatedTarget)) {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={wrapperRef} className="relative" onBlur={handleBlur}>
      <div
        className="prod-input flex items-center gap-2 cursor-pointer"
        style={{ padding: "0" }}
        onClick={() => setOpen(o => !o)}
      >
        <input
          value={open ? query : (selected?.label || "")}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none px-3 py-[9px] text-sm"
          style={{ color: "var(--gray-12)", direction: "rtl", textAlign: "right" }}
        />
        {value && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onChange(""); setQuery(""); }}
            className="px-2 hover:opacity-70 transition-opacity"
            style={{ color: "var(--gray-9)" }}
          >
            <FiX size={13} />
          </button>
        )}
        <span className="px-3 text-xs pointer-events-none" style={{ color: "var(--gray-9)" }}>▾</span>
      </div>

      {open && (
        <div
          className="absolute right-0 left-0 top-full mt-1 z-50 rounded-xl border shadow-lg overflow-hidden"
          style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)", maxHeight: "200px", overflowY: "auto" }}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-right" style={{ color: "var(--gray-9)" }}>لا توجد نتائج</div>
          ) : (
            filtered.map(o => (
              <button
                key={o.value}
                type="button"
                tabIndex={0}
                onMouseDown={() => handleSelect(o.value)}
                className="w-full text-right px-3 py-2 text-sm transition-colors"
                style={{
                  color: "var(--gray-12)",
                  background: o.value === value ? "var(--blue-a3)" : "transparent",
                }}
                onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "var(--gray-a3)"; }}
                onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Tag Input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange, readOnly = false }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const addTag = (raw) => {
    const val = raw.trim();
    if (!val || tags.includes(val)) return;
    onChange([...tags, val]);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleInputChange = (val) => {
    setInput(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(() => {
      productsApi.getTags(val.trim())
        .then(r => {
          const results = (r?.data || []).map(t => t.name).filter(n => !tags.includes(n));
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        })
        .catch(() => {});
    }, 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="min-h-[42px] flex flex-wrap gap-1.5 p-2 rounded-[10px] border transition-colors"
        style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}
      >
        {tags.map((tag) => (
          <span key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70 transition-opacity outline-none">
              <FiX size={10} />
            </button>
          </span>
        ))}
        {!readOnly && (
          <input
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={tags.length === 0 ? "اكتب وسمًا واضغط إدخال..." : ""}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
            style={{ color: "var(--gray-12)", direction: "rtl", textAlign: "right" }}
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          className="absolute right-0 left-0 top-full mt-1 z-50 rounded-xl border shadow-lg overflow-hidden"
          style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
        >
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className="w-full text-right px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--gray-12)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--gray-a3)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Variant Card ──────────────────────────────────────────────────────────────
// productAttrIds = which attribute IDs apply to this product (chosen at product level)
// variant.attributes = [{ attributeId, optionId }] — one entry per productAttrId
function VariantCard({
  variant,
  index,
  isDefault,
  onChange,
  onRemove,
  onSetDefault,
  canRemove,
  attrOptions = [],
  productAttrIds = [],
  onOpenMediaPicker,
  onRemoveMedia,
}) {
  const setOptionForAttr = (attributeId, optionId) => {
    const existing = variant.attributes || [];
    const updated = existing.some(a => String(a.attributeId) === String(attributeId))
      ? existing.map(a => String(a.attributeId) === String(attributeId) ? { ...a, optionId } : a)
      : [...existing, { attributeId, optionId }];
    onChange(index, "attributes", updated);
  };

  const getOptionId = (attributeId) =>
    (variant.attributes || []).find(a => String(a.attributeId) === String(attributeId))?.optionId || "";

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: "var(--gray-a2)",
        borderColor: isDefault ? "var(--blue-7)" : "var(--gray-a5)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
          متغير {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: "var(--gray-11)" }}>
            <input type="radio" checked={isDefault} onChange={() => onSetDefault(index)} className="accent-blue-600" />
            افتراضي
          </label>
          {canRemove && (
            <button type="button" onClick={() => onRemove(index)}
              className="p-1 rounded-lg hover:opacity-70 transition-opacity outline-none"
              style={{ color: "var(--red-9)" }}>
              <FiTrash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>اسم المتغير</FieldLabel>
          <input className="prod-input" value={variant.name}
            onChange={(e) => onChange(index, "name", e.target.value)} placeholder="مثال: أحمر - L" />
        </div>
        <div>
          <FieldLabel>السعر الأساسي</FieldLabel>
          <input className="prod-input" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*"
            value={variant.basePrice === 0 ? "" : variant.basePrice}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "");
              onChange(index, "basePrice", val === "" ? 0 : parseFloat(val) || 0);
            }}
            placeholder="0.00" />
        </div>
      </div>

      {/* Value pickers — one per product-level selected attribute */}
      {productAttrIds.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--gray-a4)" }}>
          <span className="text-xs font-semibold block mb-2" style={{ color: "var(--gray-11)" }}>قيم الخصائص</span>
          <div className="grid grid-cols-2 gap-2">
            {productAttrIds.map(attrId => {
              const attr = attrOptions.find(a => String(a.id) === String(attrId));
              if (!attr) return null;
              return (
                <div key={attrId}>
                  <FieldLabel>{attr.name}</FieldLabel>
                  <select className="prod-select"
                    value={getOptionId(attrId)}
                    onChange={e => setOptionForAttr(attrId, e.target.value)}>
                    <option value="">اختر القيمة</option>
                    {(attr.options || []).map(o => (
                      <option key={o.id} value={String(o.id)}>{o.value}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--gray-a4)" }}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
            وسائط المتغير
          </span>
          <button
            type="button"
            onClick={() => onOpenMediaPicker(index)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
          >
            <FiImage size={12} />
            اختيار من الملفات
          </button>
        </div>

        {variant.media?.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {variant.media.map((medium, mediaIndex) => {
              const file = medium.mediumFile || {};
              const previewUrl = getMediaPreviewUrl(file);

              return (
                <div
                  key={medium.mediumId || `${variant._key}-${mediaIndex}`}
                  className="overflow-hidden rounded-xl border"
                  style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
                >
                  <div
                    className="relative"
                    style={{ aspectRatio: "1 / 1", background: "var(--gray-a3)" }}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt={file.name || "media"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ color: "var(--gray-9)" }}>
                        <FiImage size={18} />
                      </div>
                    )}

                    <span
                      className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                    >
                      {mediaIndex + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => onRemoveMedia(index, mediaIndex)}
                      className="absolute left-2 top-2 rounded-full p-1 transition hover:opacity-80"
                      style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                    >
                      <FiX size={12} />
                    </button>
                  </div>

                  <div className="truncate px-2 py-2 text-xs" style={{ color: "var(--gray-11)" }}>
                    {file.name || medium.mediumId}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-xl border border-dashed px-4 py-4 text-xs"
            style={{
              borderColor: "var(--gray-a6)",
              background: "var(--gray-a2)",
              color: "var(--gray-10)",
            }}
          >
            لم يتم اختيار وسائط لهذا المتغير بعد.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty form state ──────────────────────────────────────────────────────────
function emptyForm() {
  return {
    name: "",
    slug: "",
    isActive: true,
    targetedAudience: "ALL",
    ageGroup: "ALL",
    categoryId: "",
    brandId: "",
    shortDescription: "",
    description: "",
    tags: [],
    variants: [{ _key: Date.now(), name: "", basePrice: 0, isDefault: true, attributes: [], media: [] }],
  };
}

function productToForm(product) {
  return {
    name: product.name || "",
    slug: product.slug || "",
    isActive: product.isActive ?? true,
    targetedAudience: product.targetedAudience || "",
    ageGroup: product.ageGroup || "",
    categoryId: product.categoryId != null ? String(product.categoryId) : "",
    brandId: product.brandId != null ? String(product.brandId) : "",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    tags: (product.tags || []).map((t) => (typeof t === "string" ? t : t.name)),
    variants: (product.variants?.length > 0
      ? product.variants
      : [{ name: "", basePrice: 0, isDefault: true, attributes: [], media: [] }]
    ).map((v, i) => ({
      ...v,
      _key: v.id ?? Date.now() + i,
      attributes: v.attributes || [],
      media: normalizeVariantMedia(v.media || []),
    })),
  };
}

// ── Attribute Form Dialog ─────────────────────────────────────────────────────
function AttributeFormDialog({ open, onOpenChange, onSuccess, themeContainer }) {
  const [form, setForm] = useState({ name: "", slug: "", isActive: true, options: [{ value: "", sortOrder: 1 }] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm({ name: "", slug: "", isActive: true, options: [{ value: "", sortOrder: 1 }] }); setError(""); }
  }, [open]);

  const handleNameChange = (val) => setForm(f => ({
    ...f, name: val,
    slug: val.trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").toLowerCase(),
  }));

  const setOpt = (i, val) => setForm(f => ({
    ...f, options: f.options.map((o, idx) => idx === i ? { ...o, value: val } : o),
  }));

  const addOpt = () => setForm(f => ({
    ...f, options: [...f.options, { value: "", sortOrder: f.options.length + 1 }],
  }));

  const removeOpt = (i) => setForm(f => ({
    ...f, options: f.options.filter((_, idx) => idx !== i).map((o, idx) => ({ ...o, sortOrder: idx + 1 })),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("اسم الخاصية مطلوب");
    if (form.options.some(o => !o.value.trim())) return setError("جميع القيم مطلوبة");
    setSaving(true); setError("");
    try {
      await productsApi.createAttribute({
        id: null,
        name: form.name.trim(),
        slug: form.slug.trim(),
        attributeType: "SELECT",
        isActive: form.isActive,
        options: form.options.map(o => ({ value: o.value.trim(), sortOrder: o.sortOrder })),
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9992]" style={{ background: "rgba(0,0,0,0.4)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-[9993] flex items-center justify-center p-4" aria-describedby={undefined}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--gray-a6)" }}>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>إنشاء خاصية جديدة</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: "var(--gray-11)" }}>
                  <FiX size={16} />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}>
                  <FiAlertCircle size={14} /><span>{error}</span>
                </div>
              )}

              <div>
                <FieldLabel required>اسم الخاصية</FieldLabel>
                <input className="prod-input" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="مثال: اللون" required />
              </div>
              <div>
                <FieldLabel>الرابط المختصر</FieldLabel>
                <input className="prod-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="مثال: color" />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--gray-12)" }}>نشط</span>
                <Toggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel>القيم</FieldLabel>
                  <button type="button" onClick={addOpt}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                    style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                    <FiPlus size={11} /> إضافة قيمة
                  </button>
                </div>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input className="prod-input flex-1" value={opt.value}
                        onChange={e => setOpt(i, e.target.value)} placeholder={`قيمة ${i + 1}`} />
                      {form.options.length > 1 && (
                        <button type="button" onClick={() => removeOpt(i)}
                          className="p-1.5 rounded hover:opacity-70 transition-opacity shrink-0"
                          style={{ color: "var(--red-9)" }}>
                          <FiX size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button type="button" className="px-4 py-2 rounded-xl text-sm font-medium border transition hover:opacity-80"
                    style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>إلغاء</button>
                </Dialog.Close>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                  style={{ background: "var(--blue-9)", color: "#fff" }}>
                  {saving ? <Spinner size={14} /> : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Category Form Dialog ──────────────────────────────────────────────────────
function CategoryFormDialog({ open, onOpenChange, onSuccess, themeContainer }) {
  const [form, setForm] = useState({ name: "", slug: "", targetedAudience: "", ageGroup: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm({ name: "", slug: "", targetedAudience: "", ageGroup: "", isActive: true }); setError(""); }
  }, [open]);

  const handleNameChange = (val) => setForm(f => ({
    ...f, name: val,
    slug: val.trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").toLowerCase(),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("اسم الفئة مطلوب");
    setSaving(true); setError("");
    try {
      const res = await productsApi.createCategory({
        name: form.name.trim(),
        slug: form.slug.trim(),
        targetedAudience: form.targetedAudience || undefined,
        ageGroup: form.ageGroup || undefined,
        isActive: form.isActive,
      });
      onSuccess?.(res?.data);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9992]" style={{ background: "rgba(0,0,0,0.4)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-[9993] flex items-center justify-center p-4" aria-describedby={undefined}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--gray-a6)" }}>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>إنشاء فئة جديدة</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: "var(--gray-11)" }}>
                  <FiX size={16} />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}>
                  <FiAlertCircle size={14} /><span>{error}</span>
                </div>
              )}
              <div>
                <FieldLabel required>اسم الفئة</FieldLabel>
                <input className="prod-input" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="مثال: إلكترونيات" required />
              </div>
              <div>
                <FieldLabel>الرابط المختصر</FieldLabel>
                <input className="prod-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="مثال: electronics" />
              </div>
              <div>
                <FieldLabel>الجمهور المستهدف</FieldLabel>
                <SelectField value={form.targetedAudience} onChange={v => setForm(f => ({ ...f, targetedAudience: v }))}
                  options={AUDIENCE_OPTIONS} placeholder="اختر الجمهور" />
              </div>
              <div>
                <FieldLabel>الفئة العمرية</FieldLabel>
                <SelectField value={form.ageGroup} onChange={v => setForm(f => ({ ...f, ageGroup: v }))}
                  options={AGE_GROUP_OPTIONS} placeholder="اختر الفئة العمرية" />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--gray-12)" }}>نشط</span>
                <Toggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button type="button" className="px-4 py-2 rounded-xl text-sm font-medium border transition hover:opacity-80"
                    style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>إلغاء</button>
                </Dialog.Close>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                  style={{ background: "var(--blue-9)", color: "#fff" }}>
                  {saving ? <Spinner size={14} /> : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Brand Form Dialog ─────────────────────────────────────────────────────────
function BrandFormDialog({ open, onOpenChange, onSuccess, themeContainer }) {
  const [form, setForm] = useState({ name: "", slug: "", targetedAudience: "", ageGroup: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm({ name: "", slug: "", targetedAudience: "", ageGroup: "", isActive: true }); setError(""); }
  }, [open]);

  const handleNameChange = (val) => setForm(f => ({
    ...f, name: val,
    slug: val.trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").toLowerCase(),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("اسم البراند مطلوب");
    setSaving(true); setError("");
    try {
      const res = await productsApi.createBrand({
        name: form.name.trim(),
        slug: form.slug.trim(),
        targetedAudience: form.targetedAudience || undefined,
        ageGroup: form.ageGroup || undefined,
        isActive: form.isActive,
      });
      onSuccess?.(res?.data);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9992]" style={{ background: "rgba(0,0,0,0.4)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-[9993] flex items-center justify-center p-4" aria-describedby={undefined}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--gray-a6)" }}>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>إنشاء براند جديد</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: "var(--gray-11)" }}>
                  <FiX size={16} />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}>
                  <FiAlertCircle size={14} /><span>{error}</span>
                </div>
              )}

              <div>
                <FieldLabel required>اسم البراند</FieldLabel>
                <input className="prod-input" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="مثال: Nike" required />
              </div>
              <div>
                <FieldLabel>الرابط المختصر</FieldLabel>
                <input className="prod-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="مثال: nike" />
              </div>
              <div>
                <FieldLabel>الجمهور المستهدف</FieldLabel>
                <SelectField value={form.targetedAudience} onChange={v => setForm(f => ({ ...f, targetedAudience: v }))}
                  options={AUDIENCE_OPTIONS} placeholder="اختر الجمهور" />
              </div>
              <div>
                <FieldLabel>الفئة العمرية</FieldLabel>
                <SelectField value={form.ageGroup} onChange={v => setForm(f => ({ ...f, ageGroup: v }))}
                  options={AGE_GROUP_OPTIONS} placeholder="اختر الفئة العمرية" />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--gray-12)" }}>نشط</span>
                <Toggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button type="button" className="px-4 py-2 rounded-xl text-sm font-medium border transition hover:opacity-80"
                    style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>إلغاء</button>
                </Dialog.Close>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                  style={{ background: "var(--blue-9)", color: "#fff" }}>
                  {saving ? <Spinner size={14} /> : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Tag Form Dialog ───────────────────────────────────────────────────────────
function TagFormDialog({ open, onOpenChange, onSuccess, themeContainer }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setName(""); setError(""); }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("اسم الوسم مطلوب");
    setSaving(true); setError("");
    try {
      await productsApi.createTag({ name: name.trim() });
      onSuccess?.(name.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9992]" style={{ background: "rgba(0,0,0,0.4)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-[9993] flex items-center justify-center p-4" aria-describedby={undefined}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--gray-a6)" }}>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>إنشاء وسم جديد</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: "var(--gray-11)" }}>
                  <FiX size={16} />
                </button>
              </Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}>
                  <FiAlertCircle size={14} /><span>{error}</span>
                </div>
              )}
              <div>
                <FieldLabel required>اسم الوسم</FieldLabel>
                <input className="prod-input" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: إلكترونيات" required />
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <Dialog.Close asChild>
                  <button type="button" className="px-4 py-2 rounded-xl text-sm font-medium border transition hover:opacity-80"
                    style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>إلغاء</button>
                </Dialog.Close>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                  style={{ background: "var(--blue-9)", color: "#fff" }}>
                  {saving ? <Spinner size={14} /> : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Product Form Dialog ───────────────────────────────────────────────────────
function ProductFormDialog({ open, onOpenChange, product, onSuccess, storeId }) {
  const isEdit = !!product;
  const themeContainer = useThemeContainer();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attrOptions, setAttrOptions] = useState([]);
  const [attrDialogOpen, setAttrDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [activeVariantIndex, setActiveVariantIndex] = useState(null);
  const [productAttrIds, setProductAttrIds] = useState([]);

  const refreshAttributes = useCallback(() => {
    productsApi.getAttributes().then(r => setAttrOptions(r?.data || [])).catch(() => {});
  }, []);

  const handleBrandCreated = useCallback((newBrand) => {
    if (!newBrand) return;
    setBrands(prev => [...prev, newBrand]);
    set("brandId", String(newBrand.id));
  }, []);

  const handleCategoryCreated = useCallback((newCat) => {
    if (!newCat) return;
    setCategories(prev => [...prev, newCat]);
    set("categoryId", String(newCat.id));
  }, []);

  useEffect(() => {
    if (open) {
      setForm(product ? productToForm(product) : emptyForm());
      setError("");
      setMediaPickerOpen(false);
      setActiveVariantIndex(null);
      // Derive which attribute IDs are used across all variants (for edit mode)
      if (product?.variants) {
        const ids = [...new Set(
          product.variants.flatMap(v => (v.attributes || []).map(a => String(a.attributeId)))
        )].filter(Boolean);
        setProductAttrIds(ids);
      } else {
        setProductAttrIds([]);
      }
      productsApi.getCategories().then(r => setCategories(r?.data || [])).catch(() => {});
      productsApi.getBrands().then(r => setBrands(r?.data || [])).catch(() => {});
      productsApi.getAttributes().then(r => setAttrOptions(r?.data || [])).catch(() => {});
    }
  }, [open, product]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleNameChange = (val) => {
    setForm((f) => ({
      ...f,
      name: val,
      slug: val.trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").toLowerCase(),
    }));
  };

  const handleVariantChange = (idx, field, value) => {
    setForm((f) => {
      const variants = f.variants.map((v, i) => i === idx ? { ...v, [field]: value } : v);
      return { ...f, variants };
    });
  };

  const handleVariantDefault = (idx) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => ({ ...v, isDefault: i === idx })),
    }));
  };

  const addVariant = () => {
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { _key: Date.now(), name: "", basePrice: 0, isDefault: false, attributes: [], media: [] }],
    }));
  };

  const removeVariant = (idx) => {
    setForm((f) => {
      const variants = f.variants.filter((_, i) => i !== idx);
      const hasDefault = variants.some((v) => v.isDefault);
      if (!hasDefault && variants.length > 0) variants[0].isDefault = true;
      return { ...f, variants };
    });
  };

  const openMediaPicker = (variantIndex) => {
    setActiveVariantIndex(variantIndex);
    setMediaPickerOpen(true);
  };

  const handleMediaPicked = (pickedFiles) => {
    if (activeVariantIndex == null) {
      return;
    }

    if (pickedFiles.length > 10) {
      setError("الحد الأقصى لوسائط المتغير هو 10 ملفات");
      return;
    }

    setForm((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, index) =>
        index !== activeVariantIndex
          ? variant
          : {
              ...variant,
              media: pickedFiles.map((file, order) => ({
                mediumId: file.id,
                sortOrder: order + 1,
                mediumFile: file,
              })),
            }
      ),
    }));
  };

  const removeVariantMedia = (variantIndex, mediaIndex) => {
    setForm((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, index) => {
        if (index !== variantIndex) {
          return variant;
        }

        return {
          ...variant,
          media: normalizeVariantMedia(
            (variant.media || []).filter((_, currentIndex) => currentIndex !== mediaIndex)
          ),
        };
      }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (!storeId) {
        throw new Error("لا يوجد متجر نشط");
      }

      const missingMediaIndex = form.variants.findIndex(
        (variant) => !variant.media || variant.media.length === 0
      );

      if (missingMediaIndex !== -1) {
        throw new Error(`أضف وسائط للمتغير ${missingMediaIndex + 1}`);
      }

      const body = buildProductBasePayload(form);
      const variants = form.variants.map((variant) =>
        buildVariantPayload(variant, productAttrIds)
      );

      if (isEdit) {
        if (variants.some((variant) => !variant.id)) {
          throw new Error("إضافة متغيرات جديدة بعد إنشاء المنتج غير مدعومة من الخلفية حاليًا");
        }

        await productsApi.update(storeId, { id: product.id, ...body });
        const currentVariantIds = new Set(variants.map((variant) => String(variant.id)));
        const originalVariantIds = (product.variants || [])
          .map((variant) => variant.id)
          .filter(Boolean);

        await Promise.all(
          variants.map((variant) => productsApi.updateVariant(storeId, product.id, variant))
        );
        await Promise.all(
          originalVariantIds
            .filter((variantId) => !currentVariantIds.has(String(variantId)))
            .map((variantId) => productsApi.deleteVariant(storeId, product.id, variantId))
        );
      } else {
        await productsApi.create(storeId, { ...body, variants });
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay
          className="fixed inset-0 z-[9990]"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
        />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-0 z-[9991] flex items-center justify-center p-4"
          aria-describedby={undefined}
        >
          <div
            className="max-w-2xl w-full rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: "var(--gray-a6)" }}
            >
              <Dialog.Title className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                {isEdit ? "تعديل المنتج" : "إضافة منتج جديد"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:opacity-70 transition-opacity outline-none"
                  style={{ color: "var(--gray-11)" }}
                >
                  <FiX size={18} />
                </button>
              </Dialog.Close>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-8">
              {error && (
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                  style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}
                >
                  <FiAlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1 - Basic Info */}
              <div>
                <h3 className="text-sm font-bold mb-4 pb-2 border-b" style={{ color: "var(--gray-12)", borderColor: "var(--gray-a5)" }}>
                  المعلومات الأساسية
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>اسم المنتج</FieldLabel>
                    <input
                      className="prod-input"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="اسم المنتج"
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel>الرابط المختصر</FieldLabel>
                    <input
                      className="prod-input"
                      value={form.slug}
                      onChange={(e) => set("slug", e.target.value)}
                      placeholder="مثال: احذية-رجالية"
                    />
                  </div>

                  <div>
                    <FieldLabel>الجمهور المستهدف</FieldLabel>
                    <SelectField
                      value={form.targetedAudience}
                      onChange={(v) => set("targetedAudience", v)}
                      options={AUDIENCE_OPTIONS}
                      placeholder="اختر الجمهور"
                    />
                  </div>
                  <div>
                    <FieldLabel>الفئة العمرية</FieldLabel>
                    <SelectField
                      value={form.ageGroup}
                      onChange={(v) => set("ageGroup", v)}
                      options={AGE_GROUP_OPTIONS}
                      placeholder="اختر الفئة العمرية"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <FieldLabel>الفئة</FieldLabel>
                      <button
                        type="button"
                        onClick={() => setCategoryDialogOpen(true)}
                        className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition hover:opacity-80"
                        style={{ background: "var(--green-a3)", color: "var(--green-11)" }}
                      >
                        <FiPlus size={11} />
                        فئة جديدة
                      </button>
                    </div>
                    <SearchableSelect
                      value={form.categoryId}
                      onChange={(v) => set("categoryId", v)}
                      options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                      placeholder="ابحث عن فئة..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <FieldLabel>البراند</FieldLabel>
                      <button
                        type="button"
                        onClick={() => setBrandDialogOpen(true)}
                        className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition hover:opacity-80"
                        style={{ background: "var(--green-a3)", color: "var(--green-11)" }}
                      >
                        <FiPlus size={11} />
                        براند جديد
                      </button>
                    </div>
                    <SearchableSelect
                      value={form.brandId}
                      onChange={(v) => set("brandId", v)}
                      options={brands.map(b => ({ value: String(b.id), label: b.name }))}
                      placeholder="ابحث عن براند..."
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between px-4 py-3 rounded-xl border" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}>
                    <span className="text-sm font-medium" style={{ color: "var(--gray-12)" }}>الحالة (نشط)</span>
                    <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} />
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel>الوصف المختصر <span style={{ color: "var(--gray-9)", fontWeight: 400 }}>(حتى 200 حرف)</span></FieldLabel>
                    <textarea
                      className="prod-textarea"
                      value={form.shortDescription}
                      onChange={(e) => set("shortDescription", e.target.value)}
                      maxLength={200}
                      placeholder="وصف مختصر للمنتج"
                      rows={2}
                    />
                    <div className="text-xs mt-1" style={{ color: "var(--gray-9)", textAlign: "left" }}>
                      {form.shortDescription.length}/200
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel>الوصف الكامل</FieldLabel>
                    <textarea
                      className="prod-textarea"
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="وصف تفصيلي للمنتج"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 - Tags */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: "var(--gray-a5)" }}>
                  <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>الوسوم</h3>
                  <button
                    type="button"
                    onClick={() => setTagDialogOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80"
                    style={{ background: "var(--green-a3)", color: "var(--green-11)" }}
                  >
                    <FiPlus size={12} />
                    وسم جديد
                  </button>
                </div>
                <FieldLabel>أضف وسومًا (اضغط إدخال أو فاصلة للإضافة)</FieldLabel>
                <TagInput tags={form.tags} onChange={(tags) => set("tags", tags)} readOnly />
              </div>

              {/* Section 3 - Variants */}
              <div>
                <div className="mb-4 pb-2 border-b" style={{ borderColor: "var(--gray-a5)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                      المتغيرات ({form.variants.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAttrDialogOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80"
                        style={{ background: "var(--green-a3)", color: "var(--green-11)" }}
                      >
                        <FiPlus size={12} />
                        خاصية جديدة
                      </button>
                      {!isEdit && (
                        <button
                          type="button"
                          onClick={addVariant}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80"
                          style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                        >
                          <FiPlus size={12} />
                          إضافة متغير
                        </button>
                      )}
                    </div>
                  </div>

                  {isEdit ? (
                    <div
                      className="mb-3 rounded-xl border px-4 py-3 text-xs leading-6"
                      style={{
                        background: "var(--amber-a2, var(--yellow-a2))",
                        borderColor: "var(--amber-a6, var(--yellow-a6))",
                        color: "var(--amber-11, var(--yellow-11))",
                      }}
                    >
                      يمكن تعديل أو حذف المتغيرات الحالية فقط. إضافة متغير جديد بعد إنشاء المنتج تحتاج endpoint من الخلفية.
                    </div>
                  ) : null}

                  {/* Product-level attribute selector */}
                  {attrOptions.length > 0 && (
                    <div className="rounded-xl p-3 border" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}>
                      <span className="text-xs font-semibold block mb-2" style={{ color: "var(--gray-11)" }}>
                        خصائص المنتج — اختر الخصائص التي تميّز المتغيرات (مثل اللون، الحجم)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {attrOptions.map(a => {
                          const selected = productAttrIds.includes(String(a.id));
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => {
                                const id = String(a.id);
                                setProductAttrIds(prev =>
                                  selected ? prev.filter(x => x !== id) : [...prev, id]
                                );
                              }}
                              className="px-3 py-1 rounded-full text-xs font-medium transition border"
                              style={{
                                background: selected ? "var(--blue-9)" : "transparent",
                                color: selected ? "#fff" : "var(--gray-11)",
                                borderColor: selected ? "var(--blue-9)" : "var(--gray-a6)",
                              }}
                            >
                              {a.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {form.variants.map((variant, idx) => (
                    <VariantCard
                      key={variant._key ?? variant.id ?? idx}
                      variant={variant}
                      index={idx}
                      isDefault={variant.isDefault}
                      onChange={handleVariantChange}
                      onRemove={removeVariant}
                      onSetDefault={handleVariantDefault}
                      canRemove={form.variants.length > 1}
                      attrOptions={attrOptions}
                      productAttrIds={productAttrIds}
                      onOpenMediaPicker={openMediaPicker}
                      onRemoveMedia={removeVariantMedia}
                    />
                  ))}
                </div>
              </div>

              {/* Footer inside form for submit */}
              <div className="flex items-center justify-end gap-3 pt-2 pb-1">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl text-sm font-medium border transition hover:opacity-80"
                    style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)", background: "transparent" }}
                  >
                    إلغاء
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#2563eb", color: "#fff" }}
                >
                  {saving && <Spinner size={14} />}
                  {isEdit ? "حفظ التعديلات" : "إضافة المنتج"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    <AttributeFormDialog
      open={attrDialogOpen}
      onOpenChange={setAttrDialogOpen}
      themeContainer={themeContainer}
      onSuccess={refreshAttributes}
    />
    <TagFormDialog
      open={tagDialogOpen}
      onOpenChange={setTagDialogOpen}
      themeContainer={themeContainer}
      onSuccess={(tagName) => set("tags", [...form.tags, tagName])}
    />
    <BrandFormDialog
      open={brandDialogOpen}
      onOpenChange={setBrandDialogOpen}
      themeContainer={themeContainer}
      onSuccess={handleBrandCreated}
    />
    <CategoryFormDialog
      open={categoryDialogOpen}
      onOpenChange={setCategoryDialogOpen}
      themeContainer={themeContainer}
      onSuccess={handleCategoryCreated}
    />
    <MediaManagerPickerDialog
      open={mediaPickerOpen}
      onOpenChange={setMediaPickerOpen}
      mode="store"
      storeId={storeId}
      title="اختيار وسائط المتغير"
      selectionMode="multiple"
      maxSelection={10}
      confirmLabel="إضافة للمتغير"
      initialSelection={
        activeVariantIndex != null
          ? (form.variants[activeVariantIndex]?.media || []).map(
              (medium) => medium.mediumFile || { id: medium.mediumId, name: String(medium.mediumId) }
            )
          : []
      }
      onConfirm={handleMediaPicked}
    />
    </>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────
function DeleteDialog({ open, onOpenChange, product, onConfirm, loading }) {
  const themeContainer = useThemeContainer();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay
          className="fixed inset-0 z-[9990]"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
        />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-0 z-[9991] flex items-center justify-center p-4"
          aria-describedby="delete-desc"
        >
          <div
            className="max-w-sm w-full rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}
          >
            <Dialog.Title className="text-lg font-bold mb-2" style={{ color: "var(--gray-12)" }}>
              تأكيد الحذف
            </Dialog.Title>
            <p id="delete-desc" className="text-sm mb-6" style={{ color: "var(--gray-11)" }}>
              هل أنت متأكد من حذف المنتج <strong style={{ color: "var(--gray-12)" }}>{product?.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border transition hover:opacity-80"
                  style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)", background: "transparent" }}
                >
                  إلغاء
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--red-9)", color: "#fff" }}
              >
                {loading && <Spinner size={14} />}
                <FiTrash2 size={14} />
                حذف
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ProductSortableTh({ field, sort, onSort, children }) {
  const active = sort.field === field;
  const Icon = sort.direction === "asc" ? FiChevronUp : FiChevronDown;

  return (
    <th className="px-5 py-3.5 text-right font-semibold text-xs tracking-wide">
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 font-semibold"
        style={{ color: active ? "var(--blue-11)" : "inherit" }}
      >
        <span>{children}</span>
        {active ? <Icon size={13} /> : null}
      </button>
    </th>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Products({
  storeIdOverride = null,
  title = "إدارة المنتجات",
  subtitle = "إدارة منتجات المتجر",
  headerExtra = null,
  summaryContent = null,
  emptyStoreMessage = "لا يوجد متجر نشط لهذا الحساب.",
}) {
  const { selectedStoreId: authSelectedStoreId } = useAuth();
  const selectedStoreId = storeIdOverride ?? authSelectedStoreId;
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterBrandId, setFilterBrandId] = useState("");
  const [filterIsActive, setFilterIsActive] = useState("");
  const [filterTargetedAudience, setFilterTargetedAudience] = useState("");
  const [filterAgeGroup, setFilterAgeGroup] = useState("");
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterBrands, setFilterBrands] = useState([]);
  const [sort, setSort] = useState({ field: "", direction: "" });
  const debounceRef = useRef(null);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [rowLoading, setRowLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    productsApi.getCategories().then(r => setFilterCategories(r?.data || [])).catch(() => {});
    productsApi.getBrands().then(r => setFilterBrands(r?.data || [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!selectedStoreId) {
      setProducts([]);
      setTotalPages(1);
      setTotalElements(0);
      setFetchLoading(false);
      setFetchError("");
      return;
    }

    setFetchLoading(true);
    setFetchError("");
    try {
      const res = await productsApi.getAll(selectedStoreId, {
        page, size: 20,
        name: search,
        categoryId: filterCategoryId,
        brandId: filterBrandId,
        isActive: filterIsActive,
        targetedAudience: filterTargetedAudience,
        ageGroup: filterAgeGroup,
        sort: sort.field ? `${sort.field},${sort.direction}` : "",
      });
      const data = res?.data || res?.content || res || {};
      const list = Array.isArray(data) ? data : (data?.content || []);
      setProducts(list);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements ?? list.length);
    } catch (e) {
      setFetchError(e.message || "فشل في جلب البيانات");
      setProducts([]);
    } finally {
      setFetchLoading(false);
    }
  }, [
    filterAgeGroup,
    filterBrandId,
    filterCategoryId,
    filterIsActive,
    filterTargetedAudience,
    page,
    search,
    selectedStoreId,
    sort.direction,
    sort.field,
  ]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounced search
  const handleSearchInput = (val) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(0);
    }, 400);
  };

  const handleSort = (field) => {
    setSort((current) => nextSortState(current, field));
    setPage(0);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleEdit = async (product) => {
    if (!selectedStoreId) return;
    setRowLoading((previous) => ({ ...previous, [product.id]: true }));
    try {
      const response = await productsApi.getById(selectedStoreId, product.id);
      setSelectedProduct(unwrapData(response));
      setFormOpen(true);
    } catch (error) {
      showToast(error.message || "فشل في تحميل بيانات المنتج", "error");
    } finally {
      setRowLoading((previous) => ({ ...previous, [product.id]: false }));
    }
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setFormOpen(true);
  };

  const handleDelete = (product) => {
    setDeleteTarget(product);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !selectedStoreId) return;
    setDeleteLoading(true);
    try {
      await productsApi.delete(selectedStoreId, deleteTarget.id);
      showToast("تم حذف المنتج بنجاح");
      setDeleteOpen(false);
      fetchProducts();
    } catch (e) {
      showToast(e.message || "فشل في حذف المنتج", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggle = async (product) => {
    if (!selectedStoreId) {
      showToast("لا يوجد متجر نشط", "error");
      return;
    }

    setRowLoading((p) => ({ ...p, [product.id]: true }));
    try {
      const fullProduct = unwrapData(await productsApi.getById(selectedStoreId, product.id)) || product;
      await productsApi.update(selectedStoreId, {
        id: fullProduct.id,
        name: fullProduct.name,
        slug: fullProduct.slug,
        targetedAudience: fullProduct.targetedAudience || "ALL",
        ageGroup: fullProduct.ageGroup || "ALL",
        isActive: !product.isActive,
        categoryId: fullProduct.categoryId,
        brandId: fullProduct.brandId,
        shortDescription: fullProduct.shortDescription || fullProduct.name,
        description: fullProduct.description || fullProduct.shortDescription || fullProduct.name,
        tags: fullProduct.tags || [],
      });
      showToast(`تم ${!product.isActive ? "تفعيل" : "تعطيل"} المنتج`);
      fetchProducts();
    } catch (e) {
      showToast(e.message || "فشل في تغيير الحالة", "error");
    } finally {
      setRowLoading((p) => ({ ...p, [product.id]: false }));
    }
  };

  const defaultVariant = (product) => product.variants?.find((v) => v.isDefault) || product.variants?.[0];

  if (!selectedStoreId) {
    return (
      <>
        <StyleInjector />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div dir="rtl" className="p-3 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>{title}</h1>
              <p className="mt-0.5 text-sm" style={{ color: "var(--gray-11)" }}>{subtitle}</p>
            </div>
            {headerExtra ? <div className="flex flex-wrap items-center gap-3">{headerExtra}</div> : null}
          </div>
          <div
            className="rounded-2xl border px-5 py-4 text-sm"
            style={{
              background: "var(--gray-1)",
              borderColor: "var(--gray-a6)",
              color: "var(--gray-11)",
            }}
          >
            {emptyStoreMessage}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StyleInjector />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div dir="rtl" className="p-3 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>{title}</h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--gray-11)" }}>
              {totalElements > 0 ? `${totalElements} منتج` : subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {headerExtra}
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
              style={{ background: "#2563eb", color: "#fff" }}
            >
              <FiPlus />
              إضافة منتج
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        {summaryContent}

        <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
          <div className="flex flex-wrap gap-3">
            {/* Name search */}
            <div className="relative flex-1 min-w-[180px]">
              <FiSearch size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--gray-9)" }} />
              <input
                className="prod-input"
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="ابحث باسم المنتج..."
                style={{ paddingRight: "2.5rem" }}
              />
            </div>

            {/* Category filter */}
            <div className="relative min-w-[160px]">
              <select
                className="prod-select"
                value={filterCategoryId}
                onChange={e => { setFilterCategoryId(e.target.value); setPage(0); }}
                style={{ paddingLeft: "28px" }}
              >
                <option value="">كل الفئات</option>
                {filterCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: "var(--gray-9)" }}>▾</span>
            </div>

            {/* Brand filter */}
            <div className="relative min-w-[160px]">
              <select
                className="prod-select"
                value={filterBrandId}
                onChange={e => { setFilterBrandId(e.target.value); setPage(0); }}
                style={{ paddingLeft: "28px" }}
              >
                <option value="">كل البراندات</option>
                {filterBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: "var(--gray-9)" }}>▾</span>
            </div>

            {/* Status filter */}
            <div className="relative min-w-[140px]">
              <select
                className="prod-select"
                value={filterIsActive}
                onChange={e => { setFilterIsActive(e.target.value); setPage(0); }}
                style={{ paddingLeft: "28px" }}
              >
                <option value="">كل الحالات</option>
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </select>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: "var(--gray-9)" }}>▾</span>
            </div>

            {/* Audience filter */}
            <div className="relative min-w-[150px]">
              <select
                className="prod-select"
                value={filterTargetedAudience}
                onChange={e => { setFilterTargetedAudience(e.target.value); setPage(0); }}
                style={{ paddingLeft: "28px" }}
              >
                <option value="">كل الجمهور</option>
                {AUDIENCE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: "var(--gray-9)" }}>▾</span>
            </div>

            {/* Age group filter */}
            <div className="relative min-w-[160px]">
              <select
                className="prod-select"
                value={filterAgeGroup}
                onChange={e => { setFilterAgeGroup(e.target.value); setPage(0); }}
                style={{ paddingLeft: "28px" }}
              >
                <option value="">كل الأعمار</option>
                {AGE_GROUP_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: "var(--gray-9)" }}>▾</span>
            </div>

            {/* Clear all */}
            {(searchInput || filterCategoryId || filterBrandId || filterIsActive || filterTargetedAudience || filterAgeGroup || sort.field) && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput(""); setSearch("");
                  setFilterCategoryId(""); setFilterBrandId(""); setFilterIsActive("");
                  setFilterTargetedAudience(""); setFilterAgeGroup("");
                  setSort({ field: "", direction: "" });
                  setPage(0);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition hover:opacity-80"
                style={{ background: "var(--red-a3)", color: "var(--red-11)" }}
              >
                <FiX size={12} /> مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {fetchError && (
          <div
            className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl"
            style={{ background: "var(--red-2)", border: "1px solid var(--red-6)" }}
          >
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--red-11)" }}>
              <FiAlertCircle size={15} />
              <span>{fetchError}</span>
            </div>
            <button onClick={fetchProducts} className="text-xs font-semibold underline flex-shrink-0" style={{ color: "var(--red-11)" }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden overflow-x-auto"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a7)" }}
        >
          <table className="w-full text-sm" style={{ minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--gray-a6)", background: "var(--gray-a2)", color: "var(--gray-11)" }}>
                <ProductSortableTh field="name" sort={sort} onSort={handleSort}>المنتج</ProductSortableTh>
                {["الفئة", "البراند", "المتغيرات"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-right font-semibold text-xs tracking-wide">{h}</th>
                ))}
                <ProductSortableTh field="isActive" sort={sort} onSort={handleSort}>الحالة</ProductSortableTh>
                <th className="px-5 py-3.5 text-right font-semibold text-xs tracking-wide">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {fetchLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2" style={{ color: "var(--gray-10)" }}>
                      <Spinner size={20} /> جاري التحميل...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm" style={{ color: "var(--gray-10)" }}>
                    لا توجد منتجات مطابقة.
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => {
                  const defVariant = defaultVariant(product);
                  return (
                    <tr
                      key={product.id}
                      style={{
                        borderTop: idx === 0 ? "none" : "1px solid var(--gray-a5)",
                        color: "var(--gray-12)",
                        background: "transparent",
                      }}
                      className="transition hover:bg-(--gray-a3)"
                    >
                      {/* Product name + shortDescription */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-sm" style={{ color: "var(--gray-12)" }}>
                          {product.name}
                        </div>
                        {product.shortDescription && (
                          <div
                            className="text-xs mt-0.5 max-w-[220px] truncate"
                            style={{ color: "var(--gray-10)" }}
                            title={product.shortDescription}
                          >
                            {product.shortDescription}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        {product.categoryName != null ? (
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                          >
                            {product.categoryName}
                          </span>
                        ) : (
                          <span style={{ color: "var(--gray-9)" }}>—</span>
                        )}
                      </td>


                      {/* Brand */}
                      <td className="px-5 py-4">
                        {product.brandName != null ? (
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                          >
                            {product.brandName}
                          </span>
                        ) : (
                          <span style={{ color: "var(--gray-9)" }}>—</span>
                        )}
                      </td>

                      {/* Variants count + default price */}
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium">
                          {product.variants?.length ?? 0} متغير
                        </div>
                        {defVariant && (
                          <div className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>
                            {defVariant.basePrice != null
                              ? `${Number(defVariant.basePrice).toLocaleString("ar")} ر.س`
                              : "—"}
                          </div>
                        )}
                        {!defVariant && product.basePrice != null && (
                          <div className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>
                            {Number(product.discountedPrice ?? product.basePrice).toLocaleString("ar")} ر.س
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge isActive={product.isActive} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <ProductActionsMenu
                          product={product}
                          loading={!!rowLoading[product.id]}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggle={handleToggle}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {!fetchLoading && totalPages > 1 && (
            <div
              className="flex items-center justify-between px-5 py-4 border-t"
              style={{ borderColor: "var(--gray-a6)" }}
            >
              <span className="text-xs" style={{ color: "var(--gray-11)" }}>
                صفحة {page + 1} من {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-8 w-8 rounded-lg flex items-center justify-center border transition hover:opacity-80 disabled:opacity-30"
                  style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
                >
                  <FiChevronRight size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium border transition"
                      style={{
                        borderColor: p === page ? "#2563eb" : "var(--gray-a6)",
                        background: p === page ? "#2563eb" : "transparent",
                        color: p === page ? "#fff" : "var(--gray-12)",
                      }}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-8 w-8 rounded-lg flex items-center justify-center border transition hover:opacity-80 disabled:opacity-30"
                  style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
                >
                  <FiChevronLeft size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={selectedProduct}
        storeId={selectedStoreId}
        onSuccess={() => {
          showToast(selectedProduct ? "تم تحديث المنتج بنجاح" : "تم إضافة المنتج بنجاح");
          fetchProducts();
        }}
      />
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        product={deleteTarget}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </>
  );
}
