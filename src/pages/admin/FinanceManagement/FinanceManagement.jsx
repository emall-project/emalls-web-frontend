import { useState, useEffect, useCallback } from "react";
import * as Select from "@radix-ui/react-select";
import {
  FiRefreshCw, FiLoader, FiAlertCircle, FiSearch,
  FiDollarSign, FiPackage, FiTruck, FiRotateCcw,
  FiCheckCircle, FiXCircle, FiClock, FiCheck, FiChevronDown,
} from "react-icons/fi";
import { financeApi } from "./api";
import { shopsApi } from "../ShopManagement/api";

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtN(n) {
  return Number(n || 0).toLocaleString();
}

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
      style={{ background: "var(--red-a3)", color: "var(--red-11)", border: "1px solid var(--red-a6)" }}>
      <FiAlertCircle size={15} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="underline text-xs opacity-80 hover:opacity-100 mr-2">
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, bg, border, sub, money = false }) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-3"
      style={{ background: bg || "var(--gray-1)", borderColor: border || "var(--gray-a5)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: "var(--gray-10)" }}>{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: color + "33" }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
        {money ? `₪${fmt(value)}` : fmtN(value)}
      </div>
      {sub && <p className="text-xs leading-5" style={{ color: "var(--gray-9)" }}>{sub}</p>}
    </div>
  );
}

// ── Shop Select ───────────────────────────────────────────────────────────────
const NONE = "__NONE__";

function ShopSelect({ value, onValueChange, shops }) {
  const container = document.querySelector(".radix-themes") || document.body;
  const radixValue = value === "" || value == null ? NONE : value;
  return (
    <Select.Root value={radixValue} onValueChange={v => onValueChange(v === NONE ? "" : v)} dir="rtl">
      <Select.Trigger
        className="inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm border outline-none flex-1 transition-all"
        style={{
          background:  "var(--gray-a2)",
          borderColor: "var(--gray-a6)",
          color:       radixValue === NONE ? "var(--gray-9)" : "var(--gray-12)",
          direction:   "rtl",
        }}
      >
        <Select.Value placeholder="اختر متجراً..." />
        <Select.Icon asChild>
          <FiChevronDown size={13} style={{ color: "var(--gray-9)", flexShrink: 0 }} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal container={container}>
        <Select.Content position="popper" sideOffset={6}
          className="z-[9999] rounded-2xl border shadow-2xl overflow-hidden"
          style={{ background: "var(--gray-2)", borderColor: "var(--gray-a6)", minWidth: "var(--radix-select-trigger-width)", maxHeight: 280 }}>
          <Select.Viewport className="p-1.5 space-y-0.5">
            <Select.Item value={NONE}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer outline-none select-none transition-colors"
              style={{ color: "var(--gray-10)", direction: "rtl" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-a3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <Select.ItemText>— اختر متجراً —</Select.ItemText>
              <Select.ItemIndicator><FiCheck size={13} style={{ color: "var(--blue-9)" }} /></Select.ItemIndicator>
            </Select.Item>
            {shops.map(s => (
              <Select.Item key={s.shopId} value={String(s.shopId)}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer outline-none select-none transition-colors"
                style={{ color: "var(--gray-12)", direction: "rtl" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-a3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <Select.ItemText>{s.name}</Select.ItemText>
                <Select.ItemIndicator><FiCheck size={13} style={{ color: "var(--blue-9)" }} /></Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

// ── Item status config ─────────────────────────────────────────────────────────
const ITEM_STATUS = {
  CREATED:          { label: "مُنشأ",              color: "var(--gray-9)"   },
  PREPARING:        { label: "جاري التحضير",        color: "var(--amber-9)"  },
  READY_FOR_PICKUP: { label: "جاهز للاستلام",       color: "var(--purple-9)" },
  OUT_FOR_DELIVERY: { label: "في الطريق",           color: "var(--indigo-9)" },
  DELIVERED:        { label: "مُسلَّم",              color: "var(--blue-9)"   },
  HOLDING:          { label: "فترة الانتظار",        color: "var(--yellow-9)" },
  READY_FOR_PAYOUT: { label: "جاهز للصرف",          color: "var(--teal-9)"   },
  RETURN_REQUESTED: { label: "إرجاع مطلوب",         color: "var(--orange-9)" },
  RETURN_APPROVED:  { label: "إرجاع مقبول",         color: "var(--green-9)"  },
  RETURN_REJECTED:  { label: "إرجاع مرفوض",         color: "var(--red-9)"    },
  DELIVERY_FAILED:  { label: "توصيل فاشل",          color: "var(--red-11)"   },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function FinanceManagement() {
  const [overview, setOverview]       = useState(null);
  const [distribution, setDistrib]    = useState({});
  const [loadingMain, setLoadingMain] = useState(true);
  const [errorMain, setErrorMain]     = useState("");

  const [shops, setShops]               = useState([]);
  const [shopIdInput, setShopIdInput]   = useState("");
  const [payout, setPayout]             = useState(null);
  const [loadingPayout, setLoadingPayout] = useState(false);
  const [errorPayout, setErrorPayout]   = useState("");

  const loadMain = useCallback(async () => {
    setLoadingMain(true); setErrorMain("");
    try {
      const [ov, dist] = await Promise.all([
        financeApi.getOverview(),
        financeApi.getDistribution(),
      ]);
      setOverview(ov?.data || null);
      setDistrib(dist?.data || {});
    } catch (e) {
      setErrorMain(e.message || "فشل تحميل البيانات المالية");
    } finally {
      setLoadingMain(false);
    }
  }, []);

  useEffect(() => { loadMain(); }, [loadMain]);

  useEffect(() => {
    shopsApi.getAll({ size: 500 })
      .then(r => {
        const data = r?.data || r?.content || [];
        const list = Array.isArray(data) ? data : (data?.content || []);
        setShops(list);
      })
      .catch(() => {});
  }, []);

  const searchPayout = async () => {
    const id = shopIdInput.trim();
    if (!id) return;
    setLoadingPayout(true); setErrorPayout(""); setPayout(null);
    try {
      const r = await financeApi.getShopPayout(id);
      setPayout(r?.data || null);
    } catch (e) {
      setErrorPayout(e.message || "فشل تحميل بيانات المتجر");
    } finally {
      setLoadingPayout(false);
    }
  };

  const ov = overview || {};

  return (
    <div dir="rtl" className="p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>الإدارة المالية</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--gray-10)" }}>نظرة شاملة على الطلبات والمدفوعات والإرجاعات</p>
        </div>
        <button onClick={loadMain} disabled={loadingMain}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
          style={{ background: "var(--gray-a3)", color: "var(--gray-12)" }}>
          {loadingMain ? <Spinner size={14} /> : <FiRefreshCw size={14} />}
          تحديث
        </button>
      </div>

      {errorMain && <ErrorBanner message={errorMain} onRetry={loadMain} />}

      {/* ── Overview KPIs ── */}
      {loadingMain ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : (
        <>
          {/* Orders section */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold" style={{ color: "var(--gray-11)" }}>الطلبات</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KpiCard label="إجمالي الطلبات"     value={ov.totalOrders}      icon={FiPackage}     color="var(--blue-9)"   sub="جميع الطلبات المسجّلة" />
              <KpiCard label="طلبات مُسلَّمة"     value={ov.deliveredOrders}  icon={FiCheckCircle} color="var(--green-9)"  sub="وصلت للعميل بنجاح" />
              <KpiCard label="توصيل فاشل"         value={ov.failedDeliveries} icon={FiTruck}       color="var(--red-9)"    sub="لا استجابة أو رُفض العميل" />
            </div>
          </section>

          {/* Payout section */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold" style={{ color: "var(--gray-11)" }}>المدفوعات</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KpiCard
                label="عناصر جاهزة للصرف"
                value={ov.itemsReadyForPayout}
                icon={FiDollarSign}
                color="var(--teal-9)"
                sub="انتهت فترة الانتظار بدون إرجاع"
              />
              <KpiCard
                label="عناصر في فترة الانتظار"
                value={ov.itemsInHoldingWindow}
                icon={FiClock}
                color="var(--yellow-9)"
                sub="نافذة الإرجاع 3 أيام لا تزال مفتوحة"
              />
              <KpiCard
                label="عناصر رُفض إرجاعها"
                value={ov.itemsReturnRejected}
                icon={FiXCircle}
                color="var(--purple-9)"
                sub="المتجر رفض الإرجاع — المبلغ محتسب"
              />
            </div>
          </section>

          {/* Returns section */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold" style={{ color: "var(--gray-11)" }}>الإرجاعات</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KpiCard label="إرجاع معلّق"   value={ov.pendingReturnRequests}  icon={FiRotateCcw}   color="var(--orange-9)" sub="بانتظار قرار المتجر" />
              <KpiCard label="إرجاع مقبول"   value={ov.approvedReturnRequests} icon={FiCheck}       color="var(--green-9)"  sub="وافق عليها المتجر" />
              <KpiCard label="إرجاع مرفوض"   value={ov.rejectedReturnRequests} icon={FiXCircle}     color="var(--red-9)"    sub="رفضها المتجر" />
            </div>
          </section>

          {/* ── Items Distribution ── */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold" style={{ color: "var(--gray-11)" }}>توزيع عناصر الطلبات حسب الحالة</h2>
            <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>
              {Object.keys(distribution).length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--gray-9)" }}>لا توجد بيانات</p>
              ) : (() => {
                const rows = Object.entries(distribution).sort(([, a], [, b]) => b - a);
                const maxCount = Math.max(...rows.map(([, c]) => c), 1);
                return (
                  <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--gray-a2)", borderBottom: "1px solid var(--gray-a4)" }}>
                        <th className="text-right px-5 py-3 font-semibold text-xs" style={{ color: "var(--gray-10)" }}>الحالة</th>
                        <th className="px-5 py-3 font-semibold text-xs" style={{ color: "var(--gray-10)" }}>التوزيع</th>
                        <th className="text-left px-5 py-3 font-semibold text-xs" style={{ color: "var(--gray-10)" }}>العدد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(([status, count], i) => {
                        const cfg = ITEM_STATUS[status] || { label: status, color: "var(--gray-9)" };
                        const pct = Math.round((count / maxCount) * 100);
                        return (
                          <tr key={status}
                            style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--gray-a3)" : "none" }}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                                <span className="font-medium" style={{ color: "var(--gray-12)" }}>{cfg.label}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--gray-a3)", minWidth: 80 }}>
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, background: cfg.color, opacity: 0.75 }} />
                              </div>
                            </td>
                            <td className="px-5 py-3 text-left">
                              <span className="text-base font-bold" style={{ color: "var(--gray-12)" }}>{fmtN(count)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </section>
        </>
      )}

      {/* ── Shop Payout Lookup ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold" style={{ color: "var(--gray-11)" }}>استعلام مستحقات متجر</h2>
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}>

          {/* Search bar */}
          <div className="flex gap-3">
            <ShopSelect value={shopIdInput} onValueChange={setShopIdInput} shops={shops} />
            <button
              onClick={searchPayout}
              disabled={loadingPayout || !shopIdInput}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--blue-9)", color: "#fff" }}>
              {loadingPayout ? <Spinner size={14} /> : <FiSearch size={14} />}
              بحث
            </button>
          </div>

          {errorPayout && <ErrorBanner message={errorPayout} />}

          {/* Payout result */}
          {payout && (
            <div className="space-y-4 pt-2">
              <p className="text-xs font-semibold pb-1 border-b" style={{ color: "var(--gray-10)", borderColor: "var(--gray-a4)" }}>
                نتائج المتجر #{payout.shopId}
              </p>

              {/* Money amounts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border p-4 space-y-1"
                  style={{ background: "var(--teal-a2)", borderColor: "var(--teal-a5)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--teal-11)" }}>المبلغ المكتسب</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--teal-11)" }}>₪{fmt(payout.earnedAmount)}</p>
                  <p className="text-[11px]" style={{ color: "var(--teal-9)" }}>جاهز للصرف + مرفوض الإرجاع</p>
                </div>
                <div className="rounded-xl border p-4 space-y-1"
                  style={{ background: "var(--blue-a2)", borderColor: "var(--blue-a5)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--blue-11)" }}>جاهز للصرف</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--blue-11)" }}>₪{fmt(payout.readyForPayoutAmount)}</p>
                  <p className="text-[11px]" style={{ color: "var(--blue-9)" }}>انتهت فترة الانتظار دون إرجاع</p>
                </div>
                <div className="rounded-xl border p-4 space-y-1"
                  style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>إجمالي التسليم</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>₪{fmt(payout.totalDeliveredAmount)}</p>
                  <p className="text-[11px]" style={{ color: "var(--gray-9)" }}>إجمالي مجموع الطلبات المُسلَّمة</p>
                </div>
              </div>

              {/* Item counts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "عناصر جاهزة للصرف",     value: payout.itemsReadyForPayout,  color: "var(--teal-9)"   },
                  { label: "عناصر في الانتظار",       value: payout.itemsInHoldingWindow, color: "var(--yellow-9)" },
                  { label: "إرجاع مرفوض (مدفوع)",    value: payout.itemsReturnRejected,  color: "var(--purple-9)" },
                  { label: "إرجاع معلّق",             value: payout.pendingReturnRequests,color: "var(--orange-9)" },
                  { label: "إرجاع مقبول",             value: payout.approvedReturnRequests,color:"var(--green-9)"  },
                  { label: "إرجاع مرفوض",             value: payout.rejectedReturnRequests,color:"var(--red-9)"   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl border px-4 py-3"
                    style={{ background: "var(--gray-2)", borderColor: "var(--gray-a4)" }}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <div>
                      <div className="text-base font-bold" style={{ color: "var(--gray-12)" }}>{fmtN(value)}</div>
                      <div className="text-[11px]" style={{ color: "var(--gray-10)" }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {payout.note && (
                <p className="text-xs px-4 py-3 rounded-xl flex items-start gap-2"
                  style={{ background: "var(--yellow-a2)", color: "var(--yellow-11)", border: "1px solid var(--yellow-a5)" }}>
                  <span className="mt-0.5 shrink-0">ℹ️</span>
                  <span>
                    <strong>ملاحظة: </strong>
                    المبلغ المكتسب يشمل العناصر الجاهزة للصرف والعناصر التي رُفض إرجاعها من قِبل المتجر.
                    لم تتم أي عملية تحويل مالي فعلية بعد — هذا المبلغ هو ما يحق للمتجر استلامه.
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
