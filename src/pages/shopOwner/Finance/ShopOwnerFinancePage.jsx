import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  FiDollarSign, FiTrendingUp, FiPackage, FiLoader, FiAlertCircle,
  FiRefreshCw, FiClock, FiCheckCircle, FiXCircle, FiArrowDownCircle,
  FiLock, FiInfo, FiShoppingBag, FiList,
} from "react-icons/fi";
import { financeApi } from "./financeApi";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n) {
  return (+(n ?? 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtNum(n) {
  return (+(n ?? 0)).toLocaleString("ar-EG");
}

function formatDate(dt) {
  if (!dt) return "—";
  const d = Array.isArray(dt)
    ? new Date(dt[0], dt[1] - 1, dt[2], dt[3] ?? 0, dt[4] ?? 0)
    : new Date(dt);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

const FINANCIAL_STATUSES = new Set([
  "HOLDING", "READY_FOR_PAYOUT", "RETURN_REJECTED", "RETURN_APPROVED", "DELIVERY_FAILED",
]);

function extractItems(orders) {
  const items = [];
  for (const order of orders) {
    const itemList = order.items ?? order.orderItems ?? [];
    for (const item of itemList) {
      if (FINANCIAL_STATUSES.has(item.status)) {
        items.push({ ...item, orderId: order.shopOrderId ?? order.id, orderDate: order.createdAt });
      }
    }
  }
  return items;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Spinner({ size = 18 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function TabNav({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl mb-6"
      style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)", width: "fit-content" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={active === t.id
            ? { background: "var(--blue-9)", color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.15)" }
            : { color: "var(--gray-11)" }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

const ITEM_STATUS = {
  HOLDING:           { label: "قيد الاحتجاز",   bg: "var(--amber-a3)", fg: "var(--amber-11)", icon: FiClock },
  READY_FOR_PAYOUT:  { label: "جاهز للصرف",     bg: "var(--green-a3)", fg: "var(--green-11)", icon: FiCheckCircle },
  RETURN_REJECTED:   { label: "إرجاع مرفوض",    bg: "var(--red-a3)",   fg: "var(--red-11)",   icon: FiXCircle },
  RETURN_APPROVED:   { label: "إرجاع موافق",    bg: "var(--blue-a3)",  fg: "var(--blue-11)",  icon: FiArrowDownCircle },
  DELIVERY_FAILED:   { label: "فشل التسليم",    bg: "var(--gray-a3)",  fg: "var(--gray-11)",  icon: FiXCircle },
};

function ItemStatusBadge({ status }) {
  const s = ITEM_STATUS[status] ?? { label: status, bg: "var(--gray-a3)", fg: "var(--gray-11)" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

function MetricCard({ icon: Icon, title, value, subtitle, accentColor, accentBg, currency = false }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: accentBg || "var(--blue-a3)" }}>
          <Icon size={18} style={{ color: accentColor || "var(--blue-9)" }} />
        </div>
        <span className="text-sm font-medium" style={{ color: "var(--gray-11)" }}>{title}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
          {currency ? `${fmt(value)} ₪` : fmtNum(value)}
        </span>
        {subtitle && <span className="text-xs" style={{ color: "var(--gray-10)" }}>{subtitle}</span>}
      </div>
    </div>
  );
}

// ── Donut chart ────────────────────────────────────────────────────────────────

const DONUT_COLORS = ["var(--green-9)", "var(--amber-9)", "var(--blue-9)", "var(--gray-7)"];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg px-3 py-2 text-sm shadow-lg" dir="rtl"
      style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a5)", color: "var(--gray-12)" }}>
      <span className="font-semibold">{name}:</span> {fmt(value)} ₪
    </div>
  );
}

function FinanceDonutChart({ payout }) {
  const ready    = +(payout?.readyForPayoutAmount ?? 0);
  const earned   = +(payout?.earnedAmount ?? 0);
  const holding  = Math.max(0, earned - ready);
  const returned = +(payout?.totalReturnedAmount ?? 0);
  const total    = ready + holding + returned || 1;

  const data = [
    { name: "جاهز للصرف",    value: ready },
    { name: "قيد الاحتجاز",  value: holding },
    { name: "مبالغ مُرجعة",  value: returned },
  ].filter(d => d.value > 0);

  if (data.length === 0) data.push({ name: "لا توجد بيانات", value: 1 });

  function ProgBar({ label, value, color, total }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium" style={{ color: "var(--gray-11)" }}>{label}</span>
          <span className="text-xs font-semibold" style={{ color: "var(--gray-12)" }}>{fmt(value)} ₪</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: "var(--gray-a4)" }}>
          <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="text-xs" style={{ color: "var(--gray-9)" }}>{pct}%</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
      <h3 className="text-sm font-semibold mb-5" style={{ color: "var(--gray-12)" }}>توزيع المبالغ المالية</h3>
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div style={{ width: 180, height: 180, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="none">
                {data.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
              </Pie>
              <ReTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 flex flex-col gap-4 w-full">
          <ProgBar label="جاهز للصرف"   value={ready}    color="var(--green-9)" total={total} />
          <ProgBar label="قيد الاحتجاز" value={holding}  color="var(--amber-9)" total={total} />
          <ProgBar label="مبالغ مُرجعة" value={returned} color="var(--blue-9)"  total={total} />
        </div>
      </div>
    </div>
  );
}

// ── Payout timeline ────────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { icon: FiShoppingBag, color: "var(--blue-9)",  bg: "var(--blue-a3)",  label: "يُسلَّم الطلب",      desc: "بعد التسليم الناجح يُدرج المبلغ في فترة الاحتجاز." },
  { icon: FiClock,       color: "var(--amber-9)", bg: "var(--amber-a3)", label: "فترة الاحتجاز",      desc: "تمتد 14 يوماً لحماية حق العميل في الإرجاع." },
  { icon: FiCheckCircle, color: "var(--green-9)", bg: "var(--green-a3)", label: "جاهز للصرف",          desc: "بعد انتهاء فترة الاحتجاز يصبح المبلغ جاهزاً للصرف." },
  { icon: FiDollarSign,  color: "var(--blue-9)",  bg: "var(--blue-a3)",  label: "صرف المستحقات",      desc: "يُحوَّل المبلغ إلى حسابك عبر الإدارة بشكل دوري." },
  { icon: FiTrendingUp,  color: "var(--green-9)", bg: "var(--green-a3)", label: "يُضاف للأرباح المحققة", desc: "يُسجَّل المبلغ ضمن إجمالي أرباحك في المنصة." },
];

function PayoutTimeline() {
  return (
    <div className="rounded-2xl p-6" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
      <div className="flex items-center gap-2 mb-5">
        <FiInfo size={16} style={{ color: "var(--blue-9)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>كيف تعمل دورة الصرف؟</h3>
      </div>
      <div className="flex flex-col gap-0">
        {TIMELINE_STEPS.map((step, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: step.bg }}>
                <step.icon size={15} style={{ color: step.color }} />
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className="w-0.5 flex-1 my-1" style={{ background: "var(--gray-a5)", minHeight: 20 }} />
              )}
            </div>
            <div className="pb-5 flex flex-col gap-0.5">
              <span className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>{step.label}</span>
              <span className="text-xs leading-relaxed" style={{ color: "var(--gray-10)" }}>{step.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Finance note ───────────────────────────────────────────────────────────────

function FinanceNoteCard() {
  return (
    <div className="rounded-2xl p-5 flex gap-4" style={{ background: "var(--blue-a2)", border: "1px solid var(--blue-a4)" }}>
      <FiInfo size={18} className="shrink-0 mt-0.5" style={{ color: "var(--blue-9)" }} />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold" style={{ color: "var(--blue-11)" }}>ملاحظة حول الصرف</span>
        <span className="text-xs leading-relaxed" style={{ color: "var(--blue-11)", opacity: 0.85 }}>
          يتم صرف المستحقات المالية من خلال إدارة المنصة يدوياً بشكل دوري (أسبوعي أو شهري).
          يُرجى التواصل مع فريق الدعم لطلب كشف حساب تفصيلي أو للاستفسار عن موعد الصرف القادم.
          لا يتوفر حالياً نظام طلب صرف مباشر من لوحة المتجر.
        </span>
      </div>
    </div>
  );
}

// ── Disabled payout button ─────────────────────────────────────────────────────

function PayoutButton({ amount }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="inline-block">
            <button disabled
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed"
              style={{ background: "var(--gray-a4)", color: "var(--gray-9)", border: "1px solid var(--gray-a5)" }}>
              <FiLock size={14} />
              طلب صرف المستحقات ({fmt(amount)} ₪)
            </button>
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="px-3 py-2 rounded-lg text-xs shadow-xl max-w-xs text-center z-50" dir="rtl"
            style={{ background: "var(--gray-12)", color: "var(--gray-1)" }}
            sideOffset={6}>
            لا يوجد endpoint حالياً لتنفيذ طلب الصرف — يتم الصرف يدوياً عبر الإدارة
            <Tooltip.Arrow style={{ fill: "var(--gray-12)" }} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

// ── Return stats section ───────────────────────────────────────────────────────

function ReturnStatsSection({ returnStats }) {
  const pending  = returnStats?.pendingReturnRequests  ?? 0;
  const approved = returnStats?.approvedReturnRequests ?? 0;
  const rejected = returnStats?.rejectedReturnRequests ?? 0;
  const total    = pending + approved + rejected;

  function ReturnCard({ label, value, color, bg, icon: Icon, desc }) {
    return (
      <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: bg, border: `1px solid ${color}33` }}>
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color }} />
          <span className="text-sm font-medium" style={{ color: "var(--gray-11)" }}>{label}</span>
        </div>
        <span className="text-3xl font-bold" style={{ color: "var(--gray-12)" }}>{fmtNum(value)}</span>
        <span className="text-xs" style={{ color: "var(--gray-10)" }}>{desc}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ReturnCard label="طلبات إرجاع معلّقة"  value={pending}  color="var(--amber-9)" bg="var(--amber-a2)" icon={FiClock}       desc="في انتظار مراجعة الإدارة" />
        <ReturnCard label="إرجاعات موافق عليها" value={approved} color="var(--blue-9)"  bg="var(--blue-a2)"  icon={FiCheckCircle} desc="تم خصم مبالغها من مستحقاتك" />
        <ReturnCard label="إرجاعات مرفوضة"      value={rejected} color="var(--red-9)"   bg="var(--red-a2)"   icon={FiXCircle}     desc="المبلغ يظل في مستحقاتك" />
      </div>

      {total > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--gray-12)" }}>نسب طلبات الإرجاع</h3>
          <div className="flex flex-col gap-3">
            {[
              { label: "معلّقة",  value: pending,  color: "var(--amber-9)" },
              { label: "موافق",   value: approved, color: "var(--blue-9)"  },
              { label: "مرفوضة", value: rejected, color: "var(--red-9)"   },
            ].map(({ label, value, color }) => {
              const pct = total ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--gray-11)" }}>{label}</span>
                    <span style={{ color: "var(--gray-12)", fontWeight: 600 }}>{value} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full w-full" style={{ background: "var(--gray-a4)" }}>
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl p-5 flex gap-3" style={{ background: "var(--amber-a2)", border: "1px solid var(--amber-a4)" }}>
        <FiInfo size={16} className="shrink-0 mt-0.5" style={{ color: "var(--amber-9)" }} />
        <p className="text-xs leading-relaxed" style={{ color: "var(--amber-11)" }}>
          عند الموافقة على طلب الإرجاع، يُخصم مبلغ العنصر المُرجع من مستحقاتك الجاهزة للصرف.
          في حال رفض الإرجاع، يُحتسب المبلغ كاملاً لصالحك بعد انتهاء فترة الاحتجاز.
        </p>
      </div>
    </div>
  );
}

// ── Financial items table ──────────────────────────────────────────────────────

const ITEM_FILTERS = [
  { value: "",                label: "الكل" },
  { value: "HOLDING",         label: "قيد الاحتجاز" },
  { value: "READY_FOR_PAYOUT",label: "جاهز للصرف" },
  { value: "RETURN_APPROVED", label: "إرجاع موافق" },
  { value: "RETURN_REJECTED", label: "إرجاع مرفوض" },
  { value: "DELIVERY_FAILED", label: "فشل التسليم" },
];

function FinancialItemsTable({ orders }) {
  const [filter, setFilter] = useState("");
  const allItems = extractItems(orders);
  const displayed = filter ? allItems.filter(it => it.status === filter) : allItems;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {ITEM_FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={filter === f.value
              ? { background: "var(--blue-9)", color: "#fff" }
              : { background: "var(--gray-a3)", color: "var(--gray-11)", border: "1px solid var(--gray-a4)" }}>
            {f.label}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3" style={{ color: "var(--gray-9)" }}>
          <FiList size={36} />
          <span className="text-sm">لا توجد عناصر مالية</span>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--gray-a4)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--gray-a2)", borderBottom: "1px solid var(--gray-a4)" }}>
                  {["رقم الطلب", "المنتج", "الكمية", "سعر الوحدة", "الإجمالي", "الحالة المالية", "التاريخ"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-right" style={{ color: "var(--gray-10)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((item, i) => (
                  <tr key={`${item.orderId}-${item.orderItemId ?? i}`}
                    className="border-b transition-colors hover:bg-(--gray-a2)"
                    style={{ borderColor: "var(--gray-a3)" }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--gray-11)" }}>#{item.orderId}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-xs" style={{ color: "var(--gray-12)" }}>{item.productName ?? "—"}</span>
                        {item.variantName && <span className="text-xs" style={{ color: "var(--gray-9)" }}>{item.variantName}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-center" style={{ color: "var(--gray-11)" }}>{item.quantity ?? 1}</td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--gray-12)" }}>{fmt(item.unitPrice)} ₪</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: "var(--gray-12)" }}>{fmt(item.lineTotal ?? ((item.unitPrice ?? 0) * (item.quantity ?? 1)))} ₪</td>
                    <td className="px-4 py-3"><ItemStatusBadge status={item.status} /></td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--gray-9)" }}>{formatDate(item.orderDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex md:hidden flex-col gap-3">
            {displayed.map((item, i) => (
              <div key={`${item.orderId}-${item.orderItemId ?? i}`}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)" }}>
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs" style={{ color: "var(--gray-9)" }}>#{item.orderId}</span>
                  <ItemStatusBadge status={item.status} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>{item.productName ?? "—"}</p>
                  {item.variantName && <p className="text-xs" style={{ color: "var(--gray-9)" }}>{item.variantName}</p>}
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--gray-10)" }}>{item.quantity ?? 1} × {fmt(item.unitPrice)} ₪</span>
                  <span className="font-bold" style={{ color: "var(--gray-12)" }}>{fmt(item.lineTotal ?? ((item.unitPrice ?? 0) * (item.quantity ?? 1)))} ₪</span>
                </div>
                <span className="text-xs" style={{ color: "var(--gray-9)" }}>{formatDate(item.orderDate)}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-center" style={{ color: "var(--gray-9)" }}>
            يعرض آخر 20 طلب · {displayed.length} عنصر
          </p>
        </>
      )}
    </div>
  );
}

// ── Overview tab ───────────────────────────────────────────────────────────────

function OverviewTab({ payout, returnStats }) {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          icon={FiCheckCircle}
          title="جاهز للصرف"
          value={payout?.readyForPayoutAmount}
          subtitle="مبالغ انتهت فترة احتجازها"
          accentColor="var(--green-9)" accentBg="var(--green-a3)" currency />
        <MetricCard
          icon={FiTrendingUp}
          title="الأرباح المحققة"
          value={payout?.earnedAmount}
          subtitle="إجمالي المبالغ المحققة"
          accentColor="var(--blue-9)" accentBg="var(--blue-a3)" currency />
        <MetricCard
          icon={FiDollarSign}
          title="إجمالي الطلبات المُسلَّمة"
          value={payout?.totalDeliveredAmount}
          subtitle="قيمة الطلبات المُسلَّمة"
          accentColor="var(--blue-9)" accentBg="var(--blue-a3)" currency />
        <MetricCard
          icon={FiClock}
          title="عناصر قيد الاحتجاز"
          value={payout?.itemsInHoldingWindow}
          subtitle="في فترة حماية الإرجاع"
          accentColor="var(--amber-9)" accentBg="var(--amber-a3)" />
        <MetricCard
          icon={FiCheckCircle}
          title="عناصر جاهزة للصرف"
          value={payout?.itemsReadyForPayout}
          subtitle="أتمّت فترة الاحتجاز"
          accentColor="var(--green-9)" accentBg="var(--green-a3)" />
        <MetricCard
          icon={FiXCircle}
          title="إرجاعات مرفوضة"
          value={payout?.itemsReturnRejected}
          subtitle="تُحتسب ضمن مستحقاتك"
          accentColor="var(--red-9)" accentBg="var(--red-a2)" />
      </div>

      {/* Payout button */}
      <div className="flex justify-end">
        <PayoutButton amount={payout?.readyForPayoutAmount ?? 0} />
      </div>

      {/* Finance breakdown chart */}
      <FinanceDonutChart payout={payout} />

      {/* Return summary (compact) */}
      {returnStats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "إرجاعات معلّقة",  value: returnStats.pendingReturnRequests,  color: "var(--amber-9)", bg: "var(--amber-a2)" },
            { label: "إرجاعات موافق",   value: returnStats.approvedReturnRequests, color: "var(--blue-9)",  bg: "var(--blue-a2)"  },
            { label: "إرجاعات مرفوضة", value: returnStats.rejectedReturnRequests, color: "var(--red-9)",   bg: "var(--red-a2)"   },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 flex flex-col gap-1 text-center" style={{ background: s.bg }}>
              <span className="text-xl font-bold" style={{ color: s.color }}>{fmtNum(s.value ?? 0)}</span>
              <span className="text-xs" style={{ color: "var(--gray-10)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Payout timeline */}
      <PayoutTimeline />

      {/* Note */}
      <FinanceNoteCard />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "نظرة عامة" },
  { id: "items",    label: "العناصر المالية" },
  { id: "returns",  label: "الإرجاعات" },
];

export default function ShopOwnerFinancePage() {
  const [tab, setTab]               = useState("overview");
  const [payout, setPayout]         = useState(null);
  const [returnStats, setReturnStats] = useState(null);
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, r, o] = await Promise.all([
        financeApi.getPayout().catch(() => null),
        financeApi.getReturnStats().catch(() => null),
        financeApi.getOrders(0, 20).catch(() => null),
      ]);
      setPayout(p);
      setReturnStats(r);
      const raw = o?.content ?? o?.data?.content ?? o?.data ?? o ?? [];
      setOrders(Array.isArray(raw) ? raw : []);
    } catch (e) {
      setError(e.message || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div dir="rtl" className="min-h-screen p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>المستحقات المالية</h1>
          <p className="text-sm" style={{ color: "var(--gray-10)" }}>مراقبة أرباحك ومستحقاتك الجاهزة للصرف</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: "var(--gray-a3)", color: "var(--gray-11)", border: "1px solid var(--gray-a4)" }}>
          {loading ? <Spinner size={14} /> : <FiRefreshCw size={14} />}
          تحديث
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--gray-a3)" }} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center py-20 gap-4">
          <FiAlertCircle size={40} style={{ color: "var(--red-9)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--gray-11)" }}>{error}</p>
          <button onClick={load}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--blue-9)", color: "#fff" }}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          <TabNav tabs={TABS} active={tab} onChange={setTab} />

          {tab === "overview" && <OverviewTab payout={payout} returnStats={returnStats} />}

          {tab === "items" && <FinancialItemsTable orders={orders} />}

          {tab === "returns" && <ReturnStatsSection returnStats={returnStats} />}
        </>
      )}
    </div>
  );
}
