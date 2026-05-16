import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IoChevronBack, IoLocationOutline, IoStorefrontOutline } from "react-icons/io5";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

function FeaturedShops({ shops = [], mallName }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const activeShops = Array.isArray(shops) ? shops : [];

  const scrollByAmount = (direction) => {
    const element = scrollRef.current;
    if (!element) return;
    const amount = Math.max(280, Math.floor(element.clientWidth * 0.82));
    element.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollLeft = element.scrollWidth;
  }, [activeShops.length]);

  if (activeShops.length === 0) return null;

  return (
    <section className="customer-shell px-4 py-4 sm:px-6 md:px-12 md:py-6">
      <div className="customer-panel-strong overflow-hidden px-5 py-6 sm:px-6 md:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-right">
            <span className="customer-kicker">متاجر المول</span>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900 md:text-3xl">استكشف المتاجر النشطة</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              تصفّح المتاجر المفتوحة داخل <span className="font-bold text-slate-700">{mallName}</span> بسهولة أكبر.
            </p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              aria-label="السابق"
              onClick={() => scrollByAmount(-1)}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-200 hover:text-blue-700"
            >
              <IoIosArrowBack className="text-lg" />
            </button>
            <button
              type="button"
              aria-label="التالي"
              onClick={() => scrollByAmount(1)}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-200 hover:text-blue-700"
            >
              <IoIosArrowForward className="text-lg" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {activeShops.map((shop) => (
            <article
              key={shop.id}
              className="customer-panel w-[290px] shrink-0 overflow-hidden p-0 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100">
                {shop.categoryLabel ? (
                  <div className="absolute left-3 top-3 z-10">
                    <span className="rounded-full bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-white">
                      {shop.categoryLabel}
                    </span>
                  </div>
                ) : null}

                {shop.image ? (
                  <img src={shop.image} alt={shop.name} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                ) : shop.logoUrl ? (
                  <div className="flex h-full w-full items-center justify-center p-6">
                    <img src={shop.logoUrl} alt={shop.name} className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <IoStorefrontOutline className="mx-auto mt-16 text-6xl text-slate-300" />
                )}
              </div>

              <div className="p-5 text-right">
                <h3 className="line-clamp-1 text-lg font-extrabold text-slate-900">{shop.name}</h3>
                {shop.location ? (
                  <div className="mt-3 flex items-center justify-end gap-1.5 text-sm text-slate-500">
                    <span className="line-clamp-1">{shop.location}</span>
                    <IoLocationOutline className="text-base shrink-0" />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => navigate(`/stores/${shop.id}`)}
                  className="customer-primary-btn mt-5 w-full justify-center"
                >
                  <span>استكشف المتجر</span>
                  <IoChevronBack className="text-base" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedShops;
