import { getAdPositionLabel } from "../../../data/adSlots";
import AdStatusBadge from "./AdStatusBadge";
import AdActionsMenu from "./AdActionsMenu";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { calculateBillableHours, formatDateTime, formatUsd, getAdImageUrl, getDisplayStatusLabel } from "./adsUtils";
import { useSortedData, SortableTh } from "../../../utils/tableSort";

export default function AdsTable({
  requests,
  onView,
  onEdit,
  onCancel,
  onPay,
  onHistory,
  onCopyId,
}) {
  const { sorted: sortedRequests, sortKey, sortDir, onSort } = useSortedData(requests, "title");
  return (
    <div
      className="hidden overflow-hidden rounded-[28px] border shadow-sm xl:block"
      style={{
        background: "var(--gray-1)",
        borderColor: "var(--gray-a5)",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-right text-sm">
          <thead
            className="text-xs font-semibold"
            style={{ background: "var(--gray-a2)", color: "var(--gray-9)" }}
          >
            <tr>
              <th className="px-5 py-4">صورة الإعلان</th>
              <SortableTh label="عنوان الإعلان" sortKey="title" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-4" />
              <SortableTh label="القالب" sortKey="template.name" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-4" />
              <SortableTh label="مكان الظهور" sortKey="template.position" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-4" />
              <SortableTh label="فترة الإعلان" sortKey="startDate" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-4" />
              <SortableTh label="السعر الإجمالي" sortKey="totalPrice" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-4" />
              <SortableTh label="حالة الطلب" sortKey="status" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-4" />
              <SortableTh label="حالة الدفع" sortKey="paymentStatus" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-4" />
              <SortableTh label="حالة العرض" sortKey="isDisplayed" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-4" />
              <th className="px-5 py-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.map((request) => {
              const hours = calculateBillableHours(request.startDate, request.endDate);
              const imageUrl = getAdImageUrl(request);

              return (
                <tr key={request.adRequestId} className="align-top" style={{ borderTop: "1px solid var(--gray-a4)" }}>
                  <td className="px-5 py-4">
                    <div
                      className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-2xl border"
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
                  </td>
                  <td className="px-5 py-4">
                    <div className="max-w-[220px]">
                      <p className="line-clamp-2 font-bold" style={{ color: "var(--gray-12)" }}>
                        {request.title}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                        #{request.adRequestId}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="max-w-[170px]">
                      <p className="font-semibold" style={{ color: "var(--gray-12)" }}>
                        {request.template?.name || "—"}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                        {request.template?.imageRatio || "—"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4" style={{ color: "var(--gray-10)" }}>
                    {getAdPositionLabel(request.template?.position)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1 text-xs" style={{ color: "var(--gray-9)" }}>
                      <p>{formatDateTime(request.startDate)}</p>
                      <p>{formatDateTime(request.endDate)}</p>
                      <p className="font-semibold" style={{ color: "var(--gray-11)" }}>
                        {hours ? `${hours} ساعة` : "—"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold" style={{ color: "var(--gray-12)" }}>
                    {formatUsd(request.totalPrice)}
                  </td>
                  <td className="px-5 py-4">
                    <AdStatusBadge status={request.status} />
                  </td>
                  <td className="px-5 py-4">
                    <PaymentStatusBadge status={request.paymentStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        background: request.isDisplayed ? "var(--blue-a3)" : "var(--gray-a3)",
                        color: request.isDisplayed ? "var(--blue-11)" : "var(--gray-11)",
                      }}
                    >
                      {getDisplayStatusLabel(request.isDisplayed)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <AdActionsMenu
                      request={request}
                      onView={onView}
                      onEdit={onEdit}
                      onCancel={onCancel}
                      onPay={onPay}
                      onHistory={onHistory}
                      onCopy={onCopyId}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
