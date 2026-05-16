import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import { FiAlertCircle, FiImage, FiInfo, FiLoader, FiLock, FiSave, FiUploadCloud, FiX } from "react-icons/fi";

import { mediaApi } from "../../../api/mediaApi";
import { adsApi, getShopId } from "./api";
import { extractApiError, getAdImageUrl, mapFieldErrors, useThemeContainer } from "./adsUtils";
import { compressImage, validateImageRatio } from "./imageRatioValidator";

export default function EditAdRequestDialog({ open, onOpenChange, request, onUpdated }) {
  const container = useThemeContainer();
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState("");
  const [imageUuid, setImageUuid] = useState("");
  const [fileMeta, setFileMeta] = useState(null);
  const [errors, setErrors] = useState({});
  const [ratioError, setRatioError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open || !request) return;
    setTitle(request.title || "");
    setImageUuid(request.adRequestImageUuid || "");
    setFileMeta(request.adRequestImage || null);
    setErrors({});
    setRatioError("");
    setUploadError("");
    setSaving(false);
    setSubmitError("");
  }, [open, request]);

  if (!request) return null;

  const previewUrl = fileMeta?.mediumFileUrl || fileMeta?.smallFileUrl || fileMeta?.originalFileUrl || getAdImageUrl(request);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !request?.template) return;

    setErrors((current) => ({ ...current, adRequestImageUuid: undefined }));
    setUploadError("");
    setRatioError("");

    if (!file.type.startsWith("image/")) {
      setUploadError("ملف الإعلان يجب أن يكون صورة.");
      return;
    }

    try {
      const ratioCheck = await validateImageRatio(file, request.template.imageRatio, 2);
      if (!ratioCheck.valid) {
        setRatioError(`يجب أن تكون أبعاد الصورة متوافقة مع نسبة القالب: ${request.template.imageRatio}`);
        return;
      }
    } catch (error) {
      setUploadError(error.message || "تعذر قراءة أبعاد الصورة.");
      return;
    }

    setUploading(true);

    try {
      const shopId = getShopId();
      const compressed = await compressImage(file);
      const uploadResponse = await mediaApi.uploadForStore(compressed, shopId);
      const fileId = uploadResponse?.data?.id;
      if (!fileId) throw new Error("تعذر الحصول على معرف الملف بعد الرفع.");

      const verifiedFile = await mediaApi.getStoreFileById(shopId, fileId);
      if (!verifiedFile?.mimeType?.startsWith("image/")) {
        throw new Error("الملف المرفوع ليس صورة صالحة.");
      }

      setImageUuid(fileId);
      setFileMeta({
        ...verifiedFile,
        originalFileUrl: verifiedFile.originalFileUrl || uploadResponse?.data?.originalFileUrl,
        mediumFileUrl: verifiedFile.mediumFileUrl || uploadResponse?.data?.mediumFileUrl,
        smallFileUrl: verifiedFile.smallFileUrl || uploadResponse?.data?.mediumFileUrl,
      });
    } catch (error) {
      setUploadError(error.message || "تعذر رفع الصورة.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const nextErrors = {};
    if (!title.trim() || title.trim().length < 2) nextErrors.title = "العنوان يجب أن يتكون من حرفين على الأقل.";
    if (!imageUuid) nextErrors.adRequestImageUuid = "ارفع صورة صالحة قبل الحفظ.";
    if (ratioError) nextErrors.adRequestImageUuid = ratioError;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setSubmitError("");

    try {
      const updated = await adsApi.updateAdRequest({
        adRequestId: request.adRequestId,
        title: title.trim(),
        adRequestImageUuid: imageUuid,
      });
      onUpdated?.(updated);
      onOpenChange?.(false);
    } catch (error) {
      setErrors(mapFieldErrors(error?.body?.errorCodes));
      setSubmitError(extractApiError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-[82] bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-[83] w-[min(760px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[30px] border shadow-[0_24px_60px_rgba(2,6,23,0.28)]"
          style={{ borderColor: "var(--gray-a5)", background: "var(--gray-2)" }}
        >
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)" }}>
            <div>
              <Dialog.Title className="text-lg font-black" style={{ color: "var(--gray-12)" }}>تعديل طلب الإعلان</Dialog.Title>
              <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>يمكن تعديل عنوان الإعلان وصورته فقط طالما أن الحالة قيد المراجعة.</p>
            </div>

            <Dialog.Close asChild>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-2xl transition"
                style={{ background: "var(--gray-a3)", color: "var(--gray-10)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gray-a4)"; e.currentTarget.style.color = "var(--gray-12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gray-a3)"; e.currentTarget.style.color = "var(--gray-10)"; }}
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
            onChange={handleFileChange}
          />

          <div className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <LockedField label="القالب" value={request.template?.name || "—"} />
              <LockedField label="تاريخ البداية" value={String(request.startDate || "—")} />
              <LockedField label="تاريخ النهاية" value={String(request.endDate || "—")} />
            </div>

            <Tooltip.Provider delayDuration={120}>
              <div
                className="rounded-2xl border px-4 py-3 text-sm"
                style={{ borderColor: "var(--amber-a5)", background: "var(--amber-a2)", color: "var(--amber-11)" }}
              >
                <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <span className="inline-flex cursor-help items-center gap-2 font-semibold">
                        <FiInfo size={15} />
                      لا يمكن تعديل موعد الإعلان بعد إرسال الطلب
                    </span>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      sideOffset={8}
                      className="z-[90] rounded-xl px-3 py-2 text-xs font-medium shadow-lg"
                      style={{ background: "var(--gray-12)", color: "var(--gray-1)" }}
                    >
                      التعديل متاح فقط على العنوان والصورة وفق قواعد الخدمة.
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </div>
            </Tooltip.Provider>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>عنوان الإعلان *</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-12 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition focus:border-blue-300"
                style={{
                  borderColor: errors.title ? "var(--red-a6)" : "var(--gray-a5)",
                  background: "var(--gray-1)",
                  color: "var(--gray-12)",
                }}
              />
              {errors.title ? <p className="text-xs font-semibold" style={{ color: "var(--red-11)" }}>{errors.title}</p> : null}
            </label>

            <div className="overflow-hidden rounded-[28px] border" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
              <div className="aspect-[16/9]" style={{ background: "var(--gray-a3)" }}>
                {previewUrl ? <img src={previewUrl} alt={title} className="h-full w-full object-cover" /> : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{fileMeta?.name || "صورة الإعلان"}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>{request.template?.imageRatio}</p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition"
                  style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)", color: "var(--gray-11)" }}
                >
                  {uploading ? <FiLoader className="animate-spin" size={14} /> : <FiUploadCloud size={14} />}
                  استبدال الصورة
                </button>
              </div>
            </div>

            {ratioError || errors.adRequestImageUuid ? (
              <div
                className="rounded-2xl border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: "var(--red-a5)", background: "var(--red-a2)", color: "var(--red-11)" }}
              >
                {ratioError || errors.adRequestImageUuid}
              </div>
            ) : null}

            {uploadError ? (
              <div
                className="rounded-2xl border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: "var(--red-a5)", background: "var(--red-a2)", color: "var(--red-11)" }}
              >
                {uploadError}
              </div>
            ) : null}

            {submitError ? (
              <div
                className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: "var(--red-a5)", background: "var(--red-a2)", color: "var(--red-11)" }}
              >
                <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
              <FiLock size={13} />
              تبقى التواريخ والقالب ثابتة بعد إنشاء الطلب
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <FiLoader className="animate-spin" size={15} /> : <FiSave size={15} />}
              حفظ التعديلات
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LockedField({ label, value }) {
  return (
    <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
      <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>{label}</p>
      <p className="mt-2 text-sm font-bold" style={{ color: "var(--gray-12)" }}>{value}</p>
    </div>
  );
}
