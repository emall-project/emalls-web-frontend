import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  IoArrowForward,
  IoBusinessOutline,
  IoReceiptOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import { FiAlertCircle, FiChevronLeft, FiLoader, FiRotateCcw } from "react-icons/fi";

import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { cartApi } from "../../api/cartApi";

const STATUS_LABEL = {
  NEW: { text: "طلب جديد", cls: "bg-blue-50 text-blue-600 border-blue-200" },
  PREPARING: { text: "قيد التحضير", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  READY_FOR_PICKUP: { text: "جاهز للاستلام", cls: "bg-teal-50 text-teal-600 border-teal-200" },
  OUT_FOR_DELIVERY: { text: "في الطريق إليك", cls: "bg-purple-50 text-purple-600 border-purple-200" },
  DELIVERED: { text: "تم التسليم", cls: "bg-green-50 text-green-600 border-green-200" },
  CUSTOMER_REJECTED: { text: "مرفوض", cls: "bg-red-50 text-red-600 border-red-200" },
  NO_RESPONSE: { text: "لم يتم الرد", cls: "bg-neutral-50 text-neutral-500 border-neutral-200" },
};

function StatusBadge({ status }) {
  const current = STATUS_LABEL[status] ?? {
    text: status || "غير معروف",
    cls: "bg-neutral-50 text-neutral-500 border-neutral-200",
  };

  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-[11px] font-semibold ${current.cls}`}>
      {current.text}
    </span>
  );
}

function formatAmount(value) {
  return Number(value ?? 0).toFixed(2);
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
    month: "short",
    day: "numeric",
  });
}

function getOrderLabel(order) {
  return order?.storeName || order?.shopInfo?.name || `طلب #${order?.shopOrderId ?? ""}`;
}

function getOrderMall(order) {
  return order?.mallInfo?.name || "";
}

function OrderRow({ order, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-right hover:border-blue-200 hover:bg-blue-50/30"
    >
      <div className="customer-icon-chip h-12 w-12 shrink-0 text-base">
        <IoStorefrontOutline />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{getOrderLabel(order)}</span>
          <StatusBadge status={order?.status} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {getOrderMall(order) ? (
            <span className="flex items-center gap-1">
              <IoBusinessOutline className="text-xs" />
              {getOrderMall(order)}
            </span>
          ) : null}
          <span className="font-mono">#{order?.shopOrderId}</span>
          {order?.createdAt ? <span>{formatDate(order.createdAt)}</span> : null}
        </div>

        <p className="text-sm font-extrabold text-slate-900">₪{formatAmount(order?.total)}</p>
      </div>

      <FiChevronLeft className="shrink-0 text-slate-300 transition-colors group-hover:text-blue-600" />
    </button>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (nextPage = 0, append = false) => {
    if (nextPage === 0) setLoading(true);
    else setLoadingMore(true);
    setError("");

    try {
      const data = await cartApi.getOrders(nextPage, 20);
      const list = Array.isArray(data?.content) ? data.content : [];
      const pages = Number(data?.meta?.totalPages ?? 0);
      setOrders((prev) => (append ? [...prev, ...list] : list));
      setTotalPages(pages);
      setPage(nextPage);
    } catch (loadError) {
      setError(loadError.message || "تعذر تحميل الطلبات");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <div dir="rtl" className="customer-page">
      <Header />

      <div className="customer-shell px-4 py-8 sm:px-6 md:px-12 md:py-10">
        <div className="customer-page-header customer-panel-strong px-5 py-5 sm:px-6 md:px-8">
          <div>
            <span className="customer-kicker">
              <IoReceiptOutline />
              متابعة الطلبات
            </span>
            <h1 className="customer-page-title mt-4">طلباتي</h1>
            <p className="customer-page-subtitle">
              كل طلباتك في مكان واحد، مع حالة واضحة وسهلة المتابعة من دون ازدحام بصري.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link to="/returns" className="customer-secondary-btn">
              <FiRotateCcw className="text-sm" />
              إرجاعاتي
            </Link>
            <button type="button" onClick={() => navigate(-1)} className="customer-secondary-btn">
              <IoArrowForward className="text-base" />
              رجوع
            </button>
          </div>
        </div>

        <div className="customer-divider my-8" />

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <FiLoader size={26} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="customer-panel-strong mx-auto max-w-md px-8 py-10 text-center">
            <FiAlertCircle className="mx-auto mb-4 text-4xl text-slate-300" />
            <p className="mb-5 text-sm leading-7 text-slate-600">{error}</p>
            <button type="button" onClick={() => load(0)} className="customer-primary-btn">
              إعادة المحاولة
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="customer-panel-strong px-8 py-16 text-center">
            <IoReceiptOutline className="mx-auto mb-5 text-5xl text-slate-300" />
            <h2 className="text-2xl font-extrabold text-slate-900">لا توجد طلبات بعد</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              عندما تُكمل أول طلب شراء ستظهر تفاصيله هنا مع حالة التوصيل والتحضير.
            </p>
            <button type="button" onClick={() => navigate("/")} className="customer-primary-btn mt-6">
              ابدأ التسوق
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {orders.map((order) => (
              <OrderRow
                key={order?.shopOrderId}
                order={order}
                onClick={() => navigate(`/orders/${order?.shopOrderId}`)}
              />
            ))}

            {page < totalPages - 1 ? (
              <div className="flex justify-center pt-3">
                <button
                  type="button"
                  onClick={() => load(page + 1, true)}
                  disabled={loadingMore}
                  className="customer-secondary-btn"
                >
                  {loadingMore ? <FiLoader size={13} className="animate-spin" /> : null}
                  {loadingMore ? "جارٍ التحميل..." : "عرض المزيد"}
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div className="customer-divider mt-12" />
      </div>

      <Footer />
    </div>
  );
}
