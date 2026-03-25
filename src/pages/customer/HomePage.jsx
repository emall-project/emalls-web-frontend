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

      {/* Featured & Deals */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 md:py-12">
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mb-6 sm:mb-8 md:mb-12" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Featured */}
          <div className="bg-white">
            <SectionHeader title="أبرز المنتجات" onViewAll={() => {}} />

            <div className="mt-5 sm:mt-6 md:mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {featured.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
              ))}
            </div>
          </div>

          {/* Deals */}
          <div className="bg-white">
            <SectionHeader title="عروض رائعة" onViewAll={() => {}} />

            <div className="mt-5 sm:mt-6 md:mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {deals.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mt-6 sm:mt-8 md:mt-12" />
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
