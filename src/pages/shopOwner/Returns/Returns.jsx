import { Fragment, useState, useEffect, useCallback } from "react";
import { useSortedData, SortableTh } from "../../../utils/tableSort";
import * as Dialog from "@radix-ui/react-dialog";
import {
  FiX, FiAlertCircle, FiLoader, FiCheck, FiSlash,
  FiRefreshCw, FiPackage, FiUser, FiChevronDown, FiChevronUp,
} from "react-icons/fi";
import { returnsApi } from "./api";

// ── Helpers ───────────────────────────────────────────────────────────────────
function useThemeContainer() {
  const [c, setC] = useState(null);
  useEffect(() => { setC(document.querySelector(".radix-themes") || document.body); }, []);
  return c;
}

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-9999 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium"
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
const RETURN_STATUS_MAP = {
  PENDING:  { bg: "var(--yellow-a3)", fg: "var(--yellow-11)", dot: "var(--yellow-9)", label: "قيد المراجعة" },
  APPROVED: { bg: "var(--green-a3)",  fg: "var(--green-11)",  dot: "var(--green-9)",  label: "مقبول" },
  REJECTED: { bg: "var(--red-a3)",    fg: "var(--red-11)",    dot: "var(--red-9)",    label: "مرفوض" },
};

const STATUS_FILTERS = [
  { value: "",         label: "الكل" },
  { value: "PENDING",  label: "قيد المراجعة" },
  { value: "APPROVED", label: "مقبول" },
  { value: "REJECTED", label: "مرفوض" },
];

function ReturnStatusBadge({ status }) {
  const s = RETURN_STATUS_MAP[status] || { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)", label: status };
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

function formatDate(dt) {
  if (!dt) return "—";
  const d = Array.isArray(dt)
    ? new Date(dt[0], (dt[1] ?? 1) - 1, dt[2] ?? 1, dt[3] ?? 0, dt[4] ?? 0, dt[5] ?? 0)
    : new Date(String(dt).replace(" ", "T"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Reject Dialog ─────────────────────────────────────────────────────────────
function RejectDialog({ open, onOpenChange, onConfirm, loading }) {
  const themeContainer = useThemeContainer();
  const [reason, setReason] = useState("");

  useEffect(() => { if (open) setReason(""); }, [open]);

  const handleSubmit = () => {
    if (reason.trim()) onConfirm(reason.trim());
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-9990"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }} />
        <Dialog.Content dir="rtl" className="fixed inset-0 z-9991 flex items-center justify-center p-4"
          aria-describedby={undefined}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6"
            style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                سبب الرفض
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ color: "var(--gray-11)" }}>
                  <FiX size={16} />
                </button>
              </Dialog.Close>
            </div>

            <p className="text-xs mb-3" style={{ color: "var(--gray-10)" }}>
              يرجى ذكر سبب رفض طلب الإرجاع. سيتم إرساله للعميل.
            </p>

            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="اكتب سبب الرفض..."
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none transition"
              style={{
                background: "var(--gray-a2)", borderColor: "var(--gray-a6)",
                color: "var(--gray-12)", direction: "rtl",
              }}
            />

            <div className="flex gap-3 mt-4">
              <Dialog.Close asChild>
                <button className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition hover:opacity-80"
                  style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>
                  إلغاء
                </button>
              </Dialog.Close>
              <button
                onClick={handleSubmit}
                disabled={!reason.trim() || loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--red-9)", color: "#fff" }}>
                {loading ? <Spinner size={14} /> : <FiSlash size={14} />}
                رفض الطلب
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Returns() {
  const [returns,      setReturns]      = useState([]);
  const { sorted: sortedReturns, sortKey, sortDir, onSort } = useSortedData(returns, "returnRequestId");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats,        setStats]        = useState({});
  const [expanded,     setExpanded]     = useState(null);
  const [approving,    setApproving]    = useState(null);
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectLoading,setRejectLoading]= useState(false);
  const [toast,        setToast]        = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const fetchStats = useCallback(() => {
    returnsApi.getStats()
      .then(r => setStats(r?.data || r || {}))
      .catch(() => {});
  }, []);

  const fetchReturns = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = statusFilter
        ? await returnsApi.getByStatus(statusFilter)
        : await returnsApi.getAll();
      setReturns(res?.data?.content || res?.content || res?.data || []);
    } catch (e) {
      setError(e.message || "فشل جلب طلبات الإرجاع");
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchReturns(); fetchStats(); }, [fetchReturns, fetchStats]);

  const handleApprove = async (ret) => {
    setApproving(ret.returnRequestId);
    try {
      await returnsApi.approve(ret.returnRequestId);
      showToast("تم قبول طلب الإرجاع");
      fetchReturns();
      fetchStats();
    } catch (e) {
      showToast(e.message || "فشل قبول الطلب", "error");
    } finally {
      setApproving(null);
    }
  };

  const openReject = (ret) => { setRejectTarget(ret); setRejectOpen(true); };

  const handleReject = async (rejectionReason) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await returnsApi.reject(rejectTarget.returnRequestId, rejectionReason);
      showToast("تم رفض طلب الإرجاع");
      setRejectOpen(false);
      fetchReturns();
      fetchStats();
    } catch (e) {
      showToast(e.message || "فشل رفض الطلب", "error");
    } finally {
      setRejectLoading(false);
    }
  };

  const total   = Object.values(stats).reduce((a, b) => a + b, 0);
  const pending = stats.PENDING || 0;

  return (
    <div dir="rtl" className="p-4 sm:p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        loading={rejectLoading}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة الإرجاعات</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--gray-10)" }}>
            {pending > 0 ? `${pending} طلب قيد المراجعة` : total > 0 ? `${total} طلب إجمالي` : "لا توجد طلبات"}
          </p>
        </div>
        <button
          onClick={() => { fetchReturns(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition hover:opacity-80"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>
          <FiRefreshCw size={14} /> تحديث
        </button>
      </div>

      {/* Stats */}
      {Object.keys(stats).length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <StatCard label="الكل"          value={total}          />
          <StatCard label="قيد المراجعة" value={stats.PENDING}  color="var(--yellow-11)" />
          <StatCard label="مقبول"         value={stats.APPROVED} color="var(--green-11)" />
          <StatCard label="مرفوض"         value={stats.REJECTED} color="var(--red-11)" />
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
          <button onClick={fetchReturns} className="text-xs font-semibold underline" style={{ color: "var(--red-11)" }}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-14"><Spinner size={24} /></div>
      ) : returns.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
          <FiPackage size={36} style={{ color: "var(--gray-8)" }} className="mb-3" />
          <p className="font-semibold text-sm" style={{ color: "var(--gray-11)" }}>لا توجد طلبات إرجاع</p>
          <p className="text-xs mt-1" style={{ color: "var(--gray-9)" }}>ستظهر هنا عند تقديم العملاء طلبات الإرجاع</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gray-a6)", background: "var(--gray-a2)" }}>
                  <SortableTh label="#" sortKey="returnRequestId" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }} />
                  <SortableTh label="العميل" sortKey="customerInfo.username" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }} />
                  <SortableTh label="المنتج" sortKey="orderItem.productName" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }} />
                  <SortableTh label="السبب" sortKey="reason" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }} />
                  <SortableTh label="الحالة" sortKey="status" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }} />
                  <SortableTh label="التاريخ" sortKey="createdAt" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }} />
                  <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "var(--gray-10)" }}></th>
                </tr>
              </thead>
              <tbody>
                {sortedReturns.map((ret) => {
                  const isExpanded  = expanded === ret.returnRequestId;
                  const isApproving = approving === ret.returnRequestId;
                  const isPending   = ret.status === "PENDING";
                  return (
                    <Fragment key={ret.returnRequestId}>
                      <tr
                        style={{ borderBottom: "1px solid var(--gray-a4)", cursor: "pointer" }}
                        onClick={() => setExpanded(isExpanded ? null : ret.returnRequestId)}>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--gray-9)" }}>
                          #{ret.returnRequestId}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: "var(--blue-a3)" }}>
                              <FiUser size={13} style={{ color: "var(--blue-11)" }} />
                            </div>
                            <span className="font-medium text-sm" style={{ color: "var(--gray-12)" }}>
                              {ret.customerInfo?.username || ret.customerInfo?.name || `عميل #${ret.customerId}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--gray-11)" }}>
                          <div className="font-medium">{ret.orderItem?.productName || "—"}</div>
                          {ret.orderItem?.variantName && (
                            <div style={{ color: "var(--gray-9)" }}>{ret.orderItem.variantName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs max-w-45" style={{ color: "var(--gray-11)" }}>
                          <span className="line-clamp-2">{ret.reason}</span>
                        </td>
                        <td className="px-4 py-3"><ReturnStatusBadge status={ret.status} /></td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--gray-10)" }}>
                          {formatDate(ret.createdAt)}
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApprove(ret)}
                                  disabled={isApproving}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80 disabled:opacity-50"
                                  style={{ background: "var(--green-9)", color: "#fff" }}>
                                  {isApproving ? <Spinner size={11} /> : <FiCheck size={11} />}
                                  قبول
                                </button>
                                <button
                                  onClick={() => openReject(ret)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                                  style={{ background: "var(--red-a3)", color: "var(--red-11)" }}>
                                  <FiSlash size={11} /> رفض
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setExpanded(isExpanded ? null : ret.returnRequestId)}
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

                              {/* Reason & description */}
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-bold mb-1" style={{ color: "var(--gray-12)" }}>سبب الإرجاع</p>
                                  <p className="text-xs rounded-xl px-3 py-2"
                                    style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a5)", color: "var(--gray-11)" }}>
                                    {ret.reason}
                                  </p>
                                </div>
                                {ret.description && (
                                  <div>
                                    <p className="text-xs font-bold mb-1" style={{ color: "var(--gray-12)" }}>وصف إضافي</p>
                                    <p className="text-xs rounded-xl px-3 py-2"
                                      style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a5)", color: "var(--gray-11)" }}>
                                      {ret.description}
                                    </p>
                                  </div>
                                )}
                                {ret.rejectionReason && (
                                  <div>
                                    <p className="text-xs font-bold mb-1" style={{ color: "var(--red-11)" }}>سبب الرفض</p>
                                    <p className="text-xs rounded-xl px-3 py-2"
                                      style={{ background: "var(--red-a2)", border: "1px solid var(--red-a4)", color: "var(--red-11)" }}>
                                      {ret.rejectionReason}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Order item details & image */}
                              <div className="space-y-3">
                                {ret.orderItem && (
                                  <div>
                                    <p className="text-xs font-bold mb-2" style={{ color: "var(--gray-12)" }}>تفاصيل المنتج</p>
                                    <div className="rounded-xl px-4 py-3 text-xs space-y-1.5"
                                      style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a5)" }}>
                                      <div className="flex justify-between">
                                        <span style={{ color: "var(--gray-10)" }}>المنتج</span>
                                        <span className="font-medium" style={{ color: "var(--gray-12)" }}>{ret.orderItem.productName}</span>
                                      </div>
                                      {ret.orderItem.variantName && (
                                        <div className="flex justify-between">
                                          <span style={{ color: "var(--gray-10)" }}>المتغير</span>
                                          <span style={{ color: "var(--gray-11)" }}>{ret.orderItem.variantName}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span style={{ color: "var(--gray-10)" }}>الكمية</span>
                                        <span style={{ color: "var(--gray-11)" }}>{ret.orderItem.quantity}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span style={{ color: "var(--gray-10)" }}>السعر الوحدوي</span>
                                        <span className="font-semibold" style={{ color: "var(--green-11)" }}>
                                          {Number(ret.orderItem.unitPrice || 0).toFixed(2)} ₪
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Return image */}
                                {(ret.image?.mediumFileUrl || ret.image?.originalFileUrl) && (
                                  <div>
                                    <p className="text-xs font-bold mb-2" style={{ color: "var(--gray-12)" }}>صورة الإرجاع</p>
                                    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--gray-a5)", maxWidth: 200 }}>
                                      <img
                                        src={ret.image.mediumFileUrl || ret.image.originalFileUrl}
                                        alt="صورة الإرجاع"
                                        className="w-full object-cover"
                                        onError={e => { e.currentTarget.style.display = "none"; }}
                                      />
                                    </div>
                                  </div>
                                )}
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
