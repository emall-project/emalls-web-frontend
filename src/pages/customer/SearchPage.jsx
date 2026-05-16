import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  IoArrowForward,
  IoBusinessOutline,
  IoCartOutline,
  IoSearchOutline,
  IoStorefrontOutline,
} from "react-icons/io5";

import { customerApi } from "../../api/customerApi";
import {
  filterMallSearchResults,
  filterStoreSearchResults,
  toMallSearchItem,
  toProductSearchItem,
  toStoreSearchItem,
} from "../../utils/customerSearch";

function useQueryParam(name) {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(name) || "", [search, name]);
}

function CountCard({ label, count, icon, loading }) {
  return (
    <div className="customer-panel p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="customer-icon-chip h-11 w-11 text-base">{icon}</div>
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
      {loading ? (
        <div className="h-10 w-16 animate-pulse rounded-2xl bg-slate-100" />
      ) : (
        <div className="text-3xl font-extrabold text-slate-900">{count}</div>
      )}
    </div>
  );
}

function EmptyState({ title, desc, sub, icon }) {
  return (
    <div className="customer-panel-strong mt-10 px-6 py-12 text-center">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-500">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{desc}</p>
      {sub ? <p className="mt-1 text-sm text-slate-500">{sub}</p> : null}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {[0, 1].map((index) => (
        <div key={index} className="customer-panel space-y-4 p-5 sm:p-6 animate-pulse">
          <div className="h-5 w-28 rounded-full bg-slate-100" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-4">
              <div className="h-14 w-14 rounded-2xl bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-full bg-slate-100" />
                <div className="h-3 w-1/2 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ResultsSection({ title, items, onPick, icon, grid = false }) {
  if (!items?.length) return null;

  return (
    <section className="customer-panel p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="customer-icon-chip h-10 w-10 text-sm">{icon}</div>
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        <span className="mr-auto rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
          {items.length}
        </span>
      </div>

      <div className={grid ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
        {items.map((item) => (
          <button
            key={`${item.type}-${item.id}`}
            type="button"
            onClick={() => onPick(item)}
            disabled={!item.href}
            className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-right hover:border-blue-200 hover:bg-blue-50/40 disabled:cursor-default"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <span className="text-base font-bold text-slate-500">{item.title?.[0] || "؟"}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-900 group-hover:text-blue-700">
                {item.title}
              </div>
              {item.subtitle ? (
                <div className="mt-1 truncate text-xs text-slate-500">{item.subtitle}</div>
              ) : null}
              {item.price != null ? (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-sm font-extrabold text-slate-900">₪{item.price}</span>
                  {item.oldPrice != null ? (
                    <span className="text-xs text-slate-400 line-through">₪{item.oldPrice}</span>
                  ) : null}
                </div>
              ) : null}
            </div>

            {item.href ? (
              <div className="text-slate-300 group-hover:text-blue-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const q = useQueryParam("q");
  const mallIdParam = useQueryParam("mallId");

  const [allMalls, setAllMalls] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [results, setResults] = useState({ malls: [], stores: [], products: [], all: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      customerApi.getActiveMalls().catch(() => []),
      customerApi.getActiveShops().catch(() => []),
    ]).then(([mallList, shopList]) => {
      if (!active) return;
      setAllMalls(mallList);
      setAllStores(shopList);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setResults({ malls: [], stores: [], products: [], all: [] });
      setLoading(false);
      return;
    }

    let active = true;
    const timeout = setTimeout(async () => {
      setLoading(true);

      try {
        const query = q.trim();
        const productResponse = await customerApi.getProducts(
          {
            q: query,
            ...(mallIdParam ? { mallId: Number(mallIdParam) } : {}),
          },
          0,
          40
        );

        if (!active) return;

        const malls = filterMallSearchResults(allMalls, query, mallIdParam).map(toMallSearchItem);
        const stores = filterStoreSearchResults(allStores, query, mallIdParam).map(toStoreSearchItem);
        const products = (productResponse?.products ?? []).map(toProductSearchItem);
        const all = [...malls, ...stores, ...products];

        setResults({ malls, stores, products, all });
      } catch {
        if (!active) return;
        setResults({ malls: [], stores: [], products: [], all: [] });
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [q, mallIdParam, allMalls, allStores]);

  const scopedMall = useMemo(
    () => allMalls.find((mall) => String(mall.id) === String(mallIdParam)) || null,
    [allMalls, mallIdParam]
  );

  return (
    <div dir="rtl" className="customer-page">
      <div className="customer-shell px-4 py-8 sm:px-6 md:px-12 md:py-10">
        <div className="customer-divider mb-8" />

        <div className="customer-page-header customer-panel-strong px-5 py-5 sm:px-6 md:px-8">
          <div className="flex-1 text-right">
            <span className="customer-kicker">
              <IoSearchOutline />
              بحث مباشر
            </span>
            <h1 className="customer-page-title mt-4">نتائج البحث</h1>
            <p className="customer-page-subtitle">
              {q ? `نبحث الآن عن "${q}" داخل المولات والمتاجر والمنتجات.` : "اكتب كلمتين على الأقل لتظهر النتائج."}
            </p>
            {mallIdParam ? (
              <p className="mt-2 text-sm text-slate-500">
                {scopedMall ? `النتائج الحالية داخل ${scopedMall.name}` : "النتائج الحالية داخل هذا المول"}
              </p>
            ) : null}
          </div>

          <button type="button" onClick={() => navigate(-1)} className="customer-secondary-btn shrink-0">
            <IoArrowForward className="text-base" />
            رجوع
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CountCard
            label="المولات"
            count={results.malls.length}
            icon={<IoBusinessOutline className="text-xl" />}
            loading={loading}
          />
          <CountCard
            label="المتاجر"
            count={results.stores.length}
            icon={<IoStorefrontOutline className="text-xl" />}
            loading={loading}
          />
          <CountCard
            label="المنتجات"
            count={results.products.length}
            icon={<IoCartOutline className="text-xl" />}
            loading={loading}
          />
        </div>

        {q.trim().length < 2 ? (
          <EmptyState
            title="ابدأ البحث"
            desc="اكتب كلمتين على الأقل لنعرض لك المنتجات والمتاجر والمولات ذات الصلة."
            icon={<IoSearchOutline className="text-4xl" />}
          />
        ) : loading ? (
          <div className="mt-8">
            <SearchSkeleton />
          </div>
        ) : results.all.length === 0 ? (
          <EmptyState
            title="لا توجد نتائج"
            desc={`لم نجد نتائج مطابقة لعبارة "${q}".`}
            sub="جرّب كتابة اسم منتج أو متجر أو مول بطريقة مختلفة."
            icon={<IoSearchOutline className="text-4xl" />}
          />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ResultsSection
              title="المولات"
              items={results.malls}
              onPick={(item) => item.href && navigate(item.href)}
              icon={<IoBusinessOutline className="text-lg" />}
            />
            <ResultsSection
              title="المتاجر"
              items={results.stores}
              onPick={(item) => item.href && navigate(item.href)}
              icon={<IoStorefrontOutline className="text-lg" />}
            />
            <div className="xl:col-span-2">
              <ResultsSection
                title="المنتجات"
                items={results.products}
                onPick={(item) => item.href && navigate(item.href)}
                icon={<IoCartOutline className="text-lg" />}
                grid
              />
            </div>
          </div>
        )}

        <div className="customer-divider mt-12" />
      </div>
    </div>
  );
}
