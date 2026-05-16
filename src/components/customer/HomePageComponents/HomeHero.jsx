import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCompass,
  FiMapPin,
  FiShoppingBag,
  FiStar,
} from "react-icons/fi";

function HeroSkeleton() {
  return (
    <section className="customer-shell px-4 pt-6 sm:px-6 md:px-10 md:pt-8">
      <div className="overflow-hidden rounded-[36px] border border-[var(--customer-border)] bg-white shadow-[var(--customer-shadow-lg)]">
        <div className="grid animate-pulse gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 px-6 py-8 sm:px-8 md:px-10 lg:px-12 lg:py-12">
            <div className="h-7 w-32 rounded-full bg-slate-100" />
            <div className="h-12 w-3/4 rounded-[20px] bg-slate-100" />
            <div className="h-4 w-4/5 rounded-full bg-slate-100" />
            <div className="h-4 w-2/3 rounded-full bg-slate-100" />
            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 rounded-[24px] bg-slate-100" />
              ))}
            </div>
          </div>
          <div className="min-h-[320px] bg-slate-100" />
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-[22px] border border-white/60 bg-white/78 px-4 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur-sm">
      <div className="text-2xl font-black tracking-tight text-[var(--customer-text)]">{value}</div>
      <div className="mt-1 text-xs font-semibold text-[var(--customer-muted)]">{label}</div>
    </div>
  );
}

function MiniProductCard({ product, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-3 rounded-[22px] border border-white/55 bg-white/82 p-3 text-right shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-sm transition hover:-translate-y-0.5"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-[var(--customer-surface-muted)]">
        {product?.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-[var(--customer-muted-soft)]">
            <FiShoppingBag />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-sm font-extrabold leading-6 text-[var(--customer-text)]">
          {product?.name}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="font-black text-[var(--customer-text)]">₪{Number(product?.price ?? 0).toFixed(2)}</span>
          {product?.oldPrice != null ? (
            <span className="text-[var(--customer-muted-soft)] line-through">
              ₪{Number(product.oldPrice).toFixed(2)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function HomeHero({
  loading = false,
  categories = [],
  malls = [],
  stores = [],
  products = [],
  brands = [],
}) {
  const navigate = useNavigate();

  if (loading) return <HeroSkeleton />;

  const featuredMall = malls.find((mall) => mall.imageUrl || mall.logoUrl) ?? malls[0] ?? null;
  const heroProducts = products.slice(0, 3);
  const topCategories = categories.slice(0, 5);

  return (
    <section className="customer-shell px-4 pt-6 sm:px-6 md:px-10 md:pt-8">
      <div className="relative overflow-hidden rounded-[36px] border border-[var(--customer-border)] bg-[linear-gradient(135deg,#ffffff_0%,#f7f8fd_42%,#eef4ff_100%)] shadow-[var(--customer-shadow-lg)]">
        <div className="pointer-events-none absolute -left-16 top-0 h-52 w-52 rounded-full bg-[rgba(38,99,255,0.08)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[rgba(15,23,42,0.06)] blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="px-6 py-8 sm:px-8 md:px-10 lg:px-12 lg:py-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(27,79,240,0.14)] bg-white/80 px-3 py-1.5 text-[11px] font-extrabold text-[var(--customer-accent)] shadow-[var(--customer-shadow-soft)]">
              <FiCompass className="text-sm" />
              منصة تسوق متعددة المولات
            </div>

            <h1 className="mt-5 max-w-3xl text-[1.72rem] font-black leading-[1.18] tracking-tight text-[var(--customer-text)] sm:text-[2.4rem] lg:text-[3.3rem]">
              اكتشف المتاجر والمنتجات والعروض
              <span className="block text-[var(--customer-accent)]">في تجربة تسوّق واحدة أنيقة وواضحة</span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--customer-muted)] sm:text-[0.98rem]">
              تصفّح منتجات حقيقية من متاجر فعّالة داخل المولات، وانتقل بين الفئات والعلامات التجارية والعروض
              بدون فوضى بصرية أو خطوات مشتتة.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" onClick={() => navigate("/products")} className="customer-primary-btn w-full rounded-2xl px-5 sm:w-auto">
                ابدأ التصفّح
                <FiArrowLeft className="text-base" />
              </button>
              <button type="button" onClick={() => featuredMall && navigate(`/malls/${featuredMall.id}`)} className="customer-secondary-btn w-full rounded-2xl px-5 sm:w-auto">
                <FiMapPin className="text-base" />
                {featuredMall ? `استكشف ${featuredMall.name}` : "استكشف المولات"}
              </button>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard value={products.length.toLocaleString("en-US")} label="منتج متاح الآن" />
              <StatCard value={stores.length.toLocaleString("en-US")} label="متجر نشط" />
              <StatCard value={malls.length.toLocaleString("en-US")} label="مول ومتجر جامع" />
              <StatCard value={brands.length.toLocaleString("en-US")} label="علامة تجارية" />
            </div>

            {topCategories.length ? (
              <div className="mt-7 flex flex-wrap gap-2">
                {topCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => navigate(`/products?categoryId=${category.id}`)}
                    className="rounded-full border border-[rgba(15,23,42,0.08)] bg-white/85 px-4 py-2 text-xs font-bold text-[var(--customer-text)] shadow-[var(--customer-shadow-soft)] hover:border-[rgba(27,79,240,0.18)] hover:text-[var(--customer-accent)]"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative px-6 pb-7 sm:px-8 lg:px-8 lg:py-8">
            <div className="grid h-full gap-4 lg:grid-rows-[1fr_auto]">
              <div className="overflow-hidden rounded-[30px] border border-white/60 bg-[linear-gradient(160deg,#0f172a_0%,#10203f_48%,#1d4ed8_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
                <div className="grid h-full gap-0 md:grid-cols-[1fr_0.9fr]">
                  <div className="flex flex-col justify-between px-5 py-5 sm:px-6 sm:py-6">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold">
                        <FiStar className="text-xs" />
                        وجهة مميزة اليوم
                      </div>
                      <h2 className="mt-4 text-[1.55rem] font-black leading-snug sm:text-2xl">
                        {featuredMall?.name || "تجربة تسوق حديثة"}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-white/76">
                        {featuredMall?.description || "تصفّح المولات والمتاجر والمنتجات داخل واجهة منظمة تمنحك قرار شراء أسرع."}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-white/80">
                      {featuredMall?.city ? (
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                          {featuredMall.city}
                        </span>
                      ) : null}
                      {featuredMall?.status ? (
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                          {featuredMall.status === "ACTIVE" ? "نشط الآن" : featuredMall.status}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="relative min-h-[220px]">
                    {featuredMall?.imageUrl ? (
                      <img
                        src={featuredMall.imageUrl}
                        alt={featuredMall.name}
                        className="h-full w-full object-cover opacity-95"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#60a5fa_0%,#1d4ed8_40%,#0f172a_100%)]">
                        <span className="text-6xl font-black text-white/20">
                          {featuredMall?.name?.[0] || "س"}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/55 to-transparent" />
                  </div>
                </div>
              </div>

              {heroProducts.length ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {heroProducts.map((product) => (
                    <MiniProductCard
                      key={product.id}
                      product={product}
                      onOpen={() => navigate(`/products/${product.id}`)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
