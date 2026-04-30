import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiAlertCircle, FiLoader, FiUploadCloud, FiX } from "react-icons/fi";
import { MediaUuidField } from "../../account/MediaUuidField";
import { buildApiFormError } from "../../../utils/apiErrors";
import { getMediaPreviewUrl } from "../../../api/mediaManager";

const FIELD_MAP = {
  orderItemId: "orderItemId",
  reason: "reason",
  description: "description",
  imageUuid: "imageUuid",
};

const inputClass =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

export default function ReturnRequestDialog({
  open,
  onOpenChange,
  orderItem,
  submitting,
  onSubmit,
}) {
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [imageUuid, setImageUuid] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setSubmitError("");
    setFieldErrors({});
    setUploading(false);
    setImageUuid("");
    setImageFile(null);
    setReason("");
    setDescription("");
  }, [open, orderItem?.orderItemId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setFieldErrors({});

    try {
      await onSubmit({
        orderItemId: Number(orderItem?.orderItemId),
        reason: reason.trim(),
        description: description.trim() || null,
        imageUuid: imageUuid || null,
      });
      onOpenChange(false);
    } catch (error) {
      const formError = buildApiFormError(error, FIELD_MAP, "فشل إرسال طلب الإرجاع");
      setFieldErrors(formError.fieldErrors);
      setSubmitError(formError.message);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-[110] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-white p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-4">
            <div>
              <Dialog.Title className="text-xl font-semibold text-black">طلب إرجاع</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-black/50">
                اذكر سبب الإرجاع وأرفق صورة توضيحية.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black"
              >
                <FiX />
              </button>
            </Dialog.Close>
          </div>

          {submitError ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" />
              {submitError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px]">
            <div className="space-y-4">
              <label className="space-y-1.5">
                <span className="block text-xs font-semibold text-black/60">سبب الإرجاع</span>
                <textarea
                  className={`${inputClass} min-h-24 resize-none`}
                  value={reason}
                  disabled={submitting}
                  onChange={(event) => {
                    setFieldErrors((current) => ({ ...current, reason: "" }));
                    setReason(event.target.value);
                  }}
                />
                {fieldErrors.reason ? <span className="text-xs text-red-600">{fieldErrors.reason}</span> : null}
              </label>

              <label className="space-y-1.5">
                <span className="block text-xs font-semibold text-black/60">وصف إضافي</span>
                <textarea
                  className={`${inputClass} min-h-28 resize-none`}
                  value={description}
                  disabled={submitting}
                  onChange={(event) => {
                    setFieldErrors((current) => ({ ...current, description: "" }));
                    setDescription(event.target.value);
                  }}
                />
                {fieldErrors.description ? <span className="text-xs text-red-600">{fieldErrors.description}</span> : null}
              </label>

              <MediaUuidField
                label="صورة توضيحية"
                value={imageUuid}
                onChange={setImageUuid}
                file={imageFile}
                onFileChange={setImageFile}
                allowPicker={false}
                uploadMode="temp"
                error={fieldErrors.imageUuid}
                onUploadingChange={setUploading}
              />
            </div>

            <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-4">
              <div className="text-sm font-semibold text-black">العنصر المحدد</div>
              <div className="mt-3 rounded-2xl bg-white p-3">
                <div className="text-sm font-semibold text-black">
                  {orderItem?.productName || "منتج"}
                </div>
                <div className="mt-1 text-xs text-black/50">
                  {orderItem?.variantName || "بدون متغير"}
                </div>
                <div className="mt-2 text-xs text-black/50">
                  الكمية: {orderItem?.quantity || 0}
                </div>
                <div className="mt-2 text-xs text-black/50">
                  معرّف العنصر: #{orderItem?.orderItemId || "-"}
                </div>
              </div>

              {imageFile && getMediaPreviewUrl(imageFile) ? (
                <img
                  src={getMediaPreviewUrl(imageFile)}
                  alt="معاينة"
                  className="mt-4 h-40 w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="mt-4 flex h-40 items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white text-sm text-black/35">
                  <div className="text-center">
                    <FiUploadCloud className="mx-auto mb-2" />
                    ستظهر المعاينة هنا بعد الرفع
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || uploading}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? <FiLoader className="animate-spin" /> : null}
                {uploading ? "انتظر اكتمال الرفع" : "إرسال طلب الإرجاع"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
