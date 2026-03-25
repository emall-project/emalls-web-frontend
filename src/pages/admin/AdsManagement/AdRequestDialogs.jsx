import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAlertCircle } from "react-icons/fi";
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

// ── Create Ad Request Dialog ───────────────────────────────────────────────────
export function AdRequestFormDialog({ open, onOpenChange, onSuccess }) {
  const themeContainer = useThemeContainer();
  const bodyRef = useRef(null);

  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [templateId, setTemplateId] = useState("");
  const [shopId,     setShopId]     = useState("");
  const [title,      setTitle]      = useState("");
  const [imageUrl,   setImageUrl]   = useState("");

  useEffect(() => {
    if (!open) { setTemplateId(""); setShopId(""); setTitle(""); setImageUrl(""); setError(""); }
  }, [open]);

  const scrollTop = () => { if (bodyRef.current) bodyRef.current.scrollTop = 0; };

  const handleSubmit = async () => {
    if (!templateId) { setError("Template ID مطلوب"); return scrollTop(); }
    if (!shopId)     { setError("Shop ID مطلوب");     return scrollTop(); }
    if (!title.trim()) { setError("العنوان مطلوب");   return scrollTop(); }

    setError(""); setLoading(true);
    try {
      await adRequestsApi.create({
        templateId: Number(templateId),
        shopId:     Number(shopId),
        title:      title.trim(),
        imageUrl:   imageUrl.trim() || null,
      });
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
                     w-[92vw] max-w-[520px] rounded-2xl flex flex-col outline-none"
          style={surface} aria-describedby={undefined}>

          <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
              إضافة Ad Request جديد
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--gray-11)", background: "transparent", border: "none" }}>
                <FiX size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div ref={bodyRef} className="px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.3)", color: "var(--red-9)" }}>
                <FiAlertCircle size={15} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>Template ID *</label>
                <input className={inputCls} style={{ ...inp, direction: "ltr", textAlign: "left" }}
                  type="number" value={templateId} onChange={(e) => setTemplateId(e.target.value)}
                  placeholder="مثال: 1" />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>Shop ID *</label>
                <input className={inputCls} style={{ ...inp, direction: "ltr", textAlign: "left" }}
                  type="number" value={shopId} onChange={(e) => setShopId(e.target.value)}
                  placeholder="مثال: 1" />
              </div>
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>عنوان الإعلان *</label>
              <input className={inputCls} style={inp} value={title}
                onChange={(e) => setTitle(e.target.value)} placeholder="مثال: Shop 1 — Summer Sale" />
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>رابط الصورة (URL)</label>
              <input className={inputCls} style={{ ...inp, direction: "ltr", textAlign: "left" }}
                value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://cdn.example.com/banner.jpg" />
            </div>
          </div>

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
              {loading ? <Spinner /> : null} إرسال الطلب
            </button>
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
                placeholder="مثال: Image quality too low" />
            </div>
          </div>

          <div className="px-5 py-3 flex items-center justify-end gap-2 border-t flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-80"
                style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}>
                إلغاء
              </button>
            </Dialog.Close>
            <button onClick={handleReject} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#dc2626", color: "#fff" }}>
              {loading ? <Spinner /> : null} رفض الطلب
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}