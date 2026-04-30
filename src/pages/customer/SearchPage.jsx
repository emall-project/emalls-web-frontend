import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  IoArrowForward,
  IoSearchOutline,
  IoStorefrontOutline,
  IoCartOutline,
  IoBusinessOutline,
} from "react-icons/io5";

import rawMalls from "../../assets/malls.json";
import rawStores from "../../assets/stores.json";
import rawProducts from "../../assets/products.json";

import { buildSearchIndex, searchInIndex } from "../../utils/searchUtils";
import { catalogApi, normalizeCatalogPage } from "../../api/catalog";
import { toProductCard } from "../../utils/catalogProducts";
import CatalogFilters, { buildCatalogFilterPayload, hasCatalogFilters } from "../../components/customer/CatalogFilters";

function useQueryParam(name) {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(name) || "", [search, name]);
}

export default function SearchPage() {
  const navigate = useNavigate();

  const q = useQueryParam("q");
  const mallIdParam = useQueryParam("mallId"); // ✅ optional
  const [liveProducts, setLiveProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: "",
    brandId: "",
    minPrice: "",
    maxPrice: "",
    targetedAudience: "",
    ageGroup: "",
    selectedOptionsByAttribute: {},
  });

  // ✅ filter raw data if mallId exists
  const scoped = useMemo(() => {
    if (!mallIdParam) {
      return { malls: rawMalls, stores: rawStores, products: rawProducts };
    }
    return {
      malls: rawMalls.filter((m) => String(m.id) === String(mallIdParam)),
      stores: rawStores.filter((s) => String(s.mallId) === String(mallIdParam)),
      products: rawProducts.filter((p) => String(p.mallId) === String(mallIdParam)),
    };
  }, [mallIdParam]);

  useEffect(() => {
    let cancelled = false;
    const hasFilters = hasCatalogFilters(filters);
    if (q.trim().length < 2 && !hasFilters && !mallIdParam) {
      setLiveProducts([]);
      return () => {
        cancelled = true;
      };
    }

    setLoadingProducts(true);
    catalogApi.products.publicPage(
      {
        ...(q.trim().length >= 2 ? { q: q.trim() } : {}),
        ...(mallIdParam ? { mallId: Number(mallIdParam) } : {}),
        ...buildCatalogFilterPayload(filters),
      },
      { page: 0, size: 60 }
    )
      .then((response) => {
        if (cancelled) return;
        setLiveProducts(normalizeCatalogPage(response).content.map(toProductCard));
      })
      .catch(() => {
        if (!cancelled) setLiveProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, mallIdParam, q]);

  const searchIndex = useMemo(
    () => buildSearchIndex({ rawMalls: scoped.malls, rawStores: scoped.stores, rawProducts: scoped.products }),
    [scoped]
  );

  const results = useMemo(() => {
    const indexed = searchInIndex(q, searchIndex, { limit: 80 });
    const hasLiveRequest = q.trim().length >= 2 || mallIdParam || hasCatalogFilters(filters);
    const products = liveProducts.length || hasLiveRequest
      ? liveProducts.map((product) => ({
          type: "product",
          id: product.id,
          title: product.name,
          subtitle: product.shortDescription || product.status || "",
          imageUrl: product.imageUrl,
          href: product.href,
        }))
      : indexed.products;
    return {
      ...indexed,
      products,
      all: [...indexed.malls, ...indexed.stores, ...products],
    };
  }, [filters, liveProducts, mallIdParam, q, searchIndex]);
  const hasActiveCatalogQuery = q.trim().length >= 2 || mallIdParam || hasCatalogFilters(filters);

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <div className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-10">
        <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mb-8" />

        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4 mb-8">
          <div className="text-right flex-1">
            <h1 className="text-2xl md:text-3xl font-light tracking-wide text-black mb-2">
              نتائج البحث
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm md:text-base">
              {q ? (
                <>
                  <span className="text-black/60 font-light">البحث عن:</span>
                  <span className="text-black font-light border border-black/10 px-4 py-1.5">
                    "{q}"
                  </span>
                  {mallIdParam ? (
                    <span className="text-black/40 text-xs md:text-sm font-light">
                      (داخل هذا المول فقط)
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-black/50 font-light">اكتب كلمة للبحث</span>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="
              h-11 px-5
              bg-white border border-black/10
              hover:bg-black hover:text-white
              transition-all duration-300
              flex items-center gap-2
              text-sm font-light tracking-wide
            "
          >
            <IoArrowForward className="text-lg" />
            <span>رجوع</span>
          </button>
        </div>

        {/* Count */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
          <CountCard label="المولات" count={results.malls.length} icon={<IoBusinessOutline className="text-2xl" />} />
          <CountCard label="المتاجر" count={results.stores.length} icon={<IoStorefrontOutline className="text-2xl" />} />
          <CountCard label="المنتجات" count={loadingProducts ? "..." : results.products.length} icon={<IoCartOutline className="text-2xl" />} />
        </div>

        <div className="mb-8">
          <CatalogFilters filters={filters} onChange={setFilters} />
        </div>

        {/* States */}
        {q.trim().length < 2 && !hasActiveCatalogQuery ? (
          <EmptyState title="ابدأ البحث" desc="اكتب حرفين على الأقل لعرض النتائج" icon={<IoSearchOutline className="text-4xl text-black/30" />} />
        ) : results.all.length === 0 ? (
          <EmptyState title="لا توجد نتائج" desc={`لم نجد أي نتائج مطابقة لـ "${q}"`} sub="جرب كلمات بحث مختلفة أو تحقق من الإملاء" icon={<IoSearchOutline className="text-4xl text-black/30" />} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResultsSection title="المولات" items={results.malls} onPick={(item) => navigate(item.href)} icon={<IoBusinessOutline className="text-lg" />} />
            <ResultsSection title="المتاجر" items={results.stores} onPick={(item) => navigate(item.href)} icon={<IoStorefrontOutline className="text-lg" />} />
            <div className="lg:col-span-2">
              <ResultsSection title="المنتجات" items={results.products} onPick={(item) => navigate(item.href)} icon={<IoCartOutline className="text-lg" />} grid />
            </div>
          </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mt-12" />
      </div>
    </div>
  );
}

function CountCard({ label, count, icon }) {
  return (
    <div className="bg-white border border-black/10 p-5 md:p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-black/60">{icon}</div>
        <div className="text-xs tracking-widest uppercase text-black/50 font-light">{label}</div>
      </div>
      <div className="text-3xl md:text-4xl font-light tracking-wide text-black">{count}</div>
    </div>
  );
}

function ResultsSection({ title, items, onPick, icon, grid = false }) {
  if (!items?.length) return null;

  return (
    <section className="bg-white border border-black/10 p-5 md:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 border border-black/10 grid place-items-center text-black/60">
          {icon}
        </div>
        <h2 className="text-base md:text-lg font-light tracking-wide text-black">{title}</h2>
        <span className="mr-auto text-xs tracking-widest uppercase text-black/50 font-light border border-black/10 px-3 py-1">
          {items.length}
        </span>
      </div>

      <div className={grid ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-3"}>
        {items.map((item) => (
          <button
            key={`${item.type}-${item.id}`}
            onClick={() => onPick(item)}
            className="
              w-full text-right
              border border-black/10
              hover:bg-black/[0.02]
              transition-colors
              p-4
              flex items-center gap-4
              group
            "
          >
            <div className="w-12 h-12 bg-black/5 flex items-center justify-center overflow-hidden shrink-0 group-hover:bg-black/10 transition-colors">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-black/40 font-light text-lg">{item.title?.[0] || "?"}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-light text-black truncate text-base tracking-wide group-hover:underline">
                {item.title}
              </div>
              {item.subtitle ? (
                <div className="text-xs text-black/50 font-light truncate mt-1 tracking-wide">
                  {item.subtitle}
                </div>
              ) : null}
            </div>

            <div className="text-black/20 group-hover:text-black/60 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ title, desc, sub, icon }) {
  return (
    <div className="mt-16 text-center border border-black/10 bg-white p-10">
      <div className="w-16 h-16 mx-auto mb-5 bg-black/5 grid place-items-center">{icon}</div>
      <h3 className="text-lg md:text-xl font-light text-black mb-2">{title}</h3>
      <p className="text-black/60 font-light">{desc}</p>
      {sub ? <p className="text-black/40 font-light text-sm mt-2">{sub}</p> : null}
    </div>
  );
}
