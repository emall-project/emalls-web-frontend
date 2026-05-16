import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMapPin, FiShoppingBag } from "react-icons/fi";

import SectionHeader from "./SectionHeader";

function MallCard({ mall, featured = false }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/malls/${mall.id}`)}
      className={[
        "group relative overflow-hidden rounded-[30px] border text-right transition hover:-translate-y-1",
        featured
          ? "border-[rgba(15,23,42,0.08)] bg-[linear-gradient(160deg,#111827_0%,#1e3a8a_48%,#2563eb_100%)] text-white shadow-[0_24px_65px_rgba(15,23,42,0.25)]"
          : "border-[var(--customer-border)] bg-white shadow-[var(--customer-shadow-soft)] hover:shadow-[var(--customer-shadow-md)]",
      ].join(" ")}
    >
      <div className={featured ? "grid gap-0 md:grid-cols-[1.05fr_0.95fr]" : ""}>
        <div className={featured ? "px-5 py-5 sm:px-6 sm:py-6" : ""}>
          {!featured ? (
            <>
              <div className="relative h-52 overflow-hidden bg-[var(--customer-surface-muted)]">
                {mall.imageUrl ? (
                  <img src={mall.imageUrl} alt={mall.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(27,79,240,0.08),rgba(15,23,42,0.06))]">
                    <span className="text-6xl font-black text-[var(--customer-accent)]/25">{mall.name?.[0] || "م"}</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--customer-muted)]">
                  <FiMapPin className="text-[11px]" />
                  {mall.city || mall.location || "مول داخل المنصة"}
                </div>
                <h3 className="line-clamp-1 text-xl font-black text-[var(--customer-text)]">{mall.name}</h3>
                <p className="line-clamp-2 text-sm leading-7 text-[var(--customer-muted)]">
                  {mall.description || "استكشف المتاجر والخدمات والمنتجات الموجودة داخل هذا المول."}
                </p>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--customer-accent-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--customer-accent)]">
                    <FiShoppingBag className="text-[11px]" />
                    {mall.status === "ACTIVE" ? "نشط الآن" : mall.status || "متاح"}
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--customer-accent)]">
                    تصفّح المول
                    <FiArrowLeft className="transition-transform group-hover:-translate-x-0.5" />
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-white/85">
                <FiShoppingBag className="text-xs" />
                مول مميز
              </div>
              <h3 className="mt-4 text-[2rem] font-black leading-tight">{mall.name}</h3>
              <p className="mt-4 text-sm leading-8 text-white/78">
                {mall.description || "اكتشف المتاجر النشطة، المنتجات المتنوعة، والعروض داخل هذا المول من مكان واحد."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {mall.city ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                    {mall.city}
                  </span>
                ) : null}
                {mall.location ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                    {mall.location}
                  </span>
                ) : null}
              </div>
              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white">
                افتح صفحة المول
                <FiArrowLeft className="transition-transform group-hover:-translate-x-0.5" />
              </div>
            </>
          )}
        </div>

        {featured ? (
          <div className="relative min-h-[250px]">
            {mall.imageUrl ? (
              <img src={mall.imageUrl} alt={mall.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#60a5fa_0%,#1d4ed8_40%,#0f172a_100%)]">
                <span className="text-7xl font-black text-white/18">{mall.name?.[0] || "م"}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/55 to-transparent" />
          </div>
        ) : null}
      </div>
    </button>
  );
}

function MallSkeleton({ featured = false }) {
  return (
    <div
      className={[
        "animate-pulse overflow-hidden rounded-[30px] border bg-white",
        featured ? "min-h-[320px]" : "min-h-[350px]",
      ].join(" ")}
      style={{ borderColor: "var(--customer-border)" }}
    >
      <div className={featured ? "grid h-full gap-0 md:grid-cols-[1.05fr_0.95fr]" : ""}>
        <div className="space-y-4 p-5">
          <div className="h-5 w-24 rounded-full bg-slate-100" />
          <div className="h-10 w-3/4 rounded-[18px] bg-slate-100" />
          <div className="h-4 w-4/5 rounded-full bg-slate-100" />
        </div>
        {featured ? <div className="bg-slate-100" /> : <div className="h-52 bg-slate-100" />}
      </div>
    </div>
  );
}

export default function MallsSection({ malls = [], loading = false }) {
  const featuredMall = malls[0] ?? null;
  const secondaryMalls = malls.slice(1, 4);

  if (!loading && !featuredMall) return null;

  return (
    <section className="customer-shell px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <SectionHeader
        eyebrow="المولات"
        title="وجهات تسوّق تجمع المتاجر تحت سقف واحد"
        subtitle="استكشف المولات المتاحة على المنصة وانتقل منها إلى المتاجر والمنتجات المرتبطة بها بشكل مباشر."
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        {loading ? <MallSkeleton featured /> : featuredMall ? <MallCard mall={featuredMall} featured /> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          {loading
            ? Array.from({ length: 2 }).map((_, index) => <MallSkeleton key={index} />)
            : secondaryMalls.map((mall) => <MallCard key={mall.id} mall={mall} />)}
        </div>
      </div>
    </section>
  );
}
