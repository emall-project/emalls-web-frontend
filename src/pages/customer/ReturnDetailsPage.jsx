import { useEffect, useState } from "react";
import { FiLoader } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { orderHubApi, unwrapOrderHubPayload } from "../../api/orderHub";
import { getMediaPreviewUrl } from "../../api/mediaManager";
import { formatDateTime, formatOrderHubStatus, getOrderItemImage } from "../../utils/orderHubUi";

export default function ReturnDetailsPage() {
  const { returnRequestId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    orderHubApi.returns.byIdMine(returnRequestId)
      .then((response) => {
        if (!cancelled) {
          setItem(unwrapOrderHubPayload(response));
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setItem(null);
          setError(requestError.message || "فشل تحميل تفاصيل الإرجاع");
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
  }, [returnRequestId]);

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:px-12">
        <div className="mb-8 flex flex-col gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-right">
            <h1 className="text-3xl font-light tracking-wide text-black">
              {item?.reason || `طلب الإرجاع #${returnRequestId}`}
            </h1>
            <p className="mt-2 text-sm text-black/50">
              {item ? formatDateTime(item.createdAt) : "تفاصيل طلب الإرجاع"}
            </p>
          </div>
          <Link
            to="/returns"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-black/10 px-4 text-sm font-semibold text-black"
          >
            كل الإرجاعات
          </Link>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading && !item ? (
          <div className="py-16 text-center text-sm text-black/50">
            <FiLoader className="mx-auto mb-3 animate-spin" />
            جاري تحميل تفاصيل الإرجاع...
          </div>
        ) : null}

        {item ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[32px] border border-black/10 p-5">
                <div className="text-xs text-black/45">الحالة</div>
                <div className="mt-2 inline-flex rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                  {formatOrderHubStatus(item.status)}
                </div>
              </div>
              <div className="rounded-[32px] border border-black/10 p-5">
                <div className="text-xs text-black/45">رقم الطلب</div>
                <div className="mt-2 text-lg font-semibold text-black">#{item.shopOrderId || "-"}</div>
              </div>
              <div className="rounded-[32px] border border-black/10 p-5">
                <div className="text-xs text-black/45">رقم عنصر الطلب</div>
                <div className="mt-2 text-lg font-semibold text-black">#{item.orderItemId || "-"}</div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="rounded-[32px] border border-black/10 p-5">
                <h2 className="text-lg font-semibold text-black">تفاصيل الإرجاع</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="text-xs text-black/45">سبب الإرجاع</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm leading-7 text-black">{item.reason || "-"}</div>
                  </div>
                  {item.description ? (
                    <div>
                      <div className="text-xs text-black/45">الوصف</div>
                      <div className="mt-1 whitespace-pre-wrap text-sm leading-7 text-black/75">{item.description}</div>
                    </div>
                  ) : null}
                  {item.rejectionReason ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                      <div className="text-xs text-red-700/70">سبب الرفض</div>
                      <div className="mt-1 text-sm text-red-700">{item.rejectionReason}</div>
                    </div>
                  ) : null}
                </div>
              </section>

              <aside className="space-y-4">
                <div className="rounded-[32px] border border-black/10 p-5">
                  <div className="text-sm font-semibold text-black">العنصر المرتبط</div>
                  <div className="mt-4 flex gap-3">
                    <img
                      src={getOrderItemImage(item.orderItem)}
                      alt={item.orderItem?.productName || "منتج"}
                      className="h-24 w-24 rounded-[20px] object-cover"
                    />
                    <div className="text-right">
                      <div className="text-sm font-semibold text-black">{item.orderItem?.productName || "منتج"}</div>
                      <div className="mt-1 text-xs text-black/50">{item.orderItem?.variantName || "بدون متغير"}</div>
                      {item.orderItem?.productInfo?.slug || item.orderItem?.productId ? (
                        <Link
                          to={
                            item.orderItem?.productInfo?.slug
                              ? `/products/slug/${item.orderItem.productInfo.slug}`
                              : `/products/${item.orderItem?.productId}`
                          }
                          className="mt-2 inline-flex text-xs font-semibold text-black underline"
                        >
                          فتح المنتج
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>

                {getMediaPreviewUrl(item.image, "medium") ? (
                  <img
                    src={getMediaPreviewUrl(item.image, "medium")}
                    alt="صورة الإرجاع"
                    className="w-full rounded-[32px] border border-black/10 object-cover"
                  />
                ) : null}
              </aside>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
