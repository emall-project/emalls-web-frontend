import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { FiLoader, FiSlash, FiX } from "react-icons/fi";

import { adsApi } from "./api";
import { extractApiError, useThemeContainer } from "./adsUtils";

export default function CancelAdRequestDialog({ open, onOpenChange, request, onCancelled }) {
  const container = useThemeContainer();
  if (!request) return null;

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal container={container}>
        <AlertDialog.Overlay className="fixed inset-0 z-[82] bg-slate-950/40 backdrop-blur-sm" />
        <Content request={request} onOpenChange={onOpenChange} onCancelled={onCancelled} />
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function Content({ request, onOpenChange, onCancelled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCancel = async () => {
    setLoading(true);
    setError("");
    try {
      await adsApi.cancelAdRequest(request.adRequestId, request.shopId);
      onCancelled?.(request);
      onOpenChange?.(false);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog.Content
      dir="rtl"
      className="fixed left-1/2 top-1/2 z-[83] w-[min(520px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 rounded-[30px] border p-6 shadow-[0_24px_60px_rgba(2,6,23,0.28)]"
      style={{ borderColor: "var(--gray-a5)", background: "var(--gray-2)" }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--red-a3)", color: "var(--red-11)" }}>
        <FiSlash size={24} />
      </div>
      <AlertDialog.Title className="mt-5 text-xl font-black" style={{ color: "var(--gray-12)" }}>إلغاء طلب الإعلان</AlertDialog.Title>
      <AlertDialog.Description className="mt-3 text-sm leading-7" style={{ color: "var(--gray-9)" }}>
        هل أنت متأكد من إلغاء الطلب <span className="font-bold" style={{ color: "var(--gray-12)" }}>#{request.adRequestId}</span>؟ سيظهر في النظام بحالة مرفوض مع سبب
        <span className="font-bold" style={{ color: "var(--gray-12)" }}> تم إلغاء الطلب من قبل المتجر</span>.
      </AlertDialog.Description>

      {error ? (
        <div className="mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--red-a5)", background: "var(--red-a2)", color: "var(--red-11)" }}>{error}</div>
      ) : null}

      <div className="mt-6 flex gap-3">
        <AlertDialog.Cancel asChild>
          <button className="flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition" style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)", color: "var(--gray-11)" }}>
            <FiX className="ml-2 inline" size={14} />
            تراجع
          </button>
        </AlertDialog.Cancel>

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <FiLoader className="ml-2 inline animate-spin" size={14} /> : <FiSlash className="ml-2 inline" size={14} />}
          تأكيد الإلغاء
        </button>
      </div>
    </AlertDialog.Content>
  );
}
