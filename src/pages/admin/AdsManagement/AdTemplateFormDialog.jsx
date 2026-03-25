import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAlertCircle } from "react-icons/fi";
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

export default function AdTemplateFormDialog({ open, onOpenChange, template = null, onSuccess }) {
  const themeContainer = useThemeContainer();
  const isEdit = !!template;
  const bodyRef = useRef(null);

  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
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
      setStatus("ACTIVE"); setError("");
    }
  }, [open, isEdit, template]);

  const scrollTop = () => { if (bodyRef.current) bodyRef.current.scrollTop = 0; };

  const handleSubmit = async () => {
    if (!name.trim())   { setError("اسم الـ template مطلوب"); return scrollTop(); }
    if (!price)         { setError("السعر مطلوب");             return scrollTop(); }
    if (!startDate)     { setError("تاريخ البداية مطلوب");    return scrollTop(); }
    if (!endDate)       { setError("تاريخ النهاية مطلوب");    return scrollTop(); }
    if (!imageRatio)    { setError("نسبة الصورة مطلوبة");     return scrollTop(); }
    if (!position)      { setError("الموضع مطلوب");           return scrollTop(); }

    setError(""); setLoading(true);
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
      setError(e.message || "حدث خطأ، حاول مجدداً");
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
                {isEdit ? "تعديل الـ Template" : "إضافة Ad Template جديد"}
              </Dialog.Title>
              <p className="text-xs mt-0.5" style={{ color: "var(--gray-11)" }}>
                {isEdit ? "عدّل بيانات الـ template" : "أدخل بيانات الـ template الجديد"}
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
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>اسم الـ Template *</label>
              <input className={inputCls} style={inp} value={name}
                onChange={(e) => setName(e.target.value)} placeholder="مثال: Home Top Banner Q1 2027" />
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
                  value={position} onChange={(e) => setPosition(e.target.value)}>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p} style={{ background: "var(--gray-1)", color: "var(--gray-12)" }}>
                      {POSITION_LABELS[p] || p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>نسبة الصورة *</label>
                <select className={inputCls} style={{ ...inp, appearance: "auto" }}
                  value={imageRatio} onChange={(e) => setImageRatio(e.target.value)}>
                  {IMAGE_RATIOS.map((r) => (
                    <option key={r} value={r} style={{ background: "var(--gray-1)", color: "var(--gray-12)" }}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>السعر (₪) *</label>
              <input className={inputCls} style={inp} type="number" min="0" value={price}
                onChange={(e) => setPrice(e.target.value)} placeholder="مثال: 500" />
            </div>

            {/* Start + End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>تاريخ البداية *</label>
                <input className={inputCls} style={{ ...inp, direction: "ltr", textAlign: "left" }}
                  type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>تاريخ النهاية *</label>
                <input className={inputCls} style={{ ...inp, direction: "ltr", textAlign: "left" }}
                  type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
          <div className="px-6 py-4 flex items-center justify-end gap-3 border-t flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <Dialog.Close asChild>
              <button className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}>
                إلغاء
              </button>
            </Dialog.Close>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#2563eb", color: "#fff" }}>
              {loading ? <Spinner /> : null}
              {isEdit ? "حفظ التعديلات" : "إنشاء Template"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}