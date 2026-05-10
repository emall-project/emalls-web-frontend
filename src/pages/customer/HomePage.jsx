import React, { useEffect, useMemo, useState } from "react";
import { FiGrid, FiMapPin, FiRefreshCw, FiShoppingBag, FiTag } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/customer/HomePageComponents/Header";
import CategoryBar from "../../components/customer/HomePageComponents/CategoryBar";
import AdvSection from "../../components/customer/HomePageComponents/AdvSection";
import CategoriesBanner from "../../components/customer/HomePageComponents/CategoriesBanner";
import ProductsRow from "../../components/customer/HomePageComponents/ProductsRow";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { catalogApi, normalizeCatalogPage, unwrapCatalogPayload } from "../../api/catalog";
import { accountsApi, unwrapAccountPayload } from "../../api/accounts";
import { campaignsApi, unwrapCampaignPayload } from "../../api/campaigns";
import { orderHubApi, unwrapOrderHubPayload } from "../../api/orderHub";
import { toProductCard } from "../../utils/catalogProducts";
import {
  mapAccountMall,
  mapAccountShop,
  mapCatalogBrand,
  mapCatalogCategory,
  mapDisplayedAd,
} from "../../utils/customerBackendMappers";

const HOME_ROW_LIMIT = 10;

function HomeNotice({ children, tone = "muted" }) {
  const toneClass =
    tone === "error"
      ? "border-red-100 bg-red-50 text-red-700"
      : "border-black/5 bg-neutral-50 text-black/55";

  return (
    <div className={`border-b px-6 py-3 text-center text-sm font-light ${toneClass}`}>
      {children}
    </div>
  );
}

function HomeStatsStrip({ productsCount, categoriesCount, mallsCount, storesCount }) {
  const items = [
    { icon: FiGrid, label: "تصنيفات", value: categoriesCount },
    { icon: FiShoppingBag, label: "منتجات معروضة", value: productsCount },
    { icon: FiMapPin, label: "مولات", value: mallsCount },
    { icon: FiTag, label: "متاجر", value: storesCount },
  ];

  return (
    <section className="border-y border-black/5 bg-white">
      <div className="mx-auto grid max-w-400 grid-cols-2 gap-px px-4 sm:grid-cols-4 md:px-12 2xl:max-w-[1920px]">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-center gap-3 py-4 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-black">
              <Icon size={15} />
            </span>
            <div className="text-right">
              <div className="text-base font-semibold text-black">{value || 0}</div>
              <div className="text-[10px] font-semibold tracking-[0.2em] text-black/45">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductsEmptyState({ loading, error, emptyText }) {
  return (
    <div className="mt-6 flex min-h-28 items-center justify-center border border-dashed border-black/10 bg-neutral-50 px-6 text-center text-sm font-light text-black/50">
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <FiRefreshCw className="animate-spin" size={14} />
          جاري تحميل المنتجات...
        </span>
      ) : (
        error || emptyText
      )}
    </div>
  );
}

function productIdFromRow(row) {
  const id = row?.productId ?? row?.id;
  const numericId = Number(id);
  return Number.isFinite(numericId) ? numericId : null;
}

function orderedUniqueProductIds(rows = []) {
  const seen = new Set();
  const ids = [];

  rows.forEach((row) => {
    const id = productIdFromRow(row);
    if (id != null && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  });

  return ids;
}

function orderProductsByIds(products = [], productIds = []) {
  const productById = new Map(
    products
      .map((product) => [String(product?.id), product])
      .filter(([id]) => id && id !== "undefined")
  );

  return productIds
    .map((id) => productById.get(String(id)))
    .filter(Boolean);
}

async function hydrateProductsByIds(productIds = []) {
  const ids = orderedUniqueProductIds(productIds.map((productId) => ({ productId })));
  if (!ids.length) {
    return [];
  }

  const response = await catalogApi.products.byIds(ids);
  const products = (unwrapCatalogPayload(response) || []).map(toProductCard);
  return orderProductsByIds(products, ids);
}

function HomeProductRow({ title, products, loading, error, emptyText, onViewAll }) {
  if (products.length) {
    return <ProductsRow title={title} products={products} onViewAll={onViewAll} />;
  }

  return (
    <section className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-10">
      <div className="border-b border-black/10 pb-4 text-right">
        <h2 className="text-2xl font-light tracking-wide text-black">{title}</h2>
      </div>
      <ProductsEmptyState loading={loading} error={error} emptyText={emptyText} />
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mt-8" />
    </section>
  );
}

function HeroFallback({ loading, error }) {
  return (
    <section
      className="relative grid w-full place-items-center bg-neutral-50 text-center"
      style={{
        height:
          "calc(100svh - var(--app-header-h, 72px) - var(--app-catbar-h, 56px) - 52px)",
        minHeight: "430px",
        maxHeight: "760px",
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

function imageFromMall(mall) {
  return mall?.images?.[0]?.image || mall?.logoUrl || "";
}

function DiscoveryCard({ item, type, onFilter }) {
  const image = type === "mall" ? imageFromMall(item) : item?.image || item?.logoUrl;
  const href = type === "mall" ? `/malls/${item.id}` : `/stores/${item.id}`;
  const meta =
    type === "mall"
      ? item.location || item.city || "مول نشط"
      : item.mallName || item.category || "متجر نشط";

  return (
    <div className="group relative overflow-hidden border border-black/10 bg-white">
      <Link to={href} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
          {image ? (
            <img
              src={image}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full place-items-center text-4xl font-light text-black/20">
              {item.name?.[0] || "س"}
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 text-right">
        <Link to={href} className="block text-base font-semibold text-black hover:underline">
          {item.name}
        </Link>
        <p className="mt-1 truncate text-xs text-black/45">{meta}</p>
        <button
          type="button"
          onClick={() => onFilter?.(item.id)}
          className="mt-4 w-full border border-black/10 px-4 py-2 text-xs font-semibold text-black transition hover:border-black hover:bg-black hover:text-white"
        >
          عرض المنتجات
        </button>
      </div>
    </div>
  );
}

function LiveDiscoverySection({
  malls,
  stores,
  loading,
  error,
  onSelectMall,
  onSelectStore,
}) {
  const featuredMalls = malls.slice(0, 3);
  const featuredStores = stores.slice(0, 4);

  if (!featuredMalls.length && !featuredStores.length && !loading && !error) {
    return null;
  }

  return (
    <section className="border-b border-black/5 bg-neutral-50 py-10 md:py-14">
      <div className="mx-auto max-w-400 px-4 sm:px-6 md:px-12 2xl:max-w-[1920px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-right">
            <p className="text-[10px] font-semibold text-black/35">من حسابات ومولات مباشرة</p>
            <h2 className="mt-2 text-2xl font-light text-black">تسوق حسب المول أو المتجر</h2>
          </div>
          <Link
            to="/search"
            className="w-fit border border-black/10 px-5 py-2 text-xs font-semibold text-black transition hover:border-black hover:bg-black hover:text-white"
          >
            بحث شامل
          </Link>
        </div>

        {error ? (
          <div className="mt-5 border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading && !featuredMalls.length && !featuredStores.length ? (
          <div className="mt-6 flex min-h-28 items-center justify-center border border-dashed border-black/10 bg-white px-6 text-sm text-black/50">
            <FiRefreshCw className="ml-2 animate-spin" size={14} />
            جاري تحميل المولات والمتاجر...
          </div>
        ) : null}

        {featuredMalls.length ? (
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {featuredMalls.map((mall) => (
              <DiscoveryCard
                key={mall.id}
                item={mall}
                type="mall"
                onFilter={(id) => {
                  onSelectStore(null);
                  onSelectMall(id);
                }}
              />
            ))}
          </div>
        ) : null}

        {featuredStores.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredStores.map((store) => (
              <DiscoveryCard
                key={store.id}
                item={store}
                type="store"
                onFilter={(id) => {
                  onSelectMall(null);
                  onSelectStore(id);
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BrandsHomeSection({ brands = [], loading, error }) {
  const featuredBrands = brands.slice(0, 10);

  if (!featuredBrands.length && !loading && !error) {
    return null;
  }

  return (
    <section className="border-b border-black/5 bg-white py-10 md:py-14">
      <div className="mx-auto max-w-400 px-4 sm:px-6 md:px-12 2xl:max-w-[1920px]">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-right">
            <p className="text-[10px] font-semibold text-black/35">براندات مباشرة</p>
            <h2 className="mt-2 text-2xl font-light text-black">تسوق حسب البراند</h2>
          </div>
          <Link
            to="/search"
            className="w-fit border border-black/10 px-5 py-2 text-xs font-semibold text-black transition hover:border-black hover:bg-black hover:text-white"
          >
            عرض كل المنتجات
          </Link>
        </div>

        {error ? (
          <div className="mb-5 border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading && !featuredBrands.length ? (
          <div className="flex min-h-24 items-center justify-center border border-dashed border-black/10 bg-neutral-50 text-sm text-black/50">
            <FiRefreshCw className="ml-2 animate-spin" size={14} />
            جاري تحميل البراندات...
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {featuredBrands.map((brand) => (
            <Link
              key={brand.id}
              to={`/brands/${brand.id}`}
              className="group flex min-h-36 flex-col items-center justify-center border border-black/10 bg-neutral-50 p-4 text-center transition hover:border-black hover:bg-white"
            >
              <div className="grid h-16 w-16 place-items-center overflow-hidden bg-white">
                {brand.imageUrl ? (
                  <img src={brand.imageUrl} alt={brand.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                ) : (
                  <span className="text-2xl font-light text-black/25">{brand.name?.[0] || "ب"}</span>
                )}
              </div>
              <div className="mt-4 line-clamp-2 text-sm font-semibold text-black group-hover:underline">
                {brand.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [selectedMallId, setSelectedMallId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");

  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandsError, setBrandsError] = useState("");

  const [malls, setMalls] = useState([]);
  const [stores, setStores] = useState([]);
  const [mallStoreLoading, setMallStoreLoading] = useState(false);
  const [mallStoreError, setMallStoreError] = useState("");

  const [heroSlides, setHeroSlides] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState("");

  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [suggestedError, setSuggestedError] = useState("");

  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [bestSellersLoading, setBestSellersLoading] = useState(false);
  const [bestSellersError, setBestSellersError] = useState("");

  const [saleProducts, setSaleProducts] = useState([]);
  const [saleProductsLoading, setSaleProductsLoading] = useState(false);
  const [saleProductsError, setSaleProductsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCategoriesLoading(true);
    setCategoriesError("");

    Promise.all([
      catalogApi.categories.all({ isActive: true }),
      catalogApi.categories.tree().catch(() => null),
    ])
      .then(([flatResponse, treeResponse]) => {
        if (cancelled) return;
        setCategories((unwrapCatalogPayload(flatResponse) || []).map(mapCatalogCategory));
        setCategoryTree((unwrapCatalogPayload(treeResponse) || []).map(mapCatalogCategory));
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
          setCategoryTree([]);
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
    setBrandsLoading(true);
    setBrandsError("");

    catalogApi.brands.page({ isActive: true, page: 0, size: 10 })
      .then((response) => {
        if (!cancelled) setBrands(normalizeCatalogPage(response).content.map(mapCatalogBrand));
      })
      .catch(() => {
        if (!cancelled) {
          setBrands([]);
          setBrandsError("تعذر تحميل البراندات.");
        }
      })
      .finally(() => {
        if (!cancelled) setBrandsLoading(false);
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
    setSuggestedLoading(true);
    setSuggestedError("");

    catalogApi.products.random(HOME_ROW_LIMIT)
      .then((response) => {
        if (!cancelled) {
          setSuggestedProducts((unwrapCatalogPayload(response) || []).map(toProductCard));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestedProducts([]);
          setSuggestedError("تعذر تحميل المنتجات المقترحة.");
        }
      })
      .finally(() => {
        if (!cancelled) setSuggestedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setBestSellersLoading(true);
    setBestSellersError("");

    orderHubApi.dashboard.publicMostOrdered(HOME_ROW_LIMIT)
      .then(async (response) => {
        const rows = unwrapOrderHubPayload(response) || [];
        const productIds = orderedUniqueProductIds(rows);
        const products = await hydrateProductsByIds(productIds);
        if (!cancelled) {
          setBestSellerProducts(products);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBestSellerProducts([]);
          setBestSellersError("تعذر تحميل المنتجات الأكثر مبيعًا.");
        }
      })
      .finally(() => {
        if (!cancelled) setBestSellersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSaleProductsLoading(true);
    setSaleProductsError("");

    campaignsApi.offers.publicActiveProducts(HOME_ROW_LIMIT)
      .then(async (response) => {
        const rows = unwrapCampaignPayload(response) || [];
        const productIds = orderedUniqueProductIds(rows);
        const products = await hydrateProductsByIds(productIds);
        if (!cancelled) {
          setSaleProducts(products);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSaleProducts([]);
          setSaleProductsError("تعذر تحميل العروضات المميزة.");
        }
      })
      .finally(() => {
        if (!cancelled) setSaleProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const productsCount = useMemo(() => {
    const ids = new Set();
    [...suggestedProducts, ...bestSellerProducts, ...saleProducts].forEach((product) => {
      if (product?.id != null) ids.add(String(product.id));
    });
    return ids.size;
  }, [bestSellerProducts, saleProducts, suggestedProducts]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <CategoryBar
        categories={categories}
        selectedCategoryId={null}
        onSelectCategory={(categoryId) => {
          if (categoryId) {
            navigate(`/categories/${categoryId}`);
          } else {
            navigate("/search");
          }
        }}
        malls={malls}
        stores={stores}
        selectedStoreId={selectedStoreId}
        selectedMallId={selectedMallId}
        onSelectMall={setSelectedMallId}
        onSelectStore={setSelectedStoreId}
      />

      {categoriesError ? <HomeNotice tone="error">{categoriesError}</HomeNotice> : null}

      {/* Hero Section */}
      {heroSlides.length ? (
        <AdvSection imgsUrl={heroSlides} intervalMs={5000} page="home" />
      ) : (
        <HeroFallback loading={adsLoading} error={adsError} />
      )}

      <HomeStatsStrip
        productsCount={productsCount}
        categoriesCount={categories.length}
        mallsCount={malls.length}
        storesCount={stores.length}
      />

      <LiveDiscoverySection
        malls={malls}
        stores={stores}
        loading={mallStoreLoading}
        error={mallStoreError}
        onSelectMall={(id) => navigate(`/malls/${id}`)}
        onSelectStore={(id) => navigate(`/stores/${id}`)}
      />

      {/* Categories Banner */}
      <CategoriesBanner
        categories={categoryTree.length ? categoryTree : categories}
        onSelectCategory={(categoryId) => navigate(`/categories/${categoryId}`)}
      />
      {!categories.length && categoriesLoading ? (
        <div className="px-6 py-8 text-center text-sm font-light text-black/50">
          جاري تحميل التصنيفات...
        </div>
      ) : null}

      <BrandsHomeSection brands={brands} loading={brandsLoading} error={brandsError} />

      <HomeProductRow
        title="مقترح لك"
        products={suggestedProducts}
        loading={suggestedLoading}
        error={suggestedError}
        emptyText="لا توجد منتجات مقترحة حالياً."
        onViewAll={() => navigate("/search")}
      />

      <HomeProductRow
        title="الأكثر مبيعا"
        products={bestSellerProducts}
        loading={bestSellersLoading}
        error={bestSellersError}
        emptyText="لا توجد منتجات مباعة بعد."
        onViewAll={() => navigate("/search")}
      />

      <HomeProductRow
        title="عروضات مميزة"
        products={saleProducts}
        loading={saleProductsLoading}
        error={saleProductsError}
        emptyText="لا توجد عروضات مميزة حالياً."
        onViewAll={() => navigate("/search")}
      />

      <Footer />
    </div>
  );
}

export default HomePage;
