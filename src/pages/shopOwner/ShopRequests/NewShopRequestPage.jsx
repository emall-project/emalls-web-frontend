import { useEffect, useState } from "react";
import {
  FiAlertCircle, FiCheckCircle, FiImage,
  FiLoader, FiSend, FiTrash2, FiUploadCloud,
} from "react-icons/fi";
import { mediaApi } from "../../../api/mediaApi";
import { CATEGORY_LABELS, SHOP_CATEGORIES } from "../../admin/ShopManagement/constants";
import { shopRequestApi } from "./shopRequestApi";

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const inputSty = {
  background: "var(--gray-a2)",
  borderColor: "var(--gray-a6)",
  color: "var(--gray-12)",
};

const selectSty = {
  background: "var(--gray-3)",
  borderColor: "var(--gray-a6)",
  color: "var(--gray-12)",
  colorScheme: "dark",
};

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
        {label} {required ? <span style={{ color: "var(--red-9)" }}>*</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs" style={{ color: "var(--red-9)" }}>{error}</p> : null}
    </div>
  );
}

// ── Single image upload field ─────────────────────────────────────────────────
function ImageUploadField({ label, required, error, value, onUuid, onUploadingChange, resetToken }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName("");
    setUploadError("");
  }, [resetToken]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) { setUploadError("يُسمح برفع الصور فقط."); return; }
    if (file.size > 8 * 1024 * 1024) { setUploadError("حجم الصورة يجب ألا يتجاوز 8 ميجابايت."); return; }

    setUploadError("");
    setUploading(true);
    onUploadingChange?.(true);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);

    try {
      const res = await mediaApi.uploadTemp(file);
      const id = res?.data?.id;
      if (!id) throw new Error("تعذر الحصول على معرف الملف.");
      onUuid(id);
    } catch (e) {
      setUploadError(e.message || "فشل رفع الملف.");
      onUuid("");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName("");
    setUploadError("");
    onUuid("");
  };

  return (
    <Field label={label} required={required} error={error || uploadError}>
      <div className="rounded-xl border p-3" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}>
        <div className="flex items-center gap-3">
          <div
            className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border flex items-center justify-center"
            style={{ background: "var(--gray-a3)", borderColor: "var(--gray-a5)" }}
          >
            {preview
              ? <img src={preview} alt={fileName} className="h-full w-full object-cover" />
              : <FiImage size={20} style={{ color: "var(--gray-9)" }} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: "var(--gray-12)" }}>
              {fileName || (value ? "تم الاختيار" : "لم يتم اختيار ملف")}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>
              JPG أو PNG — حتى 8 ميجابايت
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {value && (
              <button
                type="button"
                onClick={clear}
                className="rounded-xl border p-2 transition hover:opacity-80"
                style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}
              >
                <FiTrash2 size={14} />
              </button>
            )}
            <label
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
              style={{ background: "var(--blue-9)", color: "#fff", opacity: uploading ? 0.6 : 1 }}
            >
              {uploading
                ? <FiLoader className="animate-spin" size={14} />
                : <FiUploadCloud size={14} />}
              رفع
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
              />
            </label>
          </div>
        </div>
      </div>
    </Field>
  );
}

// ── Multi-image upload field ───────────────────────────────────────────────────
function ImageListUploadField({ label, required, error, values, onUuids, onUploadingChange, resetToken }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [previews, setPreviews] = useState([]); // [{ uuid, preview, name }]

  useEffect(() => {
    return () => {
      previews.forEach((item) => {
        if (item?.preview) URL.revokeObjectURL(item.preview);
      });
    };
  }, [previews]);

  useEffect(() => {
    previews.forEach((item) => {
      if (item?.preview) URL.revokeObjectURL(item.preview);
    });
    setPreviews([]);
    setUploadError("");
  }, [resetToken]);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    const arr = Array.from(files);
    const valid = arr.filter((f) => f.type?.startsWith("image/") && f.size <= 8 * 1024 * 1024);
    const invalid = arr.length - valid.length;
    if (invalid) setUploadError(`${invalid} ملف غير صالح (صور فقط، حتى 8 ميجابايت).`);
    if (!valid.length) return;

    setUploadError("");
    setUploading(true);
    onUploadingChange?.(true);

    const results = await Promise.allSettled(
      valid.map(async (file) => {
        const res = await mediaApi.uploadTemp(file);
        const id = res?.data?.id;
        if (!id) throw new Error("فشل الرفع");
        return { uuid: id, preview: URL.createObjectURL(file), name: file.name };
      })
    );

    const done = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) setUploadError(`فشل رفع ${failed} ملف.`);

    setPreviews((p) => [...p, ...done]);
    onUuids([...values, ...done.map((d) => d.uuid)]);
    setUploading(false);
    onUploadingChange?.(false);
  };

  const remove = (uuid) => {
    const item = previews.find((p) => p.uuid === uuid);
    if (item?.preview) URL.revokeObjectURL(item.preview);
    setPreviews((p) => p.filter((x) => x.uuid !== uuid));
    onUuids(values.filter((v) => v !== uuid));
  };

  return (
    <Field label={label} required={required} error={error || uploadError}>
      <div className="rounded-xl border p-3" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs" style={{ color: "var(--gray-10)" }}>
            {values.length ? `${values.length} صورة محددة` : "لم يتم اختيار صور"}
          </span>
          <label
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
            style={{ background: "var(--blue-9)", color: "#fff", opacity: uploading ? 0.6 : 1 }}
          >
            {uploading
              ? <FiLoader className="animate-spin" size={14} />
              : <FiUploadCloud size={14} />}
            رفع صور
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
            />
          </label>
        </div>

        {previews.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {previews.map(({ uuid, preview, name }) => (
              <div
                key={uuid}
                className="flex items-center gap-3 rounded-xl border p-2"
                style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl" style={{ background: "var(--gray-a3)" }}>
                  {preview && <img src={preview} alt={name} className="h-full w-full object-cover" />}
                </div>
                <p className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: "var(--gray-12)" }}>
                  {name}
                </p>
                <button
                  type="button"
                  onClick={() => remove(uuid)}
                  className="rounded-lg p-1.5 transition hover:opacity-80"
                  style={{ color: "var(--red-9)" }}
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewShopRequestPage() {
  const [malls, setMalls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [message, setMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [resetToken, setResetToken] = useState(0);
  const [form, setForm] = useState({
    mallId: "",
    name: "",
    category: "",
    location: "",
    description: "",
    phone: "",
    email: "",
    logoUuid: "",
    licenseImageUuid: "",
    shopPhotosUuids: [],
  });

  const mediaUploading = uploadCount > 0;

  const set = (key, value) => {
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setUploading = (isUploading) =>
    setUploadCount((prev) => Math.max(0, prev + (isUploading ? 1 : -1)));

  useEffect(() => {
    shopRequestApi
      .getAllMalls()
      .then((res) => {
        const data = res?.data ?? res ?? [];
        setMalls(Array.isArray(data) ? data : data?.content || []);
      })
      .catch(() => setMalls([]));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setFieldErrors({});

    if (mediaUploading) {
      setMessage({ type: "error", text: "انتظر حتى ينتهي رفع الملفات." });
      return;
    }

    const errs = {};
    if (!form.mallId)                  errs.mallId            = "يجب اختيار المول";
    if (!form.name.trim())             errs.name              = "اسم المتجر مطلوب";
    if (!form.category)                errs.category          = "فئة المتجر مطلوبة";
    if (!form.location.trim())         errs.location          = "موقع المتجر مطلوب";
    if (!form.licenseImageUuid)        errs.licenseImageUuid  = "صورة الرخصة مطلوبة";
    if (!form.shopPhotosUuids.length)  errs.shopPhotosUuids   = "يجب اختيار صورة واحدة على الأقل للمتجر";

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setMessage({ type: "error", text: "راجع الحقول المطلوبة." });
      return;
    }

    const contactInfo = {};
    if (form.phone.trim()) contactInfo.phone = form.phone.trim();
    if (form.email.trim()) contactInfo.email = form.email.trim();

    const shopRequest = {
      mallId:           Number(form.mallId),
      name:             form.name.trim(),
      category:         form.category,
      location:         form.location.trim(),
      description:      form.description.trim() || null,
      contactInfo:      Object.keys(contactInfo).length ? contactInfo : null,
      logoUuid:         form.logoUuid || null,
      licenseImageUuid: form.licenseImageUuid,
      shopPhotosUuids:  form.shopPhotosUuids,
    };

    setSubmitting(true);
    try {
      await shopRequestApi.submitNewShopRequest(shopRequest);
      setMessage({ type: "success", text: "تم إرسال طلب المتجر للإدارة" });
      setForm({
        mallId: "", name: "", category: "", location: "", description: "",
        phone: "", email: "", logoUuid: "", licenseImageUuid: "", shopPhotosUuids: [],
      });
      setFieldErrors({});
      setResetToken((prev) => prev + 1);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "فشل إرسال الطلب." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6 p-3 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>طلب متجر جديد</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
          أرسل طلب إضافة متجر جديد لحسابك الحالي.
        </p>
      </div>

      {message && (
        <div
          className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm"
          style={{
            background:  message.type === "success" ? "var(--green-a2)" : "var(--red-a2)",
            borderColor: message.type === "success" ? "var(--green-a6)" : "var(--red-a6)",
            color:       message.type === "success" ? "var(--green-11)" : "var(--red-11)",
          }}
        >
          {message.type === "success"
            ? <FiCheckCircle className="mt-0.5 shrink-0" />
            : <FiAlertCircle className="mt-0.5 shrink-0" />}
          {message.text}
        </div>
      )}

      <form
        onSubmit={submit}
        className="rounded-3xl border p-5 sm:p-6 space-y-5"
        style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="المول" required error={fieldErrors.mallId}>
            <select
              className={`${inputCls} dark-select`}
              style={selectSty}
              value={form.mallId}
              onChange={(e) => set("mallId", e.target.value)}
            >
              <option value="">اختر المول</option>
              {malls.map((mall) => (
                <option key={mall.mallId || mall.id} value={mall.mallId || mall.id}>
                  {mall.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="اسم المتجر" required error={fieldErrors.name}>
            <input
              className={inputCls}
              style={inputSty}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>

          <Field label="الفئة" required error={fieldErrors.category}>
            <select
              className={`${inputCls} dark-select`}
              style={selectSty}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">اختر الفئة</option>
              {SHOP_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
              ))}
            </select>
          </Field>

          <Field label="الموقع داخل المول" required error={fieldErrors.location}>
            <input
              className={inputCls}
              style={inputSty}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </Field>

          <Field label="هاتف التواصل" error={fieldErrors.phone}>
            <input
              className={inputCls}
              style={{ ...inputSty, direction: "ltr", textAlign: "left" }}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>

          <Field label="بريد التواصل" error={fieldErrors.email}>
            <input
              type="email"
              className={inputCls}
              style={{ ...inputSty, direction: "ltr", textAlign: "left" }}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
        </div>

        <Field label="وصف المتجر" error={fieldErrors.description}>
          <textarea
            className={inputCls}
            style={{ ...inputSty, minHeight: 84, resize: "vertical" }}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>

        <ImageUploadField
          label="شعار المتجر"
          value={form.logoUuid}
          onUuid={(v) => set("logoUuid", v)}
          onUploadingChange={setUploading}
          error={fieldErrors.logoUuid}
          resetToken={resetToken}
        />

        <ImageUploadField
          label="صورة الرخصة"
          required
          value={form.licenseImageUuid}
          onUuid={(v) => set("licenseImageUuid", v)}
          onUploadingChange={setUploading}
          error={fieldErrors.licenseImageUuid}
          resetToken={resetToken}
        />

        <ImageListUploadField
          label="صور المتجر"
          required
          values={form.shopPhotosUuids}
          onUuids={(v) => set("shopPhotosUuids", v)}
          onUploadingChange={setUploading}
          error={fieldErrors.shopPhotosUuids}
          resetToken={resetToken}
        />

        <button
          type="submit"
          disabled={submitting || mediaUploading}
          className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--blue-9)", color: "#fff" }}
        >
          {submitting ? <FiLoader className="animate-spin" /> : <FiSend />}
          {mediaUploading ? "جاري رفع الملفات..." : "إرسال طلب المتجر"}
        </button>
      </form>
    </div>
  );
}
