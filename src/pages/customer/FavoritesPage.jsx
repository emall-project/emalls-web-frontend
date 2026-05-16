import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiLoader, FiTrash2 } from "react-icons/fi";
import { IoHeartOutline } from "react-icons/io5";

import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { engagementApi } from "../../api/engagementApi";
import { customerApi } from "../../api/customerApi";
import { useFavorites } from "../../context/FavoritesContext";

const FAVORITE_SORT_OPTIONS = [
  { value: "newest", label: "الأحدث أولًا" },
  { value: "oldest", label: "الأقدم أولًا" },
  { value: "price-asc", label: "السعر: من الأقل للأعلى" },
  { value: "price-desc", label: "السعر: من الأعلى للأقل" },
  { value: "name-asc", label: "الاسم: أ - ي" },
  { value: "name-desc", label: "الاسم: ي - أ" },
];

function formatPrice(value) {
  return Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function favoriteMatchesSearch(favorite, query) {
  const needle = normalizeText(query);
  if (!needle) return true;

  const product = favorite?.product ?? {};
  const haystack = [
    favorite?.productId,
    product?.name,
    product?.shortDescription,
    product?.brandName,
    product?.storeName,
    product?.mallName,
  ]
    .map(normalizeText)
    .join(" ");

  return haystack.includes(needle);
}

function compareText(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""), "ar", {
    numeric: true,
    sensitivity: "base",
  });
}

function getFavoritePrice(favorite) {
  const product = favorite?.product ?? {};
  return Number(product.hasDiscount ? product.discountedPrice ?? 0 : product.basePrice ?? 0);
}

function getFavoriteRankValue(favorite) {
  const createdAt = Date.parse(favorite?.createdAt ?? "");
  if (Number.isFinite(createdAt)) return createdAt;

  const fallbackId = Number(favorite?.id ?? favorite?.productId ?? 0);
  return Number.isFinite(fallbackId) ? fallbackId : 0;
}

function sortFavoritesList(favorites, sortKey) {
  const list = [...favorites];

  list.sort((left, right) => {
    switch (sortKey) {
      case "oldest":
        return getFavoriteRankValue(left) - getFavoriteRankValue(right);
      case "price-asc":
        return getFavoritePrice(left) - getFavoritePrice(right);
      case "price-desc":
        return getFavoritePrice(right) - getFavoritePrice(left);
      case "name-asc":
        return compareText(left?.product?.name, right?.product?.name);
      case "name-desc":
        return compareText(right?.product?.name, left?.product?.name);
      case "newest":
      default:
        return getFavoriteRankValue(right) - getFavoriteRankValue(left);
    }
  });

  return list;
}

function FavoriteCard({ favorite, onRemove, navigate }) {
  const product = favorite.product ?? {};
  const imageUrl = product.imageUrl ?? "";
  const price = product.hasDiscount ? product.discountedPrice : product.basePrice;

  return (
    <article className="customer-panel-strong group overflow-hidden rounded-[28px]">
      <div className="relative overflow-hidden border-b border-[var(--customer-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name ?? ""}
            onClick={() => navigate(`/products/${favorite.productId}`)}
            className="aspect-square w-full cursor-pointer object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center text-5xl text-[var(--customer-muted-soft)]">
            —
          </div>
        )}

        <button
          type="button"
          onClick={() => onRemove(favorite)}
          className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--customer-border)] bg-white/90 text-[var(--customer-muted)] shadow-[var(--customer-shadow-soft)] hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
          aria-label="إزالة من المفضلة"
        >
          <FiTrash2 className="text-lg" />
        </button>
      </div>

      <div className="space-y-4 p-4 text-right sm:p-5">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate(`/products/${favorite.productId}`)}
            className="line-clamp-2 text-right text-sm font-bold leading-7 text-[var(--customer-text)] hover:text-[var(--customer-accent)] sm:text-[1rem]"
          >
            {product.name ?? "منتج"}
          </button>
          {product.shortDescription && (
            <p className="line-clamp-2 text-xs leading-6 text-[var(--customer-muted)] sm:text-[13px]">
              {product.shortDescription}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-end gap-2">
              <span className="text-lg font-extrabold tracking-tight text-[var(--customer-text)] sm:text-xl">
                ₪{formatPrice(price)}
              </span>
              {product.hasDiscount && product.basePrice != null && (
                <span className="pb-0.5 text-xs font-semibold text-[var(--customer-muted-soft)] line-through">
                  ₪{formatPrice(product.basePrice)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/products/${favorite.productId}`)}
            className="customer-secondary-btn rounded-2xl px-4 text-sm"
          >
            عرض المنتج
          </button>
        </div>
      </div>
    </article>
  );
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { toggleFav, refreshFavorites } = useFavorites();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortKey, setSortKey] = useState("newest");

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const list = await engagementApi.getFavoritesList();
      const hydrated = await customerApi.hydrateFavoritesWithImages(list ?? []);
      setFavorites(hydrated);
    } catch (loadError) {
      setError(loadError.message || "تعذر تحميل المفضلة");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemove = async (favorite) => {
    const previousFavorites = favorites;
    setFavorites((prev) =>
      prev.filter((item) => String(item.productId) !== String(favorite.productId))
    );

    try {
      await toggleFav(favorite.productId);
      await refreshFavorites();
    } catch (toggleError) {
      setFavorites(previousFavorites);
      setError(toggleError.message || "تعذر إزالة المنتج من المفضلة");
    }
  };

  const filteredFavorites = useMemo(() => {
    return favorites.filter((favorite) => {
      if (!favoriteMatchesSearch(favorite, searchQuery)) return false;

      const hasDiscount = Boolean(favorite?.product?.hasDiscount);
      if (priceFilter === "discounted") return hasDiscount;
      if (priceFilter === "regular") return !hasDiscount;
      return true;
    });
  }, [favorites, searchQuery, priceFilter]);

  const visibleFavorites = useMemo(
    () => sortFavoritesList(filteredFavorites, sortKey),
    [filteredFavorites, sortKey]
  );

  const hasActiveFilters = Boolean(searchQuery.trim()) || priceFilter !== "all";
  const hasCustomSort = sortKey !== "newest";
  const hasActiveControls = hasActiveFilters || hasCustomSort;

  const resetFilters = () => {
    setSearchQuery("");
    setPriceFilter("all");
    setSortKey("newest");
  };

  const filterFieldClass =
    "h-12 w-full rounded-2xl border border-[var(--customer-border)] bg-[var(--customer-surface-muted)] px-4 text-right text-sm font-semibold text-[var(--customer-text)] outline-none placeholder:text-[var(--customer-muted-soft)] focus:border-[var(--customer-accent)]";

  return (
    <div dir="rtl" className="customer-page">
      <Header />

      <div className="customer-shell px-4 py-8 sm:px-6 md:px-10 md:py-12">
        <section className="customer-panel-strong overflow-hidden rounded-[32px] p-6 sm:p-7 md:p-8">
          <div className="customer-page-header">
            <div>
              <span className="customer-kicker mb-4">قائمة مخصصة لك</span>
              <h1 className="customer-page-title">المفضلة</h1>
              <p className="customer-page-subtitle">
                المنتجات التي حفظتها تبقى هنا لسهولة الرجوع إليها لاحقًا ومقارنتها قبل الشراء.
              </p>
            </div>

            <div className="customer-icon-chip hidden sm:grid">
              <IoHeartOutline className="text-xl" />
            </div>
          </div>

          <div className="customer-divider mb-8" />

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="customer-panel h-[360px] animate-pulse rounded-[28px] bg-white/80" />
              ))}
            </div>
          ) : error ? (
            <div className="mx-auto max-w-md rounded-[28px] border border-rose-200 bg-rose-50/80 p-8 text-center">
              <FiAlertCircle className="mx-auto mb-3 text-3xl text-rose-400" />
              <p className="mb-5 text-sm leading-7 text-rose-700">{error}</p>
              <button type="button" onClick={loadFavorites} className="customer-primary-btn rounded-2xl px-6">
                إعادة المحاولة
              </button>
            </div>
          ) : favorites.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[var(--customer-border-strong)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-14 text-center">
              <IoHeartOutline className="mx-auto mb-4 text-5xl text-[var(--customer-muted-soft)]" />
              <h2 className="mb-2 text-xl font-extrabold text-[var(--customer-text)]">
                لا توجد منتجات في المفضلة
              </h2>
              <p className="mx-auto mb-6 max-w-md text-sm leading-7 text-[var(--customer-muted)]">
                احفظ المنتجات التي تعجبك لتبقى قريبة منك أثناء المقارنة أو قبل اتخاذ قرار الشراء.
              </p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="customer-primary-btn rounded-2xl px-6"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-[24px] border border-[var(--customer-border)] bg-white px-4 py-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_220px_220px_auto]">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-[var(--customer-muted-soft)]">
                      البحث داخل المفضلة
                    </span>
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="ابحث باسم المنتج أو الوصف أو المتجر"
                      className={filterFieldClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-[var(--customer-muted-soft)]">
                      نوع المنتجات
                    </span>
                    <select
                      value={priceFilter}
                      onChange={(event) => setPriceFilter(event.target.value)}
                      className={filterFieldClass}
                    >
                      <option value="all">الكل</option>
                      <option value="discounted">عليها خصم</option>
                      <option value="regular">بدون خصم</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-[var(--customer-muted-soft)]">
                      الترتيب
                    </span>
                    <select
                      value={sortKey}
                      onChange={(event) => setSortKey(event.target.value)}
                      className={filterFieldClass}
                    >
                      {FAVORITE_SORT_OPTIONS.map((option) => (
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

              <div className="mb-6 flex items-center justify-between gap-3 rounded-[24px] border border-[var(--customer-border)] bg-[var(--customer-surface-muted)] px-4 py-3">
                <p className="text-sm font-bold text-[var(--customer-text)]">
                  {hasActiveFilters
                    ? `عرض ${visibleFavorites.length} من أصل ${favorites.length} ${favorites.length === 1 ? "منتج محفوظ" : "منتجات محفوظة"}`
                    : `لديك ${favorites.length} ${favorites.length === 1 ? "منتج محفوظ" : "منتجات محفوظة"}`}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-sm font-bold text-[var(--customer-accent)] hover:underline"
                >
                  متابعة التسوق
                </button>
              </div>

              {visibleFavorites.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-[var(--customer-border-strong)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-10 text-center">
                  <h2 className="mb-2 text-xl font-extrabold text-[var(--customer-text)]">
                    لا توجد نتائج مطابقة
                  </h2>
                  <p className="mx-auto mb-6 max-w-md text-sm leading-7 text-[var(--customer-muted)]">
                    جرّب تغيير كلمات البحث أو نوع المنتجات حتى يظهر لك ما تبحث عنه داخل المفضلة.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="customer-primary-btn rounded-2xl px-6"
                  >
                    إعادة ضبط الفلاتر
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {visibleFavorites.map((favorite) => (
                    <FavoriteCard
                      key={favorite.id}
                      favorite={favorite}
                      onRemove={handleRemove}
                      navigate={navigate}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
