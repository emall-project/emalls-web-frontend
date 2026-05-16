import React, { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  FiEdit2, FiSave, FiX, FiRefreshCw, FiAlertCircle,
  FiMapPin, FiPhone, FiMail, FiFileText, FiShoppingBag,
  FiUser, FiChevronDown, FiHash, FiImage,
  FiCheckCircle, FiAlertTriangle,
} from "react-icons/fi";
import { shopProfileApi } from "./api";
import { auth } from "../../../api/auth";
import { SHOP_STATUS_LABELS, SHOP_STATUS_COLORS, SHOP_STATUSES, CATEGORY_LABELS } from "./constants";
import MediaSection from "./MediaSection";

function getInitials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "S";
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 16, color = "var(--blue-9)" }) {
  return (
    <svg className="animate-spin flex-shrink-0" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--gray-a5)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const MiniSpinner = () => (
  <svg className="animate-spin w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="var(--gray-a5)" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const ok = type === "success";
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium max-w-sm"
      style={{
        background:  ok ? "var(--green-2)" : "var(--red-2)",
        borderColor: ok ? "var(--green-6)" : "var(--red-6)",
        color:       ok ? "var(--green-11)" : "var(--red-11)",
      }}
    >
      {ok ? <FiCheckCircle size={15} /> : <FiAlertTriangle size={15} />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 flex-shrink-0"><FiX size={13} /></button>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, size = "sm" }) {
  const s = SHOP_STATUS_COLORS[status] || { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" };
  const isLg = size === "lg";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${isLg ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs"}`}
      style={{ background: s.bg, color: s.fg }}
    >
      <span className={isLg ? "w-2 h-2" : "w-1.5 h-1.5"} style={{ borderRadius: "50%", background: s.dot, flexShrink: 0, display: "inline-block" }} />
      {SHOP_STATUS_LABELS[status] || status}
    </span>
  );
}

// ── Skeleton page ─────────────────────────────────────────────────────────────
function Pulse({ className = "", style = {} }) {
  return <div className={`animate-pulse rounded-xl ${className}`} style={{ background: "var(--gray-a3)", ...style }} />;
}

function SkeletonPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2"><Pulse className="h-7 w-36" /><Pulse className="h-4 w-52" /></div>
        <div className="flex gap-2"><Pulse className="h-9 w-24" /><Pulse className="h-9 w-32" /></div>
      </div>
      <div className="rounded-2xl p-6 border" style={{ borderColor: "var(--gray-a6)" }}>
        <div className="flex items-center gap-5">
          <Pulse className="w-20 h-20 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Pulse className="h-6 w-48" />
            <div className="flex gap-2"><Pulse className="h-5 w-16 rounded-full" /><Pulse className="h-5 w-20 rounded-full" /></div>
            <Pulse className="h-4 w-72" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--gray-a6)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
          <Pulse className="h-5 w-32" />
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2"><Pulse className="h-4 w-20" /><Pulse className="h-10" /></div>
            ))}
          </div>
          <div className="space-y-2"><Pulse className="h-4 w-16" /><Pulse className="h-24" /></div>
        </div>
      </div>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, icon: Icon, iconAccent, children }) {
  const accentBg   = iconAccent ? `${iconAccent}22` : "var(--blue-a3)";
  const accentText = iconAccent || "var(--blue-11)";
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
      <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
        {Icon && (
          <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: accentBg }}>
            <Icon size={15} style={{ color: accentText }} />
          </span>
        )}
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
        {Icon && <Icon size={11} />}{label}
      </label>
      {children}
    </div>
  );
}

function ReadonlyValue({ value, mono = false }) {
  return (
    <div
      className="rounded-xl px-4 py-2.5 text-sm min-h-[40px] flex items-center"
      style={{
        background: "var(--gray-a2)",
        border: "1px solid var(--gray-a5)",
        color: value ? "var(--gray-12)" : "var(--gray-9)",
        fontFamily: mono ? "monospace" : undefined,
        direction: mono ? "ltr" : "rtl",
        textAlign: mono ? "left" : "right",
      }}
    >
      {value || "—"}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all"
      style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl" }}
      onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,.18)"; }}
      onBlur={e  => { e.target.style.borderColor = "var(--gray-a6)"; e.target.style.boxShadow = "none"; }}
    />
  );
}

function TextareaInput({ value, onChange, placeholder }) {
  return (
    <textarea
      rows={4}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none border transition-all"
      style={{
        background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)",
        direction: "rtl", resize: "vertical", lineHeight: 1.75,
      }}
      onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,.18)"; }}
      onBlur={e  => { e.target.style.borderColor = "var(--gray-a6)"; e.target.style.boxShadow = "none"; }}
    />
  );
}

// ── Status dropdown ───────────────────────────────────────────────────────────
function StatusDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  useEffect(() => {
    const fn = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm border transition-all outline-none"
        style={{
          background:  "var(--gray-a2)",
          borderColor: open ? "#2563eb" : "var(--gray-a6)",
          color:       selected ? "var(--gray-12)" : "var(--gray-9)",
          boxShadow:   open ? "0 0 0 3px rgba(37,99,235,.18)" : "none",
        }}
      >
        <span className="flex items-center gap-2">
          {selected && (
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: SHOP_STATUS_COLORS[selected.value]?.dot }} />
          )}
          {selected?.label || "اختر الحالة الجديدة..."}
        </span>
        <FiChevronDown size={13} style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0)", color: "var(--gray-9)" }} />
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 left-0 z-50 rounded-xl overflow-hidden"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 8px 32px rgba(0,0,0,.18)" }}>
          <div className="p-1.5 space-y-0.5">
            {options.map(opt => {
              const c = SHOP_STATUS_COLORS[opt.value];
              const isActive = value === opt.value;
              return (
                <button key={opt.value} type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-right"
                  style={{ background: isActive ? "var(--blue-a3)" : "transparent", color: isActive ? "var(--blue-11)" : "var(--gray-12)" }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--gray-a3)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
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

// ── Confirm dialog (status change) ───────────────────────────────────────────
function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, loading, confirmLabel = "تأكيد" }) {
  const container = document.querySelector(".radix-themes") || document.body;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-2xl p-6 outline-none space-y-4"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}
          aria-describedby="confirm-desc"
        >
          <div>
            <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>{title}</Dialog.Title>
            <Dialog.Description id="confirm-desc" className="text-sm mt-1.5" style={{ color: "var(--gray-10)" }}>
              {description}
            </Dialog.Description>
          </div>
          <div className="flex gap-3">
            <Dialog.Close asChild>
              <button className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition hover:opacity-80"
                style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)", background: "transparent" }}>
                إلغاء
              </button>
            </Dialog.Close>
            <button
              onClick={onConfirm} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "#2563eb", color: "#fff" }}
            >
              {loading && <MiniSpinner />}
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ShopProfile() {
  const shopId = auth.getShopId();

  const [shop,    setShop]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ name: "", description: "", location: "" });

  // Media state (owned here so save() can include them)
  const [logoUuid,        setLogoUuid]        = useState("");
  const [logoPreview,     setLogoPreview]     = useState("");
  const [logoUploading,   setLogoUploading]   = useState(false);
  const [shopPhotos,      setShopPhotos]      = useState([]);
  const [photosUploading, setPhotosUploading] = useState(false);

  // Status change
  const [newStatus,         setNewStatus]         = useState("");
  const [statusLoading,     setStatusLoading]     = useState(false);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const populateFromData = useCallback((data) => {
    setForm({ name: data.name || "", description: data.description || "", location: data.location || "" });
    setLogoUuid(data.logoUuid || "");
    setLogoPreview(data.logoUrl || data.logoImage?.mediumFileUrl || data.logoImage?.originalFileUrl || "");
    setShopPhotos((data.shopPhotos || []).map(p => ({
      uuid:    p.uuid || p.id,
      preview: p.originalFileUrl || p.mediumFileUrl || "",
    })));
  }, []);

  const fetchShop = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await shopProfileApi.get();
      setShop(res.data);
      populateFromData(res.data);
    } catch (e) {
      setError(e.message || "فشل في جلب بيانات المتجر");
    } finally {
      setLoading(false);
    }
  }, [populateFromData]);

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
        ...(logoUuid ? { logoUuid } : {}),
        ...(shopPhotos.length ? { shopPhotosUuids: shopPhotos.map(p => p.uuid) } : {}),
      });
      showToast("تم حفظ التغييرات بنجاح");
      setEditMode(false);
      fetchShop();
    } catch (e) {
      showToast(e.message || "فشل الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (shop) populateFromData(shop);
    setEditMode(false);
  };

  const handleStatusChange = async () => {
    setStatusLoading(true);
    try {
      await shopProfileApi.requestStatusChange(newStatus);
      showToast("تم إرسال طلب تغيير الحالة بنجاح");
      setNewStatus("");
      setConfirmStatusOpen(false);
      fetchShop();
    } catch (e) {
      showToast(e.message || "فشل إرسال الطلب", "error");
    } finally {
      setStatusLoading(false);
    }
  };

  const initials = getInitials(shop?.name || "");

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmDialog
        open={confirmStatusOpen}
        onOpenChange={setConfirmStatusOpen}
        title="تأكيد طلب تغيير الحالة"
        description={`هل تريد إرسال طلب لتغيير حالة المتجر إلى "${SHOP_STATUS_LABELS[newStatus] || newStatus}"؟ سيتم مراجعة الطلب من قبل الإدارة.`}
        onConfirm={handleStatusChange}
        loading={statusLoading}
        confirmLabel="إرسال الطلب"
      />

      <div dir="rtl" className="space-y-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>ملف المتجر</h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--gray-10)" }}>عرض وتعديل بيانات متجرك</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchShop} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:opacity-80 disabled:opacity-50"
              style={{ borderColor: "var(--gray-a6)", background: "transparent", color: "var(--gray-11)" }}
            >
              {loading ? <Spinner size={13} /> : <FiRefreshCw size={13} />}
              تحديث
            </button>

            {!editMode ? (
              <button
                onClick={() => setEditMode(true)} disabled={!shop}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "#2563eb", color: "#fff" }}
              >
                <FiEdit2 size={13} /> تعديل البيانات
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                  style={{ borderColor: "var(--gray-a6)", background: "transparent", color: "var(--gray-11)" }}
                >
                  <FiX size={13} /> إلغاء
                </button>
                <button
                  onClick={handleSave} disabled={saving || logoUploading || photosUploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#16a34a", color: "#fff" }}
                >
                  {saving ? <Spinner size={13} color="#fff" /> : <FiSave size={13} />}
                  حفظ التغييرات
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="rounded-2xl px-5 py-3.5 flex items-center justify-between gap-3"
            style={{ background: "var(--red-2)", border: "1px solid var(--red-5)" }}>
            <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--red-11)" }}>
              <FiAlertCircle size={15} /> {error}
            </div>
            <button onClick={fetchShop} className="text-xs font-bold underline flex-shrink-0"
              style={{ color: "var(--red-11)" }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* ── Skeleton ── */}
        {loading && !shop && <SkeletonPage />}

        {/* ── Content ── */}
        {shop && (
          <>
            {/* ── Overview card ── */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div
                  className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                  style={{
                    background: logoPreview ? undefined : "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                    border: "1px solid var(--gray-a5)",
                  }}
                >
                  {logoPreview
                    ? <img src={logoPreview} alt={shop.name} className="w-full h-full object-cover" />
                    : initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h2 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>{shop.name}</h2>
                    <StatusBadge status={shop.status} />
                    {shop.category && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                        {CATEGORY_LABELS[shop.category] || shop.category}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm" style={{ color: "var(--gray-10)" }}>
                    {shop.mall?.name && (
                      <span className="flex items-center gap-1.5"><FiShoppingBag size={12} /> {shop.mall.name}</span>
                    )}
                    {(shop.owner?.fullName || shop.owner?.username) && (
                      <span className="flex items-center gap-1.5"><FiUser size={12} /> {shop.owner.fullName || shop.owner.username}</span>
                    )}
                    <span className="flex items-center gap-1 font-mono text-xs" style={{ color: "var(--gray-9)" }}>
                      <FiHash size={11} />{shop.shopId}
                    </span>
                  </div>
                  {shop.description && (
                    <p className="mt-2 text-sm leading-relaxed line-clamp-2" style={{ color: "var(--gray-9)" }}>
                      {shop.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Store data form ── */}
            <SectionCard
              title="بيانات المتجر"
              subtitle="المعلومات الأساسية ومعلومات التواصل"
              icon={FiShoppingBag}
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="اسم المتجر" icon={FiShoppingBag}>
                    {editMode
                      ? <TextInput value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="اسم المتجر" />
                      : <ReadonlyValue value={shop.name} />}
                  </Field>
                  <Field label="الموقع في المول" icon={FiMapPin}>
                    {editMode
                      ? <TextInput value={form.location} onChange={v => setForm(p => ({ ...p, location: v }))} placeholder="الطابق 2، منطقة B" />
                      : <ReadonlyValue value={shop.location} />}
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="رقم الهاتف" icon={FiPhone}>
                    <ReadonlyValue value={shop.contactInfo?.phone} />
                  </Field>
                  <Field label="البريد الإلكتروني" icon={FiMail}>
                    <ReadonlyValue value={shop.contactInfo?.email} mono />
                  </Field>
                </div>
                <Field label="الوصف" icon={FiFileText}>
                  {editMode
                    ? <TextareaInput value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} placeholder="وصف مختصر عن متجرك..." />
                    : <ReadonlyValue value={shop.description} />}
                </Field>
              </div>
            </SectionCard>

            {/* ── Media manager ── */}
            <SectionCard
              title="إدارة الوسائط"
              subtitle="شعار المتجر وصوره"
              icon={FiImage}
              iconAccent="#7c3aed"
            >
              <MediaSection
                shop={shop}
                shopId={shopId}
                editMode={editMode}
                logoUuid={logoUuid}           setLogoUuid={setLogoUuid}
                logoPreview={logoPreview}     setLogoPreview={setLogoPreview}
                logoUploading={logoUploading} setLogoUploading={setLogoUploading}
                shopPhotos={shopPhotos}       setShopPhotos={setShopPhotos}
                photosUploading={photosUploading} setPhotosUploading={setPhotosUploading}
                showToast={showToast}
              />
            </SectionCard>

            {/* ── Status change ── */}
            <SectionCard
              title="طلب تغيير الحالة"
              subtitle="إرسال طلب لمراجعته من قبل الإدارة"
              icon={FiAlertTriangle}
              iconAccent="#d97706"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: "var(--gray-10)" }}>الحالة الحالية:</span>
                  <StatusBadge status={shop.status} size="lg" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-full sm:max-w-xs">
                    <StatusDropdown
                      value={newStatus}
                      onChange={setNewStatus}
                      options={SHOP_STATUSES.filter(s => s !== shop.status).map(s => ({ value: s, label: SHOP_STATUS_LABELS[s] }))}
                    />
                  </div>
                  <button
                    onClick={() => { if (newStatus) setConfirmStatusOpen(true); }}
                    disabled={!newStatus || statusLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-40 flex-shrink-0"
                    style={{ background: "#2563eb", color: "#fff" }}
                  >
                    {statusLoading ? <Spinner size={14} color="#fff" /> : null}
                    إرسال الطلب
                  </button>
                </div>
                <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                  * يتم مراجعة طلبات تغيير الحالة من قبل الإدارة قبل تطبيقها
                </p>
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </>
  );
}
