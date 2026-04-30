import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiFlag, FiLoader, FiRefreshCw, FiRotateCcw, FiX } from "react-icons/fi";
import { catalogApi, unwrapCatalogPayload } from "../../../api/catalog";

const STATUSES = [
  { value: "PENDING_MODERATION", label: "بانتظار المراجعة" },
  { value: "APPROVED", label: "مقبولة" },
  { value: "REJECTED", label: "مرفوضة" },
  { value: "REPORTED", label: "مبلغ عنها" },
  { value: "FLAGGED", label: "معلّمة" },
];

const actionStyle = {
  borderColor: "var(--gray-a6)",
  color: "var(--gray-12)",
};

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function CatalogCommentsPage() {
  const [status, setStatus] = useState("PENDING_MODERATION");
  const [productIdFilter, setProductIdFilter] = useState("");
  const [stats, setStats] = useState({});
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsResponse, commentsResponse] = await Promise.all([
        catalogApi.comments.adminStats(),
        productIdFilter
          ? catalogApi.comments.adminByProduct(productIdFilter)
          : catalogApi.comments.adminByStatus(status),
      ]);
      setStats(unwrapCatalogPayload(statsResponse) || {});
      setComments(unwrapCatalogPayload(commentsResponse) || []);
    } catch (requestError) {
      setError(requestError.message || "فشل تحميل التعليقات");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [productIdFilter, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runAction = async (commentId, action) => {
    setActionLoading(`${action}-${commentId}`);
    setError("");
    try {
      await catalogApi.comments[action](commentId);
      fetchData();
    } catch (requestError) {
      setError(requestError.message || "فشل تنفيذ الإجراء");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>تعليقات المنتجات</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
            مراجعة تعليقات العملاء والموافقة عليها أو رفضها.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"
          style={actionStyle}
        >
          <FiRefreshCw />
          تحديث
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STATUSES.map((item) => (
          <button
            type="button"
            key={item.value}
            onClick={() => setStatus(item.value)}
            className="rounded-2xl border p-4 text-right transition"
            style={{
              background: status === item.value ? "var(--blue-a3)" : "var(--gray-1)",
              borderColor: status === item.value ? "var(--blue-a7)" : "var(--gray-a6)",
              color: "var(--gray-12)",
            }}
          >
            <div className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>{item.label}</div>
            <div className="mt-2 text-2xl font-bold">{stats[item.value] ?? 0}</div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border p-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="min-w-[220px] flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
            value={productIdFilter}
            onChange={(event) => setProductIdFilter(event.target.value.replace(/\D/g, ""))}
            placeholder="فلترة حسب رقم المنتج"
            inputMode="numeric"
          />
          {productIdFilter ? (
            <button
              type="button"
              onClick={() => setProductIdFilter("")}
              className="rounded-xl border px-4 py-2 text-sm"
              style={actionStyle}
            >
              مسح فلتر المنتج
            </button>
          ) : null}
          <span className="text-xs" style={{ color: "var(--gray-10)" }}>
            الرفض يستخدم سلوك الخلفية الحالي ولا يدعم سبب رفض مخصص من الواجهة.
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--red-a3)", borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 820 }}>
            <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
              <tr>
                <Th>التعليق</Th>
                <Th>المنتج</Th>
                <Th>المستخدم</Th>
                <Th>التاريخ</Th>
                <Th>الإجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center" style={{ color: "var(--gray-10)" }}>
                    <FiLoader className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : comments.length ? (
                comments.map((comment) => (
                  <tr key={comment.commentId} className="border-t" style={{ borderColor: "var(--gray-a5)", color: "var(--gray-12)" }}>
                    <Td>
                      <div className="max-w-md whitespace-pre-wrap">{comment.content}</div>
                      {comment.rejectionReason ? (
                        <div className="mt-2 text-xs" style={{ color: "var(--red-10)" }}>{comment.rejectionReason}</div>
                      ) : null}
                    </Td>
                    <Td>
                      <div>{comment.productName || comment.productId || "—"}</div>
                      {comment.productSlug ? <div className="text-xs" dir="ltr" style={{ color: "var(--gray-10)" }}>{comment.productSlug}</div> : null}
                    </Td>
                    <Td>{comment.userFullName || comment.username || comment.userId || "—"}</Td>
                    <Td>{formatDate(comment.createdAt)}</Td>
                    <Td>
                      <div className="flex flex-wrap items-center gap-2">
                        <ActionButton icon={<FiCheck />} text="قبول" loading={actionLoading === `approve-${comment.commentId}`} onClick={() => runAction(comment.commentId, "approve")} />
                        <ActionButton icon={<FiX />} text="رفض بدون سبب مخصص" loading={actionLoading === `reject-${comment.commentId}`} onClick={() => runAction(comment.commentId, "reject")} />
                        <ActionButton icon={<FiFlag />} text="تعليم" loading={actionLoading === `flag-${comment.commentId}`} onClick={() => runAction(comment.commentId, "flag")} />
                        <ActionButton icon={<FiRotateCcw />} text="إعادة" loading={actionLoading === `remoderate-${comment.commentId}`} onClick={() => runAction(comment.commentId, "remoderate")} />
                      </div>
                    </Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-14 text-center" style={{ color: "var(--gray-10)" }}>
                    لا توجد تعليقات في هذه الحالة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, text, loading, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs disabled:opacity-50"
      style={actionStyle}
    >
      {loading ? <FiLoader className="animate-spin" /> : icon}
      {text}
    </button>
  );
}

function Th({ children }) {
  return <th className="px-5 py-3 text-right text-xs font-semibold">{children}</th>;
}

function Td({ children }) {
  return <td className="px-5 py-4 align-top">{children}</td>;
}
