import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiRefreshCw, FiSearch, FiXCircle } from "react-icons/fi";
import { accountsApi, normalizePage } from "../../../api/accounts";

const STATUS_LABELS = {
  PENDING: "معلق",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

const STATUS_COLORS = {
  PENDING: { bg: "var(--blue-a3)", fg: "var(--blue-11)" },
  APPROVED: { bg: "var(--green-a3)", fg: "var(--green-11)" },
  REJECTED: { bg: "var(--red-a3)", fg: "var(--red-11)" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: "var(--gray-a3)", fg: "var(--gray-11)" };
  return (
    <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: s.bg, color: s.fg }}>
      {STATUS_LABELS[status] || status || "-"}
    </span>
  );
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const id = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(id);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl"
      style={{
        background: type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color: type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}
    >
      {message}
      <button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">x</button>
    </div>
  );
}

export default function ShopOwnerRequests() {
  const [activeTab, setActiveTab] = useState("new-owner");
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState({});
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = activeTab === "existing-owner"
        ? await accountsApi.shopOwnerRequests.existingOwnerPage({
            page,
            size: 10,
            ...(search ? { name: search } : {}),
          })
        : await accountsApi.shopOwnerRequests.page({
            page,
            size: 10,
            ...(search ? { username: search } : {}),
          });
      const data = normalizePage(response);
      setRequests(data.content);
      setTotalPages(data.totalPages || 1);
    } catch (requestError) {
      setError(requestError.message || "فشل تحميل الطلبات");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    setPage(0);
  }, [search, activeTab]);

  const decide = async (request, approved) => {
    const reason = approved ? "" : window.prompt("سبب الرفض") || "";
    if (!approved && !reason.trim()) {
      return;
    }

    setRowLoading((previous) => ({ ...previous, [request.id]: true }));
    try {
      if (activeTab === "existing-owner") {
        if (approved) {
          await accountsApi.shopOwnerRequests.approveShopRequest(request.id);
        } else {
          await accountsApi.shopOwnerRequests.rejectShopRequest(request.id, reason.trim());
        }
      } else if (approved) {
        await accountsApi.shopOwnerRequests.approve(request.id);
      } else {
        await accountsApi.shopOwnerRequests.reject(request.id, reason.trim());
      }
      showToast(approved ? "تم قبول الطلب" : "تم رفض الطلب");
      fetchRequests();
    } catch (requestError) {
      showToast(requestError.message || "فشل تحديث الطلب", "error");
    } finally {
      setRowLoading((previous) => ({ ...previous, [request.id]: false }));
    }
  };

  return (
    <div dir="rtl" className="space-y-6 p-3 sm:p-6">
      {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>طلبات المتاجر</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>مراجعة طلبات أصحاب المتاجر وطلبات المتاجر الإضافية</p>
        </div>
        <button
          type="button"
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} size={15} />
          تحديث
        </button>
      </div>

      <div className="rounded-2xl border p-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ["new-owner", "طلبات أصحاب المتاجر الجدد"],
            ["existing-owner", "طلبات متاجر لملاك حاليين"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-85"
              style={{
                background: activeTab === key ? "var(--blue-9)" : "var(--gray-a3)",
                color: activeTab === key ? "#fff" : "var(--gray-12)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative max-w-md">
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2" size={15} style={{ color: "var(--gray-9)" }} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={activeTab === "existing-owner" ? "بحث باسم المتجر..." : "بحث باسم المستخدم..."}
            className="w-full rounded-xl border py-2 pl-3 pr-9 text-sm outline-none"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
          />
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm" style={{ background: "var(--red-a3)", borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
          <FiAlertCircle size={16} />
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden overflow-x-auto rounded-2xl border" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
        <table className="w-full text-sm" style={{ minWidth: 760 }}>
          <thead>
            <tr style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
              {["صاحب الطلب", "المتجر", "المول", "الفئة", "الحالة", "الإجراءات"].map((header) => (
                <th key={header} className="px-5 py-3.5 text-right text-xs font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center" style={{ color: "var(--gray-10)" }}>جاري التحميل...</td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center" style={{ color: "var(--gray-10)" }}>لا توجد طلبات</td>
              </tr>
            ) : (
              requests.map((request, index) => {
                const pending = request.status === "PENDING";
                return (
                  <tr key={request.id} style={{ borderTop: index ? "1px solid var(--gray-a5)" : "none" }}>
                    <td className="px-5 py-4">
                      <div className="font-semibold" style={{ color: "var(--gray-12)" }}>
                        {activeTab === "existing-owner"
                          ? request.shopOwnerUser?.fullName || request.shopOwnerUser?.username || `مستخدم #${request.existingUserId || "-"}`
                          : request.fullName || request.username}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                        {activeTab === "existing-owner"
                          ? request.shopOwnerUser?.email || request.shopOwnerUser?.username || "-"
                          : `@${request.username}`}
                      </div>
                    </td>
                    <td className="px-5 py-4" style={{ color: "var(--gray-12)" }}>
                      {activeTab === "existing-owner" ? request.name || "-" : request.shopRequest?.name || "-"}
                    </td>
                    <td className="px-5 py-4" style={{ color: "var(--gray-11)" }}>
                      {activeTab === "existing-owner"
                        ? request.mall?.name || request.mallId || "-"
                        : request.shopRequest?.mall?.name || request.shopRequest?.mallId || "-"}
                    </td>
                    <td className="px-5 py-4" style={{ color: "var(--gray-11)" }}>
                      {activeTab === "existing-owner" ? request.category || "-" : request.shopRequest?.category || "-"}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={request.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decide(request, true)}
                          disabled={!pending || rowLoading[request.id]}
                          className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition hover:opacity-85 disabled:opacity-40"
                          style={{ background: "var(--green-9)", color: "#fff" }}
                        >
                          <FiCheckCircle size={14} />
                          قبول
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(request, false)}
                          disabled={!pending || rowLoading[request.id]}
                          className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition hover:opacity-85 disabled:opacity-40"
                          style={{ background: "var(--red-9)", color: "#fff" }}
                        >
                          <FiXCircle size={14} />
                          رفض
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page <= 0} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>السابق</button>
          <span className="text-sm" style={{ color: "var(--gray-11)" }}>صفحة {page + 1} من {totalPages}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={page >= totalPages - 1} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>التالي</button>
        </div>
      ) : null}
    </div>
  );
}
