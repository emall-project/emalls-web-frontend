import { useCallback, useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip } from "recharts";
import {
  LuBadgeCheck,
  LuBoxes,
  LuBuilding2,
  LuChartPie,
  LuCircleAlert,
  LuCircleDollarSign,
  LuClock3,
  LuFileClock,
  LuInbox,
  LuLoaderCircle,
  LuPackage,
  LuRefreshCw,
  LuStore,
  LuTruck,
  LuUndo2,
  LuUserRound,
  LuUsers,
  LuWallet,
} from "react-icons/lu";
import { auth } from "../../api/auth";

// ── Accent system — maps name → Radix semantic CSS vars ──────────────────────
const ACCENTS = {
  purple: { bg: "var(--purple-a3)", text: "var(--purple-11)" },
  green:  { bg: "var(--green-a3)",  text: "var(--green-11)"  },
  blue:   { bg: "var(--blue-a3)",   text: "var(--blue-11)"   },
  amber:  { bg: "var(--amber-a3)",  text: "var(--amber-11)"  },
  red:    { bg: "var(--red-a3)",    text: "var(--red-11)"    },
  sky:    { bg: "var(--sky-a3)",    text: "var(--sky-11)"    },
  teal:   { bg: "var(--teal-a3)",   text: "var(--teal-11)"   },
};
const ac = (name) => ACCENTS[name] || ACCENTS.blue;

// ── Status configs — hex for recharts + badges ────────────────────────────────
const ORDER_STATUS_CONFIG = {
  NEW:               { label: "جديد",           color: "#2563eb" },
  PREPARING:         { label: "جاري التحضير",   color: "#d97706" },
  READY_FOR_PICKUP:  { label: "جاهز للاستلام",  color: "#7c3aed" },
  OUT_FOR_DELIVERY:  { label: "في الطريق",       color: "#0284c7" },
  DELIVERED:         { label: "تم التسليم",      color: "#16a34a" },
  CUSTOMER_REJECTED: { label: "رفض العميل",      color: "#dc2626" },
  NO_RESPONSE:       { label: "لا استجابة",      color: "#6b7280" },
};

const ITEM_STATUS_CONFIG = {
  CREATED:           { label: "تم الإنشاء",     color: "#6b7280" },
  PREPARING:         { label: "جاري التحضير",   color: "#d97706" },
  READY_FOR_PICKUP:  { label: "جاهز للاستلام",  color: "#7c3aed" },
  OUT_FOR_DELIVERY:  { label: "في الطريق",       color: "#2563eb" },
  DELIVERED:         { label: "تم التسليم",      color: "#16a34a" },
  HOLDING:           { label: "فترة الانتظار",   color: "#ea580c" },
  READY_FOR_PAYOUT:  { label: "جاهز للصرف",     color: "#0d9488" },
  RETURN_REQUESTED:  { label: "إرجاع مطلوب",    color: "#f97316" },
  RETURN_APPROVED:   { label: "إرجاع مقبول",    color: "#16a34a" },
  RETURN_REJECTED:   { label: "إرجاع مرفوض",    color: "#dc2626" },
  DELIVERY_FAILED:   { label: "توصيل فاشل",      color: "#e11d48" },
};

const RETURN_STATUS_CONFIG = {
  PENDING:  { label: "معلّق",  color: "#d97706" },
  APPROVED: { label: "مقبول", color: "#16a34a" },
  REJECTED: { label: "مرفوض", color: "#dc2626" },
};

// ── Data fetching (unchanged) ─────────────────────────────────────────────────
async function fetchDashboard(path) {
  const res = await fetch(path, {
    headers: {
      Accept: "application/json; charset=UTF-8",
      "Content-Type": "application/json; charset=UTF-8",
      ...auth.getHeaders(),
    },
  });
  if (res.status === 401) { auth.logout("/login"); return null; }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "فشل تحميل البيانات");
  return json?.data || null;
}

// ── Formatters (unchanged) ────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return "—";
  const date = Array.isArray(value)
    ? new Date(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0, value[5] ?? 0)
    : new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

// ── Base components ───────────────────────────────────────────────────────────
function Spinner({ size = 15 }) {
  return <LuLoaderCircle size={size} className="animate-spin" style={{ color: "var(--gray-10)" }} />;
}

function SkeletonBlock({ className = "" }) {
  return (
    <div className={`animate-pulse ${className}`} style={{ background: "var(--gray-a3)" }} />
  );
}

// ── Skeleton states ───────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2.5 flex-1">
          <SkeletonBlock className="h-3.5 w-28 rounded-lg" />
          <SkeletonBlock className="h-8 w-20 rounded-xl" />
          <SkeletonBlock className="h-3 w-36 rounded-lg" />
        </div>
        <SkeletonBlock className="h-10 w-10 rounded-xl shrink-0" />
      </div>
      <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--gray-a4)" }}>
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
        <SkeletonBlock className="h-8 w-8 rounded-xl shrink-0" />
        <SkeletonBlock className="h-4 w-24 rounded-lg" />
      </div>
      <div className="px-5 py-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-2.5 border-b last:border-b-0"
            style={{ borderColor: "var(--gray-a4)" }}>
            <SkeletonBlock className="h-3 w-28 rounded-lg" />
            <SkeletonBlock className="h-3 w-10 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-5 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonBlock className="h-3 w-12 rounded-lg" />
          <SkeletonBlock className="h-5 w-20 rounded-full" />
          <SkeletonBlock className="h-3 flex-1 rounded-lg" />
          <SkeletonBlock className="h-3 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold" style={{ color: "var(--gray-12)" }}>{children}</h2>
      {subtitle && (
        <p className="text-sm mt-0.5" style={{ color: "var(--gray-10)" }}>{subtitle}</p>
      )}
    </div>
  );
}

// ── Alert banner ──────────────────────────────────────────────────────────────
function Banner({ color, icon: Icon, children }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
      style={{ background: `${color}12`, borderColor: `${color}2e`, color: "var(--gray-12)" }}>
      <span className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0 mt-0.5"
        style={{ background: `${color}20`, color }}>
        <Icon size={15} />
      </span>
      <div className="leading-relaxed pt-0.5">{children}</div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, subtext, icon: Icon, accent = "blue" }) {
  const { bg, text } = ac(accent);
  return (
    <div
      className="rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group cursor-default"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--gray-10)" }}>{title}</p>
          <div className="text-3xl font-bold mt-2 tabular-nums leading-none" style={{ color: "var(--gray-12)" }}>
            {formatNumber(value)}
          </div>
          {subtext && (
            <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--gray-9)" }}>{subtext}</p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{ background: bg, color: text }}
        >
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--gray-a4)" }}>
        <span className="text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: bg, color: text }}>
          مباشر
        </span>
      </div>
    </div>
  );
}

// ── Breakdown row ─────────────────────────────────────────────────────────────
function BreakdownRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b last:border-b-0"
      style={{ borderColor: "var(--gray-a4)" }}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-sm truncate" style={{ color: "var(--gray-11)" }}>{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--gray-12)" }}>
        {formatNumber(value)}
      </span>
    </div>
  );
}

// ── Summary panel ─────────────────────────────────────────────────────────────
function SummaryPanel({ title, icon: Icon, accent, rows }) {
  const { bg, text } = ac(accent);
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
      <div className="px-5 py-4 border-b flex items-center gap-3"
        style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg, color: text }}>
          <Icon size={15} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>{title}</h3>
          <p className="text-xs" style={{ color: "var(--gray-9)" }}>قراءة سريعة للحالة الحالية</p>
        </div>
      </div>
      <div className="px-5 py-1">
        {rows.map(row => <BreakdownRow key={row.label} {...row} />)}
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ config, status }) {
  const resolved = config[status] || { label: status || "غير معروف", color: "#6b7280" };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: `${resolved.color}1a`, color: resolved.color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: resolved.color }} />
      {resolved.label}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ title, message, icon: Icon = LuInbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-6 min-h-45">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--gray-a3)", color: "var(--gray-9)" }}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>{title}</p>
        <p className="text-xs mt-1 leading-relaxed max-w-xs" style={{ color: "var(--gray-9)" }}>{message}</p>
      </div>
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-xl border px-3 py-2 text-sm shadow-lg"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl" }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.payload?.color || entry.color }} />
        <span style={{ color: "var(--gray-10)" }}>{entry.name}</span>
        <span className="font-semibold tabular-nums">{formatNumber(entry.value)}</span>
      </div>
    </div>
  );
}

// ── Table shell ───────────────────────────────────────────────────────────────
function TableShell({ title, icon: Icon, accent, count, children }) {
  const { bg, text } = ac(accent);
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
      <div className="px-5 py-4 border-b flex items-center gap-3"
        style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg, color: text }}>
          <Icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>{title}</h3>
          <p className="text-xs" style={{ color: "var(--gray-9)" }}>آخر العناصر المسجلة في النظام</p>
        </div>
        <span className="text-[11px] font-semibold rounded-full px-2.5 py-0.5" style={{ background: bg, color: text }}>
          {formatNumber(count)}
        </span>
      </div>
      {children}
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-right text-xs font-semibold whitespace-nowrap"
      style={{ color: "var(--gray-9)", background: "var(--gray-a2)" }}>
      {children}
    </th>
  );
}

function Td({ children, dir = "rtl", className = "" }) {
  return (
    <td className={`px-4 py-3.5 text-sm ${className}`} dir={dir} style={{ color: "var(--gray-11)" }}>
      {children}
    </td>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data,          setData]          = useState(null);
  const [platformData,  setPlatformData]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [platformError, setPlatformError] = useState("");
  const [lastUpdated,   setLastUpdated]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setPlatformError("");

    try {
      const [ordersResult, accountsResult] = await Promise.allSettled([
        fetchDashboard("/order-hub/dashboard/admin"),
        fetchDashboard("/accounts/api/dashboard/admin"),
      ]);

      let updated = false;

      if (ordersResult.status === "fulfilled") {
        setData(ordersResult.value);
        updated = true;
      } else {
        setData(null);
        setError(ordersResult.reason?.message || "فشل تحميل بيانات الطلبات");
      }

      if (accountsResult.status === "fulfilled") {
        setPlatformData(accountsResult.value);
        updated = true;
      } else {
        setPlatformData(null);
        setPlatformError(accountsResult.reason?.message || "فشل تحميل بيانات الحسابات والمتاجر");
      }

      setLastUpdated(updated ? new Date() : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived data (unchanged) ──────────────────────────────────────────────
  const loadingState   = loading;
  const orderKpis      = data?.orderKpis      || {};
  const deliveryKpis   = data?.deliveryKpis   || {};
  const returnKpis     = data?.returnKpis     || {};
  const financeKpis    = data?.financeKpis    || {};
  const recentOrders   = data?.recentActivity?.recentOrders  || [];
  const recentReturns  = data?.recentActivity?.recentReturns || [];
  const platformKpis   = platformData || {};
  const pendingReviewTotal =
    Number(platformKpis.pendingShopOwnerRequests || 0) +
    Number(platformKpis.pendingShopRequests      || 0);

  const orderPieData = data?.orderStatusBreakdown?.byStatus
    ? Object.entries(data.orderStatusBreakdown.byStatus)
        .filter(([, v]) => Number(v) > 0)
        .map(([status, value]) => ({
          name:  ORDER_STATUS_CONFIG[status]?.label || status,
          value: Number(value),
          color: ORDER_STATUS_CONFIG[status]?.color || "#6b7280",
        }))
    : [];

  const itemBarData = data?.itemStatusBreakdown?.byStatus
    ? Object.entries(data.itemStatusBreakdown.byStatus)
        .filter(([, v]) => Number(v) > 0)
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .map(([status, value]) => ({
          name:  ITEM_STATUS_CONFIG[status]?.label || status,
          value: Number(value),
          color: ITEM_STATUS_CONFIG[status]?.color || "#6b7280",
        }))
    : [];

  const pieTotal       = orderPieData.reduce((s, e) => s + e.value, 0);
  const maxItemValue   = itemBarData.reduce((m, e) => Math.max(m, e.value), 1);

  const platformCards = [
    {
      title:   "إجمالي المستخدمين",
      value:   platformKpis.totalUsers,
      subtext: `${formatNumber(platformKpis.activeUsers)} نشط • ${formatNumber(platformKpis.totalCustomers)} عميل`,
      icon:    LuUsers,
      accent:  "purple",
    },
    {
      title:   "إجمالي المتاجر",
      value:   platformKpis.totalShops,
      subtext: `${formatNumber(platformKpis.activeShops)} نشط • ${formatNumber(platformKpis.inactiveShops)} غير نشط`,
      icon:    LuStore,
      accent:  "green",
    },
    {
      title:   "إجمالي المولات",
      value:   platformKpis.totalMalls,
      subtext: `${formatNumber(platformKpis.activeMalls)} نشط • ${formatNumber(platformKpis.maintenanceMalls)} صيانة`,
      icon:    LuBuilding2,
      accent:  "blue",
    },
    {
      title:   "طلبات بانتظار المراجعة",
      value:   pendingReviewTotal,
      subtext: `${formatNumber(platformKpis.pendingShopOwnerRequests)} افتتاح • ${formatNumber(platformKpis.pendingShopRequests)} إضافية`,
      icon:    LuFileClock,
      accent:  "amber",
    },
  ];

  const operationalCards = [
    {
      title:   "إجمالي الطلبات",
      value:   orderKpis.totalOrders,
      subtext: `${formatNumber(orderKpis.newOrders)} جديد`,
      icon:    LuPackage,
      accent:  "blue",
    },
    {
      title:   "تم التسليم",
      value:   orderKpis.deliveredOrders,
      subtext: "طلبات ناجحة ومكتملة",
      icon:    LuBadgeCheck,
      accent:  "green",
    },
    {
      title:   "طلبات الإرجاع",
      value:   returnKpis.totalReturns,
      subtext: `${formatNumber(returnKpis.pendingReturns)} معلّق`,
      icon:    LuUndo2,
      accent:  "amber",
    },
    {
      title:   "جاهز للصرف",
      value:   financeKpis.itemsReadyForPayout,
      subtext: "عناصر أنهت فترة الانتظار",
      icon:    LuCircleDollarSign,
      accent:  "purple",
    },
  ];

  return (
    <div dir="rtl" className="space-y-8">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>لوحة التحكم</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gray-10)" }}>
            متابعة أداء المنصة والطلبات والحسابات
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {lastUpdated && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--gray-9)" }}>
              <LuClock3 size={12} />
              آخر تحديث {lastUpdated.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}
          >
            {loading ? <Spinner size={14} /> : <LuRefreshCw size={14} />}
            تحديث
          </button>
        </div>
      </div>

      {/* ── Error banners ── */}
      {(error || platformError) && (
        <div className="space-y-3">
          {error && (
            <Banner color="#dc2626" icon={LuCircleAlert}>
              <strong>تعذر تحميل بيانات العمليات. </strong>
              <span style={{ color: "var(--gray-10)" }}>{error}</span>
            </Banner>
          )}
          {platformError && (
            <Banner color="#d97706" icon={LuCircleAlert}>
              <strong>تعذر تحميل بيانات الحسابات. </strong>
              <span style={{ color: "var(--gray-10)" }}>{platformError}</span>
            </Banner>
          )}
        </div>
      )}

      {/* ── صحة المنصة ── */}
      <section>
        <SectionTitle subtitle="مؤشرات مباشرة للمستخدمين والمولات والمتاجر والطلبات المعلقة">
          صحة المنصة
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loadingState ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          ) : platformData ? (
            platformCards.map(card => <StatCard key={card.title} {...card} />)
          ) : (
            <div className="col-span-full rounded-2xl border"
              style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
              <EmptyState
                title="لا توجد بيانات حسابات متاحة"
                message="تعذر تحميل البيانات من خدمة accounts. يمكنك إعادة المحاولة."
              />
            </div>
          )}
        </div>
      </section>

      {/* ── الأداء التشغيلي ── */}
      <section>
        <SectionTitle subtitle="بطاقات سريعة بأهم الأرقام التي يحتاجها فريق الإدارة">
          الأداء التشغيلي
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loadingState ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            operationalCards.map(card => <StatCard key={card.title} {...card} />)
          )}
        </div>
      </section>

      {/* ── تفصيل المؤشرات ── */}
      <section>
        <SectionTitle subtitle="عرض منظم للحالات الرئيسية داخل الطلبات والتوصيل والإرجاعات والمالية">
          تفصيل المؤشرات
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loadingState ? (
            Array.from({ length: 4 }).map((_, i) => <PanelSkeleton key={i} />)
          ) : (
            <>
              <SummaryPanel title="الطلبات" icon={LuPackage} accent="blue" rows={[
                { label: "جديد",        value: orderKpis.newOrders,        color: "#2563eb" },
                { label: "قيد التنفيذ", value: orderKpis.ordersInProgress, color: "#d97706" },
                { label: "تم التسليم",  value: orderKpis.deliveredOrders,  color: "#16a34a" },
                { label: "فاشل",        value: orderKpis.failedOrders,     color: "#dc2626" },
              ]} />
              <SummaryPanel title="التوصيل" icon={LuTruck} accent="sky" rows={[
                { label: "إجمالي",      value: deliveryKpis.totalDeliveries,   color: "#0284c7" },
                { label: "معلّق",       value: deliveryKpis.pendingDeliveries,  color: "#d97706" },
                { label: "تم التسليم",  value: deliveryKpis.deliveredCount,     color: "#16a34a" },
                { label: "فاشل",        value: deliveryKpis.failedCount,        color: "#dc2626" },
              ]} />
              <SummaryPanel title="الإرجاعات" icon={LuUndo2} accent="amber" rows={[
                { label: "إجمالي",      value: returnKpis.totalReturns,    color: "#ea580c" },
                { label: "معلّق",       value: returnKpis.pendingReturns,  color: "#d97706" },
                { label: "مقبول",       value: returnKpis.approvedReturns, color: "#16a34a" },
                { label: "مرفوض",       value: returnKpis.rejectedReturns, color: "#dc2626" },
              ]} />
              <SummaryPanel title="المالية" icon={LuWallet} accent="purple" rows={[
                { label: "فترة الانتظار", value: financeKpis.itemsInHolding,        color: "#ea580c" },
                { label: "جاهز للصرف",   value: financeKpis.itemsReadyForPayout,   color: "#7c3aed" },
                { label: "إرجاع مرفوض",  value: financeKpis.itemsReturnRejected,   color: "#dc2626" },
              ]} />
            </>
          )}
        </div>
      </section>

      {/* ── قراءة بصرية للحالات ── */}
      <section>
        <SectionTitle subtitle="مخططات مبسطة تساعد على اكتشاف الاختناقات ومراجعة التوزيع الحالي">
          قراءة بصرية للحالات
        </SectionTitle>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

          {/* Pie chart */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
            <div className="px-5 py-4 border-b flex items-center gap-3"
              style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--purple-a3)", color: "var(--purple-11)" }}>
                <LuChartPie size={15} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>توزيع حالات الطلبات</h3>
                <p className="text-xs" style={{ color: "var(--gray-9)" }}>نظرة دائرية على الحالات الحالية</p>
              </div>
            </div>
            <div className="p-5">
              {loadingState ? (
                <div className="flex justify-center py-8">
                  <SkeletonBlock className="h-48 w-48 rounded-full" />
                </div>
              ) : orderPieData.length === 0 ? (
                <EmptyState
                  title="لا توجد بيانات كافية"
                  message="سيظهر هذا الرسم عند توفر حالات طلبات قابلة للعرض."
                  icon={LuChartPie}
                />
              ) : (
                <>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={orderPieData}
                          dataKey="value"
                          cx="50%" cy="50%"
                          innerRadius={70} outerRadius={96}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {orderPieData.map(entry => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold tabular-nums" style={{ color: "var(--gray-12)" }}>
                        {formatNumber(pieTotal)}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--gray-9)" }}>إجمالي الحالات</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 border-t pt-4 sm:grid-cols-2"
                    style={{ borderColor: "var(--gray-a4)" }}>
                    {orderPieData.map(entry => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
                        <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--gray-10)" }}>
                          {entry.name}
                        </span>
                        <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--gray-12)" }}>
                          {formatNumber(entry.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bar chart */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
            <div className="px-5 py-4 border-b flex items-center gap-3"
              style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                <LuBoxes size={15} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>توزيع حالات العناصر</h3>
                <p className="text-xs" style={{ color: "var(--gray-9)" }}>أشرطة مقارنة سريعة بين الحالات</p>
              </div>
            </div>
            <div className="p-5">
              {loadingState ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <SkeletonBlock className="h-3 w-24 rounded-lg" />
                      <SkeletonBlock className="h-2 flex-1 rounded-full" />
                      <SkeletonBlock className="h-3 w-8 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : itemBarData.length === 0 ? (
                <EmptyState
                  title="لا توجد بيانات عناصر"
                  message="سيظهر هذا الجزء بمجرد وجود حالات عناصر قابلة للقياس."
                  icon={LuBoxes}
                />
              ) : (
                <div className="space-y-4">
                  {itemBarData.map(entry => (
                    <div key={entry.name} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-xs leading-none" style={{ color: "var(--gray-10)" }}>
                        {entry.name}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--gray-a3)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max((entry.value / maxItemValue) * 100, entry.value > 0 ? 3 : 0)}%`,
                            background: entry.color,
                          }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums"
                        style={{ color: "var(--gray-12)" }}>
                        {formatNumber(entry.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── آخر العمليات المسجلة ── */}
      <section>
        <SectionTitle subtitle="أحدث الطلبات وطلبات الإرجاع مع حالات واضحة وسهلة التتبع">
          آخر العمليات المسجلة
        </SectionTitle>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

          {/* Orders table */}
          <TableShell title="آخر الطلبات" icon={LuPackage} accent="blue" count={recentOrders.length}>
            {loadingState ? (
              <TableSkeleton />
            ) : recentOrders.length === 0 ? (
              <EmptyState
                title="لا توجد طلبات حديثة"
                message="ستظهر أحدث الطلبات هنا فور تسجيلها في النظام."
                icon={LuPackage}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>#</Th>
                      <Th>الحالة</Th>
                      <Th>العميل</Th>
                      <Th>المبلغ</Th>
                      <Th>التاريخ</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr
                        key={order.shopOrderId}
                        className="border-t transition-colors"
                        style={{ borderColor: "var(--gray-a4)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-a2)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <Td dir="ltr">
                          <span className="font-semibold tabular-nums" style={{ color: "var(--gray-12)", unicodeBidi: "isolate" }}>
                            #{order.shopOrderId}
                          </span>
                        </Td>
                        <Td><StatusBadge config={ORDER_STATUS_CONFIG} status={order.status} /></Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 flex items-center justify-center rounded-xl shrink-0"
                              style={{ background: "var(--purple-a3)", color: "var(--purple-11)" }}>
                              <LuUserRound size={13} />
                            </span>
                            <span className="truncate" style={{ color: "var(--gray-12)" }}>
                              {order.customerInfo?.username || `عميل #${order.customerId}`}
                            </span>
                          </div>
                        </Td>
                        <Td dir="ltr">
                          <span className="font-semibold tabular-nums" style={{ color: "var(--gray-12)", unicodeBidi: "isolate" }}>
                            ₪ {formatMoney(order.total)}
                          </span>
                        </Td>
                        <Td>
                          <span className="text-xs" style={{ color: "var(--gray-9)" }}>
                            {formatDate(order.createdAt)}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TableShell>

          {/* Returns table */}
          <TableShell title="آخر طلبات الإرجاع" icon={LuUndo2} accent="amber" count={recentReturns.length}>
            {loadingState ? (
              <TableSkeleton />
            ) : recentReturns.length === 0 ? (
              <EmptyState
                title="لا توجد إرجاعات حديثة"
                message="عند تسجيل أي طلب إرجاع جديد سيظهر هنا تلقائياً."
                icon={LuUndo2}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>#</Th>
                      <Th>الحالة</Th>
                      <Th>العميل</Th>
                      <Th>السبب</Th>
                      <Th>التاريخ</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReturns.map(item => (
                      <tr
                        key={item.returnRequestId}
                        className="border-t transition-colors"
                        style={{ borderColor: "var(--gray-a4)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-a2)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <Td dir="ltr">
                          <span className="font-semibold tabular-nums" style={{ color: "var(--gray-12)", unicodeBidi: "isolate" }}>
                            #{item.returnRequestId}
                          </span>
                        </Td>
                        <Td><StatusBadge config={RETURN_STATUS_CONFIG} status={item.status} /></Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 flex items-center justify-center rounded-xl shrink-0"
                              style={{ background: "var(--amber-a3)", color: "var(--amber-11)" }}>
                              <LuUserRound size={13} />
                            </span>
                            <span className="truncate" style={{ color: "var(--gray-12)" }}>
                              {item.customerInfo?.username || `عميل #${item.customerId}`}
                            </span>
                          </div>
                        </Td>
                        <Td>
                          <span className="line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--gray-10)" }}>
                            {item.reason || "—"}
                          </span>
                        </Td>
                        <Td>
                          <span className="text-xs" style={{ color: "var(--gray-9)" }}>
                            {formatDate(item.createdAt)}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TableShell>

        </div>
      </section>

    </div>
  );
}
