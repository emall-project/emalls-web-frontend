import { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiClock,
  FiEdit2,
  FiEye,
  FiFilter,
  FiLoader,
  FiPackage,
  FiPlus,
  FiPower,
  FiRefreshCw,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { productsApi } from "../Products/api";
import { offersApi } from "./api";

const STATUS_META = {
  INACTIVE: {
    label: "غير نشط",
    background: "var(--gray-a3)",
    color: "var(--gray-11)",
    dot: "var(--gray-9)",
  },
  ACTIVE: {
    label: "نشط",
    background: "var(--green-a3)",
    color: "var(--green-11)",
    dot: "var(--green-9)",
  },
  EXPIRED: {
    label: "منتهي",
    background: "var(--amber-a3)",
    color: "var(--amber-11)",
    dot: "var(--amber-9)",
  },
};

const DISCOUNT_TYPE_OPTIONS = [
  { value: "PERCENT", label: "خصم بنسبة مئوية" },
  { value: "FIXED_PRICE", label: "خصم بمبلغ ثابت" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "كل الحالات" },
  { value: "INACTIVE", label: "غير نشط" },
  { value: "ACTIVE", label: "نشط" },
  { value: "EXPIRED", label: "منتهي" },
];

const OFFER_ERROR_MESSAGES = {
  "offer.not.found": "لم يتم العثور على العرض المطلوب.",
  "offer.title.exists": "يوجد عرض آخر بنفس العنوان داخل هذا المتجر.",
  "offer.start.date.in.past": "يجب أن يكون تاريخ البدء الآن أو في المستقبل.",
  "offer.end.date.not.after.start": "يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء.",
  "offer.invalid.percent.value": "يجب أن تكون نسبة الخصم بين 1 و99.",
  "offer.discount.exceeds.price": "قيمة الخصم الثابت يجب أن تكون أقل من سعر جميع متغيرات المنتج.",
  "offer.product.already.in.offer": "هذا المنتج مضاف إلى العرض بالفعل.",
  "offer.product.not.found": "المنتج غير صالح أو غير نشط أو لا يمكن الوصول إليه.",
  "offer.cannot.modify.active": "لا يمكن تعديل تسعير العرض أو تاريخ بدئه أثناء كونه نشطًا.",
  "offer.no.active.items": "يجب أن يحتوي العرض على منتج نشط واحد على الأقل قبل التفعيل.",
  "offer.expired": "هذا العرض منتهي الصلاحية ولا يمكن تعديله.",
  "offer.already.expired": "انتهت صلاحية هذا العرض بالفعل.",
  "offer.product.already.in.overlapping.offer":
    "أحد المنتجات المحددة موجود بالفعل في عرض آخر متداخل في نفس الفترة.",
  "offer.title.notblank": "عنوان العرض مطلوب.",
  "offer.title.size": "يجب أن يكون عنوان العرض بين حرفين و255 حرفًا.",
  "offer.description.size": "الوصف طويل جدًا.",
  "offer.discountType.notnull": "نوع الخصم مطلوب.",
  "offer.discountValue.notnull": "قيمة الخصم مطلوبة.",
  "offer.discountValue.min": "يجب أن تكون قيمة الخصم أكبر من صفر.",
  "offer.startDate.notnull": "تاريخ البدء مطلوب.",
  "offer.startDate.futureOrPresent": "يجب أن يكون تاريخ البدء الآن أو في المستقبل.",
  "offer.endDate.notnull": "تاريخ الانتهاء مطلوب.",
  "offer.endDate.future": "يجب أن يكون تاريخ الانتهاء في المستقبل.",
  "offer.maxUses.positive": "يجب أن يكون الحد الأقصى للاستخدامات رقمًا موجبًا.",
  "offer.items.notempty": "اختر منتجًا واحدًا على الأقل لهذا العرض.",
  "offerItem.productId.notnull": "اختيار المنتج مطلوب.",
  "offerItem.productId.positive": "معرف المنتج غير صالح.",
};

function useThemeContainer() {
  const [container, setContainer] = useState(null);

  useEffect(() => {
    setContainer(document.querySelector(".radix-themes") || document.body);
  }, []);

  return container;
}

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function getOfferMessage(error) {
  const firstCode = error?.errorCodes?.[0];
  const key = typeof firstCode?.message === "string" ? firstCode.message : null;
  if (key && OFFER_ERROR_MESSAGES[key]) return OFFER_ERROR_MESSAGES[key];
  return error?.message || "حدث خطأ أثناء تنفيذ الطلب.";
}

function mapFieldErrors(error) {
  const result = {};
  const errorCodes = Array.isArray(error?.errorCodes) ? error.errorCodes : [];

  errorCodes.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const field = item.field;
    const message = OFFER_ERROR_MESSAGES[item.message] || item.message;
    if (!field || !message) return;

    if (field === "items" || field === "offerItem.productId" || field === "productId") {
      result.productIds = message;
      return;
    }

    if (field === "offerId") {
      result.general = message;
      return;
    }

    result[field] = message;
  });

  return result;
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `₪${numeric.toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ");
  return new Intl.DateTimeFormat("ar-PS", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toDateTimeInputValue(value) {
  if (!value) return "";
  return String(value).replace(" ", "T").slice(0, 16);
}

function toApiDateTime(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}

function toMillis(value) {
  if (!value) return null;
  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function nowInputMin() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function todayInputDate() {
  return nowInputMin().slice(0, 10);
}

function splitDateTimeValue(value) {
  if (!value) return { date: "", time: "" };
  const normalized = String(value).replace(" ", "T");
  const [datePart = "", timePart = ""] = normalized.split("T");
  return {
    date: datePart,
    time: timePart.slice(0, 5),
  };
}

function joinDateTimeValue(datePart, timePart, fallbackTime = "00:00") {
  if (!datePart) return "";
  return `${datePart}T${(timePart || fallbackTime || "00:00").slice(0, 5)}`;
}

function formatDateTimeCompact(value) {
  const { date, time } = splitDateTimeValue(value);
  if (!date && !time) return "";
  if (!date) return time;
  return `${date}${time ? ` • ${time}` : ""}`;
}

const WEEKDAY_LABELS = ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function parseDateOnly(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateOnlyKey(date) {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function shiftMonth(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getMonthLabel(date) {
  return new Intl.DateTimeFormat("ar-PS", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildCalendarDays(viewMonth, minDate, maxDate) {
  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());

  const minKey = minDate ? formatDateOnlyKey(minDate) : null;
  const maxKey = maxDate ? formatDateOnlyKey(maxDate) : null;

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    const key = formatDateOnlyKey(date);

    return {
      key,
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === viewMonth.getMonth(),
      isDisabled: (minKey && key < minKey) || (maxKey && key > maxKey),
    };
  });
}

function clampTimeForBounds(datePart, timePart, minParts, maxParts, fallbackTime = "00:00") {
  let nextTime = (timePart || fallbackTime || "00:00").slice(0, 5);

  if (datePart && minParts.date === datePart && minParts.time && nextTime < minParts.time) {
    nextTime = minParts.time;
  }

  if (datePart && maxParts.date === datePart && maxParts.time && nextTime > maxParts.time) {
    nextTime = maxParts.time;
  }

  return nextTime;
}

function compareId(a, b) {
  return String(a) === String(b);
}

function getDiscountTypeLabel(type) {
  return DISCOUNT_TYPE_OPTIONS.find((option) => option.value === type)?.label || type || "—";
}

function getStatusLabel(status) {
  return STATUS_META[status]?.label || status || "—";
}

function getProductVariantRows(item) {
  return Array.isArray(item?.variantPrices) ? item.variantPrices : [];
}

function applyFilters(offers, filters) {
  const query = filters.query.trim().toLowerCase();
  const productId = filters.productId && filters.productId !== "ALL" ? String(filters.productId) : "";

  return offers
    .filter((offer) => {
      if (query) {
        const haystack = [offer.title, offer.description, String(offer.offerId)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (filters.discountType !== "ALL" && offer.discountType !== filters.discountType) {
        return false;
      }

      if (productId) {
        const hasProduct = (offer.items || []).some((item) => compareId(item.productId, productId));
        if (!hasProduct) return false;
      }

      const startTime = toMillis(offer.startDate);
      const endTime = toMillis(offer.endDate);
      const startFrom = toMillis(filters.startFrom);
      const startTo = toMillis(filters.startTo);
      const endFrom = toMillis(filters.endFrom);
      const endTo = toMillis(filters.endTo);

      if (startFrom && (!startTime || startTime < startFrom)) return false;
      if (startTo && (!startTime || startTime > startTo)) return false;
      if (endFrom && (!endTime || endTime < endFrom)) return false;
      if (endTo && (!endTime || endTime > endTo)) return false;

      return true;
    })
    .sort((first, second) => (toMillis(second.startDate) || 0) - (toMillis(first.startDate) || 0));
}

function buildStats(offers) {
  return [
    {
      key: "total",
      label: "إجمالي العروض",
      value: offers.length,
      tone: "blue",
      icon: FiTag,
      filterValue: "ALL",
    },
    {
      key: "active",
      label: "نشطة",
      value: offers.filter((offer) => offer.status === "ACTIVE").length,
      tone: "green",
      icon: FiCheck,
      filterValue: "ACTIVE",
    },
    {
      key: "inactive",
      label: "غير نشطة",
      value: offers.filter((offer) => offer.status === "INACTIVE").length,
      tone: "gray",
      icon: FiPower,
      filterValue: "INACTIVE",
    },
    {
      key: "expired",
      label: "منتهية",
      value: offers.filter((offer) => offer.status === "EXPIRED").length,
      tone: "amber",
      icon: FiClock,
      filterValue: "EXPIRED",
    },
  ];
}

function getToneStyle(tone) {
  switch (tone) {
    case "green":
      return {
        background: "var(--green-a3)",
        color: "var(--green-11)",
        ring: "var(--green-a5)",
      };
    case "amber":
      return {
        background: "var(--amber-a3)",
        color: "var(--amber-11)",
        ring: "var(--amber-a5)",
      };
    case "gray":
      return {
        background: "var(--gray-a3)",
        color: "var(--gray-11)",
        ring: "var(--gray-a5)",
      };
    default:
      return {
        background: "var(--blue-a3)",
        color: "var(--blue-11)",
        ring: "var(--blue-a5)",
      };
  }
}

function SurfaceCard({ children, className = "", style = {} }) {
  return (
    <div
      className={`rounded-[28px] border shadow-sm ${className}`.trim()}
      style={{
        background: "var(--gray-1)",
        borderColor: "var(--gray-a5)",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-black" style={{ color: "var(--gray-12)" }}>
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-2xl"
      style={{
        background: type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color: type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}
    >
      <span>{message}</span>
      <button type="button" onClick={onClose} className="rounded-full p-1 opacity-70 hover:opacity-100">
        <FiX size={14} />
      </button>
    </div>
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <label className="block space-y-1.5 text-right">
      <span className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
        {label}
        {required ? <span style={{ color: "var(--red-9)" }}> *</span> : null}
      </span>
      {children}
      {error ? (
        <p className="text-xs font-semibold" style={{ color: "var(--red-11)" }}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs" style={{ color: "var(--gray-8)" }}>
          {hint}
        </p>
      ) : null}
    </label>
  );
}

function baseFieldStyle() {
  return {
    background: "var(--gray-a2)",
    borderColor: "var(--gray-a5)",
    color: "var(--gray-12)",
  };
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`h-12 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition focus:border-blue-400 ${
        props.className || ""
      }`.trim()}
      style={{ ...baseFieldStyle(), ...(props.style || {}) }}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-400 ${
        props.className || ""
      }`.trim()}
      style={{ ...baseFieldStyle(), ...(props.style || {}) }}
    />
  );
}

function SelectInput({ options, ...props }) {
  return (
    <select
      {...props}
      className={`h-12 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition focus:border-blue-400 ${
        props.className || ""
      }`.trim()}
      style={{ ...baseFieldStyle(), ...(props.style || {}) }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function LegacyDateTimeInput({
  value,
  onChange,
  min,
  max,
  disabled,
  defaultTime = "00:00",
  helperText = "الصيغة: YYYY-MM-DD ثم HH:MM",
  dateLabel = "التاريخ",
  timeLabel = "الوقت",
}) {
  const [open, setOpen] = useState(false);
  const current = splitDateTimeValue(value);
  const minParts = splitDateTimeValue(min);
  const maxParts = splitDateTimeValue(max);

  const timeMin = current.date && minParts.date === current.date ? minParts.time : undefined;
  const timeMax = current.date && maxParts.date === current.date ? maxParts.time : undefined;

  const handleDateChange = (nextDate) => {
    if (!nextDate) {
      onChange("");
      return;
    }

    let nextTime = current.time;
    if (!nextTime) {
      if (minParts.date === nextDate && minParts.time) {
        nextTime = minParts.time;
      } else if (maxParts.date === nextDate && maxParts.time && defaultTime > maxParts.time) {
        nextTime = maxParts.time;
      } else {
        nextTime = defaultTime;
      }
    }

    onChange(joinDateTimeValue(nextDate, nextTime, defaultTime));
  };

  const handleTimeChange = (nextTime) => {
    const baseDate = current.date || minParts.date || todayInputDate();
    onChange(joinDateTimeValue(baseDate, nextTime || defaultTime, defaultTime));
  };

  const triggerValue = formatDateTimeCompact(value);

  return (
    <div className="space-y-2">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-right transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            style={baseFieldStyle()}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
              >
                <FiCalendar size={15} />
              </span>
              <div className="min-w-0">
                <div
                  className="truncate text-sm font-semibold"
                  dir={triggerValue ? "ltr" : "rtl"}
                  style={{ color: triggerValue ? "var(--gray-12)" : "var(--gray-8)" }}
                >
                  {triggerValue || "اختر التاريخ والوقت"}
                </div>
                <div className="text-[11px]" style={{ color: "var(--gray-8)" }}>
                  {helperText}
                </div>
              </div>
            </div>
            <FiClock size={15} style={{ color: "var(--gray-8)" }} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            align="start"
            className="z-[10020] w-[min(92vw,340px)] rounded-[24px] border p-4 shadow-2xl outline-none"
            style={{
              background: "var(--gray-2)",
              borderColor: "var(--gray-a6)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div className="space-y-4" dir="rtl">
              <div>
                <div className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                  اختر التاريخ والوقت
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--gray-8)" }}>
                  يتم الإرسال إلى الخادم بصيغة LocalDateTime نفسها بدون تغيير.
                </div>
              </div>

              <div className="grid gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--gray-8)" }}>
                    <FiCalendar size={12} />
                    <span>{dateLabel}</span>
                  </div>
                  <TextInput
                    dir="ltr"
                    lang="en-CA"
                    data-legacy-type="date"
                    min={minParts.date || undefined}
                    max={maxParts.date || undefined}
                    value={current.date}
                    onChange={(event) => handleDateChange(event.target.value)}
                    className="text-left"
                    disabled={disabled}
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--gray-8)" }}>
                    <FiClock size={12} />
                    <span>{timeLabel}</span>
                  </div>
                  <TextInput
                    dir="ltr"
                    lang="en-GB"
                    data-legacy-type="time"
                    step="60"
                    min={timeMin}
                    max={timeMax}
                    value={current.time}
                    onChange={(event) => handleTimeChange(event.target.value)}
                    className="text-left"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div
                className="rounded-2xl border px-3 py-2 text-[11px]"
                style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)", color: "var(--gray-8)" }}
              >
                {value ? (
                  <span>
                    القيمة الحالية:{" "}
                    <span dir="ltr" className="font-semibold" style={{ color: "var(--gray-12)" }}>
                      {formatDateTimeCompact(value)}
                    </span>
                  </span>
                ) : (
                  <span>الصيغة المتوقعة: YYYY-MM-DD ثم HH:MM</span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:text-red-500"
                  style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)", color: "var(--gray-11)" }}
                >
                  مسح
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  تم
                </button>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function DateTimeInput({
  value,
  onChange,
  min,
  max,
  disabled,
  defaultTime = "00:00",
}) {
  const [open, setOpen] = useState(false);
  const current = splitDateTimeValue(value);
  const minParts = splitDateTimeValue(min);
  const maxParts = splitDateTimeValue(max);
  const minDate = parseDateOnly(minParts.date);
  const maxDate = parseDateOnly(maxParts.date);
  const selectedDate = parseDateOnly(current.date);
  const [viewMonth, setViewMonth] = useState(
    selectedDate || minDate || parseDateOnly(todayInputDate()) || new Date()
  );

  useEffect(() => {
    if (!open) return;
    setViewMonth(selectedDate || minDate || parseDateOnly(todayInputDate()) || new Date());
  }, [open, current.date, minParts.date]);

  const calendarDays = useMemo(
    () => buildCalendarDays(viewMonth, minDate, maxDate),
    [viewMonth, minDate, maxDate]
  );

  const handleDateSelect = (dateKey) => {
    if (!dateKey) {
      onChange("");
      return;
    }

    const nextTime = clampTimeForBounds(
      dateKey,
      current.time || defaultTime,
      minParts,
      maxParts,
      defaultTime
    );
    onChange(joinDateTimeValue(dateKey, nextTime, defaultTime));
  };

  const handleTimeChange = (part, nextValue) => {
    const baseDate = current.date || minParts.date || todayInputDate();
    const [baseHour = defaultTime.slice(0, 2), baseMinute = defaultTime.slice(3, 5)] = (
      current.time || defaultTime
    ).split(":");

    const nextHour = part === "hour" ? nextValue : baseHour;
    const nextMinute = part === "minute" ? nextValue : baseMinute;
    const boundedTime = clampTimeForBounds(
      baseDate,
      `${nextHour}:${nextMinute}`,
      minParts,
      maxParts,
      defaultTime
    );

    onChange(joinDateTimeValue(baseDate, boundedTime, defaultTime));
  };

  const triggerValue = formatDateTimeCompact(value);
  const currentHour = current.time ? current.time.slice(0, 2) : defaultTime.slice(0, 2);
  const currentMinute = current.time ? current.time.slice(3, 5) : defaultTime.slice(3, 5);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-right transition focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          style={baseFieldStyle()}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
            >
              <FiCalendar size={15} />
            </span>
            <span
              className="truncate text-sm font-semibold"
              dir={triggerValue ? "ltr" : "rtl"}
              style={{ color: triggerValue ? "var(--gray-12)" : "var(--gray-8)" }}
            >
              {triggerValue || "تحديد التاريخ والوقت"}
            </span>
          </div>
          <FiClock size={15} style={{ color: "var(--gray-8)" }} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-[10020] w-[min(94vw,360px)] rounded-[24px] border p-4 shadow-2xl outline-none"
          style={{
            background: "var(--gray-2)",
            borderColor: "var(--gray-a6)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div className="space-y-4" dir="rtl">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setViewMonth((currentMonth) => shiftMonth(currentMonth, -1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold"
                style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)", color: "var(--gray-11)" }}
              >
                ‹
              </button>
              <div className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                {getMonthLabel(viewMonth)}
              </div>
              <button
                type="button"
                onClick={() => setViewMonth((currentMonth) => shiftMonth(currentMonth, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold"
                style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)", color: "var(--gray-11)" }}
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[11px] font-semibold"
                  style={{ color: "var(--gray-8)" }}
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((day) => {
                const isSelected = current.date === day.key;
                return (
                  <button
                    key={day.key}
                    type="button"
                    disabled={day.isDisabled}
                    onClick={() => handleDateSelect(day.key)}
                    className="flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35"
                    style={{
                      background: isSelected
                        ? "var(--blue-9)"
                        : day.isCurrentMonth
                          ? "var(--gray-a2)"
                          : "var(--gray-a1)",
                      color: isSelected
                        ? "white"
                        : day.isCurrentMonth
                          ? "var(--gray-12)"
                          : "var(--gray-8)",
                      border: `1px solid ${isSelected ? "var(--blue-9)" : "var(--gray-a4)"}`,
                    }}
                  >
                    {day.dayNumber}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-right">
                <span className="text-xs font-semibold" style={{ color: "var(--gray-8)" }}>
                  الساعة
                </span>
                <SelectInput
                  value={currentHour}
                  onChange={(event) => handleTimeChange("hour", event.target.value)}
                  disabled={disabled || !current.date}
                  options={HOUR_OPTIONS.map((hour) => ({ value: hour, label: hour }))}
                />
              </label>

              <label className="space-y-1 text-right">
                <span className="text-xs font-semibold" style={{ color: "var(--gray-8)" }}>
                  الدقيقة
                </span>
                <SelectInput
                  value={currentMinute}
                  onChange={(event) => handleTimeChange("minute", event.target.value)}
                  disabled={disabled || !current.date}
                  options={MINUTE_OPTIONS.map((minute) => ({ value: minute, label: minute }))}
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:text-red-500"
                style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)", color: "var(--gray-11)" }}
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                تم
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.INACTIVE;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
      style={{ background: meta.background, color: meta.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

function DiscountBadge({ type, value }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
      style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
    >
      <FiTag size={12} />
      {type === "PERCENT" ? `${value}%` : `${formatMoney(value)} خصم`}
    </span>
  );
}

function FiltersBar({ filters, onChange, onReset, onResetDates, productOptions, onRefresh, onCreate }) {
  return (
    <SurfaceCard className="p-5">
      <SectionTitle
        title="العروض"
        subtitle="إدارة عروض متجرك وربطها بمنتجات المتجر الحالية وفق قواعد الخدمة الفعلية."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:text-blue-600"
              style={{ borderColor: "var(--gray-a5)", background: "var(--gray-2)", color: "var(--gray-11)" }}
            >
              <FiRefreshCw size={15} />
              تحديث
            </button>
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <FiPlus size={15} />
              إنشاء عرض جديد
            </button>
          </div>
        }
      />

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Field label="بحث بالعنوان">
          <div className="relative">
            <FiSearch
              size={15}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: "var(--gray-8)" }}
            />
            <TextInput
              value={filters.query}
              onChange={(event) => onChange({ query: event.target.value })}
              placeholder="ابحث بعنوان العرض أو رقمه..."
              className="pr-11"
            />
          </div>
        </Field>

        <Field label="الحالة">
          <SelectInput
            value={filters.status}
            onChange={(event) => onChange({ status: event.target.value })}
            options={STATUS_FILTER_OPTIONS}
          />
        </Field>

        <Field label="نوع الخصم">
          <SelectInput
            value={filters.discountType}
            onChange={(event) => onChange({ discountType: event.target.value })}
            options={[{ value: "ALL", label: "كل أنواع الخصم" }, ...DISCOUNT_TYPE_OPTIONS]}
          />
        </Field>

        <Field label="المنتج">
          <SelectInput
            value={filters.productId}
            onChange={(event) => onChange({ productId: event.target.value })}
            options={[
              { value: "ALL", label: "كل المنتجات" },
              ...productOptions.map((product) => ({
                value: String(product.id),
                label: product.name,
              })),
            ]}
          />
        </Field>

        <Field label="بداية العرض من">
          <DateTimeInput
            value={filters.startFrom}
            onChange={(nextValue) => onChange({ startFrom: nextValue })}
            defaultTime="00:00"
          />
        </Field>

        <Field label="بداية العرض إلى">
          <DateTimeInput
            value={filters.startTo}
            onChange={(nextValue) => onChange({ startTo: nextValue })}
            defaultTime="23:59"
          />
        </Field>

        <Field label="نهاية العرض من">
          <DateTimeInput
            value={filters.endFrom}
            onChange={(nextValue) => onChange({ endFrom: nextValue })}
            defaultTime="00:00"
          />
        </Field>

        <Field label="نهاية العرض إلى">
          <DateTimeInput
            value={filters.endTo}
            onChange={(nextValue) => onChange({ endTo: nextValue })}
            defaultTime="23:59"
          />
        </Field>

        <div className="flex items-end md:col-span-2 xl:col-span-3 2xl:col-span-2">
          <div className="grid w-full gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onResetDates}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition hover:text-blue-600"
              style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)", color: "var(--gray-11)" }}
            >
              <FiCalendar size={14} />
              مسح فلاتر التاريخ
            </button>

            <button
              type="button"
              onClick={onReset}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition hover:text-blue-600"
              style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a3)", color: "var(--gray-11)" }}
            >
              <FiFilter size={14} />
              إعادة ضبط الفلاتر
            </button>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function StatsRow({ offers, currentStatusFilter, onSelectStatus }) {
  const stats = buildStats(offers);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const tone = getToneStyle(item.tone);
        const Icon = item.icon;
        const active = currentStatusFilter === item.filterValue;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelectStatus(item.filterValue)}
            className="rounded-[24px] border p-4 text-right shadow-sm transition hover:-translate-y-0.5"
            style={{
              background: "var(--gray-1)",
              borderColor: active ? tone.ring : "var(--gray-a5)",
              boxShadow: active
                ? "0 0 0 2px rgba(59, 130, 246, 0.14), 0 10px 30px rgba(15, 23, 42, 0.08)"
                : "0 10px 30px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: tone.background, color: tone.color }}
              >
                <Icon size={18} />
              </div>
              <div className="text-left">
                <div className="text-[2rem] font-black tracking-tight" style={{ color: "var(--gray-12)" }}>
                  {item.value}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
              {item.label}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
              اضغط للتصفية
            </p>
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <SurfaceCard className="px-6 py-16 text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "var(--blue-a3)", color: "var(--blue-9)" }}
      >
        <FiTag size={28} />
      </div>
      <h3 className="mt-5 text-lg font-bold" style={{ color: "var(--gray-12)" }}>
        لا توجد عروض بعد
      </h3>
      <p className="mt-2 text-sm leading-7" style={{ color: "var(--gray-9)" }}>
        أنشئ أول عرض لمتجرك، واختر المنتجات النشطة التابعة له، ثم فعّل العرض عند جاهزيته.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mx-auto mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        <FiPlus size={16} />
        إنشاء أول عرض
      </button>
    </SurfaceCard>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <SurfaceCard className="px-5 py-5">
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold"
        style={{ borderColor: "var(--red-a5)", background: "var(--red-a2)", color: "var(--red-11)" }}
      >
        <div className="flex items-center gap-2">
          <FiAlertCircle size={15} />
          <span>{message}</span>
        </div>
        <button type="button" onClick={onRetry} className="underline">
          إعادة المحاولة
        </button>
      </div>
    </SurfaceCard>
  );
}

function LoadingState() {
  return (
    <SurfaceCard className="px-5 py-16">
      <div className="flex justify-center">
        <Spinner size={28} />
      </div>
    </SurfaceCard>
  );
}

function ActionButton({ onClick, label, icon, tone = "neutral", disabled = false }) {
  const toneMap = {
    neutral: { bg: "var(--gray-a3)", color: "var(--gray-11)" },
    blue: { bg: "var(--blue-a3)", color: "var(--blue-11)" },
    green: { bg: "var(--green-a3)", color: "var(--green-11)" },
    amber: { bg: "var(--amber-a3)", color: "var(--amber-11)" },
    red: { bg: "var(--red-a3)", color: "var(--red-11)" },
  };

  const Icon = icon;
  const colors = toneMap[tone] || toneMap.neutral;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: colors.bg, color: colors.color }}
    >
      {Icon ? <Icon size={12} /> : null}
      {label}
    </button>
  );
}

function getOfferActions(offer) {
  return {
    canEdit: offer.status !== "EXPIRED",
    canDelete: offer.status !== "ACTIVE",
    canActivate: offer.status === "INACTIVE",
    canDeactivate: offer.status === "ACTIVE",
    canManageProducts: offer.status !== "EXPIRED",
  };
}

function OffersTable({
  offers,
  rowBusy,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onManageProducts,
}) {
  return (
    <>
      <div className="hidden xl:block">
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-sm">
              <thead style={{ background: "var(--gray-a2)", color: "var(--gray-9)" }}>
                <tr>
                  {[
                    "العرض",
                    "نوع الخصم",
                    "الفترة",
                    "المنتجات",
                    "الاستخدامات",
                    "الحالة",
                    "الإجراءات",
                  ].map((header) => (
                    <th key={header} className="px-5 py-4 text-xs font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => {
                  const actions = getOfferActions(offer);
                  const busy = !!rowBusy[offer.offerId];
                  return (
                    <tr key={offer.offerId} style={{ borderTop: "1px solid var(--gray-a4)" }}>
                      <td className="px-5 py-4">
                        <div className="max-w-[280px]">
                          <p className="font-bold" style={{ color: "var(--gray-12)" }}>
                            {offer.title}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                            #{offer.offerId}
                          </p>
                          {offer.description ? (
                            <p className="mt-2 line-clamp-2 text-xs leading-6" style={{ color: "var(--gray-10)" }}>
                              {offer.description}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                            {getDiscountTypeLabel(offer.discountType)}
                          </p>
                          <DiscountBadge type={offer.discountType} value={offer.discountValue} />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs leading-6" style={{ color: "var(--gray-10)" }}>
                        <p>{formatDateTime(offer.startDate)}</p>
                        <p>{formatDateTime(offer.endDate)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold" style={{ color: "var(--gray-12)" }}>
                            {(offer.items || []).length} منتج
                          </p>
                          <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                            {(offer.items || [])
                              .slice(0, 2)
                              .map((item) => item.product?.name || `#${item.productId}`)
                              .join("، ") || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--gray-12)" }}>
                        <div className="space-y-1">
                          <p>
                            الحالي: <strong>{offer.currentUses ?? 0}</strong>
                          </p>
                          <p style={{ color: "var(--gray-9)" }}>
                            الحد الأقصى: <strong>{offer.maxUses ?? "غير محدود"}</strong>
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={offer.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <ActionButton onClick={() => onView(offer)} label="تفاصيل" icon={FiEye} tone="neutral" />
                          {actions.canEdit ? (
                            <ActionButton onClick={() => onEdit(offer)} label="تعديل" icon={FiEdit2} tone="blue" />
                          ) : null}
                          {actions.canManageProducts ? (
                            <ActionButton
                              onClick={() => onManageProducts(offer)}
                              label="المنتجات"
                              icon={FiPackage}
                              tone="neutral"
                            />
                          ) : null}
                          {actions.canActivate ? (
                            <ActionButton
                              onClick={() => onActivate(offer)}
                              label={busy ? "جارٍ التفعيل..." : "تفعيل"}
                              icon={busy ? null : FiPower}
                              tone="green"
                              disabled={busy}
                            />
                          ) : null}
                          {actions.canDeactivate ? (
                            <ActionButton
                              onClick={() => onDeactivate(offer)}
                              label={busy ? "جارٍ التعطيل..." : "تعطيل"}
                              icon={busy ? null : FiPower}
                              tone="amber"
                              disabled={busy}
                            />
                          ) : null}
                          {actions.canDelete ? (
                            <ActionButton onClick={() => onDelete(offer)} label="حذف" icon={FiTrash2} tone="red" />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-4 xl:hidden">
        {offers.map((offer) => {
          const actions = getOfferActions(offer);
          const busy = !!rowBusy[offer.offerId];

          return (
            <SurfaceCard key={offer.offerId} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                      {offer.title}
                    </h3>
                    <StatusBadge status={offer.status} />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                    #{offer.offerId}
                  </p>
                </div>
                <DiscountBadge type={offer.discountType} value={offer.discountValue} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniStat label="نوع الخصم" value={getDiscountTypeLabel(offer.discountType)} />
                <MiniStat label="المنتجات" value={`${(offer.items || []).length} منتج`} />
                <MiniStat label="يبدأ" value={formatDateTime(offer.startDate)} />
                <MiniStat label="ينتهي" value={formatDateTime(offer.endDate)} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton onClick={() => onView(offer)} label="تفاصيل" icon={FiEye} tone="neutral" />
                {actions.canEdit ? (
                  <ActionButton onClick={() => onEdit(offer)} label="تعديل" icon={FiEdit2} tone="blue" />
                ) : null}
                {actions.canManageProducts ? (
                  <ActionButton
                    onClick={() => onManageProducts(offer)}
                    label="المنتجات"
                    icon={FiPackage}
                    tone="neutral"
                  />
                ) : null}
                {actions.canActivate ? (
                  <ActionButton
                    onClick={() => onActivate(offer)}
                    label={busy ? "جارٍ التفعيل..." : "تفعيل"}
                    icon={busy ? null : FiPower}
                    tone="green"
                    disabled={busy}
                  />
                ) : null}
                {actions.canDeactivate ? (
                  <ActionButton
                    onClick={() => onDeactivate(offer)}
                    label={busy ? "جارٍ التعطيل..." : "تعطيل"}
                    icon={busy ? null : FiPower}
                    tone="amber"
                    disabled={busy}
                  />
                ) : null}
                {actions.canDelete ? (
                  <ActionButton onClick={() => onDelete(offer)} label="حذف" icon={FiTrash2} tone="red" />
                ) : null}
              </div>
            </SurfaceCard>
          );
        })}
      </div>
    </>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border px-3 py-3" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
      <p className="text-[11px] font-semibold" style={{ color: "var(--gray-9)" }}>
        {label}
      </p>
      <div className="mt-2 text-sm font-bold leading-6" style={{ color: "var(--gray-12)" }}>
        {value}
      </div>
    </div>
  );
}

function ProductSelector({ products, selectedIds, onToggle, error, disabled }) {
  const [query, setQuery] = useState("");

  const visibleProducts = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return products;
    return products.filter((product) =>
      [product.name, product.shortDescription, product.slug].filter(Boolean).join(" ").toLowerCase().includes(lower)
    );
  }, [products, query]);

  return (
    <div className="space-y-3">
      <Field label="منتجات العرض" required error={error} hint="يعرض هذا القسم المنتجات النشطة التابعة لمتجرك فقط.">
        <div className="space-y-3">
          <div className="relative">
            <FiSearch
              size={15}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: "var(--gray-8)" }}
            />
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث داخل منتجات متجرك..."
              className="pr-11"
              disabled={disabled}
            />
          </div>

          <div
            className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border p-3"
            style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}
          >
            {visibleProducts.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--gray-9)" }}>
                لا توجد منتجات مطابقة.
              </p>
            ) : (
              visibleProducts.map((product) => {
                const checked = selectedIds.some((id) => compareId(id, product.id));
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(product.id)}
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-right transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: checked ? "var(--blue-a6)" : "var(--gray-a5)",
                      background: checked ? "var(--blue-a2)" : "var(--gray-1)",
                      color: "var(--gray-12)",
                    }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{product.name}</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                        {product.shortDescription || product.slug || `#${product.id}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs font-semibold" style={{ color: "var(--gray-10)" }}>
                        {formatMoney(product.basePrice)}
                      </span>
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-md border"
                        style={{
                          borderColor: checked ? "var(--blue-9)" : "var(--gray-a6)",
                          background: checked ? "var(--blue-9)" : "transparent",
                          color: checked ? "#fff" : "transparent",
                        }}
                      >
                        <FiCheck size={12} />
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Field>
    </div>
  );
}

function validateOfferForm({ values, mode, originalOffer }) {
  const errors = {};
  const title = values.title.trim();
  const description = values.description.trim();
  const discountValue = Number(values.discountValue);
  const startInput = values.startDate;
  const endInput = values.endDate;
  const startMillis = toMillis(toApiDateTime(startInput));
  const endMillis = toMillis(toApiDateTime(endInput));
  const nowMillis = Date.now() - 60000;
  const isActiveEdit = mode === "edit" && originalOffer?.status === "ACTIVE";

  if (!title) {
    errors.title = "عنوان العرض مطلوب.";
  } else if (title.length < 2 || title.length > 255) {
    errors.title = "يجب أن يكون عنوان العرض بين حرفين و255 حرفًا.";
  }

  if (description.length > 2000) {
    errors.description = "الوصف طويل جدًا.";
  }

  if (mode === "create" || !isActiveEdit) {
    if (!values.discountType) {
      errors.discountType = "نوع الخصم مطلوب.";
    }

    if (!values.discountValue) {
      errors.discountValue = "قيمة الخصم مطلوبة.";
    } else if (Number.isNaN(discountValue) || discountValue <= 0) {
      errors.discountValue = "يجب أن تكون قيمة الخصم أكبر من صفر.";
    } else if (values.discountType === "PERCENT" && (discountValue < 1 || discountValue > 99)) {
      errors.discountValue = "يجب أن تكون نسبة الخصم بين 1 و99.";
    }

    if (!startInput) {
      errors.startDate = "تاريخ البدء مطلوب.";
    } else if (startMillis && startMillis < nowMillis) {
      errors.startDate = "يجب أن يكون تاريخ البدء الآن أو في المستقبل.";
    }
  }

  if (!endInput) {
    errors.endDate = "تاريخ الانتهاء مطلوب.";
  }

  if (!errors.startDate && !errors.endDate && startMillis && endMillis && endMillis <= startMillis) {
    errors.endDate = "يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء.";
  }

  if (values.maxUses) {
    const maxUses = Number(values.maxUses);
    if (Number.isNaN(maxUses) || maxUses <= 0) {
      errors.maxUses = "يجب أن يكون الحد الأقصى للاستخدامات رقمًا موجبًا.";
    }
  }

  if (mode === "create" && values.productIds.length === 0) {
    errors.productIds = "اختر منتجًا واحدًا على الأقل.";
  }

  return errors;
}

function buildCreatePayload(values) {
  const payload = {
    title: values.title.trim(),
    description: values.description.trim(),
    discountType: values.discountType,
    discountValue: Number(values.discountValue),
    startDate: toApiDateTime(values.startDate),
    endDate: toApiDateTime(values.endDate),
    items: values.productIds.map((productId) => ({ productId: Number(productId) })),
  };

  if (values.maxUses) {
    payload.maxUses = Number(values.maxUses);
  }

  return payload;
}

function buildUpdatePayload(values, originalOffer) {
  const isActive = originalOffer?.status === "ACTIVE";
  const payload = {
    offerId: originalOffer.offerId,
    title: values.title.trim(),
    description: values.description.trim(),
    endDate: toApiDateTime(values.endDate),
  };

  if (values.maxUses) {
    payload.maxUses = Number(values.maxUses);
  }

  if (!isActive) {
    payload.discountType = values.discountType;
    payload.discountValue = Number(values.discountValue);
    payload.startDate = toApiDateTime(values.startDate);
  }

  return payload;
}

function OfferFormDialog({ open, mode, offer, products, loadingProducts, onOpenChange, onSaved }) {
  const themeContainer = useThemeContainer();
  const [values, setValues] = useState({
    title: "",
    description: "",
    discountType: "PERCENT",
    discountValue: "",
    startDate: "",
    endDate: "",
    maxUses: "",
    productIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const isEdit = mode === "edit" && offer;
  const isActiveEdit = isEdit && offer.status === "ACTIVE";

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      setValues({
        title: offer.title || "",
        description: offer.description || "",
        discountType: offer.discountType || "PERCENT",
        discountValue: offer.discountValue != null ? String(offer.discountValue) : "",
        startDate: toDateTimeInputValue(offer.startDate),
        endDate: toDateTimeInputValue(offer.endDate),
        maxUses: offer.maxUses != null ? String(offer.maxUses) : "",
        productIds: (offer.items || []).map((item) => item.productId),
      });
    } else {
      setValues({
        title: "",
        description: "",
        discountType: "PERCENT",
        discountValue: "",
        startDate: "",
        endDate: "",
        maxUses: "",
        productIds: [],
      });
    }

    setFormError("");
    setFieldErrors({});
  }, [open, isEdit, offer]);

  const handleToggleProduct = (productId) => {
    setValues((current) => {
      const exists = current.productIds.some((id) => compareId(id, productId));
      return {
        ...current,
        productIds: exists
          ? current.productIds.filter((id) => !compareId(id, productId))
          : [...current.productIds, productId],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateOfferForm({
      values,
      mode,
      originalOffer: offer,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFormError("يرجى مراجعة الحقول المميزة قبل الحفظ.");
      return;
    }

    setSaving(true);
    setFormError("");
    setFieldErrors({});

    try {
      if (isEdit) {
        await offersApi.update(buildUpdatePayload(values, offer));
      } else {
        await offersApi.create(buildCreatePayload(values));
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      setFormError(getOfferMessage(error));
      setFieldErrors(mapFieldErrors(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay
          className="fixed inset-0 z-[9990]"
          style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(2px)" }}
        />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-0 z-[9991] flex items-center justify-center p-4"
          aria-describedby={undefined}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border shadow-2xl"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
          >
            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{ borderColor: "var(--gray-a5)" }}
            >
              <div>
                <Dialog.Title className="text-lg font-black" style={{ color: "var(--gray-12)" }}>
                  {isEdit ? "تعديل العرض" : "إنشاء عرض جديد"}
                </Dialog.Title>
                <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
                  {isEdit
                    ? isActiveEdit
                      ? "العرض النشط يسمح بتعديل العنوان والوصف وتاريخ الانتهاء والحد الأقصى فقط."
                      : "يمكن تعديل بيانات العرض طالما أنه غير منتهي."
                    : "أنشئ العرض وفق الحقول المدعومة، ثم فعّله عند الجاهزية."}
                </p>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-xl p-2 transition hover:opacity-80"
                  style={{ color: "var(--gray-10)" }}
                >
                  <FiX size={18} />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
              {formError ? (
                <div
                  className="mb-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor: "var(--red-a5)",
                    background: "var(--red-a2)",
                    color: "var(--red-11)",
                  }}
                >
                  <FiAlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-2">
                <Field label="عنوان العرض" required error={fieldErrors.title}>
                  <TextInput
                    value={values.title}
                    onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
                    placeholder="مثل: تخفيض نهاية الأسبوع"
                    maxLength={255}
                  />
                </Field>

                <Field
                  label="الحد الأقصى للاستخدامات"
                  error={fieldErrors.maxUses}
                  hint={isEdit ? "ترك الحقل كما هو يبقي القيمة الحالية. الحقل اختياري." : "الحقل اختياري."}
                >
                  <TextInput
                    dir="ltr"
                    type="number"
                    min="1"
                    value={values.maxUses}
                    onChange={(event) => setValues((current) => ({ ...current, maxUses: event.target.value }))}
                    placeholder="مثال: 100"
                    className="text-left"
                  />
                </Field>

                <div className="xl:col-span-2">
                  <Field label="وصف العرض" error={fieldErrors.description}>
                    <TextArea
                      value={values.description}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, description: event.target.value }))
                      }
                      placeholder="وصف مختصر يوضح تفاصيل العرض وشروطه."
                      maxLength={2000}
                    />
                  </Field>
                </div>

                <Field label="نوع الخصم" required error={fieldErrors.discountType}>
                  <SelectInput
                    value={values.discountType}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, discountType: event.target.value }))
                    }
                    options={DISCOUNT_TYPE_OPTIONS}
                    disabled={isActiveEdit}
                  />
                </Field>

                <Field
                  label={values.discountType === "PERCENT" ? "قيمة الخصم %" : "قيمة الخصم"}
                  required
                  error={fieldErrors.discountValue}
                  hint={
                    values.discountType === "PERCENT"
                      ? "يُقبل إدخال نسبة بين 1 و99 فقط."
                      : "يُخصم هذا المبلغ من كل متغير في المنتج."
                  }
                >
                  <TextInput
                    dir="ltr"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={values.discountValue}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, discountValue: event.target.value }))
                    }
                    placeholder={values.discountType === "PERCENT" ? "مثال: 20" : "مثال: 15.00"}
                    className="text-left"
                    disabled={isActiveEdit}
                  />
                </Field>

                <Field label="تاريخ بداية العرض" required error={fieldErrors.startDate}>
                  <DateTimeInput
                    value={values.startDate}
                    min={nowInputMin()}
                    onChange={(nextValue) =>
                      setValues((current) => ({ ...current, startDate: nextValue }))
                    }
                    disabled={isActiveEdit}
                    defaultTime="00:00"
                  />
                </Field>

                <Field label="تاريخ نهاية العرض" required error={fieldErrors.endDate}>
                  <DateTimeInput
                    value={values.endDate}
                    min={values.startDate || nowInputMin()}
                    onChange={(nextValue) =>
                      setValues((current) => ({ ...current, endDate: nextValue }))
                    }
                    defaultTime="23:59"
                  />
                </Field>

                {!isEdit ? (
                  <div className="xl:col-span-2">
                    {loadingProducts ? (
                      <div className="flex items-center justify-center rounded-2xl border px-4 py-8" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
                        <Spinner size={18} />
                      </div>
                    ) : (
                      <ProductSelector
                        products={products}
                        selectedIds={values.productIds}
                        onToggle={handleToggleProduct}
                        error={fieldErrors.productIds}
                        disabled={saving}
                      />
                    )}
                  </div>
                ) : (
                  <div className="xl:col-span-2">
                    <Field
                      label="منتجات العرض"
                      hint="إدارة المنتجات الحالية تتم من نافذة التفاصيل أو من زر المنتجات داخل القائمة."
                    >
                      <div
                        className="rounded-2xl border px-4 py-4 text-sm"
                        style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)", color: "var(--gray-11)" }}
                      >
                        يحتوي هذا العرض على {(offer?.items || []).length} منتج حاليًا.
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            </form>

            <div
              className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4"
              style={{ borderColor: "var(--gray-a5)" }}
            >
              <p className="text-xs" style={{ color: "var(--gray-8)" }}>
                {isEdit
                  ? "سيتم إرسال الحقول المدعومة فقط حسب حالة العرض الحالية."
                  : "سيتم إرسال الحقول المطلوبة فقط."}
              </p>
              <div className="flex items-center gap-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-2xl border px-4 py-2.5 text-sm font-semibold transition hover:text-blue-600"
                    style={{ borderColor: "var(--gray-a5)", background: "var(--gray-2)", color: "var(--gray-11)" }}
                  >
                    إلغاء
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? <Spinner size={14} /> : <FiCheck size={14} />}
                  {isEdit ? "حفظ التعديلات" : "إنشاء العرض"}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ConfirmDialog({ open, title, message, loading, onOpenChange, onConfirm }) {
  const themeContainer = useThemeContainer();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay
          className="fixed inset-0 z-[9990]"
          style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(2px)" }}
        />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-0 z-[9991] flex items-center justify-center p-4"
          aria-describedby={undefined}
        >
          <div
            className="w-full max-w-md rounded-[28px] border px-6 py-5 shadow-2xl"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
          >
            <Dialog.Title className="text-lg font-black" style={{ color: "var(--gray-12)" }}>
              {title}
            </Dialog.Title>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--gray-10)" }}>
              {message}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-2xl border px-4 py-2.5 text-sm font-semibold"
                  style={{ borderColor: "var(--gray-a5)", background: "var(--gray-2)", color: "var(--gray-11)" }}
                >
                  تراجع
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "var(--red-9)" }}
              >
                {loading ? <Spinner size={14} /> : <FiTrash2 size={14} />}
                تأكيد
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function OfferDetailsDialog({
  open,
  offer,
  loading,
  onOpenChange,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onManageProducts,
  onRemoveProduct,
}) {
  const themeContainer = useThemeContainer();
  const actions = offer ? getOfferActions(offer) : {};

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay
          className="fixed inset-0 z-[9990]"
          style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(2px)" }}
        />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-0 z-[9991] flex items-center justify-center p-4"
          aria-describedby={undefined}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border shadow-2xl"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
          >
            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{ borderColor: "var(--gray-a5)" }}
            >
              <div>
                <Dialog.Title className="text-lg font-black" style={{ color: "var(--gray-12)" }}>
                  تفاصيل العرض
                </Dialog.Title>
                {offer ? (
                  <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
                    #{offer.offerId} • {offer.title}
                  </p>
                ) : null}
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-xl p-2 transition hover:opacity-80"
                  style={{ color: "var(--gray-10)" }}
                >
                  <FiX size={18} />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner size={24} />
                </div>
              ) : !offer ? (
                <div
                  className="rounded-2xl border px-4 py-4 text-sm"
                  style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)", color: "var(--gray-10)" }}
                >
                  تعذر تحميل تفاصيل العرض.
                </div>
              ) : (
                <div className="space-y-5">
                  <SurfaceCard className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black" style={{ color: "var(--gray-12)" }}>
                            {offer.title}
                          </h3>
                          <StatusBadge status={offer.status} />
                          <DiscountBadge type={offer.discountType} value={offer.discountValue} />
                        </div>
                        {offer.description ? (
                          <p className="max-w-3xl text-sm leading-7" style={{ color: "var(--gray-10)" }}>
                            {offer.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {actions.canEdit ? (
                          <ActionButton onClick={() => onEdit(offer)} label="تعديل" icon={FiEdit2} tone="blue" />
                        ) : null}
                        {actions.canManageProducts ? (
                          <ActionButton
                            onClick={() => onManageProducts(offer)}
                            label="إدارة المنتجات"
                            icon={FiPackage}
                            tone="neutral"
                          />
                        ) : null}
                        {actions.canActivate ? (
                          <ActionButton onClick={() => onActivate(offer)} label="تفعيل" icon={FiPower} tone="green" />
                        ) : null}
                        {actions.canDeactivate ? (
                          <ActionButton onClick={() => onDeactivate(offer)} label="تعطيل" icon={FiPower} tone="amber" />
                        ) : null}
                        {actions.canDelete ? (
                          <ActionButton onClick={() => onDelete(offer)} label="حذف" icon={FiTrash2} tone="red" />
                        ) : null}
                      </div>
                    </div>
                  </SurfaceCard>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <SurfaceCard className="p-5">
                      <h4 className="text-sm font-black" style={{ color: "var(--gray-12)" }}>
                        معلومات العرض
                      </h4>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <MiniStat label="نوع الخصم" value={getDiscountTypeLabel(offer.discountType)} />
                        <MiniStat label="قيمة الخصم" value={offer.discountType === "PERCENT" ? `${offer.discountValue}%` : formatMoney(offer.discountValue)} />
                        <MiniStat label="عدد المنتجات" value={`${(offer.items || []).length} منتج`} />
                        <MiniStat label="الاستخدامات الحالية" value={offer.currentUses ?? 0} />
                        <MiniStat label="الحد الأقصى" value={offer.maxUses ?? "غير محدود"} />
                        <MiniStat label="المتجر" value={offer.shop?.name || `#${offer.shopId}`} />
                      </div>
                    </SurfaceCard>

                    <SurfaceCard className="p-5">
                      <h4 className="text-sm font-black" style={{ color: "var(--gray-12)" }}>
                        الجدولة الزمنية
                      </h4>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <MiniStat label="يبدأ" value={formatDateTime(offer.startDate)} />
                        <MiniStat label="ينتهي" value={formatDateTime(offer.endDate)} />
                      </div>
                    </SurfaceCard>
                  </div>

                  <SurfaceCard className="overflow-hidden">
                    <div
                      className="flex items-center justify-between border-b px-5 py-4"
                      style={{ borderColor: "var(--gray-a5)" }}
                    >
                      <div>
                        <h4 className="text-sm font-black" style={{ color: "var(--gray-12)" }}>
                          منتجات العرض
                        </h4>
                        <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                          الخصم يطبق على المنتج كاملًا، وتفاصيل المتغيرات تظهر كما تم حفظها.
                        </p>
                      </div>
                    </div>

                    {!offer.items || offer.items.length === 0 ? (
                      <div className="px-5 py-6 text-sm" style={{ color: "var(--gray-9)" }}>
                        لا توجد منتجات داخل هذا العرض.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-right text-sm">
                          <thead style={{ background: "var(--gray-a2)", color: "var(--gray-9)" }}>
                            <tr>
                              {["المنتج", "الفئة", "البراند", "المتغيرات", "حالة العنصر", ""].map((header) => (
                                <th key={header} className="px-5 py-4 text-xs font-semibold">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {offer.items.map((item) => (
                              <tr key={item.offerItemId || item.productId} style={{ borderTop: "1px solid var(--gray-a4)" }}>
                                <td className="px-5 py-4">
                                  <div>
                                    <p className="font-semibold" style={{ color: "var(--gray-12)" }}>
                                      {item.product?.name || `#${item.productId}`}
                                    </p>
                                    <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                                      {item.product?.shortDescription || item.product?.slug || ""}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-5 py-4" style={{ color: "var(--gray-10)" }}>
                                  {item.product?.categoryName || "—"}
                                </td>
                                <td className="px-5 py-4" style={{ color: "var(--gray-10)" }}>
                                  {item.product?.brandName || "—"}
                                </td>
                                <td className="px-5 py-4">
                                  <div className="space-y-2">
                                    {getProductVariantRows(item).length === 0 ? (
                                      <span className="text-xs" style={{ color: "var(--gray-9)" }}>
                                        لا توجد أسعار متغيرات معادة.
                                      </span>
                                    ) : (
                                      getProductVariantRows(item).map((variant) => (
                                        <div
                                          key={variant.variantId}
                                          className="rounded-2xl border px-3 py-3 text-xs"
                                          style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}
                                        >
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-semibold" style={{ color: "var(--gray-12)" }}>
                                              {variant.variantName}
                                              {variant.isDefault ? " • الافتراضي" : ""}
                                            </span>
                                            <span style={{ color: "var(--green-11)" }}>
                                              {formatMoney(variant.discountedPrice)}
                                            </span>
                                          </div>
                                          <div className="mt-1 flex flex-wrap items-center gap-3" style={{ color: "var(--gray-9)" }}>
                                            <span>الأصلي: {formatMoney(variant.originalPrice)}</span>
                                            <span>الخصم: {variant.discountType === "PERCENT" ? `${variant.discountValue}%` : formatMoney(variant.discountValue)}</span>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <span
                                    className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                                    style={{
                                      background:
                                        item.status === "ACTIVE" ? "var(--green-a3)" : "var(--gray-a3)",
                                      color: item.status === "ACTIVE" ? "var(--green-11)" : "var(--gray-11)",
                                    }}
                                  >
                                    {item.status === "ACTIVE" ? "نشط" : "مزال"}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  {actions.canManageProducts ? (
                                    <ActionButton
                                      onClick={() => onRemoveProduct(offer.offerId, item.productId)}
                                      label="إزالة"
                                      icon={FiTrash2}
                                      tone="red"
                                    />
                                  ) : null}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </SurfaceCard>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AddProductsDialog({ open, offer, products, onOpenChange, onSaved }) {
  const themeContainer = useThemeContainer();
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedIds([]);
    setError("");
  }, [open]);

  const existingIds = useMemo(
    () => new Set((offer?.items || []).map((item) => String(item.productId))),
    [offer]
  );

  const availableProducts = useMemo(
    () => products.filter((product) => !existingIds.has(String(product.id))),
    [products, existingIds]
  );

  const handleToggle = (productId) => {
    setSelectedIds((current) =>
      current.some((id) => compareId(id, productId))
        ? current.filter((id) => !compareId(id, productId))
        : [...current, productId]
    );
  };

  const handleSubmit = async () => {
    if (!offer) return;
    if (selectedIds.length === 0) {
      setError("اختر منتجًا واحدًا على الأقل.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      for (const productId of selectedIds) {
        await offersApi.addProduct(offer.offerId, Number(productId));
      }
      onSaved?.();
      onOpenChange(false);
    } catch (submissionError) {
      setError(getOfferMessage(submissionError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay
          className="fixed inset-0 z-[9990]"
          style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(2px)" }}
        />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-0 z-[9991] flex items-center justify-center p-4"
          aria-describedby={undefined}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border shadow-2xl"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
          >
            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{ borderColor: "var(--gray-a5)" }}
            >
              <div>
                <Dialog.Title className="text-lg font-black" style={{ color: "var(--gray-12)" }}>
                  إضافة منتجات إلى العرض
                </Dialog.Title>
                <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
                  {offer?.title || ""}
                </p>
              </div>
              <Dialog.Close asChild>
                <button type="button" className="rounded-xl p-2" style={{ color: "var(--gray-10)" }}>
                  <FiX size={18} />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {error ? (
                <div
                  className="mb-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor: "var(--red-a5)",
                    background: "var(--red-a2)",
                    color: "var(--red-11)",
                  }}
                >
                  <FiAlertCircle size={15} />
                  <span>{error}</span>
                </div>
              ) : null}

              <ProductSelector
                products={availableProducts}
                selectedIds={selectedIds}
                onToggle={handleToggle}
                disabled={saving}
              />
            </div>

            <div
              className="flex items-center justify-end gap-2 border-t px-6 py-4"
              style={{ borderColor: "var(--gray-a5)" }}
            >
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-2xl border px-4 py-2.5 text-sm font-semibold"
                  style={{ borderColor: "var(--gray-a5)", background: "var(--gray-2)", color: "var(--gray-11)" }}
                >
                  إلغاء
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <Spinner size={14} /> : <FiPlus size={14} />}
                إضافة المنتجات المحددة
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function Offers() {
  const [allOffers, setAllOffers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [rowBusy, setRowBusy] = useState({});

  const [filters, setFilters] = useState({
    query: "",
    status: "ALL",
    discountType: "ALL",
    productId: "ALL",
    startFrom: "",
    startTo: "",
    endFrom: "",
    endTo: "",
  });

  const [formState, setFormState] = useState({ open: false, mode: "create", offer: null });
  const [detailsState, setDetailsState] = useState({ open: false, offer: null, loading: false });
  const [addProductsState, setAddProductsState] = useState({ open: false, offer: null });
  const [deleteState, setDeleteState] = useState({ open: false, offer: null, loading: false });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await productsApi.getAllList({ isActive: "true" });
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setProducts(list);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const loadOffers = useCallback(async (status) => {
    setLoading(true);
    setError("");

    try {
      const [allList, visibleList] = await Promise.all([
        offersApi.getShopOffers(),
        status && status !== "ALL"
          ? offersApi.getShopOffersByStatus(status)
          : offersApi.getShopOffers(),
      ]);

      setAllOffers(Array.isArray(allList) ? allList : []);
      setOffers(Array.isArray(visibleList) ? visibleList : []);
    } catch (loadError) {
      setAllOffers([]);
      setOffers([]);
      setError(getOfferMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadOffers(filters.status);
  }, [filters.status, loadOffers]);

  const refresh = useCallback(async () => {
    await Promise.all([loadProducts(), loadOffers(filters.status)]);
  }, [filters.status, loadOffers, loadProducts]);

  const visibleOffers = useMemo(() => applyFilters(offers, filters), [offers, filters]);
  const statsSource = useMemo(() => buildStats(allOffers), [allOffers]);

  const productFilterOptions = useMemo(() => {
    const map = new Map();

    allOffers.forEach((offer) => {
      (offer.items || []).forEach((item) => {
        if (!item?.productId) return;
        if (!map.has(String(item.productId))) {
          map.set(String(item.productId), {
            id: item.productId,
            name: item.product?.name || `#${item.productId}`,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [allOffers]);

  const openCreate = () => {
    setFormState({ open: true, mode: "create", offer: null });
  };

  const openEdit = async (offer) => {
    setDetailsState((current) => ({ ...current, loading: false }));
    setFormState({ open: true, mode: "edit", offer });
    try {
      const latest = await offersApi.getById(offer.offerId);
      setFormState({ open: true, mode: "edit", offer: latest });
    } catch (fetchError) {
      showToast(getOfferMessage(fetchError), "error");
    }
  };

  const openDetails = async (offer) => {
    setDetailsState({ open: true, offer: null, loading: true });
    try {
      const latest = await offersApi.getById(offer.offerId);
      setDetailsState({ open: true, offer: latest, loading: false });
    } catch (fetchError) {
      setDetailsState({ open: true, offer: offer || null, loading: false });
      showToast(getOfferMessage(fetchError), "error");
    }
  };

  const openManageProducts = async (offer) => {
    try {
      const latest = await offersApi.getById(offer.offerId);
      setAddProductsState({ open: true, offer: latest });
    } catch (fetchError) {
      showToast(getOfferMessage(fetchError), "error");
    }
  };

  const runRowAction = async (offerId, action, successMessage, failureFallback) => {
    setRowBusy((current) => ({ ...current, [offerId]: true }));
    try {
      await action();
      await loadOffers(filters.status);
      showToast(successMessage);
      if (detailsState.offer?.offerId === offerId) {
        try {
          const latest = await offersApi.getById(offerId);
          setDetailsState({ open: true, offer: latest, loading: false });
        } catch {
          setDetailsState((current) => ({ ...current, loading: false }));
        }
      }
    } catch (actionError) {
      showToast(getOfferMessage(actionError) || failureFallback, "error");
    } finally {
      setRowBusy((current) => ({ ...current, [offerId]: false }));
    }
  };

  const handleActivate = (offer) =>
    runRowAction(
      offer.offerId,
      () => offersApi.activate(offer.offerId),
      "تم تفعيل العرض بنجاح.",
      "تعذر تفعيل العرض."
    );

  const handleDeactivate = (offer) =>
    runRowAction(
      offer.offerId,
      () => offersApi.deactivate(offer.offerId),
      "تم تعطيل العرض بنجاح.",
      "تعذر تعطيل العرض."
    );

  const handleDelete = async () => {
    if (!deleteState.offer) return;
    setDeleteState((current) => ({ ...current, loading: true }));
    try {
      await offersApi.remove(deleteState.offer.offerId);
      setDeleteState({ open: false, offer: null, loading: false });
      await loadOffers(filters.status);
      showToast("تم حذف العرض بنجاح.");
      if (detailsState.offer?.offerId === deleteState.offer.offerId) {
        setDetailsState({ open: false, offer: null, loading: false });
      }
    } catch (removeError) {
      setDeleteState((current) => ({ ...current, loading: false }));
      showToast(getOfferMessage(removeError), "error");
    }
  };

  const handleRemoveProduct = async (offerId, productId) => {
    try {
      await offersApi.removeProduct(offerId, productId);
      await loadOffers(filters.status);
      showToast("تمت إزالة المنتج من العرض.");
      if (detailsState.offer?.offerId === offerId) {
        const latest = await offersApi.getById(offerId);
        setDetailsState({ open: true, offer: latest, loading: false });
      }
    } catch (removeError) {
      showToast(getOfferMessage(removeError), "error");
    }
  };

  const handleSaved = async () => {
    await loadOffers(filters.status);
    showToast(formState.mode === "edit" ? "تم تحديث العرض بنجاح." : "تم إنشاء العرض بنجاح.");
  };

  const handleProductsSaved = async () => {
    await loadOffers(filters.status);
    showToast("تمت إضافة المنتجات المحددة إلى العرض.");
    if (addProductsState.offer?.offerId) {
      const latest = await offersApi.getById(addProductsState.offer.offerId);
      setAddProductsState({ open: false, offer: null });
      setDetailsState({ open: true, offer: latest, loading: false });
    }
  };

  return (
    <div dir="rtl" className="space-y-5 pb-10">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}

      <FiltersBar
        filters={filters}
        productOptions={productFilterOptions}
        onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
        onResetDates={() =>
          setFilters((current) => ({
            ...current,
            startFrom: "",
            startTo: "",
            endFrom: "",
            endTo: "",
          }))
        }
        onReset={() =>
          setFilters({
            query: "",
            status: "ALL",
            discountType: "ALL",
            productId: "ALL",
            startFrom: "",
            startTo: "",
            endFrom: "",
            endTo: "",
          })
        }
        onRefresh={refresh}
        onCreate={openCreate}
      />

      <StatsRow
        offers={allOffers}
        currentStatusFilter={filters.status}
        onSelectStatus={(value) => setFilters((current) => ({ ...current, status: value }))}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : visibleOffers.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <OffersTable
          offers={visibleOffers}
          rowBusy={rowBusy}
          onView={openDetails}
          onEdit={openEdit}
          onDelete={(offer) => setDeleteState({ open: true, offer, loading: false })}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onManageProducts={openManageProducts}
        />
      )}

      <OfferFormDialog
        open={formState.open}
        mode={formState.mode}
        offer={formState.offer}
        products={products}
        loadingProducts={loadingProducts}
        onOpenChange={(open) =>
          setFormState((current) => ({
            ...current,
            open,
          }))
        }
        onSaved={handleSaved}
      />

      <OfferDetailsDialog
        open={detailsState.open}
        offer={detailsState.offer}
        loading={detailsState.loading}
        onOpenChange={(open) => setDetailsState((current) => ({ ...current, open }))}
        onEdit={openEdit}
        onDelete={(offer) => setDeleteState({ open: true, offer, loading: false })}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onManageProducts={openManageProducts}
        onRemoveProduct={handleRemoveProduct}
      />

      <AddProductsDialog
        open={addProductsState.open}
        offer={addProductsState.offer}
        products={products}
        onOpenChange={(open) => setAddProductsState((current) => ({ ...current, open }))}
        onSaved={handleProductsSaved}
      />

      <ConfirmDialog
        open={deleteState.open}
        title="حذف العرض"
        message={
          deleteState.offer
            ? `سيتم حذف العرض "${deleteState.offer.title}" نهائيًا. لا تستخدم هذا الإجراء مع العروض النشطة لأنه غير مسموح حاليًا.`
            : ""
        }
        loading={deleteState.loading}
        onOpenChange={(open) => setDeleteState((current) => ({ ...current, open }))}
        onConfirm={handleDelete}
      />
    </div>
  );
}
