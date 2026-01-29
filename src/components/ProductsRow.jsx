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
    <section className="max-w-7xl mx-auto px-4 mt-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <SectionHeader title={title} onViewAll={onViewAll} />

        <div className="relative mt-3">
          {/* arrows (desktop/tablet) */}
          <button
            type="button"
            aria-label="scroll left"
            onClick={() => scrollByAmount(-1)}
            className="
              hidden sm:flex
              absolute left-2 top-1/2 -translate-y-1/2 z-10
              h-10 w-10 rounded-full bg-white border border-gray-200 shadow
              items-center justify-center hover:bg-gray-50
            "
          >
            <IoIosArrowBack className="text-gray-700" size={18} />
          </button>

          <button
            type="button"
            aria-label="scroll right"
            onClick={() => scrollByAmount(1)}
            className="
              hidden sm:flex
              absolute right-2 top-1/2 -translate-y-1/2 z-10
              h-10 w-10 rounded-full bg-white border border-gray-200 shadow
              items-center justify-center hover:bg-gray-50
            "
          >
            <IoIosArrowForward className="text-gray-700" size={18} />
          </button>

          {/* scroller */}
          <div
            ref={scrollerRef}
            className="
              flex gap-3 overflow-x-auto scroll-smooth
              pb-1
              sm:px-12
              [-ms-overflow-style:none] [scrollbar-width:none]
            "
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* إخفاء السكرول بار للـ Chrome */}
            <style>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>

            {products.map((p) => (
              <div key={p.id} className="shrink-0 w-[170px] sm:w-[210px]">
                <ProductCard p={p} onAddToCart={onAddToCart} />
              </div>
            ))}
          </div>

         
          <div className="pointer-events-none hidden sm:block absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none hidden sm:block absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>
    </section>
  );
}
