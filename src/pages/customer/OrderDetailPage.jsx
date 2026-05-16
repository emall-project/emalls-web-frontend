import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  IoArrowForward,
  IoBusinessOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoReceiptOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import { FiAlertCircle, FiLoader, FiPhone, FiRotateCcw } from "react-icons/fi";

import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { cartApi } from "../../api/cartApi";
import { returnsApi } from "../../api/returnsApi";
import { ReturnRequestDialog } from "../../components/customer/ReturnRequestDialog";

const STATUS_LABEL = {
  NEW: { text: "طلب جديد", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  PREPARING: { text: "قيد التحضير", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  READY_FOR_PICKUP: { text: "جاهز للاستلام", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  OUT_FOR_DELIVERY: { text: "في الطريق إليك", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  DELIVERED: { text: "تم التسليم", cls: "bg-green-50 text-green-700 border-green-200" },
  CUSTOMER_REJECTED: { text: "مرفوض", cls: "bg-red-50 text-red-700 border-red-200" },
  NO_RESPONSE: { text: "لم يتم الرد", cls: "bg-neutral-50 text-neutral-600 border-neutral-200" },
};

function StatusBadge({ status }) {
  const current = STATUS_LABEL[status] ?? {
    text: status || "غير معروف",
    cls: "bg-neutral-50 text-neutral-600 border-neutral-200",
  };

  return <span className={`inline-block rounded-full border px-3 py-1 text-[11px] font-semibold ${current.cls}`}>{current.text}</span>;
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

function formatPhone(phone) {
  if (!phone) return "";
  if (typeof phone === "string") return phone;
  return [phone.prefix, phone.countryCode, phone.number].filter(Boolean).join(" ").trim();
}

function getOrderShopName(order) {
  return order?.storeName || order?.shopInfo?.name || `متجر #${order?.shopId ?? ""}`;
}

function getOrderMallName(order) {
  return order?.mallInfo?.name || "";
}

function Section({ title, icon, children }) {
  return (
    <div className="customer-panel p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="customer-icon-chip h-10 w-10 text-sm">{icon}</div>
        <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Return request dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnItem, setReturnItem]             = useState(null);
  const [submittedReturnIds, setSubmittedReturnIds] = useState(new Set());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    cartApi
      .getOrderById(orderId)
      .then((response) => {
        if (!active) return;
        setOrder(response ?? null);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.message || "تعذر تحميل الطلب");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

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

  if (error || !order) {
    return (
      <div dir="rtl" className="customer-page flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="customer-panel-strong max-w-md px-8 py-10 text-center">
            <FiAlertCircle className="mx-auto mb-4 text-4xl text-slate-300" />
            <p className="mb-5 text-sm leading-7 text-slate-600">{error || "لم يتم العثور على الطلب."}</p>
            <button type="button" onClick={() => navigate("/orders")} className="customer-primary-btn">
              طلباتي
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const delivery = order?.deliveryInfo ?? {};
  const items = Array.isArray(order?.items) ? order.items : [];

  const openReturnDialog = (item) => {
    setReturnItem(item);
    setReturnDialogOpen(true);
  };

  const handleReturnSubmit = async (body) => {
    if (!isReturnWindowOpen(returnItem?.holdingExpiresAt)) {
      throw new Error("انتهت نافذة الإرجاع لهذا العنصر.");
    }
    await returnsApi.create(body);
    setSubmittedReturnIds(prev => new Set([...prev, body.orderItemId]));
  };

  return (
    <div dir="rtl" className="customer-page">
      <Header />

      <div className="customer-shell px-4 py-8 sm:px-6 md:px-12 md:py-10">
        <div className="customer-page-header customer-panel-strong px-5 py-5 sm:px-6 md:px-8">
          <div>
            <span className="customer-kicker">
              <IoReceiptOutline />
              تفاصيل الطلب
            </span>
            <h1 className="customer-page-title mt-4">طلب رقم #{order?.shopOrderId}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <StatusBadge status={order?.status} />
              {order?.createdAt ? <span>{formatDateTime(order.createdAt)}</span> : null}
            </div>
          </div>

          <button type="button" onClick={() => navigate("/orders")} className="customer-secondary-btn shrink-0">
            <IoArrowForward className="text-base" />
            طلباتي
          </button>
        </div>

        <div className="customer-divider my-8" />

        <div className="mx-auto max-w-4xl space-y-5">
          <Section title="المتجر" icon={<IoStorefrontOutline />}>
            <div className="flex items-center gap-3">
              <div className="customer-icon-chip h-12 w-12 shrink-0 text-base">
                <IoStorefrontOutline />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{getOrderShopName(order)}</p>
                {getOrderMallName(order) ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <IoBusinessOutline className="text-xs" />
                    {getOrderMallName(order)}
                  </p>
                ) : null}
              </div>
            </div>
          </Section>

          <Section title="المنتجات" icon={<IoReceiptOutline />}>
            <div className="space-y-4">
              {items.map((item, index) => {
                const itemId = item?.orderItemId;
                const hasExistingReturn =
                  Boolean(item?.hasReturnRequest) ||
                  Boolean(item?.returnRequest?.returnRequestId) ||
                  submittedReturnIds.has(Number(itemId));
                const returnWindowOpen = isReturnWindowOpen(item?.holdingExpiresAt);
                const canRequestReturn =
                  item?.status === "HOLDING" &&
                  returnWindowOpen &&
                  !hasExistingReturn;
                const expiredHoldingItem =
                  item?.status === "HOLDING" &&
                  !returnWindowOpen &&
                  !hasExistingReturn;
                const holdingExpiresAt = item?.holdingExpiresAt
                  ? formatDateTime(item.holdingExpiresAt)
                  : "";
                const returnDetailsLink = item?.returnRequest?.returnRequestId
                  ? `/returns/${item.returnRequest.returnRequestId}`
                  : "/returns";

                return (
                <div
                  key={itemId ?? `${item?.productId ?? "item"}-${index}`}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-7 text-slate-900">
                        {item?.productName || `منتج #${item?.productId ?? ""}`}
                      </p>
                      {item?.variantName ? <p className="mt-1 text-xs text-slate-500">{item.variantName}</p> : null}
                      <p className="mt-2 text-xs text-slate-400">
                        ₪{formatAmount(item?.unitPrice)} × {item?.quantity ?? 0}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-slate-900">
                      ₪{formatAmount(item?.lineTotal)}
                    </span>
                  </div>

                  {(canRequestReturn || hasExistingReturn || item?.status === "READY_FOR_PAYOUT" || expiredHoldingItem) && (
                    <div className="border-t border-slate-100 pt-3">
                      {hasExistingReturn ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-700">
                          <FiRotateCcw size={12} />
                          تم إرسال طلب إرجاع لهذا العنصر —{" "}
                          <Link to={returnDetailsLink} className="underline font-semibold">
                            عرض الطلب
                          </Link>
                        </div>
                      ) : canRequestReturn ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-xs text-amber-700">
                            {holdingExpiresAt
                              ? `متاح للإرجاع حتى ${holdingExpiresAt}`
                              : "هذا العنصر داخل نافذة الإرجاع الحالية."}
                          </div>
                          <button
                            type="button"
                            onClick={() => openReturnDialog(item)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <FiRotateCcw size={13} />
                            طلب إرجاع
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          انتهت نافذة الإرجاع لهذا العنصر.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                );
              })}

              {items.length === 0 ? (
                <p className="text-sm text-slate-500">لا توجد عناصر مسجلة داخل هذا الطلب.</p>
              ) : null}

              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900">
                <span>الإجمالي</span>
                <span>₪{formatAmount(order?.total)}</span>
              </div>
            </div>
          </Section>

          {(delivery?.deliveryName ||
            delivery?.deliveryLocation ||
            delivery?.deliveryPhone ||
            delivery?.deliveryNote ||
            delivery?.deliveryFee != null) && (
            <Section title="معلومات التوصيل" icon={<IoLocationOutline />}>
              <div className="space-y-3 text-sm text-slate-700">
                {delivery?.deliveryName ? (
                  <div className="flex items-center gap-2">
                    <IoPersonOutline className="text-base text-slate-400" />
                    {delivery.deliveryName}
                  </div>
                ) : null}

                {delivery?.deliveryPhone ? (
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-sm text-slate-400" />
                    {formatPhone(delivery.deliveryPhone)}
                  </div>
                ) : null}

                {delivery?.deliveryLocation ? (
                  <div className="flex items-start gap-2">
                    <IoLocationOutline className="mt-0.5 text-base text-slate-400" />
                    {delivery.deliveryLocation}
                  </div>
                ) : null}

                {delivery?.deliveryNote ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-7 text-slate-500">
                    {delivery.deliveryNote}
                  </p>
                ) : null}

                {delivery?.deliveryFee != null ? (
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
                    <span>رسوم التوصيل</span>
                    <span>₪{formatAmount(delivery.deliveryFee)}</span>
                  </div>
                ) : null}
              </div>
            </Section>
          )}
        </div>

        <div className="customer-divider mt-12" />
      </div>

      <Footer />

      <ReturnRequestDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        orderItem={returnItem}
        onSubmit={handleReturnSubmit}
      />
    </div>
  );
}
