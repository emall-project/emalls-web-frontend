import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  FiX, FiAlertCircle, FiPlus, FiTrash2, FiChevronDown, FiChevronUp,
  FiUpload, FiMapPin, FiPhone, FiMail, FiHash, FiImage, FiTool, FiCoffee,
} from "react-icons/fi";
import { mallsApi, citiesApi } from "./api";
import { MALL_STATUSES, STATUS_LABELS } from "./constants";
import { Spinner, CityDropdown } from "./ui";
import { mediaApi } from "../../../api/mediaApi";

// ── Image compression ─────────────────────────────────────────────────────────
const MAX_BYTES = 1.5 * 1024 * 1024;
function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size <= MAX_BYTES && file.type !== "image/bmp") { resolve(file); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("تعذّر ضغط الصورة")); };
    img.onload = () => {
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

function MiniSpinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function useThemeContainer() {
  const [c, setC] = React.useState(null);
  React.useEffect(() => { setC(document.querySelector(".radix-themes") || document.body); }, []);
  return c;
}

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";
const inp = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl", textAlign: "right" };
const labelCls = "block text-xs font-semibold mb-1.5";

// ── Status pill selector ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
  ACTIVE:      { label: "نشط",        color: "var(--green-9)",  bg: "var(--green-a3)",  border: "var(--green-a7)"  },
  MAINTENANCE: { label: "صيانة",      color: "var(--orange-9)", bg: "var(--orange-a3)", border: "var(--orange-a7)" },
  INACTIVE:    { label: "غير نشط",    color: "var(--gray-11)",  bg: "var(--gray-a3)",   border: "var(--gray-a7)"   },

};

function StatusPicker({ value, onChange }) {
  const statuses = MALL_STATUSES.length ? MALL_STATUSES : Object.keys(STATUS_CONFIG);
  return (
    <div className="flex gap-2 flex-wrap">
      {statuses.map((s) => {
        const cfg = STATUS_CONFIG[s] || { label: STATUS_LABELS?.[s] || s, color: "var(--gray-11)", bg: "var(--gray-a3)", border: "var(--gray-a6)" };
        const active = value === s;
        return (
          <button key={s} type="button" onClick={() => onChange(s)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: active ? cfg.bg : "transparent",
              color: active ? cfg.color : "var(--gray-10)",
              border: `1.5px solid ${active ? cfg.border : "var(--gray-a5)"}`,
              boxShadow: active ? `0 0 0 3px ${cfg.bg}` : "none",
            }}>
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Logo upload circle ─────────────────────────────────────────────────────────
function LogoUpload({ preview, uploading, inputRef, onFileChange, onClear }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <div className="relative">
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
          style={{ background: preview ? "transparent" : "var(--blue-a3)", border: `2px dashed ${preview ? "var(--gray-a5)" : "var(--blue-a7)"}` }}
        >
          {uploading ? (
            <MiniSpinner />
          ) : preview ? (
            <img src={preview} alt="logo" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <FiUpload size={18} style={{ color: "var(--blue-9)" }} />
              <span className="text-[10px] font-semibold" style={{ color: "var(--blue-9)" }}>شعار</span>
            </div>
          )}
        </div>
        {preview && !uploading && (
          <button type="button" onClick={onClear}
            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
            style={{ background: "var(--red-9)", color: "#fff" }}>
            <FiX size={10} />
          </button>
        )}
      </div>
      <span className="text-[11px]" style={{ color: "var(--gray-9)" }}>
        {uploading ? "جاري الرفع..." : "اضغط لتغيير الشعار"}
      </span>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, count, collapsible, open, onToggle }) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-xl mb-3 ${collapsible ? "cursor-pointer select-none" : ""}`}
      style={{ background: "var(--gray-a2)" }}
      onClick={collapsible ? onToggle : undefined}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-sm" style={{ color: "var(--blue-9)" }}>{icon}</span>
        <span className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{title}</span>
        {count != null && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
            {count}
          </span>
        )}
      </div>
      {collapsible && (open ? <FiChevronUp size={14} style={{ color: "var(--gray-9)" }} /> : <FiChevronDown size={14} style={{ color: "var(--gray-9)" }} />)}
    </div>
  );
}

// ── Service / Restaurant card ──────────────────────────────────────────────────
function ListItem({ item, index, onChange, onRemove, fields }) {
  return (
    <div className="rounded-xl p-3 space-y-2.5 relative"
      style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
      <button type="button" onClick={() => onRemove(index)}
        className="absolute top-2.5 left-2.5 w-6 h-6 flex items-center justify-center rounded-lg transition hover:opacity-80"
        style={{ background: "var(--red-a3)", color: "var(--red-9)" }}>
        <FiTrash2 size={11} />
      </button>
      <div className="grid grid-cols-2 gap-2 pr-1">
        {fields.map((f) => (
          <div key={f.key} className={f.full ? "col-span-2" : ""}>
            <label className={labelCls} style={{ color: "var(--gray-10)" }}>{f.label}</label>
            {f.type === "checkbox" ? (
              <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
                <input type="checkbox" checked={!!item[f.key]}
                  onChange={(e) => onChange(index, f.key, e.target.checked)}
                  className="w-4 h-4 rounded" style={{ accentColor: "var(--blue-9)" }} />
                <span className="text-xs" style={{ color: "var(--gray-11)" }}>نشط</span>
              </label>
            ) : (
              <input className={inputCls}
                style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)", color: "var(--gray-12)", direction: f.dir || "rtl", textAlign: f.textAlign || "right" }}
                value={item[f.key] || ""} onChange={(e) => onChange(index, f.key, e.target.value)}
                placeholder={f.placeholder || ""} dir={f.dir || "rtl"} maxLength={f.maxLength} />
            )}
            {f.hint ? (
              <p className="mt-1 text-[11px]" style={{ color: "var(--gray-9)" }}>
                {f.hint}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

const SERVICE_FIELDS = [
  { key: "name",        label: "اسم الخدمة *", placeholder: "مثال: موقف سيارات" },
  { key: "description", label: "الوصف",         placeholder: "وصف مختصر...", full: true },
  { key: "isActive",    label: "الحالة",         type: "checkbox" },
];
const RESTAURANT_FIELDS = [
  { key: "name",           label: "اسم المطعم *",   placeholder: "مثال: ماكدونالدز" },
  {
    key: "cuisineType",
    label: "نوع المطبخ",
    placeholder: "مثال: مأكولات سريعة",
    maxLength: 100,
  },
  { key: "description",    label: "الوصف",           placeholder: "وصف مختصر...", full: true },
  { key: "locationInMall", label: "الموقع في المول", placeholder: "مثال: الطابق الثاني" },
  { key: "isActive",       label: "الحالة",           type: "checkbox" },
];

// ── Create City dialog ─────────────────────────────────────────────────────────
export function CreateCityDialog({ open, onOpenChange, onCreated }) {
  const themeContainer = useThemeContainer();
  const [cityName, setCityName] = useState("");
  const [baseFee,  setBaseFee]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => { if (!open) { setCityName(""); setBaseFee(""); setError(""); } }, [open]);

  const handleCreate = async () => {
    if (!cityName.trim()) return setError("اسم المدينة مطلوب");
    setError(""); setLoading(true);
    try {
      const res = await citiesApi.create({ name: cityName.trim(), baseFee: baseFee ? Number(baseFee) : 0, isActive: true });
      onCreated?.(res?.content || res?.data);
      onOpenChange(false);
    } catch (e) { setError(e.message || "فشل إنشاء المدينة"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed z-[10001] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-2xl flex flex-col outline-none"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}
          aria-describedby={undefined}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--gray-a6)" }}>
            <Dialog.Title className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>إضافة مدينة جديدة</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded-lg hover:opacity-70 transition" style={{ color: "var(--gray-11)" }}><FiX size={16} /></button>
            </Dialog.Close>
          </div>
          <div className="px-5 py-4 space-y-3">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: "var(--red-a3)", border: "1px solid var(--red-a6)", color: "var(--red-11)" }}>
                <FiAlertCircle size={13} /> {error}
              </div>
            )}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>اسم المدينة *</label>
              <input className={inputCls} style={inp} value={cityName}
                onChange={(e) => setCityName(e.target.value)} placeholder="مثال: الخليل"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>الرسوم الأساسية</label>
              <input className={inputCls} style={inp} type="number" value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)} placeholder="مثال: 20" />
            </div>
          </div>
          <div className="px-5 py-3 flex gap-2 border-t" style={{ borderColor: "var(--gray-a6)" }}>
            <button onClick={handleCreate} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--blue-9)", color: "#fff" }}>
              {loading ? <Spinner size={13} /> : <FiPlus size={13} />} إنشاء
            </button>
            <Dialog.Close asChild>
              <button className="flex-1 py-2 rounded-xl text-sm font-bold transition hover:opacity-80"
                style={{ border: "1px solid var(--gray-a6)", color: "var(--gray-12)" }}>
                إلغاء
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Main Mall Form Dialog ──────────────────────────────────────────────────────
export default function MallFormDialog({ open, onOpenChange, mall = null, onSuccess }) {
  const themeContainer = useThemeContainer();
  const isEdit         = !!mall;
  const bodyRef        = useRef(null);

  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [cities,         setCities]         = useState([]);
  const [loadingCities,  setLoadingCities]  = useState(false);
  const [createCityOpen, setCreateCityOpen] = useState(false);

  // Fields
  const [name,        setName]        = useState("");
  const [cityId,      setCityId]      = useState("");
  const [location,    setLocation]    = useState("");
  const [capacity,    setCapacity]    = useState("");
  const [status,      setStatus]      = useState("ACTIVE");
  const [description, setDescription] = useState("");
  const [phone,       setPhone]       = useState("");
  const [email,       setEmail]       = useState("");

  // Images
  const [logoUuid,        setLogoUuid]        = useState("");
  const [logoPreview,     setLogoPreview]     = useState("");
  const [logoUploading,   setLogoUploading]   = useState(false);
  const [mallImages,      setMallImages]      = useState([]);
  const [photosUploading, setPhotosUploading] = useState(false);
  const logoInputRef   = useRef(null);
  const photosInputRef = useRef(null);

  // Collapsible sections
  const [contactOpen,     setContactOpen]     = useState(true);
  const [imagesOpen,      setImagesOpen]      = useState(true);
  const [servicesOpen,    setServicesOpen]    = useState(false);
  const [restaurantsOpen, setRestaurantsOpen] = useState(false);

  // Services & Restaurants
  const [services,    setServices]    = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    if (!open) return;
    setLoadingCities(true);
    citiesApi.getAll()
      .then((res) => { const l = res?.content || res?.data || []; setCities(Array.isArray(l) ? l : []); })
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (isEdit && mall) {
      setName(mall.name || ""); setCityId(String(mall.city?.cityId || ""));
      setLocation(mall.location || ""); setCapacity(mall.capacity ?? "");
      setStatus(mall.status || "ACTIVE"); setDescription(mall.description || "");
      setPhone(mall.contactInfo?.phone || ""); setEmail(mall.contactInfo?.email || "");
      setLogoUuid(mall.logoUuid || "");
      setLogoPreview(mall.logoImage?.mediumFileUrl || mall.logoImage?.originalFileUrl || "");
      setMallImages((mall.mallImages || []).map((p) => ({ uuid: p.id, preview: p.mediumFileUrl || p.originalFileUrl || "" })));
      setServices(mall.services?.map(s => ({ name: s.name, description: s.description || "", isActive: s.isActive ?? true })) || []);
      setRestaurants(mall.restaurants?.map(r => ({ name: r.name, cuisineType: r.cuisineType || "", description: r.description || "", locationInMall: r.locationInMall || "", isActive: r.isActive ?? true })) || []);
    } else {
      setName(""); setCityId(""); setLocation(""); setCapacity("");
      setStatus("ACTIVE"); setDescription(""); setPhone(""); setEmail(""); setError("");
      setLogoUuid(""); setLogoPreview(""); setMallImages([]);
      setServices([]); setRestaurants([]);
    }
  }, [open, isEdit, mall]);

  const addService    = () => setServices(p => [...p, { name: "", description: "", isActive: true }]);
  const removeService = (i) => setServices(p => p.filter((_, idx) => idx !== i));
  const updateService = (i, k, v) => setServices(p => p.map((s, idx) => idx === i ? { ...s, [k]: v } : s));

  const addRestaurant    = () => setRestaurants(p => [...p, { name: "", cuisineType: "", description: "", locationInMall: "", isActive: true }]);
  const removeRestaurant = (i) => setRestaurants(p => p.filter((_, idx) => idx !== i));
  const updateRestaurant = (i, k, v) => setRestaurants(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    setLogoUploading(true); setError("");
    try {
      const res = await mediaApi.upload(await compressImage(file));
      setLogoUuid(res.data.id);
      setLogoPreview(res.data.originalFileUrl || res.data.mediumFileUrl || "");
    } catch (err) { setError(err.message || "فشل رفع الشعار"); }
    finally { setLogoUploading(false); }
  };

  const handlePhotosChange = async (e) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    e.target.value = "";
    setPhotosUploading(true); setError("");
    try {
      const results = await Promise.all(files.map(async (f) => {
        const res = await mediaApi.upload(await compressImage(f));
        return { uuid: res.data.id, preview: res.data.originalFileUrl || res.data.mediumFileUrl || "" };
      }));
      setMallImages(prev => [...prev, ...results]);
    } catch (err) { setError(err.message || "فشل رفع الصور"); }
    finally { setPhotosUploading(false); }
  };

  const handleCityCreated = (newCity) => {
    if (!newCity) return;
    setCities(prev => [...prev, newCity]);
    setCityId(String(newCity.cityId));
  };

  const handleSubmit = async () => {
    const scrollTop = () => { if (bodyRef.current) bodyRef.current.scrollTop = 0; };
    if (!name.trim())       { setError("اسم المول مطلوب"); return scrollTop(); }
    if (!isEdit && !cityId) { setError("يجب اختيار المدينة"); return scrollTop(); }
    if (services.find(s => !s.name.trim()))    { setError("اسم الخدمة مطلوب لكل خدمة");   return scrollTop(); }
    if (restaurants.find(r => !r.name.trim())) { setError("اسم المطعم مطلوب لكل مطعم");    return scrollTop(); }
    if (restaurants.find(r => (r.cuisineType || "").trim().length > 100)) {
      setError("نوع المطبخ يجب ألا يتجاوز 100 حرف.");
      return scrollTop();
    }

    setError(""); setLoading(true);
    try {
      const contactInfo = {};
      if (phone.trim()) contactInfo.phone = phone.trim();
      if (email.trim()) contactInfo.email = email.trim();

      const body = {
        name: name.trim(), location: location.trim() || null,
        capacity: capacity ? Number(capacity) : null,
        status, description: description.trim() || null,
        ...(logoUuid ? { logoUuid } : {}),
        ...(mallImages.length ? { mallImagesUuids: mallImages.map(p => p.uuid) } : {}),
        ...(Object.keys(contactInfo).length ? { contactInfo } : {}),
        ...(services.filter(s => s.name.trim()).length ? {
          services: services.filter(s => s.name.trim()).map(s => ({ name: s.name.trim(), description: s.description.trim() || null, isActive: s.isActive }))
        } : {}),
        ...(restaurants.filter(r => r.name.trim()).length ? {
          restaurants: restaurants.filter(r => r.name.trim()).map(r => ({
            name: r.name.trim(), cuisineType: r.cuisineType.trim() || null,
            description: r.description.trim() || null, locationInMall: r.locationInMall.trim() || null, isActive: r.isActive,
          }))
        } : {}),
      };

      if (isEdit) await mallsApi.update({ mallId: mall.mallId, ...body });
      else        await mallsApi.create({ ...body, city: { cityId: Number(cityId) } });

      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError(e.message || "حدث خطأ، حاول مجدداً");
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    } finally { setLoading(false); }
  };

  const anyUploading = logoUploading || photosUploading;

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
        <Dialog.Portal container={themeContainer}>
          <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-[660px] max-h-[92vh] rounded-2xl flex flex-col outline-none"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 24px 64px rgba(0,0,0,.45)" }}
            aria-describedby={undefined}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: "var(--gray-a5)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--blue-a3)" }}>
                  <span className="text-lg">🏬</span>
                </div>
                <div>
                  <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                    {isEdit ? "تعديل المول" : "إضافة مول جديد"}
                  </Dialog.Title>
                  <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                    {isEdit ? "عدّل بيانات المول" : "أدخل بيانات المول الجديد"}
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-xl transition hover:opacity-70"
                  style={{ color: "var(--gray-11)", background: "var(--gray-a3)" }}>
                  <FiX size={16} />
                </button>
              </Dialog.Close>
            </div>

            {/* ── Body ── */}
            <div ref={bodyRef} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                  style={{ background: "var(--red-a3)", border: "1px solid var(--red-a6)", color: "var(--red-11)" }}>
                  <FiAlertCircle size={15} /> <span>{error}</span>
                </div>
              )}

              {/* ── Identity: logo + name + city ── */}
              <div className="flex gap-5 items-start">
                <LogoUpload
                  preview={logoPreview} uploading={logoUploading}
                  inputRef={logoInputRef} onFileChange={handleLogoChange}
                  onClear={() => { setLogoUuid(""); setLogoPreview(""); }}
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                      اسم المول <span style={{ color: "var(--red-9)" }}>*</span>
                    </label>
                    <input className={inputCls} style={inp} value={name}
                      onChange={(e) => setName(e.target.value)} placeholder="مثال: سيتي سنتر" />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                      المدينة {!isEdit && <span style={{ color: "var(--red-9)" }}>*</span>}
                    </label>
                    <CityDropdown value={cityId} onChange={setCityId}
                      cities={cities} loadingCities={loadingCities}
                      onRequestCreate={() => setCreateCityOpen(true)} />
                  </div>
                </div>
              </div>

              {/* ── Details row ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                    <FiMapPin size={11} className="inline ml-1" />الموقع
                  </label>
                  <input className={inputCls} style={inp} value={location}
                    onChange={(e) => setLocation(e.target.value)} placeholder="شارع الإرسال" />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                    <FiHash size={11} className="inline ml-1" />السعة
                  </label>
                  <input className={inputCls} style={{ ...inp, direction: "ltr", textAlign: "left" }}
                    type="number" value={capacity}
                    onChange={(e) => setCapacity(e.target.value)} placeholder="500" />
                </div>
              </div>

              {/* ── Status ── */}
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الحالة</label>
                <StatusPicker value={status} onChange={setStatus} />
              </div>

              {/* ── Description ── */}
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الوصف</label>
                <textarea className={inputCls} style={{ ...inp, minHeight: 80, resize: "none" }}
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر عن المول..." />
              </div>

              {/* ── Contact ── */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--gray-a5)" }}>
                <SectionHeader icon={<FiPhone />} title="معلومات التواصل"
                  collapsible open={contactOpen} onToggle={() => setContactOpen(o => !o)} />
                {contactOpen && (
                  <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                        <FiPhone size={11} className="inline ml-1" />رقم الهاتف
                      </label>
                      <input className={inputCls} style={inp} value={phone}
                        onChange={(e) => setPhone(e.target.value)} placeholder="+970599..." />
                    </div>
                    <div>
                      <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                        <FiMail size={11} className="inline ml-1" />البريد الإلكتروني
                      </label>
                      <input className={inputCls}
                        style={{ ...inp, direction: "ltr", textAlign: "left" }}
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="info@mall.ps" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Mall Images ── */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--gray-a5)" }}>
                <SectionHeader icon={<FiImage />} title="صور المول" count={mallImages.length}
                  collapsible open={imagesOpen} onToggle={() => setImagesOpen(o => !o)} />
                {imagesOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    <input ref={photosInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosChange} />
                    {mallImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {mallImages.map((p, i) => (
                          <div key={i} className="relative rounded-xl overflow-hidden"
                            style={{ aspectRatio: "16/9", border: "1px solid var(--gray-a5)" }}>
                            <img src={p.preview} alt="" className="w-full h-full object-cover" />
                            <button type="button"
                              onClick={() => setMallImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center transition hover:scale-110"
                              style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}>
                              <FiX size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={() => photosInputRef.current?.click()} disabled={photosUploading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                      style={{ background: "var(--gray-a2)", border: "1.5px dashed var(--gray-a7)", color: "var(--gray-10)" }}>
                      {photosUploading
                        ? <><MiniSpinner /><span>جاري رفع الصور...</span></>
                        : <><FiPlus size={14} /><span>إضافة صور للمول</span></>}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Services ── */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--gray-a5)" }}>
                <SectionHeader icon={<FiTool />} title="الخدمات" count={services.length}
                  collapsible open={servicesOpen} onToggle={() => setServicesOpen(o => !o)} />
                {servicesOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {services.length === 0 && (
                      <p className="text-xs text-center py-3" style={{ color: "var(--gray-9)" }}>
                        لا توجد خدمات بعد
                      </p>
                    )}
                    {services.map((s, i) => (
                      <ListItem key={i} item={s} index={i} onChange={updateService} onRemove={removeService} fields={SERVICE_FIELDS} />
                    ))}
                    <button type="button" onClick={addService}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition hover:opacity-80"
                      style={{ background: "var(--blue-a3)", color: "var(--blue-11)", border: "1px dashed var(--blue-a7)" }}>
                      <FiPlus size={12} /> إضافة خدمة
                    </button>
                  </div>
                )}
              </div>

              {/* ── Restaurants ── */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--gray-a5)" }}>
                <SectionHeader icon={<FiCoffee />} title="المطاعم" count={restaurants.length}
                  collapsible open={restaurantsOpen} onToggle={() => setRestaurantsOpen(o => !o)} />
                {restaurantsOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {restaurants.length === 0 && (
                      <p className="text-xs text-center py-3" style={{ color: "var(--gray-9)" }}>
                        لا توجد مطاعم بعد
                      </p>
                    )}
                    {restaurants.map((r, i) => (
                      <ListItem key={i} item={r} index={i} onChange={updateRestaurant} onRemove={removeRestaurant} fields={RESTAURANT_FIELDS} />
                    ))}
                    <button type="button" onClick={addRestaurant}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition hover:opacity-80"
                      style={{ background: "var(--orange-a3)", color: "var(--orange-11)", border: "1px dashed var(--orange-a7)" }}>
                      <FiPlus size={12} /> إضافة مطعم
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-4 flex items-center justify-between border-t flex-shrink-0"
              style={{ borderColor: "var(--gray-a5)" }}>
              <div className="flex items-center gap-2.5">
                <button onClick={handleSubmit} disabled={loading || anyUploading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--blue-9)", color: "#fff" }}>
                  {loading ? <Spinner size={14} /> : null}
                  {isEdit ? "حفظ التعديلات" : "إنشاء المول"}
                </button>
                <Dialog.Close asChild>
                  <button className="px-5 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-80"
                    style={{ border: "1px solid var(--gray-a6)", color: "var(--gray-12)" }}>
                    إلغاء
                  </button>
                </Dialog.Close>
              </div>
              {anyUploading && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--blue-11)" }}>
                  <MiniSpinner /> جاري رفع الصور...
                </div>
              )}
            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <CreateCityDialog open={createCityOpen} onOpenChange={setCreateCityOpen} onCreated={handleCityCreated} />
    </>
  );
}

