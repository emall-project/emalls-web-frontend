import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiTag, FiRefreshCw, FiSearch, FiChevronLeft, FiBookOpen,
  FiPlus, FiX, FiAlertCircle, FiUpload, FiTrash2,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { useSortedData, SortableTh } from "../../../utils/tableSort";
import { auth } from "../../../api/auth";
import { mediaApi } from "../../../api/mediaApi";

const CATALOG = "/catalog";

async function catalogFetch(path) {
  const res = await fetch(`${CATALOG}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders() },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "خطأ في الطلب");
  return json?.data ?? json ?? null;
}

async function catalogPost(path, body) {
  const res = await fetch(`${CATALOG}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth.getHeaders() },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "خطأ في الطلب");
  return json?.data ?? json ?? null;
}

function normalize(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function useThemeContainer() {
  const [c, setC] = useState(null);
  useEffect(() => { setC(document.querySelector(".radix-themes") || document.body); }, []);
  return c;
}

function MiniSpinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";
const inp = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl", textAlign: "right" };
const labelCls = "block text-xs font-semibold mb-1.5";

const AUDIENCE_OPTIONS = [
  { value: "ALL",    label: "للجميع" },
  { value: "MALE",   label: "للرجال" },
  { value: "FEMALE", label: "للنساء" },
];

const AGE_GROUP_OPTIONS = [
  { value: "ALL",      label: "كل الأعمار" },
  { value: "NEWBORN",  label: "حديثو الولادة" },
  { value: "INFANT",   label: "الرضع" },
  { value: "TODDLER",  label: "صغار الأطفال" },
  { value: "CHILD",    label: "الأطفال" },
  { value: "TEENAGER", label: "المراهقون" },
  { value: "YOUTH",    label: "الشباب" },
  { value: "ADULT",    label: "البالغون" },
];

const ATTR_TYPE_OPTIONS = [
  { value: "TEXT",         label: "نص" },
  { value: "DROPDOWN",     label: "قائمة منسدلة" },
  { value: "MULTI_SELECT", label: "اختيار متعدد" },
  { value: "COLOR",        label: "لون" },
  { value: "SIZE",         label: "مقاس" },
  { value: "NUMBER",       label: "رقم" },
  { value: "BOOLEAN",      label: "نعم / لا" },
];

const TYPES_WITH_VALUES = ["DROPDOWN", "MULTI_SELECT", "COLOR", "SIZE"];

function PillSelector({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
          style={value === o.value
            ? { background: "var(--blue-9)", color: "#fff" }
            : { background: "var(--gray-a3)", color: "var(--gray-11)" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Create Brand Dialog ─────────────────────────────────────────────────── */
function CreateBrandDialog({ open, onOpenChange, onCreated }) {
  const container = useThemeContainer();
  const [name,         setName]         = useState("");
  const [description,  setDescription]  = useState("");
  const [audience,     setAudience]     = useState("ALL");
  const [ageGroup,     setAgeGroup]     = useState("ALL");
  const [isActive,     setIsActive]     = useState(true);
  const [imageUuid,    setImageUuid]    = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading,    setUploading]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setName(""); setDescription(""); setAudience("ALL"); setAgeGroup("ALL");
      setIsActive(true); setImageUuid(""); setImagePreview(""); setError("");
    }
  }, [open]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    setUploading(true); setError("");
    try {
      const res = await mediaApi.upload(file);
      setImageUuid(res.data.id);
      setImagePreview(res.data.originalFileUrl || res.data.mediumFileUrl || "");
    } catch (err) { setError(err.message || "فشل رفع الصورة"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError("اسم الماركة مطلوب");
    setError(""); setLoading(true);
    try {
      await catalogPost("/brands", {
        name: name.trim(),
        description: description.trim() || null,
        targetedAudience: audience,
        ageGroup,
        isActive,
        ...(imageUuid ? { imageUuid } : {}),
      });
      onCreated?.();
      onOpenChange(false);
    } catch (e) { setError(e.message || "فشل إنشاء الماركة"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed z-[10001] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-md rounded-2xl flex flex-col outline-none"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 24px 64px rgba(0,0,0,.45)", maxHeight: "90vh", overflow: "hidden" }}
          aria-describedby={undefined}>

          <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--gray-a5)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                <FiTag size={15} />
              </div>
              <Dialog.Title className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>إضافة ماركة جديدة</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-70 transition" style={{ color: "var(--gray-11)", background: "var(--gray-a3)" }}>
                <FiX size={14} />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: "var(--red-a3)", border: "1px solid var(--red-a6)", color: "var(--red-11)" }}>
                <FiAlertCircle size={13} /> {error}
              </div>
            )}

            <div className="flex gap-4 items-start">
              <div className="flex flex-col items-center gap-1">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  className="w-16 h-16 rounded-xl flex items-center justify-center cursor-pointer transition hover:opacity-80 overflow-hidden"
                  style={{ background: imagePreview ? "transparent" : "var(--blue-a3)", border: `2px dashed ${imagePreview ? "var(--gray-a5)" : "var(--blue-a7)"}` }}>
                  {uploading ? <MiniSpinner /> : imagePreview
                    ? <img src={imagePreview} alt="" className="w-full h-full object-contain" />
                    : <FiUpload size={16} style={{ color: "var(--blue-9)" }} />}
                </div>
                {imagePreview && !uploading && (
                  <button type="button" onClick={() => { setImageUuid(""); setImagePreview(""); }}
                    className="text-[10px] hover:opacity-70" style={{ color: "var(--red-11)" }}>حذف</button>
                )}
              </div>
              <div className="flex-1">
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                  الاسم <span style={{ color: "var(--red-9)" }}>*</span>
                </label>
                <input className={inputCls} style={inp} value={name}
                  onChange={e => setName(e.target.value)} placeholder="مثال: نايكي" />
              </div>
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>الوصف</label>
              <textarea className={inputCls} style={{ ...inp, minHeight: 68, resize: "none" }}
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="وصف مختصر عن الماركة..." />
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>الجمهور المستهدف</label>
              <PillSelector options={AUDIENCE_OPTIONS} value={audience} onChange={setAudience} />
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>الفئة العمرية</label>
              <PillSelector options={AGE_GROUP_OPTIONS} value={ageGroup} onChange={setAgeGroup} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: "var(--blue-9)" }} />
              <span className="text-sm" style={{ color: "var(--gray-11)" }}>الماركة نشطة</span>
            </label>
          </div>

          <div className="px-5 py-3 flex gap-2 border-t flex-shrink-0" style={{ borderColor: "var(--gray-a5)" }}>
            <button onClick={handleSubmit} disabled={loading || uploading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--blue-9)", color: "#fff" }}>
              {loading ? <MiniSpinner /> : <FiPlus size={13} />} إنشاء الماركة
            </button>
            <Dialog.Close asChild>
              <button className="px-4 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-80"
                style={{ border: "1px solid var(--gray-a6)", color: "var(--gray-12)" }}>إلغاء</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Create Attribute Dialog ─────────────────────────────────────────────── */
function CreateAttributeDialog({ open, onOpenChange, onCreated }) {
  const container = useThemeContainer();
  const [name,     setName]     = useState("");
  const [type,     setType]     = useState("DROPDOWN");
  const [values,   setValues]   = useState([""]);
  const [isActive, setIsActive] = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!open) { setName(""); setType("DROPDOWN"); setValues([""]); setIsActive(true); setError(""); }
  }, [open]);

  const needsValues = TYPES_WITH_VALUES.includes(type);

  const handleSubmit = async () => {
    if (!name.trim()) return setError("اسم الخاصية مطلوب");
    const filteredValues = values.map(v => v.trim()).filter(Boolean);
    setError(""); setLoading(true);
    try {
      await catalogPost("/attributes", {
        name: name.trim(),
        type,
        isActive,
        ...(needsValues && filteredValues.length ? { values: filteredValues } : {}),
      });
      onCreated?.();
      onOpenChange(false);
    } catch (e) { setError(e.message || "فشل إنشاء الخاصية"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed z-[10001] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-md rounded-2xl flex flex-col outline-none"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 24px 64px rgba(0,0,0,.45)", maxHeight: "90vh", overflow: "hidden" }}
          aria-describedby={undefined}>

          <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--gray-a5)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--purple-a3)", color: "var(--purple-11)" }}>
                <FiBookOpen size={15} />
              </div>
              <Dialog.Title className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>إضافة خاصية جديدة</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-70 transition" style={{ color: "var(--gray-11)", background: "var(--gray-a3)" }}>
                <FiX size={14} />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: "var(--red-a3)", border: "1px solid var(--red-a6)", color: "var(--red-11)" }}>
                <FiAlertCircle size={13} /> {error}
              </div>
            )}

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                الاسم <span style={{ color: "var(--red-9)" }}>*</span>
              </label>
              <input className={inputCls} style={inp} value={name}
                onChange={e => setName(e.target.value)} placeholder="مثال: اللون" />
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>نوع الخاصية</label>
              <PillSelector options={ATTR_TYPE_OPTIONS} value={type} onChange={v => { setType(v); setValues([""]); }} />
            </div>

            {needsValues && (
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>القيم المتاحة</label>
                <div className="space-y-2">
                  {values.map((v, i) => (
                    <div key={i} className="flex gap-2">
                      <input className={inputCls} style={inp} value={v}
                        onChange={e => setValues(prev => prev.map((p, idx) => idx === i ? e.target.value : p))}
                        placeholder={`قيمة ${i + 1}`} />
                      {values.length > 1 && (
                        <button type="button"
                          onClick={() => setValues(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-2.5 rounded-xl flex-shrink-0 hover:opacity-80 transition"
                          style={{ background: "var(--red-a3)", color: "var(--red-9)" }}>
                          <FiTrash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setValues(prev => [...prev, ""])}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition"
                    style={{ background: "var(--gray-a2)", border: "1px dashed var(--gray-a7)", color: "var(--gray-10)" }}>
                    <FiPlus size={11} /> إضافة قيمة
                  </button>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: "var(--blue-9)" }} />
              <span className="text-sm" style={{ color: "var(--gray-11)" }}>الخاصية نشطة</span>
            </label>
          </div>

          <div className="px-5 py-3 flex gap-2 border-t flex-shrink-0" style={{ borderColor: "var(--gray-a5)" }}>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--blue-9)", color: "#fff" }}>
              {loading ? <MiniSpinner /> : <FiPlus size={13} />} إنشاء الخاصية
            </button>
            <Dialog.Close asChild>
              <button className="px-4 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-80"
                style={{ border: "1px solid var(--gray-a6)", color: "var(--gray-12)" }}>إلغاء</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Brands tab ─────────────────────────────────────────────────────────── */
function BrandsTab() {
  const [brands,      setBrands]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [q,           setQ]           = useState("");
  const [createOpen,  setCreateOpen]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogFetch("/brands/all");
      setBrands(normalize(data));
    } catch (e) {
      setError(e.message || "تعذر تحميل الماركات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = brands.filter(b =>
    !q || b.name?.toLowerCase().includes(q.toLowerCase()) || String(b.id).includes(q)
  );
  const { sorted, sortKey, sortDir, onSort } = useSortedData(filtered, "name");

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--gray-9)" }} />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="بحث في الماركات..."
            className="h-9 w-full rounded-xl border pr-9 pl-3 text-sm outline-none"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)", color: "var(--gray-12)" }}
          />
        </div>
        <span className="text-sm" style={{ color: "var(--gray-9)" }}>{filtered.length} ماركة</span>
        <button onClick={load} disabled={loading}
          className="p-2 rounded-xl" style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
          style={{ background: "var(--blue-9)", color: "#fff" }}>
          <FiPlus size={14} /> إضافة ماركة
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--red-3)", color: "var(--red-11)" }}>{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)" }}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead style={{ background: "var(--gray-a2)", color: "var(--gray-9)" }}>
              <tr>
                <SortableTh label="#" sortKey="id" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
                <th className="px-4 py-3 text-xs font-semibold">الشعار</th>
                <SortableTh label="الاسم" sortKey="name" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
                <th className="px-4 py-3 text-xs font-semibold">الوصف</th>
                <SortableTh label="الحالة" sortKey="isActive" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
              </tr>
            </thead>
            <tbody>
              {loading && sorted.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--gray-a4)" }}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded-full" style={{ background: "var(--gray-a3)" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: "var(--gray-9)" }}>
                    {q ? "لا توجد نتائج مطابقة" : "لا توجد ماركات"}
                  </td>
                </tr>
              ) : (
                sorted.map(brand => (
                  <tr key={brand.id} style={{ borderTop: "1px solid var(--gray-a4)" }}>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--gray-9)" }}>#{brand.id}</td>
                    <td className="px-4 py-3">
                      {brand.logoUrl || brand.imageUrl ? (
                        <img src={brand.logoUrl || brand.imageUrl} alt={brand.name}
                          className="h-9 w-9 rounded-xl object-contain"
                          style={{ border: "1px solid var(--gray-a4)", background: "var(--gray-1)" }} />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold"
                          style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                          {brand.name?.[0] || "—"}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--gray-12)" }}>
                      {brand.name || "—"}
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="line-clamp-2 text-xs leading-5" style={{ color: "var(--gray-9)" }}>
                        {brand.description || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {brand.isActive !== undefined ? (
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={brand.isActive
                            ? { background: "var(--green-a3)", color: "var(--green-11)" }
                            : { background: "var(--gray-a3)",  color: "var(--gray-10)"  }}>
                          {brand.isActive ? "نشطة" : "غير نشطة"}
                        </span>
                      ) : <span style={{ color: "var(--gray-7)" }}>—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateBrandDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
    </>
  );
}

/* ── Attributes tab ─────────────────────────────────────────────────────── */
function AttributesTab() {
  const [attrs,       setAttrs]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [q,           setQ]           = useState("");
  const [createOpen,  setCreateOpen]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogFetch("/attributes/all");
      setAttrs(normalize(data));
    } catch (e) {
      setError(e.message || "تعذر تحميل الخصائص");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = attrs.filter(a =>
    !q || a.name?.toLowerCase().includes(q.toLowerCase()) || String(a.id).includes(q)
  );
  const { sorted, sortKey, sortDir, onSort } = useSortedData(filtered, "name");

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--gray-9)" }} />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="بحث في الخصائص..."
            className="h-9 w-full rounded-xl border pr-9 pl-3 text-sm outline-none"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)", color: "var(--gray-12)" }}
          />
        </div>
        <span className="text-sm" style={{ color: "var(--gray-9)" }}>{filtered.length} خاصية</span>
        <button onClick={load} disabled={loading}
          className="p-2 rounded-xl" style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
          style={{ background: "var(--blue-9)", color: "#fff" }}>
          <FiPlus size={14} /> إضافة خاصية
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--red-3)", color: "var(--red-11)" }}>{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)" }}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead style={{ background: "var(--gray-a2)", color: "var(--gray-9)" }}>
              <tr>
                <SortableTh label="#" sortKey="id" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
                <SortableTh label="الاسم" sortKey="name" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
                <SortableTh label="النوع" sortKey="type" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
                <th className="px-4 py-3 text-xs font-semibold">القيم / الخيارات</th>
                <SortableTh label="الحالة" sortKey="isActive" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
              </tr>
            </thead>
            <tbody>
              {loading && sorted.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--gray-a4)" }}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded-full" style={{ background: "var(--gray-a3)" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: "var(--gray-9)" }}>
                    {q ? "لا توجد نتائج مطابقة" : "لا توجد خصائص"}
                  </td>
                </tr>
              ) : (
                sorted.map(attr => {
                  const values = attr.values || attr.options || attr.possibleValues || [];
                  return (
                    <tr key={attr.id} style={{ borderTop: "1px solid var(--gray-a4)" }}>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--gray-9)" }}>#{attr.id}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "var(--gray-12)" }}>
                        {attr.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {attr.type ? (
                          <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ background: "var(--purple-a3)", color: "var(--purple-11)" }}>
                            {ATTR_TYPE_OPTIONS.find(o => o.value === attr.type)?.label || attr.type}
                          </span>
                        ) : <span style={{ color: "var(--gray-7)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {values.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {values.slice(0, 5).map((v, i) => (
                              <span key={i} className="rounded-full px-2 py-0.5 text-[11px]"
                                style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                                {typeof v === "string" ? v : v?.value || v?.name || JSON.stringify(v)}
                              </span>
                            ))}
                            {values.length > 5 && (
                              <span className="text-xs" style={{ color: "var(--gray-9)" }}>
                                +{values.length - 5}
                              </span>
                            )}
                          </div>
                        ) : <span style={{ color: "var(--gray-7)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {attr.isActive !== undefined ? (
                          <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={attr.isActive
                              ? { background: "var(--green-a3)", color: "var(--green-11)" }
                              : { background: "var(--gray-a3)",  color: "var(--gray-10)"  }}>
                            {attr.isActive ? "نشطة" : "غير نشطة"}
                          </span>
                        ) : <span style={{ color: "var(--gray-7)" }}>—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateAttributeDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
    </>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function CatalogBrandsPage() {
  const [tab, setTab] = useState("brands");

  const tabs = [
    { key: "brands",     label: "الماركات",  icon: FiTag      },
    { key: "attributes", label: "الخصائص",   icon: FiBookOpen },
  ];

  return (
    <div dir="rtl" className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link to="/admin/catalog"
          className="p-2 rounded-xl transition-colors"
          style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
          <FiChevronLeft size={16} />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: "var(--blue-3)", color: "var(--blue-11)" }}>
          <FiTag size={18} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>الماركات والخصائص</h1>
          <p className="text-sm" style={{ color: "var(--gray-10)" }}>إدارة الماركات وخصائص المنتجات</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-2">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
              style={active
                ? { background: "var(--blue-9)", color: "#fff" }
                : { background: "var(--gray-a3)", color: "var(--gray-11)" }}>
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "brands"     && <BrandsTab     />}
      {tab === "attributes" && <AttributesTab />}
    </div>
  );
}
