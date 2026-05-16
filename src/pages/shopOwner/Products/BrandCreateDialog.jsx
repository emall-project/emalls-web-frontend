import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiAlertCircle, FiCheckCircle, FiImage, FiLoader, FiPlus, FiUploadCloud, FiX } from "react-icons/fi";

import { mediaApi } from "../../../api/mediaApi";
import { auth } from "../../../api/auth";
import { RxSelect } from "../../../components/shopOwner/ui/RxSelect";
import { AGE_GROUP_OPTIONS, AUDIENCE_OPTIONS } from "./constants";
import { productsApi } from "./api";
import { slugifyProductName } from "./productFormUtils";

function extractFieldErrors(errorCodes = []) {
  return (Array.isArray(errorCodes) ? errorCodes : []).reduce((acc, item) => {
    if (item?.field) acc[item.field] = item.message;
    return acc;
  }, {});
}

function extractErrorMessage(error) {
  return error?.response?.message || error?.message || "تعذر إنشاء الماركة.";
}

function FieldError({ children }) {
  if (!children) return null;
  return (
    <p className="mt-1 text-xs font-semibold" style={{ color: "var(--red-10)" }}>
      {children}
    </p>
  );
}

function EmptyBrandForm() {
  return {
    name: "",
    slug: "",
    targetedAudience: "ALL",
    ageGroup: "ALL",
    isActive: true,
    imageId: "",
  };
}

export default function BrandCreateDialog({ open, onOpenChange, onCreated }) {
  const isAdmin = auth.getUser()?.role === "ROLE_ADMIN";
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(EmptyBrandForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imageName, setImageName] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(EmptyBrandForm());
    setSlugTouched(false);
    setFieldErrors({});
    setSubmitError("");
    setImagePreview("");
    setImageName("");
  }, [open]);

  useEffect(() => () => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const canSubmit = useMemo(
    () => Boolean(form.name.trim() && form.slug.trim() && form.imageId && !uploading && !saving),
    [form.imageId, form.name, form.slug, saving, uploading]
  );

  if (!isAdmin) return null;

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSubmitError("");
  }

  function handleNameChange(value) {
    setForm((prev) => {
      const nextSlug = slugifyProductName(value);
      const shouldOverwrite = !slugTouched || prev.slug === slugifyProductName(prev.name);
      return {
        ...prev,
        name: value,
        slug: shouldOverwrite ? nextSlug : prev.slug,
      };
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.name;
      delete next.slug;
      return next;
    });
    setSubmitError("");
  }

  function validate() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "اسم الماركة مطلوب.";
    if (form.name.trim() && form.name.trim().length < 3) nextErrors.name = "اسم الماركة يجب أن يكون 3 أحرف على الأقل.";
    if (!form.slug.trim()) nextErrors.slug = "الـ slug مطلوب.";
    if (!form.imageId) nextErrors.imageId = "ارفع صورة للماركة قبل الإنشاء.";
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFieldErrors((prev) => ({ ...prev, imageId: "ملف الصورة يجب أن يكون صورة صالحة." }));
      return;
    }

    setUploading(true);
    setSubmitError("");
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.imageId;
      return next;
    });

    try {
      const response = await mediaApi.upload(file);
      const uploaded = response?.data ?? response;
      const previewUrl =
        uploaded?.mediumFileUrl ||
        uploaded?.originalFileUrl ||
        uploaded?.smallFileUrl ||
        "";

      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);

      setForm((prev) => ({ ...prev, imageId: uploaded?.id || "" }));
      setImagePreview(previewUrl);
      setImageName(file.name);
    } catch (error) {
      setFieldErrors((prev) => ({ ...prev, imageId: error.message || "تعذر رفع صورة الماركة." }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError("");

    try {
      const response = await productsApi.createBrand({
        name: form.name.trim(),
        slug: form.slug.trim(),
        targetedAudience: form.targetedAudience,
        ageGroup: form.ageGroup,
        isActive: form.isActive,
        imageId: form.imageId,
      });
      const created = response?.data ?? response;
      onCreated?.(created);
      onOpenChange?.(false);
    } catch (error) {
      setFieldErrors((prev) => ({ ...prev, ...extractFieldErrors(error?.errorCodes) }));
      setSubmitError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={document.querySelector(".radix-themes") || document.body}>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-[91] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-[30px] border shadow-[0_24px_60px_rgba(2,6,23,0.28)] outline-none"
          style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
        >
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--gray-a5)" }}>
            <div>
              <Dialog.Title className="text-lg font-black" style={{ color: "var(--gray-12)" }}>
                إضافة ماركة جديدة
              </Dialog.Title>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--gray-9)" }}>
                سيُنشئ النظام الماركة عبر endpoint الإدارة الحقيقي ثم يضيفها مباشرة إلى قائمة الماركات.
              </p>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ background: "var(--gray-a3)", color: "var(--gray-10)" }}
              >
                <FiX size={16} />
              </button>
            </Dialog.Close>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />

          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            {submitError ? (
              <div
                className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold"
                style={{ background: "var(--red-a2)", borderColor: "var(--red-a5)", color: "var(--red-11)" }}
              >
                <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  اسم الماركة *
                </span>
                <input
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  className="h-12 w-full rounded-2xl border px-4 text-sm outline-none"
                  style={{
                    background: "var(--gray-a2)",
                    borderColor: fieldErrors.name ? "var(--red-a6)" : "var(--gray-a5)",
                    color: "var(--gray-12)",
                  }}
                  placeholder="مثال: Nike"
                />
                <FieldError>{fieldErrors.name}</FieldError>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  الرابط (Slug) *
                </span>
                <input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setField("slug", slugifyProductName(event.target.value));
                  }}
                  className="h-12 w-full rounded-2xl border px-4 text-sm outline-none"
                  style={{
                    background: "var(--gray-a2)",
                    borderColor: fieldErrors.slug ? "var(--red-a6)" : "var(--gray-a5)",
                    color: "var(--gray-12)",
                    direction: "ltr",
                  }}
                  placeholder="nike"
                />
                <FieldError>{fieldErrors.slug}</FieldError>
              </label>

              <div className="space-y-1.5">
                <span className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  الجمهور المستهدف *
                </span>
                <RxSelect
                  value={form.targetedAudience}
                  onValueChange={(value) => setField("targetedAudience", value)}
                  options={AUDIENCE_OPTIONS}
                  placeholder="اختر الجمهور"
                  error={Boolean(fieldErrors.targetedAudience)}
                />
                <FieldError>{fieldErrors.targetedAudience}</FieldError>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  الفئة العمرية *
                </span>
                <RxSelect
                  value={form.ageGroup}
                  onValueChange={(value) => setField("ageGroup", value)}
                  options={AGE_GROUP_OPTIONS}
                  placeholder="اختر الفئة العمرية"
                  error={Boolean(fieldErrors.ageGroup)}
                />
                <FieldError>{fieldErrors.ageGroup}</FieldError>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-1.5">
                <span className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  صورة الماركة *
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-[148px] w-full flex-col items-center justify-center gap-3 rounded-[26px] border border-dashed px-5 py-6 text-center"
                  style={{
                    background: "var(--gray-a2)",
                    borderColor: fieldErrors.imageId ? "var(--red-a6)" : "var(--gray-a5)",
                    color: "var(--gray-10)",
                  }}
                >
                  {uploading ? (
                    <>
                      <FiLoader size={22} className="animate-spin" />
                      <span className="text-sm font-semibold">جارٍ رفع صورة الماركة...</span>
                    </>
                  ) : (
                    <>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "var(--blue-a2)", color: "var(--blue-10)" }}>
                        <FiUploadCloud size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">ارفع صورة الماركة</p>
                        <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                          JPG, PNG, WEBP
                        </p>
                      </div>
                    </>
                  )}
                </button>
                <FieldError>{fieldErrors.imageId}</FieldError>
              </div>

              <div
                className="overflow-hidden rounded-[26px] border"
                style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
              >
                <div className="flex aspect-square items-center justify-center" style={{ background: "var(--gray-a3)" }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt={form.name || "Brand preview"} className="h-full w-full object-cover" />
                  ) : (
                    <FiImage size={28} style={{ color: "var(--gray-8)" }} />
                  )}
                </div>
                <div className="px-4 py-3">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                    {imageName || "لم تُرفع صورة بعد"}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                    سيُرسل النظام المعرّف الحقيقي للصورة فقط.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="flex items-center justify-between rounded-[22px] border px-4 py-3"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                  حالة الماركة
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                  تُرسل القيمة بالشكل المطلوب.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setField("isActive", !form.isActive)}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold"
                style={{
                  background: form.isActive ? "var(--green-a3)" : "var(--gray-a4)",
                  color: form.isActive ? "var(--green-11)" : "var(--gray-11)",
                }}
              >
                <FiCheckCircle size={15} />
                {form.isActive ? "نشطة" : "غير نشطة"}
              </button>
            </div>

            <div className="flex justify-end gap-3 border-t pt-5" style={{ borderColor: "var(--gray-a5)" }}>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-2xl border px-5 py-3 text-sm font-semibold"
                  style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)", color: "var(--gray-11)" }}
                >
                  إلغاء
                </button>
              </Dialog.Close>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--blue-9)" }}
              >
                {saving ? <FiLoader size={15} className="animate-spin" /> : <FiPlus size={15} />}
                إنشاء الماركة
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
