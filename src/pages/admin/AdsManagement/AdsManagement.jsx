import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArchive,
  FiCheckCircle,
  FiCreditCard,
  FiEye,
  FiLoader,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import {
  campaignsApi,
  normalizeCampaignPage,
  unwrapCampaignPayload,
} from "../../../api/campaigns";
import { getMediaPreviewUrl } from "../../../api/mediaManager";
import { buildApiFormError, getApiErrorMessage } from "../../../utils/apiErrors";
import {
  CAMPAIGN_IMAGE_RATIOS,
  CAMPAIGN_POSITION_LABELS,
  CAMPAIGN_POSITIONS,
  DISCOUNT_TYPE_LABELS,
  formatDate,
  formatDateTime,
  formatMoney,
  getCampaignLabel,
  getCampaignStatusTone,
  OFFER_STATUS_LABELS,
  REQUEST_PAYMENT_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  SUBSCRIPTION_PLAN_TYPE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  TEMPLATE_STATUS_LABELS,
} from "../../../utils/campaigns";

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

const TEMPLATE_FIELD_MAP = {
  "adTemplate.name": "name",
  "adTemplate.position": "position",
  "adTemplate.imageRatio": "imageRatio",
  "adTemplate.price": "pricePerHour",
  "adTemplate.pricePerHour": "pricePerHour",
  name: "name",
  position: "position",
  imageRatio: "imageRatio",
  pricePerHour: "pricePerHour",
};

const PLAN_FIELD_MAP = {
  "subscription.plan.name": "name",
  "subscription.plan.type": "planType",
  "subscription.plan.planType": "planType",
  "subscription.plan.durationMonths": "durationMonths",
  "subscription.plan.price": "price",
  "subscription.plan.currency": "currency",
  "subscription.plan.stripePriceId": "stripePriceId",
  name: "name",
  planType: "planType",
  durationMonths: "durationMonths",
  price: "price",
  currency: "currency",
  stripePriceId: "stripePriceId",
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

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timeout = setTimeout(onClose, 3200);
    return () => clearTimeout(timeout);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[30000] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-semibold shadow-2xl"
      style={{
        background: type === "success" ? "var(--green-a2)" : "var(--red-a2)",
        borderColor: type === "success" ? "var(--green-a5)" : "var(--red-a5)",
        color: type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}
    >
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
}

function InfoMessage({ color = "var(--blue-11)", background = "var(--blue-a2)", border = "var(--blue-a5)", children }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
      style={{ color, background, borderColor: border }}
    >
      <FiAlertCircle size={15} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function DialogShell({ open, onOpenChange, title, description, children, maxWidth = "max-w-4xl" }) {
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

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "var(--gray-a6)" }}>
      <div className="text-xs" style={{ color: "var(--gray-10)" }}>
        صفحة {page + 1} من {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:opacity-85 disabled:opacity-50"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
        >
          السابق
        </button>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:opacity-85 disabled:opacity-50"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
        >
          التالي
        </button>
      </div>
    </div>
  );
}

function EmptyTableRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm" style={{ color: "var(--gray-10)" }}>
        {children}
      </td>
    </tr>
  );
}

function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
          {title}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
          {description}
        </p>
      </div>
      {actions}
    </div>
  );
}

function Tabs({ activeTab, onChange, tabs }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border p-2" style={{ ...cardStyle, background: "var(--gray-a2)" }}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition"
            style={{
              background: active ? "var(--gray-1)" : "transparent",
              color: active ? "var(--gray-12)" : "var(--gray-11)",
              boxShadow: active ? "0 1px 4px rgba(0,0,0,.08)" : "none",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function TemplateFormDialog({ open, onOpenChange, template, onSaved }) {
  const isEdit = !!template?.adTemplateId;
  const [form, setForm] = useState({
    name: "",
    description: "",
    position: CAMPAIGN_POSITIONS[0],
    imageRatio: CAMPAIGN_IMAGE_RATIOS[0],
    pricePerHour: "",
    status: "ACTIVE",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setFieldErrors({});

    if (template) {
      setForm({
        name: template.name || "",
        description: template.description || "",
        position: template.position || CAMPAIGN_POSITIONS[0],
        imageRatio: template.imageRatio || CAMPAIGN_IMAGE_RATIOS[0],
        pricePerHour: template.pricePerHour != null ? String(template.pricePerHour) : "",
        status: template.status || "ACTIVE",
      });
      return;
    }

    setForm({
      name: "",
      description: "",
      position: CAMPAIGN_POSITIONS[0],
      imageRatio: CAMPAIGN_IMAGE_RATIOS[0],
      pricePerHour: "",
      status: "ACTIVE",
    });
  }, [open, template]);

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
        ...(isEdit ? { adTemplateId: template.adTemplateId } : {}),
        name: form.name.trim(),
        description: form.description.trim() || null,
        position: form.position,
        imageRatio: form.imageRatio,
        pricePerHour: Number(form.pricePerHour),
        status: form.status,
      };

      if (isEdit) {
        await campaignsApi.templates.update(payload);
      } else {
        await campaignsApi.templates.create(payload);
      }

      await onSaved?.();
      onOpenChange(false);
    } catch (requestError) {
      const mapped = buildApiFormError(requestError, TEMPLATE_FIELD_MAP, "فشل حفظ النموذج");
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
      title={isEdit ? "تعديل نموذج إعلاني" : "إضافة نموذج إعلاني"}
      description="إعداد موضع الإعلان ونسبة الصورة والسعر بالساعة."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">{error}</InfoMessage> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>اسم النموذج</label>
            <input className={inputClass} style={inputStyle} value={form.name} onChange={(event) => setValue("name", event.target.value)} />
            {fieldErrors.name ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.name}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>السعر لكل ساعة</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
              value={form.pricePerHour}
              onChange={(event) => setValue("pricePerHour", event.target.value)}
            />
            {fieldErrors.pricePerHour ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.pricePerHour}</p> : null}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الوصف</label>
          <textarea className={inputClass} style={{ ...inputStyle, minHeight: 88, resize: "vertical" }} value={form.description} onChange={(event) => setValue("description", event.target.value)} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الموضع</label>
            <select className={inputClass} style={inputStyle} value={form.position} onChange={(event) => setValue("position", event.target.value)}>
              {CAMPAIGN_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {getCampaignLabel(position, CAMPAIGN_POSITION_LABELS)}
                </option>
              ))}
            </select>
            {fieldErrors.position ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.position}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>نسبة الصورة</label>
            <select className={inputClass} style={inputStyle} value={form.imageRatio} onChange={(event) => setValue("imageRatio", event.target.value)}>
              {CAMPAIGN_IMAGE_RATIOS.map((ratio) => (
                <option key={ratio} value={ratio}>
                  {ratio}
                </option>
              ))}
            </select>
            {fieldErrors.imageRatio ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.imageRatio}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الحالة</label>
            <select className={inputClass} style={inputStyle} value={form.status} onChange={(event) => setValue("status", event.target.value)}>
              {Object.entries(TEMPLATE_STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-start gap-3 pt-2">
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {submitting ? <Spinner size={14} /> : null}
            {isEdit ? "حفظ التعديلات" : "إنشاء النموذج"}
          </button>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-85" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
            إلغاء
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function PlanFormDialog({ open, onOpenChange, plan, onSaved }) {
  const isEdit = !!plan?.subscriptionPlanId;
  const [form, setForm] = useState({
    name: "",
    planType: "MONTHLY",
    durationMonths: "",
    price: "",
    currency: "ILS",
    stripePriceId: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setFieldErrors({});

    if (plan) {
      setForm({
        name: plan.name || "",
        planType: plan.planType || "MONTHLY",
        durationMonths: plan.durationMonths != null ? String(plan.durationMonths) : "",
        price: plan.price != null ? String(plan.price) : "",
        currency: plan.currency || "ILS",
        stripePriceId: plan.stripePriceId || "",
        isActive: !!plan.isActive,
      });
      return;
    }

    setForm({
      name: "",
      planType: "MONTHLY",
      durationMonths: "",
      price: "",
      currency: "ILS",
      stripePriceId: "",
      isActive: true,
    });
  }, [open, plan]);

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
        ...(isEdit ? { subscriptionPlanId: plan.subscriptionPlanId } : {}),
        name: form.name.trim(),
        planType: form.planType,
        durationMonths: Number(form.durationMonths),
        price: Number(form.price),
        currency: form.currency.trim(),
        stripePriceId: form.stripePriceId.trim(),
        isActive: !!form.isActive,
      };

      if (isEdit) {
        await campaignsApi.plans.update(payload);
      } else {
        await campaignsApi.plans.create(payload);
      }

      await onSaved?.();
      onOpenChange(false);
    } catch (requestError) {
      const mapped = buildApiFormError(requestError, PLAN_FIELD_MAP, "فشل حفظ خطة الاشتراك");
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
      title={isEdit ? "تعديل خطة اشتراك" : "إضافة خطة اشتراك"}
      description="إدارة نوع الخطة ومدتها وسعرها وربطها بمعرف Stripe."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">{error}</InfoMessage> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>اسم الخطة</label>
            <input className={inputClass} style={inputStyle} value={form.name} onChange={(event) => setValue("name", event.target.value)} />
            {fieldErrors.name ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.name}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>نوع الخطة</label>
            <select className={inputClass} style={inputStyle} value={form.planType} onChange={(event) => setValue("planType", event.target.value)}>
              {Object.entries(SUBSCRIPTION_PLAN_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {fieldErrors.planType ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.planType}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>المدة بالأشهر</label>
            <input type="number" min="1" step="1" className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.durationMonths} onChange={(event) => setValue("durationMonths", event.target.value)} />
            {fieldErrors.durationMonths ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.durationMonths}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>السعر</label>
            <input type="number" min="0.01" step="0.01" className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.price} onChange={(event) => setValue("price", event.target.value)} />
            {fieldErrors.price ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.price}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>العملة</label>
            <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.currency} onChange={(event) => setValue("currency", event.target.value)} />
            {fieldErrors.currency ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.currency}</p> : null}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>Stripe Price ID</label>
          <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={form.stripePriceId} onChange={(event) => setValue("stripePriceId", event.target.value)} />
          {fieldErrors.stripePriceId ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.stripePriceId}</p> : null}
        </div>

        <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--gray-12)" }}>
          <input type="checkbox" checked={form.isActive} onChange={(event) => setValue("isActive", event.target.checked)} className="accent-blue-600" />
          الخطة نشطة
        </label>

        <div className="flex items-center justify-start gap-3 pt-2">
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {submitting ? <Spinner size={14} /> : null}
            {isEdit ? "حفظ التعديلات" : "إضافة الخطة"}
          </button>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-85" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
            إلغاء
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function RejectDialog({ open, onOpenChange, request, onSaved }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await campaignsApi.requests.reject(request.adRequestId, reason.trim());
      await onSaved?.();
      onOpenChange(false);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل رفض الطلب"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title="رفض طلب إعلاني" description={request?.title || ""} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">{error}</InfoMessage> : null}
        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>سبب الرفض</label>
          <textarea className={inputClass} style={{ ...inputStyle, minHeight: 96, resize: "vertical" }} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="سيتم حفظ هذا السبب مع الطلب." />
        </div>
        <div className="flex items-center justify-start gap-3">
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {submitting ? <Spinner size={14} /> : null}
            تأكيد الرفض
          </button>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-85" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
            إلغاء
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function RequestDetailsDialog({ open, onOpenChange, request }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    if (!open || !request?.adRequestId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await campaignsApi.requests.payments(request.adRequestId);
      setPayments(unwrapCampaignPayload(response) || []);
    } catch (requestError) {
      setPayments([]);
      setError(getApiErrorMessage(requestError, "فشل تحميل سجل الدفعات"));
    } finally {
      setLoading(false);
    }
  }, [open, request?.adRequestId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title={request?.title || "تفاصيل الطلب"} description="عرض بيانات الطلب الإعلاني وسجل دفعاته.">
      {request ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border p-4" style={cardStyle}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={request.status} labels={REQUEST_STATUS_LABELS} />
                <StatusBadge status={request.paymentStatus} labels={REQUEST_PAYMENT_STATUS_LABELS} />
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <div style={{ color: "var(--gray-10)" }}>المتجر</div>
                  <div style={{ color: "var(--gray-12)" }} className="font-semibold">
                    {request.shop?.name || `متجر #${request.shopId}`}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--gray-10)" }}>النموذج</div>
                  <div style={{ color: "var(--gray-12)" }}>{request.template?.name || `#${request.templateId}`}</div>
                </div>
                <div>
                  <div style={{ color: "var(--gray-10)" }}>الموضع</div>
                  <div style={{ color: "var(--gray-12)" }}>{getCampaignLabel(request.template?.position, CAMPAIGN_POSITION_LABELS)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--gray-10)" }}>الإجمالي</div>
                  <div style={{ color: "var(--gray-12)" }}>{formatMoney(request.totalPrice, "ILS")}</div>
                </div>
                <div>
                  <div style={{ color: "var(--gray-10)" }}>البداية</div>
                  <div style={{ color: "var(--gray-12)" }}>{formatDateTime(request.startDate)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--gray-10)" }}>النهاية</div>
                  <div style={{ color: "var(--gray-12)" }}>{formatDateTime(request.endDate)}</div>
                </div>
              </div>
              {request.rejectionReason ? (
                <div className="mt-4 rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--red-a2)", borderColor: "var(--red-a5)", color: "var(--red-11)" }}>
                  سبب الرفض: {request.rejectionReason}
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl border p-4" style={cardStyle}>
              {getMediaPreviewUrl(request.adRequestImage) ? (
                <img src={getMediaPreviewUrl(request.adRequestImage)} alt={request.title} className="h-56 w-full rounded-xl object-cover" />
              ) : (
                <div className="flex h-56 items-center justify-center rounded-xl border" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}>
                  لا توجد معاينة
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border" style={cardStyle}>
            <div className="border-b px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
              سجل الدفعات
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold">المبلغ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">الطريقة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <EmptyTableRow colSpan={4}>
                      <span className="inline-flex items-center gap-2">
                        <Spinner size={16} />
                        جاري التحميل...
                      </span>
                    </EmptyTableRow>
                  ) : payments.length ? (
                    payments.map((payment) => (
                      <tr key={payment.paymentId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                        <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>{formatMoney(payment.amount, payment.currency)}</td>
                        <td className="px-4 py-3"><StatusBadge status={payment.paymentStatus} labels={REQUEST_PAYMENT_STATUS_LABELS} /></td>
                        <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>{payment.paymentMethod || "-"}</td>
                        <td className="px-4 py-3" style={{ color: "var(--gray-11)" }}>{formatDateTime(payment.paymentDate)}</td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={4}>{error || "لا توجد دفعات مرتبطة بهذا الطلب."}</EmptyTableRow>
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

function OfferDetailsDialog({ open, onOpenChange, offer }) {
  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title={offer?.title || "تفاصيل العرض"} description="عرض المنتجات المربوطة بالعرض بشكل للقراءة فقط.">
      {offer ? (
        <div className="space-y-5">
          <div className="rounded-2xl border p-4" style={cardStyle}>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={offer.status} labels={OFFER_STATUS_LABELS} />
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                {getCampaignLabel(offer.discountType, DISCOUNT_TYPE_LABELS)}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <div style={{ color: "var(--gray-10)" }}>المتجر</div>
                <div style={{ color: "var(--gray-12)" }}>{offer.shop?.name || `متجر #${offer.shopId}`}</div>
              </div>
              <div>
                <div style={{ color: "var(--gray-10)" }}>قيمة الخصم</div>
                <div style={{ color: "var(--gray-12)" }}>
                  {offer.discountType === "PERCENT" ? `${Number(offer.discountValue || 0)}%` : formatMoney(offer.discountValue, "ILS")}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--gray-10)" }}>البداية</div>
                <div style={{ color: "var(--gray-12)" }}>{formatDateTime(offer.startDate)}</div>
              </div>
              <div>
                <div style={{ color: "var(--gray-10)" }}>النهاية</div>
                <div style={{ color: "var(--gray-12)" }}>{formatDateTime(offer.endDate)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {(offer.items || []).length ? (
              offer.items.map((item) => (
                <div key={item.offerItemId || item.productId} className="rounded-2xl border p-4" style={cardStyle}>
                  <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                    {item.product?.name || `منتج #${item.productId}`}
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[420px] text-xs">
                      <thead style={{ color: "var(--gray-10)" }}>
                        <tr>
                          <th className="px-2 py-2 text-right font-semibold">المتغير</th>
                          <th className="px-2 py-2 text-right font-semibold">السعر الأساسي</th>
                          <th className="px-2 py-2 text-right font-semibold">بعد الخصم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(item.variantPrices || []).map((variant) => (
                          <tr key={variant.variantId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                            <td className="px-2 py-2" style={{ color: "var(--gray-12)" }}>{variant.variantName || `#${variant.variantId}`}</td>
                            <td className="px-2 py-2" style={{ color: "var(--gray-11)" }}>{formatMoney(variant.originalPrice, "ILS")}</td>
                            <td className="px-2 py-2 font-semibold" style={{ color: "var(--green-11)" }}>{formatMoney(variant.discountedPrice, "ILS")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <InfoMessage>لا توجد منتجات مرتبطة بهذا العرض.</InfoMessage>
            )}
          </div>
        </div>
      ) : null}
    </DialogShell>
  );
}

function SubscriptionDetailsDialog({ open, onOpenChange, subscription, onCancel, onRefresh }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canceling, setCanceling] = useState(false);

  const loadPayments = useCallback(async () => {
    if (!open || !subscription?.subscriptionId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await campaignsApi.subscriptions.payments(subscription.subscriptionId);
      setPayments(unwrapCampaignPayload(response) || []);
    } catch (requestError) {
      setPayments([]);
      setError(getApiErrorMessage(requestError, "فشل تحميل سجل دفعات الاشتراك"));
    } finally {
      setLoading(false);
    }
  }, [open, subscription?.subscriptionId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleCancel = async () => {
    if (!subscription?.subscriptionId || !window.confirm("هل تريد إلغاء هذا الاشتراك؟")) {
      return;
    }

    setCanceling(true);

    try {
      await onCancel?.(subscription.subscriptionId);
      await onRefresh?.();
      onOpenChange(false);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title={subscription?.plan?.name || "تفاصيل الاشتراك"} description="عرض الخطة الحالية، حالة الاشتراك، وسجل دفعاته.">
      {subscription ? (
        <div className="space-y-5">
          <div className="rounded-2xl border p-4" style={cardStyle}>
            <div className="flex items-center justify-between gap-3">
              <StatusBadge status={subscription.status} labels={SUBSCRIPTION_STATUS_LABELS} />
              <button
                type="button"
                onClick={handleCancel}
                disabled={canceling}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85 disabled:opacity-60"
                style={{ borderColor: "var(--red-a6)", color: "var(--red-11)" }}
              >
                {canceling ? <Spinner size={12} /> : <FiTrash2 size={13} />}
                إلغاء الاشتراك
              </button>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <div style={{ color: "var(--gray-10)" }}>المتجر</div>
                <div style={{ color: "var(--gray-12)" }}>#{subscription.shopId}</div>
              </div>
              <div>
                <div style={{ color: "var(--gray-10)" }}>نوع الخطة</div>
                <div style={{ color: "var(--gray-12)" }}>{getCampaignLabel(subscription.plan?.planType, SUBSCRIPTION_PLAN_TYPE_LABELS)}</div>
              </div>
              <div>
                <div style={{ color: "var(--gray-10)" }}>بداية الاشتراك</div>
                <div style={{ color: "var(--gray-12)" }}>{formatDate(subscription.startDate)}</div>
              </div>
              <div>
                <div style={{ color: "var(--gray-10)" }}>نهاية الاشتراك</div>
                <div style={{ color: "var(--gray-12)" }}>{formatDate(subscription.endDate)}</div>
              </div>
              <div>
                <div style={{ color: "var(--gray-10)" }}>الكتابة متاحة</div>
                <div style={{ color: "var(--gray-12)" }}>{subscription.hasWriteAccess ? "نعم" : "لا"}</div>
              </div>
              <div>
                <div style={{ color: "var(--gray-10)" }}>المدفوع</div>
                <div style={{ color: "var(--gray-12)" }}>{formatMoney(subscription.pricePaid, subscription.plan?.currency || "ILS")}</div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border" style={cardStyle}>
            <div className="border-b px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
              سجل الدفعات
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold">المبلغ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">الطريقة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <EmptyTableRow colSpan={4}>
                      <span className="inline-flex items-center gap-2">
                        <Spinner size={16} />
                        جاري التحميل...
                      </span>
                    </EmptyTableRow>
                  ) : payments.length ? (
                    payments.map((payment) => (
                      <tr key={payment.paymentId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                        <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>{formatMoney(payment.amount, payment.currency)}</td>
                        <td className="px-4 py-3"><StatusBadge status={payment.paymentStatus} labels={{}} /></td>
                        <td className="px-4 py-3" style={{ color: "var(--gray-12)" }}>{payment.paymentMethod || "-"}</td>
                        <td className="px-4 py-3" style={{ color: "var(--gray-11)" }}>{formatDateTime(payment.paymentDate)}</td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={4}>{error || "لا توجد دفعات لهذا الاشتراك."}</EmptyTableRow>
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

function TemplatesTab({ refreshKey, onShowToast }) {
  const [data, setData] = useState({ content: [], totalPages: 1, page: 0 });
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ name: "", position: "", status: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [rowLoadingId, setRowLoadingId] = useState(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await campaignsApi.templates.page({
        page,
        size: 10,
        ...(filters.name ? { name: filters.name } : {}),
        ...(filters.position ? { position: filters.position } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      });
      setData(normalizeCampaignPage(response));
    } catch (requestError) {
      setData({ content: [], totalPages: 1, page: 0 });
      setError(getApiErrorMessage(requestError, "فشل تحميل النماذج الإعلانية"));
    } finally {
      setLoading(false);
    }
  }, [filters.name, filters.position, filters.status, page]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates, refreshKey]);

  const handleRowAction = async (template, action) => {
    setRowLoadingId(template.adTemplateId);

    try {
      await action();
      await loadTemplates();
      onShowToast?.("تم تحديث النموذج بنجاح");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحديث النموذج"));
    } finally {
      setRowLoadingId(null);
    }
  };

  return (
    <>
      <div className="rounded-2xl border p-4" style={cardStyle}>
        <div className="grid gap-4 md:grid-cols-3">
          <input className={inputClass} style={inputStyle} value={filters.name} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, name: event.target.value })); }} placeholder="بحث باسم النموذج" />
          <select className={inputClass} style={inputStyle} value={filters.position} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, position: event.target.value })); }}>
            <option value="">كل المواضع</option>
            {CAMPAIGN_POSITIONS.map((position) => (
              <option key={position} value={position}>
                {getCampaignLabel(position, CAMPAIGN_POSITION_LABELS)}
              </option>
            ))}
          </select>
          <select className={inputClass} style={inputStyle} value={filters.status} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, status: event.target.value })); }}>
            <option value="">كل الحالات</option>
            {Object.entries(TEMPLATE_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">{error}</InfoMessage> : null}

      <div className="overflow-hidden rounded-2xl border" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold">النموذج</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الموضع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">النسبة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">السعر</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الطلبات النشطة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyTableRow colSpan={7}>
                  <span className="inline-flex items-center gap-2"><Spinner size={16} /> جاري التحميل...</span>
                </EmptyTableRow>
              ) : data.content.length ? (
                data.content.map((template) => (
                  <tr key={template.adTemplateId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                    <td className="px-4 py-4">
                      <div className="font-semibold" style={{ color: "var(--gray-12)" }}>{template.name}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>#{template.adTemplateId}</div>
                    </td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{getCampaignLabel(template.position, CAMPAIGN_POSITION_LABELS)}</td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{template.imageRatio}</td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{formatMoney(template.pricePerHour, "ILS")}</td>
                    <td className="px-4 py-4"><StatusBadge status={template.status} labels={TEMPLATE_STATUS_LABELS} /></td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{template.activeRequestCount || 0}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => { setSelectedTemplate(template); setFormOpen(true); }} className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                          تعديل
                        </button>
                        {template.status === "ARCHIVED" ? (
                          <button type="button" disabled={rowLoadingId === template.adTemplateId} onClick={() => handleRowAction(template, () => campaignsApi.templates.activate(template.adTemplateId))} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85 disabled:opacity-60" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                            {rowLoadingId === template.adTemplateId ? <Spinner size={12} /> : <FiRefreshCw size={13} />}
                            تفعيل
                          </button>
                        ) : (
                          <button type="button" disabled={rowLoadingId === template.adTemplateId} onClick={() => handleRowAction(template, () => campaignsApi.templates.archive(template.adTemplateId))} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85 disabled:opacity-60" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                            {rowLoadingId === template.adTemplateId ? <Spinner size={12} /> : <FiArchive size={13} />}
                            أرشفة
                          </button>
                        )}
                        <button type="button" disabled={rowLoadingId === template.adTemplateId} onClick={() => handleRowAction(template, () => campaignsApi.templates.delete(template.adTemplateId))} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85 disabled:opacity-60" style={{ borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
                          {rowLoadingId === template.adTemplateId ? <Spinner size={12} /> : <FiTrash2 size={13} />}
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow colSpan={7}>لا توجد نماذج مطابقة.</EmptyTableRow>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      </div>

      <TemplateFormDialog open={formOpen} onOpenChange={setFormOpen} template={selectedTemplate} onSaved={loadTemplates} />
    </>
  );
}

function RequestsTab({ refreshKey, onShowToast }) {
  const [data, setData] = useState({ content: [], totalPages: 1 });
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ title: "", status: "", payment_status: "", shop_id: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rowLoadingId, setRowLoadingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await campaignsApi.requests.page({
        page,
        size: 10,
        ...filters,
      });
      setData(normalizeCampaignPage(response));
    } catch (requestError) {
      setData({ content: [], totalPages: 1 });
      setError(getApiErrorMessage(requestError, "فشل تحميل الطلبات الإعلانية"));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests, refreshKey]);

  const approveRequest = async (request) => {
    setRowLoadingId(request.adRequestId);

    try {
      await campaignsApi.requests.approve(request.adRequestId);
      await loadRequests();
      onShowToast?.("تمت الموافقة على الطلب");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل قبول الطلب"));
    } finally {
      setRowLoadingId(null);
    }
  };

  return (
    <>
      <div className="rounded-2xl border p-4" style={cardStyle}>
        <div className="grid gap-4 md:grid-cols-4">
          <input className={inputClass} style={inputStyle} value={filters.title} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, title: event.target.value })); }} placeholder="بحث بعنوان الطلب" />
          <select className={inputClass} style={inputStyle} value={filters.status} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, status: event.target.value })); }}>
            <option value="">كل الحالات</option>
            {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select className={inputClass} style={inputStyle} value={filters.payment_status} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, payment_status: event.target.value })); }}>
            <option value="">كل حالات الدفع</option>
            {Object.entries(REQUEST_PAYMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={filters.shop_id} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, shop_id: event.target.value })); }} placeholder="Shop ID" />
        </div>
      </div>

      {error ? <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">{error}</InfoMessage> : null}

      <div className="overflow-hidden rounded-2xl border" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold">الطلب</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">المتجر</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">النموذج</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الدفع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الإجمالي</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyTableRow colSpan={7}>
                  <span className="inline-flex items-center gap-2"><Spinner size={16} /> جاري التحميل...</span>
                </EmptyTableRow>
              ) : data.content.length ? (
                data.content.map((request) => (
                  <tr key={request.adRequestId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                    <td className="px-4 py-4">
                      <div className="font-semibold" style={{ color: "var(--gray-12)" }}>{request.title}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>#{request.adRequestId}</div>
                    </td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{request.shop?.name || `متجر #${request.shopId}`}</td>
                    <td className="px-4 py-4">
                      <div style={{ color: "var(--gray-12)" }}>{request.template?.name || `#${request.templateId}`}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>{getCampaignLabel(request.template?.position, CAMPAIGN_POSITION_LABELS)}</div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={request.status} labels={REQUEST_STATUS_LABELS} /></td>
                    <td className="px-4 py-4"><StatusBadge status={request.paymentStatus} labels={REQUEST_PAYMENT_STATUS_LABELS} /></td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{formatMoney(request.totalPrice, "ILS")}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => { setSelectedRequest(request); setDetailsOpen(true); }} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                          <FiEye size={13} />
                          تفاصيل
                        </button>
                        {request.status === "PENDING" ? (
                          <>
                            <button type="button" disabled={rowLoadingId === request.adRequestId} onClick={() => approveRequest(request)} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85 disabled:opacity-60" style={{ borderColor: "var(--green-a6)", color: "var(--green-11)" }}>
                              {rowLoadingId === request.adRequestId ? <Spinner size={12} /> : <FiCheckCircle size={13} />}
                              قبول
                            </button>
                            <button type="button" onClick={() => { setSelectedRequest(request); setRejectOpen(true); }} className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85" style={{ borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
                              رفض
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow colSpan={7}>لا توجد طلبات مطابقة.</EmptyTableRow>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      </div>

      <RequestDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} request={selectedRequest} />
      <RejectDialog open={rejectOpen} onOpenChange={setRejectOpen} request={selectedRequest} onSaved={loadRequests} />
    </>
  );
}

function OffersTab({ refreshKey }) {
  const [data, setData] = useState({ content: [], totalPages: 1 });
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ title: "", status: "", discount_type: "", shop_id: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await campaignsApi.offers.page({
        page,
        size: 10,
        ...filters,
      });
      setData(normalizeCampaignPage(response));
    } catch (requestError) {
      setData({ content: [], totalPages: 1 });
      setError(getApiErrorMessage(requestError, "فشل تحميل العروض"));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers, refreshKey]);

  const openDetails = async (offerSummary) => {
    try {
      const response = await campaignsApi.offers.byId(offerSummary.offerId);
      setSelectedOffer(unwrapCampaignPayload(response));
      setDetailsOpen(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحميل تفاصيل العرض"));
    }
  };

  return (
    <>
      <div className="rounded-2xl border p-4" style={cardStyle}>
        <div className="grid gap-4 md:grid-cols-4">
          <input className={inputClass} style={inputStyle} value={filters.title} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, title: event.target.value })); }} placeholder="بحث بعنوان العرض" />
          <select className={inputClass} style={inputStyle} value={filters.status} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, status: event.target.value })); }}>
            <option value="">كل الحالات</option>
            {Object.entries(OFFER_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select className={inputClass} style={inputStyle} value={filters.discount_type} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, discount_type: event.target.value })); }}>
            <option value="">كل أنواع الخصم</option>
            {Object.entries(DISCOUNT_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={filters.shop_id} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, shop_id: event.target.value })); }} placeholder="Shop ID" />
        </div>
      </div>

      {error ? <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">{error}</InfoMessage> : null}

      <div className="overflow-hidden rounded-2xl border" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold">العرض</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">المتجر</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">نوع الخصم</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الفترة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">المنتجات</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyTableRow colSpan={7}>
                  <span className="inline-flex items-center gap-2"><Spinner size={16} /> جاري التحميل...</span>
                </EmptyTableRow>
              ) : data.content.length ? (
                data.content.map((offer) => (
                  <tr key={offer.offerId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                    <td className="px-4 py-4">
                      <div className="font-semibold" style={{ color: "var(--gray-12)" }}>{offer.title}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>#{offer.offerId}</div>
                    </td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{offer.shop?.name || `متجر #${offer.shopId}`}</td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{getCampaignLabel(offer.discountType, DISCOUNT_TYPE_LABELS)}</td>
                    <td className="px-4 py-4 text-xs" style={{ color: "var(--gray-11)" }}>
                      <div>{formatDateTime(offer.startDate)}</div>
                      <div className="mt-1">{formatDateTime(offer.endDate)}</div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={offer.status} labels={OFFER_STATUS_LABELS} /></td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{(offer.items || []).length}</td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => openDetails(offer)} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                        <FiEye size={13} />
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow colSpan={7}>لا توجد عروض مطابقة.</EmptyTableRow>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      </div>

      <OfferDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} offer={selectedOffer} />
    </>
  );
}

function PlansTab({ refreshKey, onShowToast }) {
  const [data, setData] = useState({ content: [], totalPages: 1 });
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ name: "", plan_type: "", is_active: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await campaignsApi.plans.page({
        page,
        size: 10,
        ...filters,
      });
      setData(normalizeCampaignPage(response));
    } catch (requestError) {
      setData({ content: [], totalPages: 1 });
      setError(getApiErrorMessage(requestError, "فشل تحميل خطط الاشتراك"));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans, refreshKey]);

  return (
    <>
      <div className="rounded-2xl border p-4" style={cardStyle}>
        <div className="grid gap-4 md:grid-cols-3">
          <input className={inputClass} style={inputStyle} value={filters.name} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, name: event.target.value })); }} placeholder="بحث باسم الخطة" />
          <select className={inputClass} style={inputStyle} value={filters.plan_type} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, plan_type: event.target.value })); }}>
            <option value="">كل الأنواع</option>
            {Object.entries(SUBSCRIPTION_PLAN_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select className={inputClass} style={inputStyle} value={filters.is_active} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, is_active: event.target.value })); }}>
            <option value="">نشطة وغير نشطة</option>
            <option value="true">نشطة</option>
            <option value="false">غير نشطة</option>
          </select>
        </div>
      </div>

      {error ? <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">{error}</InfoMessage> : null}

      <div className="overflow-hidden rounded-2xl border" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold">الخطة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">النوع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">المدة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">السعر</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">Stripe</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyTableRow colSpan={7}>
                  <span className="inline-flex items-center gap-2"><Spinner size={16} /> جاري التحميل...</span>
                </EmptyTableRow>
              ) : data.content.length ? (
                data.content.map((plan) => (
                  <tr key={plan.subscriptionPlanId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                    <td className="px-4 py-4">
                      <div className="font-semibold" style={{ color: "var(--gray-12)" }}>{plan.name}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>#{plan.subscriptionPlanId}</div>
                    </td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{getCampaignLabel(plan.planType, SUBSCRIPTION_PLAN_TYPE_LABELS)}</td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{plan.durationMonths} شهر</td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{formatMoney(plan.price, plan.currency)}</td>
                    <td className="px-4 py-4 text-xs" dir="ltr" style={{ color: "var(--gray-11)" }}>{plan.stripePriceId}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: plan.isActive ? "var(--green-a3)" : "var(--gray-a3)", color: plan.isActive ? "var(--green-11)" : "var(--gray-11)" }}>
                        {plan.isActive ? "نشطة" : "غير نشطة"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => { setSelectedPlan(plan); setFormOpen(true); }} className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                        تعديل
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow colSpan={7}>لا توجد خطط مطابقة.</EmptyTableRow>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      </div>

      <PlanFormDialog open={formOpen} onOpenChange={setFormOpen} plan={selectedPlan} onSaved={async () => { await loadPlans(); onShowToast?.("تم حفظ خطة الاشتراك"); }} />
    </>
  );
}

function SubscriptionsTab({ refreshKey, onShowToast }) {
  const [data, setData] = useState({ content: [], totalPages: 1 });
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ shop_id: "", status: "", auto_renew: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rowLoadingId, setRowLoadingId] = useState(null);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await campaignsApi.subscriptions.page({
        page,
        size: 10,
        ...filters,
      });
      setData(normalizeCampaignPage(response));
    } catch (requestError) {
      setData({ content: [], totalPages: 1 });
      setError(getApiErrorMessage(requestError, "فشل تحميل الاشتراكات"));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions, refreshKey]);

  const cancelSubscription = async (subscriptionId) => {
    setRowLoadingId(subscriptionId);

    try {
      await campaignsApi.subscriptions.cancel(subscriptionId);
      await loadSubscriptions();
      onShowToast?.("تم إلغاء الاشتراك");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل إلغاء الاشتراك"));
    } finally {
      setRowLoadingId(null);
    }
  };

  const openDetails = async (subscriptionSummary) => {
    try {
      const response = await campaignsApi.subscriptions.byId(subscriptionSummary.subscriptionId);
      setSelectedSubscription(unwrapCampaignPayload(response));
      setDetailsOpen(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحميل تفاصيل الاشتراك"));
    }
  };

  return (
    <>
      <div className="rounded-2xl border p-4" style={cardStyle}>
        <div className="grid gap-4 md:grid-cols-3">
          <input className={inputClass} style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} value={filters.shop_id} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, shop_id: event.target.value })); }} placeholder="Shop ID" />
          <select className={inputClass} style={inputStyle} value={filters.status} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, status: event.target.value })); }}>
            <option value="">كل الحالات</option>
            {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select className={inputClass} style={inputStyle} value={filters.auto_renew} onChange={(event) => { setPage(0); setFilters((previous) => ({ ...previous, auto_renew: event.target.value })); }}>
            <option value="">تجديد تلقائي وغير تلقائي</option>
            <option value="true">تجديد تلقائي</option>
            <option value="false">بدون تجديد تلقائي</option>
          </select>
        </div>
      </div>

      {error ? <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">{error}</InfoMessage> : null}

      <div className="overflow-hidden rounded-2xl border" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold">الاشتراك</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">المتجر</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الخطة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الصلاحية</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الكتابة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyTableRow colSpan={7}>
                  <span className="inline-flex items-center gap-2"><Spinner size={16} /> جاري التحميل...</span>
                </EmptyTableRow>
              ) : data.content.length ? (
                data.content.map((subscription) => (
                  <tr key={subscription.subscriptionId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                    <td className="px-4 py-4">
                      <div className="font-semibold" style={{ color: "var(--gray-12)" }}>#{subscription.subscriptionId}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>{formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}</div>
                    </td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>#{subscription.shopId}</td>
                    <td className="px-4 py-4">
                      <div style={{ color: "var(--gray-12)" }}>{subscription.plan?.name || "-"}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>{getCampaignLabel(subscription.plan?.planType, SUBSCRIPTION_PLAN_TYPE_LABELS)}</div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={subscription.status} labels={SUBSCRIPTION_STATUS_LABELS} /></td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{formatDate(subscription.endDate)}</td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{subscription.hasWriteAccess ? "نعم" : "لا"}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => openDetails(subscription)} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                          <FiEye size={13} />
                          التفاصيل
                        </button>
                        <button type="button" disabled={rowLoadingId === subscription.subscriptionId} onClick={() => cancelSubscription(subscription.subscriptionId)} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85 disabled:opacity-60" style={{ borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
                          {rowLoadingId === subscription.subscriptionId ? <Spinner size={12} /> : <FiTrash2 size={13} />}
                          إلغاء
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow colSpan={7}>لا توجد اشتراكات مطابقة.</EmptyTableRow>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      </div>

      <SubscriptionDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        subscription={selectedSubscription}
        onCancel={cancelSubscription}
        onRefresh={loadSubscriptions}
      />
    </>
  );
}

function PaymentsTab({ refreshKey }) {
  const [paymentType, setPaymentType] = useState("ads");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        paymentType === "ads"
          ? await campaignsApi.requests.allPayments()
          : await campaignsApi.subscriptions.allPayments();
      setPayments(unwrapCampaignPayload(response) || []);
    } catch (requestError) {
      setPayments([]);
      setError(getApiErrorMessage(requestError, "فشل تحميل سجل المدفوعات"));
    } finally {
      setLoading(false);
    }
  }, [paymentType]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments, refreshKey]);

  return (
    <>
      <div className="flex gap-2 rounded-2xl border p-2" style={cardStyle}>
        <button type="button" onClick={() => setPaymentType("ads")} className="rounded-xl px-4 py-2 text-sm font-semibold transition" style={{ background: paymentType === "ads" ? "var(--gray-a3)" : "transparent", color: paymentType === "ads" ? "var(--gray-12)" : "var(--gray-11)" }}>
          دفعات الإعلانات
        </button>
        <button type="button" onClick={() => setPaymentType("subscriptions")} className="rounded-xl px-4 py-2 text-sm font-semibold transition" style={{ background: paymentType === "subscriptions" ? "var(--gray-a3)" : "transparent", color: paymentType === "subscriptions" ? "var(--gray-12)" : "var(--gray-11)" }}>
          دفعات الاشتراكات
        </button>
      </div>

      {error ? <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">{error}</InfoMessage> : null}

      <div className="overflow-hidden rounded-2xl border" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold">المعرّف</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">المبلغ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الطريقة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">الفاتورة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyTableRow colSpan={6}>
                  <span className="inline-flex items-center gap-2"><Spinner size={16} /> جاري التحميل...</span>
                </EmptyTableRow>
              ) : payments.length ? (
                payments.map((payment) => (
                  <tr key={payment.paymentId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                    <td className="px-4 py-4">
                      <div style={{ color: "var(--gray-12)" }}>#{payment.paymentId}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                        {paymentType === "ads" ? `طلب #${payment.adRequestId}` : `اشتراك #${payment.subscriptionId}`}
                      </div>
                    </td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{formatMoney(payment.amount, payment.currency)}</td>
                    <td className="px-4 py-4"><StatusBadge status={payment.paymentStatus} labels={REQUEST_PAYMENT_STATUS_LABELS} /></td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>{payment.paymentMethod || "-"}</td>
                    <td className="px-4 py-4" style={{ color: "var(--gray-11)" }}>{formatDateTime(payment.paymentDate)}</td>
                    <td className="px-4 py-4">
                      {payment.invoiceUrl ? (
                        <a href={payment.invoiceUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600 underline">
                          عرض
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--gray-10)" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow colSpan={6}>لا توجد مدفوعات مطابقة.</EmptyTableRow>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function AdsManagement() {
  const [activeTab, setActiveTab] = useState("templates");
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [addTemplateOpen, setAddTemplateOpen] = useState(false);
  const [addPlanOpen, setAddPlanOpen] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  return (
    <>
      {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}

      <div dir="rtl" className="space-y-6 p-3 sm:p-6">
        <PageHeader
          title="إدارة الحملات"
          description="إدارة النماذج الإعلانية والطلبات والعروض وخطط الاشتراك والمدفوعات من شاشة واحدة."
          actions={
            <div className="flex items-center gap-2">
              {activeTab === "templates" ? (
                <button type="button" onClick={() => setAddTemplateOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                  <FiPlus size={16} />
                  إضافة نموذج
                </button>
              ) : null}
              {activeTab === "plans" ? (
                <button type="button" onClick={() => setAddPlanOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                  <FiPlus size={16} />
                  إضافة خطة
                </button>
              ) : null}
            </div>
          }
        />

        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { key: "templates", label: "نماذج الإعلانات" },
            { key: "requests", label: "طلبات الإعلانات" },
            { key: "offers", label: "العروض" },
            { key: "plans", label: "خطط الاشتراك" },
            { key: "subscriptions", label: "الاشتراكات" },
            { key: "payments", label: "المدفوعات" },
          ]}
        />

        {activeTab === "templates" ? <TemplatesTab refreshKey={refreshKey} onShowToast={showToast} /> : null}
        {activeTab === "requests" ? <RequestsTab refreshKey={refreshKey} onShowToast={showToast} /> : null}
        {activeTab === "offers" ? <OffersTab refreshKey={refreshKey} /> : null}
        {activeTab === "plans" ? <PlansTab refreshKey={refreshKey} onShowToast={showToast} /> : null}
        {activeTab === "subscriptions" ? <SubscriptionsTab refreshKey={refreshKey} onShowToast={showToast} /> : null}
        {activeTab === "payments" ? <PaymentsTab refreshKey={refreshKey} /> : null}
      </div>

      <TemplateFormDialog
        open={addTemplateOpen}
        onOpenChange={setAddTemplateOpen}
        template={null}
        onSaved={async () => {
          setRefreshKey((value) => value + 1);
          showToast("تمت إضافة النموذج");
        }}
      />

      <PlanFormDialog
        open={addPlanOpen}
        onOpenChange={setAddPlanOpen}
        plan={null}
        onSaved={async () => {
          setRefreshKey((value) => value + 1);
          showToast("تمت إضافة الخطة");
        }}
      />
    </>
  );
}
