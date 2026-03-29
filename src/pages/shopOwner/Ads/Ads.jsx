import { useState, useEffect, useCallback, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiPlus, FiEdit2, FiX, FiAlertCircle, FiLoader, FiCreditCard, FiEye, FiUpload } from "react-icons/fi";
import { shopAdsApi } from "./api";
import { mediaApi } from "../../../api/mediaApi";

// ── Helpers ───────────────────────────────────────────────────────────────────
function useThemeContainer() {
  const [c, setC] = useState(null);
  useEffect(() => { setC(document.querySelector(".radix-themes") || document.body); }, []);
  return c;
}

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-9999 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium"
      style={{
        background: type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color: type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}>
      {message}
      <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-1">✕</button>
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-11)" }}>
      {children}{required && <span style={{ color: "var(--red-9)" }}> *</span>}
    </label>
  );
}

// ── Badges ────────────────────────────────────────────────────────────────────
const REQUEST_STATUS_MAP = {
  PENDING:  { bg: "var(--yellow-a3)", fg: "var(--yellow-11)", dot: "var(--yellow-9)", label: "قيد المراجعة" },
  APPROVED: { bg: "var(--green-a3)",  fg: "var(--green-11)",  dot: "var(--green-9)",  label: "مقبول" },
  REJECTED: { bg: "var(--red-a3)",    fg: "var(--red-11)",    dot: "var(--red-9)",    label: "مرفوض" },
};

const PAYMENT_MAP = {
  UNPAID: { bg: "var(--orange-a3)", fg: "var(--orange-11)", label: "غير مدفوع" },
  PAID:   { bg: "var(--green-a3)",  fg: "var(--green-11)",  label: "مدفوع" },
};

function RequestStatusBadge({ status }) {
  const s = REQUEST_STATUS_MAP[status] || { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)", label: status };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function PaymentBadge({ status }) {
  const p = PAYMENT_MAP[status] || { bg: "var(--gray-a3)", fg: "var(--gray-11)", label: status };
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: p.bg, color: p.fg }}>
      {p.label}
    </span>
  );
}

// ── Ad Request Form Dialog ────────────────────────────────────────────────────
function AdRequestFormDialog({ open, onOpenChange, template, request, onSuccess }) {
  const themeContainer = useThemeContainer();
  const isEdit = !!request;
  const tpl = isEdit ? request.template : template;
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [imageId, setImageId] = useState("");       // UUID saved, sent to backend
  const [previewUrl, setPreviewUrl] = useState(""); // mediumFileUrl for display only
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setTitle(isEdit ? request.title : "");
      setPreviewUrl("");
      if (isEdit && request.imageUrl) {
        setImageId(request.imageUrl);
        // Load preview for existing UUID
        mediaApi.getById(request.imageUrl)
          .then(r => setPreviewUrl(r?.data?.mediumFileUrl || r?.data?.originalFileUrl || ""))
          .catch(() => {});
      } else {
        setImageId("");
      }
    }
  }, [open, request, isEdit]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const res = await mediaApi.upload(file);
      setImageId(res.data.id);                      // UUID — this goes to backend
      setPreviewUrl(res.data.mediumFileUrl);         // signed URL — display only
    } catch (err) {
      setError(err.message || "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("العنوان مطلوب");
    if (!imageId) return setError("يرجى رفع صورة الإعلان");
    setSaving(true); setError("");
    try {
      if (isEdit) {
        await shopAdsApi.update({
          adRequestId: request.adRequestId,
          shopId: 1,
          title: title.trim(),
          imageUrl: imageId,
        });
      } else {
        await shopAdsApi.create({
          templateId: template.adTemplateId,
          shopId: 1,
          title: title.trim(),
          imageUrl: imageId,
        });
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-9990"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-9991 flex items-center justify-center p-4"
          aria-describedby={undefined}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>

            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
              style={{ borderColor: "var(--gray-a6)" }}>
              <Dialog.Title className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                {isEdit ? "تعديل طلب الإعلان" : "طلب إعلان"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ color: "var(--gray-11)" }}>
                  <FiX size={18} />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                  style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}>
                  <FiAlertCircle size={15} /><span>{error}</span>
                </div>
              )}

              {/* Template info — read only */}
              {tpl && (
                <div className="rounded-xl p-4 space-y-2"
                  style={{ background: "var(--blue-a2)", border: "1px solid var(--blue-a4)" }}>
                  <p className="font-semibold text-sm" style={{ color: "var(--blue-11)" }}>{tpl.name}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: "var(--blue-10)" }}>
                    <span>الموقع: <strong>{tpl.position}</strong></span>
                    <span>نسبة الصورة: <strong>{tpl.imageRatio}</strong></span>
                    <span>السعر: <strong>{tpl.price} ₪</strong></span>
                    <span>من {tpl.startDate} إلى {tpl.endDate}</span>
                  </div>
                </div>
              )}

              <div>
                <FieldLabel required>عنوان الإعلان</FieldLabel>
                <input
                  className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none border transition"
                  style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl", textAlign: "right" }}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: تخفيضات الصيف"
                  required
                />
              </div>

              {/* Image upload */}
              <div>
                <FieldLabel required>صورة الإعلان</FieldLabel>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Upload button / preview */}
                {previewUrl || imageId ? (
                  <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: "var(--gray-a5)" }}>
                    {previewUrl && (
                      <img src={previewUrl} alt="معاينة" className="w-full object-cover max-h-40" />
                    )}
                    {!previewUrl && imageId && (
                      <div className="flex items-center justify-center h-20 text-xs" style={{ color: "var(--gray-10)" }}>
                        تم الرفع ✓ ({imageId.slice(0, 8)}...)
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute bottom-2 left-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-90"
                      style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                    >
                      {uploading ? <Spinner size={12} /> : <FiUpload size={12} />}
                      تغيير الصورة
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed transition hover:opacity-80 disabled:opacity-50"
                    style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}
                  >
                    {uploading ? <Spinner size={20} /> : <FiUpload size={20} />}
                    <span className="text-sm font-medium">
                      {uploading ? "جاري الرفع..." : "اضغط لرفع صورة الإعلان"}
                    </span>
                    <span className="text-xs" style={{ color: "var(--gray-9)" }}>PNG, JPG, WEBP</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-medium border transition hover:opacity-80"
                    style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                    إلغاء
                  </button>
                </Dialog.Close>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#2563eb", color: "#fff" }}>
                  {saving && <Spinner size={14} />}
                  {isEdit ? "حفظ التعديلات" : "إرسال الطلب"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Pay Confirm Dialog ────────────────────────────────────────────────────────
function PayDialog({ open, onOpenChange, request, onSuccess }) {
  const themeContainer = useThemeContainer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (open) setError(""); }, [open]);

  const handlePay = async () => {
    setLoading(true); setError("");
    try {
      await shopAdsApi.pay(request.adRequestId);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "فشل في تأكيد الدفع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-9990" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-9991 flex items-center justify-center p-4" aria-describedby={undefined}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--green-a3)" }}>
                <FiCreditCard size={18} style={{ color: "var(--green-11)" }} />
              </div>
              <div>
                <h2 className="font-bold text-base" style={{ color: "var(--gray-12)" }}>تأكيد الدفع</h2>
                <p className="text-xs" style={{ color: "var(--gray-10)" }}>{request?.template?.name}</p>
              </div>
            </div>

            {request && (
              <div className="rounded-xl p-3 mb-4 space-y-1.5 text-sm"
                style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a5)" }}>
                <div className="flex justify-between">
                  <span style={{ color: "var(--gray-10)" }}>العنوان</span>
                  <span className="font-medium" style={{ color: "var(--gray-12)" }}>{request.title}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--gray-10)" }}>المبلغ</span>
                  <span className="font-bold" style={{ color: "var(--green-11)" }}>{request.template?.price} ₪</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--gray-10)" }}>الفترة</span>
                  <span style={{ color: "var(--gray-12)" }}>{request.template?.startDate} → {request.template?.endDate}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-3"
                style={{ background: "var(--red-a3)", color: "var(--red-11)" }}>
                <FiAlertCircle size={14} />{error}
              </div>
            )}

            <div className="flex gap-3">
              <Dialog.Close asChild>
                <button className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition hover:opacity-80"
                  style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>
                  إلغاء
                </button>
              </Dialog.Close>
              <button onClick={handlePay} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--green-9)", color: "#fff" }}>
                {loading ? <Spinner size={14} /> : <FiCreditCard size={14} />}
                تأكيد الدفع
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Status Filter Tabs ────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: "", label: "الكل" },
  { value: "PENDING",  label: "قيد المراجعة" },
  { value: "APPROVED", label: "مقبول" },
  { value: "REJECTED", label: "مرفوض" },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Ads() {
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const [ads, setAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formTemplate, setFormTemplate] = useState(null); // for new request
  const [editRequest, setEditRequest] = useState(null);   // for edit

  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  // Fetch templates once
  useEffect(() => {
    setTemplatesLoading(true);
    shopAdsApi.getTemplates()
      .then(r => {
        const all = r?.data?.content || r?.data || [];
        setTemplates(all.filter(t => t.status === "ACTIVE"));
      })
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, []);

  // Fetch my requests
  const fetchAds = useCallback(async () => {
    setAdsLoading(true); setAdsError("");
    try {
      const res = statusFilter
        ? await shopAdsApi.getByStatus(statusFilter)
        : await shopAdsApi.getAll();
      setAds(res?.data || []);
    } catch (e) {
      setAdsError(e.message || "فشل في جلب البيانات");
      setAds([]);
    } finally {
      setAdsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const handleRequestNew = (template) => {
    setEditRequest(null);
    setFormTemplate(template);
    setFormOpen(true);
  };

  const handleEdit = (ad) => {
    setFormTemplate(null);
    setEditRequest(ad);
    setFormOpen(true);
  };

  const handlePay = (ad) => { setPayTarget(ad); setPayOpen(true); };

  return (
    <div dir="rtl" className="p-4 sm:p-6 space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Section 1: Available Templates ── */}
      <div>
        <div className="mb-4">
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>القوالب الإعلانية المتاحة</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--gray-10)" }}>اختر قالباً وأرسل طلب إعلان</p>
        </div>

        <div className="rounded-2xl overflow-hidden overflow-x-auto"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
          {templatesLoading ? (
            <div className="flex justify-center py-10"><Spinner size={24} /></div>
          ) : templates.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: "var(--gray-9)" }}>لا توجد قوالب متاحة حالياً</div>
          ) : (
            <table className="w-full text-sm" style={{ minWidth: 650 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gray-a6)", background: "var(--gray-a2)" }}>
                  {["اسم القالب", "الموقع", "نسبة الصورة", "السعر", "الفترة", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map((t, i) => (
                  <tr key={t.adTemplateId}
                    style={{ borderBottom: i < templates.length - 1 ? "1px solid var(--gray-a4)" : "none" }}>
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: "var(--gray-12)" }}>{t.name}</div>
                      {t.description && <div className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>{t.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--gray-11)" }}>{t.position}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--gray-11)" }}>{t.imageRatio}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ color: "var(--green-11)" }}>{t.price} ₪</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--gray-11)" }}>
                      {t.startDate} → {t.endDate}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRequestNew(t)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80 whitespace-nowrap"
                        style={{ background: "var(--blue-9)", color: "#fff" }}
                      >
                        <FiPlus size={12} /> طلب إعلان
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Section 2: My Requests ── */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>طلباتي</h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--gray-10)" }}>
              {ads.length > 0 ? `${ads.length} طلب` : "لا توجد طلبات"}
            </p>
          </div>
          {/* Status filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition border"
                style={{
                  background: statusFilter === f.value ? "var(--blue-9)" : "transparent",
                  color: statusFilter === f.value ? "#fff" : "var(--gray-11)",
                  borderColor: statusFilter === f.value ? "var(--blue-9)" : "var(--gray-a6)",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {adsError && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl mb-4"
            style={{ background: "var(--red-2)", border: "1px solid var(--red-6)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--red-11)" }}>
              <FiAlertCircle size={15} /><span>{adsError}</span>
            </div>
            <button onClick={fetchAds} className="text-xs font-semibold underline" style={{ color: "var(--red-11)" }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {adsLoading ? (
          <div className="flex justify-center py-10"><Spinner size={24} /></div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center rounded-2xl"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="text-4xl mb-3">📢</div>
            <p className="font-semibold text-sm" style={{ color: "var(--gray-11)" }}>لا توجد طلبات</p>
            <p className="text-xs mt-1" style={{ color: "var(--gray-9)" }}>اختر قالباً من الجدول أعلاه وأرسل طلبك</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden overflow-x-auto"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <table className="w-full text-sm" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gray-a6)", background: "var(--gray-a2)" }}>
                  {["الإعلان", "القالب", "الحالة", "الدفع", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ads.map((ad, i) => (
                  <tr key={ad.adRequestId}
                    style={{ borderBottom: i < ads.length - 1 ? "1px solid var(--gray-a4)" : "none" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0"
                          style={{ background: "var(--gray-a3)" }}>
                          {ad.imageUrl && (
                            <img src={ad.imageUrl} alt="" className="w-full h-full object-cover"
                              onError={e => e.currentTarget.style.display = "none"} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: "var(--gray-12)" }}>{ad.title}</div>
                          {ad.rejectionReason && (
                            <div className="text-xs mt-0.5" style={{ color: "var(--red-10)" }}>
                              سبب الرفض: {ad.rejectionReason}
                            </div>
                          )}
                          {ad.isDisplayed && (
                            <span className="inline-flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--purple-11)" }}>
                              <FiEye size={10} /> يُعرض الآن
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--gray-11)" }}>
                      <div>{ad.template?.name}</div>
                      <div style={{ color: "var(--gray-9)" }}>{ad.template?.position}</div>
                    </td>
                    <td className="px-4 py-3"><RequestStatusBadge status={ad.status} /></td>
                    <td className="px-4 py-3"><PaymentBadge status={ad.paymentStatus} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {ad.status === "PENDING" && (
                          <button onClick={() => handleEdit(ad)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                            <FiEdit2 size={11} /> تعديل
                          </button>
                        )}
                        {ad.status === "APPROVED" && ad.paymentStatus === "UNPAID" && (
                          <button onClick={() => handlePay(ad)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80"
                            style={{ background: "var(--green-9)", color: "#fff" }}>
                            <FiCreditCard size={11} /> ادفع
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AdRequestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        template={formTemplate}
        request={editRequest}
        onSuccess={() => {
          fetchAds();
          showToast(editRequest ? "تم تعديل الطلب" : "تم إرسال الطلب بنجاح");
        }}
      />
      <PayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        request={payTarget}
        onSuccess={() => { fetchAds(); showToast("تم تأكيد الدفع بنجاح"); }}
      />
    </div>
  );
}
