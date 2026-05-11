import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiGift,
  FiLoader,
  FiPlus,
  FiPower,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { campaignsApi, unwrapCampaignPayload } from "../../../api/campaigns";
import { catalogApi, normalizeCatalogPage, unwrapCatalogPayload } from "../../../api/catalog";
import { useAuth } from "../../../auth/AuthContext";
import { buildApiFormError, getApiErrorMessage } from "../../../utils/apiErrors";
import {
  buildVariantPrices,
  DISCOUNT_TYPE_LABELS,
  formatDateTime,
  formatMoney,
  getCampaignLabel,
  getCampaignStatusTone,
  OFFER_STATUS_LABELS,
  toDateTimeLocalInput,
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

const OFFER_FIELD_MAP = {
  "offer.title": "title",
  "offer.description": "description",
  "offer.discountType": "discountType",
  "offer.discountValue": "discountValue",
  "offer.startDate": "startDate",
  "offer.endDate": "endDate",
  "offer.maxUses": "maxUses",
  "offer.items": "items",
  title: "title",
  description: "description",
  discountType: "discountType",
  discountValue: "discountValue",
  startDate: "startDate",
  endDate: "endDate",
  maxUses: "maxUses",
  items: "items",
  productId: "items",
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

function StatusBadge({ status }) {
  const tone = getCampaignStatusTone(status);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: tone.bg, color: tone.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />
      {getCampaignLabel(status, OFFER_STATUS_LABELS)}
    </span>
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

function DialogShell({ open, onOpenChange, title, description, children, maxWidth = "max-w-5xl" }) {
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

function getProductIdentity(product) {
  return String(product?.id || product?.productId || "");
}

function getProductName(product) {
  return product?.name || product?.product?.name || "منتج";
}

function ProductItemCard({ item, discountType, discountValue, removable = false, onRemove, mode = "create" }) {
  const product = item?.product || item;
  const isExistingOfferItem = !!item?.offerItemId;
  const variants = isExistingOfferItem
    ? item.variantPrices || []
    : buildVariantPrices(product, discountType, discountValue);

  return (
    <div className="rounded-2xl border p-4" style={cardStyle}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
            {getProductName(product)}
          </div>
          <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
            {product?.slug || product?.product?.slug || `#${product?.id || item?.productId}`}
          </div>
        </div>
        {removable ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85"
            style={{ borderColor: "var(--red-a6)", color: "var(--red-11)" }}
          >
            حذف
          </button>
        ) : (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}
          >
            {mode === "edit" ? "مرتبط" : "جاهز للإرسال"}
          </span>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-xs">
          <thead style={{ color: "var(--gray-10)" }}>
            <tr>
              <th className="px-2 py-2 text-right font-semibold">المتغير</th>
              <th className="px-2 py-2 text-right font-semibold">السعر الأساسي</th>
              <th className="px-2 py-2 text-right font-semibold">السعر بعد الخصم</th>
            </tr>
          </thead>
          <tbody>
            {variants.length ? (
              variants.map((variant) => (
                <tr key={variant.variantId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                  <td className="px-2 py-2" style={{ color: "var(--gray-12)" }}>
                    {variant.variantName || `#${variant.variantId}`}
                    {variant.isDefault ? (
                      <span className="mr-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700">
                        افتراضي
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2" style={{ color: "var(--gray-11)" }}>
                    {formatMoney(variant.originalPrice, "ILS")}
                  </td>
                  <td className="px-2 py-2 font-semibold" style={{ color: "var(--green-11)" }}>
                    {formatMoney(variant.discountedPrice, "ILS")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-2 py-3 text-center" style={{ color: "var(--gray-10)" }}>
                  لا توجد متغيرات مرتبطة بهذا المنتج.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OfferFormDialog({ open, onOpenChange, storeId, offer, onSaved }) {
  const isEdit = !!offer?.offerId;
  const [form, setForm] = useState({
    title: "",
    description: "",
    discountType: "PERCENT",
    discountValue: "",
    startDate: "",
    endDate: "",
    maxUses: "",
  });
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [draftProducts, setDraftProducts] = useState([]);
  const [currentOffer, setCurrentOffer] = useState(offer || null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setFieldErrors({});
    setSearch("");
    setSearchResults([]);
    setCurrentOffer(offer || null);

    if (offer) {
      setForm({
        title: offer.title || "",
        description: offer.description || "",
        discountType: offer.discountType || "PERCENT",
        discountValue: offer.discountValue != null ? String(offer.discountValue) : "",
        startDate: toDateTimeLocalInput(offer.startDate),
        endDate: toDateTimeLocalInput(offer.endDate),
        maxUses: offer.maxUses != null ? String(offer.maxUses) : "",
      });
      setDraftProducts([]);
      return;
    }

    setForm({
      title: "",
      description: "",
      discountType: "PERCENT",
      discountValue: "",
      startDate: "",
      endDate: "",
      maxUses: "",
    });
    setDraftProducts([]);
  }, [open, offer]);

  const existingProductIds = useMemo(
    () => new Set((currentOffer?.items || []).map((item) => String(item.productId))),
    [currentOffer?.items]
  );

  const draftProductIds = useMemo(
    () => new Set(draftProducts.map((product) => getProductIdentity(product))),
    [draftProducts]
  );

  const setValue = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const loadSearchResults = useCallback(async () => {
    if (!open || !storeId) {
      return;
    }

    setSearchLoading(true);

    try {
      const response = await catalogApi.products.storePage(
        storeId,
        {
        isActive: true,
        ...(search.trim() ? { q: search.trim() } : {}),
        },
        { page: 0, size: 50 }
      );
      setSearchResults(normalizeCatalogPage(response).content);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [open, search, storeId]);

  useEffect(() => {
    loadSearchResults();
  }, [loadSearchResults]);

  const refreshCurrentOffer = useCallback(async () => {
    if (!currentOffer?.offerId) {
      return;
    }

    const response = await campaignsApi.offers.byId(currentOffer.offerId);
    setCurrentOffer(unwrapCampaignPayload(response));
  }, [currentOffer?.offerId]);

  const addDraftProduct = async (productId) => {
    if (!storeId) {
      return;
    }

    setActionLoading(true);

    try {
      const response = await catalogApi.products.storeById(storeId, productId);
      const product = unwrapCatalogPayload(response);
      const nextId = getProductIdentity(product);

      setDraftProducts((previous) =>
        previous.some((item) => getProductIdentity(item) === nextId)
          ? previous
          : [...previous, product]
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحميل بيانات المنتج"));
    } finally {
      setActionLoading(false);
    }
  };

  const removeDraftProduct = (productId) => {
    setDraftProducts((previous) =>
      previous.filter((item) => getProductIdentity(item) !== String(productId))
    );
  };

  const addProductToExistingOffer = async (productId) => {
    if (!currentOffer?.offerId || !storeId) {
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const productResponse = await catalogApi.products.storeById(storeId, productId);
      const product = unwrapCatalogPayload(productResponse);

      await campaignsApi.offers.addProduct(currentOffer.offerId, storeId, {
        productId: Number(productId),
        variantPrices: buildVariantPrices(product, form.discountType, form.discountValue),
      });

      await refreshCurrentOffer();
      await onSaved?.();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل إضافة المنتج إلى العرض"));
    } finally {
      setActionLoading(false);
    }
  };

  const removeProductFromExistingOffer = async (productId) => {
    if (!currentOffer?.offerId || !storeId) {
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await campaignsApi.offers.removeProduct(currentOffer.offerId, storeId, productId);
      await refreshCurrentOffer();
      await onSaved?.();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل حذف المنتج من العرض"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const payload = {
        ...(isEdit ? { offerId: currentOffer.offerId } : {}),
        shopId: Number(storeId),
        title: form.title.trim(),
        description: form.description.trim() || null,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        startDate: form.startDate,
        endDate: form.endDate,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        ...(isEdit
          ? {}
          : {
              items: draftProducts.map((product) => ({
                productId: Number(getProductIdentity(product)),
                variantPrices: buildVariantPrices(product, form.discountType, form.discountValue),
              })),
            }),
      };

      if (isEdit) {
        await campaignsApi.offers.update(payload);
        await refreshCurrentOffer();
      } else {
        await campaignsApi.offers.create(payload);
      }

      await onSaved?.();
      onOpenChange(false);
    } catch (requestError) {
      const mapped = buildApiFormError(requestError, OFFER_FIELD_MAP, "فشل حفظ العرض");
      setError(mapped.message);
      setFieldErrors(mapped.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  const visibleItems = isEdit ? currentOffer?.items || [] : draftProducts;

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "تعديل العرض" : "إنشاء عرض جديد"}
      description={
        isEdit
          ? "تعديل بيانات العرض الأساسية، وإدارة المنتجات المرتبطة به من نفس النافذة."
          : "أنشئ العرض وحدد المنتجات التي سيطبق عليها الخصم."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <InfoMessage color="var(--red-11)" background="var(--red-a2)" border="var(--red-a5)">
            {error}
          </InfoMessage>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
              عنوان العرض
            </label>
            <input
              className={inputClass}
              style={inputStyle}
              value={form.title}
              onChange={(event) => setValue("title", event.target.value)}
              placeholder="مثال: عروض الربيع"
            />
            {fieldErrors.title ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.title}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
              نوع الخصم
            </label>
            <select
              className={inputClass}
              style={inputStyle}
              value={form.discountType}
              onChange={(event) => setValue("discountType", event.target.value)}
            >
              {Object.entries(DISCOUNT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {fieldErrors.discountType ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.discountType}</p> : null}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
            وصف العرض
          </label>
          <textarea
            className={inputClass}
            style={{ ...inputStyle, minHeight: 88, resize: "vertical" }}
            value={form.description}
            onChange={(event) => setValue("description", event.target.value)}
            placeholder="وصف مختصر لعرض المتجر"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
              قيمة الخصم
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className={inputClass}
              style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
              value={form.discountValue}
              onChange={(event) => setValue("discountValue", event.target.value)}
            />
            {fieldErrors.discountValue ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.discountValue}</p> : null}
          </div>

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
            {fieldErrors.startDate ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.startDate}</p> : null}
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
            {fieldErrors.endDate ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.endDate}</p> : null}
          </div>
        </div>

        <div className="max-w-xs">
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
            الحد الأقصى للاستخدام
          </label>
          <input
            type="number"
            min="1"
            step="1"
            className={inputClass}
            style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
            value={form.maxUses}
            onChange={(event) => setValue("maxUses", event.target.value)}
            placeholder="اختياري"
          />
          {fieldErrors.maxUses ? <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.maxUses}</p> : null}
        </div>

        <div className="rounded-2xl border p-4" style={cardStyle}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                المنتجات المرتبطة بالعرض
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                {isEdit
                  ? "تستطيع إضافة منتجات جديدة أو حذف المنتجات الحالية. تعديل سعر المتغيرات يعتمد على إعادة الحفظ أو إعادة الإضافة."
                  : "اختر المنتجات التي سيطبق عليها هذا العرض. الأسعار المعروضة أدناه مشتقة من نوع وقيمة الخصم الحاليين."}
              </div>
            </div>
            <div className="w-full max-w-md">
              <div className="relative">
                <FiSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--gray-9)" }} />
                <input
                  className={inputClass}
                  style={{ ...inputStyle, paddingRight: "2.5rem" }}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ابحث عن منتج من متجرِك"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border p-3" style={cardStyle}>
              <div className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
                نتائج البحث
              </div>
              <div className="mt-3 space-y-2">
                {searchLoading ? (
                  <div className="rounded-xl border px-4 py-6 text-center text-sm" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}>
                    <span className="inline-flex items-center gap-2">
                      <Spinner size={14} />
                      جاري تحميل المنتجات...
                    </span>
                  </div>
                ) : searchResults.length ? (
                  searchResults.map((product) => {
                    const productId = getProductIdentity(product);
                    const isAdded = draftProductIds.has(productId) || existingProductIds.has(productId);
                    const addHandler = isEdit ? addProductToExistingOffer : addDraftProduct;

                    return (
                      <div
                        key={productId}
                        className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3"
                        style={{ borderColor: "var(--gray-a6)" }}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                            {product.name}
                          </div>
                          <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                            {product.variants?.length || 0} متغير
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isAdded || actionLoading}
                          onClick={() => addHandler(product.id || product.productId)}
                          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          <FiPlus size={12} />
                          {isAdded ? "مضاف" : "إضافة"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border px-4 py-6 text-center text-sm" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}>
                    لا توجد منتجات مطابقة.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {visibleItems.length ? (
                visibleItems.map((item) => (
                  <ProductItemCard
                    key={item.offerItemId || getProductIdentity(item)}
                    item={item}
                    discountType={form.discountType}
                    discountValue={form.discountValue}
                    mode={isEdit ? "edit" : "create"}
                    removable
                    onRemove={() =>
                      isEdit
                        ? removeProductFromExistingOffer(item.productId)
                        : removeDraftProduct(getProductIdentity(item))
                    }
                  />
                ))
              ) : (
                <div className="rounded-2xl border px-4 py-10 text-center text-sm" style={{ ...cardStyle, color: "var(--gray-10)" }}>
                  لم يتم اختيار أي منتج لهذا العرض بعد.
                </div>
              )}
            </div>
          </div>
          {fieldErrors.items ? <p className="mt-3 text-xs" style={{ color: "var(--red-9)" }}>{fieldErrors.items}</p> : null}
        </div>

        <div className="flex items-center justify-start gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || actionLoading || (!isEdit && draftProducts.length === 0)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? <Spinner size={14} /> : null}
            {isEdit ? "حفظ التعديلات" : "إنشاء العرض"}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-85"
            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
          >
            إغلاق
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

export default function Offers() {
  const { selectedStoreId } = useAuth();
  const [offers, setOffers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [rowLoadingId, setRowLoadingId] = useState(null);

  const loadOffers = useCallback(async () => {
    if (!selectedStoreId) {
      setOffers([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = statusFilter
        ? await campaignsApi.offers.byShopStatus(selectedStoreId, statusFilter)
        : await campaignsApi.offers.byShop(selectedStoreId);
      setOffers(unwrapCampaignPayload(response) || []);
    } catch (requestError) {
      setOffers([]);
      setError(getApiErrorMessage(requestError, "فشل تحميل العروض"));
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, statusFilter]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const openCreate = () => {
    setSelectedOffer(null);
    setFormOpen(true);
  };

  const openEdit = async (offerSummary) => {
    try {
      const response = await campaignsApi.offers.byId(offerSummary.offerId);
      setSelectedOffer(unwrapCampaignPayload(response));
      setFormOpen(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحميل تفاصيل العرض"));
    }
  };

  const toggleOfferStatus = async (offer) => {
    if (!selectedStoreId) {
      return;
    }

    setRowLoadingId(offer.offerId);

    try {
      if (offer.status === "ACTIVE") {
        await campaignsApi.offers.deactivate(offer.offerId, selectedStoreId);
      } else {
        await campaignsApi.offers.activate(offer.offerId, selectedStoreId);
      }
      await loadOffers();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل تحديث حالة العرض"));
    } finally {
      setRowLoadingId(null);
    }
  };

  const deleteOffer = async (offer) => {
    if (!selectedStoreId || !window.confirm(`هل تريد حذف "${offer.title}"؟`)) {
      return;
    }

    setRowLoadingId(offer.offerId);

    try {
      await campaignsApi.offers.delete(offer.offerId, selectedStoreId);
      await loadOffers();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "فشل حذف العرض"));
    } finally {
      setRowLoadingId(null);
    }
  };

  if (!selectedStoreId) {
    return (
      <div dir="rtl" className="space-y-6 p-3 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>
            العروض
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
            إدارة العروض التسويقية للمتجر النشط.
          </p>
        </div>
        <EmptyState
          title="لا يوجد متجر نشط"
          description="اختر متجرًا من شريط صاحب المتجر أولًا حتى تتمكن من إدارة العروض."
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
              العروض
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>
              إنشاء العروض، ربطها بمنتجات المتجر، وتفعيلها أو إيقافها حسب الحاجة.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <FiPlus size={16} />
            عرض جديد
          </button>
        </div>

        <div className="rounded-2xl border p-4" style={cardStyle}>
          <div className="grid gap-4 sm:max-w-xs">
            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
                حالة العرض
              </label>
              <select
                className={inputClass}
                style={inputStyle}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">كل الحالات</option>
                {Object.entries(OFFER_STATUS_LABELS).map(([value, label]) => (
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
            <table className="w-full min-w-[980px] text-sm">
              <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold">العنوان</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">نوع الخصم</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">المدة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">المنتجات</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">الاستخدام</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center" style={{ color: "var(--gray-10)" }}>
                      <span className="inline-flex items-center gap-2">
                        <Spinner size={16} />
                        جاري تحميل العروض...
                      </span>
                    </td>
                  </tr>
                ) : offers.length ? (
                  offers.map((offer) => (
                    <tr key={offer.offerId} style={{ borderTop: "1px solid var(--gray-a5)" }}>
                      <td className="px-4 py-4">
                        <div className="font-semibold" style={{ color: "var(--gray-12)" }}>
                          {offer.title}
                        </div>
                        <div className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                          #{offer.offerId}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div style={{ color: "var(--gray-12)" }}>
                          {getCampaignLabel(offer.discountType, DISCOUNT_TYPE_LABELS)}
                        </div>
                        <div className="mt-1 text-xs font-semibold" style={{ color: "var(--green-11)" }}>
                          {offer.discountType === "PERCENT"
                            ? `${Number(offer.discountValue || 0)}%`
                            : formatMoney(offer.discountValue, "ILS")}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs" style={{ color: "var(--gray-11)" }}>
                        <div>{formatDateTime(offer.startDate)}</div>
                        <div className="mt-1">{formatDateTime(offer.endDate)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={offer.status} />
                      </td>
                      <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>
                        {(offer.items || []).length}
                      </td>
                      <td className="px-4 py-4" style={{ color: "var(--gray-12)" }}>
                        {offer.currentUses || 0}
                        {offer.maxUses ? ` / ${offer.maxUses}` : ""}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(offer)}
                            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85"
                            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
                          >
                            <FiGift size={13} />
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleOfferStatus(offer)}
                            disabled={rowLoadingId === offer.offerId}
                            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85 disabled:opacity-60"
                            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
                          >
                            {rowLoadingId === offer.offerId ? <Spinner size={12} /> : <FiPower size={13} />}
                            {offer.status === "ACTIVE" ? "إيقاف" : "تفعيل"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteOffer(offer)}
                            disabled={rowLoadingId === offer.offerId}
                            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-85 disabled:opacity-60"
                            style={{ borderColor: "var(--red-a6)", color: "var(--red-11)" }}
                          >
                            {rowLoadingId === offer.offerId ? <Spinner size={12} /> : <FiTrash2 size={13} />}
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: "var(--gray-10)" }}>
                      لا توجد عروض مطابقة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <OfferFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={selectedStoreId}
        offer={selectedOffer}
        onSaved={loadOffers}
      />
    </>
  );
}
