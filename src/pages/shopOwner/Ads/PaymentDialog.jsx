import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import * as Dialog from "@radix-ui/react-dialog";
import { FiAlertCircle, FiCheckCircle, FiCreditCard, FiLoader, FiX } from "react-icons/fi";

import { adsApi } from "./api";
import { extractApiError, formatDateTime, formatUsd, useIsDarkTheme, useThemeContainer } from "./adsUtils";

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;
const PAYMENT_POLL_INTERVAL_MS = 2500;
const PAYMENT_POLL_ATTEMPTS = 8;

function getPaymentEligibilityMessage(request) {
  if (!request) return "تعذر تحميل بيانات طلب الإعلان.";
  if (request.status !== "APPROVED") {
    return "يمكن دفع الإعلان فقط بعد موافقة الإدارة على الطلب.";
  }
  if (request.paymentStatus === "PAID") {
    return "تم دفع هذا الإعلان مسبقًا.";
  }
  if (request.paymentStatus === "OVERDUE") {
    return "انتهت مهلة الدفع لهذا الإعلان حسب قواعد الخادم، ولا يمكن إتمام الدفع الآن.";
  }
  return "";
}

function isPaymentRecorded(adRequest, payments = []) {
  if (adRequest?.paymentStatus === "PAID") return true;
  return payments.some((payment) => payment?.paymentStatus === "SUCCESS");
}

export default function PaymentDialog({ open, onOpenChange, request, onPaid }) {
  const container = useThemeContainer();
  const isDarkTheme = useIsDarkTheme();
  const [clientSecret, setClientSecret] = useState("");
  const [summary, setSummary] = useState(null);
  const [liveRequest, setLiveRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [success, setSuccess] = useState(false);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const effectiveRequest = liveRequest || request;
  const paymentBlockedReason = useMemo(
    () => getPaymentEligibilityMessage(effectiveRequest),
    [effectiveRequest]
  );
  const canStartPayment = Boolean(effectiveRequest && !paymentBlockedReason);

  const fetchLatestPaymentState = useCallback(
    async (requestId) => {
      const [freshRequestResult, paymentsResult] = await Promise.allSettled([
        adsApi.getAdRequestById(requestId),
        adsApi.getRequestPaymentHistory(requestId),
      ]);

      const freshRequest =
        freshRequestResult.status === "fulfilled" ? freshRequestResult.value : null;
      const payments = paymentsResult.status === "fulfilled" && Array.isArray(paymentsResult.value)
        ? paymentsResult.value
        : [];

      if (freshRequest && activeRef.current) {
        setLiveRequest(freshRequest);
        setSummary((prev) => ({
          ...(prev || {}),
          adRequestId: freshRequest.adRequestId ?? prev?.adRequestId,
          adTitle: freshRequest.title ?? prev?.adTitle,
          amount: freshRequest.totalPrice ?? prev?.amount,
          currency: prev?.currency || "USD",
        }));
      }

      return { freshRequest, payments };
    },
    []
  );

  const waitForPaymentConfirmation = useCallback(
    async (requestId) => {
      for (let attempt = 0; attempt < PAYMENT_POLL_ATTEMPTS; attempt += 1) {
        const { freshRequest, payments } = await fetchLatestPaymentState(requestId);
        if (isPaymentRecorded(freshRequest, payments)) {
          return true;
        }

        if (attempt < PAYMENT_POLL_ATTEMPTS - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, PAYMENT_POLL_INTERVAL_MS));
        }
      }

      return false;
    },
    [fetchLatestPaymentState]
  );

  useEffect(() => {
    if (!open || !request) return;
    setClientSecret("");
    setSummary(null);
    setLiveRequest(request);
    setError("");
    setVerificationError("");
    setSuccess(false);
    setVerifying(false);

    let active = true;
    if (!STRIPE_KEY) {
      setError("");
      return () => {
        active = false;
      };
    }

    if (getPaymentEligibilityMessage(request)) {
      setError("");
      return () => {
        active = false;
      };
    }

    setLoading(true);
    adsApi
      .initiatePayment(request.adRequestId)
      .then((response) => {
        if (!active) return;
        setSummary(response);
        setClientSecret(response?.clientSecret || "");
      })
      .catch((err) => {
        if (!active) return;
        setError(extractApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, request]);

  const handlePaymentSubmitted = useCallback(async () => {
    if (!effectiveRequest?.adRequestId) return;

    setVerifying(true);
    setVerificationError("");

    const confirmed = await waitForPaymentConfirmation(effectiveRequest.adRequestId);
    if (!activeRef.current) return;

    setVerifying(false);

    if (confirmed) {
      setSuccess(true);
      window.setTimeout(() => {
        onOpenChange?.(false);
        onPaid?.();
      }, 2200);
      return;
    }

    setVerificationError(
      "تم إرسال عملية الدفع إلى Stripe، لكننا ما زلنا ننتظر تأكيد الخادم. حدّث الحالة بعد لحظات أو افتح سجل المدفوعات."
    );
  }, [effectiveRequest?.adRequestId, onOpenChange, onPaid, waitForPaymentConfirmation]);

  const handleRefreshStatus = useCallback(async () => {
    if (!effectiveRequest?.adRequestId) return;

    setVerifying(true);
    setVerificationError("");
    try {
      const { freshRequest, payments } = await fetchLatestPaymentState(effectiveRequest.adRequestId);
      if (isPaymentRecorded(freshRequest, payments)) {
        setSuccess(true);
        window.setTimeout(() => {
          onOpenChange?.(false);
          onPaid?.();
        }, 1800);
      } else {
        setVerificationError("لم يصل تأكيد الدفع من الخادم بعد. حاول التحديث مرة أخرى بعد قليل.");
      }
    } catch (refreshError) {
      setVerificationError(extractApiError(refreshError));
    } finally {
      if (activeRef.current) setVerifying(false);
    }
  }, [effectiveRequest?.adRequestId, fetchLatestPaymentState, onOpenChange, onPaid]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-[82] bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-[83] w-[min(520px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[30px] border shadow-[0_24px_60px_rgba(2,6,23,0.28)]"
          style={{ borderColor: "var(--gray-a5)", background: "var(--gray-2)" }}
        >
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)" }}>
            <div>
              <Dialog.Title className="text-lg font-black" style={{ color: "var(--gray-12)" }}>دفع الإعلان</Dialog.Title>
              <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>إتمام الدفع عبر Stripe للإعلان المقبول.</p>
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

          <div className="space-y-4 p-5">
            <div className="rounded-[24px] border p-4" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>الإعلان</p>
                  <p className="mt-1 text-sm font-bold" style={{ color: "var(--gray-12)" }}>{summary?.adTitle || effectiveRequest?.title || "—"}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>المبلغ</p>
                  <p className="mt-1 text-lg font-black" style={{ color: "var(--blue-10)" }}>
                    {formatUsd(summary?.amount || effectiveRequest?.totalPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>بداية العرض</p>
                  <p className="mt-1 text-sm font-bold" style={{ color: "var(--gray-12)" }}>{formatDateTime(effectiveRequest?.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>حالة الدفع الحالية</p>
                  <p className="mt-1 text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                    {effectiveRequest?.paymentStatus === "PAID"
                      ? "مدفوع"
                      : effectiveRequest?.paymentStatus === "OVERDUE"
                        ? "متأخر الدفع"
                        : "غير مدفوع"}
                  </p>
                </div>
              </div>
            </div>

            {!STRIPE_KEY ? (
              <div
                className="rounded-2xl border px-4 py-4 text-sm leading-7"
                style={{ borderColor: "var(--amber-a5)", background: "var(--amber-a2)", color: "var(--amber-11)" }}
              >
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
                  <div>
                    <p className="font-bold">الدفع غير متاح من هذه النسخة الآن</p>
                    <p className="mt-1">
                      الخادم يجهّز الدفع عبر Stripe بإرجاع <span dir="ltr" className="font-mono text-xs">clientSecret</span>،
                      لكن الواجهة تحتاج أيضًا إلى <span dir="ltr" className="font-mono text-xs">VITE_STRIPE_PUBLISHABLE_KEY</span> لعرض نموذج البطاقة بشكل آمن.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {paymentBlockedReason ? (
              <div
                className="rounded-2xl border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: "var(--amber-a5)", background: "var(--amber-a2)", color: "var(--amber-11)" }}
              >
                <FiAlertCircle className="ml-2 inline" size={15} />
                {paymentBlockedReason}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-[24px] border px-5 py-12 text-center" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
                <FiLoader className="mx-auto animate-spin" size={24} style={{ color: "var(--blue-9)" }} />
                <p className="mt-4 text-sm font-semibold" style={{ color: "var(--gray-11)" }}>جارٍ تجهيز جلسة الدفع…</p>
              </div>
            ) : null}

            {verifying ? (
              <div
                className="rounded-[24px] border px-5 py-10 text-center"
                style={{ borderColor: "var(--blue-a5)", background: "var(--blue-a2)" }}
              >
                <FiLoader className="mx-auto animate-spin" size={24} style={{ color: "var(--blue-9)" }} />
                <p className="mt-4 text-sm font-bold" style={{ color: "var(--blue-11)" }}>تم إرسال الدفع إلى Stripe</p>
                <p className="mt-2 text-sm" style={{ color: "var(--blue-10)" }}>
                  ننتظر الآن تأكيد الـ webhook من الخادم لتحديث حالة الإعلان وسجل المدفوعات.
                </p>
              </div>
            ) : null}

            {error ? (
              <div
                className="rounded-2xl border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: "var(--red-a5)", background: "var(--red-a2)", color: "var(--red-11)" }}
              >
                <FiAlertCircle className="ml-2 inline" size={15} />
                {error}
              </div>
            ) : null}

            {verificationError ? (
              <div
                className="rounded-2xl border px-4 py-4 text-sm"
                style={{ borderColor: "var(--amber-a5)", background: "var(--amber-a2)", color: "var(--amber-11)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="leading-7">
                    <FiAlertCircle className="ml-2 inline" size={15} />
                    {verificationError}
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshStatus}
                    disabled={verifying}
                    className="shrink-0 rounded-2xl border px-4 py-2 text-xs font-bold transition disabled:opacity-50"
                    style={{ borderColor: "var(--amber-a5)", background: "var(--gray-1)", color: "var(--amber-11)" }}
                  >
                    {verifying ? "جارٍ التحقق..." : "تحديث الحالة"}
                  </button>
                </div>
              </div>
            ) : null}

            {success ? (
              <div
                className="rounded-[24px] border px-5 py-12 text-center"
                style={{ borderColor: "var(--green-a5)", background: "var(--green-a2)" }}
              >
                <FiCheckCircle className="mx-auto" size={34} style={{ color: "var(--green-9)" }} />
                <p className="mt-4 text-base font-bold" style={{ color: "var(--green-11)" }}>تم تأكيد الدفع بنجاح</p>
                <p className="mt-2 text-sm" style={{ color: "var(--green-10)" }}>حدّث الخادم حالة الإعلان وسجل المدفوعات، وسيُغلق الحوار تلقائيًا.</p>
              </div>
            ) : null}

            {!loading && !verifying && !error && !success && clientSecret && STRIPE_KEY && canStartPayment ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: isDarkTheme ? "night" : "stripe",
                    variables: {
                      colorPrimary: "#2563eb",
                      borderRadius: "14px",
                      colorBackground: isDarkTheme ? "#111827" : "#ffffff",
                      colorText: isDarkTheme ? "#f8fafc" : "#0f172a",
                      colorDanger: "#dc2626",
                      colorSuccess: "#16a34a",
                    },
                  },
                }}
              >
                <StripePaymentForm
                  onPaymentSubmitted={handlePaymentSubmitted}
                  onCancel={() => onOpenChange?.(false)}
                />
              </Elements>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function StripePaymentForm({ onPaymentSubmitted, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setError("");

    const { error: paymentError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: window.location.href },
    });

    if (paymentError) {
      setError(paymentError.message || "فشلت عملية الدفع.");
      setPaying(false);
      return;
    }

    onPaymentSubmitted?.();
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="rounded-[24px] border p-4" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error ? <p className="text-sm font-semibold" style={{ color: "var(--red-11)" }}>{error}</p> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || paying}
          className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {paying ? <FiLoader className="ml-2 inline animate-spin" size={15} /> : <FiCreditCard className="ml-2 inline" size={15} />}
          {paying ? "جارٍ المعالجة..." : "ادفع الآن"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border px-4 py-3 text-sm font-semibold transition"
          style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)", color: "var(--gray-11)" }}
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
