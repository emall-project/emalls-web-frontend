import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
  FiLoader,
  FiShield,
} from "react-icons/fi";
import { campaignsApi, unwrapCampaignPayload } from "../../../api/campaigns";
import { CampaignPaymentDialog } from "../../../components/campaigns/CampaignPaymentDialog";
import { useAuth } from "../../../auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  getCampaignLabel,
  getCampaignStatusTone,
  SUBSCRIPTION_PLAN_TYPE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "../../../utils/campaigns";

const cardStyle = {
  background: "var(--gray-1)",
  border: "1px solid var(--gray-a6)",
};

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function StatusBadge({ status }) {
  const tone = getCampaignStatusTone(status);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: tone.bg, color: tone.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />
      {getCampaignLabel(status, SUBSCRIPTION_STATUS_LABELS)}
    </span>
  );
}

function InfoMessage({ color = "var(--blue-11)", background = "var(--blue-a2)", border = "var(--blue-a5)", children }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
      style={{ color, background, borderColor: border }}
    >
      <FiAlertCircle size={15} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border px-6 py-10 text-center" style={cardStyle}>
      <div className="text-base font-semibold" style={{ color: "var(--gray-12)" }}>
        {title}
      </div>
      {description ? (
        <div className="mt-2 text-sm" style={{ color: "var(--gray-11)" }}>
          {description}
        </div>
      ) : null}
    </div>
  );
}

export default function Subscription() {
  const { selectedStoreId } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subscribeLoadingId, setSubscribeLoadingId] = useState(null);
  const [paymentState, setPaymentState] = useState(null);
  const [autoRenew, setAutoRenew] = useState(false);

  const loadData = useCallback(async () => {
    if (!selectedStoreId) {
      setPlans([]);
      setCurrentSubscription(null);
      setSubscriptionStatus(null);
      setPayments([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [plansResponse, subscriptionResponse, statusResponse, paymentsResponse] = await Promise.all([
        campaignsApi.plans.active(),
        campaignsApi.subscriptions.byShop(selectedStoreId).catch((requestError) => {
          if (requestError?.status === 404) {
            return null;
          }
          throw requestError;
        }),
        campaignsApi.subscriptions.status(selectedStoreId).catch((requestError) => {
          if (requestError?.status === 404) {
            return null;
          }
          throw requestError;
        }),
        campaignsApi.subscriptions.paymentsByShop(selectedStoreId).catch((requestError) => {
          if (requestError?.status === 404) {
            return null;
          }
          throw requestError;
        }),
      ]);

      setPlans(unwrapCampaignPayload(plansResponse) || []);
      setCurrentSubscription(unwrapCampaignPayload(subscriptionResponse));
      setSubscriptionStatus(unwrapCampaignPayload(statusResponse));
      setPayments(unwrapCampaignPayload(paymentsResponse) || []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحميل بيانات الاشتراك"));
      setPlans([]);
      setCurrentSubscription(null);
      setSubscriptionStatus(null);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activePlanId = currentSubscription?.plan?.subscriptionPlanId || null;

  const subscriptionSummary = useMemo(() => {
    if (currentSubscription) {
      return currentSubscription;
    }

    if (subscriptionStatus) {
      return {
        status: subscriptionStatus.status,
        trialEndDate: subscriptionStatus.trialEndDate,
        endDate: subscriptionStatus.endDate,
        suspendedAt: subscriptionStatus.suspendedAt,
      };
    }

    return null;
  }, [currentSubscription, subscriptionStatus]);

  const startSubscribe = async (plan) => {
    if (!selectedStoreId) {
      return;
    }

    setSubscribeLoadingId(plan.subscriptionPlanId);
    setError("");

    try {
      const response = await campaignsApi.subscriptions.subscribe({
        shopId: Number(selectedStoreId),
        planId: Number(plan.subscriptionPlanId),
        autoRenew,
      });
      const payload = unwrapCampaignPayload(response);
      setPaymentState({
        title: `اشتراك: ${payload?.planName || plan.name}`,
        clientSecret: payload?.clientSecret || "",
        amount: payload?.amount || plan.price || 0,
        currency: payload?.currency || plan.currency || "ILS",
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تهيئة عملية الاشتراك"));
    } finally {
      setSubscribeLoadingId(null);
    }
  };

  if (!selectedStoreId) {
    return (
      <div dir="rtl" className="space-y-6 p-3 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
            الاشتراك
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
            متابعة حالة اشتراك المتجر واختيار خطة جديدة عند الحاجة.
          </p>
        </div>
        <EmptyState
          title="لا يوجد متجر نشط"
          description="اختر متجرًا من شريط صاحب المتجر أولًا حتى تتمكن من إدارة الاشتراك."
        />
      </div>
    );
  }

  return (
    <>
      <div dir="rtl" className="space-y-6 p-3 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
            الاشتراك
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
            راقب حالة الاشتراك الحالية، صلاحية الكتابة، وسجل المدفوعات، ثم اختر الخطة المناسبة لمتجرك.
          </p>
        </div>

        {error ? (
          <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">
            {error}
          </InfoMessage>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border px-6 py-10 text-center" style={cardStyle}>
            <span className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--gray-10)" }}>
              <Spinner size={16} />
              جاري تحميل بيانات الاشتراك...
            </span>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border p-5" style={cardStyle}>
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                  <FiShield size={16} />
                  حالة الاشتراك الحالية
                </div>

                {subscriptionSummary ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <StatusBadge status={subscriptionSummary.status} />
                    </div>
                    <div className="grid gap-3 text-sm">
                      <div>
                        <div style={{ color: "var(--gray-10)" }}>الخطة الحالية</div>
                        <div style={{ color: "var(--gray-12)" }} className="font-semibold">
                          {currentSubscription?.plan?.name || "لا توجد خطة مدفوعة حالية"}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--gray-10)" }}>بداية الاشتراك</div>
                        <div style={{ color: "var(--gray-12)" }}>{formatDate(currentSubscription?.startDate)}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--gray-10)" }}>نهاية الاشتراك</div>
                        <div style={{ color: "var(--gray-12)" }}>
                          {formatDate(currentSubscription?.endDate || subscriptionSummary?.endDate)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--gray-10)" }}>نهاية الفترة التجريبية</div>
                        <div style={{ color: "var(--gray-12)" }}>
                          {formatDate(currentSubscription?.trialEndDate || subscriptionSummary?.trialEndDate)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--gray-10)" }}>الكتابة متاحة</div>
                        <div style={{ color: "var(--gray-12)" }}>
                          {currentSubscription?.hasWriteAccess ? "نعم" : "لا"}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--gray-10)" }}>التجديد التلقائي</div>
                        <div style={{ color: "var(--gray-12)" }}>
                          {currentSubscription?.autoRenew ? "مفعل" : "غير مفعل"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-sm" style={{ color: "var(--gray-10)" }}>
                    لا يوجد اشتراك فعّال لهذا المتجر بعد.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border p-5" style={cardStyle}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                      خطط الاشتراك المتاحة
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                      اختر الخطة المناسبة، ثم أكمل الدفع عبر Stripe لتفعيلها.
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--gray-12)" }}>
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={autoRenew}
                      onChange={(event) => setAutoRenew(event.target.checked)}
                    />
                    تفعيل التجديد التلقائي
                  </label>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {plans.length ? (
                    plans.map((plan) => {
                      const isCurrent = activePlanId && Number(activePlanId) === Number(plan.subscriptionPlanId);
                      return (
                        <div
                          key={plan.subscriptionPlanId}
                          className="rounded-2xl border p-4"
                          style={{
                            ...cardStyle,
                            borderColor: isCurrent ? "var(--blue-a7)" : "var(--gray-a6)",
                            background: isCurrent ? "var(--blue-a2)" : "var(--gray-1)",
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                                {plan.name}
                              </div>
                              <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                                {getCampaignLabel(plan.planType, SUBSCRIPTION_PLAN_TYPE_LABELS)} - {plan.durationMonths} شهر
                              </div>
                            </div>
                            {isCurrent ? (
                              <span
                                className="rounded-full px-3 py-1 text-xs font-semibold"
                                style={{ background: "var(--blue-a4)", color: "var(--blue-11)" }}
                              >
                                الخطة الحالية
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
                            {formatMoney(plan.price, plan.currency)}
                          </div>
                          <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                            Stripe Price ID: {plan.stripePriceId}
                          </div>

                          <button
                            type="button"
                            onClick={() => startSubscribe(plan)}
                            disabled={subscribeLoadingId === plan.subscriptionPlanId}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                          >
                            {subscribeLoadingId === plan.subscriptionPlanId ? <Spinner size={14} /> : <FiCreditCard size={14} />}
                            الاشتراك بهذه الخطة
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border px-4 py-10 text-center text-sm" style={{ ...cardStyle, color: "var(--gray-10)" }}>
                      لا توجد خطط نشطة متاحة حاليًا.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border" style={cardStyle}>
              <div className="border-b px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                سجل مدفوعات الاشتراك
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-semibold">المبلغ</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">طريقة الدفع</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">التاريخ</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">المعاملة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length ? (
                      payments.map((payment) => (
                        <tr key={payment.paymentId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                          <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>
                            {formatMoney(payment.amount, payment.currency)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={payment.paymentStatus} />
                          </td>
                          <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>
                            {payment.paymentMethod || "-"}
                          </td>
                          <td className="px-4 py-3" style={{ color: "var(--gray-11)" }}>
                            {formatDateTime(payment.paymentDate)}
                          </td>
                          <td className="px-4 py-3" style={{ color: "var(--gray-11)" }}>
                            {payment.transactionId || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: "var(--gray-10)" }}>
                          لا توجد مدفوعات اشتراك مسجلة لهذا المتجر.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <CampaignPaymentDialog
        open={!!paymentState}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentState(null);
          }
        }}
        title={paymentState?.title || "الدفع"}
        description="سيتم استخدام Stripe لإكمال عملية الاشتراك بالخطة المحددة."
        clientSecret={paymentState?.clientSecret || ""}
        amount={paymentState?.amount || 0}
        currency={paymentState?.currency || "ILS"}
        onPaid={async () => {
          await loadData();
          setPaymentState(null);
        }}
      />
    </>
  );
}
