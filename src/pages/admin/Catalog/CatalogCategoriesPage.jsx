import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiLayers, FiRefreshCw, FiSearch, FiChevronLeft,
  FiPlus, FiX, FiAlertCircle, FiUpload,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { useSortedData, SortableTh } from "../../../utils/tableSort";
import { auth } from "../../../api/auth";
import { mediaApi } from "../../../api/mediaApi";

const CATALOG = "/catalog";

async function catalogFetch(path) {
  const res = await fetch(`${CATALOG}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders() },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "خطأ في الطلب");
  return json?.data ?? json ?? null;
}

async function catalogPost(path, body) {
  const res = await fetch(`${CATALOG}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth.getHeaders() },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "خطأ في الطلب");
  return json?.data ?? json ?? null;
}

function normalize(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function useThemeContainer() {
  const [c, setC] = useState(null);
  useEffect(() => { setC(document.querySelector(".radix-themes") || document.body); }, []);
  return c;
}

function MiniSpinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";
const inp = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl", textAlign: "right" };
const labelCls = "block text-xs font-semibold mb-1.5";

/* ── Create Category Dialog ──────────────────────────────────────────────── */
function CreateCategoryDialog({ open, onOpenChange, onCreated, categories }) {
  const container  = useThemeContainer();
  const [name,         setName]         = useState("");
  const [description,  setDescription]  = useState("");
  const [parentId,     setParentId]     = useState("");
  const [isActive,     setIsActive]     = useState(true);
  const [imageUuid,    setImageUuid]    = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading,    setUploading]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setName(""); setDescription(""); setParentId(""); setIsActive(true);
      setImageUuid(""); setImagePreview(""); setError("");
    }
  }, [open]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    setUploading(true); setError("");
    try {
      const res = await mediaApi.upload(file);
      setImageUuid(res.data.id);
      setImagePreview(res.data.originalFileUrl || res.data.mediumFileUrl || "");
    } catch (err) { setError(err.message || "فشل رفع الصورة"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError("اسم الفئة مطلوب");
    setError(""); setLoading(true);
    try {
      await catalogPost("/categories", {
        name: name.trim(),
        description: description.trim() || null,
        isActive,
        ...(parentId ? { parentId: Number(parentId) } : {}),
        ...(imageUuid ? { imageUuid } : {}),
      });
      onCreated?.();
      onOpenChange(false);
    } catch (e) { setError(e.message || "فشل إنشاء الفئة"); }
    finally { setLoading(false); }
  };

  const topLevelCats = categories.filter(c => !c.parentId);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-10000 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed z-10001 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-md rounded-2xl flex flex-col outline-none"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 24px 64px rgba(0,0,0,.45)", maxHeight: "90vh", overflow: "hidden" }}
          aria-describedby={undefined}>

          <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--gray-a5)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--green-a3)", color: "var(--green-11)" }}>
                <FiLayers size={15} />
              </div>
              <Dialog.Title className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>إضافة فئة جديدة</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-70 transition" style={{ color: "var(--gray-11)", background: "var(--gray-a3)" }}>
                <FiX size={14} />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: "var(--red-a3)", border: "1px solid var(--red-a6)", color: "var(--red-11)" }}>
                <FiAlertCircle size={13} /> {error}
              </div>
            )}

            <div className="flex gap-4 items-start">
              <div className="flex flex-col items-center gap-1">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  className="w-16 h-16 rounded-xl flex items-center justify-center cursor-pointer transition hover:opacity-80 overflow-hidden"
                  style={{ background: imagePreview ? "transparent" : "var(--green-a3)", border: `2px dashed ${imagePreview ? "var(--gray-a5)" : "var(--green-a7)"}` }}>
                  {uploading ? <MiniSpinner /> : imagePreview
                    ? <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                    : <FiUpload size={16} style={{ color: "var(--green-9)" }} />}
                </div>
                {imagePreview && !uploading && (
                  <button type="button" onClick={() => { setImageUuid(""); setImagePreview(""); }}
                    className="text-[10px] hover:opacity-70" style={{ color: "var(--red-11)" }}>حذف</button>
                )}
              </div>
              <div className="flex-1">
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                  الاسم <span style={{ color: "var(--red-9)" }}>*</span>
                </label>
                <input className={inputCls} style={inp} value={name}
                  onChange={e => setName(e.target.value)} placeholder="مثال: إلكترونيات" />
              </div>
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>الفئة الأم (اختياري)</label>
              <select
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                className={inputCls}
                style={{ ...inp, appearance: "none" }}>
                <option value="">— بدون فئة أم (فئة رئيسية) —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>الوصف</label>
              <textarea className={inputCls} style={{ ...inp, minHeight: 68, resize: "none" }}
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="وصف مختصر عن الفئة..." />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: "var(--blue-9)" }} />
              <span className="text-sm" style={{ color: "var(--gray-11)" }}>الفئة نشطة</span>
            </label>
          </div>

          <div className="px-5 py-3 flex gap-2 border-t shrink-0" style={{ borderColor: "var(--gray-a5)" }}>
            <button onClick={handleSubmit} disabled={loading || uploading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--green-9)", color: "#fff" }}>
              {loading ? <MiniSpinner /> : <FiPlus size={13} />} إنشاء الفئة
            </button>
            <Dialog.Close asChild>
              <button className="px-4 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-80"
                style={{ border: "1px solid var(--gray-a6)", color: "var(--gray-12)" }}>إلغاء</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function CatalogCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [q,          setQ]          = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogFetch("/categories/all");
      setCategories(normalize(data));
    } catch (e) {
      setError(e.message || "تعذر تحميل الفئات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = categories.filter(c =>
    !q || c.name?.toLowerCase().includes(q.toLowerCase()) || String(c.id).includes(q)
  );

  const { sorted, sortKey, sortDir, onSort } = useSortedData(filtered, "name");

  const parentMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

  return (
    <div dir="rtl" className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link to="/admin/catalog"
          className="p-2 rounded-xl transition-colors"
          style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
          <FiChevronLeft size={16} />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: "var(--green-3)", color: "var(--green-11)" }}>
          <FiLayers size={18} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>الفئات</h1>
          <p className="text-sm" style={{ color: "var(--gray-10)" }}>
            إدارة فئات المنتجات والشجرة الهرمية
          </p>
        </div>
        <div className="mr-auto flex items-center gap-2">
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
            style={{ background: "var(--green-9)", color: "#fff" }}>
            <FiPlus size={14} /> إضافة فئة
          </button>
          <button onClick={load} disabled={loading}
            className="p-2 rounded-xl transition-colors"
            style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
            <FiRefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--red-3)", color: "var(--red-11)" }}>
          {error}
        </div>
      )}

      {/* Search + count */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--gray-9)" }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="بحث في الفئات..."
            className="h-9 w-full rounded-xl border pr-9 pl-3 text-sm outline-none"
            style={{
              background: "var(--gray-1)", borderColor: "var(--gray-a5)",
              color: "var(--gray-12)",
            }}
          />
        </div>
        <span className="text-sm" style={{ color: "var(--gray-9)" }}>
          {filtered.length} فئة
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)" }}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead style={{ background: "var(--gray-a2)", color: "var(--gray-9)" }}>
              <tr>
                <SortableTh label="#" sortKey="id" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
                <th className="px-4 py-3 text-xs font-semibold">الصورة</th>
                <SortableTh label="الاسم" sortKey="name" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
                <SortableTh label="الفئة الأم" sortKey="parentId" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
                <SortableTh label="المستوى" sortKey="level" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
                <SortableTh label="الحالة" sortKey="isActive" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-xs font-semibold" />
              </tr>
            </thead>
            <tbody>
              {loading && sorted.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--gray-a4)" }}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded-full"
                          style={{ background: "var(--gray-a3)" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm"
                    style={{ color: "var(--gray-9)" }}>
                    {q ? "لا توجد نتائج مطابقة" : "لا توجد فئات"}
                  </td>
                </tr>
              ) : (
                sorted.map(cat => (
                  <tr key={cat.id} style={{ borderTop: "1px solid var(--gray-a4)" }}>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--gray-9)" }}>
                      #{cat.id}
                    </td>
                    <td className="px-4 py-3">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name}
                          className="h-9 w-9 rounded-xl object-cover"
                          style={{ border: "1px solid var(--gray-a4)" }} />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold"
                          style={{ background: "var(--gray-a3)", color: "var(--gray-9)" }}>
                          {cat.name?.[0] || "—"}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--gray-12)" }}>
                      {cat.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--gray-10)" }}>
                      {cat.parentId ? (parentMap[cat.parentId] || `#${cat.parentId}`) : (
                        <span style={{ color: "var(--gray-7)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {cat.level != null ? (
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                          مستوى {cat.level}
                        </span>
                      ) : <span style={{ color: "var(--gray-7)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {cat.isActive !== undefined ? (
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={cat.isActive
                            ? { background: "var(--green-a3)", color: "var(--green-11)" }
                            : { background: "var(--gray-a3)",  color: "var(--gray-10)"  }}>
                          {cat.isActive ? "نشطة" : "غير نشطة"}
                        </span>
                      ) : <span style={{ color: "var(--gray-7)" }}>—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={load}
        categories={categories}
      />
    </div>
  );
}
