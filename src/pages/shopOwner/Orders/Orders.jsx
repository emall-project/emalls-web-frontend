import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiChevronLeft, FiChevronRight, FiClock, FiLoader, FiPackage, FiRefreshCw } from "react-icons/fi";
import { useAuth } from "../../../auth/AuthContext";
import { normalizeOrderHubPage, orderHubApi, unwrapOrderHubPayload } from "../../../api/orderHub";
import { formatDateTime, formatMoney, formatOrderHubStatus } from "../../../utils/orderHubUi";
import { getApiErrorMessage } from "../../../utils/apiErrors";

const ORDER_STATUSES = ["NEW", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CUSTOMER_REJECTED", "NO_RESPONSE"];

function StatusBadge({ status }) {
  return (
    <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--gray-a3)", color: "var(--gray-12)" }}>
      {formatOrderHubStatus(status)}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
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
          <div className="mt-2 text-2xl font-bold" style={{ color: "var(--gray-12)" }}>{Number(value || 0).toLocaleString("ar")}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: bg, color: fg }}>
          <Icon />
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-xl border px-4 py-3" style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}>
      <div className="text-xs" style={{ color: "var(--gray-10)" }}>{label}</div>
      <div className="mt-1 truncate text-sm font-semibold" style={{ color: "var(--gray-12)" }}>{value ?? "-"}</div>
    </div>
  );
}

function Pager({ page, totalPages, onChange }) {
  if ((totalPages || 1) <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3">
      <button type="button" onClick={() => onChange(Math.max(0, page - 1))} disabled={page <= 0} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm disabled:opacity-40" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>
        <FiChevronRight />
        السابق
      </button>
      <span className="text-sm" style={{ color: "var(--gray-10)" }}>صفحة {page + 1} من {totalPages}</span>
      <button type="button" onClick={() => onChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm disabled:opacity-40" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>
        التالي
        <FiChevronLeft />
      </button>
    </div>
  );
}

export default function ShopOwnerOrders() {
  const { selectedStoreId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [dashboard, setDashboard] = useState({});
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    if (!selectedStoreId) return;
    setLoading(true);
    setError("");
    try {
      const [ordersResponse, statsResponse, dashboardResponse] = await Promise.all([
        status
          ? orderHubApi.orders.shopByStatus(selectedStoreId, status, { page, size: 10 })
          : orderHubApi.orders.shopPage(selectedStoreId, { page, size: 10 }),
        orderHubApi.orders.shopStats(selectedStoreId).catch(() => null),
        orderHubApi.dashboard.getShop(selectedStoreId).catch(() => null),
      ]);
      const normalized = normalizeOrderHubPage(ordersResponse);
      setOrders(normalized.content);
      setPageInfo(normalized);
      setStats(unwrapOrderHubPayload(statsResponse) || {});
      setDashboard(unwrapOrderHubPayload(dashboardResponse) || {});
    } catch (requestError) {
      setOrders([]);
      setError(getApiErrorMessage(requestError, "فشل تحميل طلبات المتجر"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedStoreId, status, page]);

  const openOrder = async (order) => {
    setSelected(order);
    try {
      const response = await orderHubApi.orders.shopById(selectedStoreId, order.shopOrderId);
      setSelected(unwrapOrderHubPayload(response));
    } catch {
      // Keep list payload visible.
    }
  };

  const advance = async (order) => {
    setActionLoading(String(order.shopOrderId));
    setError("");
    try {
      await orderHubApi.orders.advanceShopStatus(selectedStoreId, order.shopOrderId);
      await load();
      if (selected?.shopOrderId === order.shopOrderId) {
        const response = await orderHubApi.orders.shopById(selectedStoreId, order.shopOrderId);
        setSelected(unwrapOrderHubPayload(response));
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل نقل الطلب للحالة التالية"));
    } finally {
      setActionLoading("");
    }
  };

  if (!selectedStoreId) {
    return (
      <div dir="rtl" className="p-6">
        <div className="rounded-2xl border p-6 text-sm" style={{ background: "var(--amber-a2)", borderColor: "var(--amber-a6)", color: "var(--amber-11)" }}>
          اختر متجرًا من الشريط العلوي قبل إدارة الطلبات.
        </div>
      </div>
    );
  }

  const orderKpis = dashboard.orderKpis || {};

  return (
    <div dir="rtl" className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>طلبات المتجر</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>إدارة طلبات المتجر #{selectedStoreId}</p>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiPackage} label="كل الطلبات" value={orderKpis.totalOrders ?? Object.values(stats).reduce((a, b) => a + Number(b || 0), 0)} />
        <StatCard icon={FiClock} label="جديدة" value={orderKpis.newOrders ?? stats.NEW} tone="amber" />
        <StatCard icon={FiPackage} label="قيد التجهيز" value={orderKpis.preparingOrders ?? stats.PREPARING} />
        <StatCard icon={FiCheckCircle} label="تم التسليم" value={orderKpis.deliveredOrders ?? stats.DELIVERED} tone="green" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { setStatus(""); setPage(0); }} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: !status ? "var(--blue-a3)" : "var(--gray-a2)", color: !status ? "var(--blue-11)" : "var(--gray-12)" }}>كل الحالات</button>
        {ORDER_STATUSES.map((item) => (
          <button key={item} type="button" onClick={() => { setStatus(item); setPage(0); }} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: status === item ? "var(--blue-a3)" : "var(--gray-a2)", color: status === item ? "var(--blue-11)" : "var(--gray-12)" }}>
            {formatOrderHubStatus(item)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm" style={{ color: "var(--gray-10)" }}>
          <FiLoader className="mx-auto mb-3 animate-spin" />
          جاري تحميل الطلبات...
        </div>
      ) : null}

      {!loading && !orders.length ? (
        <div className="rounded-2xl border px-5 py-12 text-center text-sm" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)", color: "var(--gray-10)" }}>لا توجد طلبات</div>
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.shopOrderId} className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>طلب #{order.shopOrderId}</h3>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--gray-10)" }}>{formatDateTime(order.createdAt)} • العميل {order.customerInfo?.fullName || `#${order.customerId}`}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => openOrder(order)} className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>عرض</button>
                <button type="button" onClick={() => advance(order)} disabled={actionLoading === String(order.shopOrderId)} className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--blue-9)", color: "white" }}>
                  {actionLoading === String(order.shopOrderId) ? "جار التحديث..." : "نقل للحالة التالية"}
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Mini label="الإجمالي" value={`₪${formatMoney(order.total)}`} />
              <Mini label="العناصر" value={order.items?.length || 0} />
              <Mini label="موقع التوصيل" value={order.deliveryInfo?.deliveryLocation || "-"} />
            </div>
          </div>
        ))}
      </div>

      <Pager page={page} totalPages={pageInfo.totalPages} onChange={setPage} />

      {selected ? (
        <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>تفاصيل الطلب #{selected.shopOrderId}</h2>
            <button type="button" onClick={() => setSelected(null)} className="rounded-xl border px-3 py-2 text-xs" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>إغلاق</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Mini label="الحالة" value={formatOrderHubStatus(selected.status)} />
            <Mini label="الإجمالي" value={`₪${formatMoney(selected.total)}`} />
            <Mini label="المستلم" value={selected.deliveryInfo?.deliveryName || "-"} />
            <Mini label="الهاتف" value={[selected.deliveryInfo?.deliveryPhone?.prefix, selected.deliveryInfo?.deliveryPhone?.number].filter(Boolean).join(" ") || "-"} />
          </div>
          <div className="mt-5 overflow-x-auto rounded-xl border" style={{ borderColor: "var(--gray-a6)" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
                <tr>
                  <th className="px-4 py-3 text-right">المنتج</th>
                  <th className="px-4 py-3 text-right">المتغير</th>
                  <th className="px-4 py-3 text-right">الكمية</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {(selected.items || []).map((item) => (
                  <tr key={item.orderItemId} className="border-t" style={{ borderColor: "var(--gray-a5)" }}>
                    <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>{item.productName}</td>
                    <td className="px-4 py-3" style={{ color: "var(--gray-10)" }}>{item.variantName || "-"}</td>
                    <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>{item.quantity}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>₪{formatMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
