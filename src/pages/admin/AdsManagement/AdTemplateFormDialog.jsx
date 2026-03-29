import React, { useState, useEffect, useRef } from "react";
import * as Dialog  from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { FiX, FiAlertCircle, FiCalendar, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { adTemplatesApi } from "./api";
import { TEMPLATE_STATUSES, TEMPLATE_STATUS_LABELS, POSITIONS, POSITION_LABELS, IMAGE_RATIOS } from "./constants";

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

// ── Arabic DatePicker ──────────────────────────────────────────────────────────
const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const ARABIC_DAYS   = ["أح","إث","ثل","أر","خم","جم","سب"];

function DatePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const themeContainer  = useThemeContainer();
  const today   = new Date();
  const parsed  = value ? new Date(value + "T00:00:00") : null;

  const [viewYear,  setViewYear]  = useState(parsed?.getFullYear()  ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth()     ?? today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const cells       = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const prevMonth = () => viewMonth === 0  ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const selectDay = (day) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const isSelected = (day) => parsed && day &&
    parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;
  const isToday = (day) => day &&
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const displayValue = parsed
    ? `${String(parsed.getDate()).padStart(2,"0")} / ${String(parsed.getMonth()+1).padStart(2,"0")} / ${parsed.getFullYear()}`
    : "اختر تاريخاً";

  return (
    <div className="space-y-1.5">
      <label className={labelCls} style={{ color: "var(--gray-11)" }}>{label}</label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button type="button" className={inputCls}
            style={{ ...inp, direction: "rtl", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <FiCalendar size={14} style={{ color: "var(--gray-9)", flexShrink: 0 }} />
            <span style={{ flex: 1, color: parsed ? "var(--gray-12)" : "var(--gray-9)" }}>{displayValue}</span>
          </button>
        </Popover.Trigger>
        <Popover.Portal container={themeContainer}>
          <Popover.Content dir="rtl" sideOffset={6} align="start"
            style={{
              background: "var(--gray-1)", border: "1px solid var(--gray-a6)",
              borderRadius: 16, padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,.35)",
              zIndex: 10000, width: 280,
            }}>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <button type="button" onClick={nextMonth}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-11)", borderRadius: 8, padding: "4px 6px" }}>
                <FiChevronRight size={16} />
              </button>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--gray-12)" }}>
                {ARABIC_MONTHS[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={prevMonth}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-11)", borderRadius: 8, padding: "4px 6px" }}>
                <FiChevronLeft size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
              {ARABIC_DAYS.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--gray-9)" }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {cells.map((day, i) => (
                <button key={i} type="button" disabled={!day} onClick={() => day && selectDay(day)}
                  style={{
                    background: isSelected(day) ? "#2563eb" : isToday(day) ? "var(--blue-a3)" : "transparent",
                    color:      isSelected(day) ? "#fff"    : isToday(day) ? "var(--blue-11)" : "var(--gray-12)",
                    border: "none", borderRadius: 8, padding: "6px 0",
                    fontSize: 13, cursor: day ? "pointer" : "default",
                    fontWeight: isSelected(day) ? 700 : 400,
                    opacity: day ? 1 : 0,
                  }}>
                  {day}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

export default function AdTemplateFormDialog({ open, onOpenChange, template = null, onSuccess }) {
  const themeContainer = useThemeContainer();
  const isEdit = !!template;
  const bodyRef = useRef(null);

  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [position,    setPosition]    = useState("HOME_TOP");
  const [imageRatio,  setImageRatio]  = useState("16:9");
  const [price,       setPrice]       = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [status,      setStatus]      = useState("ACTIVE");

  useEffect(() => {
    if (!open) return;
    if (isEdit && template) {
      setName(template.name || "");
      setDescription(template.description || "");
      setPosition(template.position || "HOME_TOP");
      setImageRatio(template.imageRatio || "16:9");
      setPrice(template.price ?? "");
      setStartDate(template.startDate || "");
      setEndDate(template.endDate || "");
      setStatus(template.status || "ACTIVE");
    } else {
      setName(""); setDescription(""); setPosition("HOME_TOP");
      setImageRatio("16:9"); setPrice(""); setStartDate(""); setEndDate("");
      setStatus("ACTIVE"); setError(""); setFieldErrors({});
    }
  }, [open, isEdit, template]);

  const scrollTop = () => { if (bodyRef.current) bodyRef.current.scrollTop = 0; };
  const clearErr  = (f) => setFieldErrors((p) => ({ ...p, [f]: "" }));

  const handleSubmit = async () => {
    if (!name.trim())   { setError("اسم النموذج مطلوب"); return scrollTop(); }
    if (!price)         { setError("السعر مطلوب");             return scrollTop(); }
    if (!startDate)     { setError("تاريخ البداية مطلوب");    return scrollTop(); }
    if (!endDate)       { setError("تاريخ النهاية مطلوب");    return scrollTop(); }
    if (!imageRatio)    { setError("نسبة الصورة مطلوبة");     return scrollTop(); }
    if (!position)      { setError("الموضع مطلوب");           return scrollTop(); }

    setError(""); setFieldErrors({}); setLoading(true);
    try {
      const body = {
        name: name.trim(), description: description.trim() || null,
        position, imageRatio, price: Number(price),
        startDate, endDate,
        ...(isEdit ? {} : { status }),
      };
      if (isEdit) {
        await adTemplatesApi.update({ adTemplateId: template.adTemplateId, ...body });
      } else {
        await adTemplatesApi.create(body);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      if (e.errorCodes?.length) {
        const mapped = {};
        e.errorCodes.forEach(({ field, message }) => { mapped[field] = message; });
        setFieldErrors(mapped);
      } else {
        setError(e.message || "حدث خطأ، حاول مجدداً");
      }
      scrollTop();
    } finally { setLoading(false); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[92vw] max-w-[580px] max-h-[92vh] rounded-2xl flex flex-col outline-none"
          style={surface} aria-describedby={undefined}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <div>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                {isEdit ? "تعديل النموذج الإعلاني" : "إضافة نموذج إعلاني جديد"}
              </Dialog.Title>
              <p className="text-xs mt-0.5" style={{ color: "var(--gray-11)" }}>
                {isEdit ? "عدّل بيانات النموذج الإعلاني" : "أدخل بيانات النموذج الجديد"}
              </p>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--gray-11)", background: "transparent", border: "none" }}>
                <FiX size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div ref={bodyRef} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.3)", color: "var(--red-9)" }}>
                <FiAlertCircle size={15} /> {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>اسم النموذج *</label>
              <input className={inputCls} style={inp} value={name}
                onChange={(e) => { setName(e.target.value); clearErr("name"); }}
                placeholder="مثال: بانر أعلى الصفحة - الربع الأول 2027" />
              <FieldError msg={fieldErrors.name} />
            </div>

            {/* Description */}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>الوصف</label>
              <textarea className={inputCls} style={{ ...inp, minHeight: 72, resize: "none" }}
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر..." />
            </div>

            {/* Position + Image Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الموضع *</label>
                <select className={inputCls} style={{ ...inp, appearance: "auto" }}
                  value={position} onChange={(e) => { setPosition(e.target.value); clearErr("position"); }}>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p} style={{ background: "var(--gray-1)", color: "var(--gray-12)" }}>
                      {POSITION_LABELS[p] || p}
                    </option>
                  ))}
                </select>
              <FieldError msg={fieldErrors.position} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>نسبة الصورة *</label>
                <select className={inputCls} style={{ ...inp, appearance: "auto" }}
                  value={imageRatio} onChange={(e) => { setImageRatio(e.target.value); clearErr("imageRatio"); }}>
                  {IMAGE_RATIOS.map((r) => (
                    <option key={r} value={r} style={{ background: "var(--gray-1)", color: "var(--gray-12)" }}>
                      {r}
                    </option>
                  ))}
                </select>
                <FieldError msg={fieldErrors.imageRatio} />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>السعر (₪) *</label>
              <input className={inputCls} style={inp} type="number" min="0" value={price}
                onChange={(e) => { setPrice(e.target.value); clearErr("price"); }} placeholder="مثال: 500" />
              <FieldError msg={fieldErrors.price} />
            </div>

            {/* Start + End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <DatePicker label="تاريخ البداية *" value={startDate} onChange={(v) => { setStartDate(v); clearErr("startDate"); }} />
                <FieldError msg={fieldErrors.startDate} />
              </div>
              <div>
                <DatePicker label="تاريخ النهاية *" value={endDate} onChange={(v) => { setEndDate(v); clearErr("endDate"); }} />
                <FieldError msg={fieldErrors.endDate} />
              </div>
            </div>

            {/* Status (create only) */}
            {!isEdit && (
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الحالة</label>
                <select className={inputCls} style={{ ...inp, appearance: "auto" }}
                  value={status} onChange={(e) => setStatus(e.target.value)}>
                  {TEMPLATE_STATUSES.map((s) => (
                    <option key={s} value={s} style={{ background: "var(--gray-1)", color: "var(--gray-12)" }}>
                      {TEMPLATE_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-start gap-3 border-t flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#2563eb", color: "#fff" }}>
              {loading ? <Spinner /> : null}
              {isEdit ? "حفظ التعديلات" : "إنشاء النموذج"}
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