import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoArrowForward,
  IoBusinessOutline,
  IoCartOutline,
  IoStorefrontOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { FiAlertCircle, FiLoader, FiMinus, FiPlus } from "react-icons/fi";

import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { cartApi } from "../../api/cartApi";
import { useCart } from "../../context/CartContext";

const CART_SORT_OPTIONS = [
  { value: "default", label: "الترتيب الافتراضي" },
  { value: "mall-asc", label: "المول: أ - ي" },
  { value: "mall-desc", label: "المول: ي - أ" },
  { value: "name-asc", label: "المنتجات: أ - ي" },
  { value: "name-desc", label: "المنتجات: ي - أ" },
  { value: "price-asc", label: "السعر: من الأقل للأعلى" },
  { value: "price-desc", label: "السعر: من الأعلى للأقل" },
];

function fmt(value) {
  return Number(value ?? 0).toFixed(2);
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function compareText(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""), "ar", {
    numeric: true,
    sensitivity: "base",
  });
}

function getCartItemSortPrice(item) {
  const effectiveUnitPrice = Number(item?.effectiveUnitPrice);
  if (Number.isFinite(effectiveUnitPrice) && effectiveUnitPrice > 0) return effectiveUnitPrice;

  const lineTotal = Number(item?.lineTotal);
  if (Number.isFinite(lineTotal) && lineTotal > 0) {
    const quantity = Number(item?.quantity ?? 1);
    return quantity > 0 ? lineTotal / quantity : lineTotal;
  }

  return 0;
}

function sortCartItems(items, sortKey) {
  const list = [...items];

  list.sort((left, right) => {
    switch (sortKey) {
      case "name-asc":
        return compareText(left?.productName, right?.productName);
      case "name-desc":
        return compareText(right?.productName, left?.productName);
      case "price-asc":
        return getCartItemSortPrice(left) - getCartItemSortPrice(right);
      case "price-desc":
        return getCartItemSortPrice(right) - getCartItemSortPrice(left);
      default:
        return 0;
    }
  });

  return list;
}

function sortCartGroups(carts, sortKey) {
  if (sortKey !== "mall-asc" && sortKey !== "mall-desc") {
    return carts;
  }

  return [...carts].sort((left, right) => {
    const leftName = left?.mallInfo?.name ?? `مول ${left?.mallId ?? ""}`;
    const rightName = right?.mallInfo?.name ?? `مول ${right?.mallId ?? ""}`;

    return sortKey === "mall-desc"
      ? compareText(rightName, leftName)
      : compareText(leftName, rightName);
  });
}

function CartItemRow({ item, onQtyChange, onRemove, busy }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
        {item.productInfo?.imageUrl ? (
          <img src={item.productInfo.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
        ) : (
          <IoStorefrontOutline className="text-3xl text-slate-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-7 text-slate-900 md:text-base">{item.productName}</p>
        {item.variantName ? <p className="mt-1 text-xs text-slate-500">{item.variantName}</p> : null}
        {item.storeInfo?.name ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <IoStorefrontOutline className="text-xs" />
            {item.storeInfo.name}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => onQtyChange(item.cartItemId, item.quantity - 1)}
              disabled={busy}
              className="flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              {busy ? <FiLoader size={12} className="animate-spin" /> : <FiMinus size={12} />}
            </button>
            <span className="flex h-10 w-12 items-center justify-center border-x border-slate-200 text-sm font-bold text-slate-900">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQtyChange(item.cartItemId, item.quantity + 1)}
              disabled={busy}
              className="flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              <FiPlus size={12} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-extrabold text-slate-900 md:text-base">₪{fmt(item.lineTotal)}</p>
              {item.quantity > 1 ? (
                <p className="text-xs text-slate-400">
                  ₪{fmt(item.effectiveUnitPrice)} × {item.quantity}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.cartItemId)}
              disabled={busy}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-40"
            >
              <IoTrashOutline size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MallCartCard({ cart, visibleItems, onUpdate }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useCart();

  const withBusy = async (fn) => {
    setBusy(true);
    setError("");
    try {
      const updated = await fn();
      if (updated) onUpdate(updated);
      refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleQtyChange = (cartItemId, newQty) => {
    if (newQty < 1) {
      withBusy(() => cartApi.removeItem(cartItemId));
    } else {
      withBusy(() => cartApi.updateQuantity(cartItemId, newQty));
    }
  };

  const handleRemove = (cartItemId) => withBusy(() => cartApi.removeItem(cartItemId));
  const handleClear = () => withBusy(() => cartApi.clearCart(cart.mallId));

  const mallName = cart.mallInfo?.name ?? `مول ${cart.mallId}`;
  const items = visibleItems ?? cart.items ?? [];
  const isPartiallyFiltered = items.length !== (cart.items ?? []).length;

  return (
    <div className="customer-panel-strong overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/malls/${cart.mallId}`)}
            className="flex items-center gap-2 text-sm font-bold text-slate-800 hover:text-blue-700"
          >
            <div className="customer-icon-chip h-10 w-10 text-sm">
              <IoBusinessOutline />
            </div>
            {mallName}
          </button>
          {isPartiallyFiltered ? (
            <p className="mt-2 text-xs text-slate-400">
              عرض {items.length} من أصل {(cart.items ?? []).length} منتج داخل هذه السلة
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleClear}
          disabled={busy}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
        >
          تفريغ السلة
        </button>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">لا توجد منتجات مطابقة داخل هذه السلة.</p>
        ) : (
          items.map((item) => (
            <CartItemRow
              key={item.cartItemId}
              item={item}
              onQtyChange={handleQtyChange}
              onRemove={handleRemove}
              busy={busy}
            />
          ))
        )}
      </div>

      {error ? (
        <div className="mx-5 mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 sm:mx-6">
          <FiAlertCircle size={14} />
          {error}
        </div>
      ) : null}

      {(cart.items ?? []).length > 0 ? (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>المجموع الفرعي</span>
              <span>₪{fmt(cart.totalAmount)}</span>
            </div>
            {cart.deliveryFee != null ? (
              <div className="flex justify-between text-slate-500">
                <span>رسوم التوصيل</span>
                <span>₪{fmt(cart.deliveryFee)}</span>
              </div>
            ) : null}
            {cart.grandTotal != null ? (
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900">
                <span>الإجمالي</span>
                <span>₪{fmt(cart.grandTotal)}</span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/checkout/${cart.mallId}`)}
            disabled={busy || (cart.items ?? []).length === 0}
            className="customer-primary-btn mt-5 w-full disabled:opacity-50"
          >
            {busy ? <FiLoader size={14} className="animate-spin" /> : <IoArrowForward className="text-base" />}
            متابعة إلى الدفع
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMallId, setSelectedMallId] = useState("");
  const [selectedStoreName, setSelectedStoreName] = useState("");
  const [sortKey, setSortKey] = useState("default");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await cartApi.getActiveCarts();
      setCarts(Array.isArray(data) ? data.filter((cart) => (cart.items ?? []).length > 0) : []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCartUpdate = (updatedCart) => {
    setCarts((prev) =>
      (updatedCart.items ?? []).length === 0
        ? prev.filter((cart) => cart.mallId !== updatedCart.mallId)
        : prev.map((cart) => (cart.mallId === updatedCart.mallId ? updatedCart : cart))
    );
  };

  const mallOptions = useMemo(() => {
    return carts.map((cart) => ({
      value: String(cart.mallId),
      label: cart.mallInfo?.name ?? `مول ${cart.mallId}`,
    }));
  }, [carts]);

  const storeOptions = useMemo(() => {
    const names = new Set();

    carts.forEach((cart) => {
      if (selectedMallId && String(cart.mallId) !== String(selectedMallId)) return;

      (cart.items ?? []).forEach((item) => {
        const name = item?.storeInfo?.name;
        if (name) names.add(name);
      });
    });

    return Array.from(names)
      .sort((left, right) => left.localeCompare(right, "ar"))
      .map((name) => ({ value: name, label: name }));
  }, [carts, selectedMallId]);

  useEffect(() => {
    if (!selectedStoreName) return;

    const storeStillAvailable = storeOptions.some((option) => option.value === selectedStoreName);
    if (!storeStillAvailable) {
      setSelectedStoreName("");
    }
  }, [selectedStoreName, storeOptions]);

  const filteredCarts = useMemo(() => {
    const needle = normalizeText(searchQuery);

    const visibleCarts = carts
      .map((cart) => {
        if (selectedMallId && String(cart.mallId) !== String(selectedMallId)) {
          return null;
        }

        const mallName = cart.mallInfo?.name ?? `مول ${cart.mallId}`;
        const visibleItems = (cart.items ?? []).filter((item) => {
          if (selectedStoreName && item?.storeInfo?.name !== selectedStoreName) return false;
          if (!needle) return true;

          const haystack = [
            item?.productName,
            item?.variantName,
            item?.storeInfo?.name,
            mallName,
          ]
            .map(normalizeText)
            .join(" ");

          return haystack.includes(needle);
        });

        if (!visibleItems.length) return null;

        return {
          ...cart,
          visibleItems: sortCartItems(visibleItems, sortKey),
        };
      })
      .filter(Boolean);

    return sortCartGroups(visibleCarts, sortKey);
  }, [carts, searchQuery, selectedMallId, selectedStoreName, sortKey]);

  const totalItems = carts.reduce((sum, cart) => sum + (cart.items ?? []).length, 0);
  const filteredItemCount = filteredCarts.reduce(
    (sum, cart) => sum + (cart.visibleItems ?? []).length,
    0
  );
  const hasActiveFilters =
    Boolean(searchQuery.trim()) || Boolean(selectedMallId) || Boolean(selectedStoreName);
  const hasCustomSort = sortKey !== "default";
  const hasActiveControls = hasActiveFilters || hasCustomSort;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedMallId("");
    setSelectedStoreName("");
    setSortKey("default");
  };

  const filterFieldClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-right text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--customer-accent)]";

  return (
    <div dir="rtl" className="customer-page">
      <Header />

      <div className="customer-shell px-4 py-8 sm:px-6 md:px-12 md:py-10">
        <div className="customer-page-header customer-panel-strong px-5 py-5 sm:px-6 md:px-8">
          <div>
            <span className="customer-kicker">
              <IoCartOutline />
              سلة التسوق
            </span>
            <h1 className="customer-page-title mt-4">مراجعة منتجاتك قبل الدفع</h1>
            <p className="customer-page-subtitle">
              السلة مقسومة حسب المول حتى تبقى عملية التوصيل والترتيب أوضح وأسهل.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!loading && carts.length > 0 ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                {totalItems} منتج
              </span>
            ) : null}
            <button type="button" onClick={() => navigate(-1)} className="customer-secondary-btn">
              <IoArrowForward className="text-base" />
              رجوع
            </button>
          </div>
        </div>

        <div className="customer-divider my-8" />

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <FiLoader size={26} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="customer-panel-strong mx-auto max-w-md px-8 py-10 text-center">
            <FiAlertCircle className="mx-auto mb-4 text-4xl text-slate-300" />
            <p className="mb-5 text-sm leading-7 text-slate-600">{error}</p>
            <button type="button" onClick={load} className="customer-primary-btn">
              إعادة المحاولة
            </button>
          </div>
        ) : carts.length === 0 ? (
          <div className="customer-panel-strong px-8 py-16 text-center">
            <IoCartOutline className="mx-auto mb-5 text-5xl text-slate-300" />
            <h2 className="text-2xl font-extrabold text-slate-900">سلتك فارغة</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              أضف منتجاتك المفضلة أولًا، ثم عد إلى هنا لمراجعة الطلب وإتمام الشراء.
            </p>
            <button type="button" onClick={() => navigate("/")} className="customer-primary-btn mt-6">
              ابدأ التسوق
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="customer-panel-strong px-5 py-5 sm:px-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_180px_180px_180px_auto]">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-500">ابحث داخل السلة</span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="ابحث باسم المنتج أو المتجر أو المول"
                    className={filterFieldClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-500">المول</span>
                  <select
                    value={selectedMallId}
                    onChange={(event) => setSelectedMallId(event.target.value)}
                    className={filterFieldClass}
                  >
                    <option value="">كل المولات</option>
                    {mallOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-500">المتجر</span>
                  <select
                    value={selectedStoreName}
                    onChange={(event) => setSelectedStoreName(event.target.value)}
                    className={filterFieldClass}
                  >
                    <option value="">كل المتاجر</option>
                    {storeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-500">الترتيب</span>
                  <select
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value)}
                    className={filterFieldClass}
                  >
                    {CART_SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={resetFilters}
                    disabled={!hasActiveControls}
                    className="customer-secondary-btn h-12 w-full justify-center rounded-2xl disabled:opacity-40"
                  >
                    مسح الفلاتر
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-bold text-slate-800">
                {hasActiveFilters
                  ? `عرض ${filteredItemCount} من أصل ${totalItems} منتج داخل السلة`
                  : `لديك ${totalItems} منتج داخل السلة`}
              </p>
              {hasActiveFilters ? (
                <p className="text-xs text-slate-500">إجماليات كل سلة تبقى محسوبة على كامل محتواها الفعلي.</p>
              ) : null}
            </div>

            {filteredCarts.length === 0 ? (
              <div className="customer-panel-strong px-8 py-14 text-center">
                <h2 className="text-2xl font-extrabold text-slate-900">لا توجد نتائج مطابقة</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  جرّب تعديل كلمات البحث أو اختر مولًا أو متجرًا مختلفًا لإظهار المنتجات المطلوبة.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="customer-primary-btn mt-6"
                >
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              filteredCarts.map((cart) => (
                <MallCartCard
                  key={cart.mallId}
                  cart={cart}
                  visibleItems={cart.visibleItems}
                  onUpdate={handleCartUpdate}
                />
              ))
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm font-semibold text-slate-500 hover:text-blue-700"
              >
                متابعة التسوق
              </button>
            </div>
          </div>
        )}

        <div className="customer-divider mt-12" />
      </div>

      <Footer />
    </div>
  );
}
