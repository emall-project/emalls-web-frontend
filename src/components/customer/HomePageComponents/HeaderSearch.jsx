import React, { useEffect, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { IoIosClose } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
import { useMatch, useNavigate } from "react-router-dom";

import { customerApi } from "../../../api/customerApi";
import {
  filterMallSearchResults,
  filterStoreSearchResults,
  toMallSearchItem,
  toProductSearchItem,
  toStoreSearchItem,
} from "../../../utils/customerSearch";

function buildSearchUrl(query, mallId = null) {
  const params = new URLSearchParams({ q: query });
  if (mallId) params.set("mallId", String(mallId));
  return `/search?${params.toString()}`;
}

export default function HeaderSearch() {
  const navigate = useNavigate();
  const mallMatch = useMatch("/malls/:mallId");
  const scopedMallId = mallMatch?.params?.mallId ?? null;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [malls, setMalls] = useState([]);
  const [stores, setStores] = useState([]);
  const [results, setResults] = useState({ malls: [], stores: [], products: [], all: [] });

  const shouldOpen = query.trim().length >= 2;

  useEffect(() => {
    let active = true;
    Promise.all([
      customerApi.getActiveMalls().catch(() => []),
      customerApi.getActiveShops().catch(() => []),
    ]).then(([mallList, shopList]) => {
      if (!active) return;
      setMalls(mallList);
      setStores(shopList);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!shouldOpen) {
      setResults({ malls: [], stores: [], products: [], all: [] });
      setLoading(false);
      return;
    }

    let active = true;
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.trim();
        const [productResponse] = await Promise.all([
          customerApi.getProducts(
            { q, ...(scopedMallId ? { mallId: Number(scopedMallId) } : {}) },
            0,
            8
          ),
        ]);
        if (!active) return;

        const mallItems  = filterMallSearchResults(malls, q, scopedMallId).slice(0, 4).map(toMallSearchItem);
        const storeItems = filterStoreSearchResults(stores, q, scopedMallId).slice(0, 4).map(toStoreSearchItem);
        const productItems = (productResponse?.products ?? []).slice(0, 6).map(toProductSearchItem);
        const all = [...mallItems, ...storeItems, ...productItems];

        setResults({ malls: mallItems, stores: storeItems, products: productItems, all });
      } catch {
        if (!active) return;
        setResults({ malls: [], stores: [], products: [], all: [] });
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => { active = false; clearTimeout(timeout); };
  }, [query, shouldOpen, malls, stores, scopedMallId]);

  const searchUrl = useMemo(() => {
    const trimmed = query.trim();
    return trimmed ? buildSearchUrl(trimmed, scopedMallId) : "";
  }, [query, scopedMallId]);

  const inputBase = [
    "h-[52px] w-full rounded-[24px] text-sm text-[var(--customer-text)] outline-none shadow-[var(--customer-shadow-soft)]",
    "border border-[rgba(15,23,42,0.08)] bg-white/94",
    "pr-12 pl-10 font-semibold",
    "placeholder:text-[var(--customer-muted-soft)]",
    "transition-all",
    "focus:border-[rgba(27,79,240,0.25)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,240,0.08)]",
  ].join(" ");

  return (
    <div className="min-w-0 flex-1">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <div className="relative">
            {/* Search icon */}
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              <FiSearch className="text-[1.05rem] text-[var(--customer-accent)]" />
            </div>

            {/* Input */}
            <input
              className={inputBase}
              type="text"
              placeholder="ابحث عن منتجات، متاجر، مولات..."
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                setOpen(val.trim().length >= 2);
              }}
              onFocus={() => setOpen(shouldOpen)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter" && searchUrl) {
                  navigate(searchUrl);
                  setOpen(false);
                }
              }}
            />

            {/* Clear */}
            {query && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setQuery(""); setOpen(false); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--customer-muted-soft)] hover:text-[var(--customer-text)]"
              >
                <IoIosClose className="text-lg" />
              </button>
            )}
          </div>
        </Popover.Anchor>

        <Popover.Portal>
          <Popover.Content
            dir="rtl"
            side="bottom"
            align="start"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            className="z-50 w-[min(760px,calc(100vw-32px))] overflow-hidden rounded-[28px] border border-[var(--customer-border)] bg-white shadow-[var(--customer-shadow-lg)] outline-none"
          >
            {!shouldOpen ? (
              <div className="px-6 py-10 text-center">
                <FiSearch className="mx-auto mb-3 text-4xl text-[var(--customer-muted-soft)]" />
                <p className="text-sm text-[var(--customer-muted)]">اكتب حرفين على الأقل للبحث</p>
              </div>
            ) : loading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex animate-pulse items-center gap-3">
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-[var(--customer-surface-muted)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded-full bg-[var(--customer-surface-muted)]" />
                      <div className="h-3 w-1/2 rounded-full bg-[var(--customer-surface-muted)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.all.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <FiSearch className="mx-auto mb-3 text-4xl text-[var(--customer-muted-soft)]" />
                <p className="mb-1 text-sm font-bold text-[var(--customer-text)]">لا توجد نتائج</p>
                <p className="text-xs text-[var(--customer-muted)]">جرّب كلمات بحث مختلفة</p>
              </div>
            ) : (
              <div className="max-h-[480px] overflow-auto">
                {results.malls.length > 0 && (
                  <SearchGroup title="المولات" items={results.malls} onPick={(item) => { navigate(item.href); setOpen(false); }} />
                )}
                {results.stores.length > 0 && (
                  <SearchGroup title="المتاجر" items={results.stores} onPick={(item) => { navigate(item.href); setOpen(false); }} />
                )}
                {results.products.length > 0 && (
                  <SearchGroup title="المنتجات" items={results.products} onPick={(item) => { navigate(item.href); setOpen(false); }} />
                )}

                <div className="flex items-center justify-between border-t border-[var(--customer-border)] px-5 py-3">
                  <button
                    type="button"
                    onClick={() => { if (searchUrl) { navigate(searchUrl); setOpen(false); } }}
                    className="text-sm font-bold text-[var(--customer-accent)] hover:underline"
                  >
                    عرض كل النتائج ({results.all.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setOpen(false); }}
                    className="text-xs font-semibold text-[var(--customer-muted)] hover:text-[var(--customer-text)]"
                  >
                    مسح
                  </button>
                </div>
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function SearchGroup({ title, items, onPick }) {
  return (
    <div className="py-2">
      <div className="px-5 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--customer-muted-soft)]">
        {title}
      </div>
      <div>
        {items.map((item) => (
          <button
            key={`${item.type}-${item.id}`}
            type="button"
            onClick={() => onPick(item)}
            className="group flex w-full items-center gap-3 px-5 py-2.5 text-right transition-colors hover:bg-[var(--customer-surface-muted)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--customer-surface-muted)]">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <span className="text-base font-bold text-[var(--customer-muted)]">
                  {item.title?.[0] || "؟"}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-[var(--customer-text)] group-hover:text-[var(--customer-accent)]">
                {item.title}
              </div>
              {item.subtitle && (
                <div className="mt-0.5 truncate text-xs text-[var(--customer-muted)]">
                  {item.subtitle}
                </div>
              )}
              {item.price != null && (
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-sm font-black text-[var(--customer-text)]">₪{item.price}</span>
                  {item.oldPrice != null && (
                    <span className="text-xs text-[var(--customer-muted-soft)] line-through">₪{item.oldPrice}</span>
                  )}
                </div>
              )}
            </div>

            <svg className="h-4 w-4 shrink-0 text-[var(--customer-muted-soft)] group-hover:text-[var(--customer-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
