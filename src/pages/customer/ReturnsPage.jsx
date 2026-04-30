import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiLoader, FiRotateCcw } from "react-icons/fi";
import { Link } from "react-router-dom";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { normalizeOrderHubPage, orderHubApi } from "../../api/orderHub";
import { getMediaPreviewUrl } from "../../api/mediaManager";
import { formatDateTime, formatOrderHubStatus } from "../../utils/orderHubUi";

export default function ReturnsPage() {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    orderHubApi.returns.pageMine({ page, size: 10 })
      .then((response) => {
        if (cancelled) {
          return;
        }
        const normalized = normalizeOrderHubPage(response);
        setItems(normalized.content);
        setPageInfo({
          totalPages: normalized.totalPages,
          totalElements: normalized.totalElements,
        });
      })
      .catch((requestError) => {
        if (!cancelled) {
          setItems([]);
          setError(requestError.message || "فشل تحميل طلبات الإرجاع");
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
          <h1 className="text-3xl font-light tracking-wide text-black">طلبات الإرجاع</h1>
          <p className="mt-2 text-sm text-black/50">متابعة كل الإرجاعات المقدمة وحالتها الحالية.</p>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="py-16 text-center text-sm text-black/50">
            <FiLoader className="mx-auto mb-3 animate-spin" />
            جاري تحميل طلبات الإرجاع...
          </div>
        ) : null}

        {!loading && !items.length ? (
          <div className="rounded-[32px] border border-black/10 px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] text-black/35">
              <FiRotateCcw size={24} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-black">لا توجد طلبات إرجاع</h2>
            <p className="mt-2 text-sm text-black/50">عند إرسال أول طلب إرجاع سيظهر هنا.</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {items.map((item) => (
            <Link
              key={item.returnRequestId}
              to={`/returns/${item.returnRequestId}`}
              className="block rounded-[32px] border border-black/10 p-5 text-right transition hover:border-black hover:bg-black/[0.02]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  {getMediaPreviewUrl(item.image) ? (
                    <img
                      src={getMediaPreviewUrl(item.image)}
                      alt={item.reason || "طلب إرجاع"}
                      className="h-24 w-24 rounded-[20px] object-cover"
                    />
                  ) : null}
                  <div>
                    <div className="text-lg font-semibold text-black">{item.reason || `طلب #${item.returnRequestId}`}</div>
                    <div className="mt-2 text-sm text-black/50">
                      {item.orderItem?.productName || item.shopInfo?.name || `العنصر #${item.orderItemId}`}
                    </div>
                    <div className="mt-1 text-xs text-black/35">{formatDateTime(item.createdAt)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    {formatOrderHubStatus(item.status)}
                  </div>
                  {item.rejectionReason ? (
                    <div className="mt-2 max-w-xs text-xs text-red-700">{item.rejectionReason}</div>
                  ) : null}
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
