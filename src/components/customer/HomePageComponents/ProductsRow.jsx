import React, { useEffect, useRef } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

import ProductCard from "./ProductCard";
import SectionHeader from "./SectionHeader";

export default function ProductsRow({
  title,
  subtitle,
  products = [],
  onViewAll,
  onAddToCart,
}) {
  const scrollerRef = useRef(null);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(320, el.clientWidth * 0.72), behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [products.length]);

  if (!products.length) return null;

  return (
    <section className="customer-shell px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <SectionHeader title={title} subtitle={subtitle} onViewAll={onViewAll} />
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            aria-label="السابق"
            onClick={() => scrollBy(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--customer-border)] bg-white text-[var(--customer-muted)] shadow-[var(--customer-shadow-soft)] hover:border-[rgba(27,79,240,0.2)] hover:text-[var(--customer-accent)]"
          >
            <IoIosArrowBack className="text-base" />
          </button>
          <button
            type="button"
            aria-label="التالي"
            onClick={() => scrollBy(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--customer-border)] bg-white text-[var(--customer-muted)] shadow-[var(--customer-shadow-soft)] hover:border-[rgba(27,79,240,0.2)] hover:text-[var(--customer-accent)]"
          >
            <IoIosArrowForward className="text-base" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[34px] border border-[var(--customer-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] p-4 shadow-[var(--customer-shadow-soft)] sm:p-5">
        <div
          ref={scrollerRef}
          className="flex items-stretch gap-4 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex w-[210px] shrink-0 sm:w-[230px] md:w-[250px] lg:w-[268px]">
              <ProductCard p={product} onAddToCart={onAddToCart} />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-gradient-to-r from-white to-transparent md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l from-white to-transparent md:block" />
      </div>
    </section>
  );
}
