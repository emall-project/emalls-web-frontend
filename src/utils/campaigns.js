export const CAMPAIGN_POSITIONS = [
  "HOME_TOP",
  "SIDEBAR_LEFT",
  "SIDEBAR_RIGHT",
  "FOOTER",
];

export const CAMPAIGN_POSITION_LABELS = {
  HOME_TOP: "أعلى الصفحة",
  SIDEBAR_LEFT: "الشريط الجانبي الأيسر",
  SIDEBAR_RIGHT: "الشريط الجانبي الأيمن",
  FOOTER: "أسفل الصفحة",
};

export const CAMPAIGN_IMAGE_RATIOS = [
  "16:9",
  "21:9",
  "4:3",
  "3:2",
  "5:4",
  "9:16",
  "2:3",
  "3:4",
  "4:5",
  "1:1",
];

export const TEMPLATE_STATUS_LABELS = {
  ACTIVE: "نشط",
  RESERVED: "محجوز",
  ARCHIVED: "مؤرشف",
};

export const REQUEST_STATUS_LABELS = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

export const REQUEST_PAYMENT_STATUS_LABELS = {
  UNPAID: "غير مدفوع",
  PAID: "مدفوع",
  OVERDUE: "متأخر",
};

export const OFFER_STATUS_LABELS = {
  INACTIVE: "غير نشط",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
};

export const DISCOUNT_TYPE_LABELS = {
  PERCENT: "نسبة مئوية",
  FIXED_PRICE: "خصم ثابت",
};

export const SUBSCRIPTION_STATUS_LABELS = {
  TRIAL: "تجريبي",
  ACTIVE: "نشط",
  SUSPENDED: "معلق",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
};

export const SUBSCRIPTION_PLAN_TYPE_LABELS = {
  MONTHLY: "شهري",
  YEARLY: "سنوي",
};

const DEFAULT_STATUS_TONE = {
  bg: "var(--gray-a3)",
  fg: "var(--gray-11)",
  dot: "var(--gray-9)",
};

export const STATUS_TONES = {
  ACTIVE: { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)" },
  RESERVED: { bg: "var(--blue-a3)", fg: "var(--blue-11)", dot: "var(--blue-9)" },
  ARCHIVED: { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" },
  PENDING: { bg: "var(--amber-a3)", fg: "var(--amber-11)", dot: "var(--amber-9)" },
  APPROVED: { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)" },
  REJECTED: { bg: "var(--red-a3)", fg: "var(--red-11)", dot: "var(--red-9)" },
  UNPAID: { bg: "var(--orange-a3)", fg: "var(--orange-11)", dot: "var(--orange-9)" },
  PAID: { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)" },
  OVERDUE: { bg: "var(--red-a3)", fg: "var(--red-11)", dot: "var(--red-9)" },
  INACTIVE: { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" },
  EXPIRED: { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" },
  TRIAL: { bg: "var(--blue-a3)", fg: "var(--blue-11)", dot: "var(--blue-9)" },
  SUSPENDED: { bg: "var(--amber-a3)", fg: "var(--amber-11)", dot: "var(--amber-9)" },
  CANCELLED: { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" },
};

export function getCampaignStatusTone(status) {
  return STATUS_TONES[status] || DEFAULT_STATUS_TONE;
}

export function humanizeEnum(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/u, (char) => char.toUpperCase());
}

export function getCampaignLabel(value, labels = {}) {
  return labels[value] || humanizeEnum(value) || "-";
}

export function formatMoney(value, currency = "ILS") {
  const amount = Number(value || 0);
  const normalizedCurrency = String(currency || "ILS").toUpperCase();

  try {
    return new Intl.NumberFormat("ar", {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${normalizedCurrency}`;
  }
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function toDateTimeLocalInput(value) {
  if (!value) {
    return "";
  }

  const text = String(value);
  if (text.includes("T")) {
    return text.slice(0, 16);
  }

  return "";
}

export function computeDiscountedPrice(discountType, discountValue, basePrice) {
  const amount = Number(discountValue || 0);
  const base = Number(basePrice || 0);

  if (!Number.isFinite(base)) {
    return 0;
  }

  if (discountType === "PERCENT") {
    return Math.max(0, base - (base * amount) / 100);
  }

  return Math.max(0, base - amount);
}

export function buildVariantPrices(product, discountType, discountValue) {
  return (product?.variants || []).map((variant) => ({
    variantId: variant.id,
    variantName: variant.name,
    originalPrice: variant.basePrice,
    discountedPrice: computeDiscountedPrice(discountType, discountValue, variant.basePrice),
    isDefault: !!variant.isDefault,
    discountType,
    discountValue: Number(discountValue || 0),
  }));
}
