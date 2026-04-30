import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiEdit2, FiLoader, FiPlus, FiRefreshCw } from "react-icons/fi";
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

export default function CityManagement() {
  const [cities, setCities] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", baseFee: "0", isActive: true });
  const [fieldErrors, setFieldErrors] = useState({});

  const showToast = (message, type = "success") => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await accountsApi.cities.page({ page, size: 10 });
      const data = normalizePage(response);
      setCities(data.content);
      setTotalPages(data.totalPages || 1);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحميل المدن"));
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", baseFee: "0", isActive: true });
    setFieldErrors({});
  };

  const edit = (city) => {
    setEditing(city);
    setFieldErrors({});
    setForm({
      name: city.name || "",
      baseFee: city.baseFee ?? "0",
      isActive: city.isActive !== false,
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFieldErrors({ name: "اسم المدينة مطلوب" });
      showToast("اسم المدينة مطلوب", "error");
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const body = {
        name: form.name.trim(),
        baseFee: Number(form.baseFee || 0),
        isActive: form.isActive,
      };

      if (editing) {
        await accountsApi.cities.update({ cityId: editing.cityId, ...body });
      } else {
        await accountsApi.cities.create(body);
      }

      showToast(editing ? "تم تعديل المدينة" : "تم إنشاء المدينة");
      resetForm();
      load();
    } catch (requestError) {
      const formError = buildApiFormError(requestError, { name: "name", baseFee: "baseFee" }, "فشل حفظ المدينة");
      setFieldErrors(formError.fieldErrors);
      showToast(formError.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (city) => {
    try {
      if (city.isActive === false) {
        await accountsApi.cities.activate(city.cityId);
      } else {
        await accountsApi.cities.deactivate(city.cityId);
      }
      showToast("تم تحديث حالة المدينة");
      load();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "فشل تحديث الحالة"), "error");
    }
  };

  return (
    <div dir="rtl" className="space-y-6 p-3 sm:p-6">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة المدن</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>إضافة وتعديل المدن ورسومها الأساسية</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ borderColor: "var(--gray-a7)", color: "var(--gray-12)" }}>
          {loading ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
          تحديث
        </button>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_160px_140px_auto]" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
        <div>
          <input className={inputClass} style={inputStyle} value={form.name} onChange={(event) => { setFieldErrors((previous) => ({ ...previous, name: "" })); setForm((previous) => ({ ...previous, name: event.target.value })); }} placeholder="اسم المدينة" />
          {fieldErrors.name ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.name}</p> : null}
        </div>
        <div>
          <input type="number" min="0" step="0.01" className={inputClass} style={inputStyle} value={form.baseFee} onChange={(event) => { setFieldErrors((previous) => ({ ...previous, baseFee: "" })); setForm((previous) => ({ ...previous, baseFee: event.target.value })); }} placeholder="الرسوم" />
          {fieldErrors.baseFee ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.baseFee}</p> : null}
        </div>
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--gray-11)" }}>
          <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((previous) => ({ ...previous, isActive: event.target.checked }))} />
          نشطة
        </label>
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
              {["المدينة", "الرسوم الأساسية", "الحالة", "الإجراءات"].map((header) => (
                <th key={header} className="px-5 py-3.5 text-right text-xs font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center" style={{ color: "var(--gray-10)" }}>جاري التحميل...</td></tr>
            ) : cities.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center" style={{ color: "var(--gray-10)" }}>لا توجد مدن</td></tr>
            ) : cities.map((city, index) => (
              <tr key={city.cityId} style={{ borderTop: index ? "1px solid var(--gray-a5)" : "none" }}>
                <td className="px-5 py-4 font-semibold" style={{ color: "var(--gray-12)" }}>{city.name}</td>
                <td className="px-5 py-4" style={{ color: "var(--gray-11)" }}>{city.baseFee ?? 0}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: city.isActive === false ? "var(--red-a3)" : "var(--green-a3)", color: city.isActive === false ? "var(--red-11)" : "var(--green-11)" }}>
                    {city.isActive === false ? "غير نشطة" : "نشطة"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => edit(city)} className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>تعديل</button>
                    <button type="button" onClick={() => toggleActive(city)} className="rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: city.isActive === false ? "var(--green-9)" : "var(--red-9)", color: "#fff" }}>
                      {city.isActive === false ? "تفعيل" : "تعطيل"}
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
