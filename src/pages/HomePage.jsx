import React, { useMemo, useState } from "react";
import Header from "../components/HomePageComponents/Header";
import { normalizeCategories } from "../utils/tmpCategories";
import rawMalls from "../assets/malls.json";
import rawStores from "../assets/stores.json";
import rawCategories from "../assets/categories.json";
import rawProducts from "../assets/products.json";
import CategoryBar from "../components/HomePageComponents/CategoryBar";
import { normalizeMalls, normalizeStores } from "../utils/tmpMallsAndStores";
import AdvSection from "../components/HomePageComponents/AdvSection";
import CategoriesBanner from "../components/HomePageComponents/CategoriesBanner";
import ProductCard from "../components/HomePageComponents/ProductCard";
import SectionHeader from "../components/HomePageComponents/SectionHeader";
import { normalizeProducts, isDiscount } from "../utils/tmpProducts";
import ProductsRow from "../components/HomePageComponents/ProductsRow";
import Footer from "../components/HomePageComponents/Footer";

const imgsUrl = [
  { id: 1, image: "/video.gif", alt: "adv1" },
  { id: 2, image: "https://template.canva.com/EAFdkOY1eMU/1/0/1600w-ewRm6zuOTts.jpg", alt: "adv2" },
  { id: 3, image: "https://template.canva.com/EAFygIBpY9A/1/0/1280w-OJGt1T4cr94.jpg", alt: "adv3" },
];

function HomePage() {
  const categories = useMemo(() => normalizeCategories(rawCategories), []);
  const malls = useMemo(() => normalizeMalls(rawMalls), []);
  const stores = useMemo(() => normalizeStores(rawStores), []);
  const products = useMemo(() => normalizeProducts(rawProducts), []);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedMallId, setSelectedMallId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const deals = useMemo(() => products.filter(isDiscount).slice(0, 2), [products]);

  const featured = useMemo(
    () => products.filter((p) => (p.status || "").includes("وصل حديثاً")).slice(0, 2),
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

      {/* Hero Section - Full Screen */}
      <AdvSection imgsUrl={imgsUrl} intervalMs={5000} page="home" />

      {/* Categories Banner */}
      <CategoriesBanner
        categories={categories}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* Featured & Deals Grid Section */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-8 md:py-12">
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mb-8 md:mb-12"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* أبرز المنتجات - Featured */}
          <div className="bg-white">
            <SectionHeader title="أبرز المنتجات" onViewAll={() => {}} />
            <div className="grid grid-cols-2 gap-4 md:gap-6 mt-8">
              {featured.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
              ))}
            </div>
          </div>

          {/* عروض رائعة - Deals */}
          <div className="bg-white">
            <SectionHeader title="عروض رائعة" onViewAll={() => {}} />
            <div className="grid grid-cols-2 gap-4 md:gap-6 mt-8">
              {deals.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mt-8 md:mt-12"></div>
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