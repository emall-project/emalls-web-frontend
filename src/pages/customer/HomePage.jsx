import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/customer/HomePageComponents/Header";
import CategoryBar from "../../components/customer/HomePageComponents/CategoryBar";
import AdvSection from "../../components/customer/HomePageComponents/AdvSection";
import CategoriesBanner from "../../components/customer/HomePageComponents/CategoriesBanner";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import SectionHeader from "../../components/customer/HomePageComponents/SectionHeader";
import ProductsRow from "../../components/customer/HomePageComponents/ProductsRow";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { catalogApi, normalizeCatalogPage, unwrapCatalogPayload } from "../../api/catalog";
import { accountsApi, unwrapAccountPayload } from "../../api/accounts";
import { campaignsApi, unwrapCampaignPayload } from "../../api/campaigns";
import { hasProductDiscount, toProductCard } from "../../utils/catalogProducts";
import {
  mapAccountMall,
  mapAccountShop,
  mapCatalogCategory,
  mapDisplayedAd,
} from "../../utils/customerBackendMappers";

function asBackendId(value) {
  return value == null || value === "" ? null : Number(value);
}

function HeroFallback({ loading, error }) {
  return (
    <section
      className="relative grid w-full place-items-center bg-neutral-50 text-center"
      style={{
        height:
          "calc(100svh - var(--app-header-h, 72px) - var(--app-catbar-h, 56px))",
      }}
    >
      <div className="px-6">
        <p className="text-xs font-light tracking-[0.35em] text-black/40 uppercase">
          سوقنا
        </p>
        <h1 className="mt-3 text-2xl font-light tracking-wide text-black md:text-4xl">
          {loading ? "جاري تحميل العروض..." : "لا توجد عروض معروضة حالياً"}
        </h1>
        {error ? (
          <p className="mt-3 text-sm font-light text-black/50">
            تعذر تحميل عروض الصفحة الرئيسية من الخادم.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function HomePage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedMallId, setSelectedMallId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");

  const [malls, setMalls] = useState([]);
  const [stores, setStores] = useState([]);
  const [mallStoreLoading, setMallStoreLoading] = useState(false);
  const [mallStoreError, setMallStoreError] = useState("");

  const [heroSlides, setHeroSlides] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState("");

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCategoriesLoading(true);
    setCategoriesError("");

    catalogApi.categories.all({ isActive: true })
      .then((response) => {
        if (cancelled) return;
        setCategories((unwrapCatalogPayload(response) || []).map(mapCatalogCategory));
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
          setCategoriesError("تعذر تحميل التصنيفات.");
        }
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMallStoreLoading(true);
    setMallStoreError("");

    Promise.allSettled([
      accountsApi.malls.byStatus("ACTIVE"),
      accountsApi.shops.all({ status: "ACTIVE" }),
    ])
      .then(([mallsResult, shopsResult]) => {
        if (cancelled) return;
        setMalls(
          mallsResult.status === "fulfilled"
            ? (unwrapAccountPayload(mallsResult.value) || []).map(mapAccountMall)
            : []
        );
        setStores(
          shopsResult.status === "fulfilled"
            ? (unwrapAccountPayload(shopsResult.value) || []).map(mapAccountShop)
            : []
        );

        if (mallsResult.status === "rejected" || shopsResult.status === "rejected") {
          setMallStoreError("تعذر تحميل المولات والمتاجر.");
        }
      })
      .finally(() => {
        if (!cancelled) setMallStoreLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAdsLoading(true);
    setAdsError("");

    campaignsApi.ads.displayed()
      .then((response) => {
        if (cancelled) return;
        setHeroSlides(
          (unwrapCampaignPayload(response) || [])
            .map(mapDisplayedAd)
            .filter(Boolean)
        );
      })
      .catch(() => {
        if (!cancelled) {
          setHeroSlides([]);
          setAdsError("تعذر تحميل العروض.");
        }
      })
      .finally(() => {
        if (!cancelled) setAdsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const filter = {};
    const categoryId = asBackendId(selectedCategoryId);
    const mallId = asBackendId(selectedMallId);
    const storeId = asBackendId(selectedStoreId);

    if (categoryId) filter.categoryId = categoryId;
    if (storeId) {
      filter.storeId = storeId;
    } else if (mallId) {
      filter.mallId = mallId;
    }

    setProductsLoading(true);
    setProductsError("");

    catalogApi.products.publicPage(filter, { page: 0, size: 30 })
      .then((response) => {
        if (!cancelled) {
          setProducts(normalizeCatalogPage(response).content.map(toProductCard));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setProductsError("تعذر تحميل المنتجات.");
        }
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId, selectedMallId, selectedStoreId]);

  const deals = useMemo(
    () => products.filter((product) => hasProductDiscount(product)).slice(0, 5),
    [products]
  );

  const featured = useMemo(() => products.slice(0, 5), [products]);

  const bestSellers = useMemo(() => products.slice(0, 10), [products]);
  const forYou = useMemo(() => products.slice(5, 15), [products]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <CategoryBar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        malls={malls}
        stores={stores}
        selectedStoreId={selectedStoreId}
        selectedMallId={selectedMallId}
        onSelectMall={setSelectedMallId}
        onSelectStore={setSelectedStoreId}
      />

      {categoriesError || mallStoreError ? (
        <div className="border-b border-black/5 bg-white px-6 py-3 text-center text-sm font-light text-black/50">
          {categoriesError || mallStoreError}
        </div>
      ) : mallStoreLoading && !malls.length && !stores.length ? (
        <div className="border-b border-black/5 bg-white px-6 py-3 text-center text-sm font-light text-black/40">
          جاري تحميل المولات والمتاجر...
        </div>
      ) : null}

      {/* Hero Section */}
      {heroSlides.length ? (
        <AdvSection imgsUrl={heroSlides} intervalMs={5000} page="home" />
      ) : (
        <HeroFallback loading={adsLoading} error={adsError} />
      )}

      {/* Categories Banner */}
      <CategoriesBanner categories={categories} onSelectCategory={setSelectedCategoryId} />
      {!categories.length && categoriesLoading ? (
        <div className="px-6 py-8 text-center text-sm font-light text-black/50">
          جاري تحميل التصنيفات...
        </div>
      ) : null}

      {/* Featured */}
      <section className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-10 md:py-14">
        <SectionHeader title="أبرز المنتجات" onViewAll={() => {}} />
        <div className="mt-5 sm:mt-6 md:mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {featured.map((p) => (
            <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
          ))}
        </div>
        {!featured.length && productsLoading ? (
          <div className="mt-6 text-sm text-black/50">جاري تحميل المنتجات...</div>
        ) : null}
        {!featured.length && !productsLoading ? (
          <div className="mt-6 text-sm text-black/50">
            {productsError || "لا توجد منتجات متاحة حالياً."}
          </div>
        ) : null}
      </section>

      {/* Deals */}
      <section className="w-full">
        {/* Banner header */}
        <div
          className="relative w-full overflow-hidden py-10 sm:py-12 md:py-16"
          style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 60%, #111111 100%)" }}
        >
          {/* Gold shine sweep */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(120deg, transparent 30%, rgba(212,175,55,0.08) 50%, transparent 70%)" }} />
          {/* Subtle top gold line */}
          <div className="absolute top-0 inset-x-0 h-px"
            style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.6), transparent)" }} />
          {/* Subtle bottom gold line */}
          <div className="absolute bottom-0 inset-x-0 h-px"
            style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.4), transparent)" }} />

          <div className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <span
                  className="inline-block text-[9px] sm:text-[10px] font-semibold tracking-[0.3em] uppercase px-3 py-1 mb-3 border"
                  style={{ color: "#d4af37", borderColor: "rgba(212,175,55,0.5)" }}
                >
                  EXCLUSIVE SALE
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-[0.12em]">
                  عروض رائعة
                </h2>
                <p className="mt-2 text-white/40 text-[10px] sm:text-xs font-light tracking-[0.25em] uppercase">
                  أسعار استثنائية — لفترة محدودة
                </p>
              </div>

              <button
                className="shrink-0 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-light px-5 sm:px-6 py-2.5 sm:py-3 border transition-all duration-300"
                style={{ color: "#d4af37", borderColor: "rgba(212,175,55,0.5)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#d4af37"; e.currentTarget.style.color = "#0a0a0a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#d4af37"; }}
              >
                عرض الكل
              </button>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="w-full bg-white border-b border-black/5 py-8 sm:py-10 md:py-12">
          <div className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {deals.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
              ))}
            </div>
            {!deals.length && productsLoading ? (
              <div className="py-8 text-center text-sm font-light text-black/50">
                جاري تحميل العروض...
              </div>
            ) : null}
            {!deals.length && !productsLoading ? (
              <div className="py-8 text-center text-sm font-light text-black/50">
                لا توجد عروض متاحة حالياً.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Products Rows */}
      <ProductsRow
        title="الأكثر ملائمة لك"
        products={forYou}
        onViewAll={() => {}}
        onAddToCart={() => {}}
      />

      <ProductsRow
        title="الأكثر مبيعًا"
        products={bestSellers}
        onViewAll={() => {}}
        onAddToCart={() => {}}
      />

      <Footer />
    </div>
  );
}

export default HomePage;
