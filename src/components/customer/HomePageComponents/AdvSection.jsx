import React, { useEffect, useState, useCallback } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

function AdvSection({ imgsUrl = [], intervalMs = 4000 }) {
  const [index, setIndex] = useState(0);

  const total = imgsUrl.length;

  const next = useCallback(
    () => setIndex((i) => (i + 1) % total),
    [total]
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + total) % total),
    [total]
  );

  useEffect(() => {
    if (!total) return;
    const id = setInterval(next, intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs, next]);

  if (!total) return null;

  const current = imgsUrl[index];

  return (
    <section
      className="relative overflow-hidden w-full"
      style={{ height: "clamp(300px, 58vh, 580px)" }}
    >
      {/* ── Slide images ─────────────────────────────────────────────────── */}
      {imgsUrl.map((slide, i) => (
        <div
          key={slide.id ?? i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? "auto" : "none" }}
        >
          <img
            src={slide.image}
            alt={slide.alt || ""}
            className="h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* ── Gradient overlay ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/15" />

      {/* ── Slide text ───────────────────────────────────────────────────── */}
      {(current?.title || current?.subtitle) && (
        <div className="absolute bottom-16 right-0 px-6 text-right sm:px-10 md:right-auto md:px-16 md:max-w-xl">
          {current.subtitle && (
            <p className="mb-2 inline-block rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {current.subtitle}
            </p>
          )}
          {current.title && (
            <h2 className="text-2xl font-black leading-tight text-white drop-shadow-lg sm:text-3xl md:text-4xl">
              {current.title}
            </h2>
          )}
          {current.cta && (
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[var(--customer-accent)] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {current.cta}
            </button>
          )}
        </div>
      )}

      {/* ── Navigation arrows ────────────────────────────────────────────── */}
      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="الشريحة السابقة"
            onClick={prev}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/35 hover:scale-105 sm:right-5 sm:h-11 sm:w-11"
          >
            <IoIosArrowForward className="text-xl" />
          </button>
          <button
            type="button"
            aria-label="الشريحة التالية"
            onClick={next}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/35 hover:scale-105 sm:left-5 sm:h-11 sm:w-11"
          >
            <IoIosArrowBack className="text-xl" />
          </button>
        </>
      )}

      {/* ── Slide dots ───────────────────────────────────────────────────── */}
      {total > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
          {imgsUrl.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`الشريحة ${i + 1}`}
              onClick={() => setIndex(i)}
              className={[
                "h-[3px] rounded-full transition-all duration-300",
                i === index ? "w-8 bg-white" : "w-3 bg-white/45 hover:bg-white/65",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default AdvSection;
