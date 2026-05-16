import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiShoppingCart } from "react-icons/fi";
import * as Tooltip from "@radix-ui/react-tooltip";

import FavoriteButton from "../FavoriteButton";
import { discountAmount, isDiscount, isOutOfStock } from "../../../utils/tmpProducts";

function formatPrice(value) {
  return Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProductCard({ p, onAddToCart }) {
  const navigate = useNavigate();
  const discount = isDiscount(p);
  const save = discountAmount(p);
  const out = isOutOfStock(p);

  const goToProduct = () => navigate(`/products/${p.id}`);
  const handleQuickAction = () => {
    if (typeof onAddToCart === "function") {
      onAddToCart(p);
      return;
    }
    goToProduct();
  };

  return (
    <article className="group customer-product-card relative flex h-full w-full flex-col overflow-hidden rounded-[24px] border border-[var(--customer-border)] bg-white shadow-[var(--customer-shadow-soft)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(27,79,240,0.16)] hover:shadow-[var(--customer-shadow-md)]">
      <div className="relative overflow-hidden border-b border-[var(--customer-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f4f7fb_100%)]">
        {discount ? (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-[var(--customer-deal)] px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
            وفّر ₪{formatPrice(save)}
          </div>
        ) : null}

        {p?.id ? (
          <div className="absolute left-3 top-3 z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-[18px] border border-white/50 bg-white/90 shadow-[var(--customer-shadow-soft)] backdrop-blur-sm">
              <FavoriteButton
                productId={p.id}
                size="text-[1.2rem]"
                activeClassName="text-rose-500"
                inactiveClassName="text-[var(--customer-muted)] hover:text-[var(--customer-text)]"
              />
            </div>
          </div>
        ) : null}

        {out ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/72 backdrop-blur-sm">
            <span className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-600">
              غير متوفر حاليًا
            </span>
          </div>
        ) : null}

        <button type="button" onClick={goToProduct} className="block w-full" aria-label={p?.name || "فتح المنتج"}>
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.name}
              className="aspect-[1.08] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-[1.08] w-full items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-5xl text-[var(--customer-muted-soft)]">
              +
            </div>
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3.5 text-right sm:p-4">
        <div className="min-h-[5.4rem] space-y-1">
          <button
            type="button"
            onClick={goToProduct}
            className="line-clamp-2 text-right text-[0.93rem] font-black leading-6 text-[var(--customer-text)] hover:text-[var(--customer-accent)]"
          >
            {p.name}
          </button>

          {p.shortDescription ? (
            <p className="line-clamp-2 text-[11px] leading-5 text-[var(--customer-muted)] sm:text-xs">
              {p.shortDescription}
            </p>
          ) : (
            <div className="min-h-[0.4rem]" />
          )}

          <div className="min-h-[1.25rem]">
            {p.brandName || p.storeName || p.mallName ? (
              <div className="flex min-h-[1.25rem] flex-wrap items-center gap-1.5 text-[10px] font-semibold text-[var(--customer-muted)]">
                {p.brandName ? (
                  <span className="rounded-full bg-[var(--customer-accent-soft)] px-2 py-0.5 text-[var(--customer-accent)]">
                    {p.brandName}
                  </span>
                ) : null}
                {p.storeName ? <span>{p.storeName}</span> : null}
                {!p.storeName && p.mallName ? <span>{p.mallName}</span> : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2.5 pt-3">
          <div className="text-right">
            <div className="flex items-end justify-end gap-2">
              <span className="text-[1.1rem] font-black tracking-tight text-[var(--customer-text)] sm:text-[1.25rem]">
                ₪{formatPrice(p.price)}
              </span>
              {discount ? (
                <span className="pb-0.5 text-[11px] font-semibold text-[var(--customer-muted-soft)] line-through">
                  ₪{formatPrice(p.oldPrice)}
                </span>
              ) : null}
            </div>
            <div className="mt-1 min-h-[1rem]">
              {discount ? (
                <p className="text-[11px] font-bold text-[var(--customer-success)]">سعر مخفّض متاح الآن</p>
              ) : null}
            </div>
          </div>

          <Tooltip.Provider delayDuration={180}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  disabled={out}
                  onClick={handleQuickAction}
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border shadow-[var(--customer-shadow-soft)]",
                    out
                      ? "cursor-not-allowed border-[var(--customer-border)] bg-white/60 opacity-50"
                      : "border-[rgba(27,79,240,0.16)] bg-[var(--customer-accent-soft)] text-[var(--customer-accent)] hover:-translate-y-0.5 hover:border-[rgba(27,79,240,0.24)] hover:bg-[rgba(27,79,240,0.14)]",
                  ].join(" ")}
                  aria-label="إجراء سريع"
                >
                  <FiShoppingCart className="text-base" />
                </button>
              </Tooltip.Trigger>

              <Tooltip.Portal>
                <Tooltip.Content
                  side="top"
                  align="center"
                  className="rounded-full bg-[var(--customer-text)] px-3 py-1 text-[11px] font-semibold text-white shadow-lg"
                >
                  {typeof onAddToCart === "function" ? "إجراء سريع" : "فتح المنتج"}
                  <Tooltip.Arrow className="fill-[var(--customer-text)]" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        <button
          type="button"
          onClick={goToProduct}
          className="customer-secondary-btn mt-3 w-full rounded-2xl py-2.5 text-sm"
        >
          عرض التفاصيل
          <FiArrowLeft className="text-sm" />
        </button>
      </div>
    </article>
  );
}
