import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiEdit2, FiLoader, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { accountsApi, normalizePage } from "../../../api/accounts";
import { buildApiFormError, getApiErrorMessage } from "../../../utils/apiErrors";

const inputClass = "w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const inputStyle = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" };

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const id = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(id);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 z-[10000] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-semibold shadow-2xl" style={{
      background: type === "success" ? "var(--green-2)" : "var(--red-2)",
      borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
      color: type === "success" ? "var(--green-11)" : "var(--red-11)",
    }}>
      {message}
    </div>
  );
}

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", name: "" });
  const [fieldErrors, setFieldErrors] = useState({});

  const showToast = (message, type = "success") => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await accountsApi.roles.page({ page, size: 10 });
      const data = normalizePage(response);
      setRoles(data.content);
      setTotalPages(data.totalPages || 1);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحميل الأدوار"));
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditing(null);
    setForm({ code: "", name: "" });
    setFieldErrors({});
  };

  const edit = (role) => {
    setEditing(role);
    setFieldErrors({});
    setForm({ code: role.code || "", name: role.name || "" });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.code.trim()) {
      setFieldErrors({ code: "كود الدور مطلوب" });
      showToast("كود الدور مطلوب", "error");
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const body = { code: form.code.trim(), name: form.name.trim() || null };
      if (editing) {
        await accountsApi.roles.update({ roleId: editing.roleId, ...body });
      } else {
        await accountsApi.roles.create(body);
      }
      showToast(editing ? "تم تعديل الدور" : "تم إنشاء الدور");
      resetForm();
      load();
    } catch (requestError) {
      const formError = buildApiFormError(requestError, { role: "code", code: "code", name: "name" }, "فشل حفظ الدور");
      setFieldErrors(formError.fieldErrors);
      showToast(formError.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (role) => {
    if (!window.confirm(`حذف الدور ${role.name || role.code}؟`)) {
      return;
    }

    try {
      await accountsApi.roles.delete(role.roleId);
      showToast("تم حذف الدور");
      load();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "فشل حذف الدور"), "error");
    }
  };

  return (
    <div dir="rtl" className="space-y-6 p-3 sm:p-6">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة الأدوار</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>إضافة وتعديل أدوار المستخدمين من خدمة الحسابات</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>
          {loading ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
          تحديث
        </button>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_1fr_auto]" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
        <div>
          <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.code} onChange={(event) => { setFieldErrors((previous) => ({ ...previous, code: "" })); setForm((previous) => ({ ...previous, code: event.target.value })); }} placeholder="ROLE_CUSTOMER" />
          {fieldErrors.code ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.code}</p> : null}
        </div>
        <div>
          <input className={inputClass} style={inputStyle} value={form.name} onChange={(event) => { setFieldErrors((previous) => ({ ...previous, name: "" })); setForm((previous) => ({ ...previous, name: event.target.value })); }} placeholder="اسم الدور" />
          {fieldErrors.name ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.name}</p> : null}
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--blue-9)", color: "#fff" }}>
            {saving ? <FiLoader className="animate-spin" /> : editing ? <FiEdit2 /> : <FiPlus />}
            {editing ? "حفظ" : "إضافة"}
          </button>
          {editing ? (
            <button type="button" onClick={resetForm} className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>إلغاء</button>
          ) : null}
        </div>
      </form>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm" style={{ background: "var(--red-a3)", borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
          <FiAlertCircle />
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden overflow-x-auto rounded-2xl border" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
        <table className="w-full text-sm" style={{ minWidth: 620 }}>
          <thead>
            <tr style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
              {["الكود", "الاسم", "المعرف", "الإجراءات"].map((header) => (
                <th key={header} className="px-5 py-3.5 text-right text-xs font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center" style={{ color: "var(--gray-10)" }}>جاري التحميل...</td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center" style={{ color: "var(--gray-10)" }}>لا توجد أدوار</td></tr>
            ) : roles.map((role, index) => (
              <tr key={role.roleId} style={{ borderTop: index ? "1px solid var(--gray-a5)" : "none" }}>
                <td className="px-5 py-4 font-semibold" dir="ltr" style={{ color: "var(--gray-12)" }}>{role.code}</td>
                <td className="px-5 py-4" style={{ color: "var(--gray-11)" }}>{role.name || "-"}</td>
                <td className="px-5 py-4" style={{ color: "var(--gray-11)" }}>#{role.roleId}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => edit(role)} className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>تعديل</button>
                    <button type="button" onClick={() => remove(role)} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: "var(--red-9)", color: "#fff" }}>
                      <FiTrash2 size={13} />
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
