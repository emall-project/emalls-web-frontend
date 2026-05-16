import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IoBusinessOutline,
  IoCartOutline,
  IoChevronBack,
  IoChevronForward,
  IoGridOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiMinus,
  FiPackage,
  FiPlay,
  FiPlus,
} from "react-icons/fi";

import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import FavoriteButton from "../../components/customer/FavoriteButton";
import ProductRating from "../../components/customer/ProductRating";
import ProductComments from "../../components/customer/ProductComments";
import { customerApi } from "../../api/customerApi";
import { cartApi } from "../../api/cartApi";
import { auth } from "../../api/auth";
import { useCart } from "../../context/CartContext";

function ProductSkeleton() {
  return (
    <div className="customer-panel overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded-full bg-slate-100" />
        <div className="h-3 w-1/2 rounded-full bg-slate-100" />
        <div className="h-4 w-1/4 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 animate-pulse">
      <div className="customer-panel p-5">
        <div className="aspect-square rounded-3xl bg-slate-100" />
        <div className="mt-4 flex gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-16 w-16 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-6 w-28 rounded-full bg-slate-100" />
        <div className="h-10 w-3/4 rounded-full bg-slate-100" />
        <div className="h-4 w-full rounded-full bg-slate-100" />
        <div className="h-4 w-4/5 rounded-full bg-slate-100" />
        <div className="h-12 w-40 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function Gallery({ media, index, onSelectIndex }) {
  if (!media.length) {
    return (
      <div className="customer-panel flex aspect-square items-center justify-center">
        <FiPackage className="text-6xl text-slate-300" />
      </div>
    );
  }

  const current = media[index];
  const isVideo = current?.mimeType?.startsWith("video/");
  const previous = () => onSelectIndex(Math.max(index - 1, 0));
  const next = () => onSelectIndex(Math.min(index + 1, media.length - 1));

  return (
    <div className="customer-panel p-4 sm:p-5">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-50">
        {isVideo ? (
          <video
            key={current.url}
            src={current.url}
            className="h-full w-full object-contain"
            controls
            playsInline
          />
        ) : (
          <img src={current.url} alt="product" className="h-full w-full object-contain" />
        )}

        {media.length > 1 ? (
          <>
            <button
              type="button"
              onClick={previous}
              disabled={index === 0}
              aria-label="السابق"
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-2xl border border-slate-200 bg-white/95 text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700 disabled:opacity-30"
            >
              <IoChevronBack className="text-base" />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={index === media.length - 1}
              aria-label="التالي"
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-2xl border border-slate-200 bg-white/95 text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700 disabled:opacity-30"
            >
              <IoChevronForward className="text-base" />
            </button>
          </>
        ) : null}
      </div>

      {media.length > 1 ? (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {media.map((item, itemIndex) => (
            <button
              key={itemIndex}
              type="button"
              onClick={() => onSelectIndex(itemIndex)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 ${
                itemIndex === index ? "border-blue-500" : "border-transparent hover:border-slate-200"
              }`}
            >
              {item.mimeType?.startsWith("video/") ? (
                <>
                  <video src={item.url} className="h-full w-full object-cover bg-slate-50" muted playsInline />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <FiPlay className="text-white" size={14} />
                  </span>
                </>
              ) : (
                <img src={item.url} alt="" className="h-full w-full object-cover bg-slate-50" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({ title, icon, children }) {
  return (
    <div className="customer-panel p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="customer-icon-chip h-10 w-10 text-sm">{icon}</div>
        <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function formatPrice(value) {
  return Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getDiscountMeta(variant) {
  if (!variant?.hasDiscount) return null;

  const basePrice = Number(variant.basePrice ?? 0);
  const discountedPrice = Number(variant.discountedPrice ?? 0);
  const saveAmount = Math.max(basePrice - discountedPrice, 0);

  if (variant.discountType === "PERCENT") {
    return {
      label: "خصم نسبي",
      value: `${Number(variant.discountValue ?? 0)}%`,
      saveAmount,
    };
  }

  if (variant.discountType === "FIXED_PRICE") {
    return {
      label: "خصم ثابت",
      value: `₪${formatPrice(variant.discountValue ?? 0)}`,
      saveAmount,
    };
  }

  return {
    label: "عرض خاص",
    value: null,
    saveAmount,
  };
}

export default function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [info, setInfo] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similarLoading, setSimilarLoading] = useState(true);

  const [allAttributes, setAllAttributes] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [forcedVariantId, setForcedVariantId] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [variantExplicitlySelected, setVariantExplicitlySelected] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [addStatus, setAddStatus] = useState(null);
  const [addError, setAddError] = useState("");
  const { refresh: refreshCart } = useCart();

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProduct(null);
    setInfo(null);
    setSelectedOptions({});
    setForcedVariantId(null);
    setSelectedImageIdx(0);
    setVariantExplicitlySelected(false);

    Promise.all([
      customerApi.getProductById(productId),
      customerApi.getProductInfo(productId),
      customerApi.getAttributes().catch(() => []),
    ])
      .then(([productData, infoData, attrsData]) => {
        setProduct(productData);
        setInfo(infoData);
        setAllAttributes(Array.isArray(attrsData) ? attrsData : []);
        // Initialize selectedOptions from the default variant's attributes
        const defaultVariant =
          productData.variants?.find((v) => v.isDefault) ?? productData.variants?.[0] ?? null;
        if (defaultVariant) {
          const opts = {};
          (defaultVariant.attributes || []).forEach((a) => {
            opts[String(a.attributeId)] = String(a.optionId);
          });
          setSelectedOptions(opts);
        }
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    setSimilarLoading(true);
    customerApi
      .getSimilarProducts(productId)
      .then(setSimilar)
      .catch(() => setSimilar([]))
      .finally(() => setSimilarLoading(false));
  }, [productId]);

  // Build attribute lookup: Map<attrId → {name, options: Map<optionId → value>}>
  const attrLookup = useMemo(() => {
    const map = new Map();
    allAttributes.forEach((a) => {
      const optMap = new Map((a.options || []).map((o) => [String(o.id), o.value]));
      map.set(String(a.id), { name: a.name, options: optMap });
    });
    return map;
  }, [allAttributes]);

  // Unique attribute groups that appear across all variants
  const attrGroups = useMemo(() => {
    if (!product?.variants?.length || !attrLookup.size) return [];
    const groupMap = new Map();
    for (const v of product.variants) {
      for (const a of v.attributes || []) {
        const attrId = String(a.attributeId);
        if (!groupMap.has(attrId)) groupMap.set(attrId, new Set());
        groupMap.get(attrId).add(String(a.optionId));
      }
    }
    return Array.from(groupMap.entries()).map(([attrId, optIds]) => ({
      attrId,
      name: attrLookup.get(attrId)?.name || attrId,
      options: Array.from(optIds).map((optId) => ({
        optionId: optId,
        value: attrLookup.get(attrId)?.options?.get(optId) || optId,
      })),
    }));
  }, [product, attrLookup]);

  // The variant that matches current selection
  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    // No attribute groups → use forcedVariantId (set by flat name buttons) or default
    if (!attrGroups.length) {
      if (forcedVariantId) return product.variants.find((v) => v.id === forcedVariantId) ?? null;
      return product.variants.find((v) => v.isDefault) ?? product.variants[0];
    }
    const entries = Object.entries(selectedOptions);
    if (!entries.length) return product.variants.find((v) => v.isDefault) ?? product.variants[0];
    return (
      product.variants.find((v) => {
        const va = v.attributes || [];
        return entries.every(([attrId, optId]) =>
          va.some((a) => String(a.attributeId) === attrId && String(a.optionId) === optId)
        );
      }) ?? null
    );
  }, [selectedOptions, forcedVariantId, attrGroups, product]);

  function isOptionAvailable(attrId, optionId) {
    const testSel = { ...selectedOptions, [attrId]: optionId };
    const entries = Object.entries(testSel);
    return (product?.variants || []).some((v) => {
      const va = v.attributes || [];
      return entries.every(([aid, oid]) =>
        va.some((a) => String(a.attributeId) === aid && String(a.optionId) === oid)
      );
    });
  }

  function handleOptionSelect(attrId, optionId) {
    setSelectedOptions((prev) => ({ ...prev, [attrId]: optionId }));
    setSelectedImageIdx(0);
    setVariantExplicitlySelected(true);
    setAddStatus(null);
  }

  const handleAddToCart = useCallback(async () => {
    const user = auth.getUser();
    if (!user || user.role !== "ROLE_CUSTOMER") {
      navigate(`/customer/login?from=/products/${productId}`);
      return;
    }

    if (!selectedVariant?.id || !info?.mallId) return;

    setAddStatus("loading");
    setAddError("");
    try {
      await cartApi.addItem(Number(info.mallId), Number(productId), selectedVariant.id, quantity);
      setAddStatus("success");
      refreshCart();
      setTimeout(() => setAddStatus(null), 4000);
    } catch (requestError) {
      setAddError(requestError.message);
      setAddStatus("error");
      setTimeout(() => setAddStatus(null), 5000);
    }
  }, [selectedVariant, info, productId, quantity, navigate, refreshCart]);

  function extractMediaItem(medium) {
    const url =
      medium.mediumFile?.mediumFileUrl ??
      medium.mediumFile?.originalFileUrl ??
      medium.mediumFile?.smallFileUrl ??
      "";
    const mimeType = medium.mediumFile?.mimeType ?? "";
    return url ? { url, mimeType } : null;
  }

  const galleryMedia = useMemo(() => {
    if (!variantExplicitlySelected && product?.variants?.length) {
      // Collect all media from all variants, deduplicated by URL
      const seen = new Set();
      const items = [];
      for (const v of product.variants) {
        const sorted = (v.media ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        for (const medium of sorted) {
          const item = extractMediaItem(medium);
          if (item && !seen.has(item.url)) {
            seen.add(item.url);
            items.push(item);
          }
        }
      }
      return items;
    }
    return (
      selectedVariant?.media
        ?.slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map(extractMediaItem)
        .filter(Boolean) ?? []
    );
  }, [variantExplicitlySelected, selectedVariant, product]);

  const price = selectedVariant
    ? selectedVariant.hasDiscount
      ? Number(selectedVariant.discountedPrice ?? 0)
      : Number(selectedVariant.basePrice ?? 0)
    : null;

  const oldPrice = selectedVariant?.hasDiscount ? Number(selectedVariant.basePrice ?? 0) : null;
  const discountMeta = useMemo(() => getDiscountMeta(selectedVariant), [selectedVariant]);

  if (!loading && error) {
    return (
      <div dir="rtl" className="customer-page flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="customer-panel-strong max-w-md px-8 py-10 text-center">
            <FiPackage className="mx-auto mb-4 text-5xl text-slate-300" />
            <h2 className="text-xl font-extrabold text-slate-900">تعذر تحميل المنتج</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{error}</p>
            <button type="button" onClick={() => navigate(-1)} className="customer-primary-btn mt-6">
              رجوع
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div dir="rtl" className="customer-page">
      <Header />

      <div className="customer-shell px-4 py-8 sm:px-6 md:px-12 md:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <button type="button" onClick={() => navigate(-1)} className="font-semibold hover:text-blue-700">
            رجوع
          </button>
          {info?.mallId ? (
            <>
              <span>/</span>
              <button type="button" onClick={() => navigate(`/malls/${info.mallId}`)} className="inline-flex items-center gap-1 hover:text-blue-700">
                <IoBusinessOutline className="text-xs" />
                المول
              </button>
            </>
          ) : null}
          {info?.storeId ? (
            <>
              <span>/</span>
              <button type="button" onClick={() => navigate(`/stores/${info.storeId}`)} className="inline-flex items-center gap-1 hover:text-blue-700">
                <IoStorefrontOutline className="text-xs" />
                المتجر
              </button>
            </>
          ) : null}
        </div>

        {loading ? (
          <DetailSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Gallery media={galleryMedia} index={selectedImageIdx} onSelectIndex={setSelectedImageIdx} />

            <div className="space-y-5">
              <div className="customer-panel-strong px-5 py-5 sm:px-6 md:px-8">
                <div className="flex flex-wrap gap-2">
                  {info?.brandName ? <span className="customer-kicker">{info.brandName}</span> : null}
                  {info?.categoryName ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                      {info.categoryName}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-3xl font-extrabold leading-snug text-slate-900 md:text-4xl">
                      {product?.name}
                    </h1>
                    {product?.shortDescription ? (
                      <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-600">{product.shortDescription}</p>
                    ) : null}
                  </div>

                  {product?.id ? (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <FavoriteButton productId={product.id} size="text-2xl" />
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  {price != null ? (
                    <>
                    <div className="flex flex-wrap items-end gap-3">
                      <span className="text-3xl font-extrabold text-slate-900 md:text-4xl">₪{price}</span>
                      {oldPrice != null ? <span className="text-lg text-slate-400 line-through">₪{oldPrice}</span> : null}
                      {selectedVariant?.hasDiscount ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          خصم
                        </span>
                      ) : null}
                    </div>
                    
                    {discountMeta ? (
                      <div className="mt-4 rounded-3xl border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#f0fdf4_100%)] p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold tracking-wide text-emerald-700">تفاصيل العرض</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {discountMeta.label}
                              {discountMeta.value ? ` • ${discountMeta.value}` : ""}
                            </p>
                            <p className="mt-1 text-xs leading-6 text-emerald-700">
                              وفّر ₪{formatPrice(discountMeta.saveAmount)} على هذا الخيار
                            </p>
                          </div>
                          <div className="rounded-2xl border border-emerald-200 bg-white/80 px-3 py-2 text-center">
                            <p className="text-[11px] font-semibold text-slate-500">بعد الخصم</p>
                            <p className="mt-1 text-lg font-extrabold text-emerald-700">₪{formatPrice(price)}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    </>
                  ) : (
                    <span className="text-sm text-slate-500">السعر غير متوفر حاليًا.</span>
                  )}
                </div>

                {attrGroups.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {attrGroups.map((group) => (
                      <div key={group.attrId}>
                        <p className="mb-2 text-xs font-semibold text-slate-500">{group.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.options.map((opt) => {
                            const isSelected = selectedOptions[group.attrId] === opt.optionId;
                            const available  = isOptionAvailable(group.attrId, opt.optionId);
                            return (
                              <button
                                key={opt.optionId}
                                type="button"
                                disabled={!available}
                                onClick={() => handleOptionSelect(group.attrId, opt.optionId)}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                  isSelected
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                                }`}
                              >
                                {opt.value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {!selectedVariant && Object.keys(selectedOptions).length > 0 && (
                      <p className="text-xs text-amber-600 font-medium">
                        هذا التوليف غير متوفر حالياً. جرّب خياراً آخر.
                      </p>
                    )}
                  </div>
                ) : product?.variants?.length > 1 ? (
                  <div className="mt-6">
                    <p className="mb-3 text-xs font-semibold text-slate-500">الخيارات المتاحة</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            setForcedVariantId(variant.id);
                            setSelectedImageIdx(0);
                            setVariantExplicitlySelected(true);
                            setAddStatus(null);
                          }}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                            selectedVariant?.id === variant.id
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                          }`}
                        >
                          {variant.name}
                          {variant.hasDiscount ? (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              selectedVariant?.id === variant.id ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"
                            }`}>عرض</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold text-slate-500">الكمية</p>
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                        className="grid h-10 w-10 place-items-center text-slate-700 hover:bg-slate-100"
                      >
                        <FiMinus size={12} />
                      </button>
                      <span className="flex h-10 w-12 items-center justify-center border-x border-slate-200 text-sm font-bold text-slate-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((current) => Math.min(99, current + 1))}
                        className="grid h-10 w-10 place-items-center text-slate-700 hover:bg-slate-100"
                      >
                        <FiPlus size={12} />
                      </button>
                    </div>
                  </div>

                  {addStatus === "success" ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <div className="flex items-center gap-2">
                        <FiCheckCircle size={14} />
                        <span>تمت إضافة المنتج إلى السلة بنجاح.</span>
                        <button type="button" onClick={() => navigate("/cart")} className="mr-auto text-xs font-semibold underline">
                          عرض السلة
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {addStatus === "error" ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <div className="flex items-center gap-2">
                        <FiAlertCircle size={14} />
                        {addError || "تعذر إضافة المنتج إلى السلة. حاول مرة أخرى."}
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={addStatus === "loading" || !selectedVariant}
                    className="customer-primary-btn w-full disabled:opacity-50"
                  >
                    {addStatus === "loading" ? <FiLoader size={14} className="animate-spin" /> : <IoCartOutline className="text-base" />}
                    {addStatus === "loading" ? "جارٍ الإضافة..." : "إضافة إلى السلة"}
                  </button>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <ProductRating productId={productId} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {info?.storeId ? (
                  <button type="button" onClick={() => navigate(`/stores/${info.storeId}`)} className="customer-secondary-btn w-full">
                    <IoStorefrontOutline className="text-base" />
                    زيارة المتجر
                  </button>
                ) : null}
                {info?.mallId ? (
                  <button type="button" onClick={() => navigate(`/malls/${info.mallId}`)} className="customer-secondary-btn w-full">
                    <IoBusinessOutline className="text-base" />
                    زيارة المول
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {!loading && product?.description ? (
          <div className="mt-8">
            <InfoCard title="وصف المنتج" icon={<FiPackage />}>
              <p className="text-sm leading-8 text-slate-700">{product.description}</p>
            </InfoCard>
          </div>
        ) : null}

        <div className="my-10">
          <ProductComments productId={productId} />
        </div>

        {(similarLoading || similar.length > 0) ? (
          <section className="mt-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="customer-icon-chip h-10 w-10 text-sm">
                <IoGridOutline />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">منتجات مشابهة</h2>
                <p className="text-sm text-slate-500">اقتراحات قريبة من هذا المنتج لتسهيل المقارنة.</p>
              </div>
            </div>

            {similarLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {similar.map((item) => (
                  <ProductCard key={item.id} p={item} onAddToCart={() => {}} />
                ))}
              </div>
            )}
          </section>
        ) : null}

        <div className="customer-divider mt-12" />
      </div>

      <Footer />
    </div>
  );
}
