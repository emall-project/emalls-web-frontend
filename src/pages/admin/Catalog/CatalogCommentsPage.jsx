import { useState, useEffect, useCallback } from "react";
import {
  FiMessageSquare, FiRefreshCw, FiCheck, FiX, FiFlag,
  FiAlertCircle, FiRotateCcw,
} from "react-icons/fi";
import { auth } from "../../../api/auth";

const CATALOG = "/catalog";

async function catalogFetch(path, options = {}) {
  const res = await fetch(`${CATALOG}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message || "خطأ في الطلب");
  }
  return json?.data ?? json ?? null;
}

const STATUSES = [
  { key: "PENDING_MODERATION", label: "في الانتظار",   color: "#d97706" },
  { key: "APPROVED",           label: "مقبولة",        color: "#059669" },
  { key: "REJECTED",           label: "مرفوضة",        color: "#dc2626" },
  { key: "REPORTED",           label: "تم الإبلاغ",   color: "#7c3aed" },
  { key: "FLAGGED",            label: "مُبلَّغ عنها", color: "#b45309" },
];

function StatusBadge({ status }) {
  const s = STATUSES.find(x => x.key === status);
  if (!s) return <span style={{ color: "var(--gray-9)" }}>{status}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.color + "22", color: s.color }}>
      {s.label}
    </span>
  );
}

function ActionBtn({ onClick, loading, title, icon: Icon, color }) {
  return (
    <button onClick={onClick} disabled={loading} title={title}
      className="p-1.5 rounded-lg disabled:opacity-40 transition-colors"
      style={{ background: color + "22", color }}>
      {loading ? "..." : <Icon size={13} />}
    </button>
  );
}

export default function CatalogCommentsPage() {
  const [activeStatus, setActiveStatus] = useState("PENDING_MODERATION");
  const [comments, setComments]         = useState([]);
  const [stats, setStats]               = useState({});
  const [loading, setLoading]           = useState(false);
  const [actingId, setActingId]         = useState(null);
  const [error, setError]               = useState(null);

  const loadStats = async () => {
    try {
      const data = await catalogFetch("/admin/comments/stats");
      setStats(data ?? {});
    } catch (_) {}
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogFetch(`/admin/comments?status=${activeStatus}`);
      const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
      setComments(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (commentId, action) => {
    setActingId(commentId + action);
    setError(null);
    try {
      await catalogFetch(`/admin/comments/${commentId}/${action}`, { method: "PATCH" });
      await Promise.all([load(), loadStats()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div dir="rtl" className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--purple-3)", color: "var(--purple-11)" }}>
            <FiMessageSquare size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>تعليقات المنتجات</h1>
            <p className="text-sm" style={{ color: "var(--gray-10)" }}>مراجعة وإدارة تعليقات العملاء</p>
          </div>
        </div>
        <button onClick={() => { load(); loadStats(); }}
          className="p-2 rounded-xl"
          style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
          <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {STATUSES.map(s => {
          const count = stats[s.key];
          const active = activeStatus === s.key;
          return (
            <button key={s.key}
              onClick={() => setActiveStatus(s.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={{
                background: active ? s.color + "22" : "var(--gray-a3)",
                color:      active ? s.color         : "var(--gray-10)",
                border:     active ? `1.5px solid ${s.color}55` : "1.5px solid transparent",
              }}>
              {s.label}
              {count != null && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? s.color       : "var(--gray-a4)",
                    color:      active ? "#fff"         : "var(--gray-9)",
                  }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--red-3)", color: "var(--red-11)" }}>
          {error}
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: "var(--gray-9)" }}>جاري التحميل...</div>
      ) : comments.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: "var(--gray-9)" }}>لا توجد تعليقات في هذا القسم</div>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => {
            const id = comment.id ?? comment.commentId;
            return (
              <div key={id}
                className="rounded-2xl border p-4"
                style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    {/* User + product */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                        {comment.username ?? comment.userFullName ?? comment.userId ?? "مجهول"}
                      </span>
                      {comment.productName && (
                        <span className="text-xs" style={{ color: "var(--gray-9)" }}>
                          على: {comment.productName}
                        </span>
                      )}
                      <StatusBadge status={comment.status} />
                    </div>
                    {/* Content */}
                    <p className="text-sm leading-relaxed" style={{ color: "var(--gray-12)" }}>
                      {comment.content}
                    </p>
                    {comment.createdAt && (
                      <p className="text-xs mt-2" style={{ color: "var(--gray-9)" }}>
                        {new Date(comment.createdAt).toLocaleDateString("ar-SA")}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeStatus !== "APPROVED" && (
                      <ActionBtn
                        onClick={() => act(id, "approve")}
                        loading={actingId === id + "approve"}
                        title="قبول"
                        icon={FiCheck}
                        color="#059669"
                      />
                    )}
                    {activeStatus !== "REJECTED" && (
                      <ActionBtn
                        onClick={() => act(id, "reject")}
                        loading={actingId === id + "reject"}
                        title="رفض"
                        icon={FiX}
                        color="#dc2626"
                      />
                    )}
                    {activeStatus !== "FLAGGED" && (
                      <ActionBtn
                        onClick={() => act(id, "flag")}
                        loading={actingId === id + "flag"}
                        title="تحديد"
                        icon={FiFlag}
                        color="#b45309"
                      />
                    )}
                    {(activeStatus === "REJECTED" || activeStatus === "FLAGGED") && (
                      <ActionBtn
                        onClick={() => act(id, "remoderate")}
                        loading={actingId === id + "remoderate"}
                        title="إعادة المراجعة"
                        icon={FiRotateCcw}
                        color="#7c3aed"
                      />
                    )}
                  </div>
                </div>

                {comment.reportedReason && (
                  <div className="mt-3 rounded-xl px-3 py-2 text-xs flex items-start gap-2"
                    style={{ background: "var(--orange-3)", color: "var(--orange-11)" }}>
                    <FiAlertCircle size={13} className="mt-0.5 shrink-0" />
                    <span>{comment.reportedReason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
