import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiAlignLeft,
  FiArrowRight,
  FiEdit2,
  FiImage,
  FiLayers,
  FiPackage,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import { productsApi } from "./api";
import ProductFeedbackSection from "./ProductFeedbackSection";
import { AGE_GROUP_OPTIONS, AUDIENCE_OPTIONS, STATUS_COLORS } from "./constants";

function Spinner({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      style={{ animation: "spin 0.75s linear infinite" }}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function Toast({ toasts }) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-50 flex flex-col gap-2" dir="rtl">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg"
          style={{
            background:
              toast.type === "error"
                ? "var(--red-9)"
                : toast.type === "success"
                  ? "var(--green-9)"
                  : "var(--gray-12)",
            color: "#fff",
            maxWidth: 360,
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  return { toasts, push };
}

function StatusBadge({ active }) {
  const statusTone = STATUS_COLORS[active] || STATUS_COLORS[false];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
      style={{ background: statusTone.bg, color: statusTone.fg }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: statusTone.dot }} />
      {active ? "نشط" : "غير نشط"}
    </span>
  );
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <section
      className="space-y-4 rounded-2xl border p-5"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
    >
      <div className="flex items-center gap-2.5 border-b pb-3" style={{ borderColor: "var(--gray-a4)" }}>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
        >
          <Icon size={15} />
        </div>
        <h2 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value, dir }) {
  if (value == null || value === "") return null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gray-9)" }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: "var(--gray-12)" }} dir={dir}>
        {value}
      </span>
    </div>
  );
}

function DeleteConfirmDialog({ name, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--red-a3)", color: "var(--red-11)" }}
          >
            <FiTrash2 size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
              حذف المنتج
            </h3>
            <p className="text-sm" style={{ color: "var(--gray-10)" }}>
              هذا الإجراء لا يمكن التراجع عنه
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--gray-11)" }}>
          هل أنت متأكد من حذف المنتج <strong style={{ color: "var(--gray-12)" }}>"{name}"</strong>؟
        </p>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity"
            style={{ background: "var(--red-9)", color: "#fff", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Spinner size={14} /> : <FiTrash2 size={14} />}
            حذف
          </button>

          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function extractCollection(response) {
  if (!response) return [];
  const raw = response?.data ?? response;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.content)) return raw.data.content;
  return [];
}

function getReferenceLabel(items, id) {
  if (id == null || id === "") return "";
  return items.find((item) => String(item.id) === String(id))?.name || "";
}

function getFileUrl(file) {
  return file?.mediumFileUrl || file?.originalFileUrl || file?.smallFileUrl || "";
}

function buildGalleryItems(product) {
  const seen = new Set();
  const variants = [...(product?.variants || [])].sort(
    (left, right) => Number(Boolean(right?.isDefault)) - Number(Boolean(left?.isDefault))
  );

  return variants.flatMap((variant, variantIndex) =>
    [...(variant?.media || [])]
      .sort((left, right) => (left?.sortOrder ?? 0) - (right?.sortOrder ?? 0))
      .map((medium, mediaIndex) => {
        const url = getFileUrl(medium?.mediumFile);
        if (!url) return null;

        const key = String(medium?.mediumId || `${variant?.id || variantIndex}-${mediaIndex}`);
        if (seen.has(key)) return null;
        seen.add(key);

        return {
          id: key,
          url,
          fileName: medium?.mediumFile?.name || variant?.name || `صورة ${mediaIndex + 1}`,
          variantName: variant?.name || "",
          isDefaultVariant: Boolean(variant?.isDefault),
          sortOrder: medium?.sortOrder ?? mediaIndex,
        };
      })
      .filter(Boolean)
  );
}

function buildVariantAttributeLabels(variant, attributes) {
  return (variant?.attributes || [])
    .map((selected) => {
      const attribute = attributes.find((entry) => String(entry.id) === String(selected.attributeId));
      const option = attribute?.options?.find((entry) => String(entry.id) === String(selected.optionId));
      if (!attribute || !option) return null;
      return `${attribute.name}: ${option.value}`;
    })
    .filter(Boolean);
}

export default function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toasts, push } = useToast();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeMediaId, setActiveMediaId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setLoading(true);

      try {
        const [productResponse, categoriesResponse, brandsResponse, attributesResponse] = await Promise.all([
          productsApi.getById(id),
          productsApi.getCategoriesAll().catch(() => null),
          productsApi.getBrands().catch(() => null),
          productsApi.getAttributes().catch(() => null),
        ]);

        if (cancelled) return;

        setProduct(productResponse?.data ?? productResponse);
        setCategories(extractCollection(categoriesResponse));
        setBrands(extractCollection(brandsResponse));
        setAttributes(extractCollection(attributesResponse));
      } catch (error) {
        if (!cancelled) {
          push(error.message || "فشل تحميل المنتج", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [id, push]);

  const galleryItems = useMemo(() => buildGalleryItems(product), [product]);

  useEffect(() => {
    if (!galleryItems.length) {
      setActiveMediaId("");
      return;
    }

    setActiveMediaId((current) =>
      galleryItems.some((item) => item.id === current) ? current : galleryItems[0].id
    );
  }, [galleryItems]);

  const fallbackImageUrl =
    product?.imageUrl ||
    product?.thumbnailUrl ||
    product?.mainImageUrl ||
    product?.medium?.smallFileUrl ||
    "";

  const selectedMedia =
    galleryItems.find((item) => item.id === activeMediaId) ||
    galleryItems[0] ||
    (fallbackImageUrl
      ? {
          id: "fallback",
          url: fallbackImageUrl,
          fileName: product?.name || "صورة المنتج",
          variantName: "",
          isDefaultVariant: true,
        }
      : null);

  const categoryName =
    product?.categoryName || product?.category?.name || getReferenceLabel(categories, product?.categoryId);
  const brandName =
    product?.brandName || product?.brand?.name || getReferenceLabel(brands, product?.brandId);

  async function handleDelete() {
    setDeleteLoading(true);

    try {
      await productsApi.delete(id);
      push("تم حذف المنتج بنجاح", "success");
      setTimeout(() => navigate("/shop-owner/products"), 800);
    } catch (error) {
      push(error.message || "فشل حذف المنتج", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" dir="rtl">
        <Spinner size={28} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24" dir="rtl">
        <FiPackage size={40} style={{ color: "var(--gray-7)" }} />
        <p className="text-base font-medium" style={{ color: "var(--gray-10)" }}>
          لم يتم العثور على المنتج
        </p>
        <button
          onClick={() => navigate("/shop-owner/products")}
          className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)" }}
        >
          <FiArrowRight size={14} />
          العودة للقائمة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8" dir="rtl">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate("/shop-owner/products")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors"
            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)", background: "var(--gray-1)" }}
          >
            <FiArrowRight size={16} />
          </button>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--gray-12)" }}>
                {product.name}
              </h1>
              <StatusBadge active={product.isActive ?? false} />
            </div>

            {product.slug ? (
              <p className="text-sm" style={{ color: "var(--gray-9)" }} dir="ltr">
                {product.slug}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate(`/shop-owner/products/${id}/edit`)}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ borderColor: "var(--gray-a6)", color: "var(--blue-11)", background: "var(--blue-a2)" }}
          >
            <FiEdit2 size={14} />
            تعديل
          </button>

          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ borderColor: "var(--gray-a6)", color: "var(--red-11)", background: "var(--red-a2)" }}
          >
            <FiTrash2 size={14} />
            حذف
          </button>
        </div>
      </header>

      {selectedMedia ? (
        <SectionCard icon={FiImage} title="صور المنتج">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_320px]">
            <div
              className="overflow-hidden rounded-2xl border"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
            >
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img src={selectedMedia.url} alt={selectedMedia.fileName} className="h-full w-full object-cover" />
              </div>

              <div className="border-t px-4 py-3" style={{ borderColor: "var(--gray-a4)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                  {selectedMedia.variantName || product.name}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--gray-9)" }}>
                  {selectedMedia.isDefaultVariant ? "صورة من المتغير الافتراضي" : "صورة مرتبطة بأحد المتغيرات"}
                </p>
              </div>
            </div>

            <div
              className="space-y-3 rounded-2xl border p-4"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
            >
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                  معرض الصور
                </h3>
                <p className="mt-1 text-xs leading-6" style={{ color: "var(--gray-9)" }}>
                  هذه الصور قادمة من وسائط المتغيرات في backend، ويمكنك التنقل بينها لمراجعة المنتج كما سيظهر.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {galleryItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveMediaId(item.id)}
                    className="overflow-hidden rounded-xl border text-right transition-all"
                    style={{
                      background: activeMediaId === item.id ? "var(--blue-a2)" : "var(--gray-1)",
                      borderColor: activeMediaId === item.id ? "var(--blue-a7)" : "var(--gray-a5)",
                    }}
                  >
                    <div className="aspect-square overflow-hidden" style={{ background: "var(--gray-a3)" }}>
                      <img src={item.url} alt={item.fileName} className="h-full w-full object-cover" />
                    </div>
                    <div className="px-3 py-2">
                      <p className="truncate text-xs font-semibold" style={{ color: "var(--gray-12)" }}>
                        {item.variantName || product.name}
                      </p>
                      <p className="mt-1 text-[11px]" style={{ color: "var(--gray-9)" }}>
                        الترتيب #{(item.sortOrder ?? 0) + 1}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard icon={FiPackage} title="المعلومات الأساسية">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InfoRow label="الاسم" value={product.name} />
          <InfoRow label="Slug" value={product.slug} dir="ltr" />
          <InfoRow label="الوصف المختصر" value={product.shortDescription} />
        </div>

        {product.description ? (
          <div className="border-t pt-4" style={{ borderColor: "var(--gray-a4)" }}>
            <span
              className="mb-2 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--gray-9)" }}
            >
              الوصف التفصيلي
            </span>
            <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--gray-12)" }}>
              {product.description}
            </p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard icon={FiLayers} title="التصنيف">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <InfoRow label="الفئة" value={categoryName} />
          <InfoRow label="الماركة" value={brandName} />
          <InfoRow label="الجمهور المستهدف" value={labelFor(AUDIENCE_OPTIONS, product.targetedAudience)} />
          <InfoRow label="الفئة العمرية" value={labelFor(AGE_GROUP_OPTIONS, product.ageGroup)} />
        </div>
      </SectionCard>

      {product.tags?.length ? (
        <SectionCard icon={FiTag} title="الوسوم">
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag, index) => (
              <span
                key={`${tag?.name || tag}-${index}`}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
              >
                {tag?.name ?? tag}
              </span>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {product.variants?.length ? (
        <SectionCard icon={FiAlignLeft} title="المتغيرات">
          <div className="space-y-4">
            {product.variants.map((variant) => {
              const attributeLabels = buildVariantAttributeLabels(variant, attributes);
              const variantMedia = [...(variant.media || [])].sort(
                (left, right) => (left?.sortOrder ?? 0) - (right?.sortOrder ?? 0)
              );

              return (
                <div
                  key={variant.id || variant.name}
                  className="space-y-4 rounded-xl border p-4"
                  style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                          {variant.name}
                        </p>
                        {variant.isDefault ? (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                          >
                            افتراضي
                          </span>
                        ) : null}
                      </div>

                      {attributeLabels.length ? (
                        <div className="flex flex-wrap gap-2">
                          {attributeLabels.map((attributeLabel) => (
                            <span
                              key={`${variant.id}-${attributeLabel}`}
                              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{ background: "var(--gray-a4)", color: "var(--gray-11)" }}
                            >
                              {attributeLabel}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                          السعر الأساسي
                        </p>
                        <p
                          className="text-sm font-bold tabular-nums"
                          style={{ color: "var(--gray-12)" }}
                          dir="ltr"
                        >
                          {variant.basePrice?.toLocaleString("ar")} ₪
                        </p>
                      </div>

                      {variant.discountedPrice != null ? (
                        <div className="text-right">
                          <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                            بعد الخصم
                          </p>
                          <p
                            className="text-sm font-bold tabular-nums"
                            style={{ color: "var(--green-11)" }}
                            dir="ltr"
                          >
                            {variant.discountedPrice?.toLocaleString("ar")} ₪
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {variantMedia.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {variantMedia.map((medium) => {
                        const url = getFileUrl(medium?.mediumFile);
                        if (!url) return null;

                        return (
                          <button
                            key={String(medium?.mediumId || `${variant.id}-${medium.sortOrder}`)}
                            type="button"
                            onClick={() =>
                              setActiveMediaId(String(medium?.mediumId || `${variant.id}-${medium.sortOrder}`))
                            }
                            className="overflow-hidden rounded-xl border text-right transition-all"
                            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
                          >
                            <div className="aspect-square overflow-hidden" style={{ background: "var(--gray-a3)" }}>
                              <img
                                src={url}
                                alt={medium?.mediumFile?.name || variant.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="px-3 py-2">
                              <p className="truncate text-xs font-semibold" style={{ color: "var(--gray-12)" }}>
                                {medium?.mediumFile?.name || variant.name}
                              </p>
                              <p className="mt-1 text-[11px]" style={{ color: "var(--gray-9)" }}>
                                الترتيب #{(medium?.sortOrder ?? 0) + 1}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className="rounded-xl border border-dashed px-4 py-6 text-center"
                      style={{ borderColor: "var(--gray-a5)", background: "var(--gray-1)" }}
                    >
                      <FiImage size={18} style={{ color: "var(--gray-8)", margin: "0 auto 8px" }} />
                      <p className="text-sm font-semibold" style={{ color: "var(--gray-10)" }}>
                        لا توجد صور مرتبطة بهذا المتغير
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      <ProductFeedbackSection productId={product.id} />

      {showDelete ? (
        <DeleteConfirmDialog
          name={product.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleteLoading}
        />
      ) : null}

      <Toast toasts={toasts} />
    </div>
  );
}
