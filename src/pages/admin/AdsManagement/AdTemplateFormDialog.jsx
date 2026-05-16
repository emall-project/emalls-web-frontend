import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAlertCircle } from "react-icons/fi";
import { adTemplatesApi } from "./api";
import {
  TEMPLATE_STATUSES,
  TEMPLATE_STATUS_LABELS,
  POSITIONS,
  POSITION_LABELS,
  IMAGE_RATIOS,
} from "./constants";

function useThemeContainer() {
  const [c, setC] = useState(null);
  useEffect(() => {
    setC(document.querySelector(".radix-themes") || document.body);
  }, []);
  return c;
}

function Spinner({ size = 14 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const surface = {
  background: "var(--gray-1)",
  border: "1px solid var(--gray-a6)",
  boxShadow: "0 20px 60px rgba(0,0,0,.4)",
};

const inp = {
  background: "var(--gray-a2)",
  borderColor: "var(--gray-a6)",
  color: "var(--gray-12)",
  direction: "rtl",
  textAlign: "right",
};

const inputCls =
  "w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
const labelCls = "block text-xs font-semibold mb-1.5";

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-xs mt-1" style={{ color: "var(--red-9)" }}>
      {msg}
    </p>
  );
}

export default function AdTemplateFormDialog({ open, onOpenChange, template = null, onSuccess }) {
  const themeContainer = useThemeContainer();
  const isEdit = !!template;
  const bodyRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState("");
  const [imageRatio, setImageRatio] = useState("16:9");
  const [pricePerHour, setPricePerHour] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  useEffect(() => {
    if (!open) return;

    setError("");
    setFieldErrors({});

    if (isEdit && template) {
      setName(template.name || "");
      setDescription(template.description || "");
      setPosition(template.position || "");
      setImageRatio(template.imageRatio || "16:9");
      setPricePerHour(template.pricePerHour ?? "");
      setStatus(template.status || "ACTIVE");
      return;
    }

    setName("");
    setDescription("");
    setPosition("");
    setImageRatio("16:9");
    setPricePerHour("");
    setStatus("ACTIVE");
  }, [open, isEdit, template]);

  const scrollTop = () => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  };

  const clearErr = (field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedPosition = position.trim();

    if (!trimmedName) {
      setError("اسم النموذج مطلوب");
      return scrollTop();
    }

    if (!pricePerHour) {
      setError("سعر الساعة مطلوب");
      return scrollTop();
    }

    if (!imageRatio) {
      setError("نسبة الصورة مطلوبة");
      return scrollTop();
    }

    if (!trimmedPosition) {
      setError("الموضع مطلوب");
      return scrollTop();
    }

    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const body = {
        name: trimmedName,
        description: description.trim() || null,
        position: trimmedPosition,
        imageRatio,
        pricePerHour: Number(pricePerHour),
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
        e.errorCodes.forEach(({ field, message }) => {
          mapped[field] = message;
        });
        setFieldErrors(mapped);
      } else {
        setError(e.message || "حدث خطأ، حاول مجددًا");
      }
      scrollTop();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[92vw] max-w-[580px] max-h-[92vh] rounded-2xl flex flex-col outline-none"
          style={surface}
          aria-describedby={undefined}
        >
          <div
            className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}
          >
            <div>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                {isEdit ? "تعديل النموذج الإعلاني" : "إضافة نموذج إعلاني جديد"}
              </Dialog.Title>
              <p className="text-xs mt-0.5" style={{ color: "var(--gray-11)" }}>
                {isEdit ? "عدّل بيانات النموذج الإعلاني" : "أدخل بيانات النموذج الجديد"}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--gray-11)", background: "transparent", border: "none" }}
              >
                <FiX size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div ref={bodyRef} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(220,38,38,.1)",
                  border: "1px solid rgba(220,38,38,.3)",
                  color: "var(--red-9)",
                }}
              >
                <FiAlertCircle size={15} /> {error}
              </div>
            )}

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                اسم النموذج *
              </label>
              <input
                className={inputCls}
                style={inp}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearErr("name");
                }}
                placeholder="مثال: بانر أعلى الصفحة - الربع الأول 2027"
              />
              <FieldError msg={fieldErrors.name} />
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                الوصف
              </label>
              <textarea
                className={inputCls}
                style={{ ...inp, minHeight: 72, resize: "none" }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                  الموضع *
                </label>
                <input
                  list="ad-template-position-options"
                  className={inputCls}
                  style={{ ...inp, direction: "ltr", textAlign: "left" }}
                  value={position}
                  onChange={(e) => {
                    setPosition(e.target.value);
                    clearErr("position");
                  }}
                  placeholder="HOME_TOP"
                />
                <datalist id="ad-template-position-options">
                  {POSITIONS.map((item) => (
                    <option key={item} value={item}>
                      {POSITION_LABELS[item] || item}
                    </option>
                  ))}
                </datalist>
                <p className="text-[11px] mt-1" style={{ color: "var(--gray-10)" }}>
                  يمكنك كتابة قيمة الموضع مباشرة، أو اختيار أحد الاقتراحات الشائعة.
                </p>
                <FieldError msg={fieldErrors.position} />
              </div>

              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                  نسبة الصورة *
                </label>
                <select
                  className={inputCls}
                  style={{ ...inp, appearance: "auto" }}
                  value={imageRatio}
                  onChange={(e) => {
                    setImageRatio(e.target.value);
                    clearErr("imageRatio");
                  }}
                >
                  {IMAGE_RATIOS.map((ratio) => (
                    <option
                      key={ratio}
                      value={ratio}
                      style={{ background: "var(--gray-1)", color: "var(--gray-12)" }}
                    >
                      {ratio}
                    </option>
                  ))}
                </select>
                <FieldError msg={fieldErrors.imageRatio} />
              </div>
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                سعر الساعة (₪) *
              </label>
              <input
                className={inputCls}
                style={inp}
                type="number"
                min="0"
                step="0.01"
                value={pricePerHour}
                onChange={(e) => {
                  setPricePerHour(e.target.value);
                  clearErr("pricePerHour");
                }}
                placeholder="مثال: 500"
              />
              <FieldError msg={fieldErrors.pricePerHour} />
            </div>

            {!isEdit && (
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                  الحالة
                </label>
                <select
                  className={inputCls}
                  style={{ ...inp, appearance: "auto" }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {TEMPLATE_STATUSES.map((item) => (
                    <option
                      key={item}
                      value={item}
                      style={{ background: "var(--gray-1)", color: "var(--gray-12)" }}
                    >
                      {TEMPLATE_STATUS_LABELS[item]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div
            className="px-6 py-4 flex items-center justify-start gap-3 border-t flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}
          >
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#2563eb", color: "#fff" }}
            >
              {loading ? <Spinner /> : null}
              {isEdit ? "حفظ التعديلات" : "إنشاء النموذج"}
            </button>
            <Dialog.Close asChild>
              <button
                className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{
                  background: "transparent",
                  border: "1px solid var(--gray-a7)",
                  color: "var(--gray-12)",
                }}
              >
                إلغاء
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
