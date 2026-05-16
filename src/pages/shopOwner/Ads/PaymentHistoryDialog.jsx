import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiCreditCard, FiExternalLink, FiLoader, FiX } from "react-icons/fi";

import { adsApi } from "./api";
import {
  extractApiError,
  formatDateTime,
  formatUsd,
  PAYMENT_RECORD_STATUS_LABELS,
  useThemeContainer,
} from "./adsUtils";

const STATUS_STYLES = {
  SUCCESS:  { background: "var(--green-a3)",  color: "var(--green-11)"  },
  FAILED:   { background: "var(--red-a3)",    color: "var(--red-11)"    },
  REFUNDED: { background: "var(--blue-a3)",   color: "var(--blue-11)"   },
};

export default function PaymentHistoryDialog({ open, onOpenChange, request, onRefreshSource }) {
  const container = useThemeContainer();
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError("");

    const loader = request
      ? adsApi.getRequestPaymentHistory(request.adRequestId)
      : adsApi.getShopPaymentHistory();

    loader
      .then((data) => { if (active) setPayments(Array.isArray(data) ? data : []); })
      .catch((err) => { if (active) setError(extractApiError(err)); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [open, request, onRefreshSource]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-[82] bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-[83] max-h-[86vh] w-[min(920px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[30px] border shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
          style={{ background: "var(--gray-2)", borderColor: "var(--gray-a5)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)" }}
          >
            <div>
              <Dialog.Title className="text-lg font-black" style={{ color: "var(--gray-12)" }}>
                سجل المدفوعات
              </Dialog.Title>
              <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
                {request ? `مدفوعات الطلب #${request.adRequestId}` : "جميع مدفوعات إعلانات المتجر"}
              </p>
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

          {/* Body */}
          <div className="max-h-[calc(86vh-90px)] overflow-y-auto p-5">
            {loading ? (
              <div
                className="rounded-3xl border px-5 py-12 text-center"
                style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
              >
                <FiLoader className="mx-auto animate-spin" size={24} style={{ color: "var(--blue-9)" }} />
                <p className="mt-4 text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  جارٍ تحميل سجل المدفوعات…
                </p>
              </div>
            ) : error ? (
              <div
                className="rounded-2xl border px-4 py-3 text-sm font-semibold"
                style={{ background: "var(--red-a3)", borderColor: "var(--red-a5)", color: "var(--red-11)" }}
              >
                {error}
              </div>
            ) : payments.length === 0 ? (
              <div
                className="rounded-3xl border border-dashed px-5 py-16 text-center"
                style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}
              >
                <FiCreditCard size={32} style={{ margin: "0 auto", color: "var(--gray-8)" }} />
                <p className="mt-4 text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  لا توجد مدفوعات بعد
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <article
                    key={payment.paymentId}
                    className="rounded-3xl border p-4"
                    style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                          عملية #{payment.paymentId}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                          طلب الإعلان #{payment.adRequestId}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={STATUS_STYLES[payment.paymentStatus] ?? { background: "var(--gray-a3)", color: "var(--gray-11)" }}
                      >
                        {PAYMENT_RECORD_STATUS_LABELS[payment.paymentStatus] || payment.paymentStatus}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <Cell label="المبلغ"       value={formatUsd(payment.amount)} />
                      <Cell label="العملة"       value={payment.currency || "USD"} />
                      <Cell label="طريقة الدفع"  value={payment.paymentMethod || "—"} />
                      <Cell label="تاريخ الدفع"  value={formatDateTime(payment.paymentDate)} />
                      <Cell label="سبب الفشل"   value={payment.failureReason || "—"} />
                      <Cell
                        label="الفاتورة"
                        value={
                          payment.invoiceUrl ? (
                            <a
                              href={payment.invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 transition-colors"
                              style={{ color: "var(--blue-10)" }}
                            >
                              <FiExternalLink size={13} />
                              فتح الفاتورة
                            </a>
                          ) : "—"
                        }
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Cell({ label, value }) {
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
    >
      <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>{label}</p>
      <div className="mt-2 text-sm font-bold" style={{ color: "var(--gray-12)" }}>{value}</div>
    </div>
  );
}
