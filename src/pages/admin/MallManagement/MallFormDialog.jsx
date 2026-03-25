import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAlertCircle, FiPlus, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { mallsApi, citiesApi } from "./api";
import { MALL_STATUSES, STATUS_LABELS } from "./constants";
import { Spinner, CityDropdown } from "./ui";

function useThemeContainer() {
  const [container, setContainer] = React.useState(null);
  React.useEffect(() => {
    setContainer(document.querySelector(".radix-themes") || document.body);
  }, []);
  return container;
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const dialogSurface = {
  background: "var(--gray-1)",
  border:     "1px solid var(--gray-a6)",
  boxShadow:  "0 20px 60px rgba(0,0,0,.4)",
};
const inp = {
  background:  "var(--gray-a2)",
  borderColor: "var(--gray-a6)",
  color:       "var(--gray-12)",
  direction:   "rtl",
  textAlign:   "right",
};
const inpSection = {
  background:  "var(--gray-a3)",
  borderColor: "var(--gray-a6)",
  color:       "var(--gray-12)",
  direction:   "rtl",
  textAlign:   "right",
};
const inputCls =
  "w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all " +
  "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
const labelCls = "block text-xs font-semibold mb-1.5";

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, icon, children, collapsible = false }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--gray-a6)" }}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-opacity hover:opacity-80"
        style={{ background: "var(--gray-a2)", color: "var(--gray-12)" }}
        onClick={() => collapsible && setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">{icon} {title}</span>
        {collapsible && (open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />)}
      </button>
      {(!collapsible || open) && (
        <div className="p-4 space-y-3" style={{ background: "var(--gray-a1, var(--gray-1))" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Dynamic list item (service or restaurant) ──────────────────────────────────
function ListItem({ item, index, onChange, onRemove, fields }) {
  return (
    <div className="rounded-xl p-3 space-y-2 relative"
      style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a5)" }}>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-2 left-2 p-1 rounded-lg transition-opacity hover:opacity-70"
        style={{ color: "var(--red-9)", background: "transparent", border: "none" }}
        title="حذف"
      >
        <FiTrash2 size={13} />
      </button>

      <div className="grid grid-cols-2 gap-2 pr-1">
        {fields.map((f) => (
          <div key={f.key} className={f.full ? "col-span-2" : ""}>
            <label className={labelCls} style={{ color: "var(--gray-10)" }}>{f.label}</label>
            {f.type === "checkbox" ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!item[f.key]}
                  onChange={(e) => onChange(index, f.key, e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "var(--blue-9)" }}
                />
                <span className="text-xs" style={{ color: "var(--gray-11)" }}>نشط</span>
              </label>
            ) : (
              <input
                className={inputCls}
                style={inpSection}
                value={item[f.key] || ""}
                onChange={(e) => onChange(index, f.key, e.target.value)}
                placeholder={f.placeholder || ""}
                dir="rtl"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SERVICE fields config ──────────────────────────────────────────────────────
const SERVICE_FIELDS = [
  { key: "name",        label: "اسم الخدمة *",  placeholder: "مثال: موقف سيارات" },
  { key: "description", label: "الوصف",          placeholder: "وصف مختصر...", full: true },
  { key: "isActive",    label: "الحالة",          type: "checkbox" },
];

// ── RESTAURANT fields config ───────────────────────────────────────────────────
const RESTAURANT_FIELDS = [
  { key: "name",            label: "اسم المطعم *",   placeholder: "مثال: ماكدونالدز" },
  { key: "cuisineType",     label: "نوع المطبخ",     placeholder: "مثال: Fast Food" },
  { key: "description",     label: "الوصف",           placeholder: "وصف مختصر...", full: true },
  { key: "locationInMall",  label: "الموقع في المول", placeholder: "مثال: الطابق الثاني" },
  { key: "isActive",        label: "الحالة",           type: "checkbox" },
];

// ── Create City mini-dialog ────────────────────────────────────────────────────
export function CreateCityDialog({ open, onOpenChange, onCreated }) {
  const themeContainer = useThemeContainer();
  const [cityName, setCityName] = useState("");
  const [baseFee,  setBaseFee]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!open) { setCityName(""); setBaseFee(""); setError(""); }
  }, [open]);

  const handleCreate = async () => {
    if (!cityName.trim()) return setError("اسم المدينة مطلوب");
    setError(""); setLoading(true);
    try {
      const res = await citiesApi.create({
        name: cityName.trim(), baseFee: baseFee ? Number(baseFee) : 0, isActive: true,
      });
      onCreated?.(res?.content || res?.data);
      onOpenChange(false);
    } catch (e) {
      setError(e.message || "فشل إنشاء المدينة");
    } finally { setLoading(false); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-[10001] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[90vw] max-w-[400px] rounded-2xl flex flex-col outline-none"
          style={dialogSurface} aria-describedby={undefined}>
          <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <Dialog.Title className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
              إضافة مدينة جديدة
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--gray-11)", background: "transparent", border: "none" }}>
                <FiX size={16} />
              </button>
            </Dialog.Close>
          </div>
          <div className="px-5 py-4 space-y-3">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.3)", color: "var(--red-9)" }}>
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
          <div className="px-5 py-3 flex items-center gap-2 border-t flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <button onClick={handleCreate} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#2563eb", color: "#fff" }}>
              {loading ? <Spinner size={12} /> : <FiPlus size={12} />} إنشاء المدينة
            </button>
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-80"
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

// ── Main Mall Form Dialog ──────────────────────────────────────────────────────
export default function MallFormDialog({ open, onOpenChange, mall = null, onSuccess }) {
  const themeContainer   = useThemeContainer();
  const isEdit           = !!mall;
  const bodyRef          = React.useRef(null);

  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [cities,         setCities]         = useState([]);
  const [loadingCities,  setLoadingCities]  = useState(false);
  const [createCityOpen, setCreateCityOpen] = useState(false);

  // Basic fields
  const [name,        setName]        = useState("");
  const [cityId,      setCityId]      = useState("");
  const [location,    setLocation]    = useState("");
  const [capacity,    setCapacity]    = useState("");
  const [status,      setStatus]      = useState("ACTIVE");
  const [description, setDescription] = useState("");
  const [logoUrl,     setLogoUrl]     = useState("");
  const [phone,       setPhone]       = useState("");
  const [email,       setEmail]       = useState("");

  // Services & Restaurants
  const [services,     setServices]     = useState([]);
  const [restaurants,  setRestaurants]  = useState([]);

  // Fetch cities
  useEffect(() => {
    if (!open) return;
    setLoadingCities(true);
    citiesApi.getAll()
      .then((res) => {
        const list = res?.content || res?.data || [];
        setCities(Array.isArray(list) ? list : []);
      })
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [open]);

  // Populate / reset
  useEffect(() => {
    if (!open) return;
    if (isEdit && mall) {
      setName(mall.name || "");
      setCityId(String(mall.city?.cityId || ""));
      setLocation(mall.location || "");
      setCapacity(mall.capacity ?? "");
      setStatus(mall.status || "ACTIVE");
      setDescription(mall.description || "");
      setLogoUrl(mall.logoUrl || "");
      setPhone(mall.contactInfo?.phone || "");
      setEmail(mall.contactInfo?.email || "");
      setServices(mall.services?.map(s => ({ name: s.name, description: s.description || "", isActive: s.isActive ?? true })) || []);
      setRestaurants(mall.restaurants?.map(r => ({ name: r.name, cuisineType: r.cuisineType || "", description: r.description || "", locationInMall: r.locationInMall || "", isActive: r.isActive ?? true })) || []);
    } else {
      setName(""); setCityId(""); setLocation(""); setCapacity("");
      setStatus("ACTIVE"); setDescription(""); setLogoUrl("");
      setPhone(""); setEmail(""); setError("");
      setServices([]); setRestaurants([]);
    }
  }, [open, isEdit, mall]);

  // Services handlers
  const addService = () => setServices((p) => [...p, { name: "", description: "", isActive: true }]);
  const removeService = (i) => setServices((p) => p.filter((_, idx) => idx !== i));
  const updateService = (i, key, val) =>
    setServices((p) => p.map((s, idx) => idx === i ? { ...s, [key]: val } : s));

  // Restaurants handlers
  const addRestaurant = () => setRestaurants((p) => [...p, { name: "", cuisineType: "", description: "", locationInMall: "", isActive: true }]);
  const removeRestaurant = (i) => setRestaurants((p) => p.filter((_, idx) => idx !== i));
  const updateRestaurant = (i, key, val) =>
    setRestaurants((p) => p.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  const handleCityCreated = (newCity) => {
    if (!newCity) return;
    setCities((prev) => [...prev, newCity]);
    setCityId(String(newCity.cityId));
  };

  const handleSubmit = async () => {
    const scrollTop = () => { if (bodyRef.current) bodyRef.current.scrollTop = 0; };
    if (!name.trim())       { setError("اسم المول مطلوب"); return scrollTop(); }
    if (!isEdit && !cityId) { setError("يجب اختيار المدينة"); return scrollTop(); }
    const invalidService = services.find((s) => !s.name.trim());
    if (invalidService)    { setError("اسم الخدمة مطلوب لكل خدمة"); return scrollTop(); }
    const invalidRestaurant = restaurants.find((r) => !r.name.trim());
    if (invalidRestaurant) { setError("اسم المطعم مطلوب لكل مطعم"); return scrollTop(); }

    setError(""); setLoading(true);
    try {
      const contactInfo = {};
      if (phone.trim()) contactInfo.phone = phone.trim();
      if (email.trim()) contactInfo.email = email.trim();

      const validServices = services
        .filter((s) => s.name.trim())
        .map((s) => ({ name: s.name.trim(), description: s.description.trim() || null, isActive: s.isActive }));

      const validRestaurants = restaurants
        .filter((r) => r.name.trim())
        .map((r) => ({
          name:           r.name.trim(),
          cuisineType:    r.cuisineType.trim() || null,
          description:    r.description.trim() || null,
          locationInMall: r.locationInMall.trim() || null,
          isActive:       r.isActive,
        }));

      const body = {
        name:        name.trim(),
        location:    location.trim() || null,
        capacity:    capacity ? Number(capacity) : null,
        status,
        description: description.trim() || null,
        logoUrl:     logoUrl.trim() || null,
        ...(Object.keys(contactInfo).length ? { contactInfo } : {}),
        ...(validServices.length    ? { services:     validServices }    : {}),
        ...(validRestaurants.length ? { restaurants:  validRestaurants } : {}),
      };

      if (isEdit) {
        await mallsApi.update({ mallId: mall.mallId, ...body });
      } else {
        await mallsApi.create({ ...body, city: { cityId: Number(cityId) } });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError(e.message || "حدث خطأ، حاول مجدداً");
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
        <Dialog.Portal container={themeContainer}>
          <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]" />
          <Dialog.Content
            className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-[92vw] max-w-[640px] max-h-[92vh] rounded-2xl flex flex-col outline-none"
            style={dialogSurface} aria-describedby={undefined}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b"
              style={{ borderColor: "var(--gray-a6)" }}>
              <div>
                <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                  {isEdit ? "تعديل المول" : "إضافة مول جديد"}
                </Dialog.Title>
                <p className="text-xs mt-0.5" style={{ color: "var(--gray-11)" }}>
                  {isEdit ? "عدّل بيانات المول" : "أدخل بيانات المول الجديد"}
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

              {/* ── Basic Info ── */}
              <Section title="المعلومات الأساسية" icon="🏬">

                {/* Name + City */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={{ color: "var(--gray-11)" }}>اسم المول *</label>
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

                {/* Location + Capacity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={{ color: "var(--gray-11)" }}>الموقع</label>
                    <input className={inputCls} style={inp} value={location}
                      onChange={(e) => setLocation(e.target.value)} placeholder="شارع الإرسال" />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: "var(--gray-11)" }}>السعة</label>
                    <input className={inputCls} style={inp} type="number" value={capacity}
                      onChange={(e) => setCapacity(e.target.value)} placeholder="500" />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className={labelCls} style={{ color: "var(--gray-11)" }}>الحالة</label>
                  <select className={inputCls} style={{ ...inp, appearance: "auto" }}
                    value={status} onChange={(e) => setStatus(e.target.value)}>
                    {MALL_STATUSES.map((s) => (
                      <option key={s} value={s}
                        style={{ background: "var(--gray-1)", color: "var(--gray-12)" }}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
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
                    placeholder="وصف مختصر..." />
                </div>
              </Section>

              {/* ── Contact ── */}
              <Section title="معلومات التواصل" icon="📞" collapsible>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={{ color: "var(--gray-11)" }}>رقم الهاتف</label>
                    <input className={inputCls} style={inpSection} value={phone}
                      onChange={(e) => setPhone(e.target.value)} placeholder="+970599..." />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: "var(--gray-11)" }}>البريد الإلكتروني</label>
                    <input className={inputCls}
                      style={{ ...inpSection, direction: "ltr", textAlign: "left" }}
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="info@mall.ps" />
                  </div>
                </div>
              </Section>

              {/* ── Services ── */}
              <Section title={`الخدمات (${services.length})`} icon="⚙️" collapsible>
                {services.length === 0 && (
                  <p className="text-xs text-center py-2" style={{ color: "var(--gray-9)" }}>
                    لا توجد خدمات — اضغط "إضافة خدمة"
                  </p>
                )}
                <div className="space-y-2">
                  {services.map((s, i) => (
                    <ListItem key={i} item={s} index={i}
                      onChange={updateService} onRemove={removeService}
                      fields={SERVICE_FIELDS} />
                  ))}
                </div>
                <button type="button" onClick={addService}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 mt-1"
                  style={{ background: "var(--blue-a3)", color: "var(--blue-11)", border: "1px dashed var(--blue-a7)" }}>
                  <FiPlus size={13} /> إضافة خدمة
                </button>
              </Section>

              {/* ── Restaurants ── */}
              <Section title={`المطاعم (${restaurants.length})`} icon="🍔" collapsible>
                {restaurants.length === 0 && (
                  <p className="text-xs text-center py-2" style={{ color: "var(--gray-9)" }}>
                    لا توجد مطاعم — اضغط "إضافة مطعم"
                  </p>
                )}
                <div className="space-y-2">
                  {restaurants.map((r, i) => (
                    <ListItem key={i} item={r} index={i}
                      onChange={updateRestaurant} onRemove={removeRestaurant}
                      fields={RESTAURANT_FIELDS} />
                  ))}
                </div>
                <button type="button" onClick={addRestaurant}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 mt-1"
                  style={{ background: "var(--orange-a3)", color: "var(--orange-11)", border: "1px dashed var(--orange-a7)" }}>
                  <FiPlus size={13} /> إضافة مطعم
                </button>
              </Section>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-t"
              style={{ borderColor: "var(--gray-a6)" }}>
              
              <div className="flex items-center gap-3">
                <button onClick={handleSubmit} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: "#2563eb", color: "#fff" }}>
                  {loading ? <Spinner size={14} /> : null}
                  {isEdit ? "حفظ التعديلات" : "إنشاء المول"}
                </button>
                <Dialog.Close asChild>
                  <button className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                    style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}>
                    إلغاء
                  </button>
                </Dialog.Close>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--gray-10)" }}>
                {services.length > 0     && <span>{services.length} خدمة</span>}
                {services.length > 0 && restaurants.length > 0 && <span>·</span>}
                {restaurants.length > 0  && <span>{restaurants.length} مطعم</span>}
              </div>
            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <CreateCityDialog open={createCityOpen} onOpenChange={setCreateCityOpen} onCreated={handleCityCreated} />
    </>
  );
}