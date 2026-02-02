import React, { useEffect, useRef } from "react";
import {
  IoStorefrontOutline,
  IoChevronForward,
  IoStarSharp,
  IoChevronBack,
} from "react-icons/io5";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

function FeaturedShops({ shops = [], mallName }) {
  const scrollRef = useRef(null);

  const specialistShops = (shops || []).filter((shop) => shop.specialist === true);
  if (specialistShops.length === 0) return null;

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
  }, [specialistShops.length]);

  return (
    <section className=" mx-auto px-10 mt-10">
      {/* Header (home style) */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E8F0FE] flex items-center justify-center">
            <IoStarSharp className="text-xl text-[#1A73E8]" />
          </div>

          <div className="text-right">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black">
              متاجر مميزة
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 font-semibold">
              تجارب تسوق استثنائية في{" "}
              <span className="text-[#1A73E8]">{mallName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Container like ProductsRow */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="relative mt-3">
          {/* arrows (desktop/tablet) - same as ProductsRow */}
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
            ref={scrollRef}
            className="
              flex gap-4 sm:gap-6
              overflow-x-auto scroll-smooth
              pb-2
              sm:px-12
              [-ms-overflow-style:none] [scrollbar-width:none]
            "
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* hide scrollbar (webkit) */}
            <style>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>

            {specialistShops.map((shop) => (
              <article
                key={shop.id}
                className="
                  shrink-0
                  w-[280px] sm:w-[320px]
                  bg-white
                  rounded-3xl
                  border border-gray-200
                  shadow-sm hover:shadow-md
                  transition
                  overflow-hidden
                "
              >
                {/* Image / Logo area */}
                <div className="relative h-44 sm:h-48 bg-[#E8F0FE] flex items-center justify-center">
                  {/* badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-bold text-[#1A73E8]">
                      <IoStarSharp className="text-base" />
                      متجر مميز
                    </span>
                  </div>

                  {shop.image ? (
                    <img
                      src={shop.image}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                  ) : shop.logoUrl ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={shop.logoUrl}
                        alt={shop.name}
                        className="w-28 h-28 object-contain"
                      />
                    </div>
                  ) : (
                    <IoStorefrontOutline className="text-6xl text-[#1A73E8]/40" />
                  )}
                </div>

                {/* Details */}
                <div className="p-5 text-right">
                  <h3 className="text-xl font-extrabold text-black line-clamp-1">
                    {shop.name}
                  </h3>

                  <div className="mt-4">
                    <button
                      className="
                        w-full
                        rounded-full
                        bg-[#1A73E8]
                        text-white
                        py-3
                        font-bold
                        hover:brightness-95
                        transition
                        flex items-center justify-center gap-5
                      "
                    >
                      <span>استكشف المتجر</span>
                      <IoChevronBack className="text-lg" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* fades like ProductsRow */}
          <div className="pointer-events-none hidden sm:block absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none hidden sm:block absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>
    </section>
  );
}

export default FeaturedShops;
