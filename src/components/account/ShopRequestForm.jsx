import { useEffect, useState } from "react";
import { FiAlertCircle, FiLoader, FiSend } from "react-icons/fi";
import { accountsApi, unwrapAccountPayload } from "../../api/accounts";
import { SHOP_CATEGORIES, CATEGORY_LABELS } from "../../pages/admin/ShopManagement/constants";
import { MediaUuidField, MediaUuidListField } from "./MediaUuidField";

const inputClass = "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const inputStyle = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" };

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
        {label} {required ? <span style={{ color: "var(--red-9)" }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}

export function ShopRequestForm({
  onSubmit,
  submitLabel = "إرسال الطلب",
  submitting = false,
  allowPicker = false,
  pickerMode = "admin",
  storeId,
}) {
  const [malls, setMalls] = useState([]);
  const [error, setError] = useState("");
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
  const [logoFile, setLogoFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);

  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  useEffect(() => {
    accountsApi.malls.all()
      .then((response) => {
        const data = unwrapAccountPayload(response);
        setMalls(Array.isArray(data) ? data : data?.content || []);
      })
      .catch(() => setMalls([]));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.mallId) return setError("يجب اختيار المول");
    if (!form.name.trim()) return setError("اسم المتجر مطلوب");
    if (!form.category) return setError("فئة المتجر مطلوبة");
    if (!form.location.trim()) return setError("موقع المتجر مطلوب");
    if (!form.licenseImageUuid.trim()) return setError("صورة الرخصة مطلوبة");
    if (!form.shopPhotosUuids.length) return setError("يجب اختيار صورة واحدة على الأقل للمتجر");

    const contactInfo = {};
    if (form.phone.trim()) contactInfo.phone = form.phone.trim();
    if (form.email.trim()) contactInfo.email = form.email.trim();

    await onSubmit?.({
      mallId: Number(form.mallId),
      name: form.name.trim(),
      category: form.category,
      location: form.location.trim(),
      description: form.description.trim() || null,
      contactInfo: Object.keys(contactInfo).length ? contactInfo : null,
      logoUuid: form.logoUuid.trim() || null,
      licenseImageUuid: form.licenseImageUuid.trim(),
      shopPhotosUuids: form.shopPhotosUuids,
    });
  };

  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm" style={{ background: "var(--red-a2)", borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
          <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="المول" required>
          <select className={inputClass} style={inputStyle} value={form.mallId} onChange={(event) => set("mallId", event.target.value)}>
            <option value="">اختر المول</option>
            {malls.map((mall) => (
              <option key={mall.mallId || mall.id} value={mall.mallId || mall.id}>
                {mall.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="اسم المتجر" required>
          <input className={inputClass} style={inputStyle} value={form.name} onChange={(event) => set("name", event.target.value)} />
        </Field>
        <Field label="الفئة" required>
          <select className={inputClass} style={inputStyle} value={form.category} onChange={(event) => set("category", event.target.value)}>
            <option value="">اختر الفئة</option>
            {SHOP_CATEGORIES.map((category) => (
              <option key={category} value={category}>{CATEGORY_LABELS[category] || category}</option>
            ))}
          </select>
        </Field>
        <Field label="الموقع داخل المول" required>
          <input className={inputClass} style={inputStyle} value={form.location} onChange={(event) => set("location", event.target.value)} />
        </Field>
        <Field label="هاتف التواصل">
          <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.phone} onChange={(event) => set("phone", event.target.value)} />
        </Field>
        <Field label="بريد التواصل">
          <input type="email" className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.email} onChange={(event) => set("email", event.target.value)} />
        </Field>
      </div>

      <Field label="وصف المتجر">
        <textarea className={inputClass} style={{ ...inputStyle, minHeight: 84, resize: "vertical" }} value={form.description} onChange={(event) => set("description", event.target.value)} />
      </Field>

      <MediaUuidField
        label="شعار المتجر"
        value={form.logoUuid}
        onChange={(value) => set("logoUuid", value)}
        file={logoFile}
        onFileChange={setLogoFile}
        allowPicker={allowPicker}
        mode={pickerMode}
        storeId={storeId}
        pickerTitle="اختيار شعار المتجر"
      />

      <MediaUuidField
        label="صورة الرخصة"
        required
        value={form.licenseImageUuid}
        onChange={(value) => set("licenseImageUuid", value)}
        file={licenseFile}
        onFileChange={setLicenseFile}
        allowPicker={allowPicker}
        mode={pickerMode}
        storeId={storeId}
        pickerTitle="اختيار صورة الرخصة"
      />

      <MediaUuidListField
        label="صور المتجر"
        required
        values={form.shopPhotosUuids}
        onChange={(value) => set("shopPhotosUuids", value)}
        files={photoFiles}
        onFilesChange={setPhotoFiles}
        allowPicker={allowPicker}
        mode={pickerMode}
        storeId={storeId}
        pickerTitle="اختيار صور المتجر"
      />

      <button type="submit" disabled={submitting} className="inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50" style={{ background: "var(--blue-9)", color: "#fff" }}>
        {submitting ? <FiLoader className="animate-spin" /> : <FiSend />}
        {submitLabel}
      </button>
    </form>
  );
}
