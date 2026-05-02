import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiChevronLeft, FiChevronRight, FiLoader, FiRefreshCw, FiRotateCcw, FiXCircle } from "react-icons/fi";
import { useAuth } from "../../../auth/AuthContext";
import { normalizeOrderHubPage, orderHubApi, unwrapOrderHubPayload } from "../../../api/orderHub";
import { getMediaPreviewUrl } from "../../../api/mediaManager";
import { formatDateTime, formatOrderHubStatus } from "../../../utils/orderHubUi";
import { getApiErrorMessage } from "../../../utils/apiErrors";

const RETURN_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

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

export default function ShopOwnerReturns() {
  const { selectedStoreId } = useAuth();
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState({});
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
      const [returnsResponse, statsResponse] = await Promise.all([
        status
          ? orderHubApi.returns.shopByStatus(selectedStoreId, status, { page, size: 10 })
          : orderHubApi.returns.shopPage(selectedStoreId, { page, size: 10 }),
        orderHubApi.returns.shopStats(selectedStoreId).catch(() => null),
      ]);
      const normalized = normalizeOrderHubPage(returnsResponse);
      setReturns(normalized.content);
      setPageInfo(normalized);
      setStats(unwrapOrderHubPayload(statsResponse) || {});
    } catch (requestError) {
      setReturns([]);
      setError(getApiErrorMessage(requestError, "فشل تحميل الإرجاعات"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedStoreId, status, page]);

  const openReturn = async (item) => {
    setSelected(item);
    try {
      const response = await orderHubApi.returns.shopById(selectedStoreId, item.returnRequestId);
      setSelected(unwrapOrderHubPayload(response));
    } catch {
      // Keep list payload visible.
    }
  };

  const approve = async (item) => {
    setActionLoading(`approve-${item.returnRequestId}`);
    setError("");
    try {
      await orderHubApi.returns.approveShop(selectedStoreId, item.returnRequestId);
      await load();
      setSelected(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل قبول طلب الإرجاع"));
    } finally {
      setActionLoading("");
    }
  };

  const reject = async (item) => {
    const rejectionReason = window.prompt("سبب رفض طلب الإرجاع", "لا تنطبق شروط الإرجاع");
    if (!rejectionReason) return;
    setActionLoading(`reject-${item.returnRequestId}`);
    setError("");
    try {
      await orderHubApi.returns.rejectShop(selectedStoreId, item.returnRequestId, rejectionReason);
      await load();
      setSelected(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل رفض طلب الإرجاع"));
    } finally {
      setActionLoading("");
    }
  };

  if (!selectedStoreId) {
    return (
      <div dir="rtl" className="p-6">
        <div className="rounded-2xl border p-6 text-sm" style={{ background: "var(--amber-a2)", borderColor: "var(--amber-a6)", color: "var(--amber-11)" }}>
          اختر متجرًا من الشريط العلوي قبل إدارة الإرجاعات.
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إرجاعات المتجر</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>مراجعة وقبول أو رفض طلبات الإرجاع</p>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={FiRotateCcw} label="معلقة" value={stats.PENDING} />
        <StatCard icon={FiCheckCircle} label="مقبولة" value={stats.APPROVED} tone="green" />
        <StatCard icon={FiXCircle} label="مرفوضة" value={stats.REJECTED} tone="red" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { setStatus(""); setPage(0); }} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: !status ? "var(--blue-a3)" : "var(--gray-a2)", color: !status ? "var(--blue-11)" : "var(--gray-12)" }}>كل الحالات</button>
        {RETURN_STATUSES.map((item) => (
          <button key={item} type="button" onClick={() => { setStatus(item); setPage(0); }} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: status === item ? "var(--blue-a3)" : "var(--gray-a2)", color: status === item ? "var(--blue-11)" : "var(--gray-12)" }}>
            {formatOrderHubStatus(item)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm" style={{ color: "var(--gray-10)" }}>
          <FiLoader className="mx-auto mb-3 animate-spin" />
          جاري تحميل الإرجاعات...
        </div>
      ) : null}

      {!loading && !returns.length ? (
        <div className="rounded-2xl border px-5 py-12 text-center text-sm" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)", color: "var(--gray-10)" }}>لا توجد طلبات إرجاع</div>
      ) : null}

      <div className="space-y-4">
        {returns.map((item) => {
          const image = getMediaPreviewUrl(item.image, "small");
          return (
            <div key={item.returnRequestId} className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <button type="button" onClick={() => openReturn(item)} className="flex flex-1 gap-4 text-right">
                  {image ? <img src={image} alt="" className="h-20 w-20 rounded-2xl object-cover" /> : null}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>{item.reason || `إرجاع #${item.returnRequestId}`}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-2 text-sm" style={{ color: "var(--gray-10)" }}>{item.orderItem?.productName || `عنصر #${item.orderItemId}`} • {formatDateTime(item.createdAt)}</p>
                    {item.rejectionReason ? <p className="mt-1 text-xs" style={{ color: "var(--red-11)" }}>{item.rejectionReason}</p> : null}
                  </div>
                </button>
                {item.status === "PENDING" ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => approve(item)} disabled={!!actionLoading} className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--green-9)", color: "white" }}>قبول</button>
                    <button type="button" onClick={() => reject(item)} disabled={!!actionLoading} className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--red-9)", color: "white" }}>رفض</button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <Pager page={page} totalPages={pageInfo.totalPages} onChange={setPage} />

      {selected ? (
        <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>تفاصيل الإرجاع #{selected.returnRequestId}</h2>
            <button type="button" onClick={() => setSelected(null)} className="rounded-xl border px-3 py-2 text-xs" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>إغلاق</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Mini label="الحالة" value={formatOrderHubStatus(selected.status)} />
            <Mini label="الطلب" value={selected.shopOrderId} />
            <Mini label="العنصر" value={selected.orderItem?.productName || selected.orderItemId} />
            <Mini label="التاريخ" value={formatDateTime(selected.createdAt)} />
          </div>
          <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>
            <div className="font-semibold" style={{ color: "var(--gray-12)" }}>{selected.reason}</div>
            <p className="mt-2">{selected.description || "لا يوجد وصف إضافي"}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
