import { useState, useEffect, useCallback } from "react";
import {
  FiPlus, FiEdit2, FiCheck, FiX, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiMapPin,
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

const EMPTY_FORM = { name: "", baseFee: "", isActive: true };

export default function CityManagement() {
  const [cities, setCities]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError]         = useState(null);

  const { sorted: sortedCities, sortKey, sortDir, onSort } = useSortedData(cities, "name");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiFetch(`/api/cities?page=${page}&size=10`);
      const pg   = normalizePage(json);
      setCities(pg.content);
      setTotalPages(pg.totalPages);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (c) => {
    setForm({ name: c.name ?? "", baseFee: c.baseFee ?? "", isActive: c.isActive ?? true });
    setEditId(c.id ?? c.cityId);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { name: form.name.trim(), baseFee: Number(form.baseFee), isActive: form.isActive };
      if (editId) {
        await apiFetch("/api/cities", { method: "PUT", body: JSON.stringify({ ...body, cityId: editId }) });
      } else {
        await apiFetch("/api/cities", { method: "POST", body: JSON.stringify(body) });
      }
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (city) => {
    const id = city.id ?? city.cityId;
    setTogglingId(id);
    setError(null);
    try {
      const action = (city.isActive ?? city.active) ? "deactivate" : "activate";
      await apiFetch(`/api/cities/${action}/${id}`, { method: "PUT" });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div dir="rtl" className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--purple-3)", color: "var(--purple-11)" }}>
            <FiMapPin size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة المدن</h1>
            <p className="text-sm" style={{ color: "var(--gray-10)" }}>إضافة وتعديل المدن ورسوم التوصيل</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-2 rounded-xl transition-colors"
            style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "var(--purple-9)" }}>
            <FiPlus size={15} /> إضافة مدينة
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
            {editId ? "تعديل مدينة" : "إضافة مدينة جديدة"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--gray-11)" }}>الاسم</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--gray-a6)", background: "var(--gray-2)", color: "var(--gray-12)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--gray-11)" }}>رسوم الأساس (₪)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.baseFee}
                onChange={e => setForm(f => ({ ...f, baseFee: e.target.value }))}
                required
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--gray-a6)", background: "var(--gray-2)", color: "var(--gray-12)" }}
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <input type="checkbox" id="city-active" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded" />
              <label htmlFor="city-active" className="text-sm select-none" style={{ color: "var(--gray-11)" }}>نشطة</label>
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

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--gray-a5)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--gray-a2)" }}>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }}>#</th>
              <SortableTh label="الاسم" sortKey="name" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }} />
              <SortableTh label="رسوم الأساس" sortKey="baseFee" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }} />
              <SortableTh label="الحالة" sortKey="isActive" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }} />
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-14 text-center text-sm" style={{ color: "var(--gray-9)" }}>جاري التحميل...</td></tr>
            ) : sortedCities.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-14 text-center text-sm" style={{ color: "var(--gray-9)" }}>لا توجد مدن</td></tr>
            ) : sortedCities.map((city, i) => {
              const id     = city.id ?? city.cityId;
              const active = city.isActive ?? city.active;
              return (
                <tr key={id} className="border-t transition-colors"
                  style={{ borderColor: "var(--gray-a4)" }}>
                  <td className="px-4 py-3" style={{ color: "var(--gray-9)" }}>{page * 10 + i + 1}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--gray-12)" }}>{city.name}</td>
                  <td className="px-4 py-3" style={{ color: "var(--gray-11)" }}>
                    {city.baseFee != null ? `${city.baseFee} ₪` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        background: active ? "var(--green-3)" : "var(--gray-3)",
                        color:      active ? "var(--green-11)" : "var(--gray-10)",
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full"
                        style={{ background: active ? "var(--green-9)" : "var(--gray-7)" }} />
                      {active ? "نشطة" : "غير نشطة"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(city)} title="تعديل"
                        className="p-1.5 rounded-lg"
                        style={{ background: "var(--blue-3)", color: "var(--blue-11)" }}>
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        onClick={() => toggleActive(city)}
                        disabled={togglingId === id}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium disabled:opacity-50"
                        style={{
                          background: active ? "var(--red-3)"   : "var(--green-3)",
                          color:      active ? "var(--red-11)"  : "var(--green-11)",
                        }}>
                        {togglingId === id ? "..." : active ? "تعطيل" : "تفعيل"}
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
