import React, { useState } from "react";
import { FiShoppingCart } from "react-icons/fi";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Dialog from "@radix-ui/react-dialog";
import { isDiscount, discountAmount, isOutOfStock } from "../../utils/tmpProducts";

export default function ProductCard({ p, onAddToCart }) {
  const discount = isDiscount(p);
  const save = discountAmount(p);
  const out = isOutOfStock(p);

  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    onAddToCart?.(p);
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* image */}
      <div className="relative bg-gray-100">
        {discount && (
          <div className="absolute top-3 right-3 bg-[#1A73E8] text-white text-xs font-bold px-2 py-1 rounded-b-xl rounded-tl-xl">
            وفر ₪{save}
          </div>
        )}

        {out && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
              نفذت الكمية
            </span>
          </div>
        )}

        <img
          src={p.imageUrl}
          alt={p.name}
          className="w-full md:h-[300px] h-[190px] object-cover"
          loading="lazy"
        />
      </div>

      {/* content */}
      <div className="p-2 text-right">
        <p className="font-bold text-sm text-gray-900 line-clamp-1">{p.name}</p>

        <div className="mt-2 flex items-center justify-between gap-2">
          {/* price */}
          <div className="text-right leading-tight">
            <div className="flex items-end gap-2 justify-end">
              <p className="font-extrabold text-gray-900 text-lg">₪ {p.price}</p>

              {discount && (
                <p className="text-xs text-[#1A73E8] line-through pb-0.5">₪ {p.oldPrice}</p>
              )}
            </div>

          </div>

        
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Dialog.Trigger asChild>
                    <button
                      type="button"
                      disabled={out}
                      className={[
                        "h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center transition",
                        out
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-gray-50 hover:border-gray-300 active:scale-95",
                      ].join(" ")}
                      aria-label="add to cart"
                    >
                      <FiShoppingCart className="text-[#1A73E8]" />
                    </button>
                  </Dialog.Trigger>
                </Tooltip.Trigger>

                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    align="center"
                    className="rounded-lg bg-gray-900 text-white text-xs px-2 py-1 shadow"
                  >
                    إضافة للسلة
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>

            
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
              <Dialog.Content
                className="
                  fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[92vw] max-w-md
                  rounded-2xl bg-white border border-gray-200 shadow-xl
                  p-4
                "
                dir="rtl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-right">
                    <Dialog.Title className="font-extrabold text-gray-900">
                      إضافة إلى السلة
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-600 mt-1">
                      هل تريد إضافة هذا المنتج إلى السلة؟
                    </Dialog.Description>
                  </div>

                  <Dialog.Close
                    className="h-8 w-8 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                    aria-label="close"
                  >
                    ✕
                  </Dialog.Close>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                  />
                  <div className="min-w-0 text-right">
                    <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                    <p className="text-sm text-gray-700 font-semibold">₪ {p.price}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="flex-1 h-10 rounded-xl bg-[#1A73E8] text-white font-bold hover:opacity-90"
                  >
                    إضافة
                  </button>

                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 h-10 rounded-xl border border-gray-200 font-bold hover:bg-gray-50"
                    >
                      إلغاء
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <p className="mt-1 text-xs text-gray-500 line-clamp-1">{p.status}</p>
      </div>
    </div>
  );
}
