import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiLoader, FiPackage } from "react-icons/fi";
import { Link } from "react-router-dom";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { normalizeOrderHubPage, orderHubApi } from "../../api/orderHub";
import { formatDateTime, formatMoney, formatOrderHubStatus } from "../../utils/orderHubUi";

export default function OrdersPage() {
  const [page, setPage] = useState(0);
  const [orders, setOrders] = useState([]);
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    orderHubApi.orders.pageMine({ page, size: 10 })
      .then((response) => {
        if (cancelled) {
          return;
        }
        const normalized = normalizeOrderHubPage(response);
        setOrders(normalized.content);
        setPageInfo({
          totalPages: normalized.totalPages,
          totalElements: normalized.totalElements,
        });
      })
      .catch((requestError) => {
        if (!cancelled) {
          setOrders([]);
          setError(requestError.message || "فشل تحميل الطلبات");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-12">
        <div className="mb-8 border-b border-black/10 pb-6 text-right">
          <h1 className="text-3xl font-light tracking-wide text-black">طلباتي</h1>
          <p className="mt-2 text-sm text-black/50">
            متابعة الطلبات السابقة والحالية من جميع المتاجر.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="py-16 text-center text-sm text-black/50">
            <FiLoader className="mx-auto mb-3 animate-spin" />
            جاري تحميل الطلبات...
          </div>
        ) : null}

        {!loading && !orders.length ? (
          <div className="rounded-[32px] border border-black/10 px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] text-black/35">
              <FiPackage size={24} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-black">لا توجد طلبات بعد</h2>
            <p className="mt-2 text-sm text-black/50">عندما تكمل أول عملية شراء ستظهر هنا.</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.shopOrderId}
              to={`/orders/${order.shopOrderId}`}
              className="block rounded-[32px] border border-black/10 p-5 text-right transition hover:border-black hover:bg-black/[0.02]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-lg font-semibold text-black">
                    {order.shopInfo?.name || order.storeName || `طلب #${order.shopOrderId}`}
                  </div>
                  <div className="mt-2 text-sm text-black/50">
                    {order.mallInfo?.name ? `في ${order.mallInfo.name}` : `المول #${order.mallId}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-black/45">{formatDateTime(order.createdAt)}</div>
                  <div className="mt-2 inline-flex rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    {formatOrderHubStatus(order.status)}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-black/[0.03] px-4 py-3">
                  <div className="text-xs text-black/45">عدد العناصر</div>
                  <div className="mt-1 text-sm font-semibold text-black">{order.items?.length || 0}</div>
                </div>
                <div className="rounded-2xl bg-black/[0.03] px-4 py-3">
                  <div className="text-xs text-black/45">الإجمالي</div>
                  <div className="mt-1 text-sm font-semibold text-black">₪{formatMoney(order.total)}</div>
                </div>
                <div className="rounded-2xl bg-black/[0.03] px-4 py-3">
                  <div className="text-xs text-black/45">موقع التوصيل</div>
                  <div className="mt-1 text-sm font-semibold text-black">
                    {order.deliveryInfo?.deliveryLocation || "-"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {pageInfo.totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page <= 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 text-sm font-semibold text-black disabled:opacity-40"
            >
              <FiChevronRight />
              السابق
            </button>
            <div className="text-sm text-black/55">
              صفحة {page + 1} من {pageInfo.totalPages}
            </div>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageInfo.totalPages - 1, current + 1))}
              disabled={page >= pageInfo.totalPages - 1}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 text-sm font-semibold text-black disabled:opacity-40"
            >
              التالي
              <FiChevronLeft />
            </button>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
