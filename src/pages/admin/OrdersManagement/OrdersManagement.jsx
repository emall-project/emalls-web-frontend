import { useState, useEffect, useCallback, Fragment } from "react";
import { useSortedData, SortableSpan } from "../../../utils/tableSort";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import {
  FiRefreshCw, FiLoader, FiAlertCircle, FiChevronDown, FiChevronUp,
  FiChevronLeft, FiChevronRight, FiUser, FiX, FiEdit,
  FiPackage, FiTruck, FiCheck,
} from "react-icons/fi";
import { adminOrdersApi } from "./api";
import { shopsApi } from "../ShopManagement/api";

// ── Radix Select wrapper ───────────────────────────────────────────────────────
// value="" means "no selection" (placeholder shown). Internally maps to sentinel "__NONE__".
const NONE = "__NONE__";

function AppSelect({ value, onValueChange, placeholder = "اختر...", options = [], disabled = false, width = "100%" }) {
  const container = document.querySelector(".radix-themes") || document.body;
  const radixValue = value === "" || value == null ? NONE : value;

  return (
    <Select.Root
      value={radixValue}
      onValueChange={(v) => onValueChange(v === NONE ? "" : v)}
      disabled={disabled}
      dir="rtl"
    >
      <Select.Trigger
        className="inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm border outline-none transition-all data-[state=open]:border-blue-500 data-[state=open]:ring-2 data-[state=open]:ring-blue-500/20 data-[disabled]:opacity-50"
        style={{
          width,
          background:   "var(--gray-a2)",
          borderColor:  "var(--gray-a6)",
          color:        radixValue === NONE ? "var(--gray-9)" : "var(--gray-12)",
          direction:    "rtl",
        }}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon asChild>
          <FiChevronDown size={13} style={{ color: "var(--gray-9)", flexShrink: 0 }} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal container={container}>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-[9999] rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            background:   "var(--gray-2)",
            borderColor:  "var(--gray-a6)",
            minWidth:     "var(--radix-select-trigger-width)",
            maxHeight:    260,
          }}
        >
          <Select.Viewport className="p-1.5 space-y-0.5">
            {options.map(({ value: v, label, disabled: optDisabled }) => (
              <Select.Item
                key={v}
                value={v === "" ? NONE : v}
                disabled={optDisabled}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer outline-none select-none data-[highlighted]:opacity-80 data-[disabled]:opacity-40 transition-colors"
                style={{
                  color:      "var(--gray-12)",
                  direction:  "rtl",
                  background: "transparent",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gray-a3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Select.ItemText>{label}</Select.ItemText>
                <Select.ItemIndicator>
                  <FiCheck size={13} style={{ color: "var(--blue-9)" }} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_LABEL = {
  NEW:              "جديد",
  PREPARING:        "جاري التحضير",
  READY_FOR_PICKUP: "جاهز للاستلام",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED:        "تم التسليم",
  CUSTOMER_REJECTED:"رفض العميل",
  NO_RESPONSE:      "لا استجابة",
};

const STATUS_COLOR = {
  NEW:              { bg: "var(--blue-a3)",   fg: "var(--blue-11)",   dot: "var(--blue-9)"   },
  PREPARING:        { bg: "var(--amber-a3)",  fg: "var(--amber-11)",  dot: "var(--amber-9)"  },
  READY_FOR_PICKUP: { bg: "var(--purple-a3)", fg: "var(--purple-11)", dot: "var(--purple-9)" },
  OUT_FOR_DELIVERY: { bg: "var(--indigo-a3)", fg: "var(--indigo-11)", dot: "var(--indigo-9)" },
  DELIVERED:        { bg: "var(--green-a3)",  fg: "var(--green-11)",  dot: "var(--green-9)"  },
  CUSTOMER_REJECTED:{ bg: "var(--red-a3)",    fg: "var(--red-11)",    dot: "var(--red-9)"    },
  NO_RESPONSE:      { bg: "var(--gray-a3)",   fg: "var(--gray-11)",   dot: "var(--gray-9)"   },
};

const ALL_STATUSES = Object.keys(STATUS_LABEL);

const STAT_CARDS = [
  { key: null,               label: "الكل",           icon: FiPackage,  color: "var(--gray-9)"   },
  { key: "NEW",              label: "جديد",           icon: FiPackage,  color: "var(--blue-9)"   },
  { key: "PREPARING",        label: "جاري التحضير",   icon: FiPackage,  color: "var(--amber-9)"  },
  { key: "READY_FOR_PICKUP", label: "جاهز للاستلام",  icon: FiCheck,    color: "var(--purple-9)" },
  { key: "OUT_FOR_DELIVERY", label: "في الطريق",      icon: FiTruck,    color: "var(--indigo-9)" },
  { key: "DELIVERED",        label: "مُسلَّم",         icon: FiCheck,    color: "var(--green-9)"  },
  { key: "CUSTOMER_REJECTED",label: "رفض العميل",     icon: FiX,        color: "var(--red-9)"    },
  { key: "NO_RESPONSE",      label: "لا استجابة",     icon: FiX,        color: "var(--gray-9)"   },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(dt) {
  if (!dt) return "—";
  const d = Array.isArray(dt)
    ? new Date(dt[0], (dt[1] ?? 1) - 1, dt[2] ?? 1, dt[3] ?? 0, dt[4] ?? 0, dt[5] ?? 0)
    : new Date(String(dt).replace(" ", "T"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmt(n) {
  return Number(n || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPhone(phone) {
  if (!phone) return "—";
  if (typeof phone === "string") return phone;
  return [phone.prefix, phone.countryCode, phone.number].filter(Boolean).join(" ").trim() || "—";
}

function getShopName(order) {
  return order.shopInfo?.name || order.shopInfo?.storeName || order.storeName || `متجر #${order.shopId}`;
}

function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.NO_RESPONSE;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium"
      style={{
        background:  type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color:       type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}>
      {type === "success" ? <FiCheck size={15} /> : <FiAlertCircle size={15} />}
      <span>{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 mr-1"><FiX size={14} /></button>
    </div>
  );
}

// ── Override Dialog ────────────────────────────────────────────────────────────


// ── Main component ────────────────────────────────────────────────────────────
export default function OrdersManagement() {
  const [orders, setOrders]           = useState([]);
  const { sorted: sortedOrders, sortKey, sortDir, onSort } = useSortedData(orders, "shopOrderId");
  const [stats, setStats]             = useState({});
  const [shops, setShops]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalItems, setTotalItems]   = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [shopIdInput, setShopIdInput]   = useState("");
  const [custIdInput, setCustIdInput]   = useState("");
  const [shopId, setShopId]             = useState("");
  const [custId, setCustId]             = useState("");
  const [expanded, setExpanded]         = useState(null);
  const [overrideOrder, setOverrideOrder] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideError, setOverrideError]   = useState("");
  const [toast, setToast]             = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  // Stats
  useEffect(() => {
    adminOrdersApi.getStats()
      .then(r => setStats(r?.data || {}))
      .catch(() => {});
  }, []);

  // Shops list for filter dropdown
  useEffect(() => {
    shopsApi.getAll({ size: 500 })
      .then(r => {
        const data = r?.data || r?.content || [];
        const list = Array.isArray(data) ? data : (data?.content || []);
        setShops(list);
      })
      .catch(() => {});
  }, []);

  // Orders list
  const fetchOrders = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await adminOrdersApi.getAll({ page, size: 20, status: statusFilter, shopId, customerId: custId });
      const d = r?.data || {};
      setOrders(d.content || []);
      setTotalPages(d.meta?.totalPages || 1);
      setTotalItems(d.meta?.totalItems || 0);
    } catch (e) {
      setError(e.message || "فشل جلب الطلبات");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, shopId, custId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const applyFilters = () => {
    setShopId(shopIdInput.trim());
    setCustId(custIdInput.trim());
    setPage(0);
  };

  const clearFilters = () => {
    setStatusFilter(""); setShopIdInput(""); setCustIdInput("");
    setShopId(""); setCustId(""); setPage(0);
  };

  const handleStatCard = (key) => {
    setStatusFilter(key || "");
    setPage(0);
  };

  // Override
  const openOverride = (order) => {
    setOverrideOrder(order);
    setOverrideStatus(order.status || "");
    setOverrideReason("");
    setOverrideError("");
  };

  const submitOverride = async () => {
    if (!overrideStatus || !overrideReason.trim()) {
      setOverrideError("اختر الحالة الجديدة وأدخل السبب."); return;
    }
    setOverrideSaving(true); setOverrideError("");
    try {
      await adminOrdersApi.override(overrideOrder.shopOrderId, overrideStatus, overrideReason.trim());
      showToast("تم تغيير حالة الطلب");
      setOverrideOrder(null);
      fetchOrders();
    } catch (err) {
      setOverrideError(err.message || "فشل تغيير الحالة");
    } finally {
      setOverrideSaving(false);
    }
  };

  const totalAll = Object.values(stats).reduce((s, v) => s + Number(v || 0), 0);

  return (
    <div dir="rtl" className="p-4 sm:p-6 space-y-5">

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة الطلبات</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--gray-10)" }}>مراقبة وإدارة طلبات جميع المتاجر</p>
        </div>
        <button onClick={() => { fetchOrders(); adminOrdersApi.getStats().then(r => setStats(r?.data || {})).catch(() => {}); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
          style={{ background: "var(--gray-a3)", color: "var(--gray-12)" }}
          disabled={loading}>
          {loading ? <Spinner size={14} /> : <FiRefreshCw size={14} />}
          تحديث
        </button>
      </div>

      {/* Stats cards */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => {
          const count = key ? (stats[key] || 0) : totalAll;
          const active = statusFilter === (key || "");
          return (
            <button key={label} onClick={() => handleStatCard(key)}
              className="flex-shrink-0 flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border transition-all text-center min-w-[90px]"
              style={{
                background:   active ? "var(--blue-a3)" : "var(--gray-1)",
                borderColor:  active ? "var(--blue-a6)" : "var(--gray-a5)",
                boxShadow:    active ? "0 0 0 2px var(--blue-a4)" : "none",
              }}>
              <Icon size={16} style={{ color: active ? "var(--blue-9)" : color }} />
              <span className="text-xl font-bold" style={{ color: active ? "var(--blue-11)" : "var(--gray-12)" }}>
                {Number(count).toLocaleString()}
              </span>
              <span className="text-[11px]" style={{ color: active ? "var(--blue-10)" : "var(--gray-10)" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border p-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Status */}
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الحالة</label>
            <AppSelect
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setPage(0); }}
              placeholder="الكل"
              options={[
                { value: "", label: "الكل" },
                ...ALL_STATUSES.map(s => ({ value: s, label: STATUS_LABEL[s] })),
              ]}
            />
          </div>

          {/* Shop name */}
          <div className="flex flex-col gap-1.5 min-w-50">
            <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>المتجر</label>
            <AppSelect
              value={shopIdInput}
              onValueChange={setShopIdInput}
              placeholder="الكل"
              options={[
                { value: "", label: "الكل" },
                ...shops.map(s => ({ value: String(s.shopId), label: s.name })),
              ]}
            />
          </div>

          {/* Customer ID */}
          <div className="flex flex-col gap-1.5 min-w-[130px]">
            <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>رقم العميل</label>
            <input type="number" value={custIdInput} onChange={e => setCustIdInput(e.target.value)}
              placeholder="مثال: 12"
              className="rounded-xl px-3 py-2.5 text-sm border outline-none"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl" }} />
          </div>

          <div className="flex gap-2 items-center pb-0.5">
            <button onClick={applyFilters}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
              style={{ background: "var(--blue-9)", color: "#fff" }}>
              بحث
            </button>
            {(statusFilter || shopId || custId) && (
              <button onClick={clearFilters}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition"
                style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                مسح
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>

        {/* Table head */}
        <div className="grid gap-3 px-4 py-3 text-xs font-bold border-b"
          style={{
            gridTemplateColumns: "2.5rem 1fr 1fr 5rem 7rem 8rem 9rem 5rem",
            borderColor: "var(--gray-a5)", background: "var(--gray-2)", color: "var(--gray-10)",
          }}>
          <span />
          <SortableSpan label="#" sortKey="shopOrderId" currentKey={sortKey} direction={sortDir} onSort={onSort} className="text-right" />
          <SortableSpan label="المتجر" sortKey="shopInfo.name" currentKey={sortKey} direction={sortDir} onSort={onSort} className="text-right" />
          <span className="text-right">العناصر</span>
          <SortableSpan label="الإجمالي" sortKey="total" currentKey={sortKey} direction={sortDir} onSort={onSort} className="text-right" />
          <SortableSpan label="الحالة" sortKey="status" currentKey={sortKey} direction={sortDir} onSort={onSort} className="text-right" />
          <SortableSpan label="التاريخ" sortKey="createdAt" currentKey={sortKey} direction={sortDir} onSort={onSort} className="text-right" />
          <span className="text-right">إجراء</span>
        </div>

        {/* Loading / Error / Empty */}
        {loading && (
          <div className="flex justify-center items-center py-16 gap-2" style={{ color: "var(--gray-10)" }}>
            <Spinner size={20} />
            <span className="text-sm">جاري التحميل...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 m-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}>
            <FiAlertCircle size={15} />
            <span>{error}</span>
            <button onClick={fetchOrders} className="mr-auto underline text-xs">إعادة المحاولة</button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-16 text-sm" style={{ color: "var(--gray-10)" }}>
            لا توجد طلبات
          </div>
        )}

        {/* Rows */}
        {!loading && !error && sortedOrders.map((order) => {
          const isExpanded = expanded === order.shopOrderId;
          return (
            <Fragment key={order.shopOrderId}>
              {/* Main row */}
              <div
                className="grid gap-3 px-4 py-3 items-center border-b transition hover:opacity-90 cursor-pointer"
                style={{
                  gridTemplateColumns: "2.5rem 1fr 1fr 5rem 7rem 8rem 9rem 5rem",
                  borderColor: "var(--gray-a4)",
                  background: isExpanded ? "var(--blue-a2)" : "transparent",
                }}
                onClick={() => setExpanded(isExpanded ? null : order.shopOrderId)}
              >
                {/* Expand chevron */}
                <span style={{ color: "var(--gray-9)" }}>
                  {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </span>

                {/* Order # + customer */}
                <div>
                  <div className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>#{order.shopOrderId}</div>
                  <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--gray-10)" }}>
                    <FiUser size={11} />
                    {order.customerInfo?.username || order.customerInfo?.fullName || `عميل #${order.customerId}`}
                  </div>
                </div>

                {/* Shop */}
                <div className="text-sm truncate" style={{ color: "var(--gray-11)" }}>
                  {getShopName(order)}
                </div>

                {/* Items count */}
                <div className="text-sm text-center font-medium" style={{ color: "var(--gray-12)" }}>
                  {(order.items || []).length} عنصر
                </div>

                {/* Total */}
                <div className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                  ₪{fmt(order.total)}
                </div>

                {/* Status */}
                <StatusBadge status={order.status} />

                {/* Date */}
                <div className="text-xs" style={{ color: "var(--gray-10)" }}>
                  {formatDate(order.createdAt)}
                </div>

                {/* Override button */}
                <button
                  onClick={(e) => { e.stopPropagation(); openOverride(order); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition hover:opacity-80"
                  style={{ background: "var(--orange-a3)", color: "var(--orange-11)" }}
                  title="تجاوز الحالة"
                >
                  <FiEdit size={12} />
                  تجاوز
                </button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-b px-5 py-4 space-y-4"
                  style={{ borderColor: "var(--gray-a4)", background: "var(--gray-a1)" }}>

                  {/* Delivery info */}
                  {order.deliveryInfo && (
                    <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--gray-11)" }}>
                      <div><span className="font-semibold" style={{ color: "var(--gray-12)" }}>المستلم: </span>{order.deliveryInfo.deliveryName || "—"}</div>
                      <div><span className="font-semibold" style={{ color: "var(--gray-12)" }}>الهاتف: </span>{formatPhone(order.deliveryInfo.deliveryPhone)}</div>
                      <div><span className="font-semibold" style={{ color: "var(--gray-12)" }}>الموقع: </span>{order.deliveryInfo.deliveryLocation || "—"}</div>
                    </div>
                  )}

                  {/* Items table */}
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--gray-a4)" }}>
                    <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--gray-2)", color: "var(--gray-10)" }}>
                          {["المنتج", "المتغير", "الكمية", "سعر الوحدة", "الإجمالي"].map(h => (
                            <th key={h} className="text-right px-3 py-2.5 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(order.items || []).map((item, i) => (
                          <tr key={item.orderItemId ?? i}
                            style={{ borderTop: "1px solid var(--gray-a3)", color: "var(--gray-12)" }}>
                            <td className="px-3 py-2.5 font-medium">{item.productName || `#${item.productId}`}</td>
                            <td className="px-3 py-2.5" style={{ color: "var(--gray-10)" }}>{item.variantName || "—"}</td>
                            <td className="px-3 py-2.5 text-center">{item.quantity}</td>
                            <td className="px-3 py-2.5">₪{fmt(item.unitPrice)}</td>
                            <td className="px-3 py-2.5 font-bold">₪{fmt(item.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs" style={{ color: "var(--gray-10)" }}>
            {totalItems.toLocaleString()} طلب إجمالاً — صفحة {page + 1} من {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-2 rounded-xl transition disabled:opacity-40"
              style={{ background: "var(--gray-a3)", color: "var(--gray-12)" }}>
              <FiChevronRight size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5));
              const n = start + i;
              return (
                <button key={n} onClick={() => setPage(n)}
                  className="w-9 h-9 rounded-xl text-sm font-medium transition"
                  style={{
                    background: n === page ? "var(--blue-9)" : "var(--gray-a3)",
                    color:      n === page ? "#fff" : "var(--gray-12)",
                  }}>
                  {n + 1}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="p-2 rounded-xl transition disabled:opacity-40"
              style={{ background: "var(--gray-a3)", color: "var(--gray-12)" }}>
              <FiChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Override Dialog */}
      <Dialog.Root open={!!overrideOrder} onOpenChange={(o) => !o && setOverrideOrder(null)}>
        <Dialog.Portal container={document.querySelector(".radix-themes") || document.body}>
          <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                تجاوز حالة الطلب #{overrideOrder?.shopOrderId}
              </Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--gray-10)" }}>
                <FiX size={16} />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              {/* Current status */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a5)" }}>
                <span className="text-xs font-semibold" style={{ color: "var(--gray-10)" }}>الحالة الحالية:</span>
                <StatusBadge status={overrideOrder?.status} />
              </div>

              {/* New status */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-11)" }}>
                  الحالة الجديدة <span style={{ color: "var(--red-9)" }}>*</span>
                </label>
                <AppSelect
                  value={overrideStatus}
                  onValueChange={setOverrideStatus}
                  placeholder="اختر الحالة..."
                  options={ALL_STATUSES.map(s => ({
                    value:    s,
                    label:    STATUS_LABEL[s],
                    disabled: s === overrideOrder?.status,
                  }))}
                  width="100%"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-11)" }}>
                  سبب التجاوز <span style={{ color: "var(--red-9)" }}>*</span>
                </label>
                <textarea
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  placeholder="اذكر سبب تغيير الحالة يدوياً..."
                  rows={3}
                  className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none resize-none"
                  style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl" }}
                />
              </div>

              {overrideError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                  style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}>
                  <FiAlertCircle size={13} />
                  {overrideError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={submitOverride} disabled={overrideSaving || !overrideStatus || !overrideReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--orange-9)", color: "#fff" }}>
                  {overrideSaving ? <Spinner size={14} /> : <FiEdit size={14} />}
                  {overrideSaving ? "جاري الحفظ..." : "تطبيق التجاوز"}
                </button>
                <Dialog.Close
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition"
                  style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                  إلغاء
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
