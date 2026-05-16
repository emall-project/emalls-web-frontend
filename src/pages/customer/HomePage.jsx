import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiRotateCcw,
  FiShoppingBag,
  FiShoppingCart,
  FiTruck,
} from "react-icons/fi";

import Header from "../../components/customer/HomePageComponents/Header";
import CategoryBar from "../../components/customer/HomePageComponents/CategoryBar";
import CategoriesBanner from "../../components/customer/HomePageComponents/CategoriesBanner";
import CustomerAdSlot from "../../components/customer/HomePageComponents/CustomerAdSlot";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import SectionHeader from "../../components/customer/HomePageComponents/SectionHeader";
import ProductsRow from "../../components/customer/HomePageComponents/ProductsRow";
import BrandsShowcase from "../../components/customer/HomePageComponents/BrandsShowcase";
import MallsSection from "../../components/customer/HomePageComponents/MallsSection";
import StoresShowcase from "../../components/customer/HomePageComponents/StoresShowcase";
import HomeHero from "../../components/customer/HomePageComponents/HomeHero";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { customerApi } from "../../api/customerApi";
import { auth } from "../../api/auth";
import {
  HOME_FOOTER_AD_POSITION,
  HOME_MID_PRIMARY_AD_POSITION,
  HOME_MID_SECONDARY_AD_POSITION,
  HOME_TOP_AD_POSITION,
} from "../../data/adSlots";

function formatCount(value) {
  return Number(value ?? 0).toLocaleString("en-US");
}

function ProductSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[28px] border border-[var(--customer-border)] bg-white shadow-[var(--customer-shadow-soft)]">
      <div className="aspect-[0.95] bg-[var(--customer-surface-muted)]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-4/5 rounded-full bg-[var(--customer-surface-muted)]" />
        <div className="h-3 w-2/3 rounded-full bg-[var(--customer-surface-muted)]" />
        <div className="h-4 w-1/3 rounded-full bg-[var(--customer-surface-muted)]" />
      </div>
    </div>
  );
}

function DashboardStatCard({ icon, label, value, hint, tone = "blue" }) {
  const toneClasses = {
    blue: "bg-[rgba(27,79,240,0.08)] text-[var(--customer-accent)]",
    amber: "bg-[rgba(245,158,11,0.12)] text-amber-700",
    green: "bg-[rgba(15,159,110,0.12)] text-emerald-700",
  };

  return (
    <div className="rounded-[28px] border border-[var(--customer-border)] bg-white p-5 shadow-[var(--customer-shadow-soft)]">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[tone] ?? toneClasses.blue}`}>
        {icon}
      </div>
      <p className="mt-4 text-[11px] font-extrabold tracking-[0.14em] text-[var(--customer-muted-soft)]">
        {label}
      </p>
      <p className="mt-2 text-[1.8rem] font-black leading-none text-[var(--customer-text)]">
        {formatCount(value)}
      </p>
      <p className="mt-2 text-sm leading-7 text-[var(--customer-muted)]">{hint}</p>
    </div>
  );
}

function CustomerSnapshotSection({ loading, dashboard, onNavigate }) {
  const orderKpis = dashboard?.orderKpis ?? {};
  const activeCarts = Array.isArray(dashboard?.activeCarts?.carts) ? dashboard.activeCarts.carts : [];
  const recentOrders = Array.isArray(dashboard?.recentOrders?.orders) ? dashboard.recentOrders.orders : [];
  const activeReturns = Array.isArray(dashboard?.activeReturns?.returns) ? dashboard.activeReturns.returns : [];
  const latestOrder = recentOrders[0] ?? null;

  return (
    <section className="customer-shell px-4 py-6 sm:px-6 md:px-10 md:py-8">
      <div className="customer-panel-strong overflow-hidden rounded-[34px] p-5 sm:p-6 md:p-8">
        <SectionHeader
          eyebrow="نشاطك"
          title="لوحة سريعة لحسابك"
          subtitle="ملخص مباشر من الباك إند لطلباتك الحالية، السلال النشطة، وطلبات الإرجاع المفتوحة حتى تعرف أين تتابع فورًا."
        />

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-[28px] border border-[var(--customer-border)] bg-white p-5 shadow-[var(--customer-shadow-soft)]"
              >
                <div className="h-11 w-11 rounded-2xl bg-[var(--customer-surface-muted)]" />
                <div className="mt-4 h-3 w-20 rounded-full bg-[var(--customer-surface-muted)]" />
                <div className="mt-3 h-8 w-16 rounded-full bg-[var(--customer-surface-muted)]" />
                <div className="mt-3 h-3 w-full rounded-full bg-[var(--customer-surface-muted)]" />
              </div>
            ))}
          </div>
        ) : !dashboard ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-[var(--customer-border)] bg-[var(--customer-bg-soft)] px-5 py-8 text-center">
            <p className="text-base font-black text-[var(--customer-text)]">تعذر تحميل ملخص الحساب الآن</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-8 text-[var(--customer-muted)]">
              بقية الصفحة ما زالت متاحة، ويمكنك الانتقال مباشرة إلى الطلبات أو السلة أو الإرجاعات حتى يكتمل الربط بالكامل.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => onNavigate("/orders")} className="customer-primary-btn">
                طلباتي
              </button>
              <button type="button" onClick={() => onNavigate("/cart")} className="customer-secondary-btn">
                السلة
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <DashboardStatCard
                icon={<FiShoppingBag className="text-lg" />}
                label="إجمالي الطلبات"
                value={orderKpis.totalOrders}
                hint="كل الطلبات التي أنشأتها حتى الآن."
              />
              <DashboardStatCard
                icon={<FiClock className="text-lg" />}
                label="طلبات نشطة"
                value={orderKpis.activeOrders}
                hint="طلبات ما زالت في التحضير أو التوصيل."
                tone="amber"
              />
              <DashboardStatCard
                icon={<FiCheckCircle className="text-lg" />}
                label="تم تسليمها"
                value={orderKpis.deliveredOrders}
                hint="طلبات اكتمل تسليمها بنجاح."
                tone="green"
              />
              <DashboardStatCard
                icon={<FiShoppingCart className="text-lg" />}
                label="سلال نشطة"
                value={activeCarts.length}
                hint="سلال مفتوحة لم تُنهَ بعد."
              />
              <DashboardStatCard
                icon={<FiRotateCcw className="text-lg" />}
                label="إرجاعات مفتوحة"
                value={activeReturns.length}
                hint="طلبات إرجاع ما زالت قيد المتابعة."
                tone="amber"
              />
            </div>

            <div className="mt-5 flex flex-col gap-4 rounded-[30px] border border-[var(--customer-border)] bg-[linear-gradient(135deg,#ffffff_0%,#f8faff_50%,#eef4ff_100%)] p-5 shadow-[var(--customer-shadow-soft)] lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-black text-[var(--customer-text)]">
                  {latestOrder
                    ? `آخر طلب لديك هو #${latestOrder.shopOrderId ?? "—"} ويمكنك متابعة حالته الآن.`
                    : "ابدأ من السلة أو الطلبات لمتابعة نشاطك بسهولة."}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--customer-muted)]">
                  {activeCarts.length > 0
                    ? `لديك ${formatCount(activeCarts.length)} سلة نشطة و${formatCount(activeReturns.length)} طلب إرجاع مفتوح.`
                    : "لا توجد سلال نشطة حاليًا، ويمكنك العودة للتصفح واكتشاف منتجات جديدة من الأقسام التالية."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => onNavigate("/orders")} className="customer-primary-btn">
                  <FiTruck className="text-sm" />
                  متابعة الطلبات
                </button>
                <button type="button" onClick={() => onNavigate("/cart")} className="customer-secondary-btn">
                  <FiShoppingCart className="text-sm" />
                  فتح السلة
                </button>
                <button type="button" onClick={() => onNavigate("/returns")} className="customer-secondary-btn">
                  <FiRotateCcw className="text-sm" />
                  الإرجاعات
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function PageErrorState({ onRetry, partial = false }) {
  return (
    <section className="customer-shell px-4 py-8 sm:px-6 md:px-10">
      <div className="customer-panel-strong rounded-[32px] px-6 py-10 text-center sm:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[rgba(239,68,68,0.08)] text-[var(--customer-deal)]">
          <FiAlertCircle className="text-3xl" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-[var(--customer-text)]">
          {partial ? "تم تحميل الصفحة بشكل جزئي" : "تعذر تحميل الصفحة الرئيسية"}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-8 text-[var(--customer-muted)]">
          {partial
            ? "بعض الأقسام لم تُحمّل من الخادم بشكل كامل. يمكنك المتابعة أو إعادة المحاولة لتحديث جميع البيانات."
            : "حدثت مشكلة أثناء جلب بيانات الصفحة من الخادم. أعد المحاولة لاستعادة الأقسام والمنتجات والمولات."}
        </p>
        <button type="button" onClick={onRetry} className="customer-primary-btn mt-6 rounded-[20px] px-5">
          <FiRefreshCw className="text-sm" />
          إعادة التحميل
        </button>
      </div>
    </section>
  );
}

function EmptyState({ onRetry }) {
  return (
    <section className="customer-shell px-4 py-8 sm:px-6 md:px-10">
      <div className="customer-panel-strong rounded-[32px] px-6 py-12 text-center sm:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--customer-accent-soft)] text-[var(--customer-accent)]">
          <FiShoppingBag className="text-3xl" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-[var(--customer-text)]">لا توجد بيانات للعرض بعد</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-8 text-[var(--customer-muted)]">
          لم تصل منتجات أو مولات أو فئات كافية من الخادم لعرض الصفحة الرئيسية بشكل كامل. يمكنك إعادة المحاولة لاحقًا.
        </p>
        <button type="button" onClick={onRetry} className="customer-secondary-btn mt-6 rounded-[20px] px-5">
          <FiRefreshCw className="text-sm" />
          تحديث الصفحة
        </button>
      </div>
    </section>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const currentUser = auth.getUser();
  const isCustomer = currentUser?.role === "ROLE_CUSTOMER";

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [malls, setMalls] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [mostOrderedProducts, setMostOrderedProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [exploreProducts, setExploreProducts] = useState([]);
  const [activeAds, setActiveAds] = useState([]);
  const [customerDashboard, setCustomerDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [partialError, setPartialError] = useState(false);

  const [selectedMallId, setSelectedMallId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const loadHomePage = useCallback(async () => {
    setLoading(true);
    setPageError("");
    setPartialError(false);

    const [
      categoriesRes,
      brandsRes,
      mallsRes,
      storesRes,
      productsRes,
      mostOrderedRes,
      activeSalesRes,
      randomProductsRes,
      activeAdsRes,
      customerDashboardRes,
    ] = await Promise.allSettled([
      customerApi.getCategories(),
      customerApi.getBrands(),
      customerApi.getActiveMalls(),
      customerApi.getActiveShops(),
      customerApi.getProducts({}, 0, 30),
      customerApi.getPublicMostOrderedProducts(10),
      customerApi.getPublicActiveSaleProducts(12),
      customerApi.getRandomProducts(15),
      customerApi.getActiveDisplayedAds(),
      isCustomer ? customerApi.getCustomerDashboard() : Promise.resolve(null),
    ]);

    const nextCategories = categoriesRes.status === "fulfilled" ? categoriesRes.value : [];
    const nextBrands = brandsRes.status === "fulfilled" ? brandsRes.value : [];
    const nextMalls = mallsRes.status === "fulfilled" ? mallsRes.value : [];
    const nextStores = storesRes.status === "fulfilled" ? storesRes.value : [];
    const nextProducts = productsRes.status === "fulfilled" ? productsRes.value?.products ?? [] : [];
    const nextMostOrdered = mostOrderedRes.status === "fulfilled" ? mostOrderedRes.value : [];
    const nextActiveSales = activeSalesRes.status === "fulfilled" ? activeSalesRes.value : [];
    const nextRandomProducts = randomProductsRes.status === "fulfilled" ? randomProductsRes.value : [];
    const nextActiveAds = activeAdsRes.status === "fulfilled" ? activeAdsRes.value : [];
    const nextCustomerDashboard = customerDashboardRes.status === "fulfilled" ? customerDashboardRes.value : null;

    setCategories(nextCategories);
    setBrands(nextBrands);
    setMalls(nextMalls);
    setStores(nextStores);
    setProducts(nextProducts);
    setMostOrderedProducts(nextMostOrdered);
    setSaleProducts(nextActiveSales);
    setExploreProducts(nextRandomProducts);
    setActiveAds(nextActiveAds);
    setCustomerDashboard(nextCustomerDashboard);

    const trackedResults = [
      categoriesRes,
      brandsRes,
      mallsRes,
      storesRes,
      productsRes,
      mostOrderedRes,
      activeSalesRes,
      randomProductsRes,
      activeAdsRes,
      ...(isCustomer ? [customerDashboardRes] : []),
    ];

    const failedCount = trackedResults.filter((result) => result.status === "rejected").length;

    if (failedCount === trackedResults.length) {
      setPageError("تعذر تحميل الصفحة الرئيسية.");
    } else if (failedCount > 0) {
      setPartialError(true);
    }

    setLoading(false);
  }, [isCustomer]);

  useEffect(() => {
    loadHomePage();
  }, [loadHomePage]);

  const featuredBrands = useMemo(() => brands.slice(0, 12), [brands]);
  const featured = useMemo(
    () => (mostOrderedProducts.length ? mostOrderedProducts : products.slice(0, 10)),
    [mostOrderedProducts, products]
  );
  const deals = useMemo(
    () => (saleProducts.length ? saleProducts.slice(0, 8) : products.filter((product) => product.oldPrice !== null).slice(0, 8)),
    [saleProducts, products]
  );
  const salePicks = useMemo(
    () => (saleProducts.length ? saleProducts : products.filter((product) => product.oldPrice !== null).slice(0, 12)),
    [saleProducts, products]
  );
  const forYou = useMemo(() => products.slice(0, 10), [products]);
  const moreToExplore = useMemo(
    () => (exploreProducts.length ? exploreProducts : products.slice(10, 25)),
    [exploreProducts, products]
  );
  const activeAdPositions = useMemo(
    () => new Set(activeAds.map((ad) => ad?.position).filter(Boolean)),
    [activeAds]
  );

  const hasAnyContent = Boolean(
    categories.length ||
      brands.length ||
      malls.length ||
      stores.length ||
      products.length ||
      mostOrderedProducts.length ||
      saleProducts.length ||
      exploreProducts.length ||
      activeAds.length ||
      customerDashboard
  );

  const featuredSectionCopy = mostOrderedProducts.length
    ? {
        eyebrow: "الأكثر طلبًا",
        title: "منتجات يطلبها العملاء أكثر الآن",
        subtitle: "هذا القسم مرتبط بترتيب الطلبات العام في الباك إند، لذلك يعرض المنتجات الأوضح طلبًا بدل اختيارات ثابتة فقط.",
      }
    : {
        eyebrow: "منتجات مميزة",
        title: "اختيارات بارزة من المتاجر النشطة",
        subtitle: "شبكة منتجات تمنح العميل بداية واضحة للتصفح، مع رؤية أسرع للسعر والصورة والمنتجات التي تستحق الواجهة الأولى.",
      };

  const salesHeroCopy = saleProducts.length
    ? {
        title: "عروض فعليّة قادمة من نظام الخصومات",
        subtitle: "هذه المنتجات مرتبطة مباشرة بالعروض النشطة العامة في الباك إند، لذلك تمثل الخصومات المتاحة الآن بشكل أدق.",
      }
    : {
        title: "أسعار مخفّضة تستحق الواجهة الأولى",
        subtitle: "هذه المنتجات عليها خصومات حقيقية قادمة من الخادم، لذلك هذا القسم يمثل العروض الفعلية المتاحة الآن.",
      };

  const salesRowCopy = saleProducts.length
    ? {
        title: "تخفيضات نشطة",
        subtitle: "قائمة موسعة للعروض النشطة العامة حتى تنتقل بسرعة إلى المنتجات المخفّضة المتاحة حاليًا.",
      }
    : {
        title: "التخفيضات",
        subtitle: "قسم مخصص للمنتجات التي عليها خصم فعلي الآن، مع الاعتماد على hasDiscount وdiscountedPrice القادمة من الخادم.",
      };

  const exploreCopy = exploreProducts.length
    ? {
        title: "اكتشف المزيد",
        subtitle: "هذا القسم يستخدم endpoint المنتجات العشوائية من الباك إند ليمنح الصفحة تنوعًا مستمرًا بدل تكرار نفس العناصر فقط.",
      }
    : {
        title: "اكتشف المزيد",
        subtitle: "هذه مجموعة إضافية من نفس المنتجات العامة إلى حين توفر ترتيب أوسع من الباك إند.",
      };

  const handleCategorySelect = useCallback(
    (categoryId) => {
      if (categoryId == null || categoryId === "") {
        navigate("/products");
      } else {
        navigate(`/products?categoryId=${categoryId}`);
      }
    },
    [navigate]
  );

  return (
    <div className="customer-page">
      <Header />

      <CategoryBar
        categories={categories}
        selectedCategoryId={null}
        onSelectCategory={handleCategorySelect}
        malls={malls}
        stores={stores}
        selectedStoreId={selectedStoreId}
        selectedMallId={selectedMallId}
        onSelectMall={setSelectedMallId}
        onSelectStore={setSelectedStoreId}
      />

      {activeAdPositions.has(HOME_TOP_AD_POSITION) ? (
        <section className="customer-shell px-4 py-4 sm:px-6 md:px-10">
          <CustomerAdSlot ads={activeAds} position={HOME_TOP_AD_POSITION} />
        </section>
      ) : null}

      <HomeHero
        loading={loading}
        categories={categories}
        malls={malls}
        stores={stores}
        products={products}
        brands={brands}
      />

      {pageError ? (
        <PageErrorState onRetry={loadHomePage} />
      ) : !loading && !hasAnyContent ? (
        <EmptyState onRetry={loadHomePage} />
        ) : (
        <>
          {partialError ? <PageErrorState onRetry={loadHomePage} partial /> : null}

          {isCustomer ? (
            <CustomerSnapshotSection
              loading={loading}
              dashboard={customerDashboard}
              onNavigate={navigate}
            />
          ) : null}

          <CategoriesBanner categories={categories} onSelectCategory={handleCategorySelect} />

          {activeAdPositions.has(HOME_MID_PRIMARY_AD_POSITION) ? (
            <section className="customer-shell px-4 pb-2 sm:px-6 md:px-10">
              <CustomerAdSlot ads={activeAds} position={HOME_MID_PRIMARY_AD_POSITION} compact />
            </section>
          ) : null}

          <section className="customer-shell px-4 py-6 sm:px-6 md:px-10 md:py-10">
            <SectionHeader
              eyebrow={featuredSectionCopy.eyebrow}
              title={featuredSectionCopy.title}
              subtitle={featuredSectionCopy.subtitle}
              onViewAll={() => navigate("/products")}
            />

            <div className="mt-6 grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {loading
                ? Array.from({ length: 10 }).map((_, index) => <ProductSkeleton key={index} />)
                : featured.map((product) => <ProductCard key={product.id} p={product} onAddToCart={() => {}} />)}
            </div>
          </section>

          {(loading || deals.length > 0) ? (
            <section className="customer-shell px-4 py-6 sm:px-6 md:px-10 md:py-10">
              <div className="overflow-hidden rounded-[34px] border border-[#112b66] bg-[linear-gradient(135deg,#0f172a_0%,#112b66_46%,#1d4ed8_100%)] px-5 py-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.26)] sm:px-6 md:px-8">
                <SectionHeader
                  eyebrow="عروض اليوم"
                  title={salesHeroCopy.title}
                  subtitle={salesHeroCopy.subtitle}
                  onViewAll={() => navigate("/products")}
                  actionLabel="كل العروض"
                />

                <div className="mt-6 grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                  {loading
                    ? Array.from({ length: 4 }).map((_, index) => <ProductSkeleton key={index} />)
                    : deals.map((product) => <ProductCard key={product.id} p={product} onAddToCart={() => {}} />)}
                </div>
              </div>
            </section>
          ) : null}

          {loading || salePicks.length > 0 ? (
            <ProductsRow
              title={salesRowCopy.title}
              subtitle={salesRowCopy.subtitle}
              products={salePicks}
              onViewAll={() => navigate("/products")}
              onAddToCart={() => {}}
            />
          ) : null}

          {activeAdPositions.has(HOME_MID_SECONDARY_AD_POSITION) ? (
            <section className="customer-shell px-4 pb-2 sm:px-6 md:px-10">
              <CustomerAdSlot ads={activeAds} position={HOME_MID_SECONDARY_AD_POSITION} compact />
            </section>
          ) : null}

          <StoresShowcase stores={stores} loading={loading} />
          <MallsSection malls={malls} loading={loading} />

          {loading || forYou.length > 0 ? (
            <ProductsRow
              title="اقتراحات تناسبك"
              subtitle="تشكيلة سهلة التصفح تمنحك مدخلًا أسرع إلى المنتجات النشطة داخل المنصة دون الحاجة للغوص في كل الأقسام."
              products={forYou}
              onViewAll={() => navigate("/products")}
              onAddToCart={() => {}}
            />
          ) : null}

          {loading || moreToExplore.length > 0 ? (
            <ProductsRow
              title={exploreCopy.title}
              subtitle={exploreCopy.subtitle}
              products={moreToExplore}
              onViewAll={() => navigate("/products")}
              onAddToCart={() => {}}
            />
          ) : null}

          <BrandsShowcase brands={featuredBrands} loading={loading} />

          {activeAdPositions.has(HOME_FOOTER_AD_POSITION) ? (
            <section className="customer-shell px-4 pt-2 sm:px-6 md:px-10 md:pb-4">
              <CustomerAdSlot ads={activeAds} position={HOME_FOOTER_AD_POSITION} compact />
            </section>
          ) : null}
        </>
      )}

      <Footer />
    </div>
  );
}

export default HomePage;
