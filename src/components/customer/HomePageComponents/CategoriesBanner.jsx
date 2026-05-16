import React, { useMemo } from "react";
import { FiArrowLeft, FiGrid } from "react-icons/fi";

import SectionHeader from "./SectionHeader";

function CategoryCard({ category, featured = false, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "group relative overflow-hidden rounded-[28px] border text-right transition hover:-translate-y-1",
        featured
          ? "border-[rgba(15,23,42,0.08)] bg-[linear-gradient(160deg,#0f172a_0%,#16346b_55%,#2563eb_100%)] text-white shadow-[0_22px_55px_rgba(15,23,42,0.22)]"
          : "border-[var(--customer-border)] bg-white shadow-[var(--customer-shadow-soft)] hover:shadow-[var(--customer-shadow-md)]",
      ].join(" ")}
    >
      <div className={`flex h-full flex-col ${featured ? "justify-between" : ""}`}>
        <div className={featured ? "px-5 py-5 sm:px-6 sm:py-6" : "flex items-center gap-4 px-4 py-4 sm:px-5 sm:py-5"}>
          {featured ? (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-white/90">
                <FiGrid className="text-xs" />
                تصفّح بحسب الفئة
              </div>
              <h3 className="mt-4 text-2xl font-black leading-tight">{category.name}</h3>
              <p className="mt-3 max-w-sm text-sm leading-7 text-white/80">
                انتقل مباشرة إلى كل المنتجات المرتبطة بهذه الفئة عبر المولات والمتاجر المختلفة.
              </p>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,rgba(27,79,240,0.08),rgba(15,23,42,0.04))]">
                {category.imageUrl ? (
                  <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-[var(--customer-accent)]/40">{category.name?.[0] || "ف"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-base font-black text-[var(--customer-text)]">{category.name}</h3>
                <p className="mt-1 text-xs leading-6 text-[var(--customer-muted)]">افتح منتجات هذه الفئة عبر المنصة</p>
              </div>
            </>
          )}
        </div>

        <div className={featured ? "border-t border-white/10 px-5 py-4 sm:px-6" : "border-t border-[var(--customer-border)] px-4 py-3 sm:px-5"}>
          <div className={`inline-flex items-center gap-2 text-xs font-bold ${featured ? "text-white" : "text-[var(--customer-accent)]"}`}>
            استكشف الفئة
            <FiArrowLeft className="transition-transform group-hover:-translate-x-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

function CategorySkeleton({ featured = false }) {
  return (
    <div
      className={[
        "animate-pulse rounded-[28px] border bg-white",
        featured ? "min-h-[280px]" : "min-h-[120px]",
      ].join(" ")}
      style={{ borderColor: "var(--customer-border)" }}
    >
      <div className="space-y-4 p-5">
        <div className="h-5 w-28 rounded-full bg-slate-100" />
        <div className="h-7 w-2/3 rounded-[18px] bg-slate-100" />
        {featured ? (
          <>
            <div className="h-4 w-4/5 rounded-full bg-slate-100" />
            <div className="h-4 w-2/3 rounded-full bg-slate-100" />
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function CategoriesBanner({ categories = [], onSelectCategory }) {
  const visible = useMemo(() => categories.slice(0, 7), [categories]);
  const featured = visible[0] ?? null;
  const compact = visible.slice(1);

  if (!visible.length) return null;

  return (
    <section className="customer-shell px-4 py-8 sm:px-6 md:px-10 md:py-12">
      <SectionHeader
        eyebrow="الفئات"
        title="ابدأ من حيث تنتمي حاجتك"
        subtitle="الفئات الرئيسية مرتبة بشكل يمنحك دخولًا أسرع إلى المنتجات المناسبة، دون ازدحام أو قوائم مربكة."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
        {featured ? (
          <CategoryCard category={featured} featured onOpen={() => onSelectCategory?.(featured.id)} />
        ) : (
          <CategorySkeleton featured />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {compact.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onOpen={() => onSelectCategory?.(category.id)}
            />
          ))}
          {!compact.length
            ? Array.from({ length: 4 }).map((_, index) => <CategorySkeleton key={index} />)
            : null}
        </div>
      </div>
    </section>
  );
}
