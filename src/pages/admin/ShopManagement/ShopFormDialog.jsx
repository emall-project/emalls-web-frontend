import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAlertCircle, FiChevronDown, FiCheck, FiSearch, FiUpload, FiImage } from "react-icons/fi";
import { shopsApi, mallsApi, usersApi } from "./api";
import { mediaApi } from "../../../api/mediaApi";
import { SHOP_CATEGORIES, CATEGORY_LABELS } from "./constants";

// ── Image compression (max 1.5 MB, max 1920px) ────────────────────────────────
const MAX_BYTES = 1.5 * 1024 * 1024;
function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size <= MAX_BYTES && file.type !== "image/bmp") { resolve(file); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("تعذّر ضغط الصورة")); };
    img.onload  = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > 1920 || h > 1920) { const s = Math.min(1920 / w, 1920 / h); w = Math.round(w * s); h = Math.round(h * s); }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      const tryNext = () => canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("تعذّر ضغط الصورة")); return; }
        if (blob.size <= MAX_BYTES || quality <= 0.3)
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        else { quality -= 0.1; tryNext(); }
      }, "image/jpeg", quality);
      tryNext();
    };
    img.src = url;
  });
}

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

const MiniSpinner = () => (
  <svg className="animate-spin w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

// ── Single-image upload block ─────────────────────────────────────────────────
function ImageUploadField({ label, uuid, preview, uploading, onFileChange, onClear, inputRef, hint }) {
  const labelCls = "block text-xs font-semibold mb-1.5";
  return (
    <div>
      <label className={labelCls} style={{ color: "var(--gray-11)" }}>{label}</label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      {preview ? (
        <div className="flex items-center gap-4 p-3 rounded-xl border"
          style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}>
          <img src={preview} alt={label} className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            style={{ border: "1px solid var(--gray-a5)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono truncate" style={{ color: "var(--gray-10)" }}>
              {uuid ? uuid.slice(0, 8) + "..." : ""}
            </p>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              className="mt-1.5 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-80 disabled:opacity-50"
              style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
              {uploading ? <><MiniSpinner /> جاري الرفع...</> : <><FiUpload size={11} /> تغيير</>}
            </button>
          </div>
          <button type="button" onClick={onClear}
            className="p-1.5 rounded-lg hover:opacity-70 transition flex-shrink-0"
            style={{ color: "var(--gray-10)" }}>
            <FiX size={14} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed transition hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}>
          {uploading
            ? <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round"/></svg><span className="text-sm">جاري الرفع...</span></>
            : <><FiUpload size={20} /><span className="text-sm font-medium">{hint || "اضغط للرفع"}</span><span className="text-xs" style={{ color: "var(--gray-9)" }}>PNG, JPG, WEBP</span></>}
        </button>
      )}
    </div>
  );
}

// ── Simple select dropdown ────────────────────────────────────────────────────
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
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm outline-none border transition-all"
        style={{ background: "var(--gray-a2)", borderColor: open ? "var(--blue-8)" : "var(--gray-a6)", color: selected ? "var(--gray-12)" : "var(--gray-9)", direction: "rtl", boxShadow: open ? "0 0 0 2px var(--blue-a4)" : "none" }}>
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
              <span className="flex-1">{opt.label}</span>
              {value === opt.value && <FiCheck size={12} style={{ color: "var(--blue-9)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Owner searchable dropdown ─────────────────────────────────────────────────
function OwnerDropdown({ value, onChange, users, loadingUsers }) {
  const [open, setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const filtered = users.filter((u) =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const selected = users.find((u) => String(u.userId) === String(value));
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm outline-none border transition-all"
        style={{ background: "var(--gray-a2)", borderColor: open ? "var(--blue-8)" : "var(--gray-a6)", color: selected ? "var(--gray-12)" : "var(--gray-9)", direction: "rtl", boxShadow: open ? "0 0 0 2px var(--blue-a4)" : "none" }}>
        <span className="flex items-center gap-2 truncate">
          {loadingUsers
            ? <><MiniSpinner /><span>جاري التحميل...</span></>
            : <span className="truncate">{selected ? `${selected.fullName} (${selected.email || selected.username || ""})` : "اختر المالك"}</span>}
        </span>
        <FiChevronDown size={13} style={{ color: "var(--gray-9)", flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 left-0 z-[10020] rounded-xl overflow-hidden"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 8px 32px rgba(0,0,0,.25)" }}>
          <div className="p-2 border-b" style={{ borderColor: "var(--gray-a5)" }}>
            <div className="relative">
              <FiSearch size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--gray-9)" }} />
              <input className="w-full rounded-lg pr-8 pl-3 py-1.5 text-xs outline-none"
                style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a5)", color: "var(--gray-12)", direction: "rtl", textAlign: "right" }}
                placeholder="ابحث بالاسم أو البريد..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "var(--gray-9)" }}>لا توجد نتائج</p>
            ) : filtered.map((u) => {
              const isActive = String(value) === String(u.userId);
              return (
                <button key={u.userId} type="button"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-right transition-colors hover:bg-black/5"
                  style={{ color: "var(--gray-12)", direction: "rtl", background: isActive ? "var(--blue-a3)" : "transparent" }}
                  onClick={() => { onChange(String(u.userId)); setOpen(false); setSearch(""); }}>
                  <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                    {u.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="font-semibold text-sm truncate">{u.fullName || "—"}</div>
                    <div className="text-[11px] truncate" style={{ color: "var(--gray-10)" }}>{u.email || u.username || `#${u.userId}`}</div>
                  </div>
                  {isActive && <FiCheck size={12} style={{ color: "var(--blue-9)", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────
export default function ShopFormDialog({ open, onOpenChange, shop = null, onSuccess }) {
  const themeContainer  = useThemeContainer();
  const isEdit          = !!shop;
  const bodyRef         = useRef(null);
  const logoInputRef    = useRef(null);
  const licenseInputRef = useRef(null);
  const photosInputRef  = useRef(null);

  // Loading / error
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [malls,            setMalls]            = useState([]);
  const [loadingMalls,     setLoadingMalls]     = useState(false);
  const [users,            setUsers]            = useState([]);
  const [loadingUsers,     setLoadingUsers]     = useState(false);
  const [logoUploading,    setLogoUploading]    = useState(false);
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [photosUploading,  setPhotosUploading]  = useState(false);

  // Fields
  const [name,        setName]        = useState("");
  const [mallId,      setMallId]      = useState("");
  const [ownerId,     setOwnerId]     = useState("");
  const [category,    setCategory]    = useState("");
  const [location,    setLocation]    = useState("");
  const [description, setDescription] = useState("");
  const [phone,       setPhone]       = useState("");
  const [email,       setEmail]       = useState("");
  const [instagram,   setInstagram]   = useState("");

  // Media UUIDs + previews
  const [logoUuid,      setLogoUuid]      = useState("");
  const [logoPreview,   setLogoPreview]   = useState("");
  const [licenseUuid,   setLicenseUuid]   = useState("");
  const [licensePreview,setLicensePreview]= useState("");
  // photos: [{ uuid, preview }]
  const [shopPhotos,    setShopPhotos]    = useState([]);

  // Fetch malls
  useEffect(() => {
    if (!open) return;
    setLoadingMalls(true);
    mallsApi.getList()
      .then((res) => { const list = res?.content || res?.data || []; setMalls(Array.isArray(list) ? list : []); })
      .catch(() => setMalls([]))
      .finally(() => setLoadingMalls(false));
  }, [open]);

  // Fetch users
  useEffect(() => {
    if (!open) return;
    setLoadingUsers(true);
    usersApi.getAll({ size: 100 })
      .then((res) => { const raw = res?.data || res?.content || {}; setUsers(Array.isArray(raw) ? raw : (raw?.content || [])); })
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
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
      setDescription(shop.description || "");
      setPhone(shop.contactInfo?.phone || "");
      setEmail(shop.contactInfo?.email || "");
      setInstagram(shop.contactInfo?.instagram || "");
      setLogoUuid(shop.logoUuid || "");
      setLogoPreview(shop.logoUrl || shop.logoImage?.mediumFileUrl || shop.logoImage?.originalFileUrl || "");
      setLicenseUuid(shop.licenseImageUuid || "");
      setLicensePreview(shop.licenseImage?.originalFileUrl || shop.licenseImage?.mediumFileUrl || "");
      setShopPhotos((shop.shopPhotos || []).map((p) => ({ uuid: p.uuid || p.id, preview: p.originalFileUrl || p.mediumFileUrl || "" })));
    } else {
      setName(""); setMallId(""); setOwnerId(""); setCategory(""); setLocation("");
      setDescription("");
      setPhone(""); setEmail(""); setInstagram("");
      setLogoUuid(""); setLogoPreview("");
      setLicenseUuid(""); setLicensePreview("");
      setShopPhotos([]);
      setError("");
    }
  }, [open, isEdit, shop]);

  const scrollTop = () => { if (bodyRef.current) bodyRef.current.scrollTop = 0; };

  // ── Upload helpers ──────────────────────────────────────────────────────────
  const makeUploadHandler = (setBusy, onDone) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setBusy(true); setError("");
    try {
      const compressed = await compressImage(file);
      const res = await mediaApi.upload(compressed);
      onDone(res.data.id, res.data.originalFileUrl || res.data.mediumFileUrl || "");
    } catch (err) {
      setError(err.message || "فشل رفع الصورة");
    } finally {
      setBusy(false);
    }
  };

  const handleLogoChange    = makeUploadHandler(setLogoUploading,    (uuid, url) => { setLogoUuid(uuid);    setLogoPreview(url);    });
  const handleLicenseChange = makeUploadHandler(setLicenseUploading, (uuid, url) => { setLicenseUuid(uuid); setLicensePreview(url); });

  const handlePhotosChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";
    setPhotosUploading(true); setError("");
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const compressed = await compressImage(file);
          const res = await mediaApi.upload(compressed);
          return { uuid: res.data.id, preview: res.data.originalFileUrl || res.data.mediumFileUrl || "" };
        })
      );
      setShopPhotos((prev) => [...prev, ...results]);
    } catch (err) {
      setError(err.message || "فشل رفع إحدى الصور");
    } finally {
      setPhotosUploading(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim())                          { setError("اسم المتجر مطلوب");           return scrollTop(); }
    if (!isEdit && !mallId)                    { setError("يجب اختيار المول");            return scrollTop(); }
    if (!isEdit && !ownerId)                   { setError("يجب اختيار المالك");           return scrollTop(); }
    if (!isEdit && !licenseUuid)               { setError("صورة الرخصة التجارية مطلوبة"); return scrollTop(); }
    if (!isEdit && shopPhotos.length === 0)    { setError("يجب إضافة صورة واحدة على الأقل للمتجر"); return scrollTop(); }

    setError(""); setLoading(true);
    try {
      const contactInfo = {};
      if (phone.trim())     contactInfo.phone     = phone.trim();
      if (email.trim())     contactInfo.email     = email.trim();
      if (instagram.trim()) contactInfo.instagram = instagram.trim();

      const body = {
        name:        name.trim(),
        location:    location.trim() || null,
        description: description.trim() || null,
        ...(category ? { category } : {}),
        ...(Object.keys(contactInfo).length ? { contactInfo } : {}),
        ...(logoUuid ? { logoUuid }                                                 : {}),
        ...(licenseUuid ? { licenseImageUuid: licenseUuid }                        : {}),
        ...(shopPhotos.length ? { shopPhotosUuids: shopPhotos.map((p) => p.uuid) } : {}),
      };

      if (isEdit) {
        await shopsApi.update({
          shopId: shop.shopId, ...body,
          mall:  mallId  ? { mallId: Number(mallId)  } : undefined,
          owner: ownerId ? { userId: Number(ownerId) } : undefined,
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
    } finally { setLoading(false); }
  };

  const inp      = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl", textAlign: "right" };
  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
  const labelCls = "block text-xs font-semibold mb-1.5";

  const mallOptions     = malls.map((m) => ({ value: String(m.mallId || m.id), label: m.name }));
  const categoryOptions = [{ value: "", label: "بدون فئة" }, ...SHOP_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] || c }))];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[92vw] max-w-[620px] max-h-[92vh] rounded-2xl flex flex-col outline-none"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}
          aria-describedby={undefined}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b" style={{ borderColor: "var(--gray-a6)" }}>
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
          <div ref={bodyRef} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.3)", color: "var(--red-9)" }}>
                <FiAlertCircle size={15} /> {error}
              </div>
            )}

            {/* ── Basic info ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="w-full rounded-xl px-4 py-2.5 text-sm border flex items-center gap-2" style={{ ...inp, opacity: 0.7 }}>
                    <MiniSpinner /><span>جاري تحميل المولات...</span>
                  </div>
                ) : (
                  <SelectField value={mallId} onChange={setMallId} options={mallOptions} placeholder="اختر المول" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                  المالك {!isEdit && <span style={{ color: "var(--red-9)" }}>*</span>}
                </label>
                <OwnerDropdown value={ownerId} onChange={setOwnerId} users={users} loadingUsers={loadingUsers} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الفئة</label>
                <SelectField value={category} onChange={setCategory} options={categoryOptions} placeholder="اختر الفئة" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الموقع في المول</label>
                <input className={inputCls} style={inp} value={location}
                  onChange={(e) => setLocation(e.target.value)} placeholder="الطابق 1، قسم A" />
              </div>
            </div>

            {/* ── Description ── */}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>الوصف</label>
              <textarea className={inputCls} style={{ ...inp, minHeight: 72, resize: "none" }}
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر عن المتجر..." />
            </div>

            {/* ── Contact info ── */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a6)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--gray-11)" }}>معلومات التواصل</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ color: "var(--gray-11)" }}>رقم الهاتف</label>
                  <input className={inputCls} style={{ ...inp, background: "var(--gray-a3)" }}
                    value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+970-599..." />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--gray-11)" }}>البريد الإلكتروني</label>
                  <input className={inputCls} style={{ ...inp, background: "var(--gray-a3)", direction: "ltr", textAlign: "left" }}
                    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@shop.ps" />
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>إنستغرام</label>
                <input className={inputCls} style={{ ...inp, background: "var(--gray-a3)", direction: "ltr", textAlign: "left" }}
                  value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@shopname" />
              </div>
            </div>

            {/* ── Logo ── */}
            <ImageUploadField
              label="شعار المتجر"
              uuid={logoUuid}
              preview={logoPreview}
              uploading={logoUploading}
              onFileChange={handleLogoChange}
              onClear={() => { setLogoUuid(""); setLogoPreview(""); }}
              inputRef={logoInputRef}
              hint="اضغط لرفع شعار المتجر"
            />

            {/* ── License image ── */}
            <ImageUploadField
              label="صورة الرخصة التجارية"
              uuid={licenseUuid}
              preview={licensePreview}
              uploading={licenseUploading}
              onFileChange={handleLicenseChange}
              onClear={() => { setLicenseUuid(""); setLicensePreview(""); }}
              inputRef={licenseInputRef}
              hint="اضغط لرفع صورة الرخصة"
            />

            {/* ── Shop photos ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls} style={{ color: "var(--gray-11)", marginBottom: 0 }}>صور المتجر</label>
                <button type="button" onClick={() => photosInputRef.current?.click()} disabled={photosUploading}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-80 disabled:opacity-50"
                  style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                  {photosUploading ? <><MiniSpinner /> جاري الرفع...</> : <><FiUpload size={11} /> إضافة صور</>}
                </button>
              </div>
              <input ref={photosInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosChange} />

              {shopPhotos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {shopPhotos.map((p, i) => (
                    <div key={p.uuid} className="relative group rounded-xl overflow-hidden aspect-square"
                      style={{ background: "var(--gray-a3)", border: "1px solid var(--gray-a5)" }}>
                      {p.preview
                        ? <img src={p.preview} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><FiImage size={20} style={{ color: "var(--gray-9)" }} /></div>}
                      <button type="button"
                        onClick={() => setShopPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        style={{ background: "rgba(0,0,0,.65)", color: "#fff" }}>
                        <FiX size={10} />
                      </button>
                    </div>
                  ))}
                  {photosUploading && (
                    <div className="rounded-xl aspect-square flex items-center justify-center"
                      style={{ background: "var(--gray-a3)", border: "1px dashed var(--gray-a6)" }}>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => photosInputRef.current?.click()} disabled={photosUploading}
                  className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed transition hover:opacity-80 disabled:opacity-50"
                  style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}>
                  {photosUploading
                    ? <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round"/></svg><span className="text-sm">جاري الرفع...</span></>
                    : <><FiImage size={20} /><span className="text-sm font-medium">اضغط لإضافة صور المتجر</span><span className="text-xs" style={{ color: "var(--gray-9)" }}>يمكن اختيار أكثر من صورة</span></>}
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0 border-t" style={{ borderColor: "var(--gray-a6)" }}>
            <Dialog.Close asChild>
              <button className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}>
                إلغاء
              </button>
            </Dialog.Close>
            <button onClick={handleSubmit} disabled={loading || logoUploading || licenseUploading || photosUploading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#2563eb", color: "#fff" }}>
              {loading ? <Spinner size={14} /> : null}
              {isEdit ? "حفظ التعديلات" : "إنشاء المتجر"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
