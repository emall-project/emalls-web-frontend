import React, { useEffect, useRef } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import ProductCard from "./ProductCard";
import SectionHeader from "./SectionHeader";

export default function ProductsRow({ title, products = [], onViewAll, onAddToCart }) {
  const scrollerRef = useRef(null);

  const scrollByAmount = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(280, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // ابدأ من اليمين (RTL)
    el.scrollLeft = el.scrollWidth;
  }, [products.length]);

  if (!products.length) return null;

  return (
    <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-3 md:py-3">
      {/* Top accent line */}
      
      <div className="bg-white">
        <SectionHeader title={title} onViewAll={onViewAll} />

        <div className="relative mt-8 md:mt-10">
          {/* arrows - luxury square style */}
          <button
            type="button"
            aria-label="scroll left"
            onClick={() => scrollByAmount(-1)}
            className="
              hidden md:flex
              absolute left-0 md:-left-14 top-1/2 -translate-y-1/2 z-10
              h-12 w-12 bg-white border border-black/10
              items-center justify-center 
              transition-all duration-300
              hover:bg-black hover:border-black
              group
            "
          >
            <IoIosArrowBack className="text-black text-xl transition-colors group-hover:text-white" />
          </button>

          <button
            type="button"
            aria-label="scroll right"
            onClick={() => scrollByAmount(1)}
            className="
              hidden md:flex
              absolute right-0 md:-right-14 top-1/2 -translate-y-1/2 z-10
              h-12 w-12 bg-white border border-black/10
              items-center justify-center 
              transition-all duration-300
              hover:bg-black hover:border-black
              group
            "
          >
            <IoIosArrowForward className="text-black text-xl transition-colors group-hover:text-white" />
          </button>

          {/* scroller */}
          <div
            ref={scrollerRef}
            className="
              flex gap-4 md:gap-6
              overflow-x-auto scroll-smooth
              pb-2
              [-ms-overflow-style:none] [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {products.map((p) => (
              <div key={p.id} className="shrink-0 w-[200px] sm:w-[240px] md:w-[280px]">
                <ProductCard p={p} onAddToCart={onAddToCart} />
              </div>
            ))}
          </div>

          {/* Elegant fade gradients */}
          <div className="pointer-events-none hidden md:block absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-white via-white/80 to-transparent" />
          <div className="pointer-events-none hidden md:block absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white via-white/80 to-transparent" />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mt-8"></div>
    </section>
  );
}