import { useEffect, useState } from "react";

export const REQUEST_STATUS_LABELS = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

export const PAYMENT_STATUS_LABELS = {
  UNPAID: "غير مدفوع",
  PAID: "مدفوع",
  OVERDUE: "متأخر الدفع",
};

export const TEMPLATE_STATUS_LABELS = {
  ACTIVE: "متاح",
  RESERVED: "محجوز",
  ARCHIVED: "مؤرشف",
};

export const PAYMENT_RECORD_STATUS_LABELS = {
  SUCCESS: "ناجحة",
  FAILED: "فاشلة",
  REFUNDED: "مسترجعة",
};

export const REQUEST_STATUS_TABS = [
  { value: "ALL", label: "الكل" },
  { value: "PENDING", label: REQUEST_STATUS_LABELS.PENDING },
  { value: "APPROVED", label: REQUEST_STATUS_LABELS.APPROVED },
  { value: "REJECTED", label: REQUEST_STATUS_LABELS.REJECTED },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: "ALL", label: "كل حالات الدفع" },
  { value: "UNPAID", label: PAYMENT_STATUS_LABELS.UNPAID },
  { value: "PAID", label: PAYMENT_STATUS_LABELS.PAID },
  { value: "OVERDUE", label: PAYMENT_STATUS_LABELS.OVERDUE },
];

export const DISPLAY_STATUS_OPTIONS = [
  { value: "ALL", label: "كل حالات العرض" },
  { value: "DISPLAYED", label: "معروض" },
  { value: "HIDDEN", label: "غير معروض" },
];

export const PAGE_SIZE = 10;

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const arabicDateTimeFormatter = new Intl.DateTimeFormat("ar-PS", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const arabicDateFormatter = new Intl.DateTimeFormat("ar-PS", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatUsd(value) {
  const numeric = Number(value ?? 0);
  return usdFormatter.format(Number.isFinite(numeric) ? numeric : 0);
}

export function parseApiDate(value) {
  if (!value) return null;

  if (Array.isArray(value)) {
    const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0] = value;
    const date = new Date(year, month - 1, day, hour, minute, second);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value) {
  const date = parseApiDate(value);
  return date ? arabicDateTimeFormatter.format(date) : "—";
}

export function formatDateOnly(value) {
  const date = parseApiDate(value);
  return date ? arabicDateFormatter.format(date) : "—";
}

export function toDateTimeLocalValue(value) {
  const date = parseApiDate(value);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromDateTimeLocalValue(value) {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

export function calculateBillableHours(startDate, endDate) {
  const start = parseApiDate(startDate);
  const end = parseApiDate(endDate);

  if (!start || !end || end <= start) return 0;

  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Math.ceil(diffHours);
}

export function calculateEstimatedTotal(pricePerHour, startDate, endDate) {
  const price = Number(pricePerHour ?? 0);
  if (!Number.isFinite(price)) return 0;
  return calculateBillableHours(startDate, endDate) * price;
}

export function getFileUrl(file, preferOriginal = false) {
  if (!file) return "";

  return preferOriginal
    ? file.originalFileUrl || file.mediumFileUrl || file.smallFileUrl || ""
    : file.mediumFileUrl || file.smallFileUrl || file.originalFileUrl || "";
}

export function getAdImageUrl(request, preferOriginal = false) {
  return getFileUrl(request?.adRequestImage, preferOriginal);
}

export function computeAdsStats(adRequests = []) {
  return adRequests.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item?.status === "PENDING") acc.pending += 1;
      if (item?.status === "APPROVED") acc.approved += 1;
      if (item?.status === "REJECTED") acc.rejected += 1;
      if (item?.paymentStatus === "UNPAID") acc.unpaid += 1;
      if (item?.paymentStatus === "PAID") acc.paid += 1;
      if (item?.paymentStatus === "OVERDUE") acc.overdue += 1;
      if (item?.isDisplayed === true) acc.displayed += 1;
      return acc;
    },
    {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      unpaid: 0,
      paid: 0,
      overdue: 0,
      displayed: 0,
    }
  );
}

function isWithinDateRange(value, from, to) {
  if (!from && !to) return true;
  const date = parseApiDate(value);
  if (!date) return false;

  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    if (date < start) return false;
  }

  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (date > end) return false;
  }

  return true;
}

export function filterAds(adRequests = [], filters = {}) {
  return adRequests.filter((request) => {
    if (filters.paymentStatus && filters.paymentStatus !== "ALL" && request?.paymentStatus !== filters.paymentStatus) {
      return false;
    }

    if (filters.displayStatus === "DISPLAYED" && request?.isDisplayed !== true) {
      return false;
    }

    if (filters.displayStatus === "HIDDEN" && request?.isDisplayed === true) {
      return false;
    }

    if (filters.templateId && String(filters.templateId) !== "ALL") {
      const templateId = request?.template?.adTemplateId ?? request?.templateId;
      if (String(templateId) !== String(filters.templateId)) {
        return false;
      }
    }

    if (!isWithinDateRange(request?.startDate, filters.startFrom, filters.startTo)) {
      return false;
    }

    if (!isWithinDateRange(request?.endDate, filters.endFrom, filters.endTo)) {
      return false;
    }

    return true;
  });
}

export function paginate(items = [], page = 1, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize) || 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    totalPages,
    pageItems: items.slice(start, start + pageSize),
  };
}

export function extractApiError(error) {
  const fieldErrors = Array.isArray(error?.body?.errorCodes) ? error.body.errorCodes : [];
  const firstFieldError = fieldErrors.find((item) => typeof item?.message === "string")?.message;
  return error?.body?.message || firstFieldError || error?.message || "تعذر تنفيذ الطلب.";
}

export function mapFieldErrors(errorCodes = []) {
  return errorCodes.reduce((acc, item) => {
    if (item?.field) acc[item.field] = item.message;
    return acc;
  }, {});
}

export function useThemeContainer() {
  const [container, setContainer] = useState(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setContainer(document.querySelector(".radix-themes") || document.body);
  }, []);

  return container;
}

export function useIsDarkTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const element = document.querySelector(".radix-themes");
    if (!element) {
      setIsDark(false);
      return;
    }

    const update = () => {
      setIsDark(element.classList.contains("dark"));
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(element, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function formatDurationLabel(hours) {
  if (!hours) return "—";
  return hours === 1 ? "1 ساعة" : `${hours} ساعات`;
}

export function getDisplayStatusLabel(isDisplayed) {
  return isDisplayed ? "معروض حاليًا" : "غير معروض";
}

export function isPendingRequest(request) {
  return request?.status === "PENDING";
}

export function isPayableRequest(request) {
  return request?.status === "APPROVED" && request?.paymentStatus === "UNPAID";
}

export function isStripeConfigured() {
  return Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
}
