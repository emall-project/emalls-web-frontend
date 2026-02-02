import React, { useMemo, useRef, useEffect } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

function CategoriesBanner({ categories = [], onSelectCategory }) {
  const scrollerRef = useRef(null);

  const items = useMemo(
    () => categories.filter((c) => c.imageUrl),
    [categories]
  );

  const scrollByAmount = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;

    // RTL: أحيانًا يحتاج قيمة سالبة
    el.scrollLeft = -max / 2;
  }, [items.length]);

  if (!items.length) return null;

  return (
    <section className="mx-auto px-3 md:px-4 md:mt-10">
      <div className="relative">
        {/* Left arrow */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByAmount(-1)}
          className="
            flex
            absolute left-0 top-1/2 -translate-y-1/2 z-10
            h-8 w-8 sm:h-10 sm:w-10
            rounded-full bg-white/90 backdrop-blur
            border border-gray-200 shadow
            items-center justify-center
            hover:bg-gray-50
          "
        >
          <IoIosArrowBack className="text-gray-700 text-base sm:text-lg" />
        </button>

        {/* Right arrow */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByAmount(1)}
          className="
            flex
            absolute right-0 top-1/2 -translate-y-1/2 z-10
            h-8 w-8 sm:h-10 sm:w-10
            rounded-full bg-white/90 backdrop-blur
            border border-gray-200 shadow
            items-center justify-center
            hover:bg-gray-50
          "
        >
          <IoIosArrowForward className="text-gray-700 text-base sm:text-lg" />
        </button>

        {/* Scroller */}
        <div
          ref={scrollerRef}
          className="
            flex gap-3 scroll-smooth
            py-2 px-1
            overflow-hidden
            scrollbar-hide
            sm:px-12
            mx-9 sm:mx-12
          "
        >
          {items.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCategory?.(c.id)}
              className="
                shrink-0 cursor-pointer
                flex flex-col items-center gap-2
                w-21 sm:w-27.5 md:w-40
                rounded-2xl
                px-2 py-3
                hover:bg-white
                transition
              "
            >
              <img
                src={c.imageUrl}
                alt={c.name}
                className="
                  w-12 h-12 sm:w-16 sm:h-16 md:w-25 md:h-25
                  rounded-full object-cover
                  border border-gray-200
                "
                loading="lazy"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <span className="text-xs sm:text-sm font-semibold text-gray-800 text-center line-clamp-2">
                {c.name}
              </span>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}

export default CategoriesBanner;
