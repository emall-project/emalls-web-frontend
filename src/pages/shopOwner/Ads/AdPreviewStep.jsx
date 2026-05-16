import { getAdPositionLabel } from "../../../data/adSlots";
import { calculateBillableHours, calculateEstimatedTotal, formatDateTime, formatUsd, getFileUrl } from "./adsUtils";

export default function AdPreviewStep({ template, draft, fileMeta, shopName }) {
  const imageUrl       = getFileUrl(fileMeta);
  const hours          = calculateBillableHours(draft.startDate, draft.endDate);
  const estimatedTotal = calculateEstimatedTotal(template?.pricePerHour, draft.startDate, draft.endDate);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>المعاينة والإرسال</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--gray-9)" }}>
          راجع بيانات الإعلان قبل إرسال الطلب إلى الإدارة.
        </p>
      </div>

      <div
        className="overflow-hidden rounded-[28px] border shadow-sm"
        style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
      >
        <div className="aspect-video" style={{ background: "var(--gray-a2)" }}>
          {imageUrl ? <img src={imageUrl} alt={draft.title} className="h-full w-full object-cover" /> : null}
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>عنوان الإعلان</p>
              <h4 className="mt-1 text-xl font-black" style={{ color: "var(--gray-12)" }}>
                {draft.title || "—"}
              </h4>
            </div>
            <div
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--amber-a3)", color: "var(--amber-11)" }}
            >
              قيد المراجعة
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PreviewItem label="القالب"          value={template?.name || "—"} />
            <PreviewItem label="مكان الظهور"     value={getAdPositionLabel(template?.position)} />
            <PreviewItem label="نسبة الصورة"     value={template?.imageRatio || "—"} />
            <PreviewItem label="المتجر"           value={shopName || "المتجر الحالي"} />
            <PreviewItem label="تاريخ البداية"   value={formatDateTime(draft.startDate)} />
            <PreviewItem label="تاريخ النهاية"   value={formatDateTime(draft.endDate)} />
            <PreviewItem label="المدة التقديرية" value={hours ? `${hours} ساعة` : "—"} />
            <PreviewItem label="الدفع المتوقع"   value={estimatedTotal ? formatUsd(estimatedTotal) : "—"} accent />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span
              className="rounded-full px-3 py-1"
              style={{ background: "var(--gray-a3)", color: "var(--gray-10)" }}
            >
              حالة الدفع: غير مدفوع
            </span>
            <span
              className="rounded-full px-3 py-1"
              style={{ background: "var(--gray-a3)", color: "var(--gray-10)" }}
            >
              السعر النهائي يؤكد من الخادم
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewItem({ label, value, accent = false }) {
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
    >
      <p className="text-xs font-semibold" style={{ color: "var(--gray-9)" }}>{label}</p>
      <p className="mt-2 text-sm font-bold" style={{ color: accent ? "var(--blue-9)" : "var(--gray-12)" }}>
        {value}
      </p>
    </div>
  );
}
