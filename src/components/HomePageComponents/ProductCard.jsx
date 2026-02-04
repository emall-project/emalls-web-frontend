import React, { useState } from "react";
import { FiShoppingCart, FiMinus, FiPlus } from "react-icons/fi";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Dialog from "@radix-ui/react-dialog";
import { isDiscount, discountAmount, isOutOfStock } from "../../utils/tmpProducts";

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
    <div className="group relative bg-white overflow-hidden transition-all duration-500 hover:-translate-y-1">
      {/* image */}
      <div className="relative bg-neutral-50 overflow-hidden">
        {discount && (
          <div className="absolute top-4 right-4 bg-black text-white text-xs font-semibold tracking-wider px-3 py-1.5 z-10">
            وفر ₪{save}
          </div>
        )}

        {out && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="bg-white text-black text-xs font-semibold tracking-wider px-4 py-2">
              نفذت الكمية
            </span>
          </div>
        )}

        <img
          src={p.imageUrl}
          alt={p.name}
          className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500"></div>
      </div>

      {/* content */}
      <div className="p-4 md:p-5 text-right">
        {/* ✅ bigger + semi-bold */}
        <p className="text-base md:text-lg font-semibold tracking-wide text-black line-clamp-2 min-h-[2.75rem]">
          {p.name}
        </p>

        {p.status && (
          <p className="mt-1 text-xs md:text-sm tracking-wide text-black/60 line-clamp-1 font-semibold">
            {p.status}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between gap-3">
          {/* price */}
          <div className="text-right">
            <div className="flex items-baseline gap-2 justify-end">
              {/* ✅ bigger + semi-bold */}
              <p className="text-xl md:text-2xl font-semibold text-black tracking-wide">
                ₪{p.price}
              </p>

              {discount && (
                <p className="text-sm text-black/40 line-through font-semibold">
                  ₪{p.oldPrice}
                </p>
              )}
            </div>
          </div>

          {/* Add to cart button */}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Dialog.Trigger asChild>
                    <button
                      type="button"
                      disabled={out}
                      className={[
                        "h-10 w-10 border border-black/10 flex items-center justify-center transition-all duration-300",
                        out
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-black hover:border-black group/btn active:scale-95",
                      ].join(" ")}
                      aria-label="add to cart"
                    >
                      <FiShoppingCart className="text-black text-lg transition-colors group-hover/btn:text-white" />
                    </button>
                  </Dialog.Trigger>
                </Tooltip.Trigger>

                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    align="center"
                    className="bg-black text-white text-xs font-semibold tracking-wider px-3 py-1.5 shadow-lg"
                  >
                    إضافة للسلة
                    <Tooltip.Arrow className="fill-black" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>

            {/* Dialog */}
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

              <Dialog.Content
                className="
                  fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[92vw] max-w-md
                  bg-white border border-black/10 shadow-2xl
                  p-6 md:p-8
                  data-[state=open]:animate-in data-[state=closed]:animate-out
                  data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                  data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                "
                dir="rtl"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-black/10">
                  <div className="text-right">
                    {/* ✅ bigger + semi-bold */}
                    <Dialog.Title className="text-lg md:text-xl font-semibold tracking-wide text-black">
                      إضافة إلى السلة
                    </Dialog.Title>
                    <Dialog.Description className="text-sm md:text-base text-black/60 mt-1 font-semibold">
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
                <div className="mt-6 flex items-center gap-4">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-20 h-20 md:w-24 md:h-24 object-cover border border-black/10"
                  />
                  <div className="min-w-0 text-right flex-1">
                    {/* ✅ bigger + semi-bold */}
                    <p className="font-semibold text-black line-clamp-2 text-base md:text-lg">
                      {p.name}
                    </p>
                    <p className="text-lg md:text-xl text-black font-semibold mt-1">
                      ₪{p.price}
                    </p>
                  </div>
                </div>

                {/* Quantity controls */}
                <div className="mt-6 pt-6 border-t border-black/10">
                  <label className="block  tracking-widest uppercase text-black mb-3 font-semibold">
                    الكمية
                  </label>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={decrementQty}
                      disabled={quantity <= 1}
                      className="h-10 w-10 border border-black/10 flex items-center justify-center transition-all duration-300 hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black disabled:cursor-not-allowed"
                      aria-label="decrease quantity"
                    >
                      <FiMinus className="text-sm" />
                    </button>

                    <div className="flex-1 h-10 border border-black/10 flex items-center justify-center">
                      {/* ✅ bigger + semi-bold */}
                      <span className="text-lg font-semibold text-black">
                        {quantity}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={incrementQty}
                      disabled={quantity >= 99}
                      className="h-10 w-10 border border-black/10 flex items-center justify-center transition-all duration-300 hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black disabled:cursor-not-allowed"
                      aria-label="increase quantity"
                    >
                      <FiPlus className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Total price */}
                <div className="mt-6 flex items-center justify-between text-right">
                  <span className="tracking-widest uppercase text-black font-semibold">
                    المجموع
                  </span>
                  {/* ✅ bigger + semi-bold */}
                  <span className="text-2xl font-semibold text-black">
                    ₪{(p.price * quantity).toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="flex-1 h-12 bg-black text-white text-sm tracking-widest uppercase font-semibold hover:bg-black/90 transition-all duration-300"
                  >
                    إضافة
                  </button>

                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 h-12 border border-black/10 text-sm tracking-widest uppercase font-semibold hover:bg-black hover:text-white transition-all duration-300"
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

      <div className="h-px bg-gradient-to-r from-transparent via-black/5 to-transparent"></div>
    </div>
  );
}
