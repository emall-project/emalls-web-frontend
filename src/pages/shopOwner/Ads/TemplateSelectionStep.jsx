import { FiCheckCircle, FiImage, FiLayers, FiMapPin } from "react-icons/fi";
import { formatUsd } from "./adsUtils";

export default function TemplateSelectionStep({ templates, selectedTemplateId, onSelect, loading = false }) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-3xl border"
            style={{ background: "var(--gray-a3)", borderColor: "var(--gray-a5)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>اختر القالب الإعلاني</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
          اختر قالبًا متاحًا يناسب مكان ظهور الإعلان ونسبة الصورة المطلوبة.
        </p>
      </div>

      {templates.length === 0 ? (
        <div
          className="rounded-3xl border border-dashed px-5 py-12 text-center text-sm font-semibold"
          style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-9)" }}
        >
          لا توجد قوالب إعلانية نشطة متاحة الآن.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => {
          const active = String(selectedTemplateId) === String(template.adTemplateId);

          return (
            <button
              key={template.adTemplateId}
              type="button"
              onClick={() => onSelect?.(template)}
              className="rounded-3xl border p-5 text-right shadow-sm transition hover:-translate-y-0.5 outline-none"
              style={{
                background:  "var(--gray-1)",
                borderColor: active ? "var(--blue-7)" : "var(--gray-a5)",
                boxShadow:   active ? "0 0 0 3px var(--blue-a4)" : undefined,
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = "var(--blue-a7)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = "var(--gray-a5)"; }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="rounded-2xl p-3"
                  style={{ background: "var(--blue-a3)", color: "var(--blue-9)" }}
                >
                  <FiLayers size={18} />
                </div>
                {active ? <FiCheckCircle style={{ color: "var(--blue-9)" }} size={18} /> : null}
              </div>

              <h4 className="mt-4 text-base font-bold" style={{ color: "var(--gray-12)" }}>
                {template.name}
              </h4>
              <p className="mt-2 line-clamp-2 text-sm leading-7" style={{ color: "var(--gray-9)" }}>
                {template.description || "بدون وصف إضافي"}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Meta icon={<FiMapPin size={13} />} label="مكان الظهور" value={template.position} />
                <Meta icon={<FiImage size={13} />}  label="نسبة الصورة" value={template.imageRatio} />
              </div>

              <div
                className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ background: "var(--gray-a2)" }}
              >
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>السعر لكل ساعة</p>
                  <p className="mt-1 text-base font-black" style={{ color: "var(--gray-12)" }}>
                    {formatUsd(template.pricePerHour)}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>طلبات نشطة</p>
                  <p className="mt-1 text-base font-bold" style={{ color: "var(--blue-9)" }}>
                    {template.activeRequestCount ?? 0}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Meta({ icon, label, value }) {
  return (
    <div className="rounded-2xl border px-3 py-3" style={{ borderColor: "var(--gray-a5)" }}>
      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--gray-9)" }}>
        <span style={{ color: "var(--gray-8)" }}>{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-bold" style={{ color: "var(--gray-12)" }}>{value || "—"}</p>
    </div>
  );
}
