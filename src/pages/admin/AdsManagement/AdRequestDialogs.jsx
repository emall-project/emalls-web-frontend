import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAlertCircle, FiCalendar, FiChevronLeft, FiChevronRight, FiCheck } from "react-icons/fi";
import { adRequestsApi } from "./api";

function useThemeContainer() {
  const [c, setC] = useState(null);
  useEffect(() => { setC(document.querySelector(".radix-themes") || document.body); }, []);
  return c;
}

function Spinner({ size = 14 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

const surface = {
  background: "var(--gray-1)",
  border:     "1px solid var(--gray-a6)",
  boxShadow:  "0 20px 60px rgba(0,0,0,.4)",
};

const inp = {
  background:  "var(--gray-a2)",
  borderColor: "var(--gray-a6)",
  color:       "var(--gray-12)",
  direction:   "rtl",
  textAlign:   "right",
};

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
const labelCls = "block text-xs font-semibold mb-1.5";

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs mt-1" style={{ color: "var(--red-9)" }}>{msg}</p>;
}

// ── Custom DateTime Picker ─────────────────────────────────────────────────────
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAYS_AR   = ["ح","ن","ث","ر","خ","ج","س"];

function CustomDateInput({ value, onChange, placeholder = "اختر التاريخ والوقت" }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selDay,    setSelDay]    = useState(null);
  const [selMonth,  setSelMonth]  = useState(null);
  const [selYear,   setSelYear]   = useState(null);
  const [hour,   setHour]   = useState("00");
  const [minute, setMinute] = useState("00");

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      const [dp, tp] = value.split("T");
      const [y, m, d] = dp.split("-");
      const [hh, mm]  = tp.split(":");
      setSelYear(+y); setSelMonth(+m - 1); setSelDay(+d);
      setViewYear(+y); setViewMonth(+m - 1);
      setHour(hh); setMinute(mm);
    } else if (!value) {
      setSelDay(null); setSelMonth(null); setSelYear(null);
      setHour("00"); setMinute("00");
    }
  }, [value]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstWeekDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d) => d === selDay && viewMonth === selMonth && viewYear === selYear;
  const isToday    = (d) => d === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();

  const confirm = () => {
    if (selDay !== null && selYear !== null && selMonth !== null) {
      const y  = String(selYear).padStart(4, "0");
      const m  = String(selMonth + 1).padStart(2, "0");
      const d  = String(selDay).padStart(2, "0");
      const hh = hour.padStart(2, "0");
      const mm = minute.padStart(2, "0");
      onChange(`${y}-${m}-${d}T${hh}:${mm}:00`);
    }
    setOpen(false);
  };

  const displayValue = selDay !== null
    ? `${String(selDay).padStart(2,"0")}/${String(selMonth+1).padStart(2,"0")}/${selYear}  ${hour.padStart(2,"0")}:${minute.padStart(2,"0")}`
    : null;

  return (
    <div ref={ref} className="relative" dir="rtl">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`${inputCls} flex items-center justify-between`}
        style={{ ...inp, color: displayValue ? "var(--gray-12)" : "var(--gray-9)", cursor: "pointer" }}>
        <span>{displayValue || placeholder}</span>
        <FiCalendar size={14} style={{ color: "var(--gray-9)", marginLeft: 6, flexShrink: 0 }} />
      </button>

      {open && (
        <div className="absolute z-[9999] mt-1 rounded-2xl shadow-2xl border overflow-hidden"
          style={{ background: "var(--gray-2)", borderColor: "var(--gray-a6)", minWidth: 280, right: 0 }}>

          <div className="flex items-center justify-between px-3 py-3 border-b" style={{ borderColor: "var(--gray-a5)" }}>
            <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-70" style={{ color: "var(--gray-11)" }}><FiChevronLeft size={15} /></button>
            <span className="font-bold text-sm" style={{ color: "var(--gray-12)" }}>{MONTHS_AR[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-70" style={{ color: "var(--gray-11)" }}><FiChevronRight size={15} /></button>
          </div>

          <div className="grid grid-cols-7 px-3 pt-2 pb-1 gap-1" style={{ direction: "rtl" }}>
            {DAYS_AR.map(d => <div key={d} className="text-center text-xs font-semibold py-0.5" style={{ color: "var(--gray-9)" }}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 px-3 pb-3 gap-1" style={{ direction: "rtl" }}>
            {cells.map((d, i) => (
              <div key={i} className="flex items-center justify-center">
                {d ? (
                  <button type="button" onClick={() => { setSelDay(d); setSelMonth(viewMonth); setSelYear(viewYear); }}
                    className="w-8 h-8 rounded-full text-xs font-medium transition hover:opacity-80"
                    style={{
                      background: isSelected(d) ? "var(--blue-9)" : isToday(d) ? "var(--blue-a3)" : "transparent",
                      color: isSelected(d) ? "#fff" : isToday(d) ? "var(--blue-11)" : "var(--gray-12)",
                    }}>{d}</button>
                ) : <span />}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t" style={{ borderColor: "var(--gray-a5)" }}>
            <span className="text-xs font-semibold" style={{ color: "var(--gray-10)" }}>الوقت</span>
            <input type="text" inputMode="numeric" maxLength={2} value={hour} onChange={e => setHour(e.target.value.replace(/\D/g,"").slice(0,2))}
              className="w-10 text-center text-sm rounded-lg py-1.5 border outline-none"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }} />
            <span className="font-bold" style={{ color: "var(--gray-9)" }}>:</span>
            <input type="text" inputMode="numeric" maxLength={2} value={minute} onChange={e => setMinute(e.target.value.replace(/\D/g,"").slice(0,2))}
              className="w-10 text-center text-sm rounded-lg py-1.5 border outline-none"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }} />
          </div>

          <div className="px-3 pb-3">
            <button type="button" onClick={confirm} disabled={selDay === null}
              className="w-full py-2 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--blue-9)", color: "#fff" }}>
              <FiCheck size={13} className="inline ml-1" /> تأكيد
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Price helpers ──────────────────────────────────────────────────────────────
function calcHours(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  return (end - start) / (1000 * 60 * 60);
}

// ── Create Ad Request Dialog ───────────────────────────────────────────────────
export function AdRequestFormDialog({ open, onOpenChange, onSuccess }) {
  const themeContainer = useThemeContainer();
  const bodyRef = useRef(null);

  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState("");
  const [fieldErrors,         setFieldErrors]         = useState({});
  const [templateId,          setTemplateId]          = useState("");
  const [shopId,              setShopId]              = useState("");
  const [title,               setTitle]               = useState("");
  const [adRequestImageUuid,  setAdRequestImageUuid]  = useState("");
  const [startDate,           setStartDate]           = useState("");
  const [endDate,             setEndDate]             = useState("");
  const [pricePerHour,        setPricePerHour]        = useState("");

  useEffect(() => {
    if (!open) {
      setTemplateId(""); setShopId(""); setTitle(""); setAdRequestImageUuid("");
      setStartDate(""); setEndDate(""); setPricePerHour("");
      setError(""); setFieldErrors({});
    }
  }, [open]);

  const scrollTop = () => { if (bodyRef.current) bodyRef.current.scrollTop = 0; };
  const clearErr  = (f) => setFieldErrors((p) => ({ ...p, [f]: "" }));

  const hours      = calcHours(startDate, endDate);
  const totalPrice = pricePerHour && hours > 0 ? Number(pricePerHour) * hours : 0;
  const showPrice  = totalPrice > 0;

  const handleSubmit = async () => {
    if (!templateId)                  { setError("معرّف النموذج الإعلاني مطلوب"); return scrollTop(); }
    if (!shopId)                      { setError("معرّف المتجر مطلوب");           return scrollTop(); }
    if (!title.trim())                { setError("عنوان الإعلان مطلوب");          return scrollTop(); }
    if (!startDate)                   { setError("تاريخ البداية مطلوب");          return scrollTop(); }
    if (!endDate)                     { setError("تاريخ النهاية مطلوب");          return scrollTop(); }
    if (new Date(endDate) <= new Date(startDate)) { setError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية"); return scrollTop(); }

    setError(""); setFieldErrors({}); setLoading(true);
    try {
      await adRequestsApi.create({
        templateId:         Number(templateId),
        shopId:             Number(shopId),
        title:              title.trim(),
        startDate,
        endDate,
        adRequestImageUuid: adRequestImageUuid.trim() || null,
        totalPrice:         totalPrice > 0 ? totalPrice : undefined,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      if (e.errorCodes?.length) {
        const mapped = {};
        e.errorCodes.forEach(({ field, message }) => { mapped[field] = message; });
        setFieldErrors(mapped);
        scrollTop();
      } else {
        setError(e.message || "حدث خطأ، حاول مجدداً");
        scrollTop();
      }
    } finally { setLoading(false); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[92vw] max-w-[560px] max-h-[92vh] rounded-2xl flex flex-col outline-none"
          style={surface} aria-describedby={undefined}>

          <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <div>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                إضافة طلب إعلان جديد
              </Dialog.Title>
              <p className="text-xs mt-0.5" style={{ color: "var(--gray-11)" }}>أدخل بيانات طلب الإعلان</p>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--gray-11)", background: "transparent", border: "none" }}>
                <FiX size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div ref={bodyRef} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.3)", color: "var(--red-9)" }}>
                <FiAlertCircle size={15} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>معرّف النموذج الإعلاني *</label>
                <input className={inputCls} style={{ ...inp, direction: "ltr", textAlign: "left" }}
                  type="number" value={templateId}
                  onChange={(e) => { setTemplateId(e.target.value); clearErr("templateId"); }}
                  placeholder="مثال: 1" />
                <FieldError msg={fieldErrors.templateId} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>معرّف المتجر *</label>
                <input className={inputCls} style={{ ...inp, direction: "ltr", textAlign: "left" }}
                  type="number" value={shopId}
                  onChange={(e) => { setShopId(e.target.value); clearErr("shopId"); }}
                  placeholder="مثال: 1" />
                <FieldError msg={fieldErrors.shopId} />
              </div>
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>عنوان الإعلان *</label>
              <input className={inputCls} style={inp} value={title}
                onChange={(e) => { setTitle(e.target.value); clearErr("title"); }}
                placeholder="مثال: عرض الصيف - متجر الأناقة" />
              <FieldError msg={fieldErrors.title} />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>تاريخ البداية *</label>
                <CustomDateInput value={startDate} onChange={(v) => { setStartDate(v); clearErr("startDate"); }} placeholder="اختر تاريخ البداية" />
                <FieldError msg={fieldErrors.startDate} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>تاريخ النهاية *</label>
                <CustomDateInput value={endDate} onChange={(v) => { setEndDate(v); clearErr("endDate"); }} placeholder="اختر تاريخ النهاية" />
                <FieldError msg={fieldErrors.endDate} />
              </div>
            </div>

            {/* Price per hour for total calculation */}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>سعر الساعة (₪)</label>
              <input className={inputCls} style={inp} type="number" min="0" step="0.01" value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                placeholder="أدخل سعر الساعة لحساب الإجمالي" />
            </div>

            {/* Price preview */}
            {showPrice && (
              <div className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "var(--green-a2)", border: "1px solid var(--green-a4)" }}>
                <div className="text-xs" style={{ color: "var(--green-10)" }}>
                  {pricePerHour} ₪/ساعة × {hours % 1 === 0 ? hours : hours.toFixed(1)} ساعة
                </div>
                <div className="font-bold text-base" style={{ color: "var(--green-11)" }}>
                  {totalPrice % 1 === 0 ? totalPrice : totalPrice.toFixed(2)} ₪
                </div>
              </div>
            )}

            {/* Image UUID */}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>UUID صورة الإعلان</label>
              <input className={inputCls} style={{ ...inp, direction: "ltr", textAlign: "left" }}
                value={adRequestImageUuid}
                onChange={(e) => { setAdRequestImageUuid(e.target.value); clearErr("adRequestImageUuid"); }}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              <FieldError msg={fieldErrors.adRequestImageUuid} />
            </div>
          </div>

          <div className="px-6 py-4 flex items-center justify-start gap-3 border-t flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#2563eb", color: "#fff" }}>
              {loading ? <Spinner /> : null} إرسال الطلب
            </button>
            <Dialog.Close asChild>
              <button className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}>
                إلغاء
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Reject Dialog ─────────────────────────────────────────────────────────────
export function RejectDialog({ open, onOpenChange, request, onSuccess }) {
  const themeContainer = useThemeContainer();
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!open) { setReason(""); setError(""); }
  }, [open]);

  const handleReject = async () => {
    if (!reason.trim()) { setError("سبب الرفض مطلوب"); return; }
    setError(""); setLoading(true);
    try {
      await adRequestsApi.reject(request.adRequestId, reason.trim());
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError(e.message || "حدث خطأ، حاول مجدداً");
    } finally { setLoading(false); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-[10001] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[90vw] max-w-[460px] rounded-2xl flex flex-col outline-none"
          style={surface} aria-describedby={undefined}>

          <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <Dialog.Title className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
              رفض الطلب
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--gray-11)", background: "transparent", border: "none" }}>
                <FiX size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-5 py-4 space-y-3">
            {request && (
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                رفض طلب: <span style={{ color: "var(--gray-12)" }} className="font-semibold">{request.title}</span>
              </p>
            )}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.3)", color: "var(--red-9)" }}>
                <FiAlertCircle size={12} /> {error}
              </div>
            )}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>سبب الرفض *</label>
              <textarea className={inputCls} style={{ ...inp, minHeight: 80, resize: "none" }}
                value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="مثال: جودة الصورة منخفضة جداً" />
            </div>
          </div>

          <div className="px-5 py-3 flex items-center justify-start gap-2 border-t flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <button onClick={handleReject} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#dc2626", color: "#fff" }}>
              {loading ? <Spinner /> : null} رفض الطلب
            </button>
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-80"
                style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}>
                إلغاء
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
