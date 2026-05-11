import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import Header from "../../components/customer/HomePageComponents/Header";
import CategoryBar from "../../components/customer/HomePageComponents/CategoryBar";
import FeaturedShops from "../../components/customer/MallPageComponents/FeaturedShops";
import Footer from "../../components/customer/HomePageComponents/Footer";
import SectionHeader from "../../components/customer/HomePageComponents/SectionHeader";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import ProductsRow from "../../components/customer/HomePageComponents/ProductsRow";

import MallInfoDialog from "../../components/customer/MallPageComponents/MallInfoStrip";
import AdvSection from "../../components/customer/HomePageComponents/AdvSection";

import MallSearch from "../../components/customer/MallPageComponents/MallSearch";

import { accountsApi, unwrapAccountPayload } from "../../api/accounts";
import { catalogApi, normalizeCatalogPage, unwrapCatalogPayload } from "../../api/catalog";
import { campaignsApi, unwrapCampaignPayload } from "../../api/campaigns";
import { hasProductDiscount, toProductCard } from "../../utils/catalogProducts";
import CatalogFilters from "../../components/customer/CatalogFilters";
import { buildCatalogFilterPayload } from "../../utils/catalogFilters";
import { mapAccountMall, mapAccountShop, mapCatalogCategory, mapDisplayedAd } from "../../utils/customerBackendMappers";

function mapMallService(service) {
  return {
    id: String(service?.serviceId ?? service?.id ?? ""),
    serviceId: service?.serviceId ?? service?.id ?? null,
    name: service?.name || "خدمة",
    description: service?.description || "",
    isActive: service?.isActive ?? true,
  };
}

function mapMallRestaurant(restaurant) {
  return {
    id: String(restaurant?.restaurantId ?? restaurant?.id ?? ""),
    restaurantId: restaurant?.restaurantId ?? restaurant?.id ?? null,
    name: restaurant?.name || "مطعم",
    description: restaurant?.description || "",
    cuisineType: restaurant?.cuisineType || "",
    locationInMall: restaurant?.locationInMall || "",
    logoUrl:
      restaurant?.logoImage?.smallFileUrl ||
      restaurant?.logoImage?.mediumFileUrl ||
      restaurant?.logoImage?.originalFileUrl ||
      "",
    isActive: restaurant?.isActive ?? true,
  };
}

function MallPage() {
  const { mallId } = useParams();
  const [mallData, setMallData] = useState(null);
  const [mallLoading, setMallLoading] = useState(false);
  const [mallError, setMallError] = useState("");
  const [liveCategories, setLiveCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");
  const categories = liveCategories;
  const [storesOfThisMall, setStoresOfThisMall] = useState([]);
  const [storesError, setStoresError] = useState("");
  const [liveProducts, setLiveProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [mallAdSlides, setMallAdSlides] = useState([]);
  const [mallAdsError, setMallAdsError] = useState("");
  const mallAllProducts = liveProducts;

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [filters, setFilters] = useState({
    categoryId: "",
    brandId: "",
    minPrice: "",
    maxPrice: "",
    targetedAudience: "",
    ageGroup: "",
    selectedOptionsByAttribute: {},
  });
  const mallSummaryScopeFilter = useMemo(
    () => ({
      mallId: Number(mallId),
      ...(selectedCategoryId ? { categoryId: Number(selectedCategoryId) } : {}),
      ...(selectedStoreId ? { storeId: Number(selectedStoreId) } : {}),
    }),
    [mallId, selectedCategoryId, selectedStoreId]
  );

  const filteredMallProducts = useMemo(() => {
    return mallAllProducts;
  }, [mallAllProducts]);

  const mallShopIdKey = useMemo(
    () =>
      storesOfThisMall
        .map((shop) => shop.shopId ?? shop.id)
        .filter((shopId) => shopId != null && shopId !== "")
        .map(String)
        .sort()
        .join(","),
    [storesOfThisMall]
  );

  useEffect(() => {
    let cancelled = false;
    setMallLoading(true);
    setMallError("");
    setStoresError("");

    Promise.allSettled([
      accountsApi.malls.byId(mallId),
      accountsApi.shops.activeByMall(mallId),
      accountsApi.mallServices.activeByMall(mallId),
      accountsApi.mallRestaurants.activeByMall(mallId),
    ])
      .then(([mallResult, shopsResult, servicesResult, restaurantsResult]) => {
        if (cancelled) return;

        if (mallResult.status === "fulfilled") {
          const mall = mapAccountMall(unwrapAccountPayload(mallResult.value));
          mall.services =
            servicesResult.status === "fulfilled"
              ? (unwrapAccountPayload(servicesResult.value) || []).map(mapMallService)
              : mall.services || [];
          mall.restaurants =
            restaurantsResult.status === "fulfilled"
              ? (unwrapAccountPayload(restaurantsResult.value) || []).map(mapMallRestaurant)
              : mall.restaurants || [];
          setMallData(mall);
          setMallError("");
        } else {
          setMallData(null);
          setMallError("تعذر تحميل بيانات المول.");
        }

        if (shopsResult.status === "fulfilled") {
          setStoresOfThisMall((unwrapAccountPayload(shopsResult.value) || []).map(mapAccountShop));
        } else {
          setStoresOfThisMall([]);
          setStoresError("تعذر تحميل متاجر المول.");
        }
      })
      .finally(() => {
        if (!cancelled) setMallLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mallId]);

  useEffect(() => {
    let cancelled = false;

    setProductsLoading(true);
    setProductsError("");
    setCategoriesError("");

    Promise.allSettled([
      catalogApi.categories.page({ isActive: true, page: 0, size: 60 }),
      catalogApi.products.publicPage(
        {
          mallId: Number(mallId),
          ...buildCatalogFilterPayload(filters),
          ...(selectedCategoryId ? { categoryId: Number(selectedCategoryId) } : {}),
          ...(selectedStoreId ? { storeId: Number(selectedStoreId) } : {}),
        },
        { page: 0, size: 40 }
      ),
    ])
      .then(([categoriesResult, productsResult]) => {
        if (cancelled) return;

        if (categoriesResult.status === "fulfilled") {
          setLiveCategories(normalizeCatalogPage(categoriesResult.value).content.map(mapCatalogCategory));
        } else {
          setLiveCategories([]);
          setCategoriesError("تعذر تحميل تصنيفات المول.");
        }

        if (productsResult.status === "fulfilled") {
          setLiveProducts(normalizeCatalogPage(productsResult.value).content.map(toProductCard));
        } else {
          setLiveProducts([]);
          setProductsError("تعذر تحميل منتجات المول.");
        }
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, mallId, selectedCategoryId, selectedStoreId]);

  useEffect(() => {
    let cancelled = false;

    if (!mallShopIdKey) {
      setMallAdSlides([]);
      setMallAdsError("");
      return () => {
        cancelled = true;
      };
    }

    setMallAdsError("");

    campaignsApi.ads.displayed()
      .then((response) => {
        if (cancelled) return;

        const mallShopIds = new Set(mallShopIdKey.split(",").filter(Boolean));
        const slides = (unwrapCampaignPayload(response) || [])
          .filter((ad) => mallShopIds.has(String(ad?.shopId ?? ad?.shop?.shopId ?? ad?.shop?.id ?? "")))
          .map(mapDisplayedAd)
          .filter(Boolean);

        setMallAdSlides(slides);
      })
      .catch(() => {
        if (!cancelled) {
          setMallAdSlides([]);
          setMallAdsError("تعذر تحميل إعلانات المول.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mallShopIdKey]);

  const mallFeaturedProducts = useMemo(() => filteredMallProducts.slice(0, 2), [filteredMallProducts]);

  const deals = useMemo(() => {
    const excludeIds = new Set(mallFeaturedProducts.map((p) => String(p.id)));
    return filteredMallProducts
      .filter((product) => hasProductDiscount(product))
      .filter((p) => !excludeIds.has(String(p.id)))
      .slice(0, 2);
  }, [filteredMallProducts, mallFeaturedProducts]);

  const mallRowProducts = useMemo(() => {
    const excludeIds = new Set([
      ...mallFeaturedProducts.map((p) => String(p.id)),
      ...deals.map((p) => String(p.id)),
    ]);
    return filteredMallProducts.filter((p) => !excludeIds.has(String(p.id))).slice(0, 20);
  }, [filteredMallProducts, mallFeaturedProducts, deals]);

  if (mallLoading && !mallData) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-black mb-2">جاري تحميل بيانات المول...</p>
        </div>
      </div>
    );
  }

  if (!mallData) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-black mb-2">{mallError || "المول غير موجود أو غير فعّال"}</p>
          <p className="text-sm text-black/60">معرّف المول: {mallId}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Header />

      <CategoryBar
        showMallStoreMenu={false}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        stores={storesOfThisMall}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
      />

      {mallAdsError && !mallAdSlides.length ? (
        <div className="border-b border-black/5 bg-white px-6 py-3 text-center text-sm font-light text-black/50">
          {mallAdsError}
        </div>
      ) : null}

      <AdvSection imgsUrl={mallAdSlides.length ? mallAdSlides : mallData.images} intervalMs={4000} page="mall" />

      <MallInfoDialog mall={mallData} stores={storesOfThisMall} />

      <MallSearch mallId={mallId} />

      <FeaturedShops shops={storesOfThisMall} mallName={mallData.name} />

      <section className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mb-8 md:mb-12" />

        {storesError || categoriesError || productsError ? (
          <div className="mb-6 border border-black/10 bg-white px-4 py-3 text-right text-sm font-light text-black/60">
            {storesError || categoriesError || productsError}
          </div>
        ) : null}

        <div className="mb-8">
          <CatalogFilters
            filters={filters}
            onChange={setFilters}
            compact
            summaryScope="public"
            fixedSummaryFilter={mallSummaryScopeFilter}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
          <div className="bg-white">
            <SectionHeader title="أبرز المنتجات" onViewAll={() => {}} />
            <div className="mt-6 md:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              {mallFeaturedProducts.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
              ))}
            </div>
            {!mallFeaturedProducts.length && productsLoading ? (
              <div className="mt-6 text-sm text-black/50">جاري تحميل المنتجات...</div>
            ) : null}
          </div>

          <div className="bg-white">
            <SectionHeader title="عروض رائعة" onViewAll={() => {}} />
            <div className="mt-6 md:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              {deals.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
              ))}
            </div>
            {!deals.length && !productsLoading ? (
              <div className="mt-6 text-sm text-black/40">لا توجد عروض متاحة حالياً.</div>
            ) : null}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mt-8 md:mt-12" />
      </section>

      <ProductsRow
        title={`منتجات ${mallData.name}`}
        products={mallRowProducts}
        onViewAll={() => {}}
        onAddToCart={() => {}}
      />

      <Footer />
    </div>
  );
}

export default MallPage;
