import { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiLoader, FiMinus, FiPlus, FiRefreshCw, FiShoppingBag, FiTrash2, FiXCircle } from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import CheckoutDialog from "../../components/customer/commerce/CheckoutDialog";
import { useCart } from "../../cart/CartContext";
import { formatMoney, getOrderItemImage } from "../../utils/orderHubUi";

function EmptyState({ mallId }) {
  return (
    <div className="rounded-[32px] border border-black/10 px-6 py-14 text-center">
      <h2 className="text-xl font-semibold text-black">لا توجد سلة نشطة لهذا المول</h2>
      <p className="mt-2 text-sm text-black/50">
        قد تكون السلة أُلغيت أو تم إتمام طلبها بالفعل.
      </p>
      <p className="mt-1 text-xs text-black/35">معرّف المول: #{mallId}</p>
    </div>
  );
}

export default function MallCartPage() {
  const { mallId } = useParams();
  const navigate = useNavigate();
  const {
    activeCarts,
    loading,
    error,
    refreshActiveCarts,
    getCartByMall,
    updateQuantity,
    removeItem,
    clearMall,
    cancelMall,
    updateDelivery,
    checkout,
  } = useCart();
  const [pageLoading, setPageLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionKey, setActionKey] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const cart = useMemo(
    () => activeCarts.find((item) => String(item.mallId) === String(mallId)) || null,
    [activeCarts, mallId]
  );

  useEffect(() => {
    if (cart || loading) {
      return;
    }

    setPageLoading(true);
    getCartByMall(mallId)
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, [cart, getCartByMall, loading, mallId]);

  const mutate = async (key, action) => {
    setActionKey(key);
    setActionError("");
    try {
      await action();
    } catch (requestError) {
      setActionError(requestError.message || "فشلت العملية");
    } finally {
      setActionKey("");
    }
  };

  const handleCheckout = async (payload) => {
    if (!cart?.cartId) {
      return;
    }

    setActionKey("checkout");
    setActionError("");
    try {
      await updateDelivery(cart.cartId, payload);
      const orders = await checkout(mallId, payload);
      await refreshActiveCarts().catch(() => {});

      if (orders.length === 1 && orders[0]?.shopOrderId) {
        navigate(`/orders/${orders[0].shopOrderId}`);
        return;
      }

      navigate("/orders");
    } catch (requestError) {
      setActionError(requestError.message || "فشل إتمام الطلب");
      throw requestError;
    } finally {
      setActionKey("");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-12">
        <div className="mb-8 flex flex-col gap-4 border-b border-black/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="text-right">
            <h1 className="text-3xl font-light tracking-wide text-black">
              {cart?.mallInfo?.name || `سلة المول #${mallId}`}
            </h1>
            <p className="mt-2 text-sm text-black/50">
              راجع المنتجات وبيانات التوصيل قبل إتمام الطلب.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/cart"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-black/10 px-4 text-sm font-semibold text-black"
            >
              كل السلال
            </Link>
            <button
              type="button"
              onClick={() => refreshActiveCarts().catch(() => {})}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 text-sm font-semibold text-black"
            >
              <FiRefreshCw />
              تحديث
            </button>
          </div>
        </div>

        {error || actionError ? (
          <div className="mb-6 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            {actionError || error}
          </div>
        ) : null}

        {(loading || pageLoading) && !cart ? (
          <div className="py-16 text-center text-sm text-black/50">
            <FiLoader className="mx-auto mb-3 animate-spin" />
            جاري تحميل السلة...
          </div>
        ) : null}

        {!loading && !pageLoading && !cart ? <EmptyState mallId={mallId} /> : null}

        {cart ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-4">
              {cart.items?.map((item) => (
                <div
                  key={item.cartItemId}
                  className="rounded-[32px] border border-black/10 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <img
                      src={getOrderItemImage(item)}
                      alt={item.productName || "منتج"}
                      className="h-28 w-full rounded-[24px] object-cover sm:h-32 sm:w-32"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-black">{item.productName}</div>
                          <div className="mt-1 text-sm text-black/50">{item.variantName || "بدون متغير"}</div>
                          {item.storeInfo?.name ? (
                            <div className="mt-1 text-xs text-black/35">{item.storeInfo.name}</div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => mutate(`remove-${item.cartItemId}`, () => removeItem(item.cartItemId))}
                          disabled={actionKey === `remove-${item.cartItemId}`}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-200 px-3 text-sm text-red-700"
                        >
                          {actionKey === `remove-${item.cartItemId}` ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                          حذف
                        </button>
                      </div>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              mutate(`qty-${item.cartItemId}`, () =>
                                updateQuantity(item.cartItemId, {
                                  quantity: Math.max(1, Number(item.quantity || 1) - 1),
                                })
                              )
                            }
                            disabled={Number(item.quantity || 1) <= 1 || actionKey === `qty-${item.cartItemId}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10"
                          >
                            <FiMinus />
                          </button>
                          <div className="min-w-14 rounded-2xl border border-black/10 px-3 py-2 text-center text-sm font-semibold text-black">
                            {item.quantity}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              mutate(`qty-${item.cartItemId}`, () =>
                                updateQuantity(item.cartItemId, {
                                  quantity: Number(item.quantity || 1) + 1,
                                })
                              )
                            }
                            disabled={actionKey === `qty-${item.cartItemId}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10"
                          >
                            {actionKey === `qty-${item.cartItemId}` ? <FiLoader className="animate-spin" /> : <FiPlus />}
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-black/45">سعر الوحدة</div>
                          <div className="mt-1 text-sm font-semibold text-black">
                            ₪{formatMoney(item.effectiveUnitPrice ?? item.discountedPrice ?? item.basePrice)}
                          </div>
                          <div className="mt-1 text-xs text-black/45">
                            الإجمالي: ₪{formatMoney(item.lineTotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <aside className="rounded-[32px] border border-black/10 p-5">
              <div className="flex items-center gap-2 text-base font-semibold text-black">
                <FiShoppingBag />
                ملخص السلة
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-black/50">اسم المول</span>
                  <span className="font-semibold text-black">{cart.mallInfo?.name || `#${cart.mallId}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/50">عدد المنتجات</span>
                  <span className="font-semibold text-black">
                    {(cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/50">إجمالي المنتجات</span>
                  <span className="font-semibold text-black">₪{formatMoney(cart.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/50">رسوم التوصيل</span>
                  <span className="font-semibold text-black">₪{formatMoney(cart.deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-black/10 pt-3 text-base">
                  <span className="text-black">المجموع النهائي</span>
                  <span className="font-semibold text-black">₪{formatMoney(cart.grandTotal)}</span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(true)}
                  disabled={actionKey === "checkout"}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white disabled:opacity-60"
                >
                  {actionKey === "checkout" ? <FiLoader className="animate-spin" /> : "إتمام الطلب"}
                </button>
                <button
                  type="button"
                  onClick={() => mutate("clear", () => clearMall(mallId))}
                  disabled={actionKey === "clear"}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-black/10 text-sm font-semibold text-black"
                >
                  {actionKey === "clear" ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                  تفريغ السلة
                </button>
                <button
                  type="button"
                  onClick={() => mutate("cancel", () => cancelMall(mallId))}
                  disabled={actionKey === "cancel"}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 text-sm font-semibold text-red-700"
                >
                  {actionKey === "cancel" ? <FiLoader className="animate-spin" /> : <FiXCircle />}
                  إلغاء السلة
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-black/[0.03] px-4 py-3 text-xs leading-6 text-black/55">
                يمكن تعديل بيانات التوصيل أثناء الإتمام. سيقوم الخادم بإعادة احتساب رسوم المدينة
                ثم إنشاء الطلبات الخاصة بالمتاجر داخل هذا المول.
              </div>
            </aside>
          </div>
        ) : null}
      </main>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        submitting={actionKey === "checkout"}
        onSubmit={handleCheckout}
      />
      <Footer />
    </div>
  );
}
