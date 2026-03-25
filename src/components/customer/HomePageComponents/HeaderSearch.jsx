// src/components/HomePageComponents/HeaderSearch.jsx
import React, { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { IoIosSearch, IoIosClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";

import { buildSearchIndex, searchInIndex } from "../../../utils/searchUtils";

import rawMalls from "../../../assets/malls.json";
import rawStores from "../../../assets/stores.json";
import rawProducts from "../../../assets/products.json";

export default function HeaderSearch() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const searchIndex = useMemo(
    () => buildSearchIndex({ rawMalls, rawStores, rawProducts }),
    []
  );

  const results = useMemo(
    () => searchInIndex(query, searchIndex, { limit: 12 }),
    [query, searchIndex]
  );

  const shouldOpen = query.trim().length >= 2;

  return (
    <div className="flex-1 min-w-0">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <div className="relative group">
            {/* desktop */}
            <input
              className="hidden md:flex w-full h-11 border-b-2 border-black/20 bg-transparent pr-10 pl-10 text-base outline-none focus:border-black transition-all placeholder:text-black/40 font-light tracking-wide"
              type="text"
              placeholder="ابحث عن متاجر، منتجات، أو مولات..."
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                setOpen(v.trim().length >= 2);
              }}
              onFocus={() => setOpen(shouldOpen)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter") {
                  const q = query.trim();
                  if (q) {
                    navigate(`/search?q=${encodeURIComponent(q)}`);
                    setOpen(false);
                  }
                }
              }}
            />

            {/* mobile */}
            <input
              className="md:hidden w-full h-10 border-b-2 border-black/20 bg-transparent pr-10 pl-10 text-sm outline-none focus:border-black transition-all placeholder:text-black/40 font-light"
              type="text"
              placeholder="بحث..."
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                setOpen(v.trim().length >= 2);
              }}
              onFocus={() => setOpen(shouldOpen)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter") {
                  const q = query.trim();
                  if (q) {
                    navigate(`/search?q=${encodeURIComponent(q)}`);
                    setOpen(false);
                  }
                }
              }}
            />

            {/* Search Icon - minimal */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <IoIosSearch className="text-black/60 text-xl group-hover:text-black transition-colors" />
            </div>

            {/* Clear Button - minimal */}
            {query && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery("");
                  setOpen(false);
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
              >
                <IoIosClose className="text-lg" />
              </button>
            )}
          </div>
        </Popover.Anchor>

        {/* dropdown */}
        <Popover.Portal>
          <Popover.Content
            dir="rtl"
            side="bottom"
            align="start"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            className="
              z-50
              w-[min(720px,calc(100vw-32px))]
              bg-white
              border border-black/10
              shadow-[0_8px_30px_rgba(0,0,0,0.12)]
              overflow-hidden
              outline-none
            "
          >
            {!shouldOpen ? (
              <div className="p-12 text-center">
                <IoIosSearch className="mx-auto text-5xl text-black/20 mb-4" />
                <p className="text-black/60 font-light text-sm tracking-wide">
                  اكتب حرفين على الأقل للبحث
                </p>
              </div>
            ) : results.all.length === 0 ? (
              <div className="p-12 text-center">
                <IoIosSearch className="mx-auto text-5xl text-black/20 mb-4" />
                <p className="text-black font-light text-base mb-2">لا توجد نتائج</p>
                <p className="text-black/50 font-light text-xs tracking-wide">
                  جرب كلمات بحث مختلفة
                </p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                {results.malls.length > 0 && (
                  <Group
                    title="المولات"
                    items={results.malls}
                    onPick={(item) => {
                      navigate(item.href);
                      setOpen(false);
                    }}
                  />
                )}

                {results.stores.length > 0 && (
                  <Group
                    title="المتاجر"
                    items={results.stores}
                    onPick={(item) => {
                      navigate(item.href);
                      setOpen(false);
                    }}
                  />
                )}

                {results.products.length > 0 && (
                  <Group
                    title="المنتجات"
                    items={results.products}
                    onPick={(item) => {
                      navigate(item.href);
                      setOpen(false);
                    }}
                  />
                )}

                {/* Footer - minimal luxury style */}
                <div className="border-t border-black/10 p-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const q = query.trim();
                      if (!q) return;
                      navigate(`/search?q=${encodeURIComponent(q)}`);
                      setOpen(false);
                    }}
                    className="text-black font-light text-sm underline hover:no-underline transition-all tracking-wide"
                  >
                    عرض كل النتائج ({results.all.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setOpen(false);
                    }}
                    className="text-black/60 font-light text-xs hover:text-black transition-colors tracking-widest uppercase"
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

function Group({ title, items, onPick }) {
  return (
    <div className="py-4">
      {/* Group header - minimal */}
      <div className="px-6 pb-3 text-[10px] font-light text-black/50 uppercase tracking-[0.2em] border-b border-black/5">
        {title}
      </div>

      <div className="divide-y divide-black/5">
        {items.map((item) => (
          <button
            key={`${item.type}-${item.id}`}
            type="button"
            onClick={() => onPick(item)}
            className="
              w-full text-right
              px-6 py-4
              hover:bg-black/[0.02]
              transition-colors
              flex items-center gap-4
              group
            "
          >
            {/* Image/Icon - minimal square */}
            <div className="w-12 h-12 bg-black/5 flex items-center justify-center overflow-hidden shrink-0 group-hover:bg-black/10 transition-colors">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-black/40 font-light text-lg">
                  {item.title?.[0] || "?"}
                </span>
              )}
            </div>

            {/* Text Content - minimal typography */}
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

            {/* Arrow - minimal */}
            <div className="text-black/20 group-hover:text-black/60 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}