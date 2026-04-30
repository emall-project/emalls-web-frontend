import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoStorefrontOutline,
  IoChevronBack,
  IoStarSharp,
} from "react-icons/io5";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

function FeaturedShops({ shops = [], mallName }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const featuredShops = (shops || []).filter((shop) => shop.logoUrl || shop.image).slice(0, 8);
  const displayShops = featuredShops.length ? featuredShops : (shops || []).slice(0, 8);
  if (displayShops.length === 0) return null;

  const scrollByAmount = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(280, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // ابدأ من اليمين (RTL)
    el.scrollLeft = el.scrollWidth;
  }, [displayShops.length]);

  return (
    <section className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mb-8 md:mb-10"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-black flex items-center justify-center flex-shrink-0">
            <IoStarSharp className="text-lg md:text-xl text-white" />
          </div>

          <div className="text-right">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide text-black">
              متاجر مميزة
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-black/60 mt-1 font-semibold">
              تجارب تسوق استثنائية في{" "}
              <span className="text-black">{mallName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Container */}
      <div className="bg-white">
        <div className="relative">
          {/* Arrows - luxury square style */}
          <button
            type="button"
            aria-label="scroll left"
            onClick={() => scrollByAmount(-1)}
            className="
              hidden md:flex
              absolute left-0 md:-left-14 top-1/2 -translate-y-1/2 z-10
              h-10 w-10 md:h-12 md:w-12
              bg-white border border-black/10
              items-center justify-center
              transition-all duration-300
              hover:bg-black hover:border-black
              group
            "
          >
            <IoIosArrowBack className="text-black text-lg md:text-xl transition-colors group-hover:text-white" />
          </button>

          <button
            type="button"
            aria-label="scroll right"
            onClick={() => scrollByAmount(1)}
            className="
              hidden md:flex
              absolute right-0 md:-right-14 top-1/2 -translate-y-1/2 z-10
              h-10 w-10 md:h-12 md:w-12
              bg-white border border-black/10
              items-center justify-center
              transition-all duration-300
              hover:bg-black hover:border-black
              group
            "
          >
            <IoIosArrowForward className="text-black text-lg md:text-xl transition-colors group-hover:text-white" />
          </button>

          {/* Scroller */}
          <div
            ref={scrollRef}
            className="
              flex gap-4 md:gap-6
              overflow-x-auto scroll-smooth
              pb-2
              [-ms-overflow-style:none] [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {displayShops.map((shop) => (
              <article
                key={shop.id}
                className="
                  group
                  shrink-0
                  w-[260px] sm:w-[280px] md:w-[320px]
                  bg-white
                  border border-black/10
                  overflow-hidden
                  transition-all duration-500
                  hover:shadow-xl
                  hover:-translate-y-1
                "
              >
                {/* Image / Logo area */}
                <div className="relative h-40 sm:h-44 md:h-48 bg-neutral-50 flex items-center justify-center overflow-hidden">
                  {/* Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
                      <IoStarSharp className="text-xs sm:text-sm" />
                      مميز
                    </span>
                  </div>

                  {shop.image ? (
                    <img
                      src={shop.image}
                      alt={shop.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : shop.logoUrl ? (
                    <div className="w-full h-full flex items-center justify-center p-6">
                      <img
                        src={shop.logoUrl}
                        alt={shop.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <IoStorefrontOutline className="text-5xl md:text-6xl text-black/20" />
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500"></div>
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5 text-right border-t border-black/5">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold tracking-wide text-black line-clamp-1 mb-4">
                    {shop.name}
                  </h3>

                  {/* CTA Button */}
                  <button
                    type="button"
                    onClick={() => navigate(`/stores/${shop.id}`)}
                    className="
                      w-full
                      h-10 sm:h-11 md:h-12
                      bg-black
                      text-white
                      text-xs sm:text-sm
                      font-semibold
                      tracking-widest
                      uppercase
                      hover:bg-black/90
                      transition-all duration-300
                      flex items-center justify-center gap-3
                    "
                  >
                    <span>استكشف المتجر</span>
                    <IoChevronBack className="text-base sm:text-lg" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Elegant fade gradients */}
          <div className="pointer-events-none hidden md:block absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-white via-white/80 to-transparent" />
          <div className="pointer-events-none hidden md:block absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white via-white/80 to-transparent" />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mt-8 md:mt-10"></div>
    </section>
  );
}

export default FeaturedShops;
