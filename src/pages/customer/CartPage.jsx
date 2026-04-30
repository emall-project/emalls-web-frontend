import { FiArrowLeft, FiRefreshCw, FiShoppingCart } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { useCart } from "../../cart/CartContext";
import { cartItemCount, formatMoney } from "../../utils/orderHubUi";

export default function CartPage() {
  const navigate = useNavigate();
  const { activeCarts, loading, error, refreshActiveCarts } = useCart();

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-12">
        <div className="mb-8 flex flex-col gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-right">
            <h1 className="text-3xl font-light tracking-wide text-black">السلال النشطة</h1>
            <p className="mt-2 text-sm text-black/50">
              كل مول يملك سلة مستقلة حتى إتمام الطلب.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/orders"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-black/10 px-4 text-sm font-semibold text-black"
            >
              طلباتي
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

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading && !activeCarts.length ? (
          <div className="py-16 text-center text-sm text-black/50">جاري تحميل السلال...</div>
        ) : null}

        {!loading && !activeCarts.length ? (
          <div className="rounded-[32px] border border-black/10 px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] text-black/35">
              <FiShoppingCart size={24} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-black">لا توجد سلال نشطة</h2>
            <p className="mt-2 text-sm text-black/50">
              أضف منتجًا من أي مول، ثم ارجع هنا لمراجعة السلة وإتمام الطلب.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {activeCarts.map((cart) => (
            <button
              key={cart.cartId || cart.mallId}
              type="button"
              onClick={() => navigate(`/cart/mall/${cart.mallId}`)}
              className="rounded-[32px] border border-black/10 p-5 text-right transition hover:border-black hover:bg-black/[0.02]"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-black">
                    {cart.mallInfo?.name || `مول #${cart.mallId}`}
                  </div>
                  <div className="mt-2 text-sm text-black/50">
                    {cartItemCount(cart)} عنصر
                    {cart.cityInfo?.name ? ` • ${cart.cityInfo.name}` : ""}
                  </div>
                </div>
                <FiArrowLeft className="shrink-0 text-black/40" />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-black/[0.03] px-3 py-3">
                  <div className="text-xs text-black/45">الإجمالي</div>
                  <div className="mt-1 text-sm font-semibold text-black">₪{formatMoney(cart.totalAmount)}</div>
                </div>
                <div className="rounded-2xl bg-black/[0.03] px-3 py-3">
                  <div className="text-xs text-black/45">التوصيل</div>
                  <div className="mt-1 text-sm font-semibold text-black">₪{formatMoney(cart.deliveryFee)}</div>
                </div>
                <div className="rounded-2xl bg-black/[0.03] px-3 py-3">
                  <div className="text-xs text-black/45">المجموع</div>
                  <div className="mt-1 text-sm font-semibold text-black">₪{formatMoney(cart.grandTotal)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
