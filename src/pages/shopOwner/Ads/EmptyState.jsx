import { FiArrowLeft, FiBell } from "react-icons/fi";

export default function EmptyState({ onCreateClick }) {
  return (
    <div
      className="rounded-[28px] border border-dashed px-6 py-16 text-center shadow-sm"
      style={{
        borderColor: "var(--gray-a5)",
        background: "var(--gray-1)",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "var(--blue-a3)", color: "var(--blue-9)" }}
      >
        <FiBell size={28} />
      </div>
      <h3 className="mt-5 text-lg font-bold" style={{ color: "var(--gray-12)" }}>
        لا توجد إعلانات بعد
      </h3>
      <p className="mt-2 text-sm leading-7" style={{ color: "var(--gray-9)" }}>
        أنشئ أول إعلان لمتجرك وابدأ متابعة حالته والدفع والعرض من مكان واحد.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="mx-auto mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        إنشاء أول إعلان
        <FiArrowLeft size={16} />
      </button>
    </div>
  );
}
