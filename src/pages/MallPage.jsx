import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import rawMalls from "../assets/malls.json";
import rawCategories from "../assets/categories.json"
import rawStores from "../assets/stores.json"; 
import products from "../assets/products.json";

import Header from "../components/HomePageComponents/Header";
import CategoryBar from "../components/HomePageComponents/CategoryBar";
import FeaturedShops from "../components/MallPageComponents/FeaturedShops";
import Footer from "../components/HomePageComponents/Footer";
import SectionHeader from "../components/HomePageComponents/SectionHeader";
import ProductCard from "../components/HomePageComponents/ProductCard";

import {
  normalizeMalls,
  normalizeStores,
  getMallById,
  getMallStores,
} from "../utils/tmpMallsAndStores";
import { normalizeCategories } from "../utils/tmpCategories";
import MallInfoDialog from "../components/MallPageComponents/MallInfoStrip";
import AdvSection from "../components/HomePageComponents/AdvSection"
import {normalizeProducts, mallProduct, isDiscount } from "../utils/tmpProducts";

function MallPage() {
  const { mallId } = useParams();

 
  const mallsData = useMemo(() => normalizeMalls(rawMalls), []);
  const mallData = useMemo(() => getMallById(mallId, mallsData), [mallId, mallsData]);
  const allProducts = useMemo(() => normalizeProducts(products), []);

  const allStores = useMemo(() => normalizeStores(rawStores), []);
  const storesOfThisMall = useMemo(() => getMallStores(allStores, mallId), [allStores, mallId]);
  const mallProducts = useMemo(() => mallProduct(allProducts , mallId).slice(0, 2) ,[allProducts , mallId])
 
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const deals = useMemo(() => {
  const excludeIds = new Set(mallProducts.map((p) => String(p.id)));

  return allProducts
    .filter(isDiscount)                 
    .filter((p) => !excludeIds.has(String(p.id)))
    .slice(0, 2);
}, [allProducts, mallProducts]);
  const categories = useMemo(() => normalizeCategories(rawCategories), []); 


  if (!mallData) {
    return (
      <div dir="rtl" className="min-h-screen p-6">
        <p className="text-red-600 font-bold">المول غير موجود أو غير فعّال</p>
        <p className="text-gray-600 mt-2">mallId: {mallId}</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen">
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
      <MallInfoDialog mall={mallData} stores={storesOfThisMall}/>
      <AdvSection imgsUrl={mallData.images} intervalMs={4000}  page="mall" full />
      <FeaturedShops shops={storesOfThisMall} mallName={mallData.name} />

      <section className="mx-auto px-10 mt-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* أبرز المنتجات */}
          <div className="bg-white rounded-2xl border border-gray-200  p-4">
            <SectionHeader title="أبرز المنتجات" onViewAll={() => {}} />
            <div className="grid grid-cols-2 gap-3">
              {mallProducts.map((p) => (
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

      <Footer />
    </div>
  );
}

export default MallPage;
