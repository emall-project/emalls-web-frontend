import React from "react";
import { FiBriefcase, FiStar } from "react-icons/fi";

import SectionHeader from "./SectionHeader";

function BrandSkeleton() {
  return (
    <div className="animate-pulse rounded-[26px] border border-[var(--customer-border)] bg-white p-4 shadow-[var(--customer-shadow-soft)]">
      <div className="mx-auto h-20 w-20 rounded-[24px] bg-slate-100" />
      <div className="mx-auto mt-4 h-4 w-2/3 rounded-full bg-slate-100" />
      <div className="mx-auto mt-3 h-3 w-1/2 rounded-full bg-slate-100" />
    </div>
  );
}

function BrandCard({ brand }) {
  const initials = (brand?.name || "؟")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article className="group rounded-[26px] border border-[var(--customer-border)] bg-white p-4 text-center shadow-[var(--customer-shadow-soft)] transition hover:-translate-y-1 hover:border-[rgba(27,79,240,0.18)] hover:shadow-[var(--customer-shadow-md)] sm:p-5">
      <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border border-[var(--customer-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f4f7ff_100%)]">
        {brand.imageUrl ? (
          <img src={brand.imageUrl} alt={brand.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-black tracking-[0.18em] text-[var(--customer-accent)]">{initials}</span>
        )}
      </div>

      <h3 className="mt-4 line-clamp-1 text-sm font-black text-[var(--customer-text)] sm:text-base">
        {brand.name}
      </h3>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {brand.targetedAudienceLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--customer-accent-soft)] px-3 py-1 text-[11px] font-bold text-[var(--customer-accent)]">
            <FiBriefcase className="text-[0.8rem]" />
            {brand.targetedAudienceLabel}
          </span>
        ) : null}
        {brand.ageGroupLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
            <FiStar className="text-[0.8rem]" />
            {brand.ageGroupLabel}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export default function BrandsShowcase({ brands = [], loading = false }) {
  if (!loading && !brands.length) return null;

  return (
    <section className="customer-shell px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <div className="overflow-hidden rounded-[34px] border border-[var(--customer-border)] bg-[linear-gradient(135deg,#ffffff_0%,#f7f9ff_48%,#eef4ff_100%)] p-5 shadow-[var(--customer-shadow-lg)] sm:p-6 md:p-8">
        <SectionHeader
          eyebrow="العلامات التجارية"
          title="ماركات مختارة داخل المنصة"
          subtitle="عرض أنظف للعلامات التجارية المتاحة، مع إبراز الجمهور المناسب والفئة العمرية عندما تكون موجودة في البيانات."
        />

        <div className="mt-6 grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <BrandSkeleton key={index} />)
            : brands.map((brand) => <BrandCard key={brand.id} brand={brand} />)}
        </div>
      </div>
    </section>
  );
}
