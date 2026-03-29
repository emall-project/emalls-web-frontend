import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FiEdit2, FiSave, FiX, FiRefreshCw, FiAlertCircle,
  FiMapPin, FiPhone, FiMail, FiFileText, FiShoppingBag, FiUser, FiLoader, FiChevronDown,
} from "react-icons/fi";
import { shopProfileApi } from "./api";
import { SHOP_STATUS_LABELS, SHOP_STATUS_COLORS, SHOP_STATUSES, CATEGORY_LABELS } from "./constants";

// ── StatusDropdown ─────────────────────────────────────────────────────────────
function StatusDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative w-full max-w-xs" ref={ref}>
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm border transition-all outline-none"
        style={{
          background:  "var(--gray-1)",
          borderColor: open ? "var(--blue-8)" : "var(--gray-a7)",
          color:       selected ? "var(--gray-12)" : "var(--gray-10)",
          boxShadow:   open ? "0 0 0 3px rgba(59,130,246,.18)" : "none",
        }}>
        <span className="flex items-center gap-2">
          {selected && (
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: SHOP_STATUS_COLORS[selected.value]?.dot }} />
          )}
          <span>{selected?.label || "اختر الحالة الجديدة..."}</span>
        </span>
        <FiChevronDown size={14} style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0)", color: "var(--gray-10)" }} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 left-0 z-50 rounded-xl overflow-hidden"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a7)", boxShadow: "0 8px 32px rgba(0,0,0,.18)" }}>
          <div className="p-1.5 space-y-0.5">
            {options.map((opt) => {
              const c = SHOP_STATUS_COLORS[opt.value];
              const isActive = value === opt.value;
              return (
                <button key={opt.value} type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-right"
                  style={{
                    background: isActive ? "var(--blue-a3)" : "transparent",
                    color:      isActive ? "var(--blue-11)" : "var(--gray-12)",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--gray-a3)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c?.dot }} />
                  <span className="font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium"
      style={{
        background:  type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color:       type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}>
      {message}
      <button onClick={onClose} className="opacity-60 hover:opacity-100"><FiX size={13} /></button>
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = SHOP_STATUS_COLORS[status] || { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {SHOP_STATUS_LABELS[status] || status}
    </span>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
        {Icon && <Icon size={12} />} {label}
      </label>
      {children}
    </div>
  );
}

function ReadonlyField({ label, icon, value }) {
  return (
    <Field label={label} icon={icon}>
      <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a6)", color: "var(--gray-12)" }}>
        {value || "—"}
      </div>
    </Field>
  );
}

function EditInput({ label, icon, value, onChange, placeholder, multiline = false }) {
  const base = {
    background: "var(--gray-a2)", border: "1px solid var(--gray-a6)",
    color: "var(--gray-12)", outline: "none", width: "100%",
    borderRadius: 12, padding: "10px 16px", fontSize: 14, direction: "rtl", textAlign: "right",
  };
  return (
    <Field label={label} icon={icon}>
      {multiline
        ? <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder} style={{ ...base, resize: "vertical" }}
            onFocus={(e) => { e.target.style.borderColor = "var(--blue-8)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,.18)"; }}
            onBlur={(e)  => { e.target.style.borderColor = "var(--gray-a6)"; e.target.style.boxShadow = "none"; }} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder} style={base}
            onFocus={(e) => { e.target.style.borderColor = "var(--blue-8)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,.18)"; }}
            onBlur={(e)  => { e.target.style.borderColor = "var(--gray-a6)"; e.target.style.boxShadow = "none"; }} />
      }
    </Field>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ShopProfile() {
  const [shop,          setShop]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [editMode,      setEditMode]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [form,          setForm]          = useState({ name: "", description: "", location: "" });
  const [newStatus,     setNewStatus]     = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [toast,         setToast]         = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const fetchShop = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await shopProfileApi.get();
      const data = res.data;
      setShop(data);
      setForm({
        name:        data.name        || "",
        description: data.description || "",
        location:    data.location    || "",
      });
    } catch (e) {
      setError(e.message || "فشل في جلب بيانات المتجر");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShop(); }, [fetchShop]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await shopProfileApi.update({
        shopId:      shop.shopId,
        name:        form.name,
        description: form.description,
        location:    form.location,
        status:      shop.status,
        mall:        { mallId: shop.mall?.mallId },
        owner:       { userId: shop.owner?.userId },
      });
      showToast("تم حفظ التغييرات بنجاح ✓");
      setEditMode(false);
      fetchShop();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({
      name:        shop.name        || "",
      description: shop.description || "",
      location:    shop.location    || "",
    });
    setEditMode(false);
  };


  const handleStatusChange = async () => {
    if (!newStatus) return;
    setStatusLoading(true);
    try {
      await shopProfileApi.requestStatusChange(newStatus);
      showToast("تم إرسال طلب تغيير الحالة بنجاح");
      setNewStatus("");
      fetchShop();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div dir="rtl" className="space-y-6 p-3 sm:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row-reverse justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <button onClick={fetchShop} disabled={loading}
              className="px-4 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 transition hover:opacity-80 disabled:opacity-50"
              style={{ borderColor: "var(--gray-a7)", background: "transparent", color: "var(--gray-12)" }}>
              {loading ? <Spinner size={14} /> : <FiRefreshCw size={14} />} تحديث
            </button>
            {!editMode
              ? <button onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition"
                  style={{ background: "#2563eb", color: "#fff" }}>
                  <FiEdit2 size={14} /> تعديل البيانات
                </button>
              : <>
                  <button onClick={handleCancelEdit}
                    className="px-4 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 transition hover:opacity-80"
                    style={{ borderColor: "var(--gray-a7)", background: "transparent", color: "var(--gray-12)" }}>
                    <FiX size={14} /> إلغاء
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                    style={{ background: "#16a34a", color: "#fff" }}>
                    {saving ? <Spinner size={14} /> : <FiSave size={14} />} حفظ التغييرات
                  </button>
                </>
            }
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>ملف المتجر</h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--gray-11)" }}>
              عرض وتعديل بيانات متجرك
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl px-5 py-3 flex items-center justify-between gap-3"
            style={{ background: "var(--red-2)", border: "1px solid var(--red-6)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--red-11)" }}>
              <FiAlertCircle size={15} /> {error}
            </div>
            <button onClick={fetchShop} className="text-xs font-semibold underline flex-shrink-0"
              style={{ color: "var(--red-11)" }}>إعادة المحاولة</button>
          </div>
        )}

        {loading && !shop ? (
          <div className="flex items-center justify-center py-24 gap-3" style={{ color: "var(--gray-10)" }}>
            <Spinner size={24} /> جاري التحميل...
          </div>
        ) : shop && (
          <>
            {/* Shop Identity Card */}
            <div className="rounded-2xl p-6" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a7)" }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Logo */}
                <div className="h-20 w-20 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl"
                  style={{ background: "var(--gray-a3)", border: "1px solid var(--gray-a6)" }}>
                  {shop.logoUrl
                    ? <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-cover" />
                    : "🏪"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>{shop.name}</h2>
                    <StatusBadge status={shop.status} />
                    {shop.category && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                        {CATEGORY_LABELS[shop.category] || shop.category}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm" style={{ color: "var(--gray-11)" }}>
                    {shop.mall?.name && (
                      <span className="flex items-center gap-1.5">
                        <FiShoppingBag size={13} /> {shop.mall.name}
                      </span>
                    )}
                    {shop.owner?.username && (
                      <span className="flex items-center gap-1.5">
                        <FiUser size={13} /> {shop.owner.username}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "var(--gray-10)" }}>#{shop.shopId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Details */}
            <div className="rounded-2xl p-6 space-y-5" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a7)" }}>
              <h3 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>بيانات المتجر</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {editMode
                  ? <EditInput label="اسم المتجر" icon={FiShoppingBag} value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="اسم المتجر" />
                  : <ReadonlyField label="اسم المتجر" icon={FiShoppingBag} value={shop.name} />
                }
                {editMode
                  ? <EditInput label="الموقع" icon={FiMapPin} value={form.location} onChange={(v) => setForm((p) => ({ ...p, location: v }))} placeholder="مثال: الطابق 2، المنطقة B" />
                  : <ReadonlyField label="الموقع" icon={FiMapPin} value={shop.location} />
                }
                <ReadonlyField label="رقم الهاتف"        icon={FiPhone}  value={shop.contactInfo?.phone || null} />
                <ReadonlyField label="البريد الإلكتروني" icon={FiMail}   value={shop.contactInfo?.email || null} />
              </div>

              {/* Description — full width */}
              <div>
                {editMode
                  ? <EditInput label="الوصف" icon={FiFileText} value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="وصف مختصر لمتجرك..." multiline />
                  : <ReadonlyField label="الوصف" icon={FiFileText} value={shop.description} />
                }
              </div>
            </div>

            {/* Status Change */}
            <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a7)" }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>طلب تغيير الحالة</h3>
                <p className="text-sm mt-1" style={{ color: "var(--gray-11)" }}>
                  الحالة الحالية: <StatusBadge status={shop.status} />
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <StatusDropdown
                  value={newStatus}
                  onChange={setNewStatus}
                  options={SHOP_STATUSES.filter((s) => s !== shop.status).map((s) => ({ value: s, label: SHOP_STATUS_LABELS[s] }))}
                />

                <button
                  onClick={handleStatusChange}
                  disabled={!newStatus || statusLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90 disabled:opacity-40"
                  style={{ background: "#2563eb", color: "#fff" }}
                >
                  {statusLoading ? <Spinner size={14} /> : null}
                  إرسال الطلب
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
