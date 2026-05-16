import { Fragment, useState, useEffect, useCallback } from "react";
import { useSortedData, SortableTh } from "../../../utils/tableSort";
import {
  FiPackage, FiChevronDown, FiChevronUp, FiAlertCircle, FiLoader,
  FiMapPin, FiPhone, FiUser, FiArrowRight, FiRefreshCw,
} from "react-icons/fi";
import { ordersApi } from "./api";

// ── Helpers ───────────────────────────────────────────────────────────────────
function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium"
      style={{
        background: type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color: type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}>
      {message}
      <button onClick={onClose} className="opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ── Status config ─────────────────────────────────────────────────────────────
const ORDER_STATUS_MAP = {
  NEW:               { bg: "var(--blue-a3)",   fg: "var(--blue-11)",   dot: "var(--blue-9)",   label: "جديد" },
  PREPARING:         { bg: "var(--yellow-a3)", fg: "var(--yellow-11)", dot: "var(--yellow-9)", label: "جاري التحضير" },
  READY_FOR_PICKUP:  { bg: "var(--sky-a3)",    fg: "var(--sky-11)",    dot: "var(--sky-9)",    label: "جاهز للاستلام" },
  OUT_FOR_DELIVERY:  { bg: "var(--orange-a3)", fg: "var(--orange-11)", dot: "var(--orange-9)", label: "في الطريق" },
  DELIVERED:         { bg: "var(--green-a3)",  fg: "var(--green-11)",  dot: "var(--green-9)",  label: "تم التسليم" },
  CUSTOMER_REJECTED: { bg: "var(--red-a3)",    fg: "var(--red-11)",    dot: "var(--red-9)",    label: "رُفض العميل" },
  NO_RESPONSE:       { bg: "var(--gray-a3)",   fg: "var(--gray-11)",   dot: "var(--gray-9)",   label: "لا استجابة" },
};

const ADVANCE_LABEL = {
  NEW:              "بدء التحضير",
  PREPARING:        "جاهز للاستلام",
  READY_FOR_PICKUP: "بدء التوصيل",
  OUT_FOR_DELIVERY: "تم التسليم",
};

const TERMINAL = new Set(["DELIVERED", "CUSTOMER_REJECTED", "NO_RESPONSE"]);

const STATUS_FILTERS = [
  { value: "",                 label: "الكل" },
  { value: "NEW",              label: "جديد" },
  { value: "PREPARING",        label: "جاري التحضير" },
  { value: "READY_FOR_PICKUP", label: "جاهز للاستلام" },
  { value: "OUT_FOR_DELIVERY", label: "في الطريق" },
  { value: "DELIVERED",        label: "تم التسليم" },
  { value: "CUSTOMER_REJECTED",label: "رُفض العميل" },
  { value: "NO_RESPONSE",      label: "لا استجابة" },
];

function OrderStatusBadge({ status }) {
  const s = ORDER_STATUS_MAP[status] || { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)", label: status };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-5 py-3 rounded-xl gap-0.5"
      style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a5)" }}>
      <span className="text-xl font-bold" style={{ color: color || "var(--gray-12)" }}>{value ?? 0}</span>
      <span className="text-xs" style={{ color: "var(--gray-10)" }}>{label}</span>
    </div>
  );
}

function formatPhone(phone) {
  if (!phone) return "—";
  if (typeof phone === "string") return phone;
  return [phone.countryCode, phone.number].filter(Boolean).join("") || "—";
}

function formatDate(dt) {
  if (!dt) return "—";
  // Spring Boot may serialize LocalDateTime as [year, month, day, hour, min, sec, nano]
  // Month in JS is 0-indexed; LocalDateTime array is 1-indexed.
  const d = Array.isArray(dt)
    ? new Date(dt[0], (dt[1] ?? 1) - 1, dt[2] ?? 1, dt[3] ?? 0, dt[4] ?? 0, dt[5] ?? 0)
    : new Date(String(dt).replace(" ", "T")); // also handle "YYYY-MM-DD HH:mm:ss" strings
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Orders() {
  const [orders,       setOrders]       = useState([]);
  const { sorted: sortedOrders, sortKey, sortDir, onSort } = useSortedData(orders, "shopOrderId");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats,        setStats]        = useState({});
  const [expanded,     setExpanded]     = useState(null);
  const [advancing,    setAdvancing]    = useState(null);
  const [toast,        setToast]        = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const fetchStats = useCallback(() => {
    ordersApi.getStats()
      .then(r => setStats(r?.data || r || {}))
      .catch(() => {});
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = statusFilter
        ? await ordersApi.getByStatus(statusFilter)
        : await ordersApi.getAll();
      setOrders(res?.data?.content || res?.content || res?.data || []);
    } catch (e) {
      setError(e.message || "فشل جلب الطلبات");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); fetchStats(); }, [fetchOrders, fetchStats]);

  const handleAdvance = async (order) => {
    setAdvancing(order.shopOrderId);
    try {
      await ordersApi.advance(order.shopOrderId);
      showToast("تم تحديث حالة الطلب");
      fetchOrders();
      fetchStats();
    } catch (e) {
      showToast(e.message || "فشل تحديث الحالة", "error");
    } finally {
      setAdvancing(null);
    }
  };

  const total       = Object.values(stats).reduce((a, b) => a + b, 0);
  const activeCount = (stats.NEW || 0) + (stats.PREPARING || 0) + (stats.READY_FOR_PICKUP || 0) + (stats.OUT_FOR_DELIVERY || 0);

  return (
    <div dir="rtl" className="p-4 sm:p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة الطلبات</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--gray-10)" }}>
            {total > 0 ? `${total} طلب إجمالي` : "لا توجد طلبات"}
          </p>
        </div>
        <button
          onClick={() => { fetchOrders(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition hover:opacity-80"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>
          <FiRefreshCw size={14} /> تحديث
        </button>
      </div>

      {/* Stats */}
      {Object.keys(stats).length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <StatCard label="الكل"          value={total}                  />
          <StatCard label="نشط"           value={activeCount}            color="var(--blue-11)" />
          <StatCard label="جديد"          value={stats.NEW}              color="var(--blue-11)" />
          <StatCard label="جاري التحضير" value={stats.PREPARING}        color="var(--yellow-11)" />
          <StatCard label="جاهز"          value={stats.READY_FOR_PICKUP} color="var(--sky-11)" />
          <StatCard label="في الطريق"     value={stats.OUT_FOR_DELIVERY} color="var(--orange-11)" />
          <StatCard label="تم التسليم"    value={stats.DELIVERED}        color="var(--green-11)" />
        </div>
      )}

      {/* Status Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition border"
            style={{
              background:  statusFilter === f.value ? "var(--blue-9)" : "transparent",
              color:       statusFilter === f.value ? "#fff" : "var(--gray-11)",
              borderColor: statusFilter === f.value ? "var(--blue-9)" : "var(--gray-a6)",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl"
          style={{ background: "var(--red-2)", border: "1px solid var(--red-6)" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--red-11)" }}>
            <FiAlertCircle size={15} />{error}
          </div>
          <button onClick={fetchOrders} className="text-xs font-semibold underline" style={{ color: "var(--red-11)" }}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-14"><Spinner size={24} /></div>
      ) : orders.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
          <FiPackage size={36} style={{ color: "var(--gray-8)" }} className="mb-3" />
          <p className="font-semibold text-sm" style={{ color: "var(--gray-11)" }}>لا توجد طلبات</p>
          <p className="text-xs mt-1" style={{ color: "var(--gray-9)" }}>ستظهر الطلبات هنا عند استلامها</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 680 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gray-a6)", background: "var(--gray-a2)" }}>
                  <SortableTh label="#" sortKey="shopOrderId" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }} />
                  <SortableTh label="العميل" sortKey="customerInfo.username" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }} />
                  <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }}>العناصر</th>
                  <SortableTh label="الإجمالي" sortKey="total" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }} />
                  <SortableTh label="الحالة" sortKey="status" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }} />
                  <SortableTh label="التاريخ" sortKey="createdAt" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }} />
                  <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }}></th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order) => {
                  const isExpanded  = expanded === order.shopOrderId;
                  const isAdvancing = advancing === order.shopOrderId;
                  const canAdvance  = !TERMINAL.has(order.status);
                  return (
                    <Fragment key={order.shopOrderId}>
                      <tr
                        style={{ borderBottom: "1px solid var(--gray-a4)", cursor: "pointer" }}
                        onClick={() => setExpanded(isExpanded ? null : order.shopOrderId)}>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--gray-9)" }}>
                          #{order.shopOrderId}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: "var(--blue-a3)" }}>
                              <FiUser size={13} style={{ color: "var(--blue-11)" }} />
                            </div>
                            <span className="font-medium text-sm" style={{ color: "var(--gray-12)" }}>
                              {order.customerInfo?.username || order.customerInfo?.name || `عميل #${order.customerId}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--gray-11)" }}>
                          {order.items?.length ?? 0} عنصر
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold" style={{ color: "var(--green-11)" }}>
                            {Number(order.total || 0).toFixed(2)} ₪
                          </span>
                        </td>
                        <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--gray-10)" }}>
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {canAdvance && (
                              <button
                                onClick={() => handleAdvance(order)}
                                disabled={isAdvancing}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80 disabled:opacity-50 whitespace-nowrap"
                                style={{ background: "var(--blue-9)", color: "#fff" }}>
                                {isAdvancing ? <Spinner size={11} /> : <FiArrowRight size={11} />}
                                {ADVANCE_LABEL[order.status] || "تقديم"}
                              </button>
                            )}
                            <button
                              onClick={() => setExpanded(isExpanded ? null : order.shopOrderId)}
                              className="p-1.5 rounded-lg transition hover:opacity-70"
                              style={{ color: "var(--gray-10)" }}>
                              {isExpanded ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4"
                            style={{ background: "var(--gray-a2)", borderBottom: "1px solid var(--gray-a4)" }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                              {/* Order items */}
                              <div>
                                <p className="text-xs font-bold mb-2" style={{ color: "var(--gray-12)" }}>عناصر الطلب</p>
                                <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--gray-a5)" }}>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr style={{ background: "var(--gray-a3)", borderBottom: "1px solid var(--gray-a4)" }}>
                                        {["المنتج", "الكمية", "السعر", "الإجمالي"].map(h => (
                                          <th key={h} className="px-3 py-2 text-right font-semibold" style={{ color: "var(--gray-10)" }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(order.items || []).map((item, j) => (
                                        <tr key={item.orderItemId || j}
                                          style={{ borderBottom: j < (order.items.length - 1) ? "1px solid var(--gray-a3)" : "none" }}>
                                          <td className="px-3 py-2">
                                            <div className="font-medium" style={{ color: "var(--gray-12)" }}>{item.productName}</div>
                                            {item.variantName && (
                                              <div style={{ color: "var(--gray-9)" }}>{item.variantName}</div>
                                            )}
                                          </td>
                                          <td className="px-3 py-2" style={{ color: "var(--gray-11)" }}>×{item.quantity}</td>
                                          <td className="px-3 py-2" style={{ color: "var(--gray-11)" }}>
                                            {Number(item.unitPrice || 0).toFixed(2)} ₪
                                          </td>
                                          <td className="px-3 py-2 font-semibold" style={{ color: "var(--green-11)" }}>
                                            {Number(item.lineTotal || 0).toFixed(2)} ₪
                                          </td>
                                        </tr>
                                      ))}
                                      {(!order.items || order.items.length === 0) && (
                                        <tr>
                                          <td colSpan={4} className="px-3 py-3 text-center" style={{ color: "var(--gray-9)" }}>
                                            لا توجد عناصر
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Delivery info */}
                              <div>
                                <p className="text-xs font-bold mb-2" style={{ color: "var(--gray-12)" }}>معلومات التوصيل</p>
                                <div className="rounded-xl px-4 py-3 space-y-2.5 text-xs"
                                  style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a5)" }}>
                                  {order.deliveryInfo?.deliveryName && (
                                    <div className="flex items-center gap-2">
                                      <FiUser size={12} style={{ color: "var(--gray-9)", flexShrink: 0 }} />
                                      <span style={{ color: "var(--gray-11)" }}>{order.deliveryInfo.deliveryName}</span>
                                    </div>
                                  )}
                                  {order.deliveryInfo?.deliveryPhone && (
                                    <div className="flex items-center gap-2">
                                      <FiPhone size={12} style={{ color: "var(--gray-9)", flexShrink: 0 }} />
                                      <span style={{ color: "var(--gray-11)" }}>{formatPhone(order.deliveryInfo.deliveryPhone)}</span>
                                    </div>
                                  )}
                                  {order.deliveryInfo?.deliveryLocation && (
                                    <div className="flex items-start gap-2">
                                      <FiMapPin size={12} style={{ color: "var(--gray-9)", flexShrink: 0, marginTop: 1 }} />
                                      <span style={{ color: "var(--gray-11)" }}>{order.deliveryInfo.deliveryLocation}</span>
                                    </div>
                                  )}
                                  {order.deliveryInfo?.deliveryNote && (
                                    <p className="italic pt-1 border-t" style={{ color: "var(--gray-9)", borderColor: "var(--gray-a4)" }}>
                                      ملاحظة: {order.deliveryInfo.deliveryNote}
                                    </p>
                                  )}
                                  {!order.deliveryInfo && (
                                    <p style={{ color: "var(--gray-9)" }}>لا توجد معلومات توصيل</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
