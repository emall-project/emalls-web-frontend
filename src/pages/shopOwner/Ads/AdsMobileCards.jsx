import { FiClock } from "react-icons/fi";

import AdStatusBadge from "./AdStatusBadge";
import AdActionsMenu from "./AdActionsMenu";
import PaymentStatusBadge from "./PaymentStatusBadge";
import {
  calculateBillableHours,
  formatDateTime,
  formatUsd,
  getAdImageUrl,
  getDisplayStatusLabel,
} from "./adsUtils";

export default function AdsMobileCards({
  requests,
  onView,
  onEdit,
  onCancel,
  onPay,
  onHistory,
  onCopyId,
}) {
  return (
    <div className="grid gap-4 xl:hidden">
      {requests.map((request) => {
        const imageUrl = getAdImageUrl(request);
        const hours = calculateBillableHours(request.startDate, request.endDate);

        return (
          <article
            key={request.adRequestId}
            className="rounded-[28px] border p-4 shadow-sm"
            style={{
              background: "var(--gray-1)",
              borderColor: "var(--gray-a5)",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border"
                  style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt={request.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold" style={{ color: "var(--gray-8)" }}>
                      بدون صورة
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold leading-7" style={{ color: "var(--gray-12)" }}>
                    {request.title}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                    #{request.adRequestId}
                  </p>
                  <p className="mt-2 text-xs font-medium" style={{ color: "var(--gray-10)" }}>
                    {request.template?.name || "—"}
                  </p>
                </div>
              </div>

              <AdActionsMenu
                request={request}
                onView={onView}
                onEdit={onEdit}
                onCancel={onCancel}
                onPay={onPay}
                onHistory={onHistory}
                onCopy={onCopyId}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="مكان الظهور" value={request.template?.position || "—"} />
              <Stat label="الإجمالي" value={formatUsd(request.totalPrice)} />
              <Stat label="الحالة" value={<AdStatusBadge status={request.status} />} />
              <Stat label="الدفع" value={<PaymentStatusBadge status={request.paymentStatus} />} />
            </div>

            <div
              className="mt-4 rounded-2xl px-4 py-3 text-xs"
              style={{ background: "var(--gray-a2)", color: "var(--gray-10)" }}
            >
              <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--gray-11)" }}>
                <FiClock size={13} />
                <span>{hours ? `${hours} ساعة` : "—"}</span>
              </div>
              <p className="mt-2">{formatDateTime(request.startDate)}</p>
              <p className="mt-1">{formatDateTime(request.endDate)}</p>
              <p
                className="mt-2 inline-flex rounded-full px-2.5 py-1 font-semibold"
                style={{ background: "var(--gray-1)", color: "var(--gray-11)" }}
              >
                {getDisplayStatusLabel(request.isDisplayed)}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      className="rounded-2xl border px-3 py-3"
      style={{ borderColor: "var(--gray-a5)", background: "var(--gray-2)" }}
    >
      <p className="text-[11px] font-semibold" style={{ color: "var(--gray-9)" }}>
        {label}
      </p>
      <div className="mt-2 text-sm font-bold" style={{ color: "var(--gray-12)" }}>
        {value}
      </div>
    </div>
  );
}
