import React, { useEffect, useState } from "react";

function AdvSection({ imgsUrl = [], intervalMs = 4000, href = "#" }) {
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

  return (
    <section
      className="relative w-full"
    
      style={{
        height:
          "calc(100svh - var(--app-header-h, 72px) - var(--app-catbar-h, 56px))",
      }}
    >
      <a
        href={currentHref}
        className="block relative overflow-hidden h-full w-full bg-white"
        onClick={(e) => {
          if (!currentHref || currentHref === "#") e.preventDefault();
        }}
      >
        {/* image */}
        <img
          src={currentImg?.image}
          alt={currentImg?.alt || "Ad"}
          loading="lazy"
          className="w-full h-full object-cover"
        />

        {/* overlay (خليه z-10) */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

        {/* ✅ dots (لازم z-20) */}
        <div className="absolute z-20 bottom-10 md:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {imgsUrl.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`slide ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                setIndex(i);
              }}
              className={[
                "h-[3px] w-10 md:w-12 rounded-full transition-all",
                i === index ? "bg-white/95" : "bg-white/35 hover:bg-white/70",
              ].join(" ")}
            />
          ))}
        </div>

        {/* ✅ counter (z-20) */}
        <div className="absolute z-20 top-5 md:top-6 left-5 md:left-6 text-[10px] md:text-xs font-light text-white tracking-[0.25em] bg-black/25 backdrop-blur-md px-4 py-2">
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(imgsUrl.length).padStart(2, "0")}
        </div>

        {/* ✅ scroll indicator (z-20) */}
        <div className="absolute z-20 bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2 text-white/80">
            <span className="text-[15px] uppercase tracking-[0.3em] font-light">
              استكشف 
            </span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 5v14m0 0l-7-7m7 7l7-7"
              />
            </svg>
          </div>
        </div>
      </a>
    </section>
  );
}

export default AdvSection;
