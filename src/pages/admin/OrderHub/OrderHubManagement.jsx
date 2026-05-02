import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiLoader,
  FiPackage,
  FiRefreshCw,
  FiRotateCcw,
  FiShoppingCart,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import { normalizeOrderHubPage, orderHubApi, unwrapOrderHubPayload } from "../../../api/orderHub";
import { getMediaPreviewUrl } from "../../../api/mediaManager";
import { formatDateTime, formatMoney, formatOrderHubStatus } from "../../../utils/orderHubUi";
import { getApiErrorMessage } from "../../../utils/apiErrors";

const ORDER_STATUSES = [
  "NEW",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CUSTOMER_REJECTED",
  "NO_RESPONSE",
];
const RETURN_STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const DELIVERY_STATUSES = ["CREATED", "SENT", "ON_THE_WAY", "DELIVERED", "FAILED"];
const CART_STATUSES = ["ACTIVE", "CHECKED_OUT", "CANCELLED"];

const tabs = [
  { key: "overview", label: "الملخص", icon: FiPackage },
  { key: "orders", label: "الطلبات", icon: FiPackage },
  { key: "returns", label: "الإرجاعات", icon: FiRotateCcw },
  { key: "deliveries", label: "التوصيل", icon: FiTruck },
  { key: "carts", label: "السلال", icon: FiShoppingCart },
  { key: "finance", label: "المالية", icon: FiDollarSign },
];

function StatCard({ icon: Icon, label, value, tone = "blue", money = false }) {
  const colors = {
    blue: ["var(--blue-a3)", "var(--blue-11)"],
    green: ["var(--green-a3)", "var(--green-11)"],
    red: ["var(--red-a3)", "var(--red-11)"],
    amber: ["var(--amber-a3)", "var(--amber-11)"],
    gray: ["var(--gray-a3)", "var(--gray-11)"],
  };
  const [bg, fg] = colors[tone] || colors.blue;
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--gray-10)" }}>{label}</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
            {money ? `₪${formatMoney(value)}` : Number(value || 0).toLocaleString("ar")}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: bg, color: fg }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--gray-a3)", color: "var(--gray-12)" }}>
      {formatOrderHubStatus(status)}
    </span>
  );
}

function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm" style={{ background: "var(--red-a2)", borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
      <FiAlertCircle className="mt-0.5 shrink-0" />
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon = FiPackage, text }) {
  return (
    <div className="rounded-2xl border px-5 py-12 text-center" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}>
      <Icon className="mx-auto mb-3" size={24} />
      {text}
    </div>
  );
}

function FilterBar({ status, statuses, filters, onStatusChange, onFilterChange, onRefresh, loading }) {
  return (
    <div className="grid gap-3 rounded-2xl border p-4 lg:grid-cols-[180px_1fr_1fr_auto]" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        className="rounded-xl border px-3 py-2 text-sm outline-none"
        style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
      >
        <option value="">كل الحالات</option>
        {statuses.map((item) => (
          <option key={item} value={item}>{formatOrderHubStatus(item)}</option>
        ))}
      </select>
      <input
        value={filters.shopId}
        onChange={(event) => onFilterChange("shopId", event.target.value)}
        placeholder="رقم المتجر"
        className="rounded-xl border px-3 py-2 text-sm outline-none"
        style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
      />
      <input
        value={filters.customerId}
        onChange={(event) => onFilterChange("customerId", event.target.value)}
        placeholder="رقم العميل"
        className="rounded-xl border px-3 py-2 text-sm outline-none"
        style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
      />
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
        style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}
      >
        <FiRefreshCw className={loading ? "animate-spin" : ""} />
        تحديث
      </button>
    </div>
  );
}

function Pager({ page, pageInfo, onPageChange }) {
  if ((pageInfo.totalPages || 1) <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page <= 0}
        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm disabled:opacity-40"
        style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}
      >
        <FiChevronRight />
        السابق
      </button>
      <span className="text-sm" style={{ color: "var(--gray-10)" }}>
        صفحة {page + 1} من {pageInfo.totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageInfo.totalPages - 1, page + 1))}
        disabled={page >= pageInfo.totalPages - 1}
        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm disabled:opacity-40"
        style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}
      >
        التالي
        <FiChevronLeft />
      </button>
    </div>
  );
}

function OrderCard({ order, onOpen, onOverride }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>طلب #{order.shopOrderId}</h3>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--gray-10)" }}>
            {order.shopInfo?.name || order.storeName || `متجر #${order.shopId}`} • {order.mallInfo?.name || `مول #${order.mallId}`} • {formatDateTime(order.createdAt)}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
            العميل: {order.customerInfo?.fullName || order.customerInfo?.username || `#${order.customerId}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onOpen(order)} className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>
            عرض
          </button>
          <button type="button" onClick={() => onOverride(order)} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: "var(--blue-9)", color: "white" }}>
            تعديل الحالة
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Mini label="الإجمالي" value={`₪${formatMoney(order.total)}`} />
        <Mini label="العناصر" value={order.items?.length || 0} />
        <Mini label="موقع التوصيل" value={order.deliveryInfo?.deliveryLocation || "-"} />
      </div>
    </div>
  );
}

function ReturnCard({ item, onOpen }) {
  const image = getMediaPreviewUrl(item.image, "small");
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="w-full rounded-2xl border p-5 text-right transition hover:opacity-90"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {image ? <img src={image} alt="" className="h-20 w-20 rounded-2xl object-cover" /> : null}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>{item.reason || `إرجاع #${item.returnRequestId}`}</h3>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm" style={{ color: "var(--gray-10)" }}>
              {item.orderItem?.productName || `عنصر #${item.orderItemId}`} • {formatDateTime(item.createdAt)}
            </p>
            {item.rejectionReason ? <p className="mt-1 text-xs" style={{ color: "var(--red-11)" }}>{item.rejectionReason}</p> : null}
          </div>
        </div>
        <span className="text-xs" style={{ color: "var(--gray-10)" }}>متجر #{item.shopId}</span>
      </div>
    </button>
  );
}

function DeliveryCard({ delivery, onAction }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>توصيل #{delivery.deliveryId}</h3>
            <StatusBadge status={delivery.status} />
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--gray-10)" }}>
            سلة #{delivery.cartId} • {formatDateTime(delivery.createdAt)}
          </p>
          {delivery.failureReason ? <p className="mt-1 text-xs" style={{ color: "var(--red-11)" }}>{delivery.failureReason}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onAction("sent", delivery)} className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>تم الإرسال</button>
          <button type="button" onClick={() => onAction("onTheWay", delivery)} className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>في الطريق</button>
          <button type="button" onClick={() => onAction("delivered", delivery)} className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--green-a7)", color: "var(--green-11)" }}>تم التسليم</button>
          <button type="button" onClick={() => onAction("failed", delivery)} className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--red-a7)", color: "var(--red-11)" }}>فشل</button>
        </div>
      </div>
    </div>
  );
}

function CartCard({ cart }) {
  const count = (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>سلة #{cart.cartId}</h3>
            <StatusBadge status={cart.status} />
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--gray-10)" }}>
            {cart.mallInfo?.name || `مول #${cart.mallId}`} • العميل {cart.customerInfo?.fullName || `#${cart.customerId}`}
          </p>
        </div>
        <div className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>₪{formatMoney(cart.grandTotal || cart.totalAmount)}</div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Mini label="عدد العناصر" value={count} />
        <Mini label="رسوم التوصيل" value={`₪${formatMoney(cart.deliveryFee)}`} />
        <Mini label="المدينة" value={cart.cityInfo?.name || cart.cityId || "-"} />
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

function DetailsPanel({ item, type, onClose }) {
  if (!item) return null;
  const rows =
    type === "order"
      ? item.items || []
      : type === "return" && item.orderItem
      ? [item.orderItem]
      : [];
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
          {type === "return" ? `إرجاع #${item.returnRequestId}` : `طلب #${item.shopOrderId}`}
        </h3>
        <button type="button" onClick={onClose} className="rounded-xl border px-3 py-2 text-xs" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>إغلاق</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="الحالة" value={formatOrderHubStatus(item.status)} />
        <Mini label="المتجر" value={item.shopInfo?.name || item.storeName || item.shopId} />
        <Mini label="العميل" value={item.customerInfo?.fullName || item.customerId} />
        <Mini label="التاريخ" value={formatDateTime(item.createdAt)} />
      </div>
      {item.deliveryInfo ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Mini label="المستلم" value={item.deliveryInfo.deliveryName} />
          <Mini label="الهاتف" value={[item.deliveryInfo.deliveryPhone?.prefix, item.deliveryInfo.deliveryPhone?.number].filter(Boolean).join(" ")} />
          <Mini label="العنوان" value={item.deliveryInfo.deliveryLocation} />
          <Mini label="ملاحظة" value={item.deliveryInfo.deliveryNote || "-"} />
        </div>
      ) : null}
      {type === "return" ? (
        <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>
          <div className="font-semibold" style={{ color: "var(--gray-12)" }}>{item.reason}</div>
          <p className="mt-2">{item.description || "لا يوجد وصف إضافي"}</p>
          {item.rejectionReason ? <p className="mt-2" style={{ color: "var(--red-11)" }}>{item.rejectionReason}</p> : null}
        </div>
      ) : null}
      {rows.length ? (
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
              {rows.map((row) => (
                <tr key={row.orderItemId} className="border-t" style={{ borderColor: "var(--gray-a5)" }}>
                  <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>{row.productName}</td>
                  <td className="px-4 py-3" style={{ color: "var(--gray-10)" }}>{row.variantName || "-"}</td>
                  <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>{row.quantity}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>₪{formatMoney(row.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default function OrderHubManagement({ initialTab = "overview" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [overview, setOverview] = useState({});
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: 0 });
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({ shopId: "", customerId: "" });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setPage(0);
    setStatus("");
    setSelected(null);
    setSelectedType("");
  }, [activeTab]);

  const params = useMemo(
    () => ({
      page,
      size: 10,
      status: status || undefined,
      shopId: filters.shopId || undefined,
      customerId: activeTab === "deliveries" ? undefined : filters.customerId || undefined,
    }),
    [activeTab, filters.customerId, filters.shopId, page, status]
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "overview" || activeTab === "finance") {
        const [dashboard, orderStats, returnStats, deliveryStats, finance, itemDistribution] = await Promise.all([
          orderHubApi.dashboard.getAdmin().catch(() => null),
          orderHubApi.orders.adminStats().catch(() => null),
          orderHubApi.returns.adminStats().catch(() => null),
          orderHubApi.deliveries.stats().catch(() => null),
          orderHubApi.finance.overview().catch(() => null),
          orderHubApi.finance.itemDistribution().catch(() => null),
        ]);
        setOverview({
          dashboard: unwrapOrderHubPayload(dashboard) || {},
          orderStats: unwrapOrderHubPayload(orderStats) || {},
          returnStats: unwrapOrderHubPayload(returnStats) || {},
          deliveryStats: unwrapOrderHubPayload(deliveryStats) || {},
          finance: unwrapOrderHubPayload(finance) || {},
          itemDistribution: unwrapOrderHubPayload(itemDistribution) || {},
        });
        setItems([]);
        return;
      }

      const response =
        activeTab === "orders"
          ? await orderHubApi.orders.adminPage(params)
          : activeTab === "returns"
          ? await orderHubApi.returns.adminPage(params)
          : activeTab === "deliveries"
          ? await orderHubApi.deliveries.page(params)
          : await orderHubApi.carts.adminPage(params);
      const normalized = normalizeOrderHubPage(response);
      setItems(normalized.content);
      setPageInfo(normalized);
    } catch (requestError) {
      setItems([]);
      setError(getApiErrorMessage(requestError, "فشل تحميل بيانات order-hub"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeTab, page, params]);

  const openOrder = async (order) => {
    setSelectedType("order");
    setSelected(order);
    try {
      const response = await orderHubApi.orders.adminById(order.shopOrderId);
      setSelected(unwrapOrderHubPayload(response));
    } catch {
      // Keep the list payload visible if detail fetch fails.
    }
  };

  const openReturn = async (item) => {
    setSelectedType("return");
    setSelected(item);
    try {
      const response = await orderHubApi.returns.adminById(item.returnRequestId);
      setSelected(unwrapOrderHubPayload(response));
    } catch {
      // Keep the list payload visible if detail fetch fails.
    }
  };

  const overrideOrder = async (order) => {
    const targetStatus = window.prompt("اكتب الحالة الجديدة للطلب", order.status || "NEW");
    if (!targetStatus) return;
    const reason = window.prompt("سبب تعديل الحالة", "تصحيح إداري");
    if (!reason) return;
    setActionLoading(`order-${order.shopOrderId}`);
    try {
      await orderHubApi.orders.adminOverride(order.shopOrderId, targetStatus, reason);
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تعديل حالة الطلب"));
    } finally {
      setActionLoading("");
    }
  };

  const deliveryAction = async (action, delivery) => {
    setActionLoading(`delivery-${delivery.deliveryId}`);
    try {
      if (action === "sent") await orderHubApi.deliveries.markSent(delivery.deliveryId);
      if (action === "onTheWay") await orderHubApi.deliveries.markOnTheWay(delivery.deliveryId);
      if (action === "delivered") await orderHubApi.deliveries.markDelivered(delivery.deliveryId);
      if (action === "failed") {
        const failureReason = window.prompt("سبب فشل التوصيل", "تعذر الوصول للعميل");
        if (!failureReason) return;
        const customerRejected = window.confirm("هل رفض العميل الاستلام؟");
        await orderHubApi.deliveries.markFailed(delivery.deliveryId, { failureReason, customerRejected });
      }
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحديث التوصيل"));
    } finally {
      setActionLoading("");
    }
  };

  const activeTabMeta = tabs.find((item) => item.key === activeTab) || tabs[0];
  const statusOptions =
    activeTab === "orders" ? ORDER_STATUSES : activeTab === "returns" ? RETURN_STATUSES : activeTab === "deliveries" ? DELIVERY_STATUSES : CART_STATUSES;

  return (
    <div dir="rtl" className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة الطلبات والتوصيل</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>واجهة تشغيل order-hub للإدارة</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          تحديث
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition"
            style={{
              background: activeTab === key ? "var(--blue-a3)" : "var(--gray-a2)",
              color: activeTab === key ? "var(--blue-11)" : "var(--gray-12)",
            }}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      <ErrorBox>{error}</ErrorBox>

      {activeTab === "overview" || activeTab === "finance" ? (
        <OverviewContent overview={overview} loading={loading} financeOnly={activeTab === "finance"} />
      ) : (
        <>
          <FilterBar
            status={status}
            statuses={statusOptions}
            filters={filters}
            loading={loading}
            onStatusChange={(next) => {
              setPage(0);
              setStatus(next);
            }}
            onFilterChange={(key, value) => {
              setPage(0);
              setFilters((current) => ({ ...current, [key]: value }));
            }}
            onRefresh={load}
          />

          {loading ? (
            <div className="py-10 text-center text-sm" style={{ color: "var(--gray-10)" }}>
              <FiLoader className="mx-auto mb-3 animate-spin" />
              جاري تحميل {activeTabMeta.label}...
            </div>
          ) : null}

          {!loading && !items.length ? <EmptyState icon={activeTabMeta.icon} text={`لا توجد بيانات في ${activeTabMeta.label}`} /> : null}

          <div className="space-y-4">
            {activeTab === "orders"
              ? items.map((item) => (
                  <OrderCard key={item.shopOrderId} order={item} onOpen={openOrder} onOverride={overrideOrder} disabled={actionLoading === `order-${item.shopOrderId}`} />
                ))
              : activeTab === "returns"
              ? items.map((item) => <ReturnCard key={item.returnRequestId} item={item} onOpen={openReturn} />)
              : activeTab === "deliveries"
              ? items.map((item) => <DeliveryCard key={item.deliveryId} delivery={item} onAction={deliveryAction} />)
              : items.map((item) => <CartCard key={item.cartId} cart={item} />)}
          </div>

          <Pager page={page} pageInfo={pageInfo} onPageChange={setPage} />

          <DetailsPanel item={selected} type={selectedType} onClose={() => setSelected(null)} />
        </>
      )}
    </div>
  );
}

function OverviewContent({ overview, loading, financeOnly }) {
  const dashboard = overview.dashboard || {};
  const orderKpis = dashboard.orderKpis || {};
  const deliveryKpis = dashboard.deliveryKpis || {};
  const returnKpis = dashboard.returnKpis || {};
  const finance = overview.finance || dashboard.financeKpis || {};
  const orderStats = overview.orderStats || {};
  const returnStats = overview.returnStats || {};
  const deliveryStats = overview.deliveryStats || {};
  const distribution = overview.itemDistribution || {};

  if (loading && !Object.keys(overview || {}).length) {
    return (
      <div className="py-10 text-center text-sm" style={{ color: "var(--gray-10)" }}>
        <FiLoader className="mx-auto mb-3 animate-spin" />
        جاري تحميل الملخص...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!financeOnly ? (
          <>
            <StatCard icon={FiPackage} label="كل الطلبات" value={orderKpis.totalOrders} />
            <StatCard icon={FiClock} label="طلبات جديدة" value={orderKpis.newOrders ?? orderStats.NEW} tone="amber" />
            <StatCard icon={FiTruck} label="قيد التوصيل" value={deliveryKpis.pendingDeliveries} />
            <StatCard icon={FiRotateCcw} label="إرجاعات معلقة" value={returnKpis.pendingReturns ?? returnStats.PENDING} tone="red" />
          </>
        ) : null}
        <StatCard icon={FiDollarSign} label="جاهزة للمستحقات" value={finance.itemsReadyForPayout} tone="green" />
        <StatCard icon={FiClock} label="ضمن فترة الحجز" value={finance.itemsInHoldingWindow ?? finance.itemsInHolding} tone="amber" />
        <StatCard icon={FiCheckCircle} label="إرجاعات مرفوضة محسوبة" value={finance.itemsReturnRejected} tone="green" />
        <StatCard icon={FiXCircle} label="فشل التوصيل" value={finance.failedDeliveries ?? deliveryStats.FAILED} tone="red" />
      </div>

      {finance.note ? (
        <div className="rounded-2xl border p-4 text-sm" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)", color: "var(--gray-11)" }}>
          {finance.note}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Breakdown title="حالات الطلبات" data={orderStats} />
        <Breakdown title="حالات الإرجاع" data={returnStats} />
        <Breakdown title="حالات التوصيل" data={deliveryStats} />
      </div>
      <Breakdown title="توزيع عناصر الطلبات" data={distribution} />
    </div>
  );
}

function Breakdown({ title, data }) {
  const entries = Object.entries(data || {});
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
      <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{title}</h3>
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
