import * as Dialog from "@radix-ui/react-dialog";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiLoader, FiX } from "react-icons/fi";
import { formatMoney } from "../../utils/campaigns";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function useThemeContainer() {
  const [container, setContainer] = useState(null);

  useEffect(() => {
    setContainer(document.querySelector(".radix-themes") || document.body);
  }, []);

  return container;
}

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function PaymentForm({ title, clientSecret, amount, currency, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: window.location.href,
      },
    });

    if (result.error) {
      setError(result.error.message || "تعذر إتمام الدفع");
      setSubmitting(false);
      return;
    }

    const status = result.paymentIntent?.status || "";

    if (status === "succeeded" || status === "processing" || status === "requires_capture") {
      setCompleted(true);
      onSuccess?.(result.paymentIntent);
      setSubmitting(false);
      return;
    }

    setError("لم يؤكد Stripe نجاح عملية الدفع بعد");
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="rounded-xl border px-4 py-3 text-sm"
        style={{ background: "var(--blue-a2)", borderColor: "var(--blue-a5)", color: "var(--blue-11)" }}
      >
        <div className="font-semibold">{title}</div>
        <div className="mt-1 text-xs">
          المبلغ المطلوب: {formatMoney(amount, currency)}
        </div>
      </div>

      {completed ? (
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ background: "var(--green-a2)", borderColor: "var(--green-a5)", color: "var(--green-11)" }}
        >
          <FiCheckCircle size={16} />
          تم إرسال عملية الدفع بنجاح. سيتم تحديث الحالة بعد إعادة التحميل.
        </div>
      ) : (
        <PaymentElement />
      )}

      {error ? (
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ background: "var(--red-a2)", borderColor: "var(--red-a5)", color: "var(--red-11)" }}
        >
          <FiAlertCircle size={15} />
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-start gap-3">
        <button
          type="submit"
          disabled={submitting || completed || !clientSecret}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? <Spinner size={14} /> : null}
          تأكيد الدفع
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-85"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
        >
          إغلاق
        </button>
      </div>
    </form>
  );
}

export function CampaignPaymentDialog({
  open,
  onOpenChange,
  title = "الدفع",
  description = "",
  clientSecret = "",
  amount = 0,
  currency = "ILS",
  onPaid,
}) {
  const themeContainer = useThemeContainer();
  const elementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe",
        labels: "floating",
      },
    }),
    [clientSecret]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay
          className="fixed inset-0 z-[20040]"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
        />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-0 z-[20041] flex items-center justify-center p-4"
          aria-describedby={undefined}
        >
          <div
            className="w-full max-w-xl rounded-2xl border shadow-2xl"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
          >
            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{ borderColor: "var(--gray-a6)" }}
            >
              <div>
                <Dialog.Title className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                  {title}
                </Dialog.Title>
                {description ? (
                  <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
                    {description}
                  </p>
                ) : null}
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-2 transition hover:opacity-70"
                  style={{ color: "var(--gray-11)" }}
                >
                  <FiX size={18} />
                </button>
              </Dialog.Close>
            </div>

            <div className="p-6">
              {!publishableKey ? (
                <div
                  className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
                  style={{ background: "var(--red-a2)", borderColor: "var(--red-a5)", color: "var(--red-11)" }}
                >
                  <FiAlertCircle size={15} />
                  متغير البيئة `VITE_STRIPE_PUBLISHABLE_KEY` غير مضبوط، لذلك تم تعطيل الدفع.
                </div>
              ) : !clientSecret ? (
                <div
                  className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
                  style={{ background: "var(--amber-a2)", borderColor: "var(--amber-a5)", color: "var(--amber-11)" }}
                >
                  <FiAlertCircle size={15} />
                  لم يتم استلام `clientSecret` من الخادم.
                </div>
              ) : (
                <Elements stripe={stripePromise} options={elementsOptions}>
                  <PaymentForm
                    title={title}
                    clientSecret={clientSecret}
                    amount={amount}
                    currency={currency}
                    onClose={() => onOpenChange(false)}
                    onSuccess={async (paymentIntent) => {
                      await onPaid?.(paymentIntent);
                    }}
                  />
                </Elements>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
