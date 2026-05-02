import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiHeart, FiLoader, FiShoppingCart, FiMinus, FiPlus } from "react-icons/fi";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Dialog from "@radix-ui/react-dialog";
import { isDiscount as isTmpDiscount, discountAmount, isOutOfStock } from "../../../utils/tmpProducts";
import { getDefaultVariant, hasProductDiscount, toProductCard } from "../../../utils/catalogProducts";
import { useAuth } from "../../../auth/AuthContext";
import { useCart } from "../../../cart/CartContext";
import { catalogApi, unwrapCatalogPayload } from "../../../api/catalog";
import { getApiErrorMessage } from "../../../utils/apiErrors";

function normalizeInfoVariant(variant) {
  const id = variant?.id ?? variant?.variantId;
  if (id == null) return null;

  return {
    ...variant,
    id,
    name: variant?.name || variant?.variantName || "الخيار الأساسي",
    basePrice: variant?.basePrice,
    discountedPrice: variant?.discountedPrice,
    isDefault: variant?.isDefault,
  };
}

function findCartItemByVariant(carts, mallId, variantId) {
  const cart = (carts || []).find((item) => String(item?.mallId) === String(mallId));
  return (cart?.items || []).find((item) => String(item?.variantId) === String(variantId)) || null;
}

function notifyFavoritesChanged() {
  window.dispatchEvent(new CustomEvent("emall-favorites-changed"));
}

export default function ProductCard({ p, onAddToCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { ready, isAuthenticated, isCustomer } = useAuth();
  const { activeCarts, addItem, updateQuantity, refreshActiveCarts } = useCart();
  const product = toProductCard(p);
  const discount = hasProductDiscount(p) || isTmpDiscount(p);
  const save = product.oldPrice ? Math.max(0, product.oldPrice - product.price).toFixed(2) : discountAmount(p);
  const out = product.outOfStock || isOutOfStock(p);
  const initialVariants = useMemo(() => p?.variants || [], [p?.variants]);
  const defaultVariant = useMemo(() => getDefaultVariant(p), [p]);
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id ? String(defaultVariant.id) : "");

  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(Boolean(p?.favorite));
  const [favoriteError, setFavoriteError] = useState("");
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState("");
  const [productInfo, setProductInfo] = useState(p?.productInfo || null);
  const [loadingProductInfo, setLoadingProductInfo] = useState(false);

  const variants = useMemo(() => {
    const infoVariants = (productInfo?.variants || []).map(normalizeInfoVariant).filter(Boolean);
    const normalizedInitialVariants = initialVariants.map(normalizeInfoVariant).filter(Boolean);

    if (infoVariants.length) return infoVariants;
    if (normalizedInitialVariants.length) return normalizedInitialVariants;

    const defaultVariantId = product.defaultVariantId ?? p?.defaultVariantId;
    if (!defaultVariantId) return [];

    return [
      {
        id: defaultVariantId,
        name: "الخيار الأساسي",
        basePrice: product.basePrice ?? product.price,
        discountedPrice: product.discountedPrice,
        isDefault: true,
      },
    ];
  }, [initialVariants, p?.defaultVariantId, product.basePrice, product.defaultVariantId, product.discountedPrice, product.price, productInfo?.variants]);

  const selectedVariant =
    variants.find((variant) => String(variant.id) === String(selectedVariantId)) ||
    variants.find((variant) => variant.isDefault) ||
    variants[0] ||
    defaultVariant ||
    null;
  const mallId = Number(productInfo?.mallId ?? product.mallId ?? p?.mallId ?? p?.productInfo?.mallId ?? 0) || null;
  const canOpenAddDialog = ready && !out && !!product.id;
  const hasProductImage = Boolean(product.imageUrl && product.imageUrl !== "/vite.svg");

  const existingCartItem = useMemo(() => {
    if (!mallId || !selectedVariant?.id) return null;
    return findCartItemByVariant(activeCarts, mallId, selectedVariant.id);
  }, [activeCarts, mallId, selectedVariant?.id]);

  useEffect(() => {
    let cancelled = false;
    if (!ready) {
      return () => {
        cancelled = true;
      };
    }

    if (!isAuthenticated || !isCustomer || !product.id) {
      setFavorite(Boolean(p?.favorite));
      return () => {
        cancelled = true;
      };
    }

    catalogApi.favorites.exists(product.id)
      .then((response) => {
        if (!cancelled) setFavorite(Boolean(response?.data?.favorite ?? response?.favorite));
      })
      .catch(() => {
        if (!cancelled) setFavorite(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isCustomer, p?.favorite, product.id, ready]);

  useEffect(() => {
    const nextDefault =
      variants.find((variant) => variant.isDefault) ||
      variants.find((variant) => String(variant.id) === String(product.defaultVariantId ?? p?.defaultVariantId)) ||
      variants[0] ||
      defaultVariant;

    setSelectedVariantId(nextDefault?.id ? String(nextDefault.id) : "");
    setQuantity(1);
    setCartError("");
  }, [defaultVariant, p?.defaultVariantId, product.defaultVariantId, product.id, variants]);

  const loadProductInfo = async () => {
    if (!product.id) return null;
    if (productInfo?.mallId && productInfo?.variants?.length) return productInfo;

    setLoadingProductInfo(true);
    setCartError("");

    try {
      const response = await catalogApi.products.info(product.id);
      const info = unwrapCatalogPayload(response);
      setProductInfo(info || null);

      const defaultInfoVariant =
        info?.variants?.find((variant) => variant.isDefault) ||
        info?.variants?.[0] ||
        null;
      if (defaultInfoVariant?.variantId || defaultInfoVariant?.id) {
        setSelectedVariantId(String(defaultInfoVariant.variantId ?? defaultInfoVariant.id));
      }

      return info;
    } catch (error) {
      setCartError(getApiErrorMessage(error, "تعذر تحميل خيارات المنتج"));
      return null;
    } finally {
      setLoadingProductInfo(false);
    }
  };

  const handleOpenChange = async (nextOpen) => {
    if (!nextOpen) {
      setOpen(false);
      return;
    }

    if (!ready) {
      return;
    }

    if (!isAuthenticated || !isCustomer) {
      navigate("/login", { state: { from: location } });
      return;
    }

    if (!product.id || out) {
      return;
    }

    setOpen(true);
    await loadProductInfo();
  };

  const handleAdd = async () => {
    if (!ready) {
      return;
    }

    if (!isAuthenticated || !isCustomer) {
      navigate("/login", { state: { from: location } });
      return;
    }

    const info = !mallId || !selectedVariant?.id ? await loadProductInfo() : productInfo;
    const resolvedMallId = Number(info?.mallId ?? mallId ?? 0) || null;
    const resolvedVariant =
      selectedVariant ||
      (info?.variants || []).map(normalizeInfoVariant).filter(Boolean).find((variant) => variant.isDefault) ||
      (info?.variants || []).map(normalizeInfoVariant).filter(Boolean)[0] ||
      null;

    if (!resolvedMallId || !resolvedVariant?.id) {
      setCartError("لا يمكن إضافة هذا المنتج الآن لأن بيانات المول أو المتغير غير مكتملة.");
      return;
    }

    setAdding(true);
    setCartError("");

    const payload = {
      mallId: resolvedMallId,
      productId: Number(product.id),
      variantId: Number(resolvedVariant.id),
      quantity,
    };

    try {
      const activeCartItem =
        findCartItemByVariant(activeCarts, resolvedMallId, resolvedVariant.id) || existingCartItem;

      const nextCart = activeCartItem?.cartItemId
        ? await updateQuantity(activeCartItem.cartItemId, {
            quantity: Number(activeCartItem.quantity || 0) + quantity,
          })
        : await addItem(payload);
      await onAddToCart?.({
        ...product,
        mallId: resolvedMallId,
        quantity,
        variantId: Number(resolvedVariant.id),
      }, nextCart);
      setOpen(false);
      setQuantity(1);
    } catch (error) {
      const message = getApiErrorMessage(error, "فشلت إضافة المنتج إلى السلة");
      if (message.includes("موجود")) {
        const refreshedCarts = await refreshActiveCarts().catch(() => []);
        const refreshedItem = findCartItemByVariant(refreshedCarts, resolvedMallId, resolvedVariant.id);

        if (refreshedItem?.cartItemId) {
          await updateQuantity(refreshedItem.cartItemId, {
            quantity: Number(refreshedItem.quantity || 0) + quantity,
          });
          setOpen(false);
          setQuantity(1);
          return;
        }
      }

      setCartError(message);
    } finally {
      setAdding(false);
    }
  };

  const incrementQty = () => setQuantity((q) => Math.min(q + 1, 99));
  const decrementQty = () => setQuantity((q) => Math.max(q - 1, 1));

  const toggleFavorite = async (event) => {
    event.stopPropagation();

    if (!ready || favoriteLoading) {
      return;
    }

    if (!isAuthenticated || !isCustomer) {
      navigate("/login", { state: { from: location } });
      return;
    }

    if (!product.id) return;

    setFavoriteLoading(true);
    setFavoriteError("");
    try {
      if (favorite) {
        await catalogApi.favorites.deleteProduct(product.id);
        setFavorite(false);
        notifyFavoritesChanged();
      } else {
        await catalogApi.favorites.create(product.id);
        setFavorite(true);
        notifyFavoritesChanged();
      }
    } catch (error) {
      const message = getApiErrorMessage(error, "فشل تحديث المفضلة");
      if (message.includes("موجود")) {
        setFavorite(true);
        notifyFavoritesChanged();
      } else if (message.includes("غير موجود")) {
        setFavorite(false);
        notifyFavoritesChanged();
      } else {
        setFavoriteError(message);
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div className="group relative bg-white overflow-hidden transition-all duration-500 hover:-translate-y-0.5 border border-black/5">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={!ready || favoriteLoading}
        className="absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center border border-black/10 bg-white/90 text-black transition hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-70"
        title="المفضلة"
      >
        {favoriteLoading ? <FiLoader className="animate-spin" size={14} /> : <FiHeart size={15} fill={favorite ? "currentColor" : "none"} />}
      </button>

      {/* image */}
      <button
        type="button"
        onClick={() => navigate(product.href)}
        className="relative block w-full bg-neutral-50 overflow-hidden text-right"
      >
        {discount && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black text-white text-[9px] sm:text-[10px] font-semibold tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 z-10">
            وفر ₪{save}
          </div>
        )}

        {out && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="bg-white text-black text-[9px] sm:text-[10px] font-semibold tracking-wider px-2.5 py-1 sm:px-3 sm:py-1.5">
              نفذت الكمية
            </span>
          </div>
        )}

        {hasProductImage ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid aspect-square w-full place-items-center bg-neutral-100 text-4xl font-light text-black/20">
            {product.name?.[0] || "س"}
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500" />
      </button>

      {/* content - more compact */}
      <div className="p-2 sm:p-2.5 md:p-3 text-right">
        <button
          type="button"
          onClick={() => navigate(product.href)}
          className="block w-full text-right text-xs sm:text-sm font-semibold tracking-wide text-black line-clamp-2 min-h-[1.8rem] sm:min-h-[2rem] hover:underline"
        >
          {product.name}
        </button>

        {product.status && (
          <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] tracking-wide text-black/60 line-clamp-1 font-semibold">
            {product.status}
          </p>
        )}

        <div className="mt-2 sm:mt-2.5 flex items-end justify-between gap-2">
          {/* price */}
          <div className="text-right">
            <div className="flex items-baseline gap-1 sm:gap-1.5 justify-end">
              <p className="text-sm sm:text-base md:text-lg font-semibold text-black tracking-wide">
                ₪{product.price}
              </p>

              {discount && (
                <p className="text-[9px] sm:text-[10px] md:text-xs text-black/40 line-through font-semibold">
                  ₪{product.oldPrice}
                </p>
              )}
            </div>
          </div>

          {/* Add to cart button - smaller */}
          <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Dialog.Trigger asChild>
                    <button
                      type="button"
                      disabled={!ready || !canOpenAddDialog}
                      className={[
                        "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 border border-black/10 flex items-center justify-center transition-all duration-300",
                        ready && canOpenAddDialog
                          ? "hover:bg-black hover:border-black group/btn active:scale-95"
                          : "opacity-30 cursor-not-allowed",
                      ].join(" ")}
                      aria-label="add to cart"
                      title={
                        out
                          ? "المنتج غير متاح"
                          : "إضافة إلى السلة"
                      }
                    >
                      <FiShoppingCart className="text-black text-xs sm:text-sm md:text-base transition-colors group-hover/btn:text-white" />
                    </button>
                  </Dialog.Trigger>
                </Tooltip.Trigger>

                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    align="center"
                    className="bg-black text-white text-[9px] sm:text-[10px] font-semibold tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-lg"
                  >
                    {out
                      ? "نفذت الكمية"
                      : "إضافة للسلة"}
                    <Tooltip.Arrow className="fill-black" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>

            {/* Dialog - unchanged, already responsive */}
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

              <Dialog.Content
                className="
                  fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[92vw] max-w-md
                  bg-white border border-black/10 shadow-2xl
                  p-5 sm:p-6
                "
                dir="rtl"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-black/10">
                  <div className="text-right">
                    <Dialog.Title className="text-base sm:text-lg font-semibold tracking-wide text-black">
                      إضافة إلى السلة
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-black/60 mt-1 font-semibold">
                      اختر المتغير والكمية المطلوبة
                    </Dialog.Description>
                  </div>

                  <Dialog.Close
                    className="h-8 w-8 border border-black/10 hover:bg-black hover:text-white flex items-center justify-center transition-all duration-300 text-black/60 hover:text-white"
                    aria-label="close"
                  >
                    ✕
                  </Dialog.Close>
                </div>

                {cartError ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {cartError}
                  </div>
                ) : null}

                {favoriteError ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {favoriteError}
                  </div>
                ) : null}

                {/* Product info */}
                <div className="mt-5 flex items-center gap-4">
                  {hasProductImage ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-[72px] h-[72px] sm:w-20 sm:h-20 object-cover border border-black/10"
                    />
                  ) : (
                    <div className="grid w-[72px] h-[72px] sm:w-20 sm:h-20 shrink-0 place-items-center border border-black/10 bg-neutral-100 text-2xl font-light text-black/20">
                      {product.name?.[0] || "س"}
                    </div>
                  )}
                  <div className="min-w-0 text-right flex-1">
                    <p className="font-semibold text-black line-clamp-2 text-sm sm:text-base">
                      {product.name}
                    </p>
                    <p className="text-base sm:text-lg text-black font-semibold mt-1">
                      ₪{selectedVariant?.discountedPrice ?? selectedVariant?.basePrice ?? product.price}
                    </p>
                    {loadingProductInfo ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-black/45">
                        <FiLoader className="animate-spin" size={11} />
                        جاري تحميل خيارات المنتج...
                      </p>
                    ) : mallId ? (
                      <p className="mt-1 text-xs text-black/45">مول رقم #{mallId}</p>
                    ) : null}
                  </div>
                </div>

                {variants.length ? (
                  <div className="mt-5 pt-5 border-t border-black/10">
                    <label className="block text-xs tracking-widest uppercase text-black mb-3 font-semibold">
                      المتغير
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {variants.map((variant) => {
                        const active = String(selectedVariant?.id) === String(variant.id);
                        return (
                          <button
                            key={variant.id || variant.name}
                            type="button"
                            onClick={() => {
                              setCartError("");
                              setSelectedVariantId(String(variant.id));
                            }}
                            className="rounded-2xl border px-3 py-2 text-sm transition"
                            style={{
                              borderColor: active ? "#000" : "rgba(0,0,0,.12)",
                              background: active ? "#000" : "#fff",
                              color: active ? "#fff" : "#000",
                            }}
                          >
                            {variant.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {!loadingProductInfo && !variants.length ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    لا توجد خيارات متاحة لهذا المنتج حالياً.
                  </div>
                ) : null}

                {/* Quantity controls */}
                <div className="mt-5 pt-5 border-t border-black/10">
                  <label className="block text-xs tracking-widest uppercase text-black mb-3 font-semibold">
                    الكمية
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={decrementQty}
                      disabled={quantity <= 1 || adding}
                      className="h-9 w-9 sm:h-10 sm:w-10 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition-all duration-300"
                      aria-label="decrease quantity"
                    >
                      <FiMinus className="text-sm" />
                    </button>

                    <div className="flex-1 h-9 sm:h-10 border border-black/10 flex items-center justify-center">
                      <span className="text-base font-semibold text-black">
                        {quantity}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={incrementQty}
                      disabled={quantity >= 99 || adding}
                      className="h-9 w-9 sm:h-10 sm:w-10 border border-black/10 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition-all duration-300"
                      aria-label="increase quantity"
                    >
                      <FiPlus className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-5 flex items-center justify-between text-right">
                  <span className="text-xs tracking-widest uppercase text-black font-semibold">
                    المجموع
                  </span>
                  <span className="text-xl sm:text-2xl font-semibold text-black">
                    ₪{(
                      Number((selectedVariant?.discountedPrice ?? selectedVariant?.basePrice ?? product.price) || 0) *
                      quantity
                    ).toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={adding || loadingProductInfo || !mallId || !selectedVariant?.id}
                    className="flex-1 h-11 sm:h-12 bg-black text-white text-xs sm:text-sm tracking-widest uppercase font-semibold hover:bg-black/90 transition-all duration-300 disabled:opacity-60"
                  >
                    {adding ? "جارٍ الإضافة..." : "إضافة"}
                  </button>

                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 h-11 sm:h-12 border border-black/10 text-xs sm:text-sm tracking-widest uppercase font-semibold hover:bg-black hover:text-white transition-all duration-300"
                    >
                      إلغاء
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-black/5 to-transparent" />
    </div>
  );
}
