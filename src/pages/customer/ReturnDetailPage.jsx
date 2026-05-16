import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { FiLoader, FiAlertCircle, FiRotateCcw } from "react-icons/fi";
import { IoArrowForward } from "react-icons/io5";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { returnsApi } from "../../api/returnsApi";

const STATUS = {
  PENDING:  { label: "في الانتظار", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "مقبول",       cls: "bg-green-50 text-green-700 border-green-200" },
  REJECTED: { label: "مرفوض",       cls: "bg-red-50 text-red-700 border-red-200" },
};

function StatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status || "غير معروف", cls: "bg-slate-50 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-block rounded-full border px-3 py-1.5 text-sm font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function parseDate(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m, d, h, min, s] = value;
    const dt = new Date(y, Math.max((m ?? 1) - 1, 0), d ?? 1, h ?? 0, min ?? 0, s ?? 0);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(String(value).replace(" ", "T"));
  return isNaN(dt.getTime()) ? null : dt;
}

function formatDateTime(value) {
  const d = parseDate(value);
  if (!d) return "";
  return d.toLocaleString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function InfoCard({ label, children }) {
  return (
    <div className="customer-panel px-5 py-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      {children}
    </div>
  );
}

export default function ReturnDetailPage() {
  const { returnRequestId } = useParams();
  const [item, setItem]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    returnsApi.byIdMine(returnRequestId)
      .then(data => { if (!cancelled) setItem(data); })
      .catch(err  => { if (!cancelled) setError(err.message || "فشل تحميل تفاصيل الإرجاع"); })
      .finally(()  => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [returnRequestId]);

  if (loading) {
    return (
      <div dir="rtl" className="customer-page flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <FiLoader size={28} className="animate-spin text-slate-400" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div dir="rtl" className="customer-page flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="customer-panel-strong max-w-md px-8 py-10 text-center">
            <FiAlertCircle className="mx-auto mb-4 text-4xl text-slate-300" />
            <p className="mb-5 text-sm leading-7 text-slate-600">{error || "لم يتم العثور على طلب الإرجاع."}</p>
            <Link to="/returns" className="customer-primary-btn inline-flex">
              طلبات الإرجاع
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const thumb = item.image?.mediumFileUrl || item.image?.originalFileUrl || item.image?.smallFileUrl;
  const productImg = item.orderItem?.productInfo?.thumbnailUrl
    || item.orderItem?.productInfo?.imageUrl
    || null;

  return (
    <div dir="rtl" className="customer-page min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 customer-shell px-4 py-8 sm:px-6 md:px-12">
        {/* Header */}
        <div className="customer-page-header customer-panel-strong px-5 py-5 sm:px-6 mb-8">
          <div>
            <span className="customer-kicker">
              <FiRotateCcw size={14} />
              تفاصيل طلب الإرجاع
            </span>
            <h1 className="customer-page-title mt-3">
              {item.reason || `طلب إرجاع #${item.returnRequestId}`}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{formatDateTime(item.createdAt)}</p>
          </div>
          <Link to="/returns" className="customer-secondary-btn shrink-0 mt-4 sm:mt-0">
            <IoArrowForward className="text-base" />
            كل الإرجاعات
          </Link>
        </div>

        {/* Status row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <InfoCard label="الحالة">
            <StatusBadge status={item.status} />
          </InfoCard>
          <InfoCard label="رقم الطلب">
            <p className="text-lg font-bold text-slate-900">#{item.shopOrderId || "—"}</p>
          </InfoCard>
          <InfoCard label="رقم العنصر">
            <p className="text-lg font-bold text-slate-900">#{item.orderItemId || "—"}</p>
          </InfoCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Details */}
          <div className="customer-panel px-5 py-5 space-y-5">
            <h2 className="text-base font-extrabold text-slate-900">تفاصيل الإرجاع</h2>

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">سبب الإرجاع</p>
              <p className="text-sm leading-7 text-slate-800 whitespace-pre-wrap">{item.reason || "—"}</p>
            </div>

            {item.description && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">الوصف</p>
                <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            {item.status === "REJECTED" && item.rejectionReason && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-semibold text-red-600 mb-1">سبب الرفض</p>
                <p className="text-sm text-red-700">{item.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Order item */}
            <div className="customer-panel px-5 py-5">
              <p className="text-xs font-semibold text-slate-400 mb-3">العنصر المرتبط</p>
              <div className="flex gap-3">
                {productImg && (
                  <img src={productImg} alt="" className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">
                    {item.orderItem?.productName || "منتج"}
                  </p>
                  {item.orderItem?.variantName && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.orderItem.variantName}</p>
                  )}
                  {item.orderItem?.quantity != null && (
                    <p className="text-xs text-slate-400 mt-1">الكمية: {item.orderItem.quantity}</p>
                  )}
                  {item.orderItem?.unitPrice != null && (
                    <p className="text-xs text-slate-400 mt-0.5">السعر: ₪{item.orderItem.unitPrice}</p>
                  )}
                  {(item.orderItem?.productInfo?.slug || item.orderItem?.productId) && (
                    <Link
                      to={item.orderItem?.productInfo?.slug
                        ? `/products/${item.orderItem.productInfo.slug}`
                        : `/products/${item.orderItem.productId}`}
                      className="text-xs font-semibold text-blue-600 underline mt-2 inline-block"
                    >
                      فتح المنتج
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Return image */}
            {thumb && (
              <div className="customer-panel overflow-hidden p-0">
                <img src={thumb} alt="صورة الإرجاع" className="w-full rounded-3xl object-cover max-h-64" />
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
