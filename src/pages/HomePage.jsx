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
  { id: 1, image: "/adv4.jpg", alt: "adv1" },
  { id: 2, image: "/adv1.jpg", alt: "adv2" },
  { id: 3, image: "/adv3.jpg", alt: "adv3" },
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
    <div className="min-h-screen bg-[#F7F9FC]">
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
      <section className="flex flex-col">
        <div className="flex-1 px-4 pt-4">
          {/* لازم AdvSection يدعم full لتصير الصورة تملأ */}
          <AdvSection imgsUrl={imgsUrl} intervalMs={4000} page="home" full />
        </div>

        <div className="">
          <CategoriesBanner
            categories={categories}
            onSelectCategory={setSelectedCategoryId}
            full
          />
        </div>
      </section>

      <section className="mx-auto px-4 mt-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* أبرز المنتجات */}
          <div className="bg-white rounded-2xl border border-gray-200  p-4">
            <SectionHeader title="أبرز المنتجات" onViewAll={() => {}} />
            <div className="grid grid-cols-2 gap-3">
              {featured.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
              ))}
            </div>
          </div>

          {/* عروض رائعة */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <SectionHeader title="عروض رائعة" onViewAll={() => {}} />
            <div className="grid grid-cols-2 gap-3">
              {deals.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
              ))}
            </div>
          </div>
        </div>
      </section>
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
