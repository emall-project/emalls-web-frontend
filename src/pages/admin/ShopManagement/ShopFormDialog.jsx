import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAlertCircle, FiChevronDown, FiCheck } from "react-icons/fi";
import { shopsApi, mallsApi } from "./api";
import { SHOP_STATUSES, SHOP_STATUS_LABELS, SHOP_CATEGORIES, CATEGORY_LABELS } from "./constants";

function useThemeContainer() {
  const [c, setC] = React.useState(null);
  React.useEffect(() => { setC(document.querySelector(".radix-themes") || document.body); }, []);
  return c;
}

function Spinner({ size = 14 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// Simple select dropdown
function SelectField({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm outline-none border transition-all"
        style={{
          background:   "var(--gray-a2)",
          borderColor:  open ? "var(--blue-8)" : "var(--gray-a6)",
          color:        selected ? "var(--gray-12)" : "var(--gray-9)",
          direction:    "rtl",
          boxShadow:    open ? "0 0 0 2px var(--blue-a4)" : "none",
        }}>
        <span>{selected?.label || placeholder}</span>
        <FiChevronDown size={13} style={{ color: "var(--gray-9)", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 left-0 z-[10020] rounded-xl overflow-hidden max-h-52 overflow-y-auto"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 8px 32px rgba(0,0,0,.25)" }}>
          {options.map((opt) => (
            <button key={opt.value} type="button"
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-right transition-colors hover:bg-black/5"
              style={{ color: "var(--gray-12)", direction: "rtl" }}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.dot && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.dot }} />}
              <span className="flex-1">{opt.label}</span>
              {value === opt.value && <FiCheck size={12} style={{ color: "var(--blue-9)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShopFormDialog({ open, onOpenChange, shop = null, onSuccess }) {
  const themeContainer = useThemeContainer();
  const isEdit         = !!shop;
  const bodyRef        = useRef(null);

  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [malls,        setMalls]        = useState([]);
  const [loadingMalls, setLoadingMalls] = useState(false);

  // Form fields
  const [name,        setName]        = useState("");
  const [mallId,      setMallId]      = useState("");
  const [ownerId,     setOwnerId]     = useState("");
  const [category,    setCategory]    = useState("");
  const [location,    setLocation]    = useState("");
  const [status,      setStatus]      = useState("ACTIVE");
  const [description, setDescription] = useState("");
  const [logoUrl,     setLogoUrl]     = useState("");
  const [phone,       setPhone]       = useState("");
  const [email,       setEmail]       = useState("");

  // Fetch malls list
  useEffect(() => {
    if (!open) return;
    setLoadingMalls(true);
    mallsApi.getList()
      .then((res) => {
        const list = res?.content || res?.data || [];
        setMalls(Array.isArray(list) ? list : []);
      })
      .catch(() => setMalls([]))
      .finally(() => setLoadingMalls(false));
  }, [open]);

  // Reset / populate
  useEffect(() => {
    if (!open) return;
    if (isEdit && shop) {
      setName(shop.name || "");
      setMallId(String(shop.mall?.mallId || ""));
      setOwnerId(String(shop.owner?.userId || ""));
      setCategory(shop.category || "");
      setLocation(shop.location || "");
      setStatus(shop.status || "ACTIVE");
      setDescription(shop.description || "");
      setLogoUrl(shop.logoUrl || "");
      setPhone(shop.contactInfo?.phone || "");
      setEmail(shop.contactInfo?.email || "");
    } else {
      setName(""); setMallId(""); setOwnerId(""); setCategory("");
      setLocation(""); setStatus("ACTIVE"); setDescription("");
      setLogoUrl(""); setPhone(""); setEmail(""); setError("");
    }
  }, [open, isEdit, shop]);

  const scrollTop = () => { if (bodyRef.current) bodyRef.current.scrollTop = 0; };

  const handleSubmit = async () => {
    if (!name.trim())         { setError("اسم المتجر مطلوب");        return scrollTop(); }
    if (!isEdit && !mallId)   { setError("يجب اختيار المول");         return scrollTop(); }
    if (!isEdit && !ownerId)  { setError("يجب إدخال ID المالك");      return scrollTop(); }

    setError(""); setLoading(true);
    try {
      const contactInfo = {};
      if (phone.trim()) contactInfo.phone = phone.trim();
      if (email.trim()) contactInfo.email = email.trim();

      const body = {
        name:        name.trim(),
        location:    location.trim() || null,
        description: description.trim() || null,
        logoUrl:     logoUrl.trim() || null,
        status,
        ...(category ? { category } : {}),
        ...(Object.keys(contactInfo).length ? { contactInfo } : {}),
      };

      if (isEdit) {
        await shopsApi.update({
          shopId: shop.shopId,
          ...body,
          mall:  mallId  ? { mallId:  Number(mallId)  } : undefined,
          owner: ownerId ? { userId:  Number(ownerId) } : undefined,
        });
      } else {
        await shopsApi.create({
          ...body,
          mall:  { mallId: Number(mallId) },
          owner: { userId: Number(ownerId) },
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError(e.message || "حدث خطأ، حاول مجدداً");
      scrollTop();
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    background:  "var(--gray-a2)",
    borderColor: "var(--gray-a6)",
    color:       "var(--gray-12)",
    direction:   "rtl",
    textAlign:   "right",
  };
  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
  const labelCls = "block text-xs font-semibold mb-1.5";

  const mallOptions = malls.map((m) => ({ value: String(m.mallId || m.id), label: m.name }));
  const statusOptions = SHOP_STATUSES.map((s) => ({ value: s, label: SHOP_STATUS_LABELS[s] }));
  const categoryOptions = [
    { value: "", label: "بدون فئة" },
    ...SHOP_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] || c })),
  ];

  const surface = {
    background: "var(--gray-1)",
    border:     "1px solid var(--gray-a6)",
    boxShadow:  "0 20px 60px rgba(0,0,0,.4)",
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[92vw] max-w-[600px] max-h-[92vh] rounded-2xl flex flex-col outline-none"
          style={surface} aria-describedby={undefined}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b"
            style={{ borderColor: "var(--gray-a6)" }}>
            <div>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                {isEdit ? "تعديل المتجر" : "إضافة متجر جديد"}
              </Dialog.Title>
              <p className="text-xs mt-0.5" style={{ color: "var(--gray-11)" }}>
                {isEdit ? "عدّل بيانات المتجر" : "أدخل بيانات المتجر الجديد"}
              </p>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--gray-11)", background: "transparent", border: "none" }}>
                <FiX size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div ref={bodyRef} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.3)", color: "var(--red-9)" }}>
                <FiAlertCircle size={15} /> {error}
              </div>
            )}

            {/* Name + Mall */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>اسم المتجر *</label>
                <input className={inputCls} style={inp} value={name}
                  onChange={(e) => setName(e.target.value)} placeholder="مثال: Fashion Hub" />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                  المول {!isEdit && <span style={{ color: "var(--red-9)" }}>*</span>}
                </label>
                {loadingMalls ? (
                  <div className="w-full rounded-xl px-4 py-2.5 text-sm border flex items-center gap-2"
                    style={{ ...inp, borderColor: "var(--gray-a6)", opacity: 0.7 }}>
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    <span>جاري تحميل المولات...</span>
                  </div>
                ) : mallOptions.length === 0 ? (
                  <div className="w-full rounded-xl px-4 py-2.5 text-sm border"
                    style={{ ...inp, borderColor: "var(--gray-a6)", color: "var(--red-9)" }}>
                    تعذّر تحميل المولات
                  </div>
                ) : (
                  <SelectField
                    value={mallId} onChange={setMallId}
                    options={mallOptions} placeholder="اختر المول" />
                )}
              </div>
            </div>

            {/* Owner ID + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                  ID المالك {!isEdit && <span style={{ color: "var(--red-9)" }}>*</span>}
                </label>
                <input className={inputCls} style={inp} type="number" value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)} placeholder="مثال: 2" />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الفئة</label>
                <SelectField
                  value={category} onChange={setCategory}
                  options={categoryOptions} placeholder="اختر الفئة" />
              </div>
            </div>

            {/* Location + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الموقع في المول</label>
                <input className={inputCls} style={inp} value={location}
                  onChange={(e) => setLocation(e.target.value)} placeholder="الطابق 1، قسم A" />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الحالة</label>
                <SelectField
                  value={status} onChange={setStatus}
                  options={statusOptions} placeholder="اختر الحالة" />
              </div>
            </div>

            {/* Logo URL */}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>رابط الشعار (URL)</label>
              <input className={inputCls}
                style={{ ...inp, direction: "ltr", textAlign: "left" }}
                value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..." />
            </div>

            {/* Description */}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>الوصف</label>
              <textarea className={inputCls}
                style={{ ...inp, minHeight: 72, resize: "none" }}
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر عن المتجر..." />
            </div>

            {/* Contact */}
            <div className="rounded-xl p-4 space-y-3"
              style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a6)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--gray-11)" }}>معلومات التواصل</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ color: "var(--gray-11)" }}>رقم الهاتف</label>
                  <input className={inputCls}
                    style={{ ...inp, background: "var(--gray-a3)" }}
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+970599..." />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--gray-11)" }}>البريد الإلكتروني</label>
                  <input className={inputCls}
                    style={{ ...inp, background: "var(--gray-a3)", direction: "ltr", textAlign: "left" }}
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@shop.ps" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center  gap-3 flex-shrink-0 border-t"
            style={{ borderColor: "var(--gray-a6)" }}>
              <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#2563eb", color: "#fff" }}>
              {loading ? <Spinner size={14} /> : null}
              {isEdit ? "حفظ التعديلات" : "إنشاء المتجر"}
            </button>
            <Dialog.Close asChild>
              <button className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}>
                إلغاء
              </button>
            </Dialog.Close>
            
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}