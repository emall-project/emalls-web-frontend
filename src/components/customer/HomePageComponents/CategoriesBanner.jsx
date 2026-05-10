import React, { useEffect, useMemo, useRef } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

function CategoriesBanner({ categories = [], onSelectCategory }) {
  const scrollerRef = useRef(null);

  const items = useMemo(() => categories.filter((c) => c?.id), [categories]);

  // RTL: start from the right
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [items.length]);

  const scrollByAmount = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;

    // responsive scroll amount based on visible width
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section className="relative w-full bg-neutral-50 py-7 sm:py-10 md:py-14">
      <div className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12">
        {/* Header */}
        <div className="mb-5 sm:mb-7 md:mb-10 text-center">
          <h2 className="text-xs sm:text-sm md:text-lg font-extralight text-black/70 tracking-[0.18em]">
            التشكيلات الحصرية
          </h2>
        </div>

        <div className="relative">
          {/* arrows (md+) */}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByAmount(-1)}
            className="
              hidden md:flex
              absolute -left-4 lg:-left-10 top-1/2 -translate-y-1/2 z-10
              h-11 w-11 rounded-full
              bg-white border border-black/10 shadow-sm
              items-center justify-center
              hover:bg-black hover:border-black
              transition
              group
            "
          >
            <IoIosArrowBack className="text-black text-lg group-hover:text-white transition-colors" />
          </button>

          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByAmount(1)}
            className="
              hidden md:flex
              absolute -right-4 lg:-right-10 top-1/2 -translate-y-1/2 z-10
              h-11 w-11 rounded-full
              bg-white border border-black/10 shadow-sm
              items-center justify-center
              hover:bg-black hover:border-black
              transition
              group
            "
          >
            <IoIosArrowForward className="text-black text-lg group-hover:text-white transition-colors" />
          </button>

          {/* scroller */}
          <div className="relative">
            <div
              ref={scrollerRef}
              dir="rtl"
              className="
                flex gap-3 sm:gap-4 md:gap-6
                overflow-x-auto scroll-smooth
                snap-x snap-mandatory
                pb-2
                [-ms-overflow-style:none] [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
              "
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {items.map((c) => (
                <article
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectCategory?.(c.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onSelectCategory?.(c.id);
                    }
                  }}
                  className="
                    group relative shrink-0 snap-center
                    cursor-pointer
                    overflow-hidden
                    transition
                    hover:shadow-2xl
                  "
                  style={{
                    width: "clamp(150px, 44vw, 220px)",
                    borderRadius: "clamp(80px, 18vw, 140px)",
                    aspectRatio: "3 / 4",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectCategory?.(c.id)}
                    className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                  >
                    {(c.imageSmallUrl || c.imageUrl) ? (
                      <img
                        src={c.imageSmallUrl || c.imageUrl}
                        alt={c.name}
                        loading="lazy"
                        className="
                          w-full h-full object-cover
                          transition-transform duration-700
                          group-hover:scale-[1.04]
                        "
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-neutral-200 text-5xl font-light text-black/25">
                        {c.name?.[0] || "ف"}
                      </div>
                    )}
                  </button>

                  {/* overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-transparent transition group-hover:from-black/70" />

                  {/* text */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 md:p-7 text-center">
                    <h3
                      className="
                        text-[10px] sm:text-xs md:text-sm
                        font-light uppercase text-white
                        tracking-[0.22em] sm:tracking-[0.25em]
                        transition-all duration-500
                        group-hover:tracking-[0.30em]
                      "
                    >
                      {c.name}
                    </h3>

                    <div className="mx-auto mt-2 sm:mt-3 h-px w-0 bg-white/90 transition-all duration-500 group-hover:w-10 sm:group-hover:w-14 md:group-hover:w-20" />

                    {c.children?.length ? (
                      <div className="mt-3 flex flex-wrap justify-center gap-1.5 opacity-0 transition duration-500 group-hover:opacity-100">
                        {c.children.slice(0, 3).map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSelectCategory?.(child.id);
                            }}
                            className="border border-white/25 bg-white/10 px-2 py-1 text-[9px] font-semibold text-white/85 backdrop-blur-sm transition hover:bg-white hover:text-black"
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="mt-3 sm:mt-4 block text-[9px] sm:text-[10px] text-white/80 tracking-[0.25em] uppercase opacity-0 transition duration-500 group-hover:opacity-100">
                        تسوق الآن
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* edge fades (always, helps on mobile too) */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-10 sm:w-12 bg-linear-to-r from-neutral-50 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 sm:w-12 bg-linear-to-l from-neutral-50 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default CategoriesBanner;
