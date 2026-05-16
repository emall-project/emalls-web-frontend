import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartTooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  FiRefreshCw, FiPlus, FiPackage, FiShoppingBag, FiDollarSign,
  FiActivity, FiAlertCircle, FiCheckCircle, FiClock, FiLoader,
  FiTrendingUp, FiRotateCcw, FiTag, FiArrowLeft, FiX, FiCheck,
} from "react-icons/fi";
import { auth } from "../../api/auth";
import { fetchDashboard } from "./Dashboard/dashboardApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUS_MAP = {
  NEW:               { bg: "var(--blue-a3)",   fg: "var(--blue-11)",   dot: "var(--blue-9)",   label: "جديد",             chart: "#2563eb" },
  PREPARING:         { bg: "var(--amber-a3)",  fg: "var(--amber-11)",  dot: "var(--amber-9)",  label: "قيد التحضير",      chart: "#f59e0b" },
  READY_FOR_PICKUP:  { bg: "var(--cyan-a3)",   fg: "var(--cyan-11)",   dot: "var(--cyan-9)",   label: "جاهز للاستلام",    chart: "#0891b2" },
  OUT_FOR_DELIVERY:  { bg: "var(--orange-a3)", fg: "var(--orange-11)", dot: "var(--orange-9)", label: "في التوصيل",       chart: "#ea580c" },
  DELIVERED:         { bg: "var(--green-a3)",  fg: "var(--green-11)",  dot: "var(--green-9)",  label: "تم التسليم",       chart: "#10b981" },
  CUSTOMER_REJECTED: { bg: "var(--red-a3)",    fg: "var(--red-11)",    dot: "var(--red-9)",    label: "رفض العميل",       chart: "#ef4444" },
  NO_RESPONSE:       { bg: "var(--gray-a3)",   fg: "var(--gray-11)",   dot: "var(--gray-9)",   label: "لا يوجد رد",       chart: "#94a3b8" },
};

const RETURN_STATUS_MAP = {
  PENDING:  { bg: "var(--amber-a3)", fg: "var(--amber-11)", dot: "var(--amber-9)", label: "قيد المراجعة", chart: "#f59e0b" },
  APPROVED: { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)", label: "مقبول",         chart: "#10b981" },
  REJECTED: { bg: "var(--red-a3)",   fg: "var(--red-11)",   dot: "var(--red-9)",   label: "مرفوض",         chart: "#ef4444" },
};

const AD_STATUS_MAP = {
  PENDING:  { bg: "var(--amber-a3)", fg: "var(--amber-11)", label: "قيد المراجعة", chart: "#f59e0b" },
  APPROVED: { bg: "var(--green-a3)", fg: "var(--green-11)", label: "مقبول",         chart: "#10b981" },
  REJECTED: { bg: "var(--red-a3)",   fg: "var(--red-11)",   label: "مرفوض",         chart: "#ef4444" },
};

const AD_PAYMENT_MAP = {
  UNPAID:  { bg: "var(--red-a3)",    fg: "var(--red-11)",   label: "غير مدفوع" },
  PAID:    { bg: "var(--green-a3)",  fg: "var(--green-11)", label: "مدفوع" },
  OVERDUE: { bg: "var(--orange-a3)", fg: "var(--orange-11)",label: "متأخر الدفع" },
};

const SUB_STATUS_MAP = {
  TRIAL:     { bg: "var(--blue-a3)",  fg: "var(--blue-11)",  dot: "var(--blue-9)",  label: "فترة تجريبية" },
  ACTIVE:    { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)", label: "نشط" },
  SUSPENDED: { bg: "var(--amber-a3)", fg: "var(--amber-11)", dot: "var(--amber-9)", label: "معلّق" },
  EXPIRED:   { bg: "var(--red-a3)",   fg: "var(--red-11)",   dot: "var(--red-9)",   label: "منتهي" },
  CANCELLED: { bg: "var(--gray-a3)",  fg: "var(--gray-11)",  dot: "var(--gray-9)",  label: "ملغى" },
};

const SHOP_STATUS_MAP = {
  ACTIVE:   { bg: "var(--green-a3)", fg: "var(--green-11)", dot: "var(--green-9)", label: "نشط" },
  INACTIVE: { bg: "var(--gray-a3)",  fg: "var(--gray-11)",  dot: "var(--gray-9)",  label: "غير نشط" },
  PENDING:  { bg: "var(--amber-a3)", fg: "var(--amber-11)", dot: "var(--amber-9)", label: "قيد المراجعة" },
};

const TABS = [
  { id: "overview",  label: "نظرة عامة" },
  { id: "orders",    label: "الطلبات" },
  { id: "products",  label: "المنتجات" },
  { id: "finance",   label: "المالية" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return (n ?? 0).toLocaleString("en-US");
}
function fmtCurrency(n) {
  return `₪${(+(n ?? 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(dt) {
  if (!dt) return "—";
  const d = Array.isArray(dt)
    ? new Date(dt[0], (dt[1] ?? 1) - 1, dt[2] ?? 1, dt[3] ?? 0, dt[4] ?? 0, dt[5] ?? 0)
    : new Date(String(dt).replace(" ", "T"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatDateShort(dt) {
  if (!dt) return "—";
  const d = Array.isArray(dt)
    ? new Date(dt[0], (dt[1] ?? 1) - 1, dt[2] ?? 1)
    : new Date(String(dt).replace(" ", "T"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Mini UI ──────────────────────────────────────────────────────────────────

function Skel({ h = "h-4", w = "w-full", r = "rounded-xl" }) {
  return <div className={`${h} ${w} ${r} animate-pulse`} style={{ background: "var(--gray-a3)" }} />;
}

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
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

function Badge({ map, status, fallback }) {
  const s = map?.[status] ?? { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)", label: fallback ?? status };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: s.bg, color: s.fg }}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />}
      {s.label}
    </span>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ icon, title, value, desc, accentColor = "var(--blue-9)", accentBg = "var(--blue-a3)", loading, onClick }) {
  const card = (
    <div
      className={["flex items-start gap-4 p-5 rounded-2xl border transition-all duration-150", onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg" : ""].join(" ")}
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}
      onClick={onClick}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: accentBg, color: accentColor }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        {loading ? (
          <div className="space-y-2">
            <Skel h="h-6" w="w-16" />
            <Skel h="h-3" w="w-24" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-extrabold leading-none" style={{ color: "var(--gray-12)" }}>{value ?? "—"}</p>
            <p className="mt-1.5 text-xs font-semibold" style={{ color: "var(--gray-10)" }}>{title}</p>
            {desc && <p className="mt-1 text-[11px]" style={{ color: "var(--gray-9)" }}>{desc}</p>}
          </>
        )}
      </div>
    </div>
  );
  return card;
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

const CustomArabicTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-3 py-2 text-xs shadow-xl" style={{ background: "var(--gray-2)", borderColor: "var(--gray-a5)", color: "var(--gray-12)", direction: "rtl" }}>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.fill || entry.color }} />
          <span>{entry.name}: <strong>{typeof entry.value === "number" && entry.value > 100 ? fmtCurrency(entry.value) : fmt(entry.value)}</strong></span>
        </div>
      ))}
    </div>
  );
};

function SectionCard({ title, subtitle, children, action }) {
  return (
    <div className="rounded-2xl border" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--gray-a4)" }}>
        <div>
          <h3 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
      <span className="text-3xl" style={{ color: "var(--gray-8)" }}>{icon}</span>
      <p className="text-sm" style={{ color: "var(--gray-10)" }}>{text}</p>
    </div>
  );
}

// ─── Store Health Banner ──────────────────────────────────────────────────────

function StoreHealthBanner({ shop, subscription, hasWriteAccess, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border p-5" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}>
        <div className="flex flex-wrap gap-6">
          <Skel h="h-5" w="w-48" />
          <Skel h="h-5" w="w-32" />
          <Skel h="h-5" w="w-40" />
        </div>
      </div>
    );
  }

  const shopStatus = shop?.status ?? shop?.shopStatus;
  const subStatus  = subscription?.status ?? subscription?.subscriptionStatus;
  const noAccess   = hasWriteAccess === false;

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background:  noAccess ? "var(--red-a2)"   : "var(--green-a2)",
        borderColor: noAccess ? "var(--red-a6)"   : "var(--green-a6)",
      }}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: noAccess ? "var(--red-11)" : "var(--green-11)" }}>
          {noAccess ? <FiAlertCircle size={16} /> : <FiCheckCircle size={16} />}
          {noAccess
            ? "المتجر في وضع القراءة فقط، يرجى تجديد الاشتراك لاستعادة صلاحيات التعديل"
            : "الوصول الكامل متاح"}
        </div>

        <div className="flex flex-wrap items-center gap-3 mr-auto">
          {shopStatus && <Badge map={SHOP_STATUS_MAP} status={shopStatus} fallback="المتجر" />}
          {subStatus  && <Badge map={SUB_STATUS_MAP}  status={subStatus}  fallback="الاشتراك" />}
          {shop?.name && (
            <span className="text-xs font-medium" style={{ color: "var(--gray-10)" }}>
              {shop.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Header ─────────────────────────────────────────────────────────

function DashboardHeader({ shop, lastUpdated, refreshing, onRefresh, navigate }) {
  const user   = auth.getUser();
  const shopId = auth.getShopId();
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--gray-12)" }}>لوحة تحكم المتجر</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--gray-10)" }}>
          متابعة أداء متجرك والطلبات والمنتجات والمستحقات من مكان واحد
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {(shop?.name || user?.username) && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
              {shop?.name ?? user?.username}
            </span>
          )}
          {shopId && (
            <span className="text-xs" style={{ color: "var(--gray-9)" }} dir="ltr">
              Store #{shopId}
            </span>
          )}
          {lastUpdated && (
            <span className="text-xs" style={{ color: "var(--gray-9)" }}>
              آخر تحديث: {lastUpdated.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: "var(--gray-a5)", color: "var(--gray-11)", background: "var(--gray-1)" }}
        >
          {refreshing ? <Spinner size={14} /> : <FiRefreshCw size={14} />}
          تحديث
        </button>
        <button
          onClick={() => navigate("/shop-owner/products/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "var(--blue-9)" }}
        >
          <FiPlus size={14} />
          إضافة منتج
        </button>
      </div>
    </div>
  );
}

// ─── Tab Nav ──────────────────────────────────────────────────────────────────

function TabNav({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-2xl w-fit" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
          style={
            active === tab.id
              ? { background: "var(--gray-1)", color: "var(--blue-11)", border: "1px solid var(--gray-a4)", boxShadow: "0 1px 4px var(--gray-a3)" }
              : { background: "transparent", color: "var(--gray-10)", border: "1px solid transparent" }
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Orders Donut Chart ───────────────────────────────────────────────────────

function OrdersDonutChart({ orderStats, loading }) {
  const data = Object.entries(orderStats ?? {})
    .map(([key, val]) => ({
      name: ORDER_STATUS_MAP[key]?.label ?? key,
      value: Number(val) || 0,
      color: ORDER_STATUS_MAP[key]?.chart ?? "#94a3b8",
    }))
    .filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <SectionCard title="توزيع حالات الطلبات" subtitle={loading ? "..." : `${fmt(total)} طلب إجمالي`}>
      {loading ? (
        <div className="flex gap-4 flex-wrap">
          <Skel h="h-48" w="w-48" r="rounded-full" />
          <div className="flex-1 space-y-2"><Skel /><Skel /><Skel /></div>
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={<FiShoppingBag />} text="لا توجد بيانات طلبات بعد" />
      ) : (
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative" style={{ minWidth: 180 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={data} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  {data.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
                <RechartTooltip content={<CustomArabicTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold" style={{ color: "var(--gray-12)" }}>{fmt(total)}</span>
              <span className="text-[11px]" style={{ color: "var(--gray-9)" }}>إجمالي</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {data.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                <span style={{ color: "var(--gray-11)" }}>{entry.name}</span>
                <span className="font-bold mr-auto pr-4" style={{ color: "var(--gray-12)" }}>{fmt(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Finance Bar Chart ────────────────────────────────────────────────────────

function FinanceBarChart({ finance, loading }) {
  const data = finance ? [
    { name: "مستحقات جاهزة",   value: +(finance.readyForPayoutAmount  ?? 0), color: "#10b981" },
    { name: "أرباح مؤكدة",     value: +(finance.earnedAmount           ?? 0), color: "#2563eb" },
    { name: "إجمالي المسلّمة", value: +(finance.totalDeliveredAmount   ?? 0), color: "#0891b2" },
  ] : [];

  return (
    <SectionCard title="ملخص المستحقات" subtitle="بالشيكل الإسرائيلي ₪">
      {loading ? (
        <Skel h="h-48" />
      ) : !finance ? (
        <EmptyState icon={<FiDollarSign />} text="لا توجد بيانات مالية بعد" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--gray-10)" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `₪${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "var(--gray-9)" }} axisLine={false} tickLine={false} />
            <RechartTooltip content={<CustomArabicTooltip />} cursor={{ fill: "var(--gray-a2)" }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

// ─── Returns Donut Chart ──────────────────────────────────────────────────────

function ReturnsDonutChart({ returnStats, loading }) {
  const data = Object.entries(returnStats ?? {})
    .map(([key, val]) => ({
      name:  RETURN_STATUS_MAP[key]?.label ?? key,
      value: Number(val) || 0,
      color: RETURN_STATUS_MAP[key]?.chart ?? "#94a3b8",
    }))
    .filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <SectionCard title="تأثير الإرجاعات">
      {loading ? <Skel h="h-40" /> : data.length === 0 ? (
        <EmptyState icon={<FiRotateCcw />} text="لا توجد طلبات إرجاع حالياً" />
      ) : (
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={data} innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  {data.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                </Pie>
                <RechartTooltip content={<CustomArabicTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold" style={{ color: "var(--gray-12)" }}>{fmt(total)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {data.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: e.color }} />
                <span style={{ color: "var(--gray-11)" }}>{e.name}</span>
                <span className="font-bold mr-auto pr-3" style={{ color: "var(--gray-12)" }}>{fmt(e.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Ads Status Chart ─────────────────────────────────────────────────────────

function AdsStatusChart({ adsList, loading }) {
  const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0, DISPLAYED: 0, UNPAID: 0 };
  (adsList ?? []).forEach(ad => {
    const st = ad.status ?? ad.requestStatus;
    if (counts[st] !== undefined) counts[st]++;
    if (ad.isDisplayed || ad.displayed) counts.DISPLAYED++;
    if (ad.paymentStatus === "UNPAID" || ad.paymentStatus === "OVERDUE") counts.UNPAID++;
  });

  const data = [
    { name: "قيد المراجعة", value: counts.PENDING,  color: "#f59e0b" },
    { name: "مقبول",         value: counts.APPROVED, color: "#10b981" },
    { name: "مرفوض",         value: counts.REJECTED, color: "#ef4444" },
    { name: "يُعرض الآن",    value: counts.DISPLAYED,color: "#2563eb" },
    { name: "غير مدفوع",     value: counts.UNPAID,   color: "#ea580c" },
  ].filter(d => d.value > 0);

  return (
    <SectionCard title="حالة الإعلانات" subtitle={`${fmt(adsList?.length ?? 0)} إعلان`}>
      {loading ? <Skel h="h-36" /> : data.length === 0 ? (
        <EmptyState icon={<FiTag />} text="لا توجد إعلانات بعد" />
      ) : (
        <div className="space-y-2.5">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="w-24 shrink-0" style={{ color: "var(--gray-11)" }}>{item.name}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--gray-a3)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (item.value / (adsList?.length || 1)) * 100)}%`, background: item.color }} />
              </div>
              <span className="w-5 text-left font-bold" style={{ color: "var(--gray-12)" }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Product Overview ─────────────────────────────────────────────────────────

function ProductsOverviewChart({ productsList, productsTotal, activeProductsCount, loading }) {
  const hasStatus = productsList?.some(p => p.isActive !== undefined);
  const activeFromList  = hasStatus ? productsList.filter(p => p.isActive === true).length : null;
  const inactiveFromList = hasStatus ? productsList.filter(p => p.isActive === false).length : null;

  return (
    <SectionCard title="ملخص المنتجات">
      {loading ? (
        <div className="grid grid-cols-3 gap-3"><Skel h="h-16" /><Skel h="h-16" /><Skel h="h-16" /></div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl px-4 py-3 text-center" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
              <p className="text-2xl font-extrabold" style={{ color: "var(--gray-12)" }}>{fmt(productsTotal ?? 0)}</p>
              <p className="text-xs mt-1" style={{ color: "var(--gray-10)" }}>إجمالي المنتجات</p>
            </div>
            <div className="rounded-xl px-4 py-3 text-center" style={{ background: "var(--green-a2)", border: "1px solid var(--green-a4)" }}>
              <p className="text-2xl font-extrabold" style={{ color: "var(--green-11)" }}>
                {activeProductsCount !== null ? fmt(activeProductsCount) : "—"}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--green-10)" }}>منتجات نشطة</p>
            </div>
            <div className="rounded-xl px-4 py-3 text-center" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
              <p className="text-2xl font-extrabold" style={{ color: "var(--gray-11)" }}>
                {activeProductsCount !== null && productsTotal !== null ? fmt((productsTotal ?? 0) - activeProductsCount) : "—"}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--gray-10)" }}>منتجات غير نشطة</p>
            </div>
          </div>
          {!hasStatus && (
            <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "var(--amber-a2)", color: "var(--amber-11)", border: "1px solid var(--amber-a4)" }}>
              بيانات حالة المنتجات غير متوفرة في استجابة القائمة الحالية
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Latest Orders Table ──────────────────────────────────────────────────────

function LatestOrdersTable({ ordersList, loading, navigate }) {
  return (
    <SectionCard
      title="آخر الطلبات"
      subtitle={loading ? "" : `${fmt(ordersList?.length ?? 0)} طلب`}
      action={
        <button
          onClick={() => navigate("/shop-owner/orders")}
          className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80"
          style={{ color: "var(--blue-11)" }}
        >
          عرض الكل <FiArrowLeft size={12} />
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skel key={i} h="h-12" />)}</div>
      ) : !ordersList?.length ? (
        <EmptyState icon={<FiShoppingBag />} text="لا توجد طلبات بعد" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--gray-10)" }}>
                <th className="text-right py-2 font-semibold text-xs">رقم الطلب</th>
                <th className="text-right py-2 font-semibold text-xs">العميل</th>
                <th className="text-right py-2 font-semibold text-xs">المبلغ</th>
                <th className="text-right py-2 font-semibold text-xs">الحالة</th>
                <th className="text-right py-2 font-semibold text-xs">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {ordersList.map((order, i) => {
                const orderId  = order.shopOrderId ?? order.orderId ?? order.id ?? `#${i + 1}`;
                const name     = order.customerInfo?.username ?? order.customerInfo?.name ?? (order.customerId ? `عميل #${order.customerId}` : "—");
                const amount   = order.totalAmount ?? order.total ?? order.amount;
                const status   = order.status ?? order.orderStatus;
                const created  = order.createdAt ?? order.date;
                return (
                  <tr key={orderId} className="border-t" style={{ borderColor: "var(--gray-a3)" }}>
                    <td className="py-3 font-mono text-xs" style={{ color: "var(--gray-11)" }} dir="ltr">#{String(orderId).slice(-8)}</td>
                    <td className="py-3 text-xs" style={{ color: "var(--gray-12)" }}>{name}</td>
                    <td className="py-3 text-xs font-semibold" style={{ color: "var(--green-11)" }}>{amount != null ? fmtCurrency(amount) : "—"}</td>
                    <td className="py-3"><Badge map={ORDER_STATUS_MAP} status={status} fallback={status} /></td>
                    <td className="py-3 text-xs" style={{ color: "var(--gray-9)" }}>{formatDate(created)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Latest Products Grid ─────────────────────────────────────────────────────

function LatestProductsGrid({ productsList, loading, navigate }) {
  return (
    <SectionCard
      title="أحدث المنتجات"
      subtitle={loading ? "" : `أحدث ${productsList?.length ?? 0} منتجات`}
      action={
        <button
          onClick={() => navigate("/shop-owner/products")}
          className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80"
          style={{ color: "var(--blue-11)" }}
        >
          إدارة المنتجات <FiArrowLeft size={12} />
        </button>
      }
    >
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <Skel key={i} h="h-32" />)}</div>
      ) : !productsList?.length ? (
        <EmptyState icon={<FiPackage />} text="لا توجد منتجات بعد" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {productsList.map(product => {
            const img = product.medium?.smallFileUrl ?? product.medium?.mediumFileUrl ?? product.imageUrl ?? null;
            const statusKnown = product.isActive !== undefined;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => navigate(`/shop-owner/products/${product.id}`)}
                className="group text-right rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "var(--gray-1)", borderColor: "var(--gray-a4)" }}
              >
                <div className="aspect-square bg-gray-50 overflow-hidden" style={{ background: "var(--gray-a2)" }}>
                  {img
                    ? <img src={img} alt={product.name ?? ""} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ color: "var(--gray-7)" }}><FiPackage /></div>
                  }
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold line-clamp-2 leading-5" style={{ color: "var(--gray-12)" }}>{product.name ?? "—"}</p>
                  {product.basePrice != null && (
                    <p className="text-xs font-bold mt-1" style={{ color: "var(--green-11)" }}>{fmtCurrency(product.basePrice)}</p>
                  )}
                  {statusKnown && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={product.isActive === true
                        ? { background: "var(--green-a3)", color: "var(--green-11)" }
                        : product.isActive === false
                          ? { background: "var(--gray-a3)", color: "var(--gray-11)" }
                          : { background: "var(--amber-a3)", color: "var(--amber-11)" }
                      }>
                      {product.isActive === true ? "نشط" : product.isActive === false ? "غير نشط" : "غير معروف"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Finance Detail Card ──────────────────────────────────────────────────────

function FinanceDetailCard({ finance, loading }) {
  const rows = finance ? [
    { label: "مستحقات جاهزة للصرف",   value: fmtCurrency(finance.readyForPayoutAmount),  color: "var(--green-11)",  icon: <FiCheckCircle size={15} /> },
    { label: "أرباح مؤكدة",            value: fmtCurrency(finance.earnedAmount),           color: "var(--blue-11)",   icon: <FiTrendingUp size={15} />  },
    { label: "إجمالي الطلبات المسلّمة",value: fmtCurrency(finance.totalDeliveredAmount),   color: "var(--cyan-11)",   icon: <FiActivity size={15} />    },
    { label: "بنود قيد الانتظار",       value: fmt(finance.itemsInHoldingWindow),           color: "var(--amber-11)",  icon: <FiClock size={15} />       },
    { label: "بنود جاهزة للصرف",        value: fmt(finance.itemsReadyForPayout),            color: "var(--green-11)",  icon: <FiCheckCircle size={15} /> },
    { label: "طلبات إرجاع مرفوضة",      value: fmt(finance.itemsReturnRejected),            color: "var(--red-11)",    icon: <FiAlertCircle size={15} /> },
  ] : [];

  return (
    <SectionCard title="تفاصيل المستحقات المالية">
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skel key={i} h="h-12" />)}</div>
      ) : !finance ? (
        <EmptyState icon={<FiDollarSign />} text="لا توجد بيانات مالية بعد" />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
                <span style={{ color: row.color }}>{row.icon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>{row.value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--gray-10)" }}>{row.label}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "var(--blue-a2)", color: "var(--blue-11)", border: "1px solid var(--blue-a4)" }}>
            {finance.note ?? "هذه الأرقام تمثل مستحقات محسوبة داخل النظام ولا تعني تنفيذ تحويل مالي فعلي."}
          </p>
          <div className="flex flex-wrap gap-3 text-xs pt-1">
            {finance.pendingReturnRequests  != null && <span style={{ color: "var(--amber-11)" }}>طلبات إرجاع قيد المراجعة: {fmt(finance.pendingReturnRequests)}</span>}
            {finance.approvedReturnRequests != null && <span style={{ color: "var(--green-11)" }}>طلبات إرجاع مقبولة: {fmt(finance.approvedReturnRequests)}</span>}
            {finance.rejectedReturnRequests != null && <span style={{ color: "var(--red-11)" }}>طلبات إرجاع مرفوضة: {fmt(finance.rejectedReturnRequests)}</span>}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Subscription Card ────────────────────────────────────────────────────────

function SubscriptionCard({ subscription, hasWriteAccess, loading, navigate }) {
  const status   = subscription?.status ?? subscription?.subscriptionStatus;
  const planName = subscription?.planName ?? subscription?.plan?.name;
  const endDate  = subscription?.endDate ?? subscription?.expiryDate ?? subscription?.end;

  return (
    <SectionCard title="حالة الاشتراك">
      {loading ? <div className="space-y-3"><Skel h="h-12" /><Skel h="h-8" /></div>
      : !subscription ? (
        <EmptyState icon={<FiActivity />} text="لا توجد بيانات اشتراك" />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {status && <Badge map={SUB_STATUS_MAP} status={status} fallback="الاشتراك" />}
            {hasWriteAccess !== null && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={hasWriteAccess
                  ? { background: "var(--green-a3)", color: "var(--green-11)" }
                  : { background: "var(--red-a3)",   color: "var(--red-11)" }
                }>
                {hasWriteAccess ? <FiCheckCircle size={11} /> : <FiAlertCircle size={11} />}
                {hasWriteAccess ? "صلاحية الكتابة متاحة" : "قراءة فقط"}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {planName && (
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
                <p className="text-xs" style={{ color: "var(--gray-10)" }}>الخطة الحالية</p>
                <p className="font-bold mt-1" style={{ color: "var(--gray-12)" }}>{planName}</p>
              </div>
            )}
            {endDate && (
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
                <p className="text-xs" style={{ color: "var(--gray-10)" }}>تاريخ الانتهاء</p>
                <p className="font-bold mt-1" style={{ color: "var(--gray-12)" }}>{formatDateShort(endDate)}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/shop-owner/subscription")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: "var(--blue-a6)", color: "var(--blue-11)", background: "var(--blue-a2)" }}
          >
            إدارة الاشتراك
          </button>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Ads Overview Card ────────────────────────────────────────────────────────

function AdsOverviewCard({ adsList, loading, navigate }) {
  const pending  = (adsList ?? []).filter(a => (a.status ?? a.requestStatus) === "PENDING").length;
  const approved = (adsList ?? []).filter(a => (a.status ?? a.requestStatus) === "APPROVED").length;
  const unpaid   = (adsList ?? []).filter(a => ["UNPAID", "OVERDUE"].includes(a.paymentStatus)).length;
  const displayed = (adsList ?? []).filter(a => a.isDisplayed || a.displayed).length;

  return (
    <SectionCard
      title="الإعلانات"
      subtitle={loading ? "" : `${fmt(adsList?.length ?? 0)} إعلان`}
      action={
        <button onClick={() => navigate("/shop-owner/ads")} className="flex items-center gap-1 text-xs font-semibold hover:opacity-80" style={{ color: "var(--blue-11)" }}>
          إدارة الإعلانات <FiArrowLeft size={12} />
        </button>
      }
    >
      {loading ? <div className="grid grid-cols-2 gap-3"><Skel h="h-16" /><Skel h="h-16" /><Skel h="h-16" /><Skel h="h-16" /></div>
      : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: "قيد المراجعة", value: pending,   bg: "var(--amber-a2)", fg: "var(--amber-11)", border: "var(--amber-a4)" },
            { label: "مقبولة",        value: approved,  bg: "var(--green-a2)", fg: "var(--green-11)", border: "var(--green-a4)" },
            { label: "غير مدفوع",     value: unpaid,    bg: "var(--red-a2)",   fg: "var(--red-11)",   border: "var(--red-a4)" },
            { label: "يُعرض الآن",    value: displayed, bg: "var(--blue-a2)",  fg: "var(--blue-11)",  border: "var(--blue-a4)" },
          ].map((item, i) => (
            <div key={i} className="rounded-xl px-3 py-3" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
              <p className="text-xl font-extrabold" style={{ color: item.fg }}>{fmt(item.value)}</p>
              <p className="text-xs mt-1" style={{ color: item.fg }}>{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Dashboard Skeleton ───────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between gap-4">
        <div className="space-y-2 flex-1"><Skel h="h-7" w="w-48" /><Skel h="h-4" w="w-72" /></div>
        <Skel h="h-10" w="w-32" />
      </div>
      <Skel h="h-14" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skel key={i} h="h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skel h="h-56" /><Skel h="h-56" />
      </div>
      <Skel h="h-64" />
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <FiAlertCircle size={40} style={{ color: "var(--red-9)" }} />
      <p className="text-base font-semibold" style={{ color: "var(--gray-12)" }}>تعذر تحميل لوحة التحكم</p>
      <p className="text-sm text-center max-w-md" style={{ color: "var(--gray-10)" }}>{message}</p>
      <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--blue-9)" }}>
        <FiRefreshCw size={14} /> إعادة المحاولة
      </button>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ data, navigate, loading }) {
  const orderTotal   = Object.values(data?.orderStats ?? {}).reduce((s, v) => s + Number(v), 0);
  const newOrders    = Number(data?.orderStats?.NEW     ?? 0);
  const preparing    = Number(data?.orderStats?.PREPARING ?? 0);
  const readyPickup  = Number(data?.orderStats?.READY_FOR_PICKUP ?? 0);
  const returnPending = Number(data?.returnStats?.PENDING ?? 0);

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard icon={<FiPackage size={18} />} title="إجمالي المنتجات" value={fmt(data?.productsTotal)} desc="المنتجات المسجلة" loading={loading} onClick={() => navigate("/shop-owner/products")} />
        <MetricCard icon={<FiActivity size={18} />} title="منتجات نشطة" value={data?.activeProductsCount !== null ? fmt(data?.activeProductsCount) : "—"} loading={loading} accentColor="var(--green-9)" accentBg="var(--green-a3)" onClick={() => navigate("/shop-owner/products")} />
        <MetricCard icon={<FiShoppingBag size={18} />} title="إجمالي الطلبات" value={fmt(orderTotal)} loading={loading} onClick={() => navigate("/shop-owner/orders")} />
        <MetricCard icon={<FiAlertCircle size={18} />} title="طلبات جديدة" value={fmt(newOrders)} desc="تحتاج إجراء" loading={loading} accentColor="var(--amber-9)" accentBg="var(--amber-a3)" onClick={() => navigate("/shop-owner/orders")} />
        <MetricCard icon={<FiClock size={18} />} title="قيد التحضير" value={fmt(preparing)} loading={loading} accentColor="var(--orange-9)" accentBg="var(--orange-a3)" onClick={() => navigate("/shop-owner/orders")} />
        <MetricCard icon={<FiCheckCircle size={18} />} title="جاهزة للاستلام" value={fmt(readyPickup)} loading={loading} accentColor="var(--cyan-9)" accentBg="var(--cyan-a3)" onClick={() => navigate("/shop-owner/orders")} />
        <MetricCard icon={<FiRotateCcw size={18} />} title="إرجاعات قيد المراجعة" value={fmt(returnPending)} loading={loading} accentColor="var(--red-9)" accentBg="var(--red-a3)" onClick={() => navigate("/shop-owner/returns")} />
        <MetricCard icon={<FiDollarSign size={18} />} title="مستحقات جاهزة للصرف" value={data?.finance ? fmtCurrency(data.finance.readyForPayoutAmount) : "—"} loading={loading} accentColor="var(--green-9)" accentBg="var(--green-a3)" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <OrdersDonutChart orderStats={data?.orderStats} loading={loading} />
        <FinanceBarChart  finance={data?.finance}       loading={loading} />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <ReturnsDonutChart returnStats={data?.returnStats} loading={loading} />
        <AdsStatusChart    adsList={data?.adsList}         loading={loading} />
        <ProductsOverviewChart
          productsList={data?.productsList}
          productsTotal={data?.productsTotal}
          activeProductsCount={data?.activeProductsCount}
          loading={loading}
        />
      </div>

      {/* Latest orders */}
      <LatestOrdersTable ordersList={data?.ordersList} loading={loading} navigate={navigate} />
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ data, navigate, loading }) {
  const orderTotal = Object.values(data?.orderStats ?? {}).reduce((s, v) => s + Number(v), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(ORDER_STATUS_MAP).map(([key, cfg]) => (
          <MetricCard
            key={key}
            icon={<FiShoppingBag size={16} />}
            title={cfg.label}
            value={fmt(data?.orderStats?.[key] ?? 0)}
            loading={loading}
            accentColor={cfg.dot}
            accentBg={cfg.bg}
            onClick={() => navigate("/shop-owner/orders")}
          />
        ))}
      </div>
      <OrdersDonutChart orderStats={data?.orderStats} loading={loading} />
      <LatestOrdersTable ordersList={data?.ordersList} loading={loading} navigate={navigate} />
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({ data, navigate, loading }) {
  return (
    <div className="space-y-5">
      <ProductsOverviewChart
        productsList={data?.productsList}
        productsTotal={data?.productsTotal}
        activeProductsCount={data?.activeProductsCount}
        loading={loading}
      />
      <LatestProductsGrid productsList={data?.productsList} loading={loading} navigate={navigate} />
    </div>
  );
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────

function FinanceTab({ data, navigate, loading }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard icon={<FiCheckCircle size={18} />} title="مستحقات جاهزة للصرف" value={data?.finance ? fmtCurrency(data.finance.readyForPayoutAmount) : "—"} loading={loading} accentColor="var(--green-9)" accentBg="var(--green-a3)" />
        <MetricCard icon={<FiTrendingUp  size={18} />} title="أرباح مؤكدة"          value={data?.finance ? fmtCurrency(data.finance.earnedAmount) : "—"}          loading={loading} accentColor="var(--blue-9)"  accentBg="var(--blue-a3)"  />
        <MetricCard icon={<FiActivity    size={18} />} title="إجمالي المسلّمة"      value={data?.finance ? fmtCurrency(data.finance.totalDeliveredAmount) : "—"}   loading={loading} accentColor="var(--cyan-9)"  accentBg="var(--cyan-a3)"  />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FinanceBarChart    finance={data?.finance}       loading={loading} />
        <ReturnsDonutChart  returnStats={data?.returnStats} loading={loading} />
      </div>
      <FinanceDetailCard finance={data?.finance} loading={loading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AdsOverviewCard    adsList={data?.adsList}          loading={loading} navigate={navigate} />
        <SubscriptionCard   subscription={data?.subscription} hasWriteAccess={data?.hasWriteAccess} loading={loading} navigate={navigate} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShopOwnerDashboard() {
  const navigate = useNavigate();
  const shopId   = auth.getShopId();

  const [tab,        setTab]        = useState("overview");
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated,setLastUpdated]= useState(null);
  const [toast,      setToast]      = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!shopId) { setError("تعذر تحديد معرف المتجر، يرجى تسجيل الخروج وإعادة الدخول."); setLoading(false); return; }
    if (silent) setRefreshing(true);
    else { setLoading(true); setError(null); }
    try {
      const result = await fetchDashboard(shopId);
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "تعذر تحميل البيانات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shopId]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => {
    load(true).then(() => setToast({ message: "تم تحديث البيانات بنجاح", type: "success" }));
  }, [load]);

  if (loading) return <DashboardSkeleton />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  return (
    <div dir="rtl" className="space-y-6 pb-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <DashboardHeader
        shop={data?.shop}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={refresh}
        navigate={navigate}
      />

      <StoreHealthBanner
        shop={data?.shop}
        subscription={data?.subscription}
        hasWriteAccess={data?.hasWriteAccess}
        loading={false}
      />

      <TabNav active={tab} onChange={setTab} />

      {tab === "overview" && <OverviewTab  data={data} navigate={navigate} loading={false} />}
      {tab === "orders"   && <OrdersTab   data={data} navigate={navigate} loading={false} />}
      {tab === "products" && <ProductsTab data={data} navigate={navigate} loading={false} />}
      {tab === "finance"  && <FinanceTab  data={data} navigate={navigate} loading={false} />}
    </div>
  );
}
