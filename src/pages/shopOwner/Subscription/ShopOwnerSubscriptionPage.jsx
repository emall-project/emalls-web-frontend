import { useState, useEffect, useCallback, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  FiCheckCircle, FiAlertCircle, FiLock, FiCreditCard, FiLoader,
  FiRefreshCw, FiX, FiCheck, FiCalendar, FiZap, FiShield,
  FiPackage, FiShoppingBag, FiTag, FiImage, FiDollarSign,
  FiCopy, FiExternalLink, FiClock,
} from "react-icons/fi";
import { subscriptionApi } from "./subscriptionApi";
import { auth } from "../../../api/auth";

// ─── Stripe init ──────────────────────────────────────────────────────────────

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;
const SUBSCRIPTION_PAYMENT_POLL_INTERVAL_MS = 2500;
const SUBSCRIPTION_PAYMENT_POLL_ATTEMPTS = 8;

// ─── Constants ────────────────────────────────────────────────────────────────

const SUB_STATUS = {
  TRIAL:     { label: "فترة تجريبية", bg: "var(--blue-a3)",   fg: "var(--blue-11)",   dot: "var(--blue-9)"  },
  ACTIVE:    { label: "نشط",           bg: "var(--green-a3)",  fg: "var(--green-11)",  dot: "var(--green-9)" },
  SUSPENDED: { label: "معلّق",          bg: "var(--amber-a3)",  fg: "var(--amber-11)",  dot: "var(--amber-9)" },
  EXPIRED:   { label: "منتهي",          bg: "var(--red-a3)",    fg: "var(--red-11)",    dot: "var(--red-9)"   },
  CANCELLED: { label: "ملغى",           bg: "var(--gray-a3)",   fg: "var(--gray-11)",   dot: "var(--gray-9)"  },
};

const PAYMENT_STATUS = {
  PENDING:  { label: "قيد المعالجة", bg: "var(--amber-a3)", fg: "var(--amber-11)" },
  SUCCESS:  { label: "ناجح",          bg: "var(--green-a3)", fg: "var(--green-11)" },
  FAILED:   { label: "فشل",           bg: "var(--red-a3)",   fg: "var(--red-11)"   },
  REFUNDED: { label: "مسترجع",         bg: "var(--blue-a3)",  fg: "var(--blue-11)"  },
};

const PLAN_TYPE_LABELS = { MONTHLY: "شهري", YEARLY: "سنوي" };

const PLAN_FEATURES = [
  { icon: FiPackage,     label: "إدارة المنتجات" },
  { icon: FiShoppingBag, label: "إدارة الطلبات" },
  { icon: FiTag,         label: "إدارة الإعلانات" },
  { icon: FiImage,       label: "إدارة الوسائط" },
  { icon: FiDollarSign,  label: "المستحقات المالية" },
  { icon: FiShield,      label: "دعم كامل للوحة المتجر" },
];

const TABS = [
  { id: "status",   label: "الحالة الحالية" },
  { id: "plans",    label: "الخطط" },
  { id: "payments", label: "المدفوعات" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return (+(n ?? 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function formatDate(dt) {
  if (!dt) return "—";
  const d = Array.isArray(dt)
    ? new Date(dt[0], (dt[1] ?? 1) - 1, dt[2] ?? 1)
    : new Date(String(dt).replace(" ", "T"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateFull(dt) {
  if (!dt) return "—";
  const d = Array.isArray(dt)
    ? new Date(dt[0], (dt[1] ?? 1) - 1, dt[2] ?? 1, dt[3] ?? 0, dt[4] ?? 0)
    : new Date(String(dt).replace(" ", "T"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function extractStripeIntentId(clientSecret) {
  if (!clientSecret) return "";
  const [intentId] = String(clientSecret).split("_secret");
  return intentId || "";
}

function graceDaysLeft(suspendedAt) {
  if (!suspendedAt) return null;
  const suspended = Array.isArray(suspendedAt)
    ? new Date(suspendedAt[0], (suspendedAt[1] ?? 1) - 1, suspendedAt[2] ?? 1)
    : new Date(String(suspendedAt).replace(" ", "T"));
  const graceEnd = new Date(suspended.getTime() + 3 * 24 * 60 * 60 * 1000);
  const now      = new Date();
  if (now > graceEnd) return 0;
  return Math.ceil((graceEnd - now) / (24 * 60 * 60 * 1000));
}

function normalizeListResponse(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];

  const candidates = [
    raw.content,
    raw.plans,
    raw.items,
    raw.results,
    raw.rows,
    raw.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

// ─── Small UI ─────────────────────────────────────────────────────────────────

function Skel({ h = "h-4", w = "w-full", r = "rounded-xl" }) {
  return <div className={`${h} ${w} ${r} animate-pulse`} style={{ background: "var(--gray-a3)" }} />;
}

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-semibold"
      style={{
        background:  type === "success" ? "var(--green-2)"  : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)"  : "var(--red-6)",
        color:       type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}>
      {type === "success" ? <FiCheck size={15} /> : <FiAlertCircle size={15} />}
      <span>{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 mr-1"><FiX size={13} /></button>
    </div>
  );
}

function StatusBadge({ status, map }) {
  const s = map?.[status] ?? { label: status, bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: s.bg, color: s.fg }}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />}
      {s.label}
    </span>
  );
}

function TabNav({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-2xl w-fit" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
      {TABS.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
          style={active === tab.id
            ? { background: "var(--gray-1)", color: "var(--blue-11)", border: "1px solid var(--gray-a4)", boxShadow: "0 1px 4px var(--gray-a3)" }
            : { background: "transparent", color: "var(--gray-10)", border: "1px solid transparent" }
          }>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40"
      style={{ background: checked ? "var(--blue-9)" : "var(--gray-a5)" }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(1.375rem)" : "translateX(0.25rem)" }}
      />
    </button>
  );
}

// ─── Subscription Status Card ─────────────────────────────────────────────────

function SubscriptionStatusCard({ subscription, loading, onSubscribeClick }) {
  if (loading) {
    return (
      <div className="rounded-2xl border p-6 space-y-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}>
        <Skel h="h-7" w="w-40" /><Skel h="h-5" w="w-64" /><Skel h="h-5" w="w-48" /><Skel h="h-10" w="w-36" r="rounded-xl" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}>
        <FiCreditCard size={36} className="mx-auto mb-3" style={{ color: "var(--gray-8)" }} />
        <p className="font-semibold text-base" style={{ color: "var(--gray-11)" }}>لا يوجد اشتراك حالي</p>
        <p className="text-sm mt-1" style={{ color: "var(--gray-9)" }}>اختر خطة لبدء اشتراكك</p>
      </div>
    );
  }

  const status      = subscription.status;
  const planName    = subscription.plan?.name ?? subscription.planName;
  const daysLeft    = status === "SUSPENDED" ? graceDaysLeft(subscription.suspendedAt) : null;
  const statusStyle = SUB_STATUS[status] ?? SUB_STATUS.EXPIRED;

  const canSubscribe = ["TRIAL", "SUSPENDED", "EXPIRED"].includes(status);
  const isCancelled  = status === "CANCELLED";
  const isActive     = status === "ACTIVE";

  let ctaText = "اختيار خطة";
  if (status === "TRIAL")     ctaText = "الترقية الآن";
  if (status === "SUSPENDED") ctaText = "إعادة التفعيل";
  if (status === "EXPIRED")   ctaText = "تجديد الاشتراك";

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}>
      {/* colored top bar */}
      <div className="h-1.5" style={{ background: statusStyle.dot }} />

      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} map={SUB_STATUS} />
              {planName && <span className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>{planName}</span>}
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: "var(--gray-12)" }}>
              {status === "TRIAL"     && "أنت في الفترة التجريبية"}
              {status === "ACTIVE"    && "اشتراكك نشط"}
              {status === "SUSPENDED" && "الاشتراك معلّق بسبب فشل الدفع"}
              {status === "EXPIRED"   && "انتهى الاشتراك"}
              {status === "CANCELLED" && "الاشتراك ملغى"}
            </h2>
          </div>

          {/* CTA */}
          {canSubscribe && (
            <button
              onClick={() => onSubscribeClick(null)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: "var(--blue-9)" }}
            >
              <FiZap size={14} />{ctaText}
            </button>
          )}
          {isCancelled && (
            <span className="text-xs font-semibold px-4 py-2.5 rounded-xl" style={{ background: "var(--gray-a3)", color: "var(--gray-10)" }}>
              يرجى التواصل مع الإدارة لإعادة التفعيل
            </span>
          )}
          {isActive && (
            <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--green-11)" }}>
              <FiCheckCircle size={16} /> اشتراك نشط
            </span>
          )}
        </div>

        {/* Details grid */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "تاريخ البداية",        value: formatDate(subscription.startDate) },
            { label: "تاريخ الانتهاء",        value: formatDate(subscription.endDate) },
            subscription.trialEndDate && { label: "انتهاء التجربة", value: formatDate(subscription.trialEndDate) },
            subscription.pricePaid != null && { label: "المبلغ المدفوع", value: `${fmt(subscription.pricePaid)} ${subscription.plan?.currency ?? ""}` },
            { label: "التجديد التلقائي",     value: subscription.autoRenew ? "مفعّل" : "غير مفعّل" },
            subscription.paymentFailureCount > 0 && { label: "فشل الدفع", value: `${subscription.paymentFailureCount} مرة` },
            status === "SUSPENDED" && subscription.suspendedAt && { label: "تاريخ التعليق", value: formatDate(subscription.suspendedAt) },
            daysLeft !== null && { label: "أيام السماح المتبقية", value: daysLeft > 0 ? `${daysLeft} أيام` : "انتهت فترة السماح" },
          ].filter(Boolean).map((item, i) => (
            <div key={i} className="rounded-xl px-3.5 py-3" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
              <p className="text-[11px] font-medium" style={{ color: "var(--gray-9)" }}>{item.label}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: "var(--gray-12)" }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Access Card ──────────────────────────────────────────────────────────────

function AccessCard({ subscription, hasWriteAccess, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}>
        <Skel h="h-5" w="w-48" /><div className="mt-3 space-y-2"><Skel /><Skel w="w-3/4" /></div>
      </div>
    );
  }

  const status   = subscription?.status;
  const daysLeft = status === "SUSPENDED" ? graceDaysLeft(subscription?.suspendedAt) : null;
  const inGrace  = daysLeft !== null && daysLeft > 0;

  const fullAccess = hasWriteAccess === true;
  const noAccess   = hasWriteAccess === false;

  let icon = <FiCheckCircle size={20} />;
  let borderColor = "var(--green-a5)";
  let bg = "var(--green-a2)";
  let titleColor = "var(--green-11)";
  let title = "الوصول الكامل متاح";
  let desc  = "يمكنك إدارة المنتجات والإعلانات والطلبات والوسائط.";

  if (inGrace) {
    icon = <FiAlertCircle size={20} />;
    bg = "var(--amber-a2)"; borderColor = "var(--amber-a5)"; titleColor = "var(--amber-11)";
    title = `الاشتراك معلّق — فترة سماح ${daysLeft} أيام`;
    desc  = "لا تزال صلاحية التعديل متاحة خلال فترة السماح. يرجى الدفع لتجنب إيقاف الوصول.";
  } else if (noAccess) {
    icon = <FiLock size={20} />;
    bg = "var(--red-a2)"; borderColor = "var(--red-a5)"; titleColor = "var(--red-11)";
    title = "وضع القراءة فقط";
    desc  = "لا يمكن إنشاء أو تعديل المنتجات أو الإعلانات أو بيانات المتجر.";
  }

  if (hasWriteAccess === null || hasWriteAccess === undefined) {
    return null;
  }

  return (
    <div className="rounded-2xl border p-5 flex items-start gap-4" style={{ background: bg, borderColor }}>
      <span style={{ color: titleColor }}>{icon}</span>
      <div>
        <p className="font-bold text-sm" style={{ color: titleColor }}>{title}</p>
        <p className="text-sm mt-1 leading-6" style={{ color: titleColor, opacity: 0.8 }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── Billing Notice ───────────────────────────────────────────────────────────

function BillingNoticeCard({ status }) {
  const notices = {
    TRIAL:     { color: "var(--blue-11)", bg: "var(--blue-a2)", border: "var(--blue-a4)", icon: <FiClock size={15} />, text: "لديك وصول كامل خلال الفترة التجريبية. بعد انتهائها يصبح المتجر بوضع القراءة فقط حتى الاشتراك." },
    SUSPENDED: { color: "var(--amber-11)", bg: "var(--amber-a2)", border: "var(--amber-a4)", icon: <FiAlertCircle size={15} />, text: "فشل الدفع التلقائي. لديك فترة سماح 3 أيام حسب النظام قبل إيقاف صلاحية التعديل." },
    EXPIRED:   { color: "var(--red-11)", bg: "var(--red-a2)", border: "var(--red-a4)", icon: <FiAlertCircle size={15} />, text: "انتهى الاشتراك وأصبح الوصول للقراءة فقط. اشترك لاستعادة صلاحيات التعديل." },
    CANCELLED: { color: "var(--gray-11)", bg: "var(--gray-a2)", border: "var(--gray-a4)", icon: <FiLock size={15} />, text: "الاشتراك ملغى ولا يمكن إعادة الاشتراك من لوحة المتجر حالياً حسب النظام الحالي." },
  };
  const n = notices[status];
  if (!n) return null;
  return (
    <div className="rounded-xl border px-4 py-3 flex items-start gap-2.5 text-sm" style={{ background: n.bg, borderColor: n.border, color: n.color }}>
      <span className="mt-0.5 shrink-0">{n.icon}</span>
      <p className="leading-6">{n.text}</p>
    </div>
  );
}

// ─── Subscription Timeline ────────────────────────────────────────────────────

function SubscriptionTimeline({ subscription, loading }) {
  if (loading) return <div className="space-y-2"><Skel h="h-14" /><Skel h="h-14" /><Skel h="h-14" /></div>;
  if (!subscription) return null;

  const events = [
    subscription.startDate   && { label: "بدء الاشتراك",         date: subscription.startDate,    color: "var(--blue-9)",  icon: <FiZap size={12} /> },
    subscription.trialEndDate && { label: "انتهاء الفترة التجريبية", date: subscription.trialEndDate, color: "var(--amber-9)", icon: <FiClock size={12} /> },
    subscription.endDate     && { label: "انتهاء الاشتراك",       date: subscription.endDate,      color: "var(--green-9)", icon: <FiCalendar size={12} /> },
    subscription.suspendedAt && { label: "تاريخ التعليق",          date: subscription.suspendedAt,  color: "var(--red-9)",   icon: <FiAlertCircle size={12} /> },
    subscription.cancelledAt && { label: "تاريخ الإلغاء",          date: subscription.cancelledAt,  color: "var(--gray-9)",  icon: <FiX size={12} /> },
  ].filter(Boolean).sort((a, b) => {
    const da = new Date(String(Array.isArray(a.date) ? `${a.date[0]}-${a.date[1]}-${a.date[2]}` : a.date));
    const db = new Date(String(Array.isArray(b.date) ? `${b.date[0]}-${b.date[1]}-${b.date[2]}` : b.date));
    return da - db;
  });

  if (!events.length) return null;

  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--gray-12)" }}>الجدول الزمني</h3>
      <div className="relative pr-5">
        <div className="absolute right-1.5 top-2 bottom-2 w-px" style={{ background: "var(--gray-a4)" }} />
        <div className="space-y-4">
          {events.map((ev, i) => (
            <div key={i} className="relative flex items-start gap-3">
              <div className="absolute -right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2" style={{ borderColor: ev.color, color: ev.color, top: 0 }}>
                {ev.icon}
              </div>
              <div className="mr-4">
                <p className="text-xs font-semibold" style={{ color: "var(--gray-12)" }}>{ev.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--gray-9)" }}>{formatDate(ev.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pricing Plan Card ────────────────────────────────────────────────────────

function PricingPlanCard({ plan, currentPlan, currentStatus, onSelect, busy }) {
  const isCurrent    = currentPlan?.subscriptionPlanId === plan.subscriptionPlanId
    || currentPlan?.planId === plan.subscriptionPlanId;
  const isYearly     = plan.planType === "YEARLY";
  const canSubscribe = ["TRIAL", "SUSPENDED", "EXPIRED"].includes(currentStatus) || !currentStatus;
  const isCancelled  = currentStatus === "CANCELLED";
  const isActive     = currentStatus === "ACTIVE";

  let btnLabel  = "اختيار الخطة";
  let btnStyle  = { background: "var(--blue-9)", color: "#fff" };
  let disabled  = false;

  if (isCurrent && isActive) {
    btnLabel = "الخطة الحالية";
    btnStyle = { background: "var(--green-a3)", color: "var(--green-11)", border: "1px solid var(--green-a5)" };
    disabled = true;
  } else if (isActive) {
    btnLabel = "غير متاح حالياً";
    btnStyle = { background: "var(--gray-a3)", color: "var(--gray-10)" };
    disabled = true;
  } else if (isCancelled) {
    btnLabel = "يرجى التواصل مع الإدارة";
    btnStyle = { background: "var(--gray-a3)", color: "var(--gray-10)" };
    disabled = true;
  }

  return (
    <div className={[
      "relative rounded-2xl border overflow-hidden flex flex-col transition-shadow",
      isYearly ? "shadow-lg" : "",
    ].join(" ")}
      style={{
        background:   "var(--gray-1)",
        borderColor:  isYearly ? "var(--blue-9)" : "var(--gray-a4)",
        borderWidth:  isYearly ? "2px" : "1px",
      }}>

      {/* Badge */}
      {isYearly && (
        <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[11px] font-extrabold" style={{ background: "var(--blue-9)", color: "#fff" }}>
          الأكثر توفيراً
        </div>
      )}
      {!isYearly && (
        <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
          مرن
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Plan name & type */}
        <div className="mb-5 mt-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--blue-9)" }}>
            {PLAN_TYPE_LABELS[plan.planType] ?? plan.planType}
          </p>
          <h3 className="text-xl font-extrabold" style={{ color: "var(--gray-12)" }}>{plan.name}</h3>
          {plan.durationMonths && (
            <p className="text-xs mt-1" style={{ color: "var(--gray-9)" }}>{plan.durationMonths} شهر</p>
          )}
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black" style={{ color: "var(--gray-12)" }}>{fmt(plan.price)}</span>
            <span className="text-sm font-semibold" style={{ color: "var(--gray-9)" }}>{plan.currency ?? "USD"}</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--gray-9)" }}>
            {plan.planType === "MONTHLY" ? "شهرياً" : "سنوياً"}
          </p>
        </div>

        <div className="mb-6 grid gap-2 text-sm">
          <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "var(--gray-a4)", background: "var(--gray-a2)" }}>
            <p className="text-[11px] font-semibold" style={{ color: "var(--gray-9)" }}>نوع الخطة</p>
            <p className="mt-1 font-bold" style={{ color: "var(--gray-12)" }}>
              {PLAN_TYPE_LABELS[plan.planType] ?? plan.planType}
            </p>
          </div>
          <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "var(--gray-a4)", background: "var(--gray-a2)" }}>
            <p className="text-[11px] font-semibold" style={{ color: "var(--gray-9)" }}>مدة الاشتراك</p>
            <p className="mt-1 font-bold" style={{ color: "var(--gray-12)" }}>
              {plan.durationMonths ? `${plan.durationMonths} شهر` : "بحسب الخطة"}
            </p>
          </div>
          <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "var(--gray-a4)", background: "var(--gray-a2)" }}>
            <p className="text-[11px] font-semibold" style={{ color: "var(--gray-9)" }}>الحالة</p>
            <p className="mt-1 font-bold" style={{ color: "var(--green-11)" }}>
              {plan.isActive ? "متاحة للاشتراك" : "غير متاحة"}
            </p>
          </div>
        </div>

        {/* CTA */}
        {isCancelled ? (
          <Tooltip.Provider delayDuration={100}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <span className="w-full">
                  <button disabled className="w-full py-3 rounded-xl text-sm font-bold transition disabled:cursor-not-allowed" style={btnStyle}>
                    {btnLabel}
                  </button>
                </span>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="top" className="z-[9999] max-w-xs rounded-xl px-3 py-2 text-xs text-center shadow-xl" style={{ background: "var(--gray-12)", color: "var(--gray-1)", direction: "rtl" }}>
                  إلغاء الاشتراك غير متاح من لوحة المتجر حالياً، يرجى التواصل مع الإدارة
                  <Tooltip.Arrow style={{ fill: "var(--gray-12)" }} />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        ) : (
          <button
            disabled={disabled || busy}
            onClick={() => !disabled && onSelect(plan)}
            className="w-full py-3 rounded-xl text-sm font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
            style={btnStyle}
          >
            {busy ? <Spinner size={15} /> : null}
            {btnLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Stripe Checkout Form ─────────────────────────────────────────────────────

function StripePaymentForm({ onSubmitted, onError, onCancel }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState("");

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setErr("");
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: window.location.href },
    });
    if (error) {
      setErr(error.message || "فشلت عملية الدفع");
      onError(error.message || "فشلت عملية الدفع");
      setPaying(false);
    } else {
      setPaying(false);
      onSubmitted();
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="rounded-xl border p-4" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={!stripe || paying}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition hover:opacity-90"
          style={{ background: "var(--blue-9)" }}
        >
          {paying ? <Spinner size={14} /> : <FiCreditCard size={14} />}
          {paying ? "جارٍ المعالجة..." : "ادفع الآن"}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-3 rounded-xl text-sm font-semibold transition hover:opacity-80" style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
          إلغاء
        </button>
      </div>
    </form>
  );
}

// ─── Subscribe Dialog ─────────────────────────────────────────────────────────

function SubscribeDialog({ open, onClose, plan, currentStatus, onPaymentSuccess }) {
  const [step, setStep] = useState("confirm");
  const [autoRenew, setAutoRenew] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [summary, setSummary] = useState(null);
  const container = document.querySelector(".radix-themes") || document.body;
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (open) {
      setStep("confirm");
      setError("");
      setVerificationError("");
      setClientSecret(null);
      setSummary(null);
      setVerifying(false);
    }
  }, [open]);

  const fetchLatestSubscriptionState = useCallback(async () => {
    const [subscriptionResult, paymentsResult] = await Promise.allSettled([
      subscriptionApi.getCurrentSubscription(),
      subscriptionApi.getPayments(),
    ]);

    return {
      subscription: subscriptionResult.status === "fulfilled" ? subscriptionResult.value : null,
      payments: paymentsResult.status === "fulfilled" && Array.isArray(paymentsResult.value) ? paymentsResult.value : [],
    };
  }, []);

  const waitForSubscriptionActivation = useCallback(
    async (subscriptionId, paymentIntentId) => {
      for (let attempt = 0; attempt < SUBSCRIPTION_PAYMENT_POLL_ATTEMPTS; attempt += 1) {
        const { subscription, payments } = await fetchLatestSubscriptionState();

        const currentSubscriptionId = Number(subscription?.subscriptionId ?? subscription?.id ?? 0);
        const targetSubscriptionId = Number(subscriptionId ?? 0);
        const paymentRecorded = payments.some((payment) => {
          const sameSubscription = Number(payment?.subscriptionId ?? 0) === targetSubscriptionId;
          const sameIntent = paymentIntentId ? payment?.stripePaymentIntentId === paymentIntentId : true;
          return sameSubscription && sameIntent && payment?.paymentStatus === "SUCCESS";
        });

        if ((targetSubscriptionId > 0 && currentSubscriptionId === targetSubscriptionId && subscription?.status === "ACTIVE") || paymentRecorded) {
          return true;
        }

        if (attempt < SUBSCRIPTION_PAYMENT_POLL_ATTEMPTS - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, SUBSCRIPTION_PAYMENT_POLL_INTERVAL_MS));
        }
      }

      return false;
    },
    [fetchLatestSubscriptionState]
  );

  const handleConfirm = async () => {
    if (!plan) return;
    setLoading(true);
    setError("");
    try {
      const res = await subscriptionApi.subscribe(plan.subscriptionPlanId ?? plan.planId, autoRenew);
      setClientSecret(res?.clientSecret ?? res?.client_secret);
      setSummary(res);
      setStep("payment");
    } catch (err) {
      setError(err.message || "تعذر بدء الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmitted = useCallback(async () => {
    const subscriptionId = summary?.subscriptionId;
    const paymentIntentId = extractStripeIntentId(clientSecret);

    setVerifying(true);
    setVerificationError("");

    const confirmed = await waitForSubscriptionActivation(subscriptionId, paymentIntentId);
    if (!activeRef.current) return;

    setVerifying(false);

    if (confirmed) {
      setStep("success");
      window.setTimeout(() => {
        onClose();
        onPaymentSuccess();
      }, 2200);
      return;
    }

    setVerificationError("تم إرسال عملية الدفع إلى Stripe، لكننا ما زلنا ننتظر تأكيد الخادم لتفعيل الاشتراك. حدّث الحالة بعد لحظات أو افتح سجل المدفوعات.");
  }, [clientSecret, onClose, onPaymentSuccess, summary?.subscriptionId, waitForSubscriptionActivation]);

  const handleRefreshVerification = useCallback(async () => {
    const subscriptionId = summary?.subscriptionId;
    const paymentIntentId = extractStripeIntentId(clientSecret);

    setVerifying(true);
    setVerificationError("");
    const confirmed = await waitForSubscriptionActivation(subscriptionId, paymentIntentId);
    if (!activeRef.current) return;

    setVerifying(false);

    if (confirmed) {
      setStep("success");
      window.setTimeout(() => {
        onClose();
        onPaymentSuccess();
      }, 1800);
      return;
    }

    setVerificationError("لم يصل تأكيد تفعيل الاشتراك من الخادم بعد. حاول التحديث مرة أخرى بعد قليل.");
  }, [clientSecret, onClose, onPaymentSuccess, summary?.subscriptionId, waitForSubscriptionActivation]);

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-0 shadow-2xl overflow-hidden"
          style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)", maxWidth: 480, direction: "rtl", maxHeight: "90vh", overflowY: "auto" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--gray-a4)" }}>
            <h2 className="text-base font-extrabold" style={{ color: "var(--gray-12)" }}>
              {step === "confirm" && "تأكيد الاشتراك"}
              {step === "payment" && "إتمام الدفع"}
              {step === "success" && "تم بنجاح!"}
            </h2>
            <Dialog.Close asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-xl transition hover:opacity-70" style={{ color: "var(--gray-10)", background: "var(--gray-a3)" }}>
                <FiX size={15} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5">
            {/* ── Confirm step ── */}
            {step === "confirm" && plan && (
              <div className="space-y-5">
                {/* Plan summary */}
                <div className="rounded-xl border px-4 py-4 space-y-2" style={{ background: "var(--blue-a2)", borderColor: "var(--blue-a5)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--blue-9)" }}>الخطة المختارة</p>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base" style={{ color: "var(--gray-12)" }}>{plan.name}</span>
                    <span className="text-xl font-extrabold" style={{ color: "var(--blue-11)" }}>{fmt(plan.price)} {plan.currency ?? "USD"}</span>
                  </div>
                  <div className="flex gap-3 text-xs" style={{ color: "var(--gray-9)" }}>
                    <span>{PLAN_TYPE_LABELS[plan.planType] ?? plan.planType}</span>
                    {plan.durationMonths && <span>• {plan.durationMonths} شهر</span>}
                  </div>
                  {currentStatus === "TRIAL" && (
                    <p className="text-xs mt-1 font-medium" style={{ color: "var(--amber-11)" }}>
                      ملاحظة: الاشتراك الآن سينهي الفترة التجريبية فوراً.
                    </p>
                  )}
                </div>

                {/* AutoRenew */}
                <div className="flex items-center justify-between rounded-xl border px-4 py-3.5" style={{ borderColor: "var(--gray-a4)", background: "var(--gray-a2)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>التجديد التلقائي</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--gray-9)" }}>تجديد الاشتراك تلقائياً عند الانتهاء</p>
                  </div>
                  <ToggleSwitch checked={autoRenew} onChange={setAutoRenew} />
                </div>

                {error && (
                  <div className="rounded-xl border px-4 py-3 text-sm flex items-start gap-2" style={{ background: "var(--red-a2)", borderColor: "var(--red-a5)", color: "var(--red-11)" }}>
                    <FiAlertCircle size={15} className="mt-0.5 shrink-0" />{error}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition hover:opacity-90"
                    style={{ background: "var(--blue-9)" }}
                  >
                    {loading ? <Spinner size={14} /> : null}
                    {loading ? "جارٍ..." : "متابعة للدفع"}
                  </button>
                  <Dialog.Close asChild>
                    <button className="px-5 py-3 rounded-xl text-sm font-semibold" style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                      إلغاء
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            )}

            {/* ── Payment step ── */}
            {step === "payment" && clientSecret && (
              <div className="space-y-4">
                {summary && (
                  <div className="rounded-xl border px-4 py-3 flex items-center justify-between" style={{ background: "var(--blue-a2)", borderColor: "var(--blue-a5)" }}>
                    <span className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>{summary.planName ?? plan?.name}</span>
                    <span className="font-extrabold" style={{ color: "var(--blue-11)" }}>{fmt(summary.amount ?? plan?.price)} {summary.currency ?? plan?.currency}</span>
                  </div>
                )}

                {verifying ? (
                  <div className="rounded-xl border px-4 py-5 text-center" style={{ background: "var(--blue-a2)", borderColor: "var(--blue-a5)", color: "var(--blue-11)" }}>
                    <Spinner size={20} />
                    <p className="mt-3 text-sm font-bold">تم إرسال الدفع إلى Stripe</p>
                    <p className="mt-2 text-sm leading-7">
                      ننتظر الآن تأكيد الـ webhook من الخادم لتفعيل الاشتراك وتسجيل عملية الدفع.
                    </p>
                  </div>
                ) : null}

                {verifying ? null : !stripePromise ? (
                  <div className="rounded-xl border px-4 py-4 text-sm" style={{ background: "var(--amber-a2)", borderColor: "var(--amber-a5)", color: "var(--amber-11)" }}>
                    <FiAlertCircle size={15} className="inline-block mr-1.5 mb-0.5" />
                    Stripe غير مُهيّأ. يرجى إضافة <code className="font-mono text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code> إلى ملف <code className="font-mono text-xs">.env</code>.
                  </div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#2563eb", borderRadius: "12px" } } }}>
                    <StripePaymentForm
                      onSubmitted={handlePaymentSubmitted}
                      onError={(msg) => setError(msg)}
                      onCancel={onClose}
                    />
                  </Elements>
                )}

                {verificationError ? (
                  <div className="rounded-xl border px-4 py-4 text-sm leading-7" style={{ background: "var(--amber-a2)", borderColor: "var(--amber-a5)", color: "var(--amber-11)" }}>
                    <p>{verificationError}</p>
                    <button
                      type="button"
                      onClick={handleRefreshVerification}
                      disabled={verifying}
                      className="mt-3 rounded-xl border px-4 py-2 text-xs font-bold transition disabled:opacity-60"
                      style={{ borderColor: "var(--amber-a5)", background: "var(--gray-1)", color: "var(--amber-11)" }}
                    >
                      {verifying ? "جارٍ التحقق..." : "تحديث الحالة"}
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Success step ── */}
            {step === "success" && (
              <div className="py-8 text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--green-a3)" }}>
                  <FiCheckCircle size={32} style={{ color: "var(--green-9)" }} />
                </div>
                <h3 className="text-lg font-extrabold" style={{ color: "var(--gray-12)" }}>تم تأكيد الدفع بنجاح</h3>
                <p className="text-sm leading-7" style={{ color: "var(--gray-10)" }}>
                  تم تحديث حالة الاشتراك من الخادم، وسيتم إغلاق النافذة تلقائيًا بعد لحظات.
                </p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Payment History Table ────────────────────────────────────────────────────

function PaymentHistoryTable({ payments, loading }) {
  const [copiedId, setCopiedId] = useState(null);

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--gray-a4)" }}>
          <Skel h="h-5" w="w-40" />
        </div>
        <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skel key={i} h="h-12" />)}</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--gray-a4)" }}>
        <h3 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>سجل المدفوعات</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--gray-9)" }}>{payments?.length ?? 0} عملية</p>
      </div>

      {!payments?.length ? (
        <div className="px-5 py-12 text-center">
          <FiCreditCard size={32} className="mx-auto mb-3" style={{ color: "var(--gray-7)" }} />
          <p className="text-sm" style={{ color: "var(--gray-10)" }}>لا توجد عمليات دفع بعد</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "var(--gray-a2)" }}>
                <tr>
                  {["رقم العملية", "الاشتراك", "المبلغ", "العملة", "طريقة الدفع", "الحالة", "التاريخ", "فاتورة"].map(h => (
                    <th key={h} className="text-right py-3 px-4 font-semibold text-xs" style={{ color: "var(--gray-10)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.paymentId ?? i} className="border-t" style={{ borderColor: "var(--gray-a3)" }}>
                    <td className="py-3 px-4">
                      {p.stripePaymentIntentId ? (
                        <button
                          title="نسخ"
                          onClick={() => copy(p.stripePaymentIntentId, p.paymentId)}
                          className="inline-flex items-center gap-1 font-mono text-xs hover:opacity-70"
                          style={{ color: "var(--gray-10)" }}
                        >
                          {String(p.stripePaymentIntentId).slice(0, 12)}…
                          {copiedId === p.paymentId ? <FiCheck size={11} style={{ color: "var(--green-9)" }} /> : <FiCopy size={10} />}
                        </button>
                      ) : <span className="text-xs" style={{ color: "var(--gray-9)" }}>#{p.paymentId}</span>}
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: "var(--gray-11)" }}>#{p.subscriptionId}</td>
                    <td className="py-3 px-4 text-sm font-bold" style={{ color: "var(--green-11)" }}>{fmt(p.amount)}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: "var(--gray-10)" }}>{p.currency}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: "var(--gray-10)" }}>{p.paymentMethod}</td>
                    <td className="py-3 px-4"><StatusBadge status={p.paymentStatus} map={PAYMENT_STATUS} /></td>
                    <td className="py-3 px-4 text-xs" style={{ color: "var(--gray-9)" }}>{formatDateFull(p.paymentDate)}</td>
                    <td className="py-3 px-4">
                      {p.invoiceUrl
                        ? <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold hover:opacity-70" style={{ color: "var(--blue-11)" }}><FiExternalLink size={12} /> فاتورة</a>
                        : <span className="text-xs" style={{ color: "var(--gray-7)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden p-4 space-y-3">
            {payments.map((p, i) => (
              <div key={p.paymentId ?? i} className="rounded-xl border p-4 space-y-2" style={{ borderColor: "var(--gray-a4)", background: "var(--gray-a2)" }}>
                <div className="flex items-center justify-between">
                  <StatusBadge status={p.paymentStatus} map={PAYMENT_STATUS} />
                  <span className="font-bold text-base" style={{ color: "var(--green-11)" }}>{fmt(p.amount)} {p.currency}</span>
                </div>
                <p className="text-xs" style={{ color: "var(--gray-9)" }}>{formatDateFull(p.paymentDate)}</p>
                {p.stripePaymentIntentId && (
                  <p className="font-mono text-xs break-all" style={{ color: "var(--gray-10)" }}>{p.stripePaymentIntentId}</p>
                )}
                {p.failureReason && (
                  <p className="text-xs font-medium" style={{ color: "var(--red-11)" }}>{p.failureReason}</p>
                )}
                {p.invoiceUrl && (
                  <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--blue-11)" }}>
                    <FiExternalLink size={11} /> فتح الفاتورة
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Pricing Plans Section ────────────────────────────────────────────────────

function PricingPlansSection({ plans, currentPlan, currentStatus, onSelect, busy, loading, error }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => <Skel key={i} h="h-80" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border px-6 py-5" style={{ background: "var(--red-a2)", borderColor: "var(--red-a5)", color: "var(--red-11)" }}>
        <div className="flex items-start gap-3">
          <FiAlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">تعذر تحميل خطط الاشتراك</p>
            <p className="mt-1 text-sm leading-6">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plans?.length) {
    return (
      <div className="rounded-2xl border px-8 py-14 text-center" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}>
        <FiCreditCard size={36} className="mx-auto mb-3" style={{ color: "var(--gray-7)" }} />
        <p className="font-semibold" style={{ color: "var(--gray-11)" }}>لا توجد خطط اشتراك متاحة حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map(plan => (
          <PricingPlanCard
            key={plan.subscriptionPlanId ?? plan.planId}
            plan={plan}
            currentPlan={currentPlan}
            currentStatus={currentStatus}
            onSelect={onSelect}
            busy={busy}
          />
        ))}
      </div>
      <p className="text-xs text-center pt-2" style={{ color: "var(--gray-9)" }}>
        الأسعار بالدولار الأمريكي. الدفع يتم عبر Stripe.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShopOwnerSubscriptionPage() {
  const [tab, setTab]                   = useState("status");
  const [subscription, setSubscription] = useState(null);
  const [hasWriteAccess, setWriteAccess]= useState(null);
  const [plans, setPlans]               = useState([]);
  const [payments, setPayments]         = useState([]);

  const [loadingSub, setLoadingSub]   = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPay, setLoadingPay]   = useState(true);

  const [plansError, setPlansError] = useState(null);
  const [toast, setToast]           = useState(null);

  const [dialogOpen, setDialogOpen]     = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const loadSub = useCallback(async () => {
    setLoadingSub(true);
    try {
      const [subRaw, accessRaw] = await Promise.all([
        subscriptionApi.getCurrentSubscription().catch(() => null),
        subscriptionApi.getWriteAccess().catch(() => null),
      ]);
      const sub = Array.isArray(subRaw) ? subRaw[0] ?? null : subRaw;
      setSubscription(sub);
      if (typeof accessRaw === "boolean") setWriteAccess(accessRaw);
      else if (accessRaw && typeof accessRaw === "object") setWriteAccess(accessRaw.hasWriteAccess ?? accessRaw.writeAccess ?? null);
    } catch { /* handled individually */ }
    finally { setLoadingSub(false); }
  }, []);

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    setPlansError(null);
    try {
      const raw = await subscriptionApi.getActivePlans();
      const nextPlans = normalizeListResponse(raw);
      setPlans(nextPlans);
      if (!nextPlans.length) {
        setPlansError("استجاب الخادم لطلب الخطط، لكن الواجهة لم تجد القائمة في البنية المتوقعة للاستجابة.");
      }
    } catch (err) {
      setPlans([]);
      setPlansError(err?.message || "تعذر تحميل خطط الاشتراك.");
    } finally { setLoadingPlans(false); }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoadingPay(true);
    try {
      const raw = await subscriptionApi.getPayments().catch(() => null);
      setPayments(Array.isArray(raw) ? raw : Array.isArray(raw?.content) ? raw.content : []);
    } finally { setLoadingPay(false); }
  }, []);

  const loadAll = useCallback(() => {
    Promise.all([loadSub(), loadPlans(), loadPayments()]);
  }, [loadSub, loadPlans, loadPayments]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleSubscribeFromStatus = () => {
    setTab("plans");
    setSelectedPlan(null);
    setDialogOpen(false);
  };

  const handlePaymentSuccess = () => {
    setDialogOpen(false);
    setToast({ message: "تم تأكيد دفع الاشتراك بنجاح.", type: "success" });
    loadSub();
    loadPayments();
  };

  const currentStatus = subscription?.status;
  const currentPlan   = subscription?.plan;

  return (
    <div dir="rtl" className="space-y-6 pb-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--gray-12)" }}>الاشتراك</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-10)" }}>إدارة اشتراك متجرك، حالة الوصول، وخطة الدفع</p>
        </div>
        <button
          onClick={() => { loadAll(); setToast({ message: "جارٍ التحديث...", type: "success" }); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition hover:opacity-80"
          style={{ borderColor: "var(--gray-a5)", color: "var(--gray-11)", background: "var(--gray-1)" }}
        >
          <FiRefreshCw size={14} /> تحديث
        </button>
      </div>

      <TabNav active={tab} onChange={setTab} />

      {/* ── Tab: الحالة الحالية ── */}
      {tab === "status" && (
        <div className="space-y-4">
          <SubscriptionStatusCard
            subscription={subscription}
            loading={loadingSub}
            onSubscribeClick={handleSubscribeFromStatus}
          />
          <AccessCard subscription={subscription} hasWriteAccess={hasWriteAccess} loading={loadingSub} />
          {!loadingSub && currentStatus && <BillingNoticeCard status={currentStatus} />}
          <SubscriptionTimeline subscription={subscription} loading={loadingSub} />
        </div>
      )}

      {/* ── Tab: الخطط ── */}
      {tab === "plans" && (
        <PricingPlansSection
          plans={plans}
          currentPlan={currentPlan}
          currentStatus={currentStatus}
          onSelect={handleSelectPlan}
          busy={false}
          loading={loadingPlans}
          error={plansError}
        />
      )}

      {/* ── Tab: المدفوعات ── */}
      {tab === "payments" && (
        <PaymentHistoryTable payments={payments} loading={loadingPay} />
      )}

      {/* ── Checkout Dialog ── */}
      <SubscribeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        plan={selectedPlan}
        currentStatus={currentStatus}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
