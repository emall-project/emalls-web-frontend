import { useState, useEffect, useCallback } from "react";
import {
  FiPackage, FiRefreshCw, FiChevronLeft, FiChevronRight, FiSearch,
} from "react-icons/fi";
import { useSortedData, SortableTh } from "../../../utils/tableSort";
import { auth } from "../../../api/auth";

const ACCOUNTS = "/accounts";
const CATALOG  = "/catalog";

async function accountsFetch(path) {
  const res = await fetch(`${ACCOUNTS}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders() },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return null;
  return json?.data ?? json ?? null;
}

async function catalogFetch(path, options = {}) {
  const res = await fetch(`${CATALOG}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "خطأ في الطلب");
  return json?.data ?? json ?? null;
}

function normalizePage(data) {
  const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
  const meta    = data?.meta || {};
  return {
    content,
    totalPages: meta.totalPages ?? data?.totalPages ?? 1,
    totalElements: meta.totalItems ?? data?.totalElements ?? content.length,
  };
}

export default function CatalogProductsPage() {
  const [shops, setShops]             = useState([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState("");

  const [products, setProducts]         = useState([]);
  const { sorted: sortedProducts, sortKey, sortDir, onSort } = useSortedData(products, "name");
  const [loading, setLoading]         = useState(false);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError]             = useState(null);

  // Load all shops
  useEffect(() => {
    setShopsLoading(true);
    accountsFetch("/api/shops/all")
      .then(data => {
        const list = Array.isArray(data) ? data
          : Array.isArray(data?.content) ? data.content
          : [];
        setShops(list);
      })
      .catch(() => {})
      .finally(() => setShopsLoading(false));
  }, []);

  const loadProducts = useCallback(async () => {
    if (!selectedShopId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await catalogFetch(
        `/stores/${selectedShopId}/products/all?page=${page}&size=15`,
        { method: "POST", body: JSON.stringify({}) }
      );
      const pg = normalizePage(data);
      setProducts(pg.content);
      setTotalPages(pg.totalPages);
      setTotalElements(pg.totalElements);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, page]);

  useEffect(() => {
    if (selectedShopId) loadProducts();
  }, [loadProducts]);

  const handleShopChange = (e) => {
    setSelectedShopId(e.target.value);
    setPage(0);
    setProducts([]);
  };

  const selectedShop = shops.find(s => String(s.id ?? s.shopId) === String(selectedShopId));

  return (
    <div dir="rtl" className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--purple-3)", color: "var(--purple-11)" }}>
            <FiPackage size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>منتجات الكتالوج</h1>
            <p className="text-sm" style={{ color: "var(--gray-10)" }}>تصفح منتجات المتاجر</p>
          </div>
        </div>
        {selectedShopId && (
          <button onClick={loadProducts} disabled={loading}
            className="p-2 rounded-xl"
            style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        )}
      </div>

      {/* Shop selector */}
      <div className="mb-6 rounded-2xl border p-4"
        style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--gray-11)" }}>
          اختر متجراً
        </label>
        <div className="relative">
          <FiSearch size={15} className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--gray-8)" }} />
          <select
            value={selectedShopId}
            onChange={handleShopChange}
            disabled={shopsLoading}
            className="w-full rounded-xl border px-3 py-2 text-sm pr-9 outline-none appearance-none"
            style={{ borderColor: "var(--gray-a6)", background: "var(--gray-2)", color: "var(--gray-12)" }}>
            <option value="">{shopsLoading ? "جاري التحميل..." : "-- اختر متجراً --"}</option>
            {shops.map(shop => {
              const id = shop.id ?? shop.shopId;
              return (
                <option key={id} value={id}>
                  {shop.name} {shop.mallName ? `(${shop.mallName})` : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--red-3)", color: "var(--red-11)" }}>
          {error}
        </div>
      )}

      {/* Products */}
      {!selectedShopId ? (
        <div className="py-16 text-center text-sm" style={{ color: "var(--gray-9)" }}>
          اختر متجراً لعرض منتجاته
        </div>
      ) : loading && products.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: "var(--gray-9)" }}>جاري التحميل...</div>
      ) : (
        <>
          {selectedShop && totalElements > 0 && (
            <p className="mb-3 text-sm" style={{ color: "var(--gray-10)" }}>
              {selectedShop.name} — {totalElements} منتج
            </p>
          )}

          {products.length === 0 && !loading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--gray-9)" }}>
              لا توجد منتجات في هذا المتجر
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--gray-a5)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--gray-a2)" }}>
                    <SortableTh label="المنتج"  sortKey="name"       currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }} />
                    <SortableTh label="السعر"   sortKey="basePrice"  currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }} />
                    <SortableTh label="المخزون" sortKey="totalStock" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }} />
                    <SortableTh label="الحالة"  sortKey="isActive"   currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "var(--gray-10)" }} />
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map(product => {
                    const id    = product.id ?? product.productId;
                    const price = product.basePrice ?? product.price ?? product.minPrice;
                    const stock = product.totalStock ?? product.stock ?? product.quantity;
                    const active = product.isActive ?? product.active;
                    const thumb = product.thumbnailUrl ?? product.imageUrl ?? product.smallImageUrl;
                    return (
                      <tr key={id} className="border-t" style={{ borderColor: "var(--gray-a4)" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {thumb ? (
                              <img src={thumb} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: "var(--gray-a3)" }}>
                                <FiPackage size={14} style={{ color: "var(--gray-8)" }} />
                              </div>
                            )}
                            <span className="font-medium truncate max-w-[200px]"
                              style={{ color: "var(--gray-12)" }}>
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--gray-11)" }}>
                          {price != null ? `${price} ₪` : "—"}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--gray-11)" }}>
                          {stock != null ? stock : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{
                              background: active !== false ? "var(--green-3)" : "var(--gray-3)",
                              color:      active !== false ? "var(--green-11)" : "var(--gray-10)",
                            }}>
                            <span className="w-1.5 h-1.5 rounded-full"
                              style={{ background: active !== false ? "var(--green-9)" : "var(--gray-7)" }} />
                            {active !== false ? "نشط" : "غير نشط"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading}
                className="p-2 rounded-xl disabled:opacity-40"
                style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                <FiChevronRight size={15} />
              </button>
              <span className="text-sm" style={{ color: "var(--gray-11)" }}>{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || loading}
                className="p-2 rounded-xl disabled:opacity-40"
                style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                <FiChevronLeft size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
