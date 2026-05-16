import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowRight, FiSave, FiPlus, FiTrash2,
  FiTag, FiPackage, FiAlignLeft, FiLayers, FiCheckCircle,
} from "react-icons/fi";
import { auth } from "../../../api/auth";
import { mediaApi } from "../../../api/mediaApi";
import { buildBasicProductUpdatePayload, productsApi } from "./api";
import { AUDIENCE_OPTIONS, AGE_GROUP_OPTIONS } from "./constants";
import { RxSelect } from "../../../components/shopOwner/ui/RxSelect";
import AddProductPage from "./AddProductPage";
import BrandCreateDialog from "./BrandCreateDialog";

// ── Tiny helpers ─────────────────────────────────────────────────────────────
function Spinner({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" style={{ animation: "spin 0.75s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none" dir="rtl">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto"
          style={{
            background: t.type === "error" ? "var(--red-9)" : t.type === "success" ? "var(--green-9)" : "var(--gray-12)",
            color: "#fff", maxWidth: 340,
          }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

const LABEL_STYLE = { color: "var(--gray-11)", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 };
const INPUT_BASE  = {
  background: "var(--gray-1)", border: "1px solid var(--gray-a6)", color: "var(--gray-12)",
  borderRadius: 10, padding: "8px 12px", fontSize: 14, outline: "none", width: "100%",
  transition: "border-color 0.15s",
};
const ERR_STYLE = { color: "var(--red-10)", fontSize: 12, marginTop: 4, display: "block" };

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label style={LABEL_STYLE}>
        {label}{required && <span style={{ color: "var(--red-10)", marginRight: 3 }}>*</span>}
      </label>
      {children}
      {hint && !error && <span style={{ color: "var(--gray-9)", fontSize: 12, marginTop: 4, display: "block" }}>{hint}</span>}
      {error && <span style={ERR_STYLE}>{error}</span>}
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border p-5 space-y-4"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
      <div className="flex items-center gap-2.5 pb-3 border-b" style={{ borderColor: "var(--gray-a4)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
          <Icon size={15} />
        </div>
        <h2 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Tag input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading] = useState(false);
  const debounceRef = useRef(null);

  function addTag(tag) {
    const t = tag.trim();
    if (!t || tags.some(x => x.toLowerCase() === t.toLowerCase())) return;
    onChange([...tags, t]);
    setInput("");
    setSuggestions([]);
  }

  function removeTag(idx) { onChange(tags.filter((_, i) => i !== idx)); }

  function handleKey(e) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(input); }
    if (e.key === "Backspace" && !input && tags.length) removeTag(tags.length - 1);
  }

  function handleChange(val) {
    setInput(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); return; }
    setSugLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await productsApi.getTags(val.trim());
        setSuggestions(r?.data?.content ?? r?.data ?? r ?? []);
      } catch { setSuggestions([]); }
      finally { setSugLoading(false); }
    }, 300);
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 rounded-xl p-2 border min-h-[42px]"
        style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
            {t}
            <button type="button" onClick={() => removeTag(i)} style={{ color: "var(--blue-9)", lineHeight: 1 }}>×</button>
          </span>
        ))}
        <input value={input} onChange={e => handleChange(e.target.value)} onKeyDown={handleKey}
          placeholder={tags.length ? "" : placeholder}
          style={{ flex: 1, minWidth: 80, background: "none", border: "none", outline: "none",
            color: "var(--gray-12)", fontSize: 14, padding: "2px 4px" }} />
      </div>
      {(suggestions.length > 0 || sugLoading) && (
        <div className="absolute top-full mt-1 left-0 right-0 z-20 rounded-xl shadow-xl py-1"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", maxHeight: 180, overflowY: "auto" }}>
          {sugLoading && <p className="px-3 py-2 text-xs" style={{ color: "var(--gray-9)" }}>جاري البحث...</p>}
          {suggestions.map((s, i) => (
            <button key={i} type="button" onMouseDown={() => addTag(s.name || s)}
              className="w-full text-right px-3 py-2 text-sm"
              style={{ color: "var(--gray-11)", background: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--gray-a3)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {s.name || s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(form) {
  const errs = {};
  if (!form.name.trim())  errs.name       = "اسم المنتج مطلوب";
  if (!form.categoryId)   errs.categoryId = "يرجى اختيار الفئة";
  if (!form.brandId)      errs.brandId    = "يرجى اختيار الماركة";
  return errs;
}

// ── Build submit body (edit only) ─────────────────────────────────────────────
function buildBody(form) {
  return buildBasicProductUpdatePayload({
    id: form.id,
    name: form.name.trim(),
    slug: form.slug.trim(),
    targetedAudience: form.targetedAudience,
    ageGroup: form.ageGroup,
    isActive: form.isActive,
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    categoryId: Number(form.categoryId),
    brandId: Number(form.brandId),
    tags: form.tags,
  });
}

// ── Resolve attribute + option label from loaded attributes list ───────────────
function resolveAttrLabel(attrId, optId, attrList) {
  const attr = attrList.find(a => String(a.id) === String(attrId));
  const opt  = attr?.options?.find(o => String(o.id) === String(optId));
  return { attrName: attr?.name || `#${attrId}`, optValue: opt?.value || `#${optId}` };
}

// ── Variant dialog (shared for add + edit) ────────────────────────────────────
function VariantDialog({ title, variant, productId, attributes, shopId, onSuccess, onClose }) {
  const isEditing = Boolean(variant?.id);
  const [name,      setName]      = useState(variant?.name ?? "");
  const [basePrice, setBasePrice] = useState(String(variant?.basePrice ?? ""));
  const [isDefault, setIsDefault] = useState(variant?.isDefault ?? false);
  const [attrSel, setAttrSel] = useState(() =>
    Object.fromEntries((variant?.attributes || []).map(a => [String(a.attributeId), String(a.optionId)]))
  );
  const [mediaDraft, setMediaDraft] = useState(() =>
    (variant?.media || [])
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(m => ({
        id:  m.mediumId,
        url: m.mediumFile?.mediumFileUrl || m.mediumFile?.originalFileUrl || m.mediumFile?.smallFileUrl || "",
      }))
  );
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  async function handleUpload(files) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const r = await mediaApi.uploadForStore(file, shopId);
        const fileId  = r?.data?.id;
        const fileUrl = r?.data?.mediumFileUrl || r?.data?.originalFileUrl || "";
        if (fileId) setMediaDraft(prev => [...prev, { id: fileId, url: fileUrl }]);
      }
    } catch (e) {
      setError(e.message || "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim()) { setError("اسم المتغير مطلوب"); return; }
    const price = Number(basePrice);
    if (!basePrice || isNaN(price) || price <= 0) { setError("السعر الأساسي يجب أن يكون أكبر من صفر"); return; }

    const body = {
      ...(isEditing ? { id: variant.id } : {}),
      name: name.trim(),
      basePrice: price,
      isDefault,
      attributes: Object.entries(attrSel)
        .filter(([, v]) => v)
        .map(([attrId, optId]) => ({ attributeId: Number(attrId), optionId: Number(optId) })),
      media: mediaDraft.map((m, i) => ({ mediumId: m.id, sortOrder: i })),
    };

    setSaving(true);
    try {
      if (isEditing) await productsApi.updateVariant(productId, body);
      else           await productsApi.addVariant(productId, body);
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.message || (isEditing ? "فشل تعديل المتغير" : "فشل إنشاء المتغير"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="relative my-8 w-full max-w-lg rounded-2xl p-6 space-y-4" dir="rtl"
        style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>{title}</h3>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold"
            style={{ color: "var(--gray-9)", background: "var(--gray-a3)" }}>×</button>
        </div>

        {error && <p style={ERR_STYLE}>{error}</p>}

        <Field label="اسم المتغير" required>
          <input value={name} onChange={e => setName(e.target.value)} style={INPUT_BASE} placeholder="مثال: أحمر / L" />
        </Field>

        <Field label="السعر الأساسي" required>
          <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)}
            style={INPUT_BASE} placeholder="0.00" min={0} step={0.01} dir="ltr" />
        </Field>

        {attributes.length > 0 && (
          <div className="space-y-3">
            <p style={LABEL_STYLE}>الخصائص</p>
            {attributes.map(attr => (
              <Field key={attr.id} label={attr.name}>
                <select value={attrSel[String(attr.id)] || ""}
                  onChange={e => setAttrSel(prev => ({ ...prev, [String(attr.id)]: e.target.value }))}
                  style={INPUT_BASE}>
                  <option value="">بدون تحديد</option>
                  {(attr.options || []).map(opt => (
                    <option key={opt.id} value={String(opt.id)}>{opt.value}</option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div onClick={() => setIsDefault(v => !v)}
            className="w-9 h-5 rounded-full relative transition-colors"
            style={{ background: isDefault ? "var(--blue-9)" : "var(--gray-a5)", cursor: "pointer" }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: isDefault ? "translateX(-1px)" : "translateX(-17px)" }} />
          </div>
          <span className="text-sm" style={{ color: "var(--gray-11)" }}>تعيين كافتراضي</span>
        </label>

        <div className="space-y-2">
          <p style={LABEL_STYLE}>الصور</p>
          {mediaDraft.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mediaDraft.map((m, i) => (
                <div key={m.id} className="relative w-14 h-14 rounded-xl overflow-hidden border"
                  style={{ borderColor: "var(--gray-a5)" }}>
                  {m.url
                    ? <img src={m.url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ background: "var(--gray-a3)" }} />}
                  <button type="button" onClick={() => setMediaDraft(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--red-9)", color: "#fff" }}>×</button>
                </div>
              ))}
            </div>
          )}
          <label className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border cursor-pointer"
            style={{ borderColor: "var(--blue-a6)", color: "var(--blue-11)", background: "var(--blue-a2)" }}>
            {uploading ? <Spinner size={13} /> : <FiPlus size={13} />}
            رفع صور
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
              onChange={e => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = ""; }} />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold border"
            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)", background: "var(--gray-1)" }}>
            إلغاء
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving || uploading}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            style={{ background: "var(--blue-9)", color: "#fff", opacity: (saving || uploading) ? 0.7 : 1 }}>
            {saving ? <Spinner size={14} /> : <FiCheckCircle size={14} />}
            {isEditing ? "حفظ التعديلات" : "إضافة المتغير"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function EditProductForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);
  const canCreateBrand = auth.getUser()?.role === "ROLE_ADMIN";
  const { toasts, push } = useToast();

  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(isEdit);
  const [categories, setCategories] = useState([]);
  const [brands,     setBrands]     = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [errors,     setErrors]     = useState({});
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);

  const shopId = auth.getShopId();
  const [addVarOpen,     setAddVarOpen]     = useState(false);
  const [editVarTarget,  setEditVarTarget]  = useState(null);
  const [deleteVarTarget, setDeleteVarTarget] = useState(null);
  const [varMutating,    setVarMutating]    = useState(false);

  const [form, setForm] = useState({
    id: null,
    name: "", slug: "", shortDescription: "", description: "",
    isActive: true, categoryId: "", brandId: "",
    targetedAudience: "", ageGroup: "",
    tags: [],
    variants: [],
  });

  // Load reference data
  useEffect(() => {
    productsApi.getCategories().then(r => setCategories(r?.data?.content ?? r?.data ?? r ?? [])).catch(() => {});
    productsApi.getBrands().then(r => setBrands(r?.data?.content ?? r?.data ?? r ?? [])).catch(() => {});
    productsApi.getAttributes().then(r => setAttributes(r?.data?.content ?? r?.data ?? r ?? [])).catch(() => {});
  }, []);

  // Load product for edit
  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    productsApi.getById(id)
      .then(r => {
        const p = r?.data ?? r;
        setForm({
          id:               p.id,
          name:             p.name            ?? "",
          slug:             p.slug            ?? "",
          shortDescription: p.shortDescription ?? "",
          description:      p.description     ?? "",
          isActive:         p.isActive         ?? true,
          categoryId:       p.categoryId ?? p.category?.id ?? "",
          brandId:          p.brandId    ?? p.brand?.id    ?? "",
          targetedAudience: p.targetedAudience ?? "",
          ageGroup:         p.ageGroup         ?? "",
          tags:     p.tags?.map(t => t.name ?? t) ?? [],
          variants: p.variants ?? [],
        });
      })
      .catch(e => push(e.message || "فشل تحميل بيانات المنتج", "error"))
      .finally(() => setFetching(false));
  }, [id]);

  function setField(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function reloadVariants() {
    try {
      const r = await productsApi.getById(id);
      const p = r?.data ?? r;
      setForm(prev => ({ ...prev, variants: p.variants ?? [] }));
    } catch { /* silent — list will be stale but not broken */ }
  }

  function handleBrandCreated(createdBrand) {
    if (!createdBrand?.id) return;
    setBrands(prev => {
      if (prev.some(brand => String(brand.id) === String(createdBrand.id))) return prev;
      return [createdBrand, ...prev];
    });
    setForm(prev => ({ ...prev, brandId: String(createdBrand.id) }));
    setErrors(prev => {
      const next = { ...prev };
      delete next.brandId;
      return next;
    });
    push("تمت إضافة الماركة الجديدة واختيارها تلقائياً", "success");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      push("يرجى تصحيح الأخطاء قبل الحفظ", "error");
      return;
    }

    setLoading(true);
    try {
      await productsApi.update(buildBody(form));
      push("تم تحديث المنتج بنجاح", "success");
      setTimeout(() => navigate("/shop-owner/products"), 800);
    } catch (e) {
      push(e.message || "فشل حفظ المنتج", "error");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24" dir="rtl">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate("/shop-owner/products")}
          className="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)", background: "var(--gray-1)" }}>
          <FiArrowRight size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
            {isEdit ? "تعديل المنتج" : "إضافة منتج جديد"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--gray-10)" }}>
            {isEdit ? "قم بتعديل بيانات المنتج" : "أدخل بيانات المنتج الجديد"}
          </p>
        </div>
        <div className="mr-auto flex gap-3">
          <button type="button" onClick={() => navigate("/shop-owner/products")}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold border"
            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)", background: "var(--gray-1)" }}>
            إلغاء
          </button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity"
            style={{ background: "var(--blue-9)", color: "#fff", opacity: loading ? 0.7 : 1 }}>
            {loading ? <Spinner size={14} /> : <FiSave size={14} />}
            {isEdit ? "حفظ التغييرات" : "إنشاء المنتج"}
          </button>
        </div>
      </div>

      {/* ── Section 1: Basic Info ── */}
      <SectionCard icon={FiPackage} title="المعلومات الأساسية">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="اسم المنتج" required error={errors.name}>
            <input value={form.name} onChange={e => setField("name", e.target.value)}
              placeholder="أدخل اسم المنتج" style={INPUT_BASE} />
          </Field>

          <Field label="الـ Slug" hint="يُولَّد تلقائياً إذا تُرك فارغاً">
            <input value={form.slug} onChange={e => setField("slug", e.target.value)}
              placeholder="my-product-slug" style={INPUT_BASE} dir="ltr" />
          </Field>

          <div className="col-span-full">
            <Field label="وصف مختصر">
              <input value={form.shortDescription} onChange={e => setField("shortDescription", e.target.value)}
                placeholder="وصف قصير يظهر في قوائم المنتجات" style={INPUT_BASE} />
            </Field>
          </div>

          <div className="col-span-full">
            <Field label="الوصف التفصيلي">
              <textarea value={form.description} onChange={e => setField("description", e.target.value)}
                placeholder="أدخل وصفاً تفصيلياً للمنتج..." rows={4}
                style={{ ...INPUT_BASE, resize: "vertical" }} />
            </Field>
          </div>

          {/* Active toggle */}
          <div className="col-span-full">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div onClick={() => setField("isActive", !form.isActive)}
                className="w-11 h-6 rounded-full transition-colors relative shrink-0"
                style={{ background: form.isActive ? "var(--blue-9)" : "var(--gray-a5)", cursor: "pointer" }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: form.isActive ? "translateX(-1px)" : "translateX(-21px)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                  {form.isActive ? "المنتج نشط" : "المنتج غير نشط"}
                </p>
                <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                  {form.isActive ? "يظهر للعملاء" : "مخفي عن العملاء"}
                </p>
              </div>
            </label>
          </div>
        </div>
      </SectionCard>

      {/* ── Section 2: Classification ── */}
      <SectionCard icon={FiLayers} title="التصنيف">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="الفئة" required error={errors.categoryId}>
            <RxSelect
              value={form.categoryId}
              onValueChange={v => setField("categoryId", v)}
              placeholder="اختر الفئة"
              options={categories.map(c => ({ value: String(c.id), label: c.name }))}
              error={!!errors.categoryId}
            />
          </Field>

          <Field label="الماركة / العلامة التجارية" required error={errors.brandId}>
            <div className="space-y-3">
              <RxSelect
                value={form.brandId}
                onValueChange={v => setField("brandId", v)}
                placeholder="اختر الماركة"
                options={brands.map(b => ({ value: String(b.id), label: b.name }))}
                error={!!errors.brandId}
              />

              {canCreateBrand ? (
                <button
                  type="button"
                  onClick={() => setBrandDialogOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
                  style={{ background: "var(--blue-a2)", borderColor: "var(--blue-a5)", color: "var(--blue-11)" }}
                >
                  <FiPlus size={14} />
                  إضافة ماركة جديدة
                </button>
              ) : null}
            </div>
          </Field>

          <Field label="الجمهور المستهدف">
            <RxSelect
              value={form.targetedAudience}
              onValueChange={v => setField("targetedAudience", v)}
              placeholder="غير محدد"
              options={AUDIENCE_OPTIONS}
            />
          </Field>

          <Field label="الفئة العمرية">
            <RxSelect
              value={form.ageGroup}
              onValueChange={v => setField("ageGroup", v)}
              placeholder="غير محدد"
              options={AGE_GROUP_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      {/* ── Section 3: Tags ── */}
      <SectionCard icon={FiTag} title="الوسوم">
        <Field label="الوسوم" hint="اكتب وسماً ثم اضغط Enter أو فاصلة لإضافته">
          <TagInput tags={form.tags} onChange={tags => setField("tags", tags)} placeholder="أضف وسوماً..." />
        </Field>
      </SectionCard>

      {/* ── Section 4: Variants ── */}
      <SectionCard icon={FiAlignLeft} title="المتغيرات">
        {form.variants.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--gray-9)" }}>
            لا توجد متغيرات بعد. أضف متغيراً للبدء.
          </p>
        ) : (
          <div className="space-y-2">
            {form.variants.map(v => {
              const attrPills = (v.attributes || []).map(a => resolveAttrLabel(a.attributeId, a.optionId, attributes));
              return (
                <div key={v.id}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3"
                  style={{
                    background: v.isDefault ? "var(--blue-a2)" : "var(--gray-a2)",
                    borderColor: v.isDefault ? "var(--blue-a5)" : "var(--gray-a4)",
                  }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--gray-12)" }}>{v.name}</p>
                      {v.isDefault && (
                        <span className="text-xs rounded-full px-2 py-0.5 font-bold"
                          style={{ background: "var(--blue-9)", color: "#fff" }}>افتراضي</span>
                      )}
                      {v.hasDiscount && (
                        <span className="text-xs rounded-full px-2 py-0.5 font-bold"
                          style={{ background: "var(--green-a3)", color: "var(--green-11)" }}>خصم</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                        {v.hasDiscount
                          ? `₪${Number(v.discountedPrice)} (أصلي ₪${Number(v.basePrice)})`
                          : `₪${Number(v.basePrice)}`}
                      </p>
                      {attrPills.map(({ attrName, optValue }) => (
                        <span key={attrName} className="text-xs rounded-full px-2 py-0.5"
                          style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                          {attrName}: {optValue}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => setEditVarTarget(v)}
                      className="text-xs rounded-xl px-3 py-1.5 font-semibold"
                      style={{ background: "var(--blue-a2)", color: "var(--blue-11)" }}>
                      تعديل
                    </button>
                    <button type="button" onClick={() => setDeleteVarTarget(v)}
                      className="text-xs rounded-xl px-3 py-1.5 font-semibold"
                      style={{ background: "var(--red-a2)", color: "var(--red-10)" }}>
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button type="button" onClick={() => setAddVarOpen(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border"
          style={{ borderColor: "var(--blue-a6)", color: "var(--blue-11)", background: "var(--blue-a2)" }}>
          <FiPlus size={14} />
          إضافة متغير
        </button>
      </SectionCard>

      {/* Bottom save */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => navigate("/shop-owner/products")}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold border"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)", background: "var(--gray-1)" }}>
          إلغاء
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-opacity"
          style={{ background: "var(--blue-9)", color: "#fff", opacity: loading ? 0.7 : 1 }}>
          {loading ? <Spinner size={14} /> : <FiCheckCircle size={14} />}
          {isEdit ? "حفظ التغييرات" : "إنشاء المنتج"}
        </button>
      </div>

      {/* ── Variant dialogs ── */}
      {addVarOpen && (
        <VariantDialog
          title="إضافة متغير جديد"
          variant={null}
          productId={id}
          attributes={attributes}
          shopId={shopId}
          onSuccess={() => { push("تمت إضافة المتغير بنجاح", "success"); reloadVariants(); }}
          onClose={() => setAddVarOpen(false)}
        />
      )}
      {editVarTarget && (
        <VariantDialog
          title="تعديل المتغير"
          variant={editVarTarget}
          productId={id}
          attributes={attributes}
          shopId={shopId}
          onSuccess={() => { push("تم تحديث المتغير بنجاح", "success"); reloadVariants(); }}
          onClose={() => setEditVarTarget(null)}
        />
      )}
      {deleteVarTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" dir="rtl"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>حذف المتغير</h3>
            <p className="text-sm leading-6" style={{ color: "var(--gray-10)" }}>
              هل أنت متأكد من حذف المتغير <strong>"{deleteVarTarget.name}"</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteVarTarget(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold border"
                style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)", background: "var(--gray-1)" }}>
                إلغاء
              </button>
              <button type="button" disabled={varMutating}
                onClick={async () => {
                  setVarMutating(true);
                  try {
                    await productsApi.deleteVariant(id, deleteVarTarget.id);
                    setDeleteVarTarget(null);
                    push("تم حذف المتغير", "success");
                    reloadVariants();
                  } catch (e) {
                    push(e.message || "فشل حذف المتغير", "error");
                  } finally {
                    setVarMutating(false);
                  }
                }}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                style={{ background: "var(--red-9)", color: "#fff", opacity: varMutating ? 0.7 : 1 }}>
                {varMutating ? <Spinner size={14} /> : <FiTrash2 size={14} />}
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
      <BrandCreateDialog
        open={brandDialogOpen}
        onOpenChange={setBrandDialogOpen}
        onCreated={handleBrandCreated}
      />
    </form>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  return id ? <EditProductForm /> : <AddProductPage />;
}
