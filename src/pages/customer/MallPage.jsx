import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import rawMalls from "../../assets/malls.json";
import rawCategories from "../../assets/categories.json";
import rawStores from "../../assets/stores.json";
import rawProducts from "../../assets/products.json";

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

import {
  normalizeMalls,
  normalizeStores,
  getMallById,
  getMallStores,
} from "../../utils/tmpMallsAndStores";
import { normalizeCategories } from "../../utils/tmpCategories";
import { normalizeProducts, mallProduct, isDiscount } from "../../utils/tmpProducts";

function MallPage() {
  const { mallId } = useParams();

  const mallsData = useMemo(() => normalizeMalls(rawMalls), []);
  const mallData = useMemo(() => getMallById(mallId, mallsData), [mallId, mallsData]);

  const categories = useMemo(() => normalizeCategories(rawCategories), []);

  const allStores = useMemo(() => normalizeStores(rawStores), []);
  const storesOfThisMall = useMemo(() => getMallStores(allStores, mallId), [allStores, mallId]);

  const allProducts = useMemo(() => normalizeProducts(rawProducts), []);
  const mallAllProducts = useMemo(() => mallProduct(allProducts, mallId), [allProducts, mallId]);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  const filteredMallProducts = useMemo(() => {
    let list = mallAllProducts;

    if (selectedStoreId) {
      list = list.filter((p) => String(p.storeId) === String(selectedStoreId));
    }
    if (selectedCategoryId) {
      list = list.filter((p) => String(p.categoryId) === String(selectedCategoryId));
    }
    return list;
  }, [mallAllProducts, selectedStoreId, selectedCategoryId]);

  const mallFeaturedProducts = useMemo(() => filteredMallProducts.slice(0, 2), [filteredMallProducts]);

  const deals = useMemo(() => {
    const excludeIds = new Set(mallFeaturedProducts.map((p) => String(p.id)));
    return filteredMallProducts
      .filter(isDiscount)
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

  if (!mallData) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-black mb-2">المول غير موجود أو غير فعّال</p>
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

      <AdvSection imgsUrl={mallData.images} intervalMs={4000} page="mall" />

      <MallInfoDialog mall={mallData} stores={storesOfThisMall} />

      {/* ✅ Search inside mall
      <MallSearch mallId={mallId} /> */} 

      <FeaturedShops shops={storesOfThisMall} mallName={mallData.name} />

      <section className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mb-8 md:mb-12" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
          <div className="bg-white">
            <SectionHeader title="أبرز المنتجات" onViewAll={() => {}} />
            <div className="mt-6 md:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              {mallFeaturedProducts.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
              ))}
            </div>
          </div>

          <div className="bg-white">
            <SectionHeader title="عروض رائعة" onViewAll={() => {}} />
            <div className="mt-6 md:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              {deals.map((p) => (
                <ProductCard key={p.id} p={p} onAddToCart={() => {}} />
              ))}
            </div>
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
