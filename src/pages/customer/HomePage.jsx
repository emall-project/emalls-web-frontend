import React, { useMemo, useState } from "react";
import Header from "../../components/customer/HomePageComponents/Header";
import { normalizeCategories } from "../../utils/tmpCategories";
import rawMalls from "../../assets/malls.json";
import rawStores from "../../assets/stores.json";
import rawCategories from "../../assets/categories.json";
import rawProducts from "../../assets/products.json";
import CategoryBar from "../../components/customer/HomePageComponents/CategoryBar";
import { normalizeMalls, normalizeStores } from "../../utils/tmpMallsAndStores";
import AdvSection from "../../components/customer/HomePageComponents/AdvSection";
import CategoriesBanner from "../../components/customer/HomePageComponents/CategoriesBanner";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import SectionHeader from "../../components/customer/HomePageComponents/SectionHeader";
import { normalizeProducts, isDiscount } from "../../utils/tmpProducts";
import ProductsRow from "../../components/customer/HomePageComponents/ProductsRow";
import Footer from "../../components/customer/HomePageComponents/Footer";

const imgsUrl = [
  { id: 1, image: "/video.gif", alt: "adv1" },
  {
    id: 2,
    image: "https://template.canva.com/EAFdkOY1eMU/1/0/1600w-ewRm6zuOTts.jpg",
    alt: "adv2",
  },
  {
    id: 3,
    image: "https://template.canva.com/EAFygIBpY9A/1/0/1280w-OJGt1T4cr94.jpg",
    alt: "adv3",
  },
];

function HomePage() {
  const categories = useMemo(() => normalizeCategories(rawCategories), []);
  const malls = useMemo(() => normalizeMalls(rawMalls), []);
  const stores = useMemo(() => normalizeStores(rawStores), []);
  const products = useMemo(() => normalizeProducts(rawProducts), []);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedMallId, setSelectedMallId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const deals = useMemo(() => products.filter(isDiscount).slice(0, 3), [products]);

  const featured = useMemo(
    () => products.filter((p) => (p.status || "").includes("وصل حديثاً")).slice(0, 3),
    [products]
  );

  const bestSellers = useMemo(() => products.slice(0, 10), [products]);
  const forYou = useMemo(() => products.slice(10, 20), [products]);

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

      {/* Hero Section */}
      <AdvSection imgsUrl={imgsUrl} intervalMs={5000} page="home" />

      {/* Categories Banner */}
      <CategoriesBanner categories={categories} onSelectCategory={setSelectedCategoryId} />

      {/* Featured */}
      <section className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-10 md:py-14">
        <SectionHeader title="أبرز المنتجات" onViewAll={() => {}} />
        <div className="mt-5 sm:mt-6 md:mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {featured.map((p) => (
            <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
          ))}
        </div>
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
