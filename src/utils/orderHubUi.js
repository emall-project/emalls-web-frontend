import { getMediaPreviewUrl } from "../api/mediaManager";

const STATUS_LABELS = {
  CREATED: "تم الإنشاء",
  PENDING: "قيد الانتظار",
  PENDING_APPROVAL: "بانتظار الموافقة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  ACTIVE: "نشط",
  CANCELLED: "ملغي",
  CANCELLED_BY_CUSTOMER: "ملغي من العميل",
  CHECKED_OUT: "تم الشراء",
  PROCESSING: "قيد التجهيز",
  CONFIRMED: "مؤكد",
  PREPARING: "قيد التحضير",
  READY: "جاهز",
  SENT: "تم الإرسال",
  ON_THE_WAY: "في الطريق",
  DELIVERED: "تم التسليم",
  FAILED: "فشل التسليم",
  CUSTOMER_REJECTED: "رفض العميل الاستلام",
  NO_RESPONSE: "لا يوجد رد",
};

export function formatMoney(value) {
  return Number(value || 0).toLocaleString("ar", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatOrderHubStatus(status) {
  if (!status) {
    return "-";
  }

  return STATUS_LABELS[status] || status;
}

export function getOrderItemImage(item) {
  const productInfo = item?.productInfo;
  const medium =
    productInfo?.medium ||
    productInfo?.mediumFile ||
    item?.variantInfo?.medium ||
    item?.variantInfo?.mediumFile ||
    productInfo?.variants?.find((variant) => variant?.isDefault)?.media?.[0]?.mediumFile ||
    productInfo?.variants?.[0]?.media?.[0]?.mediumFile ||
    null;

  return getMediaPreviewUrl(medium) || "/vite.svg";
}

export function cartItemCount(cart) {
  return (cart?.items || []).reduce((total, item) => total + Number(item?.quantity || 0), 0);
}
