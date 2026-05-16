import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiAlertTriangle, FiClock, FiCreditCard, FiEdit2, FiEye, FiImage, FiLoader, FiSlash, FiX } from "react-icons/fi";

import { getAdPositionLabel } from "../../../data/adSlots";
import { adsApi } from "./api";
import AdStatusBadge from "./AdStatusBadge";
import PaymentStatusBadge from "./PaymentStatusBadge";
import {
  calculateBillableHours,
  extractApiError,
  formatDateTime,
  formatUsd,
  getAdImageUrl,
  isPayableRequest,
  isPendingRequest,
  useThemeContainer,
} from "./adsUtils";

export default function AdDetailsDrawer({
  open,
  onOpenChange,
  request,
  onEdit,
  onCancel,
  onPay,
  onOpenHistory,
}) {
  const container = useThemeContainer();
  const [details, setDetails] = useState(request || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!open || !request?.adRequestId) return;
    let active = true;
    setLoading(true);
    setError("");
    adsApi
      .getAdRequestById(request.adRequestId)
      .then((data) => {
        if (!active) return;
        setDetails(data || request);
      })
      .catch((err) => {
        if (!active) return;
        setDetails(request);
        setError(extractApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, request]);

  const current = details || request;
  const imageUrl = getAdImageUrl(current, true);
  const hours = useMemo(
    () => calculateBillableHours(current?.startDate, current?.endDate),
    [current?.startDate, current?.endDate]
  );
  const canPay = isPayableRequest(current);

  if (!current) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-[82] bg-slate-950/30 backdrop-blur-sm" />
        <Dialog.Content
          dir="rtl"
          className="fixed right-4 top-4 z-[83] h-[calc(100vh-32px)] w-[min(860px,calc(100vw-32px))] rounded-[32px] border shadow-[0_24px_60px_rgba(2,6,23,0.28)]"
          style={{ background: "var(--gray-2)", borderColor: "var(--gray-a5)" }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)" }}>
              <div>
                <Dialog.Title className="text-lg font-black" style={{ color: "var(--gray-12)" }}>تفاصيل الإعلان</Dialog.Title>
                <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>#{current.adRequestId}</p>
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

            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="rounded-[24px] border px-5 py-12 text-center" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
                  <FiLoader className="mx-auto animate-spin" size={24} style={{ color: "var(--blue-9)" }} />
                  <p className="mt-4 text-sm font-semibold" style={{ color: "var(--gray-11)" }}>جارٍ تحميل التفاصيل…</p>
                </div>
              ) : null}

              {error ? (
                <div className="mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--red-a5)", background: "var(--red-a2)", color: "var(--red-11)" }}>{error}</div>
              ) : null}

              <div className="space-y-5">
                <section className="rounded-[28px] border p-5" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>العنوان</p>
                      <h2 className="mt-1 text-2xl font-black" style={{ color: "var(--gray-12)" }}>{current.title}</h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AdStatusBadge status={current.status} />
                      <PaymentStatusBadge status={current.paymentStatus} />
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          background: current.isDisplayed ? "var(--blue-a3)" : "var(--gray-a3)",
                          color: current.isDisplayed ? "var(--blue-11)" : "var(--gray-11)",
                        }}
                      >
                        {current.isDisplayed ? "معروض" : "غير معروض"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoCard label="السعر الإجمالي" value={formatUsd(current.totalPrice)} />
                    <InfoCard label="تاريخ الدفع" value={formatDateTime(current.paidAt)} />
                    <InfoCard label="المدة" value={hours ? `${hours} ساعة` : "—"} />
                    <InfoCard label="حالة العرض" value={current.isDisplayed ? "الإعلان مباشر الآن" : "غير مباشر"} />
                  </div>
                </section>

                <section className="rounded-[28px] border p-5" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)" }}>
                  <SectionTitle icon={<FiImage size={16} />} title="معاينة الصورة" />
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="mt-4 overflow-hidden rounded-[24px] border"
                    style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt={current.title} className="max-h-[320px] w-full object-cover" />
                    ) : (
                      <div className="flex h-56 items-center justify-center text-sm font-semibold" style={{ color: "var(--gray-8)" }}>لا توجد صورة</div>
                    )}
                  </button>
                </section>

                <section className="rounded-[28px] border p-5" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)" }}>
                  <SectionTitle icon={<FiEye size={16} />} title="معلومات القالب" />
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoCard label="اسم القالب" value={current.template?.name || "—"} />
                    <InfoCard label="مكان الظهور" value={getAdPositionLabel(current.template?.position)} />
                    <InfoCard label="نسبة الصورة" value={current.template?.imageRatio || "—"} />
                    <InfoCard label="سعر الساعة" value={formatUsd(current.template?.pricePerHour)} />
                  </div>
                  <p className="mt-4 text-sm leading-7" style={{ color: "var(--gray-9)" }}>{current.template?.description || "لا يوجد وصف إضافي لهذا القالب."}</p>
                </section>

                <section className="rounded-[28px] border p-5" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)" }}>
                  <SectionTitle icon={<FiClock size={16} />} title="الجدولة" />
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <InfoCard label="تاريخ البداية" value={formatDateTime(current.startDate)} />
                    <InfoCard label="تاريخ النهاية" value={formatDateTime(current.endDate)} />
                    <InfoCard label="حالة البث" value={current.isDisplayed ? "يُعرض حاليًا" : "غير معروض حاليًا"} />
                  </div>
                </section>

                {current.status === "REJECTED" ? (
                  <section className="rounded-[28px] border p-5" style={{ borderColor: "var(--red-a5)", background: "var(--red-a2)" }}>
                    <SectionTitle icon={<FiAlertTriangle size={16} />} title="معلومات الرفض" />
                    <p className="mt-4 text-sm font-semibold" style={{ color: "var(--red-11)" }}>
                      {current.rejectionReason === "Cancelled by shop owner"
                        ? "تم إلغاء الطلب من قبل المتجر"
                        : current.rejectionReason || "تم رفض الطلب بدون سبب مفصل."}
                    </p>
                  </section>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
              <button
                type="button"
                onClick={() => onOpenHistory?.(current)}
                className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition"
                style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)", color: "var(--gray-11)" }}
              >
                <FiCreditCard size={15} />
                سجل الدفع
              </button>

              <div className="flex flex-wrap gap-2">
                {isPendingRequest(current) ? (
                  <button
                    type="button"
                    onClick={() => onEdit?.(current)}
                    className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition"
                    style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)", color: "var(--gray-11)" }}
                  >
                    <FiEdit2 size={15} />
                    تعديل
                  </button>
                ) : null}

                {isPendingRequest(current) ? (
                  <button
                    type="button"
                    onClick={() => onCancel?.(current)}
                    className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition"
                    style={{ borderColor: "var(--red-a5)", background: "var(--red-a2)", color: "var(--red-11)" }}
                  >
                    <FiSlash size={15} />
                    إلغاء الطلب
                  </button>
                ) : null}

                {canPay ? (
                  <button
                    type="button"
                    onClick={() => onPay?.(current)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <FiCreditCard size={15} />
                    دفع الإعلان
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
            <Dialog.Portal container={container}>
              <Dialog.Overlay className="fixed inset-0 z-[84] bg-slate-950/60 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-[85] w-[min(980px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] bg-black">
                {imageUrl ? <img src={imageUrl} alt={current.title} className="max-h-[85vh] w-full object-contain" /> : null}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2" style={{ color: "var(--gray-12)" }}>
      <span className="rounded-xl p-2" style={{ background: "var(--blue-a3)", color: "var(--blue-9)" }}>{icon}</span>
      <h3 className="text-base font-black">{title}</h3>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
      <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>{label}</p>
      <p className="mt-2 text-sm font-bold" style={{ color: "var(--gray-12)" }}>{value}</p>
    </div>
  );
}
