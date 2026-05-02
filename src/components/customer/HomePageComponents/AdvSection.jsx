import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdvSection({ imgsUrl = [], intervalMs = 4000, href = "#" }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!imgsUrl?.length) return;
    setIndex((current) => (current >= imgsUrl.length ? 0 : current));
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % imgsUrl.length);
    }, intervalMs);

    return () => clearInterval(id);
  }, [imgsUrl?.length, intervalMs]);

  if (!imgsUrl?.length) return null;

  const currentImg = imgsUrl[index] || imgsUrl[0];
  const currentHref = currentImg?.href || href;
  const isInternalHref = currentHref && currentHref !== "#" && currentHref.startsWith("/");
  const canOpenCurrent = currentHref && currentHref !== "#";

  const openCurrentSlide = () => {
    if (!canOpenCurrent) return;
    if (isInternalHref) {
      navigate(currentHref);
      return;
    }
    window.location.assign(currentHref);
  };

  return (
    <section
      className="relative w-full"
      style={{
        height:
          "calc(100svh - var(--app-header-h, 72px) - var(--app-catbar-h, 56px) - 52px)",
        minHeight: "430px",
        maxHeight: "760px",
      }}
    >
      <button
        type="button"
        disabled={!canOpenCurrent}
        className={[
          "block relative overflow-hidden h-full w-full bg-white text-right",
          canOpenCurrent ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
        onClick={openCurrentSlide}
      >
        <img
          src={currentImg?.image}
          alt={currentImg?.alt || "Ad"}
          loading={index === 0 ? "eager" : "lazy"}
          className="w-full h-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-full bg-gradient-to-l from-black/45 via-black/10 to-transparent md:w-2/3" />

        <div className="absolute inset-x-0 bottom-16 z-20 px-5 text-right sm:px-8 md:bottom-20 md:px-12">
          <div className="max-w-400 2xl:max-w-[1920px] mx-auto">
            <div className="max-w-xl text-white">
              <div className="mb-3 inline-flex border border-white/25 px-3 py-1 text-[10px] font-semibold text-white/75">
                {currentImg?.position || "عرض مميز"}
              </div>
              <h1 className="text-3xl font-light leading-tight md:text-5xl">
                {currentImg?.title || "عروض مختارة من متاجر سوقنا"}
              </h1>
              {currentImg?.subtitle ? (
                <p className="mt-4 max-w-md text-sm font-light leading-7 text-white/75 md:text-base">
                  {currentImg.subtitle}
                </p>
              ) : null}
              <div className="mt-6 inline-flex items-center gap-3 border border-white/35 px-5 py-3 text-xs font-semibold text-white transition hover:bg-white hover:text-black">
                فتح العرض
              </div>
            </div>
          </div>
        </div>
      </button>

      <div className="absolute z-20 bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {imgsUrl.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={[
              "h-[3px] w-10 md:w-12 rounded-full transition-all",
              i === index ? "bg-white/95" : "bg-white/35 hover:bg-white/70",
            ].join(" ")}
          />
        ))}
      </div>

      <div className="absolute z-20 top-5 md:top-6 left-5 md:left-6 text-[10px] md:text-xs font-light text-white bg-black/25 backdrop-blur-md px-4 py-2">
        {String(index + 1).padStart(2, "0")} /{" "}
        {String(imgsUrl.length).padStart(2, "0")}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 h-px bg-white/30" />
    </section>
  );
}

export default AdvSection;
