import { useState, useEffect, useCallback, useRef } from "react";
import { useSortedData, SortableTh } from "../../../utils/tableSort";
import { useNavigate } from "react-router-dom";
import {
  FiPlus, FiRefreshCw, FiEye, FiEdit2, FiTrash2,
  FiChevronRight, FiChevronLeft, FiPackage, FiMoreVertical,
} from "react-icons/fi";
import { productsApi } from "./api";
import { STATUS_COLORS } from "./constants";
import { ProductFilters } from "./ProductFilters";

// ── Tiny helpers ────────────────────────────────────────────────────────────
function Spinner({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" style={{ animation: "spin 0.75s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none" dir="rtl">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto"
          style={{
            background: t.type === "error" ? "var(--red-9)" : t.type === "success" ? "var(--green-9)" : "var(--gray-12)",
            color: "#fff",
            maxWidth: 340,
          }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

function StatusBadge({ active }) {
  const s = STATUS_COLORS[active] || STATUS_COLORS[false];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {active ? "نشط" : "غير نشط"}
    </span>
  );
}

function DeleteConfirmDialog({ product, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onCancel} />
      <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--red-a3)", color: "var(--red-11)" }}>
            <FiTrash2 size={18} />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: "var(--gray-12)" }}>حذف المنتج</h3>
            <p className="text-sm" style={{ color: "var(--gray-10)" }}>هذا الإجراء لا يمكن التراجع عنه</p>
          </div>
        </div>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--gray-11)" }}>
          هل أنت متأكد من حذف المنتج <strong style={{ color: "var(--gray-12)" }}>"{product?.name}"</strong>؟
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity"
            style={{ background: "var(--red-9)", color: "#fff", opacity: loading ? 0.7 : 1 }}>
            {loading ? <Spinner size={14} /> : <FiTrash2 size={14} />}
            حذف
          </button>
          <button onClick={onCancel} disabled={loading}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold border"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Actions menu ─────────────────────────────────────────────────────────────
function ActionsMenu({ product, onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
        style={{ color: "var(--gray-9)", background: "transparent" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--gray-a3)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-30 rounded-xl shadow-xl py-1.5 min-w-[140px]"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }} dir="rtl">
          {[
            { icon: FiEye,   label: "عرض",   action: onView,   color: "var(--gray-11)" },
            { icon: FiEdit2, label: "تعديل", action: onEdit,   color: "var(--blue-11)" },
            { icon: FiTrash2, label: "حذف",  action: onDelete, color: "var(--red-11)"  },
          ].map(({ icon: Icon, label, action, color }) => (
            <button key={label} onClick={() => { setOpen(false); action(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color, background: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--gray-a3)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


// ── Product row ───────────────────────────────────────────────────────────────
function ProductRow({ product, onView, onEdit, onDelete }) {
  const imgUrl = product.imageUrl || product.thumbnailUrl || product.mainImageUrl
    || product.medium?.smallFileUrl
    || (product.images?.[0]?.url) || null;

  const basePrice  = product.variants?.[0]?.basePrice ?? product.basePrice ?? null;
  const varCount   = product.variantCount ?? product.variants?.length ?? 0;

  return (
    <tr className="border-b transition-colors"
      style={{ borderColor: "var(--gray-a4)" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--gray-a2)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

      {/* Image + name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: "var(--gray-a3)" }}>
            {imgUrl
              ? <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
              : <FiPackage size={16} style={{ color: "var(--gray-8)" }} />
            }
          </div>
          <div className="min-w-0">
            <button onClick={onView} className="text-sm font-semibold text-right hover:underline truncate block max-w-[200px]"
              style={{ color: "var(--gray-12)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {product.name}
            </button>
            {product.slug && (
              <p className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: "var(--gray-9)" }} dir="ltr">
                {product.slug}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3 text-sm" style={{ color: "var(--gray-11)" }}>
        {product.categoryName || product.category?.name || "—"}
      </td>

      {/* Brand */}
      <td className="px-4 py-3 text-sm" style={{ color: "var(--gray-11)" }}>
        {product.brandName || product.brand?.name || "—"}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge active={product.isActive ?? product.active ?? false} />
      </td>

      {/* Price */}
      <td className="px-4 py-3 text-sm tabular-nums" dir="ltr" style={{ color: "var(--gray-12)" }}>
        {basePrice != null ? `${basePrice.toLocaleString("ar")} ₪` : "—"}
      </td>

      {/* Variants */}
      <td className="px-4 py-3 text-sm text-center" style={{ color: "var(--gray-10)" }}>
        {varCount > 0 ? (
          <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
            {varCount}
          </span>
        ) : "—"}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-center">
        <ActionsMenu product={product} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4" dir="rtl">
      <p className="text-sm" style={{ color: "var(--gray-10)" }}>
        صفحة {page + 1} من {totalPages}
      </p>
      <div className="flex gap-2">
        <button onClick={() => onChange(page - 1)} disabled={page === 0}
          className="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors"
          style={{
            borderColor: "var(--gray-a6)",
            color: page === 0 ? "var(--gray-7)" : "var(--gray-11)",
            background: "var(--gray-1)",
            cursor: page === 0 ? "not-allowed" : "pointer",
          }}>
          <FiChevronRight size={15} />
        </button>
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors"
          style={{
            borderColor: "var(--gray-a6)",
            color: page >= totalPages - 1 ? "var(--gray-7)" : "var(--gray-11)",
            background: "var(--gray-1)",
            cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
          }}>
          <FiChevronLeft size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Default filter state ──────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  page: 0, size: 15, q: "", categoryId: "", brandId: "",
  isActive: "", targetedAudience: "", ageGroup: "", minPrice: "", maxPrice: "",
};

function getResponseData(response) {
  return response?.data ?? response ?? null;
}

function getPaginatedContent(response) {
  const data = getResponseData(response);
  return {
    content: Array.isArray(data?.content) ? data.content : [],
    meta: data?.meta ?? {},
  };
}

function normalizeReferenceOptions(response) {
  const data = getResponseData(response);
  const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
  return list.map((item) => ({ value: String(item.id), label: item.name }));
}

function getOptionLabel(options, id) {
  if (id == null || id === "") return "";
  const normalizedId = Number(id);
  const matched = options.find((option) => Number(option.value) === normalizedId);
  return matched?.label || "";
}

function enrichProductRecord(product, details, categories, brands) {
  const categoryId = details?.categoryId ?? product.categoryId ?? product.category?.id ?? null;
  const brandId = details?.brandId ?? product.brandId ?? product.brand?.id ?? null;
  const variantCount = details?.variantCount ?? product.variantCount ?? product.variants?.length ?? 0;
  const isActive = details?.isActive ?? product.isActive ?? product.active ?? false;

  return {
    ...product,
    categoryId,
    brandId,
    variantCount,
    isActive,
    categoryName: product.categoryName || product.category?.name || getOptionLabel(categories, categoryId),
    brandName: product.brandName || product.brand?.name || getOptionLabel(brands, brandId),
  };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProductList() {
  const navigate = useNavigate();
  const { toasts, push } = useToast();

  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);
  const [products,   setProducts]   = useState([]);
  const { sorted: sortedProducts, sortKey, sortDir, onSort } = useSortedData(products, "name");
  const [totalPages, setTotalPages] = useState(0);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands,     setBrands]     = useState([]);

  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleteLoading,  setDeleteLoading]  = useState(false);
  const productDetailsCacheRef = useRef(new Map());
  const pendingDetailsRef = useRef(new Set());

  const applyProductDetails = useCallback((list, nextCategories = categories, nextBrands = brands) => {
    return list.map((product) =>
      enrichProductRecord(
        product,
        productDetailsCacheRef.current.get(product.id),
        nextCategories,
        nextBrands,
      ));
  }, [brands, categories]);

  const hydrateProducts = useCallback(async (list, nextCategories = categories, nextBrands = brands) => {
    const missingProducts = list.filter(
      (product) =>
        product?.id != null &&
        !productDetailsCacheRef.current.has(product.id) &&
        !pendingDetailsRef.current.has(product.id),
    );

    if (missingProducts.length === 0) {
      setProducts((prev) => applyProductDetails(prev, nextCategories, nextBrands));
      return;
    }

    missingProducts.forEach((product) => pendingDetailsRef.current.add(product.id));

    try {
      const detailsList = await Promise.all(
        missingProducts.map(async (product) => {
          try {
            const response = await productsApi.getById(product.id);
            const detail = getResponseData(response);

            return {
              id: product.id,
              categoryId: detail?.categoryId ?? detail?.category?.id ?? null,
              brandId: detail?.brandId ?? detail?.brand?.id ?? null,
              variantCount: Array.isArray(detail?.variants) ? detail.variants.length : 0,
              isActive: Boolean(detail?.isActive),
            };
          } catch {
            return null;
          }
        }),
      );

      let hasFreshDetails = false;

      detailsList.forEach((detail) => {
        if (!detail) return;
        productDetailsCacheRef.current.set(detail.id, detail);
        hasFreshDetails = true;
      });

      if (hasFreshDetails) {
        setProducts((prev) => applyProductDetails(prev, nextCategories, nextBrands));
      }
    } finally {
      missingProducts.forEach((product) => pendingDetailsRef.current.delete(product.id));
    }
  }, [applyProductDetails, brands, categories]);

  // Load reference data once
  useEffect(() => {
    productsApi.getCategoriesAll()
      .then((response) => setCategories(normalizeReferenceOptions(response)))
      .catch(() => {});
    productsApi.getBrands()
      .then((response) => setBrands(normalizeReferenceOptions(response)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setProducts((prev) => applyProductDetails(prev));
  }, [applyProductDetails]);

  const load = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const response = await productsApi.getAll(f);
      const { content, meta } = getPaginatedContent(response);
      const initialProducts = applyProductDetails(content);

      setProducts(initialProducts);
      setTotalPages(meta?.totalPages ?? 0);
      setTotal(meta?.totalItems ?? initialProducts.length);
      void hydrateProducts(initialProducts);
    } catch (e) {
      push(e.message || "فشل تحميل المنتجات", "error");
    } finally {
      setLoading(false);
    }
  }, [applyProductDetails, filters, hydrateProducts, push]);

  useEffect(() => { load(filters); }, []); // initial load

  function handleSearch() { load(filters); }

  function handleReset() {
    const f = DEFAULT_FILTERS;
    setFilters(f);
    load(f);
  }

  function handlePageChange(newPage) {
    const f = { ...filters, page: newPage };
    setFilters(f);
    load(f);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await productsApi.delete(deleteTarget.id);
      push("تم حذف المنتج بنجاح", "success");
      setDeleteTarget(null);
      load(filters);
    } catch (e) {
      push(e.message || "فشل حذف المنتج", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>المنتجات</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gray-10)" }}>إدارة منتجات المتجر وتعديل تفاصيلها</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => load(filters)} disabled={loading}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm border transition-colors"
            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)", background: "var(--gray-1)" }}>
            <FiRefreshCw size={14} style={{ animation: loading ? "spin 0.75s linear infinite" : "none" }} />
          </button>
          <button onClick={() => navigate("/shop-owner/products/new")}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{ background: "var(--blue-9)", color: "#fff" }}>
            <FiPlus size={16} />
            إضافة منتج
          </button>
        </div>
      </div>

      {/* Filters */}
      <ProductFilters
        filters={filters} categories={categories} brands={brands}
        onChange={setFilters} onSearch={handleSearch} onReset={handleReset} loading={loading}
      />

      {/* Table card */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>

        {/* Table meta row */}
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--gray-a4)" }}>
          <p className="text-sm" style={{ color: "var(--gray-10)" }}>
            {loading ? "جاري التحميل..." : `${total.toLocaleString("ar")} منتج`}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--gray-a4)", background: "var(--gray-a2)" }}>
                  <SortableTh label="المنتج" sortKey="name" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gray-9)" }} />
                  <SortableTh label="الفئة" sortKey="categoryName" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gray-9)" }} />
                  <SortableTh label="الماركة" sortKey="brandName" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gray-9)" }} />
                  <SortableTh label="الحالة" sortKey="isActive" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gray-9)" }} />
                  <SortableTh label="السعر الأساسي" sortKey="basePrice" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gray-9)" }} />
                  <SortableTh label="المتغيرات" sortKey="variantCount" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gray-9)" }} />
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gray-9)" }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm" style={{ color: "var(--gray-9)" }}>
                    <div className="flex items-center justify-center gap-2">
                      <Spinner size={16} /> جاري التحميل...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <FiPackage size={36} className="mx-auto mb-3" style={{ color: "var(--gray-7)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--gray-10)" }}>لا توجد منتجات</p>
                    <p className="text-xs mt-1" style={{ color: "var(--gray-8)" }}>جرّب تغيير الفلاتر أو أضف منتجاً جديداً</p>
                  </td>
                </tr>
              ) : (
                sortedProducts.map(p => (
                  <ProductRow
                    key={p.id} product={p}
                    onView={() => navigate(`/shop-owner/products/${p.id}`)}
                    onEdit={() => navigate(`/shop-owner/products/${p.id}/edit`)}
                    onDelete={() => setDeleteTarget(p)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={filters.page} totalPages={totalPages} onChange={handlePageChange} />
          </div>
        )}
      </div>

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
