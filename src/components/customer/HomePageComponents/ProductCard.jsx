import React, { useState } from "react";
import { FiShoppingCart, FiMinus, FiPlus } from "react-icons/fi";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Dialog from "@radix-ui/react-dialog";
import { isDiscount, discountAmount, isOutOfStock } from "../../../utils/tmpProducts";

export default function ProductCard({ p, onAddToCart }) {
  const discount = isDiscount(p);
  const save = discountAmount(p);
  const out = isOutOfStock(p);

  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    onAddToCart?.({ ...p, quantity });
    setOpen(false);
    setQuantity(1);
  };

  const incrementQty = () => setQuantity((q) => Math.min(q + 1, 99));
  const decrementQty = () => setQuantity((q) => Math.max(q - 1, 1));

  return (
    <div className="group relative bg-white overflow-hidden transition-all duration-500 hover:-translate-y-0.5 border border-black/5">
      {/* image */}
      <div className="relative bg-neutral-50 overflow-hidden">
        {discount && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black text-white text-[9px] sm:text-[10px] font-semibold tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 z-10">
            وفر ₪{save}
          </div>
        )}

        {out && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="bg-white text-black text-[9px] sm:text-[10px] font-semibold tracking-wider px-2.5 py-1 sm:px-3 sm:py-1.5">
              نفذت الكمية
            </span>
          </div>
        )}

        <img
          src={p.imageUrl}
          alt={p.name}
          className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500" />
      </div>

      {/* content - more compact */}
      <div className="p-2 sm:p-2.5 md:p-3 text-right">
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-black line-clamp-2 min-h-[1.8rem] sm:min-h-[2rem]">
          {p.name}
        </p>

        {p.status && (
          <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] tracking-wide text-black/60 line-clamp-1 font-semibold">
            {p.status}
          </p>
        )}

        <div className="mt-2 sm:mt-2.5 flex items-end justify-between gap-2">
          {/* price */}
          <div className="text-right">
            <div className="flex items-baseline gap-1 sm:gap-1.5 justify-end">
              <p className="text-sm sm:text-base md:text-lg font-semibold text-black tracking-wide">
                ₪{p.price}
              </p>

              {discount && (
                <p className="text-[9px] sm:text-[10px] md:text-xs text-black/40 line-through font-semibold">
                  ₪{p.oldPrice}
                </p>
              )}
            </div>
          </div>

          {/* Add to cart button - smaller */}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Dialog.Trigger asChild>
                    <button
                      type="button"
                      disabled={out}
                      className={[
                        "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 border border-black/10 flex items-center justify-center transition-all duration-300",
                        out
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-black hover:border-black group/btn active:scale-95",
                      ].join(" ")}
                      aria-label="add to cart"
                    >
                      <FiShoppingCart className="text-black text-xs sm:text-sm md:text-base transition-colors group-hover/btn:text-white" />
                    </button>
                  </Dialog.Trigger>
                </Tooltip.Trigger>

                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    align="center"
                    className="bg-black text-white text-[9px] sm:text-[10px] font-semibold tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-lg"
                  >
                    إضافة للسلة
                    <Tooltip.Arrow className="fill-black" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>

            {/* Dialog - unchanged, already responsive */}
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

              <Dialog.Content
                className="
                  fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[92vw] max-w-md
                  bg-white border border-black/10 shadow-2xl
                  p-5 sm:p-6
                "
                dir="rtl"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-black/10">
                  <div className="text-right">
                    <Dialog.Title className="text-base sm:text-lg font-semibold tracking-wide text-black">
                      إضافة إلى السلة
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-black/60 mt-1 font-semibold">
                      اختر الكمية المطلوبة
                    </Dialog.Description>
                  </div>

                  <Dialog.Close
                    className="h-8 w-8 border border-black/10 hover:bg-black hover:text-white flex items-center justify-center transition-all duration-300 text-black/60 hover:text-white"
                    aria-label="close"
                  >
                    ✕
                  </Dialog.Close>
                </div>

                {/* Product info */}
                <div className="mt-5 flex items-center gap-4">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-[72px] h-[72px] sm:w-20 sm:h-20 object-cover border border-black/10"
                  />
                  <div className="min-w-0 text-right flex-1">
                    <p className="font-semibold text-black line-clamp-2 text-sm sm:text-base">
                      {p.name}
                    </p>
                    <p className="text-base sm:text-lg text-black font-semibold mt-1">
                      ₪{p.price}
                    </p>
                  </div>
                </div>

                {/* Quantity controls */}
                <div className="mt-5 pt-5 border-t border-black/10">
                  <label className="block text-xs tracking-widest uppercase text-black mb-3 font-semibold">
                    الكمية
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={decrementQty}
                      disabled={quantity <= 1}
                      className="h-9 w-9 sm:h-10 sm:w-10 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition-all duration-300"
                      aria-label="decrease quantity"
                    >
                      <FiMinus className="text-sm" />
                    </button>

                    <div className="flex-1 h-9 sm:h-10 border border-black/10 flex items-center justify-center">
                      <span className="text-base font-semibold text-black">
                        {quantity}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={incrementQty}
                      disabled={quantity >= 99}
                      className="h-9 w-9 sm:h-10 sm:w-10 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition-all duration-300"
                      aria-label="increase quantity"
                    >
                      <FiPlus className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-5 flex items-center justify-between text-right">
                  <span className="text-xs tracking-widest uppercase text-black font-semibold">
                    المجموع
                  </span>
                  <span className="text-xl sm:text-2xl font-semibold text-black">
                    ₪{(p.price * quantity).toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="flex-1 h-11 sm:h-12 bg-black text-white text-xs sm:text-sm tracking-widest uppercase font-semibold hover:bg-black/90 transition-all duration-300"
                  >
                    إضافة
                  </button>

                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 h-11 sm:h-12 border border-black/10 text-xs sm:text-sm tracking-widest uppercase font-semibold hover:bg-black hover:text-white transition-all duration-300"
                    >
                      إلغاء
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-black/5 to-transparent" />
    </div>
  );
}