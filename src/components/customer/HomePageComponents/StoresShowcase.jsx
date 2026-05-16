import React from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiShoppingBag } from "react-icons/fi";

import SectionHeader from "./SectionHeader";

function StoreSkeleton() {
  return (
    <div className="customer-panel-strong animate-pulse overflow-hidden rounded-[28px]">
      <div className="h-40 bg-slate-100" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 rounded-full bg-slate-100" />
        <div className="h-3 w-1/2 rounded-full bg-slate-100" />
        <div className="h-10 w-full rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function StoreCard({ store }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/stores/${store.id}`)}
      className="group customer-panel-strong overflow-hidden rounded-[28px] text-right hover:-translate-y-1 hover:shadow-[var(--customer-shadow-md)]"
    >
      <div className="relative h-44 overflow-hidden bg-[var(--customer-surface-muted)]">
        {store.image || store.logoUrl ? (
          <img
            src={store.image || store.logoUrl}
            alt={store.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(27,79,240,0.08),rgba(15,23,42,0.06))]">
            <span className="text-5xl font-black text-[var(--customer-accent)]/30">
              {store.name?.[0] || "م"}
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          {store.categoryLabel ? (
            <span className="rounded-full border border-white/30 bg-white/88 px-3 py-1 text-[11px] font-bold text-[var(--customer-text)] shadow-[var(--customer-shadow-soft)]">
              {store.categoryLabel}
            </span>
          ) : <span />}
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/85 text-[var(--customer-accent)] shadow-[var(--customer-shadow-soft)]">
            <FiShoppingBag />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-base font-black text-[var(--customer-text)]">{store.name}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--customer-muted)]">
            {store.mallName ? (
              <span className="rounded-full bg-[var(--customer-accent-soft)] px-2.5 py-1 font-semibold text-[var(--customer-accent)]">
                {store.mallName}
              </span>
            ) : null}
            {store.location ? (
              <span className="inline-flex items-center gap-1">
                <FiMapPin className="text-[11px]" />
                {store.location}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="line-clamp-2 text-sm leading-7 text-[var(--customer-muted)]">
            {store.description || "تصفح منتجات هذا المتجر واكتشف تشكيلته الحالية."}
          </p>
          <span className="shrink-0 rounded-2xl border border-[rgba(27,79,240,0.14)] bg-[var(--customer-accent-soft)] px-3 py-2 text-xs font-bold text-[var(--customer-accent)]">
            افتح المتجر
          </span>
        </div>
      </div>
    </button>
  );
}

export default function StoresShowcase({ stores = [], loading = false }) {
  const visibleStores = stores.slice(0, 4);

  if (!loading && !visibleStores.length) return null;

  return (
    <section className="customer-shell px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <div className="customer-soft-panel rounded-[32px] p-5 sm:p-6 md:p-8">
        <SectionHeader
          eyebrow="متاجر مختارة"
          title="تسوّق مباشرة من واجهات المتاجر"
          subtitle="مجموعة متاجر نشطة داخل المنصة مع وصول أسرع لمنتجاتها وصفحاتها الخاصة."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <StoreSkeleton key={index} />)
            : visibleStores.map((store) => <StoreCard key={store.id} store={store} />)}
        </div>
      </div>
    </section>
  );
}
