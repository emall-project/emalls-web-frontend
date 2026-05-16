import { useCallback, useEffect, useState } from "react";
import { useSortedData, SortableTh } from "../../../utils/tableSort";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiEye,
  FiImage,
  FiLoader,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTag,
  FiUser,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { shopRequestsApi } from "./api";

const NONE = "__NONE__";
const TAB_OWNER = "owner";
const TAB_EXISTING = "existing";

const TAB_CONFIG = {
  [TAB_OWNER]: {
    label: "طلبات فتح متجر جديدة",
    subtitle: "طلبات الانضمام الجديدة من أصحاب المتاجر غير المعتمدين بعد.",
  },
  [TAB_EXISTING]: {
    label: "طلبات متجر إضافي",
    subtitle: "طلبات إضافة متجر جديد من أصحاب المتاجر المعتمدين حاليًا.",
  },
};

const STATUS_LABELS = {
  PENDING: "قيد المراجعة",
  APPROVED: "تمت الموافقة",
  REJECTED: "تم الرفض",
};

const STATUS_TONES = {
  PENDING: { bg: "var(--amber-a3)", fg: "var(--amber-11)", dot: "var(--amber-9)" },
  APPROVED: { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)" },
  REJECTED: { bg: "var(--red-a3)", fg: "var(--red-11)", dot: "var(--red-9)" },
  UNKNOWN: { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" },
};

const GENDER_LABELS = {
  MALE: "ذكر",
  FEMALE: "أنثى",
  NOT_SPECIFIED: "غير محدد",
};

const CATEGORY_LABELS = {
  CLOTHING: "ملابس",
  ELECTRONICS: "إلكترونيات",
  FOOD: "أغذية",
  BEVERAGES: "مشروبات",
  BOOKS: "كتب",
  TOYS: "ألعاب",
  JEWELRY: "مجوهرات",
  SPORTS: "رياضة",
  HEALTH: "صحة",
  BEAUTY: "جمال",
  HOME: "منزل",
  FURNITURE: "أثاث",
  OTHER: "أخرى",
};

const CONTACT_LABELS = {
  phone: "الهاتف",
  email: "البريد الإلكتروني",
  whatsapp: "واتساب",
  instagram: "إنستغرام",
  mobile: "الجوال",
  facebook: "فيسبوك",
  website: "الموقع الإلكتروني",
};

const DEFAULT_STATS = { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };

const OWNER_DRAFT_DEFAULTS = {
  username: "",
  email: "",
  phone: "",
  status: "",
};

const OWNER_QUERY_DEFAULTS = {
  page: 0,
  size: 20,
  username: "",
  email: "",
  phone: "",
  status: "",
};

const EXISTING_DRAFT_DEFAULTS = {
  username: "",
  status: "",
  mallId: "",
  name: "",
  category: "",
};

const EXISTING_QUERY_DEFAULTS = {
  page: 0,
  size: 20,
  username: "",
  status: "",
  mallId: "",
  name: "",
  category: "",
};

const INITIAL_DETAIL_STATE = {
  open: false,
  flow: TAB_OWNER,
  id: null,
  loading: false,
  error: "",
  data: null,
};

const INITIAL_ACTION_STATE = {
  open: false,
  flow: TAB_OWNER,
  id: null,
  mode: "approve",
  title: "",
  reason: "",
  saving: false,
  error: "",
};

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium"
      style={{
        background: type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color: type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}
    >
      {type === "success" ? <FiCheckCircle size={15} /> : <FiAlertCircle size={15} />}
      <span>{message}</span>
      <button type="button" onClick={onClose} className="opacity-60 hover:opacity-100">
        <FiX size={14} />
      </button>
    </div>
  );
}

function AppSelect({
  value,
  onValueChange,
  placeholder = "اختر...",
  options = [],
  disabled = false,
  width = "100%",
}) {
  const container = document.querySelector(".radix-themes") || document.body;
  const radixValue = value === "" || value == null ? NONE : value;

  return (
    <Select.Root
      value={radixValue}
      onValueChange={(next) => onValueChange(next === NONE ? "" : next)}
      disabled={disabled}
      dir="rtl"
    >
      <Select.Trigger
        className="inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm border outline-none transition-all data-[state=open]:border-blue-500 data-[state=open]:ring-2 data-[state=open]:ring-blue-500/20 data-[disabled]:opacity-50"
        style={{
          width,
          background: "var(--gray-a2)",
          borderColor: "var(--gray-a6)",
          color: radixValue === NONE ? "var(--gray-9)" : "var(--gray-12)",
        }}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon asChild>
          <FiChevronDown size={13} style={{ color: "var(--gray-9)", flexShrink: 0 }} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal container={container}>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-[9999] rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            background: "var(--gray-2)",
            borderColor: "var(--gray-a6)",
            minWidth: "var(--radix-select-trigger-width)",
            maxHeight: 280,
          }}
        >
          <Select.Viewport className="p-1.5 space-y-0.5">
            {options.map(({ value: optionValue, label, disabled: optionDisabled }) => (
              <Select.Item
                key={optionValue}
                value={optionValue === "" ? NONE : optionValue}
                disabled={optionDisabled}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer outline-none select-none data-[highlighted]:opacity-80 data-[disabled]:opacity-40 transition-colors"
                style={{ color: "var(--gray-12)", background: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gray-a3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Select.ItemText>{label}</Select.ItemText>
                <Select.ItemIndicator>
                  <FiCheck size={13} style={{ color: "var(--blue-9)" }} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function StatusBadge({ status }) {
  const tone = STATUS_TONES[status] || STATUS_TONES.UNKNOWN;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ background: tone.bg, color: tone.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone.dot }} />
      {STATUS_LABELS[status] || status || "غير محدد"}
    </span>
  );
}

function ModeBadge({ mode }) {
  const isExisting = mode === "existing";
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{
        background: isExisting ? "var(--blue-a3)" : "var(--purple-a3)",
        color: isExisting ? "var(--blue-11)" : "var(--purple-11)",
      }}
    >
      {isExisting ? "مول قائم" : "مول جديد"}
    </span>
  );
}

function MetricCard({ label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border transition-all text-center min-w-[104px]"
      style={{
        background: active ? "var(--blue-a3)" : "var(--gray-1)",
        borderColor: active ? "var(--blue-a6)" : "var(--gray-a5)",
        boxShadow: active ? "0 0 0 2px var(--blue-a4)" : "none",
      }}
    >
      <span className="text-xl font-bold" style={{ color: active ? "var(--blue-11)" : "var(--gray-12)" }}>
        {Number(value || 0).toLocaleString("ar-EG")}
      </span>
      <span className="text-[11px]" style={{ color: active ? "var(--blue-10)" : "var(--gray-10)" }}>
        {label}
      </span>
    </button>
  );
}

function CopyButton({ value }) {
  if (!value) return null;

  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(String(value))}
      className="inline-flex items-center justify-center rounded-lg p-1 transition hover:opacity-80"
      style={{ color: "var(--gray-9)", background: "var(--gray-a3)" }}
      title="نسخ"
    >
      <FiCopy size={12} />
    </button>
  );
}

function SectionCard({ title, children, action }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoField({ label, value, dir = "rtl", copyValue }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold" style={{ color: "var(--gray-9)" }}>
        {label}
      </div>
      <div
        className="rounded-xl border px-3 py-2.5 text-sm min-h-[46px] flex items-center justify-between gap-2"
        style={{
          background: "var(--gray-a2)",
          borderColor: "var(--gray-a4)",
          color: "var(--gray-12)",
          direction: dir,
        }}
      >
        <span className="break-words">{value || "—"}</span>
        <CopyButton value={copyValue || value} />
      </div>
    </div>
  );
}

function MediaTile({ label, file }) {
  const imageUrl = getFileUrl(file);

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
    >
      <div className="aspect-[4/3] overflow-hidden" style={{ background: "var(--gray-a4)" }}>
        {imageUrl ? (
          <a href={imageUrl} target="_blank" rel="noreferrer" className="block w-full h-full">
            <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
          </a>
        ) : (
          <div className="h-full flex items-center justify-center">
            <FiImage size={22} style={{ color: "var(--gray-9)" }} />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
          {label}
        </div>
        <div className="text-xs mt-1 truncate" style={{ color: "var(--gray-9)" }}>
          {file?.name || "لا يوجد ملف"}
        </div>
      </div>
    </div>
  );
}

function ActionDialog({ state, onClose, onSubmit }) {
  const isReject = state.mode === "reject";

  return (
    <Dialog.Root open={state.open} onOpenChange={(open) => !open && !state.saving && onClose()}>
      <Dialog.Portal container={document.querySelector(".radix-themes") || document.body}>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl border p-6 shadow-2xl"
          style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
        >
          <div className="flex items-center justify-between gap-3 mb-5">
            <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
              {isReject ? "رفض الطلب" : "تأكيد الموافقة"}
            </Dialog.Title>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--gray-10)" }}>
              <FiX size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div
              className="rounded-xl border px-4 py-3 text-sm leading-7"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)", color: "var(--gray-11)" }}
            >
              {isReject
                ? `سيتم رفض الطلب المرتبط بـ ${state.title || `#${state.id}`}. أدخل سبب الرفض قبل المتابعة.`
                : `سيتم اعتماد الطلب المرتبط بـ ${state.title || `#${state.id}`}. هل تريد المتابعة؟`}
            </div>

            {isReject && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-11)" }}>
                  سبب الرفض <span style={{ color: "var(--red-9)" }}>*</span>
                </label>
                <textarea
                  value={state.reason}
                  onChange={(e) => state.setReason(e.target.value)}
                  rows={4}
                  placeholder="اذكر سبب الرفض بوضوح..."
                  className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none resize-none"
                  style={{
                    background: "var(--gray-a2)",
                    borderColor: "var(--gray-a6)",
                    color: "var(--gray-12)",
                  }}
                />
              </div>
            )}

            {state.error && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}
              >
                <FiAlertCircle size={13} />
                {state.error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onSubmit}
                disabled={state.saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{
                  background: isReject ? "var(--red-9)" : "var(--green-9)",
                  color: "#fff",
                }}
              >
                {state.saving ? <Spinner size={14} /> : isReject ? <FiXCircle size={14} /> : <FiCheckCircle size={14} />}
                {state.saving ? "جاري الحفظ..." : isReject ? "تأكيد الرفض" : "تأكيد الموافقة"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition"
                style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DetailsDialog({ state, onClose, onApprove, onReject }) {
  const data = state.data;
  const flow = state.flow;
  const isOwnerFlow = flow === TAB_OWNER;
  const shopRequest = isOwnerFlow ? data?.shopRequest || {} : data || {};
  const ownerUser = isOwnerFlow ? data : data?.shopOwnerUser || {};
  const mallInfo = getMallInfo(shopRequest);
  const contactEntries = getContactEntries(shopRequest?.contactInfo);
  const isPending = (isOwnerFlow ? data?.status : data?.status) === "PENDING";
  const shopPhotos = Array.isArray(shopRequest?.shopPhotos) ? shopRequest.shopPhotos : [];

  return (
    <Dialog.Root open={state.open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal container={document.querySelector(".radix-themes") || document.body}>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(96vw,1120px)] max-h-[88vh] overflow-y-auto rounded-[28px] border p-6 shadow-2xl"
          style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <Dialog.Title className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>
                {isOwnerFlow ? "تفاصيل طلب فتح متجر" : "تفاصيل طلب متجر إضافي"}
              </Dialog.Title>
              <p className="text-sm mt-1" style={{ color: "var(--gray-10)" }}>
                {isOwnerFlow
                  ? "عرض شامل لبيانات صاحب الطلب والمتجر والمرفقات المرتبطة به."
                  : "عرض شامل لطلب المتجر الإضافي الخاص بصاحب متجر معتمد."}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:opacity-70" style={{ color: "var(--gray-10)" }}>
              <FiX size={16} />
            </button>
          </div>

          {state.loading ? (
            <div className="py-20 flex items-center justify-center gap-3" style={{ color: "var(--gray-10)" }}>
              <Spinner size={20} />
              <span className="text-sm">جاري تحميل تفاصيل الطلب...</span>
            </div>
          ) : state.error ? (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}
            >
              <FiAlertCircle size={15} />
              <span>{state.error}</span>
            </div>
          ) : !data ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--gray-10)" }}>
              لا توجد بيانات لعرضها.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={isOwnerFlow ? data.status : data.status} />
                <ModeBadge mode={mallInfo.mode} />
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}
                >
                  رقم الطلب #{data.id}
                </span>
              </div>

              {isOwnerFlow ? (
                <>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <SectionCard title="بيانات صاحب الطلب">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoField label="الاسم الكامل" value={data.fullName} />
                        <InfoField label="الجنس" value={GENDER_LABELS[data.gender] || data.gender || "—"} />
                        <InfoField label="العمر" value={data.age != null ? `${data.age}` : "—"} dir="ltr" />
                        <InfoField label="رقم الهوية" value={data.nationalIdNumber || "—"} dir="ltr" copyValue={data.nationalIdNumber} />
                      </div>
                    </SectionCard>

                    <SectionCard title="بيانات الحساب">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoField label="اسم المستخدم" value={data.username} dir="ltr" copyValue={data.username} />
                        <InfoField label="البريد الإلكتروني" value={data.email || "—"} dir="ltr" copyValue={data.email} />
                        <InfoField label="رقم الهاتف" value={formatPhone(data.phone)} dir="ltr" copyValue={formatPhone(data.phone)} />
                        <InfoField label="المستخدم المُنشأ" value={data.createdUserId != null ? `#${data.createdUserId}` : "لم يُنشأ بعد"} dir="ltr" />
                      </div>
                    </SectionCard>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <SectionCard title="بيانات المتجر">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoField label="اسم المتجر" value={shopRequest.name} />
                        <InfoField label="الفئة" value={CATEGORY_LABELS[shopRequest.category] || shopRequest.category || "—"} />
                        <InfoField label="الموقع" value={shopRequest.location} />
                        <InfoField label="المتجر المُنشأ" value={shopRequest.createdShopId != null ? `#${shopRequest.createdShopId}` : "لم يُنشأ بعد"} dir="ltr" />
                      </div>
                      <div className="mt-3">
                        <InfoField label="الوصف" value={shopRequest.description || "—"} />
                      </div>
                    </SectionCard>

                    <SectionCard title="الربط بالمول">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoField label="نوع الطلب" value={mallInfo.mode === "existing" ? "مول قائم" : "مول جديد"} />
                        <InfoField label="المول / الطلب" value={mallInfo.title} />
                        <InfoField label="المدينة" value={mallInfo.cityName || "—"} />
                        <InfoField label="رقم المول" value={shopRequest.mallId != null ? `#${shopRequest.mallId}` : "—"} dir="ltr" />
                      </div>
                    </SectionCard>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <SectionCard title="بيانات صاحب المتجر الحالي">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoField label="الاسم الكامل" value={ownerUser.fullName || "—"} />
                        <InfoField label="اسم المستخدم" value={ownerUser.username || "—"} dir="ltr" copyValue={ownerUser.username} />
                        <InfoField label="البريد الإلكتروني" value={ownerUser.email || "—"} dir="ltr" copyValue={ownerUser.email} />
                        <InfoField label="رقم الهاتف" value={formatPhone(ownerUser.phone)} dir="ltr" copyValue={formatPhone(ownerUser.phone)} />
                        <InfoField label="رقم المستخدم" value={data.existingUserId != null ? `#${data.existingUserId}` : "—"} dir="ltr" />
                        <InfoField label="رقم المتجر المُنشأ" value={data.createdShopId != null ? `#${data.createdShopId}` : "لم يُنشأ بعد"} dir="ltr" />
                      </div>
                    </SectionCard>

                    <SectionCard title="بيانات المتجر المطلوب">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoField label="اسم المتجر" value={data.name} />
                        <InfoField label="الفئة" value={CATEGORY_LABELS[data.category] || data.category || "—"} />
                        <InfoField label="الموقع" value={data.location} />
                        <InfoField label="رقم الطلب المرتبط" value={data.shopOwnerRequestId != null ? `#${data.shopOwnerRequestId}` : "—"} dir="ltr" />
                      </div>
                      <div className="mt-3">
                        <InfoField label="الوصف" value={data.description || "—"} />
                      </div>
                    </SectionCard>
                  </div>

                  <SectionCard title="الربط بالمول">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoField label="نوع الطلب" value={mallInfo.mode === "existing" ? "مول قائم" : "مول جديد"} />
                      <InfoField label="المول / الطلب" value={mallInfo.title} />
                      <InfoField label="المدينة" value={mallInfo.cityName || "—"} />
                      <InfoField label="رقم المول" value={data.mallId != null ? `#${data.mallId}` : "—"} dir="ltr" />
                    </div>
                  </SectionCard>
                </>
              )}

              <SectionCard title="التواصل">
                {contactEntries.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {contactEntries.map(([key, value]) => (
                      <InfoField key={key} label={CONTACT_LABELS[key] || key} value={String(value)} dir="ltr" copyValue={String(value)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm" style={{ color: "var(--gray-10)" }}>
                    لا توجد معلومات تواصل إضافية.
                  </div>
                )}
              </SectionCard>

              <SectionCard title="الصور والمرفقات">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {isOwnerFlow ? (
                      <MediaTile label="الصورة الشخصية" file={data.profilePictureImage} />
                    ) : null}
                    <MediaTile label="شعار المتجر" file={shopRequest.logoImage} />
                    <MediaTile label="صورة الترخيص" file={shopRequest.licenseImage} />
                  </div>

                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: "var(--gray-11)" }}>
                      صور المتجر
                    </div>
                    {shopPhotos.length ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {shopPhotos.map((file) => (
                          <MediaTile key={file.id || file.name} label={file.name || "صورة متجر"} file={file} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm" style={{ color: "var(--gray-10)" }}>
                        لا توجد صور متجر مرفوعة.
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="حالة الطلب"
                action={
                  isPending ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onApprove(data.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                        style={{ background: "var(--green-9)", color: "#fff" }}
                      >
                        <FiCheck size={13} />
                        موافقة
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(data.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                        style={{ background: "var(--red-9)", color: "#fff" }}
                      >
                        <FiX size={13} />
                        رفض
                      </button>
                    </div>
                  ) : null
                }
              >
                <div className="grid gap-3 lg:grid-cols-3">
                  <InfoField label="الحالة الحالية" value={STATUS_LABELS[data.status] || data.status || "—"} />
                  {isOwnerFlow ? (
                    <InfoField
                      label="حالة إنشاء الحساب/المتجر"
                      value={
                        data.createdUserId || shopRequest.createdShopId
                          ? "تم إنشاء البيانات المرتبطة"
                          : "بانتظار الإجراء"
                      }
                    />
                  ) : (
                    <InfoField
                      label="المتجر المُنشأ"
                      value={data.createdShopId != null ? `#${data.createdShopId}` : "بانتظار الإجراء"}
                      dir="ltr"
                    />
                  )}
                  <InfoField label="سبب الرفض" value={data.rejectionReason || shopRequest.rejectionReason || "—"} />
                </div>
              </SectionCard>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function getEntityId(entity) {
  return entity?.id ?? entity?.mallId ?? entity?.cityId ?? entity?.userId ?? null;
}

function getFileUrl(file) {
  return file?.mediumFileUrl || file?.originalFileUrl || file?.smallFileUrl || "";
}

function formatPhone(phone) {
  if (!phone?.number) return "—";
  return `${phone.prefix || "+972"} ${phone.number}`;
}

function countByStatus(list) {
  const stats = { ...DEFAULT_STATS };
  stats.ALL = Array.isArray(list) ? list.length : 0;
  (list || []).forEach((item) => {
    if (item?.status && stats[item.status] != null) stats[item.status] += 1;
  });
  return stats;
}

function getMallInfo(request) {
  const mallName = request?.mall?.name?.trim();
  const mallCity = request?.mall?.city?.name || request?.requestedMallCity?.name || "";
  if (mallName) {
    return {
      mode: "existing",
      title: mallName,
      cityName: mallCity,
      subtitle: mallCity ? `في مدينة ${mallCity}` : "مول قائم",
    };
  }

  const requestedMallName = request?.requestedMallName?.trim();
  if (requestedMallName) {
    return {
      mode: "new",
      title: requestedMallName,
      cityName: mallCity,
      subtitle: mallCity ? `طلب إضافة في ${mallCity}` : "طلب مول جديد",
    };
  }

  return {
    mode: "new",
    title: "غير محدد",
    cityName: "",
    subtitle: "لا توجد بيانات مول",
  };
}

function getContactEntries(contactInfo) {
  if (!contactInfo || typeof contactInfo !== "object") return [];
  return Object.entries(contactInfo).filter(([, value]) => value != null && String(value).trim() !== "");
}

function getActionTitle(flow, row) {
  if (flow === TAB_OWNER) {
    return row?.shopRequest?.name || row?.fullName || `#${row?.id}`;
  }

  return row?.name || row?.shopOwnerUser?.fullName || row?.shopOwnerUser?.username || `#${row?.id}`;
}

function getTableMallText(request) {
  const mallInfo = getMallInfo(request);
  return mallInfo.cityName ? `${mallInfo.title} - ${mallInfo.cityName}` : mallInfo.title;
}

export default function ShopRequests() {
  const [activeTab, setActiveTab] = useState(TAB_OWNER);
  const [toast, setToast] = useState(null);

  const [malls, setMalls] = useState([]);
  const [mallsLoading, setMallsLoading] = useState(false);

  const [ownerRows, setOwnerRows] = useState([]);
  const { sorted: sortedOwnerRows, sortKey: ownerSortKey, sortDir: ownerSortDir, onSort: ownerOnSort } = useSortedData(ownerRows, "id");
  const [ownerStats, setOwnerStats] = useState(DEFAULT_STATS);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerError, setOwnerError] = useState("");
  const [ownerMeta, setOwnerMeta] = useState({
    page: 0,
    size: 20,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
    from: 0,
    to: 0,
  });
  const [ownerDraft, setOwnerDraft] = useState(OWNER_DRAFT_DEFAULTS);
  const [ownerQuery, setOwnerQuery] = useState(OWNER_QUERY_DEFAULTS);

  const [existingRows, setExistingRows] = useState([]);
  const { sorted: sortedExistingRows, sortKey: existingSortKey, sortDir: existingSortDir, onSort: existingOnSort } = useSortedData(existingRows, "id");
  const [existingStats, setExistingStats] = useState(DEFAULT_STATS);
  const [existingLoading, setExistingLoading] = useState(false);
  const [existingError, setExistingError] = useState("");
  const [existingMeta, setExistingMeta] = useState({
    page: 0,
    size: 20,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
    from: 0,
    to: 0,
  });
  const [existingDraft, setExistingDraft] = useState(EXISTING_DRAFT_DEFAULTS);
  const [existingQuery, setExistingQuery] = useState(EXISTING_QUERY_DEFAULTS);

  const [detailState, setDetailState] = useState(INITIAL_DETAIL_STATE);
  const [actionState, setActionState] = useState(INITIAL_ACTION_STATE);

  const loadMalls = useCallback(async () => {
    setMallsLoading(true);
    try {
      const response = await shopRequestsApi.getAllMalls();
      setMalls(Array.isArray(response?.data) ? response.data : []);
    } catch {
      setMalls([]);
    } finally {
      setMallsLoading(false);
    }
  }, []);

  const loadOwnerStats = useCallback(async () => {
    try {
      const [listResponse, pendingResponse] = await Promise.all([
        shopRequestsApi.getShopOwnerRequestsList(),
        shopRequestsApi.getPendingShopOwnerRequests().catch(() => null),
      ]);
      const list = Array.isArray(listResponse?.data) ? listResponse.data : [];
      const stats = countByStatus(list);
      if (Array.isArray(pendingResponse?.data)) stats.PENDING = pendingResponse.data.length;
      setOwnerStats(stats);
    } catch {
      setOwnerStats(DEFAULT_STATS);
    }
  }, []);

  const loadExistingStats = useCallback(async () => {
    try {
      const response = await shopRequestsApi.getExistingOwnerShopRequestsList();
      const list = Array.isArray(response?.data) ? response.data : [];
      setExistingStats(countByStatus(list));
    } catch {
      setExistingStats(DEFAULT_STATS);
    }
  }, []);

  const loadOwnerRows = useCallback(async () => {
    setOwnerLoading(true);
    setOwnerError("");

    try {
      const response = await shopRequestsApi.getShopOwnerRequests(ownerQuery);
      const payload = response?.data || {};
      setOwnerRows(Array.isArray(payload.content) ? payload.content : []);
      setOwnerMeta(payload.meta || OWNER_QUERY_DEFAULTS);
    } catch (err) {
      setOwnerRows([]);
      setOwnerError(err.message || "فشل جلب طلبات فتح المتجر.");
      setOwnerMeta((current) => ({ ...current, totalItems: 0, totalPages: 1, from: 0, to: 0 }));
    } finally {
      setOwnerLoading(false);
    }
  }, [ownerQuery]);

  const loadExistingRows = useCallback(async () => {
    setExistingLoading(true);
    setExistingError("");

    try {
      const response = await shopRequestsApi.getExistingOwnerShopRequests(existingQuery);
      const payload = response?.data || {};
      setExistingRows(Array.isArray(payload.content) ? payload.content : []);
      setExistingMeta(payload.meta || EXISTING_QUERY_DEFAULTS);
    } catch (err) {
      setExistingRows([]);
      setExistingError(err.message || "فشل جلب طلبات المتجر الإضافي.");
      setExistingMeta((current) => ({ ...current, totalItems: 0, totalPages: 1, from: 0, to: 0 }));
    } finally {
      setExistingLoading(false);
    }
  }, [existingQuery]);

  useEffect(() => {
    loadMalls();
    loadOwnerStats();
    loadExistingStats();
  }, [loadMalls, loadOwnerStats, loadExistingStats]);

  useEffect(() => {
    loadOwnerRows();
  }, [loadOwnerRows]);

  useEffect(() => {
    loadExistingRows();
  }, [loadExistingRows]);

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  function handleOwnerSearch() {
    setOwnerQuery({
      page: 0,
      size: ownerQuery.size,
      username: ownerDraft.username.trim(),
      email: ownerDraft.email.trim(),
      phone: ownerDraft.phone.trim(),
      status: ownerDraft.status,
    });
  }

  function handleOwnerClear() {
    setOwnerDraft(OWNER_DRAFT_DEFAULTS);
    setOwnerQuery(OWNER_QUERY_DEFAULTS);
  }

  function handleExistingSearch() {
    setExistingQuery({
      page: 0,
      size: existingQuery.size,
      username: existingDraft.username.trim(),
      status: existingDraft.status,
      mallId: existingDraft.mallId,
      name: existingDraft.name.trim(),
      category: existingDraft.category,
    });
  }

  function handleExistingClear() {
    setExistingDraft(EXISTING_DRAFT_DEFAULTS);
    setExistingQuery(EXISTING_QUERY_DEFAULTS);
  }

  function handleOwnerStatusCard(status) {
    const nextStatus = status || "";
    setOwnerDraft((current) => ({ ...current, status: nextStatus }));
    setOwnerQuery((current) => ({ ...current, page: 0, status: nextStatus }));
  }

  function handleExistingStatusCard(status) {
    const nextStatus = status || "";
    setExistingDraft((current) => ({ ...current, status: nextStatus }));
    setExistingQuery((current) => ({ ...current, page: 0, status: nextStatus }));
  }

  async function openDetails(flow, id) {
    setDetailState({ open: true, flow, id, loading: true, error: "", data: null });
    try {
      const response =
        flow === TAB_OWNER
          ? await shopRequestsApi.getShopOwnerRequestById(id)
          : await shopRequestsApi.getExistingOwnerShopRequestById(id);
      setDetailState({ open: true, flow, id, loading: false, error: "", data: response?.data || null });
    } catch (err) {
      setDetailState({ open: true, flow, id, loading: false, error: err.message || "فشل جلب التفاصيل.", data: null });
    }
  }

  function closeDetails() {
    setDetailState(INITIAL_DETAIL_STATE);
  }

  function openAction(flow, mode, row) {
    setActionState({
      open: true,
      flow,
      id: row.id,
      mode,
      title: getActionTitle(flow, row),
      reason: "",
      saving: false,
      error: "",
    });
  }

  function closeAction() {
    if (!actionState.saving) setActionState(INITIAL_ACTION_STATE);
  }

  async function submitAction() {
    if (actionState.mode === "reject" && !actionState.reason.trim()) {
      setActionState((current) => ({ ...current, error: "يرجى إدخال سبب الرفض قبل المتابعة." }));
      return;
    }

    setActionState((current) => ({ ...current, saving: true, error: "" }));

    try {
      if (actionState.flow === TAB_OWNER) {
        if (actionState.mode === "approve") {
          await shopRequestsApi.approveShopOwnerRequest(actionState.id);
        } else {
          await shopRequestsApi.rejectShopOwnerRequest(actionState.id, actionState.reason.trim());
        }
        await Promise.all([loadOwnerRows(), loadOwnerStats()]);
      } else {
        if (actionState.mode === "approve") {
          await shopRequestsApi.approveExistingOwnerShopRequest(actionState.id);
        } else {
          await shopRequestsApi.rejectExistingOwnerShopRequest(actionState.id, actionState.reason.trim());
        }
        await Promise.all([loadExistingRows(), loadExistingStats()]);
      }

      if (detailState.open && detailState.flow === actionState.flow && detailState.id === actionState.id) {
        closeDetails();
      }

      showToast(actionState.mode === "approve" ? "تمت الموافقة على الطلب بنجاح." : "تم رفض الطلب بنجاح.");
      setActionState(INITIAL_ACTION_STATE);
    } catch (err) {
      setActionState((current) => ({
        ...current,
        saving: false,
        error: err.message || "تعذر تنفيذ الإجراء المطلوب.",
      }));
    }
  }

  const topTabs = [
    { key: TAB_OWNER, label: TAB_CONFIG[TAB_OWNER].label, count: ownerStats.ALL },
    { key: TAB_EXISTING, label: TAB_CONFIG[TAB_EXISTING].label, count: existingStats.ALL },
  ];

  const statusCards = [
    { key: "", label: "الكل", value: DEFAULT_STATS.ALL },
    { key: "PENDING", label: STATUS_LABELS.PENDING, value: DEFAULT_STATS.PENDING },
    { key: "APPROVED", label: STATUS_LABELS.APPROVED, value: DEFAULT_STATS.APPROVED },
    { key: "REJECTED", label: STATUS_LABELS.REJECTED, value: DEFAULT_STATS.REJECTED },
  ];

  const categoryOptions = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
  const mallOptions = malls.map((mall) => ({
    value: String(getEntityId(mall)),
    label: mall?.city?.name ? `${mall.name} - ${mall.city.name}` : mall.name,
  }));

  const currentRows = activeTab === TAB_OWNER ? ownerRows : existingRows;
  const currentLoading = activeTab === TAB_OWNER ? ownerLoading : existingLoading;
  const currentError = activeTab === TAB_OWNER ? ownerError : existingError;
  const currentMeta = activeTab === TAB_OWNER ? ownerMeta : existingMeta;
  const currentStats = activeTab === TAB_OWNER ? ownerStats : existingStats;
  const currentStatus = activeTab === TAB_OWNER ? ownerQuery.status : existingQuery.status;

  function refreshCurrentTab() {
    if (activeTab === TAB_OWNER) {
      void Promise.all([loadOwnerRows(), loadOwnerStats()]);
    } else {
      void Promise.all([loadExistingRows(), loadExistingStats()]);
    }
  }

  function renderOwnerFilters() {
    return (
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>اسم المستخدم</label>
          <input
            type="text"
            value={ownerDraft.username}
            onChange={(e) => setOwnerDraft((current) => ({ ...current, username: e.target.value }))}
            placeholder="ابحث باسم المستخدم"
            className="rounded-xl px-3 py-2.5 text-sm border outline-none"
            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "ltr" }}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>البريد الإلكتروني</label>
          <input
            type="text"
            value={ownerDraft.email}
            onChange={(e) => setOwnerDraft((current) => ({ ...current, email: e.target.value }))}
            placeholder="example@mail.com"
            className="rounded-xl px-3 py-2.5 text-sm border outline-none"
            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "ltr" }}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الهاتف</label>
          <input
            type="text"
            value={ownerDraft.phone}
            onChange={(e) => setOwnerDraft((current) => ({ ...current, phone: e.target.value }))}
            placeholder="+972 059..."
            className="rounded-xl px-3 py-2.5 text-sm border outline-none"
            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "ltr" }}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[170px]">
          <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الحالة</label>
          <AppSelect
            value={ownerDraft.status}
            onValueChange={(value) => setOwnerDraft((current) => ({ ...current, status: value }))}
            placeholder="الكل"
            options={[
              { value: "", label: "الكل" },
              { value: "PENDING", label: STATUS_LABELS.PENDING },
              { value: "APPROVED", label: STATUS_LABELS.APPROVED },
              { value: "REJECTED", label: STATUS_LABELS.REJECTED },
            ]}
          />
        </div>

        <div className="flex gap-2 items-center pb-0.5">
          <button
            type="button"
            onClick={handleOwnerSearch}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
            style={{ background: "var(--blue-9)", color: "#fff" }}
          >
            <FiSearch size={14} />
            بحث
          </button>
          {(ownerQuery.username || ownerQuery.email || ownerQuery.phone || ownerQuery.status) && (
            <button
              type="button"
              onClick={handleOwnerClear}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition"
              style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}
            >
              مسح
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderExistingFilters() {
    return (
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>اسم المستخدم</label>
          <input
            type="text"
            value={existingDraft.username}
            onChange={(e) => setExistingDraft((current) => ({ ...current, username: e.target.value }))}
            placeholder="ابحث باسم المستخدم"
            className="rounded-xl px-3 py-2.5 text-sm border outline-none"
            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "ltr" }}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>اسم المتجر المطلوب</label>
          <input
            type="text"
            value={existingDraft.name}
            onChange={(e) => setExistingDraft((current) => ({ ...current, name: e.target.value }))}
            placeholder="ابحث باسم المتجر"
            className="rounded-xl px-3 py-2.5 text-sm border outline-none"
            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[170px]">
          <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>المول</label>
          <AppSelect
            value={existingDraft.mallId}
            onValueChange={(value) => setExistingDraft((current) => ({ ...current, mallId: value }))}
            placeholder={mallsLoading ? "جاري التحميل..." : "الكل"}
            options={[{ value: "", label: "الكل" }, ...mallOptions]}
            disabled={mallsLoading}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الفئة</label>
          <AppSelect
            value={existingDraft.category}
            onValueChange={(value) => setExistingDraft((current) => ({ ...current, category: value }))}
            placeholder="الكل"
            options={[{ value: "", label: "الكل" }, ...categoryOptions]}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الحالة</label>
          <AppSelect
            value={existingDraft.status}
            onValueChange={(value) => setExistingDraft((current) => ({ ...current, status: value }))}
            placeholder="الكل"
            options={[
              { value: "", label: "الكل" },
              { value: "PENDING", label: STATUS_LABELS.PENDING },
              { value: "APPROVED", label: STATUS_LABELS.APPROVED },
              { value: "REJECTED", label: STATUS_LABELS.REJECTED },
            ]}
          />
        </div>

        <div className="flex gap-2 items-center pb-0.5">
          <button
            type="button"
            onClick={handleExistingSearch}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
            style={{ background: "var(--blue-9)", color: "#fff" }}
          >
            <FiSearch size={14} />
            بحث
          </button>
          {(existingQuery.username || existingQuery.name || existingQuery.mallId || existingQuery.category || existingQuery.status) && (
            <button
              type="button"
              onClick={handleExistingClear}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition"
              style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}
            >
              مسح
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderOwnerTable() {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--gray-2)", color: "var(--gray-10)" }}>
              <SortableTh label="رقم الطلب" sortKey="id" currentKey={ownerSortKey} direction={ownerSortDir} onSort={ownerOnSort} className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }} />
              <SortableTh label="صاحب الطلب" sortKey="fullName" currentKey={ownerSortKey} direction={ownerSortDir} onSort={ownerOnSort} className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }} />
              <SortableTh label="اسم المستخدم" sortKey="username" currentKey={ownerSortKey} direction={ownerSortDir} onSort={ownerOnSort} className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }} />
              <th className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }}>الهاتف</th>
              <SortableTh label="اسم المتجر" sortKey="shopRequest.name" currentKey={ownerSortKey} direction={ownerSortDir} onSort={ownerOnSort} className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }} />
              <th className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }}>المول / طلب مول جديد</th>
              <SortableTh label="الحالة" sortKey="status" currentKey={ownerSortKey} direction={ownerSortDir} onSort={ownerOnSort} className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }} />
              <th className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {sortedOwnerRows.map((row) => {
              const shopRequest = row.shopRequest || {};
              const isPending = row.status === "PENDING";
              return (
                <tr
                  key={row.id}
                  className="transition hover:opacity-90"
                  style={{ borderTop: "1px solid var(--gray-a4)" }}
                >
                  <td className="px-4 py-3 font-bold" style={{ color: "var(--gray-12)" }}>#{row.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: "var(--gray-12)" }}>{row.fullName || "—"}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>
                      {row.email || "بدون بريد إلكتروني"}
                    </div>
                  </td>
                  <td className="px-4 py-3" dir="ltr" style={{ color: "var(--gray-11)" }}>{row.username || "—"}</td>
                  <td className="px-4 py-3" dir="ltr" style={{ color: "var(--gray-11)" }}>{formatPhone(row.phone)}</td>
                  <td className="px-4 py-3" style={{ color: "var(--gray-11)" }}>{shopRequest.name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <ModeBadge mode={getMallInfo(shopRequest).mode} />
                      <span style={{ color: "var(--gray-11)" }}>{getTableMallText(shopRequest)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openDetails(TAB_OWNER, row.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition hover:opacity-85"
                        style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}
                      >
                        <FiEye size={12} />
                        التفاصيل
                      </button>
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => openAction(TAB_OWNER, "approve", row)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                            style={{ background: "var(--green-9)", color: "#fff" }}
                          >
                            <FiCheck size={12} />
                            موافقة
                          </button>
                          <button
                            type="button"
                            onClick={() => openAction(TAB_OWNER, "reject", row)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                            style={{ background: "var(--red-9)", color: "#fff" }}
                          >
                            <FiX size={12} />
                            رفض
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderExistingTable() {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--gray-2)", color: "var(--gray-10)" }}>
              <SortableTh label="رقم الطلب" sortKey="id" currentKey={existingSortKey} direction={existingSortDir} onSort={existingOnSort} className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }} />
              <SortableTh label="صاحب المتجر" sortKey="shopOwnerUser.fullName" currentKey={existingSortKey} direction={existingSortDir} onSort={existingOnSort} className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }} />
              <SortableTh label="اسم المتجر المطلوب" sortKey="name" currentKey={existingSortKey} direction={existingSortDir} onSort={existingOnSort} className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }} />
              <SortableTh label="الفئة" sortKey="category" currentKey={existingSortKey} direction={existingSortDir} onSort={existingOnSort} className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }} />
              <th className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }}>المول / طلب مول جديد</th>
              <SortableTh label="الحالة" sortKey="status" currentKey={existingSortKey} direction={existingSortDir} onSort={existingOnSort} className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }} />
              <SortableTh label="رقم المتجر المُنشأ" sortKey="createdShopId" currentKey={existingSortKey} direction={existingSortDir} onSort={existingOnSort} className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }} />
              <th className="text-right px-4 py-3 font-bold border-b" style={{ borderColor: "var(--gray-a5)" }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {sortedExistingRows.map((row) => {
              const isPending = row.status === "PENDING";
              const owner = row.shopOwnerUser || {};
              return (
                <tr
                  key={row.id}
                  className="transition hover:opacity-90"
                  style={{ borderTop: "1px solid var(--gray-a4)" }}
                >
                  <td className="px-4 py-3 font-bold" style={{ color: "var(--gray-12)" }}>#{row.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: "var(--gray-12)" }}>
                      {owner.fullName || owner.username || `مستخدم #${row.existingUserId ?? "—"}`}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }} dir="ltr">
                      {owner.username ? `@${owner.username}` : row.existingUserId != null ? `#${row.existingUserId}` : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--gray-11)" }}>{row.name || "—"}</td>
                  <td className="px-4 py-3" style={{ color: "var(--gray-11)" }}>{CATEGORY_LABELS[row.category] || row.category || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <ModeBadge mode={getMallInfo(row).mode} />
                      <span style={{ color: "var(--gray-11)" }}>{getTableMallText(row)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3" dir="ltr" style={{ color: "var(--gray-11)" }}>
                    {row.createdShopId != null ? `#${row.createdShopId}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openDetails(TAB_EXISTING, row.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition hover:opacity-85"
                        style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}
                      >
                        <FiEye size={12} />
                        التفاصيل
                      </button>
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => openAction(TAB_EXISTING, "approve", row)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                            style={{ background: "var(--green-9)", color: "#fff" }}
                          >
                            <FiCheck size={12} />
                            موافقة
                          </button>
                          <button
                            type="button"
                            onClick={() => openAction(TAB_EXISTING, "reject", row)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                            style={{ background: "var(--red-9)", color: "#fff" }}
                          >
                            <FiX size={12} />
                            رفض
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderPagination() {
    if (!currentMeta?.totalPages || currentMeta.totalPages <= 1) return null;

    const page = currentMeta.page || 0;
    const totalPages = currentMeta.totalPages || 1;
    const start = Math.max(0, Math.min(page - 2, Math.max(0, totalPages - 5)));
    const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);

    const changePage = (nextPage) => {
      if (activeTab === TAB_OWNER) {
        setOwnerQuery((current) => ({ ...current, page: nextPage }));
      } else {
        setExistingQuery((current) => ({ ...current, page: nextPage }));
      }
    };

    return (
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs" style={{ color: "var(--gray-10)" }}>
          {Number(currentMeta.totalItems || 0).toLocaleString("ar-EG")} طلب إجمالًا
          {" — "}
          صفحة {page + 1} من {totalPages}
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => changePage(Math.max(0, page - 1))}
            disabled={!currentMeta.hasPrev}
            className="p-2 rounded-xl transition disabled:opacity-40"
            style={{ background: "var(--gray-a3)", color: "var(--gray-12)" }}
          >
            <FiChevronRight size={16} />
          </button>

          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => changePage(pageNumber)}
              className="w-9 h-9 rounded-xl text-sm font-medium transition"
              style={{
                background: pageNumber === page ? "var(--blue-9)" : "var(--gray-a3)",
                color: pageNumber === page ? "#fff" : "var(--gray-12)",
              }}
            >
              {pageNumber + 1}
            </button>
          ))}

          <button
            type="button"
            onClick={() => changePage(Math.min(totalPages - 1, page + 1))}
            disabled={!currentMeta.hasNext}
            className="p-2 rounded-xl transition disabled:opacity-40"
            style={{ background: "var(--gray-a3)", color: "var(--gray-12)" }}
          >
            <FiChevronLeft size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-4 sm:p-6 space-y-5">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>طلبات المتاجر</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--gray-10)" }}>
            مراجعة واعتماد أو رفض طلبات فتح المتاجر الجديدة وطلبات إضافة متجر من أصحاب المتاجر الحاليين.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshCurrentTab}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
          style={{ background: "var(--gray-a3)", color: "var(--gray-12)" }}
          disabled={currentLoading}
        >
          {currentLoading ? <Spinner size={14} /> : <FiRefreshCw size={14} />}
          تحديث
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {topTabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="rounded-2xl border p-4 text-right transition"
              style={{
                background: active ? "var(--blue-a2)" : "var(--gray-1)",
                borderColor: active ? "var(--blue-a6)" : "var(--gray-a5)",
                boxShadow: active ? "0 0 0 2px var(--blue-a4)" : "none",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                    {tab.label}
                  </div>
                  <div className="text-xs mt-1 leading-6" style={{ color: "var(--gray-10)" }}>
                    {TAB_CONFIG[tab.key].subtitle}
                  </div>
                </div>
                <span
                  className="inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-bold min-w-[64px]"
                  style={{
                    background: active ? "var(--blue-9)" : "var(--gray-a3)",
                    color: active ? "#fff" : "var(--gray-12)",
                  }}
                >
                  {Number(tab.count || 0).toLocaleString("ar-EG")}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {statusCards.map((card) => (
          <MetricCard
            key={card.key || "ALL"}
            label={card.label}
            value={currentStats[card.key || "ALL"]}
            active={currentStatus === card.key}
            onClick={() => {
              if (activeTab === TAB_OWNER) handleOwnerStatusCard(card.key);
              else handleExistingStatusCard(card.key);
            }}
          />
        ))}
      </div>

      <div className="rounded-2xl border p-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
        {activeTab === TAB_OWNER ? renderOwnerFilters() : renderExistingFilters()}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
        {currentLoading ? (
          <div className="flex justify-center items-center py-16 gap-2" style={{ color: "var(--gray-10)" }}>
            <Spinner size={20} />
            <span className="text-sm">جاري التحميل...</span>
          </div>
        ) : currentError ? (
          <div
            className="flex items-center gap-2 m-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}
          >
            <FiAlertCircle size={15} />
            <span>{currentError}</span>
            <button type="button" onClick={refreshCurrentTab} className="mr-auto underline text-xs">
              إعادة المحاولة
            </button>
          </div>
        ) : !currentRows.length ? (
          <div className="text-center py-16 px-6">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "var(--gray-a3)", color: "var(--gray-10)" }}
            >
              {activeTab === TAB_OWNER ? <FiShoppingBag size={22} /> : <FiTag size={22} />}
            </div>
            <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
              {activeTab === TAB_OWNER ? "لا توجد طلبات فتح متجر مطابقة." : "لا توجد طلبات متجر إضافي مطابقة."}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--gray-10)" }}>
              جرّب تعديل الفلاتر أو تحديث البيانات لعرض أحدث الطلبات.
            </div>
          </div>
        ) : (
          activeTab === TAB_OWNER ? renderOwnerTable() : renderExistingTable()
        )}
      </div>

      {!currentLoading && !currentError && currentRows.length > 0 && renderPagination()}

      <DetailsDialog
        state={detailState}
        onClose={closeDetails}
        onApprove={(id) => {
          const row = detailState.data ? { ...detailState.data, id } : { id };
          openAction(detailState.flow, "approve", row);
        }}
        onReject={(id) => {
          const row = detailState.data ? { ...detailState.data, id } : { id };
          openAction(detailState.flow, "reject", row);
        }}
      />

      <ActionDialog
        state={{
          ...actionState,
          setReason: (value) => setActionState((current) => ({ ...current, reason: value, error: "" })),
        }}
        onClose={closeAction}
        onSubmit={submitAction}
      />
    </div>
  );
}
