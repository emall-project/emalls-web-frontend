import { useEffect, useMemo, useState } from "react";
import { FiLoader, FiRotateCcw } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import ReturnRequestDialog from "../../components/customer/commerce/ReturnRequestDialog";
import { orderHubApi, unwrapOrderHubPayload } from "../../api/orderHub";
import { formatDateTime, formatMoney, formatOrderHubStatus, getOrderItemImage } from "../../utils/orderHubUi";

function DeliverySummary({ order }) {
  const deliveryInfo = order?.deliveryInfo || {};
  return (
    <div className="rounded-[32px] border border-black/10 p-5">
      <h2 className="text-lg font-semibold text-black">بيانات التوصيل</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-black/[0.03] px-4 py-3">
          <div className="text-xs text-black/45">المستلم</div>
          <div className="mt-1 text-sm font-semibold text-black">{deliveryInfo.deliveryName || "-"}</div>
        </div>
        <div className="rounded-2xl bg-black/[0.03] px-4 py-3">
          <div className="text-xs text-black/45">الهاتف</div>
          <div className="mt-1 text-sm font-semibold text-black">
            {[deliveryInfo.deliveryPhone?.prefix, deliveryInfo.deliveryPhone?.number].filter(Boolean).join(" " ) || "-"}
          </div>
        </div>
        <div className="rounded-2xl bg-black/[0.03] px-4 py-3 sm:col-span-2">
          <div className="text-xs text-black/45">الموقع</div>
          <div className="mt-1 text-sm font-semibold text-black">{deliveryInfo.deliveryLocation || "-"}</div>
        </div>
        {deliveryInfo.deliveryNote ? (
          <div className="rounded-2xl bg-black/[0.03] px-4 py-3 sm:col-span-2">
            <div className="text-xs text-black/45">ملاحظة</div>
            <div className="mt-1 text-sm font-semibold text-black">{deliveryInfo.deliveryNote}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const { shopOrderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const loadOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await orderHubApi.orders.byIdMine(shopOrderId);
      setOrder(unwrapOrderHubPayload(response));
    } catch (requestError) {
      setOrder(null);
      setError(requestError.message || "فشل تحميل تفاصيل الطلب");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [shopOrderId]);

  const summary = useMemo(
    () => ({
      totalItems: (order?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      totalPrice: order?.total || 0,
    }),
    [order]
  );

  const submitReturn = async (payload) => {
    setSubmittingReturn(true);
    try {
      await orderHubApi.returns.create(payload);
      await loadOrder();
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-12">
        <div className="mb-8 flex flex-col gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-right">
            <h1 className="text-3xl font-light tracking-wide text-black">
              {order?.shopInfo?.name || `الطلب #${shopOrderId}`}
            </h1>
            <p className="mt-2 text-sm text-black/50">
              {order?.mallInfo?.name ? `في ${order.mallInfo.name}` : "تفاصيل الطلب"} • {order ? formatDateTime(order.createdAt) : "-"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/orders"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-black/10 px-4 text-sm font-semibold text-black"
            >
              كل الطلبات
            </Link>
            <button
              type="button"
              onClick={loadOrder}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 text-sm font-semibold text-black"
            >
              <FiLoader className={loading ? "animate-spin" : ""} />
              تحديث
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading && !order ? (
          <div className="py-16 text-center text-sm text-black/50">جاري تحميل الطلب...</div>
        ) : null}

        {order ? (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[32px] border border-black/10 p-5">
                <div className="text-xs text-black/45">الحالة</div>
                <div className="mt-2 inline-flex rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                  {formatOrderHubStatus(order.status)}
                </div>
              </div>
              <div className="rounded-[32px] border border-black/10 p-5">
                <div className="text-xs text-black/45">عدد العناصر</div>
                <div className="mt-2 text-lg font-semibold text-black">{summary.totalItems}</div>
              </div>
              <div className="rounded-[32px] border border-black/10 p-5">
                <div className="text-xs text-black/45">الإجمالي</div>
                <div className="mt-2 text-lg font-semibold text-black">₪{formatMoney(summary.totalPrice)}</div>
              </div>
            </div>

            <div className="space-y-4">
              {(order.items || []).map((item) => (
                <div key={item.orderItemId} className="rounded-[32px] border border-black/10 p-5">
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
                          {item.productInfo?.slug || item.productId ? (
                            <Link
                              to={item.productInfo?.slug ? `/products/slug/${item.productInfo.slug}` : `/products/${item.productId}`}
                              className="mt-2 inline-flex text-xs font-semibold text-black underline"
                            >
                              فتح صفحة المنتج
                            </Link>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-black/45">الحالة</div>
                          <div className="mt-1 text-sm font-semibold text-black">
                            {formatOrderHubStatus(item.status)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-black/[0.03] px-4 py-3">
                          <div className="text-xs text-black/45">الكمية</div>
                          <div className="mt-1 text-sm font-semibold text-black">{item.quantity}</div>
                        </div>
                        <div className="rounded-2xl bg-black/[0.03] px-4 py-3">
                          <div className="text-xs text-black/45">سعر الوحدة</div>
                          <div className="mt-1 text-sm font-semibold text-black">₪{formatMoney(item.unitPrice)}</div>
                        </div>
                        <div className="rounded-2xl bg-black/[0.03] px-4 py-3">
                          <div className="text-xs text-black/45">الإجمالي</div>
                          <div className="mt-1 text-sm font-semibold text-black">₪{formatMoney(item.lineTotal)}</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        {item.returnRequest?.returnRequestId ? (
                          <Link
                            to={`/returns/${item.returnRequest?.returnRequestId}`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-black"
                          >
                            <FiRotateCcw />
                            حالة طلب الإرجاع
                          </Link>
                        ) : item.hasReturnRequest ? (
                          <Link
                            to="/returns"
                            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-black"
                          >
                            <FiRotateCcw />
                            يوجد طلب إرجاع لهذا العنصر
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setReturnDialogOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-black"
                          >
                            <FiRotateCcw />
                            طلب إرجاع
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <DeliverySummary order={order} />
            </div>
          </>
        ) : null}
      </main>

      <ReturnRequestDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        orderItem={selectedItem}
        submitting={submittingReturn}
        onSubmit={submitReturn}
      />
      <Footer />
    </div>
  );
}
