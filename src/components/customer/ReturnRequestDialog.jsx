import { useState, useEffect } from "react";
import { FiX, FiUploadCloud, FiAlertCircle } from "react-icons/fi";
import { mediaApi } from "../../api/mediaApi";

function revokeObjectUrl(url) {
  if (url && String(url).startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function ReturnRequestDialog({ open, onOpenChange, orderItem, onSubmit }) {
  const [reason,      setReason]      = useState("");
  const [description, setDescription] = useState("");
  const [imageFile,   setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading,   setUploading]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setDescription("");
      setImageFile(null);
      setImagePreview((currentPreview) => {
        revokeObjectUrl(currentPreview);
        return "";
      });
      setError("");
    }
  }, [open, orderItem?.orderItemId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onOpenChange(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  useEffect(() => () => revokeObjectUrl(imagePreview), [imagePreview]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    revokeObjectUrl(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    revokeObjectUrl(imagePreview);
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError("سبب الإرجاع مطلوب"); return; }
    if (!imageFile) { setError("إرفاق صورة توضيحية مطلوب"); return; }

    setError(""); setSubmitting(true);
    let imageUuid = null;
    try {
      if (imageFile) {
        setUploading(true);
        const result = await mediaApi.uploadTemp(imageFile);
        imageUuid = result?.data?.id ?? null;
        setUploading(false);
      }
      await onSubmit({
        orderItemId: Number(orderItem?.orderItemId),
        reason:      reason.trim(),
        description: description.trim() || null,
        imageUuid,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "فشل إرسال طلب الإرجاع");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        dir="rtl"
        className="fixed left-1/2 top-1/2 z-[110] w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[90vh] rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 sticky top-0 bg-white rounded-t-3xl z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">طلب إرجاع</h2>
            <p className="text-sm text-slate-500 mt-0.5">اذكر سبب الإرجاع وأرفق صورة إن لزم</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
              {error}
            </div>
          )}

          {/* Item info */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">العنصر المحدد</p>
            <p className="font-semibold text-slate-900">{orderItem?.productName || "منتج"}</p>
            {orderItem?.variantName && (
              <p className="text-xs text-slate-500 mt-0.5">{orderItem.variantName}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">الكمية: {orderItem?.quantity ?? 0}</p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              سبب الإرجاع <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={submitting}
              rows={3}
              required
              minLength={3}
              maxLength={500}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none resize-none transition focus:border-slate-800"
              placeholder="اذكر سبب الإرجاع بشكل واضح..."
            />
            <p className="text-[11px] text-slate-400 mt-1 text-left" dir="ltr">{reason.length}/500</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">وصف إضافي</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={submitting}
              rows={3}
              maxLength={2000}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none resize-none transition focus:border-slate-800"
              placeholder="تفاصيل إضافية (اختياري)..."
            />
            <p className="text-[11px] text-slate-400 mt-1 text-left" dir="ltr">{description.length}/2000</p>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              صورة توضيحية <span className="text-red-500">*</span>
            </label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="معاينة" className="w-full h-44 rounded-2xl object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <FiX size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
                <FiUploadCloud size={22} className="text-slate-400 mb-2" />
                <span className="text-sm text-slate-400">اضغط لاختيار صورة توضيحية</span>
                <span className="text-xs text-slate-300 mt-0.5">JPG, PNG, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={submitting}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              يشترط النظام إرفاق صورة قبل إرسال طلب الإرجاع.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full h-12 rounded-2xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
          >
            {uploading ? "جاري رفع الصورة..." : submitting ? "جاري الإرسال..." : "إرسال طلب الإرجاع"}
          </button>
        </form>
      </div>
    </>
  );
}
