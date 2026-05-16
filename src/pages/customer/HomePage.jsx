import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiRefreshCw, FiShoppingBag } from "react-icons/fi";

import Header from "../../components/customer/HomePageComponents/Header";
import CategoryBar from "../../components/customer/HomePageComponents/CategoryBar";
import CategoriesBanner from "../../components/customer/HomePageComponents/CategoriesBanner";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import SectionHeader from "../../components/customer/HomePageComponents/SectionHeader";
import ProductsRow from "../../components/customer/HomePageComponents/ProductsRow";
import BrandsShowcase from "../../components/customer/HomePageComponents/BrandsShowcase";
import MallsSection from "../../components/customer/HomePageComponents/MallsSection";
import StoresShowcase from "../../components/customer/HomePageComponents/StoresShowcase";
import HomeHero from "../../components/customer/HomePageComponents/HomeHero";
import Footer from "../../components/customer/HomePageComponents/Footer";
import { customerApi } from "../../api/customerApi";

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

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [malls, setMalls] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [partialError, setPartialError] = useState(false);

  const [selectedMallId, setSelectedMallId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const loadHomePage = useCallback(async () => {
    setLoading(true);
    setPageError("");
    setPartialError(false);

    const [categoriesRes, brandsRes, mallsRes, storesRes, productsRes] = await Promise.allSettled([
      customerApi.getCategories(),
      customerApi.getBrands(),
      customerApi.getAllMalls(),
      customerApi.getAllShops({ status: "ACTIVE" }),
      customerApi.getProducts({}, 0, 30),
    ]);

    const nextCategories = categoriesRes.status === "fulfilled" ? categoriesRes.value : [];
    const nextBrands = brandsRes.status === "fulfilled" ? brandsRes.value : [];
    const nextMalls = mallsRes.status === "fulfilled" ? mallsRes.value : [];
    const nextStores = storesRes.status === "fulfilled" ? storesRes.value : [];
    const nextProducts = productsRes.status === "fulfilled" ? productsRes.value?.products ?? [] : [];

    setCategories(nextCategories);
    setBrands(nextBrands);
    setMalls(nextMalls);
    setStores(nextStores);
    setProducts(nextProducts);

    const failedCount = [categoriesRes, brandsRes, mallsRes, storesRes, productsRes].filter(
      (result) => result.status === "rejected"
    ).length;

    if (failedCount === 5) {
      setPageError("تعذر تحميل الصفحة الرئيسية.");
    } else if (failedCount > 0) {
      setPartialError(true);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadHomePage();
  }, [loadHomePage]);

  const featuredBrands = useMemo(() => brands.slice(0, 12), [brands]);
  const deals = useMemo(() => products.filter((product) => product.oldPrice !== null).slice(0, 8), [products]);
  const salePicks = useMemo(() => products.filter((product) => product.oldPrice !== null).slice(0, 12), [products]);
  const featured = useMemo(() => products.slice(0, 10), [products]);
  const forYou = useMemo(() => products.slice(0, 10), [products]);
  const moreToExplore = useMemo(() => products.slice(10, 25), [products]);

  const hasAnyContent = Boolean(
    categories.length || brands.length || malls.length || stores.length || products.length
  );

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

          <CategoriesBanner categories={categories} onSelectCategory={handleCategorySelect} />

          <section className="customer-shell px-4 py-6 sm:px-6 md:px-10 md:py-10">
            <SectionHeader
              eyebrow="منتجات مميزة"
              title="اختيارات بارزة من المتاجر النشطة"
              subtitle="شبكة منتجات تمنح العميل بداية واضحة للتصفح، مع رؤية أسرع للسعر والصورة والمنتجات التي تستحق الواجهة الأولى."
              onViewAll={() => navigate("/products")}
            />

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                  title="أسعار مخفّضة تستحق الواجهة الأولى"
                  subtitle="هذه المنتجات عليها خصومات حقيقية قادمة من الـ backend، لذلك هذا القسم يمثل العروض الفعلية المتاحة الآن."
                  onViewAll={() => navigate("/products")}
                  actionLabel="كل العروض"
                />

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                  {loading
                    ? Array.from({ length: 4 }).map((_, index) => <ProductSkeleton key={index} />)
                    : deals.map((product) => <ProductCard key={product.id} p={product} onAddToCart={() => {}} />)}
                </div>
              </div>
            </section>
          ) : null}

          {loading || salePicks.length > 0 ? (
            <ProductsRow
              title="التخفيضات"
              subtitle="قسم مخصص للمنتجات التي عليها خصم فعلي الآن، مع الاعتماد على `hasDiscount` و`discountedPrice` القادمة من الخادم."
              products={salePicks}
              onViewAll={() => navigate("/products")}
              onAddToCart={() => {}}
            />
          ) : null}

          <StoresShowcase stores={stores} loading={loading} />
          <MallsSection malls={malls} loading={loading} />

          <ProductsRow
            title="مقترحات تناسبك"
            subtitle="تشكيلة سهلة التصفح تمنحك مدخلًا أسرع إلى المنتجات الشائعة داخل المنصة."
            products={forYou}
            onViewAll={() => navigate("/products")}
            onAddToCart={() => {}}
          />

          <ProductsRow
            title="اكتشف المزيد"
            subtitle="هذه ليست قائمة أكثر طلبًا من الطلبات الحقيقية؛ إنها مجموعة إضافية من نفس المنتجات العامة إلى حين توفير ترتيب مبيعات أو طلبات من الـ backend."
            products={moreToExplore}
            onViewAll={() => navigate("/products")}
            onAddToCart={() => {}}
          />

          <BrandsShowcase brands={featuredBrands} loading={loading} />
        </>
      )}

      <Footer />
    </div>
  );
}

export default HomePage;
