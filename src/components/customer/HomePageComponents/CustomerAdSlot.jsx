import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { getAdPositionLabel } from "../../../data/adSlots";

function toAspectRatio(value) {
  if (!value || typeof value !== "string" || !value.includes(":")) return "16 / 9";
  const [width, height] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "16 / 9";
  }
  return `${width} / ${height}`;
}

export default function CustomerAdSlot({ ads = [], position, compact = false }) {
  const navigate = useNavigate();
  const slotAds = useMemo(
    () =>
      (Array.isArray(ads) ? ads : []).filter(
        (ad) => ad?.imageUrl && String(ad.position) === String(position)
      ),
    [ads, position]
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [position, slotAds.length]);

  useEffect(() => {
    if (slotAds.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slotAds.length);
    }, compact ? 5000 : 5500);

    return () => window.clearInterval(timer);
  }, [compact, slotAds.length]);

  if (!slotAds.length) return null;

  const current = slotAds[index] ?? slotAds[0];
  const canOpenStore = Number(current?.shopId) > 0;
  const aspectRatio = toAspectRatio(current?.imageRatio);
  const shopLabel = current?.shopName ? `من ${current.shopName}` : "إعلان ممول";
  const slotLabel = getAdPositionLabel(position);

  const handleOpenStore = () => {
    if (!canOpenStore) return;
    navigate(`/stores/${current.shopId}`);
  };

  return (
    <article className="customer-panel-strong overflow-hidden rounded-[32px]">
      <div
        onClick={canOpenStore ? handleOpenStore : undefined}
        onKeyDown={
          canOpenStore
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleOpenStore();
                }
              }
            : undefined
        }
        {...(canOpenStore ? { role: "button", tabIndex: 0 } : {})}
        className={`block w-full text-right ${canOpenStore ? "cursor-pointer" : ""}`}
      >
        <div className="relative overflow-hidden" style={{ aspectRatio }}>
          <img
            src={current.imageUrl}
            alt={current.title || "إعلان"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4 sm:p-5">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-slate-900 shadow-sm">
              إعلان مميز
            </span>

            {slotAds.length > 1 ? (
              <span className="rounded-full bg-slate-950/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                {index + 1} / {slotAds.length}
              </span>
            ) : null}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="max-w-3xl">
              <p className="text-[11px] font-extrabold tracking-[0.12em] text-white/80">
                {compact ? shopLabel : slotLabel}
              </p>
              <h3
                className={`mt-2 font-black leading-tight text-white ${
                  compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
                }`}
              >
                {current.title || "إعلان جديد"}
              </h3>
              <p className="mt-2 text-sm leading-7 text-white/85">
                {compact ? slotLabel : shopLabel}
              </p>

              {canOpenStore ? (
                <span className="mt-4 inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[var(--customer-accent)] shadow-sm">
                  زيارة المتجر
                </span>
              ) : null}
            </div>
          </div>

          {slotAds.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="الإعلان السابق"
                onClick={(event) => {
                  event.stopPropagation();
                  setIndex((currentIndex) => (currentIndex - 1 + slotAds.length) % slotAds.length);
                }}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/35"
              >
                <FiChevronRight size={18} />
              </button>

              <button
                type="button"
                aria-label="الإعلان التالي"
                onClick={(event) => {
                  event.stopPropagation();
                  setIndex((currentIndex) => (currentIndex + 1) % slotAds.length);
                }}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/35"
              >
                <FiChevronLeft size={18} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
