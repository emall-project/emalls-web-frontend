import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiLoader,
  FiPackage,
  FiRotateCcw,
} from "react-icons/fi";

import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { ReturnRequestDialog } from "../../components/customer/ReturnRequestDialog";
import { cartApi } from "../../api/cartApi";
import { returnsApi } from "../../api/returnsApi";

const STATUS = {
  PENDING: { label: "في الانتظار", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "مقبول", cls: "bg-green-50 text-green-700 border-green-200" },
  REJECTED: { label: "مرفوض", cls: "bg-red-50 text-red-700 border-red-200" },
};

function StatusBadge({ status }) {
  const current = STATUS[status] ?? {
    label: status || "غير معروف",
    cls: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-[11px] font-semibold ${current.cls}`}>
      {current.label}
    </span>
  );
}

function parseDate(value) {
  if (!value) return null;

  if (Array.isArray(value)) {
    const [year, month, day, hour, minute, second] = value;
    const parsed = new Date(
      year ?? 0,
      Math.max((month ?? 1) - 1, 0),
      day ?? 1,
      hour ?? 0,
      minute ?? 0,
      second ?? 0
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const parsed = parseDate(value);
  if (!parsed) return "";

  return parsed.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value) {
  const parsed = parseDate(value);
  if (!parsed) return "";

  return parsed.toLocaleString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isReturnWindowOpen(value) {
  const parsed = parseDate(value);
  if (!parsed) return false;
  return parsed.getTime() > Date.now();
}

function getProductThumb(item) {
  return (
    item?.productInfo?.thumbnailUrl ||
    item?.productInfo?.imageUrl ||
    item?.productInfo?.mediumFileUrl ||
    item?.productInfo?.originalFileUrl ||
    ""
  );
}

function getReturnThumb(item) {
  return (
    item?.image?.smallFileUrl ||
    item?.image?.mediumFileUrl ||
    item?.image?.originalFileUrl ||
    getProductThumb(item?.orderItem) ||
    ""
  );
}

function collectReturnableItems(orders = []) {
  return orders
    .flatMap((order) => {
      const orderItems = Array.isArray(order?.items) ? order.items : [];

      return orderItems
        .filter((item) =>
          item?.status === "HOLDING" &&
          isReturnWindowOpen(item?.holdingExpiresAt) &&
          !item?.hasReturnRequest &&
          !item?.returnRequest?.returnRequestId
        )
        .map((item) => ({
          ...item,
          orderId: order?.shopOrderId,
          orderCreatedAt: order?.createdAt,
          storeName: order?.storeName || order?.shopInfo?.name || `طلب #${order?.shopOrderId ?? ""}`,
          mallName: order?.mallInfo?.name || "",
        }));
    })
    .sort((left, right) => {
      const leftExpiry = parseDate(left?.holdingExpiresAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightExpiry = parseDate(right?.holdingExpiresAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;

      if (leftExpiry !== rightExpiry) {
        return leftExpiry - rightExpiry;
      }

      const leftCreated = parseDate(left?.orderCreatedAt)?.getTime() ?? 0;
      const rightCreated = parseDate(right?.orderCreatedAt)?.getTime() ?? 0;
      return rightCreated - leftCreated;
    });
}

export default function ReturnsPage() {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [returnableItems, setReturnableItems] = useState([]);
  const [returnableLoading, setReturnableLoading] = useState(false);
  const [returnableError, setReturnableError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!successMessage) return undefined;

    const timeout = window.setTimeout(() => setSuccessMessage(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    returnsApi.pageMine(page, 10)
      .then(({ content, totalPages: nextTotalPages }) => {
        if (cancelled) return;
        setItems(content);
        setTotalPages(nextTotalPages);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setItems([]);
        setError(loadError.message || "فشل تحميل طلبات الإرجاع");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, refreshKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadReturnableItems() {
      setReturnableLoading(true);
      setReturnableError("");

      try {
        const orders = [];
        let nextPage = 0;
        let total = 1;

        do {
          const response = await cartApi.getOrders(nextPage, 50);
          if (cancelled) return;

          const content = Array.isArray(response?.content) ? response.content : [];
          orders.push(...content);

          const reportedTotal = Number(response?.meta?.totalPages ?? response?.totalPages ?? 1);
          total = Number.isFinite(reportedTotal) && reportedTotal > 0 ? reportedTotal : 1;
          nextPage += 1;
        } while (nextPage < total);

        if (cancelled) return;
        setReturnableItems(collectReturnableItems(orders));
      } catch (loadError) {
        if (cancelled) return;
        setReturnableItems([]);
        setReturnableError(loadError.message || "تعذر تحميل العناصر المتاحة للإرجاع");
      } finally {
        if (!cancelled) setReturnableLoading(false);
      }
    }

    loadReturnableItems();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const openReturnDialog = (orderItem) => {
    setSelectedOrderItem(orderItem);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedOrderItem(null);
    }
  };

  const handleReturnSubmit = async (body) => {
    if (!isReturnWindowOpen(selectedOrderItem?.holdingExpiresAt)) {
      throw new Error("انتهت نافذة الإرجاع لهذا العنصر.");
    }
    await returnsApi.create(body);
    setSuccessMessage("تم إرسال طلب الإرجاع بنجاح.");
    setPage(0);
    setRefreshKey((current) => current + 1);
  };

  return (
    <div dir="rtl" className="customer-page min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 customer-shell px-4 py-8 sm:px-6 md:px-12">
        <div className="customer-page-header customer-panel-strong px-5 py-5 sm:px-6 mb-8">
          <div>
            <span className="customer-kicker">
              <FiRotateCcw size={14} />
              طلبات الإرجاع
            </span>
            <h1 className="customer-page-title mt-3">إرجاعاتي</h1>
            <p className="mt-1 text-sm text-slate-500">
              يمكنك تقديم طلب جديد للعناصر التي ما زالت داخل نافذة الإرجاع، ثم متابعة حالة كل الطلبات من نفس الصفحة.
            </p>
          </div>
          <Link to="/orders" className="customer-secondary-btn shrink-0 mt-4 sm:mt-0">
            طلباتي
          </Link>
        </div>

        {successMessage && (
          <div className="mb-6 flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <FiRotateCcw className="mt-0.5 shrink-0" size={15} />
            {successMessage}
          </div>
        )}

        <section className="customer-panel px-5 py-5 sm:px-6 mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">العناصر المتاحة للإرجاع</h2>
              <p className="mt-1 text-sm text-slate-500">
                يعتمد هذا القسم على حالة العنصر في الخلفية، ويظهر فقط العناصر التي ما زالت داخل نافذة
                الإرجاع الحالية مع شرط إرفاق صورة توضيحية.
              </p>
            </div>
            <Link to="/orders" className="customer-secondary-btn shrink-0">
              عرض الطلبات
            </Link>
          </div>

          {returnableError && (
            <div className="mt-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
              <div className="flex-1">
                <p>{returnableError}</p>
                <button
                  type="button"
                  onClick={() => setRefreshKey((current) => current + 1)}
                  className="mt-2 text-xs font-semibold underline"
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          )}

          {returnableLoading ? (
            <div className="py-12 text-center">
              <FiLoader className="mx-auto animate-spin text-slate-400 mb-3" size={24} />
              <p className="text-sm text-slate-500">جارٍ تحميل العناصر المتاحة للإرجاع...</p>
            </div>
          ) : returnableItems.length ? (
            <div className="mt-6 space-y-4">
              {returnableItems.map((item) => {
                const thumb = getProductThumb(item);

                return (
                  <div
                    key={`${item.orderId}-${item.orderItemId}`}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="h-20 w-20 rounded-2xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <FiPackage size={24} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">
                          {item?.productName || `العنصر #${item?.orderItemId ?? ""}`}
                        </p>
                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          متاح الآن
                        </span>
                      </div>

                      {item?.variantName ? (
                        <p className="mt-1 text-xs text-slate-500">{item.variantName}</p>
                      ) : null}

                      <p className="mt-2 text-sm text-slate-500">
                        {item?.storeName}
                        {item?.mallName ? ` • ${item.mallName}` : ""}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>طلب #{item?.orderId ?? "—"}</span>
                        <span>الكمية: {item?.quantity ?? 0}</span>
                        {item?.holdingExpiresAt ? (
                          <span className="text-amber-700">
                            ينتهي في {formatDateTime(item.holdingExpiresAt)}
                          </span>
                        ) : null}
                      </div>

                      <Link
                        to={`/orders/${item?.orderId}`}
                        className="mt-3 inline-flex text-xs font-semibold text-blue-600 underline"
                      >
                        فتح الطلب
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => openReturnDialog(item)}
                      className="customer-primary-btn shrink-0"
                    >
                      طلب إرجاع
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                <FiClock size={22} />
              </div>
              <h3 className="text-base font-semibold text-slate-900">لا توجد عناصر قابلة للإرجاع الآن</h3>
              <p className="mt-2 text-sm text-slate-500">
                سيظهر هنا فقط ما كان داخل نافذة الإرجاع الحالية ولم يُرسل له طلب سابق.
              </p>
            </div>
          )}
        </section>

        <section className="customer-panel px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">طلبات الإرجاع المرسلة</h2>
            <p className="mt-1 text-sm text-slate-500">متابعة كل الطلبات التي أرسلتها وحالتها الحالية.</p>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center">
              <FiLoader className="mx-auto animate-spin text-slate-400 mb-3" size={24} />
              <p className="text-sm text-slate-500">جارٍ تحميل طلبات الإرجاع...</p>
            </div>
          ) : !items.length ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                <FiRotateCcw size={22} />
              </div>
              <h3 className="text-base font-semibold text-slate-900">لم تُرسل أي طلبات إرجاع بعد</h3>
              <p className="mt-2 text-sm text-slate-500">
                عندما ترسل أول طلب سيظهر هنا مع حالته وتاريخ إنشائه.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {items.map((item) => {
                const id = item?.returnRequestId ?? item?.id;
                const thumb = getReturnThumb(item);

                return (
                  <Link
                    key={id}
                    to={`/returns/${id}`}
                    className="block rounded-3xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-400"
                  >
                    <div className="flex items-start gap-4">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-16 w-16 rounded-2xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <FiRotateCcw size={20} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">
                          {item?.reason || `طلب إرجاع #${id}`}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {item?.orderItem?.productName || `العنصر #${item?.orderItemId ?? "—"}`}
                        </p>
                        {item?.rejectionReason ? (
                          <p className="text-xs text-red-600 mt-1 truncate">
                            سبب الرفض: {item.rejectionReason}
                          </p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span>{formatDate(item?.createdAt)}</span>
                          {item?.shopOrderId ? <span>طلب #{item.shopOrderId}</span> : null}
                        </div>
                      </div>

                      <StatusBadge status={item?.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0}
              className="customer-secondary-btn disabled:opacity-40"
            >
              <FiChevronRight size={16} />
              السابق
            </button>
            <span className="text-sm text-slate-500">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
              disabled={page >= totalPages - 1}
              className="customer-secondary-btn disabled:opacity-40"
            >
              التالي
              <FiChevronLeft size={16} />
            </button>
          </div>
        )}
      </main>

      <Footer />

      <ReturnRequestDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        orderItem={selectedOrderItem}
        onSubmit={handleReturnSubmit}
      />
    </div>
  );
}
