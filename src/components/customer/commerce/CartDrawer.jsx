import * as Dialog from "@radix-ui/react-dialog";
import { FiArrowLeft, FiLoader, FiShoppingCart, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../cart/CartContext";
import { cartItemCount, formatMoney } from "../../../utils/orderHubUi";

export default function CartDrawer({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { activeCarts, loading, error } = useCart();

  const openMallCart = (mallId) => {
    onOpenChange(false);
    navigate(`/cart/mall/${mallId}`);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          dir="rtl"
          className="fixed right-0 top-0 z-[110] flex h-screen w-full max-w-md flex-col bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-black">السلة</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-black/50">
                السلال النشطة موزعة حسب المول.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black"
                aria-label="إغلاق"
              >
                <FiX />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="flex h-full items-center justify-center text-black/50">
                <FiLoader className="animate-spin" />
              </div>
            ) : null}

            {!loading && error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {!loading && !activeCarts.length ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5 text-black/40">
                  <FiShoppingCart size={24} />
                </div>
                <p className="mt-4 text-base font-semibold text-black">السلة فارغة</p>
                <p className="mt-2 text-sm text-black/50">
                  أضف منتجًا من أي مول وسيظهر هنا تلقائيًا.
                </p>
              </div>
            ) : null}

            <div className="space-y-3">
              {activeCarts.map((cart) => (
                <button
                  key={cart.cartId || cart.mallId}
                  type="button"
                  onClick={() => openMallCart(cart.mallId)}
                  className="w-full rounded-3xl border border-black/10 p-4 text-right transition hover:border-black hover:bg-black/[0.02]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-black">
                        {cart.mallInfo?.name || `مول #${cart.mallId}`}
                      </div>
                      <div className="mt-1 text-xs text-black/50">
                        {cartItemCount(cart)} عنصر
                        {cart.cityInfo?.name ? ` • ${cart.cityInfo.name}` : ""}
                      </div>
                    </div>
                    <FiArrowLeft className="shrink-0 text-black/40" />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-2xl bg-black/[0.03] px-3 py-2">
                      <div className="text-black/40">الإجمالي</div>
                      <div className="mt-1 font-semibold text-black">₪{formatMoney(cart.totalAmount)}</div>
                    </div>
                    <div className="rounded-2xl bg-black/[0.03] px-3 py-2">
                      <div className="text-black/40">التوصيل</div>
                      <div className="mt-1 font-semibold text-black">₪{formatMoney(cart.deliveryFee)}</div>
                    </div>
                    <div className="rounded-2xl bg-black/[0.03] px-3 py-2">
                      <div className="text-black/40">المجموع</div>
                      <div className="mt-1 font-semibold text-black">₪{formatMoney(cart.grandTotal)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-black/10 px-5 py-4">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                navigate("/cart");
              }}
              className="h-12 w-full rounded-2xl bg-black text-sm font-semibold text-white"
            >
              عرض كل السلال
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
