import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiAlertCircle, FiLoader, FiMapPin, FiShoppingBag, FiX } from "react-icons/fi";
import { accountsApi, unwrapAccountPayload } from "../../../api/accounts";
import { buildApiFormError } from "../../../utils/apiErrors";
import { formatMoney } from "../../../utils/orderHubUi";

const FIELD_MAP = {
  cityId: "cityId",
  deliveryName: "deliveryName",
  "deliveryPhone.prefix": "prefix",
  "deliveryPhone.number": "number",
  deliveryPhone: "number",
  deliveryLocation: "deliveryLocation",
  deliveryNote: "deliveryNote",
};

const inputClass =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

export default function CheckoutDialog({
  open,
  onOpenChange,
  cart,
  submitting,
  onSubmit,
}) {
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    cityId: "",
    deliveryName: "",
    prefix: "+970",
    number: "",
    deliveryLocation: "",
    deliveryNote: "",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setCitiesLoading(true);
    setCitiesError("");

    accountsApi.cities.active()
      .then((response) => {
        setCities(unwrapAccountPayload(response) || []);
      })
      .catch((error) => {
        setCities([]);
        setCitiesError(error.message || "تعذر تحميل المدن");
      })
      .finally(() => setCitiesLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open || !cart) {
      return;
    }

    setSubmitError("");
    setFieldErrors({});
    setForm({
      cityId: cart.cityId ? String(cart.cityId) : "",
      deliveryName: cart.deliveryName || "",
      prefix: cart.deliveryPhone?.prefix || "+970",
      number: cart.deliveryPhone?.number || "",
      deliveryLocation: cart.deliveryLocation || "",
      deliveryNote: cart.deliveryNote || "",
    });
  }, [cart, open]);

  const setValue = (key, value) => {
    setFieldErrors((current) => ({ ...current, [key]: "" }));
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setFieldErrors({});

    try {
      await onSubmit({
        cityId: Number(form.cityId),
        deliveryName: form.deliveryName.trim(),
        deliveryPhone: {
          prefix: form.prefix.trim(),
          number: form.number.trim(),
        },
        deliveryLocation: form.deliveryLocation.trim(),
        deliveryNote: form.deliveryNote.trim() || null,
      });
      onOpenChange(false);
    } catch (error) {
      const formError = buildApiFormError(error, FIELD_MAP, "فشل إتمام الطلب");
      setFieldErrors(formError.fieldErrors);
      setSubmitError(formError.message);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-[110] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-white p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-4">
            <div>
              <Dialog.Title className="text-xl font-semibold text-black">إتمام الطلب</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-black/50">
                أدخل بيانات التوصيل لهذا المول.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black"
              >
                <FiX />
              </button>
            </Dialog.Close>
          </div>

          {submitError ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" />
              {submitError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="block text-xs font-semibold text-black/60">المدينة</span>
                  <select
                    className={inputClass}
                    value={form.cityId}
                    disabled={citiesLoading || submitting}
                    onChange={(event) => setValue("cityId", event.target.value)}
                  >
                    <option value="">اختر المدينة</option>
                    {cities.map((city) => (
                      <option key={city.cityId} value={city.cityId}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.cityId ? <span className="text-xs text-red-600">{fieldErrors.cityId}</span> : null}
                  {citiesError ? <span className="text-xs text-red-600">{citiesError}</span> : null}
                </label>

                <label className="space-y-1.5">
                  <span className="block text-xs font-semibold text-black/60">اسم المستلم</span>
                  <input
                    className={inputClass}
                    value={form.deliveryName}
                    disabled={submitting}
                    onChange={(event) => setValue("deliveryName", event.target.value)}
                  />
                  {fieldErrors.deliveryName ? <span className="text-xs text-red-600">{fieldErrors.deliveryName}</span> : null}
                </label>
              </div>

              <label className="space-y-1.5">
                <span className="block text-xs font-semibold text-black/60">رقم هاتف المستلم</span>
                <div className="flex gap-2" dir="ltr">
                  <select
                    className={`${inputClass} max-w-28`}
                    value={form.prefix}
                    disabled={submitting}
                    onChange={(event) => setValue("prefix", event.target.value)}
                  >
                    <option value="+970">+970</option>
                    <option value="+972">+972</option>
                  </select>
                  <input
                    className={inputClass}
                    value={form.number}
                    disabled={submitting}
                    onChange={(event) => setValue("number", event.target.value)}
                    style={{ direction: "ltr", textAlign: "left" }}
                  />
                </div>
                {fieldErrors.number || fieldErrors.prefix ? (
                  <span className="text-xs text-red-600">{fieldErrors.number || fieldErrors.prefix}</span>
                ) : null}
              </label>

              <label className="space-y-1.5">
                <span className="block text-xs font-semibold text-black/60">موقع التوصيل</span>
                <textarea
                  className={`${inputClass} min-h-24 resize-none`}
                  value={form.deliveryLocation}
                  disabled={submitting}
                  onChange={(event) => setValue("deliveryLocation", event.target.value)}
                />
                {fieldErrors.deliveryLocation ? <span className="text-xs text-red-600">{fieldErrors.deliveryLocation}</span> : null}
              </label>

              <label className="space-y-1.5">
                <span className="block text-xs font-semibold text-black/60">ملاحظة التوصيل</span>
                <textarea
                  className={`${inputClass} min-h-20 resize-none`}
                  value={form.deliveryNote}
                  disabled={submitting}
                  onChange={(event) => setValue("deliveryNote", event.target.value)}
                />
                {fieldErrors.deliveryNote ? <span className="text-xs text-red-600">{fieldErrors.deliveryNote}</span> : null}
              </label>
            </div>

            <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-black">
                <FiShoppingBag />
                ملخص الطلب
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-black/50">المول</span>
                  <span className="font-semibold text-black">{cart?.mallInfo?.name || `#${cart?.mallId || "-"}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/50">إجمالي المنتجات</span>
                  <span className="font-semibold text-black">₪{formatMoney(cart?.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/50">رسوم التوصيل الحالية</span>
                  <span className="font-semibold text-black">₪{formatMoney(cart?.deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-black/10 pt-3 text-base">
                  <span className="text-black">المجموع النهائي</span>
                  <span className="font-semibold text-black">₪{formatMoney(cart?.grandTotal)}</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-white px-3 py-3 text-xs text-black/55">
                <div className="flex items-start gap-2">
                  <FiMapPin className="mt-0.5 shrink-0" />
                  يتم جلب رسوم التوصيل من المدينة المحددة في الخادم عند حفظ بيانات التوصيل وإتمام الطلب.
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || citiesLoading}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? <FiLoader className="animate-spin" /> : null}
                تأكيد الطلب
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
