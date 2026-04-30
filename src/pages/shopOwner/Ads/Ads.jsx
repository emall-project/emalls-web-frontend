import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiEdit2,
  FiEye,
  FiImage,
  FiLoader,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { campaignsApi, unwrapCampaignPayload } from "../../../api/campaigns";
import { MediaUuidField } from "../../../components/account/MediaUuidField";
import { CampaignPaymentDialog } from "../../../components/campaigns/CampaignPaymentDialog";
import { useAuth } from "../../../auth/AuthContext";
import { buildApiFormError, getApiErrorMessage } from "../../../utils/apiErrors";
import {
  CAMPAIGN_IMAGE_RATIOS,
  CAMPAIGN_POSITION_LABELS,
  REQUEST_PAYMENT_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  TEMPLATE_STATUS_LABELS,
  formatDateTime,
  formatMoney,
  getCampaignLabel,
  getCampaignStatusTone,
  toDateTimeLocalInput,
} from "../../../utils/campaigns";
import { getMediaPreviewUrl } from "../../../api/mediaManager";

const cardStyle = {
  background: "var(--gray-1)",
  border: "1px solid var(--gray-a6)",
};

const inputClass =
  "w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const inputStyle = {
  background: "var(--gray-a2)",
  borderColor: "var(--gray-a6)",
  color: "var(--gray-12)",
};

const REQUEST_FIELD_MAP = {
  "adRequest.title": "title",
  "adRequest.templateId": "templateId",
  "adRequest.shopId": "shopId",
  "adRequest.imageUrl": "adRequestImageUuid",
  "adRequest.adRequestImageUuid": "adRequestImageUuid",
  "adRequest.startDate": "startDate",
  "adRequest.endDate": "endDate",
  title: "title",
  templateId: "templateId",
  shopId: "shopId",
  adRequestImageUuid: "adRequestImageUuid",
  startDate: "startDate",
  endDate: "endDate",
};

function useThemeContainer() {
  const [container, setContainer] = useState(null);

  useEffect(() => {
    setContainer(document.querySelector(".radix-themes") || document.body);
  }, []);

  return container;
}

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function StatusBadge({ status, labels }) {
  const tone = getCampaignStatusTone(status);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: tone.bg, color: tone.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />
      {getCampaignLabel(status, labels)}
    </span>
  );
}

function InfoMessage({ icon: Icon = FiAlertCircle, color = "var(--blue-11)", background = "var(--blue-a2)", border = "var(--blue-a5)", children }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
      style={{ color, background, borderColor: border }}
    >
      <Icon size={15} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border px-6 py-10 text-center" style={cardStyle}>
      <div className="text-base font-semibold" style={{ color: "var(--gray-12)" }}>
        {title}
      </div>
      {description ? (
        <div className="mt-2 text-sm" style={{ color: "var(--gray-11)" }}>
          {description}
        </div>
      ) : null}
    </div>
  );
}

function DialogShell({ open, onOpenChange, title, description, children, maxWidth = "max-w-3xl" }) {
  const themeContainer = useThemeContainer();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay
          className="fixed inset-0 z-[20040]"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
        />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-0 z-[20041] flex items-center justify-center p-4"
          aria-describedby={undefined}
        >
          <div
            className={`flex w-full ${maxWidth} max-h-[92vh] flex-col overflow-hidden rounded-2xl border shadow-2xl`}
            style={cardStyle}
          >
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--gray-a6)" }}>
              <div>
                <Dialog.Title className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                  {title}
                </Dialog.Title>
                {description ? (
                  <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
                    {description}
                  </p>
                ) : null}
              </div>
              <Dialog.Close asChild>
                <button type="button" className="rounded-lg p-2 transition hover:opacity-70" style={{ color: "var(--gray-11)" }}>
                  <FiX size={18} />
                </button>
              </Dialog.Close>
            </div>
            <div className="overflow-y-auto p-6">{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TemplateSummary({ template }) {
  if (!template) {
    return null;
  }

  return (
    <div className="rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--blue-a2)", borderColor: "var(--blue-a5)" }}>
      <div className="font-semibold" style={{ color: "var(--blue-11)" }}>
        {template.name}
      </div>
      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2" style={{ color: "var(--blue-10)" }}>
        <div>الموضع: {getCampaignLabel(template.position, CAMPAIGN_POSITION_LABELS)}</div>
        <div>النسبة: {template.imageRatio}</div>
        <div>السعر لكل ساعة: {formatMoney(template.pricePerHour, "ILS")}</div>
        <div>الحالة: {getCampaignLabel(template.status, TEMPLATE_STATUS_LABELS)}</div>
      </div>
    </div>
  );
}

function AdRequestFormDialog({ open, onOpenChange, storeId, templates, request, onSaved }) {
  const isEdit = !!request;
  const [form, setForm] = useState({
    templateId: "",
    title: "",
    adRequestImageUuid: "",
    startDate: "",
    endDate: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setFieldErrors({});
    setUploading(false);

    if (request) {
      setForm({
        templateId: String(request.templateId || request.template?.adTemplateId || ""),
        title: request.title || "",
        adRequestImageUuid: String(request.adRequestImageUuid || ""),
        startDate: toDateTimeLocalInput(request.startDate),
        endDate: toDateTimeLocalInput(request.endDate),
      });
      setImageFile(request.adRequestImage || null);
      return;
    }

    setForm({
      templateId: "",
      title: "",
      adRequestImageUuid: "",
      startDate: "",
      endDate: "",
    });
    setImageFile(null);
  }, [open, request]);

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) =>
          String(template.adTemplateId) === String(form.templateId)
        ) || null,
    [form.templateId, templates]
  );

  const setValue = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const payload = {
        ...(isEdit ? { adRequestId: request.adRequestId } : {}),
        shopId: Number(storeId),
        templateId: Number(form.templateId),
        title: form.title.trim(),
        adRequestImageUuid: form.adRequestImageUuid,
        startDate: form.startDate,
        endDate: form.endDate,
      };

      if (isEdit) {
        await campaignsApi.requests.update(payload);
      } else {
        await campaignsApi.requests.create(payload);
      }

      onSaved?.();
      onOpenChange(false);
    } catch (requestError) {
      const mapped = buildApiFormError(requestError, REQUEST_FIELD_MAP, "فشل حفظ طلب الإعلان");
      setError(mapped.message);
      setFieldErrors(mapped.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "تعديل طلب الإعلان" : "إنشاء طلب إعلان"}
      description="أدخل بيانات الإعلان بما يطابق متطلبات النموذج المحدد."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">{error}</InfoMessage> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
              النموذج الإعلاني
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={form.templateId}
              onChange={(event) => setValue("templateId", event.target.value)}
              disabled={isEdit}
            >
              <option value="">اختر نموذجًا</option>
              {templates.map((template) => (
                <option key={template.adTemplateId} value={template.adTemplateId}>
                  {template.name} - {getCampaignLabel(template.position, CAMPAIGN_POSITION_LABELS)}
                </option>
              ))}
            </select>
            {fieldErrors.templateId ? (
              <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>
                {fieldErrors.templateId}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
              عنوان الإعلان
            </label>
            <input
              className={inputClass}
              style={inputStyle}
              value={form.title}
              onChange={(event) => setValue("title", event.target.value)}
              placeholder="مثال: عروض الصيف"
            />
            {fieldErrors.title ? (
              <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>
                {fieldErrors.title}
              </p>
            ) : null}
          </div>
        </div>

        <TemplateSummary template={selectedTemplate} />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
              بداية العرض
            </label>
            <input
              type="datetime-local"
              className={inputClass}
              style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
              value={form.startDate}
              onChange={(event) => setValue("startDate", event.target.value)}
            />
            {fieldErrors.startDate ? (
              <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>
                {fieldErrors.startDate}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
              نهاية العرض
            </label>
            <input
              type="datetime-local"
              className={inputClass}
              style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
              value={form.endDate}
              onChange={(event) => setValue("endDate", event.target.value)}
            />
            {fieldErrors.endDate ? (
              <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>
                {fieldErrors.endDate}
              </p>
            ) : null}
          </div>
        </div>

        <MediaUuidField
          label="صورة الإعلان"
          value={form.adRequestImageUuid}
          onChange={(value) => setValue("adRequestImageUuid", value)}
          file={imageFile}
          onFileChange={setImageFile}
          mode="store"
          storeId={storeId}
          allowPicker
          showManualInput={false}
          error={fieldErrors.adRequestImageUuid}
          onUploadingChange={setUploading}
        />

        <div className="flex items-center justify-start gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || uploading || !storeId}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? <Spinner size={14} /> : null}
            {isEdit ? "حفظ التعديلات" : "إرسال الطلب"}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-85"
            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
          >
            إلغاء
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function AdRequestDetailsDialog({ open, onOpenChange, request }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    if (!request?.adRequestId || !open) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await campaignsApi.requests.myPayments(request.adRequestId);
      setPayments(unwrapCampaignPayload(response) || []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحميل سجل الدفعات"));
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [open, request?.adRequestId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={request?.title || "تفاصيل الإعلان"}
      description="تفاصيل الطلب وحالة الدفع الخاصة به."
    >
      {request ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3 rounded-2xl border p-4" style={cardStyle}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={request.status} labels={REQUEST_STATUS_LABELS} />
                <StatusBadge status={request.paymentStatus} labels={REQUEST_PAYMENT_STATUS_LABELS} />
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <div style={{ color: "var(--gray-10)" }}>المتجر</div>
                  <div className="font-semibold" style={{ color: "var(--gray-12)" }}>
                    {request.shop?.name || `متجر #${request.shopId}`}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--gray-10)" }}>النموذج</div>
                  <div className="font-semibold" style={{ color: "var(--gray-12)" }}>
                    {request.template?.name || `#${request.templateId}`}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--gray-10)" }}>بداية العرض</div>
                  <div style={{ color: "var(--gray-12)" }}>{formatDateTime(request.startDate)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--gray-10)" }}>نهاية العرض</div>
                  <div style={{ color: "var(--gray-12)" }}>{formatDateTime(request.endDate)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--gray-10)" }}>الإجمالي</div>
                  <div style={{ color: "var(--gray-12)" }}>{formatMoney(request.totalPrice, "ILS")}</div>
                </div>
                <div>
                  <div style={{ color: "var(--gray-10)" }}>موضع الإعلان</div>
                  <div style={{ color: "var(--gray-12)" }}>
                    {getCampaignLabel(request.template?.position, CAMPAIGN_POSITION_LABELS)}
                  </div>
                </div>
              </div>

              {request.rejectionReason ? (
                <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">
                  سبب الرفض: {request.rejectionReason}
                </InfoMessage>
              ) : null}
            </div>

            <div className="rounded-2xl border p-4" style={cardStyle}>
              {getMediaPreviewUrl(request.adRequestImage) ? (
                <img
                  src={getMediaPreviewUrl(request.adRequestImage)}
                  alt={request.title}
                  className="h-56 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-56 items-center justify-center rounded-xl border" style={{ borderColor: "var(--gray-a6)" }}>
                  <div className="text-center text-sm" style={{ color: "var(--gray-10)" }}>
                    <FiImage className="mx-auto mb-2" size={22} />
                    لا توجد معاينة متاحة
                  </div>
                </div>
              )}
              <div className="mt-3 text-xs" style={{ color: "var(--gray-10)" }}>
                النسب المدعومة: {CAMPAIGN_IMAGE_RATIOS.join("، ")}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border" style={cardStyle}>
            <div className="border-b px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
              سجل الدفعات
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-sm">
                <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold">المبلغ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">طريقة الدفع</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">تاريخ العملية</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center" style={{ color: "var(--gray-10)" }}>
                        <span className="inline-flex items-center gap-2">
                          <Spinner size={16} />
                          جاري التحميل...
                        </span>
                      </td>
                    </tr>
                  ) : payments.length ? (
                    payments.map((payment) => (
                      <tr key={payment.paymentId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                        <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>
                          {formatMoney(payment.amount, payment.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={payment.paymentStatus} labels={REQUEST_PAYMENT_STATUS_LABELS} />
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>
                          {payment.paymentMethod || "-"}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--gray-11)" }}>
                          {formatDateTime(payment.paymentDate)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "var(--gray-10)" }}>
                        {error || "لا توجد دفعات مرتبطة بهذا الطلب حتى الآن."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </DialogShell>
  );
}

export default function Ads() {
  const { selectedStoreId } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [error, setError] = useState("");
  const [templatesError, setTemplatesError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState(null);
  const [paymentState, setPaymentState] = useState(null);
  const [rowLoadingId, setRowLoadingId] = useState(null);

  const loadTemplates = useCallback(async () => {
    if (!selectedStoreId) {
      setTemplates([]);
      return;
    }

    setTemplatesLoading(true);
    setTemplatesError("");

    try {
      const response = await campaignsApi.templates.active();
      setTemplates(unwrapCampaignPayload(response) || []);
    } catch (requestError) {
      setTemplates([]);
      setTemplatesError(getApiErrorMessage(requestError, "فشل تحميل النماذج الإعلانية"));
    } finally {
      setTemplatesLoading(false);
    }
  }, [selectedStoreId]);

  const loadRequests = useCallback(async () => {
    if (!selectedStoreId) {
      setRequests([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = statusFilter
        ? await campaignsApi.requests.byShopStatus(selectedStoreId, statusFilter)
        : await campaignsApi.requests.byShop(selectedStoreId);
      setRequests(unwrapCampaignPayload(response) || []);
    } catch (requestError) {
      setRequests([]);
      setError(getApiErrorMessage(requestError, "فشل تحميل طلبات الإعلانات"));
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, statusFilter]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const openCreate = () => {
    setEditingRequest(null);
    setFormOpen(true);
  };

  const openEdit = (request) => {
    setEditingRequest(request);
    setFormOpen(true);
  };

  const openDetails = (request) => {
    setDetailsRequest(request);
    setDetailsOpen(true);
  };

  const handleCancel = async (request) => {
    if (!selectedStoreId || !window.confirm(`هل تريد إلغاء "${request.title}"؟`)) {
      return;
    }

    setRowLoadingId(request.adRequestId);

    try {
      await campaignsApi.requests.cancel(request.adRequestId, selectedStoreId);
      await loadRequests();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل إلغاء الطلب"));
    } finally {
      setRowLoadingId(null);
    }
  };

  const handlePay = async (request) => {
    setRowLoadingId(request.adRequestId);

    try {
      const response = await campaignsApi.requests.initiatePayment(request.adRequestId);
      const payload = unwrapCampaignPayload(response);
      setPaymentState({
        adRequestId: request.adRequestId,
        title: request.title,
        clientSecret: payload?.clientSecret || "",
        amount: payload?.amount || request.totalPrice || 0,
        currency: payload?.currency || "ILS",
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تهيئة الدفع"));
    } finally {
      setRowLoadingId(null);
    }
  };

  if (!selectedStoreId) {
    return (
      <div dir="rtl" className="space-y-6 p-3 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
            الإعلانات
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
            إدارة طلبات الإعلان المرتبطة بالمتجر النشط.
          </p>
        </div>
        <EmptyState
          title="لا يوجد متجر نشط"
          description="اختر متجرًا من شريط صاحب المتجر أولًا حتى تتمكن من إنشاء وإدارة طلبات الإعلانات."
        />
      </div>
    );
  }

  return (
    <>
      <div dir="rtl" className="space-y-6 p-3 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
              الإعلانات
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
              إنشاء الطلبات الإعلانية، متابعة حالاتها، وإتمام الدفع للطلبات المقبولة.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <FiPlus size={16} />
            طلب إعلان جديد
          </button>
        </div>

        {templatesError ? (
          <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">
            {templatesError}
          </InfoMessage>
        ) : templatesLoading ? (
          <InfoMessage icon={FiLoader}>جاري تحميل النماذج الإعلانية...</InfoMessage>
        ) : null}

        <div className="rounded-2xl border p-4" style={cardStyle}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                فلترة الطلبات
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                تصفية حسب حالة الطلب.
              </div>
            </div>
            <div className="w-full max-w-xs">
              <select
                className={inputClass}
                style={inputStyle}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">كل الحالات</option>
                {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">
            {error}
          </InfoMessage>
        ) : null}

        <div className="overflow-hidden rounded-2xl border" style={cardStyle}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold">العنوان</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">النموذج</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">الفترة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">الدفع</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">الإجمالي</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center" style={{ color: "var(--gray-10)" }}>
                      <span className="inline-flex items-center gap-2">
                        <Spinner size={16} />
                        جاري تحميل الطلبات...
                      </span>
                    </td>
                  </tr>
                ) : requests.length ? (
                  requests.map((request) => (
                    <tr key={request.adRequestId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                      <td className="px-4 py-4">
                        <div className="font-semibold" style={{ color: "var(--gray-12)" }}>
                          {request.title}
                        </div>
                        <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                          #{request.adRequestId}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div style={{ color: "var(--gray-12)" }}>{request.template?.name || `#${request.templateId}`}</div>
                        <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                          {getCampaignLabel(request.template?.position, CAMPAIGN_POSITION_LABELS)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--gray-11)" }}>
                          <FiCalendar size={12} />
                          {formatDateTime(request.startDate)}
                        </div>
                        <div className="mt-1 text-xs" style={{ color: "var(--gray-11)" }}>
                          {formatDateTime(request.endDate)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={request.status} labels={REQUEST_STATUS_LABELS} />
                        {request.rejectionReason ? (
                          <div className="mt-2 text-xs" style={{ color: "var(--red-9)" }}>
                            {request.rejectionReason}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={request.paymentStatus} labels={REQUEST_PAYMENT_STATUS_LABELS} />
                      </td>
                      <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>
                        {formatMoney(request.totalPrice, "ILS")}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDetails(request)}
                            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85"
                            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
                          >
                            <FiEye size={13} />
                            عرض
                          </button>

                          {request.status === "PENDING" ? (
                            <button
                              type="button"
                              onClick={() => openEdit(request)}
                              className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85"
                              style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
                            >
                              <FiEdit2 size={13} />
                              تعديل
                            </button>
                          ) : null}

                          {request.status === "PENDING" ? (
                            <button
                              type="button"
                              onClick={() => handleCancel(request)}
                              disabled={rowLoadingId === request.adRequestId}
                              className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85 disabled:opacity-60"
                              style={{ borderColor: "var(--red-a6)", color: "var(--red-11)" }}
                            >
                              {rowLoadingId === request.adRequestId ? <Spinner size={12} /> : <FiTrash2 size={13} />}
                              إلغاء
                            </button>
                          ) : null}

                          {request.status === "APPROVED" && request.paymentStatus !== "PAID" ? (
                            <button
                              type="button"
                              onClick={() => handlePay(request)}
                              disabled={rowLoadingId === request.adRequestId}
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                            >
                              {rowLoadingId === request.adRequestId ? <Spinner size={12} /> : <FiCreditCard size={13} />}
                              دفع
                            </button>
                          ) : null}

                          {request.paymentStatus === "PAID" ? (
                            <span className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: "var(--green-a3)", color: "var(--green-11)" }}>
                              <FiCheckCircle size={13} />
                              مكتمل
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: "var(--gray-10)" }}>
                      لا توجد طلبات إعلانية مطابقة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdRequestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={selectedStoreId}
        templates={templates}
        request={editingRequest}
        onSaved={loadRequests}
      />

      <AdRequestDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        request={detailsRequest}
      />

      <CampaignPaymentDialog
        open={!!paymentState}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentState(null);
          }
        }}
        title={paymentState ? `دفع طلب: ${paymentState.title}` : "الدفع"}
        description="سيتم استخدام Stripe لمعالجة عملية الدفع الخاصة بطلب الإعلان."
        clientSecret={paymentState?.clientSecret || ""}
        amount={paymentState?.amount || 0}
        currency={paymentState?.currency || "ILS"}
        onPaid={async () => {
          await loadRequests();
          setPaymentState(null);
        }}
      />
    </>
  );
}
