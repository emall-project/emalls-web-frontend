import React, { useMemo, useRef } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

function CategoriesBanner({ categories = [], onSelectCategory }) {
  const scrollerRef = useRef(null);

  const items = useMemo(() => categories.filter((c) => c.imageUrl), [categories]);

  const scrollByAmount = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(260, Math.floor(el.clientWidth * 0.9));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section className="relative w-full py-8 sm:py-10 md:py-14 bg-neutral-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12">
        {/* Section header */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h2
            className="text-sm sm:text-base md:text-lg font-extralight text-black/70 text-center"
            style={{ letterSpacing: "0.1em", lineHeight: "1.8" }}
          >
            التشكيلات الحصرية
          </h2>
        </div>

        <div className="relative">
          {/* Arrows (hide on mobile) */}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByAmount(-1)}
            className="
              hidden sm:flex
              absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 z-10
              h-11 w-11 md:h-12 md:w-12
              items-center justify-center
              bg-white border border-black/10
              transition-all duration-300
              hover:bg-black hover:border-black
              group
            "
          >
            <IoIosArrowBack className="text-black text-lg md:text-xl transition-colors group-hover:text-white" />
          </button>

          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByAmount(1)}
            className="
              hidden sm:flex
              absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 z-10
              h-11 w-11 md:h-12 md:w-12
              items-center justify-center
              bg-white border border-black/10
              transition-all duration-300
              hover:bg-black hover:border-black
              group
            "
          >
            <IoIosArrowForward className="text-black text-lg md:text-xl transition-colors group-hover:text-white" />
          </button>

          {/* Scroller */}
          <div
            ref={scrollerRef}
            className="
              flex gap-3 sm:gap-4 md:gap-6
              overflow-x-auto scroll-smooth
              scrollbar-hide
              snap-x snap-mandatory
              pb-1
            "
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {items.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCategory?.(c.id)}
                className="
                  group relative shrink-0
                  w-[180px] xs:w-[200px] sm:w-[240px] md:w-[320px] lg:w-[380px]
                  aspect-[3/4]
                  overflow-hidden
                  snap-center
                  transition-all duration-500
                  hover:shadow-2xl
                "
                style={{
                  borderRadius: "999px", // نفس الروح لكن يطلع لطيف مع الصغير والكبير
                }}
              >
                {/* Background image */}
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="
                    w-full h-full
                    object-cover
                    transition-transform duration-700
                    group-hover:scale-105
                  "
                  loading="lazy"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />

                {/* Gradient overlay */}
                <div
                  className="
                    absolute inset-0
                    bg-gradient-to-t from-black/60 via-black/20 to-transparent
                    transition-all duration-500
                    group-hover:from-black/70
                  "
                />

                {/* Text overlay */}
                <div
                  className="
                    absolute inset-x-0 bottom-0
                    p-4 sm:p-5 md:p-8
                    flex flex-col items-center justify-end
                    text-center
                  "
                >
                  <h3
                    className="
                      text-xs sm:text-sm md:text-lg
                      font-light
                      tracking-[0.18em] md:tracking-[0.2em]
                      uppercase
                      text-white
                      transition-all duration-500
                      group-hover:tracking-[0.22em] md:group-hover:tracking-[0.3em]
                    "
                  >
                    {c.name}
                  </h3>

                  {/* Underline */}
                  <div
                    className="
                      w-0 h-px bg-white mt-2 sm:mt-3
                      transition-all duration-500
                      group-hover:w-12 sm:group-hover:w-16 md:group-hover:w-20
                    "
                  />

                  {/* Shop now text */}
                  <span
                    className="
                      text-[9px] sm:text-[10px]
                      tracking-[0.22em] sm:tracking-[0.25em]
                      uppercase
                      text-white/80
                      mt-3 sm:mt-4
                      opacity-0
                      transition-all duration-500
                      group-hover:opacity-100
                    "
                  >
                    تسوق الآن
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
      `}</style>
    </section>
  );
}

export default CategoriesBanner;
