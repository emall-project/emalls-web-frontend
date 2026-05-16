import { useState, useEffect, useCallback } from "react";
import {
  FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiShield,
} from "react-icons/fi";
import { auth } from "../../../api/auth";
import { useSortedData, SortableTh } from "../../../utils/tableSort";

const ACCOUNTS = "/accounts";

function getErrMsg(json) {
  const first = Array.isArray(json?.errorCodes) ? json.errorCodes[0] : null;
  if (typeof first === "string") return first;
  if (first?.message) return first.message;
  return json?.message || "خطأ في الطلب";
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${ACCOUNTS}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(getErrMsg(json));
  return json;
}

function normalizePage(payload) {
  const data = payload?.data ?? payload ?? {};
  const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
  const meta = data?.meta || {};
  return {
    content,
    totalPages: meta.totalPages ?? data.totalPages ?? 1,
  };
}

const EMPTY_FORM = { code: "", name: "" };

export default function RoleManagement() {
  const [roles, setRoles]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [editId, setEditId]         = useState(null);
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError]           = useState(null);

  const { sorted: sortedRoles, sortKey, sortDir, onSort } = useSortedData(roles, "name");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiFetch(`/api/roles?page=${page}&size=10`);
      const pg   = normalizePage(json);
      setRoles(pg.content);
      setTotalPages(pg.totalPages);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (r) => {
    setForm({ code: r.code ?? "", name: r.name ?? "" });
    setEditId(r.id ?? r.roleId);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { code: form.code.trim(), name: form.name.trim() };
      if (editId) {
        await apiFetch("/api/roles", { method: "PUT", body: JSON.stringify({ ...body, roleId: editId }) });
      } else {
        await apiFetch("/api/roles", { method: "POST", body: JSON.stringify(body) });
      }
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError(null);
    try {
      await apiFetch(`/api/roles/${id}`, { method: "DELETE" });
      setConfirmDeleteId(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div dir="rtl" className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--purple-3)", color: "var(--purple-11)" }}>
            <FiShield size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة الأدوار</h1>
            <p className="text-sm" style={{ color: "var(--gray-10)" }}>إضافة وتعديل أدوار المستخدمين</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-2 rounded-xl"
            style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "var(--purple-9)" }}>
            <FiPlus size={15} /> إضافة دور
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--red-3)", color: "var(--red-11)" }}>
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave}
          className="mb-6 rounded-2xl border p-5 space-y-4"
          style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
            {editId ? "تعديل دور" : "إضافة دور جديد"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--gray-11)" }}>
                الكود <span className="text-[10px]" style={{ color: "var(--gray-9)" }}>(LTR)</span>
              </label>
              <input
                dir="ltr"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                required
                placeholder="e.g. ROLE_MANAGER"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none font-mono"
                style={{ borderColor: "var(--gray-a6)", background: "var(--gray-2)", color: "var(--gray-12)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--gray-11)" }}>الاسم</label>
              <input
                dir="rtl"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--gray-a6)", background: "var(--gray-2)", color: "var(--gray-12)" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "var(--purple-9)" }}>
              <FiCheck size={14} /> {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
              <FiX size={14} /> إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div className="mb-4 rounded-2xl border p-4 flex items-center justify-between"
          style={{ background: "var(--red-2)", borderColor: "var(--red-6)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--red-11)" }}>
            هل أنت متأكد من حذف هذا الدور؟ لا يمكن التراجع.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDelete(confirmDeleteId)}
              disabled={deletingId === confirmDeleteId}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "var(--red-9)" }}>
              {deletingId === confirmDeleteId ? "جاري الحذف..." : "حذف"}
            </button>
            <button onClick={() => setConfirmDeleteId(null)}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--gray-a5)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--gray-a2)" }}>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }}>#</th>
              <SortableTh label="الكود" sortKey="code" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }} />
              <SortableTh label="الاسم" sortKey="name" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }} />
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-14 text-center text-sm" style={{ color: "var(--gray-9)" }}>جاري التحميل...</td></tr>
            ) : sortedRoles.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-14 text-center text-sm" style={{ color: "var(--gray-9)" }}>لا توجد أدوار</td></tr>
            ) : sortedRoles.map((role, i) => {
              const id = role.id ?? role.roleId;
              return (
                <tr key={id} className="border-t"
                  style={{ borderColor: "var(--gray-a4)" }}>
                  <td className="px-4 py-3" style={{ color: "var(--gray-9)" }}>{page * 10 + i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs" dir="ltr"
                    style={{ color: "var(--purple-11)" }}>
                    <span className="rounded-md px-2 py-0.5"
                      style={{ background: "var(--purple-3)" }}>
                      {role.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--gray-12)" }}>{role.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(role)} title="تعديل"
                        className="p-1.5 rounded-lg"
                        style={{ background: "var(--blue-3)", color: "var(--blue-11)" }}>
                        <FiEdit2 size={13} />
                      </button>
                      <button onClick={() => setConfirmDeleteId(id)} title="حذف"
                        className="p-1.5 rounded-lg"
                        style={{ background: "var(--red-3)", color: "var(--red-11)" }}>
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="p-2 rounded-xl disabled:opacity-40"
            style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
            <FiChevronRight size={15} />
          </button>
          <span className="text-sm" style={{ color: "var(--gray-11)" }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="p-2 rounded-xl disabled:opacity-40"
            style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
            <FiChevronLeft size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
