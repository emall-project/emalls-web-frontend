import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiClock, FiDollarSign, FiLoader, FiRefreshCw, FiRotateCcw } from "react-icons/fi";
import { useAuth } from "../../../auth/AuthContext";
import { orderHubApi, unwrapOrderHubPayload } from "../../../api/orderHub";
import { formatMoney, formatOrderHubStatus } from "../../../utils/orderHubUi";
import { getApiErrorMessage } from "../../../utils/apiErrors";

function StatCard({ icon: Icon, label, value, tone = "blue", money = false }) {
  const colors = {
    blue: ["var(--blue-a3)", "var(--blue-11)"],
    green: ["var(--green-a3)", "var(--green-11)"],
    amber: ["var(--amber-a3)", "var(--amber-11)"],
    red: ["var(--red-a3)", "var(--red-11)"],
  };
  const [bg, fg] = colors[tone] || colors.blue;
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold" style={{ color: "var(--gray-10)" }}>{label}</div>
          <div className="mt-2 text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
            {money ? `₪${formatMoney(value)}` : Number(value || 0).toLocaleString("ar")}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: bg, color: fg }}>
          <Icon />
        </div>
      </div>
    </div>
  );
}

function Breakdown({ title, data }) {
  const entries = Object.entries(data || {});
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
      <h2 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{title}</h2>
      <div className="mt-4 space-y-2">
        {!entries.length ? (
          <div className="text-sm" style={{ color: "var(--gray-10)" }}>لا توجد بيانات</div>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2" style={{ background: "var(--gray-a2)" }}>
              <span className="text-sm" style={{ color: "var(--gray-11)" }}>{formatOrderHubStatus(key)}</span>
              <span className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{Number(value || 0).toLocaleString("ar")}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ShopOwnerFinance() {
  const { selectedStoreId } = useAuth();
  const [payout, setPayout] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [returnStats, setReturnStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!selectedStoreId) return;
    setLoading(true);
    setError("");
    try {
      const [payoutResponse, dashboardResponse, returnStatsResponse] = await Promise.all([
        orderHubApi.finance.shopPayout(selectedStoreId),
        orderHubApi.dashboard.getShop(selectedStoreId).catch(() => null),
        orderHubApi.finance.shopReturnStats(selectedStoreId).catch(() => null),
      ]);
      setPayout(unwrapOrderHubPayload(payoutResponse));
      setDashboard(unwrapOrderHubPayload(dashboardResponse));
      setReturnStats(unwrapOrderHubPayload(returnStatsResponse) || {});
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحميل المستحقات"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedStoreId]);

  if (!selectedStoreId) {
    return (
      <div dir="rtl" className="p-6">
        <div className="rounded-2xl border p-6 text-sm" style={{ background: "var(--amber-a2)", borderColor: "var(--amber-a6)", color: "var(--amber-11)" }}>
          اختر متجرًا من الشريط العلوي قبل عرض المستحقات.
        </div>
      </div>
    );
  }

  const financeKpis = dashboard?.financeKpis || {};

  return (
    <div dir="rtl" className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>المستحقات المالية</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>ملخص أرباح ومتعلقات المتجر #{selectedStoreId}</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          تحديث
        </button>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm" style={{ background: "var(--red-a2)", borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
          <FiAlertCircle className="mt-0.5" />
          {error}
        </div>
      ) : null}

      {loading && !payout ? (
        <div className="py-10 text-center text-sm" style={{ color: "var(--gray-10)" }}>
          <FiLoader className="mx-auto mb-3 animate-spin" />
          جاري تحميل المستحقات...
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiDollarSign} label="جاهز للصرف" value={payout?.readyForPayoutAmount ?? financeKpis.readyForPayoutAmount} tone="green" money />
        <StatCard icon={FiCheckCircle} label="الأرباح المؤكدة" value={payout?.earnedAmount ?? financeKpis.earnedAmount} tone="green" money />
        <StatCard icon={FiDollarSign} label="إجمالي المسلم" value={payout?.totalDeliveredAmount ?? financeKpis.totalDeliveredAmount} money />
        <StatCard icon={FiClock} label="ضمن فترة الحجز" value={payout?.itemsInHoldingWindow ?? financeKpis.itemsInHolding} tone="amber" />
        <StatCard icon={FiCheckCircle} label="عناصر جاهزة للصرف" value={payout?.itemsReadyForPayout ?? financeKpis.itemsReadyForPayout} tone="green" />
        <StatCard icon={FiRotateCcw} label="إرجاعات معلقة" value={payout?.pendingReturnRequests} tone="red" />
        <StatCard icon={FiRotateCcw} label="إرجاعات مقبولة" value={payout?.approvedReturnRequests} />
        <StatCard icon={FiCheckCircle} label="إرجاعات مرفوضة محسوبة" value={payout?.itemsReturnRejected ?? financeKpis.itemsReturnRejected} tone="green" />
      </div>

      {payout?.note ? (
        <div className="rounded-2xl border p-4 text-sm" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)", color: "var(--gray-11)" }}>
          {payout.note}
        </div>
      ) : null}

      <Breakdown title="إحصاءات الإرجاع" data={returnStats} />
    </div>
  );
}
