import React, { useEffect, useMemo, useState } from "react";
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
import { catalogApi, normalizeCatalogPage, unwrapCatalogPayload } from "../../api/catalog";
import { getMediaPreviewUrl } from "../../api/mediaManager";
import { hasProductDiscount, toProductCard } from "../../utils/catalogProducts";
import CatalogFilters, { buildCatalogFilterPayload } from "../../components/customer/CatalogFilters";

function MallPage() {
  const { mallId } = useParams();

  const mallsData = useMemo(() => normalizeMalls(rawMalls), []);
  const mallData = useMemo(() => getMallById(mallId, mallsData), [mallId, mallsData]);

  const fallbackCategories = useMemo(() => normalizeCategories(rawCategories), []);
  const [liveCategories, setLiveCategories] = useState([]);
  const categories = liveCategories.length ? liveCategories : fallbackCategories;

  const allStores = useMemo(() => normalizeStores(rawStores), []);
  const storesOfThisMall = useMemo(() => getMallStores(allStores, mallId), [allStores, mallId]);

  const allProducts = useMemo(() => normalizeProducts(rawProducts), []);
  const fallbackMallProducts = useMemo(() => mallProduct(allProducts, mallId), [allProducts, mallId]);
  const [liveProducts, setLiveProducts] = useState([]);
  const mallAllProducts = liveProducts.length ? liveProducts : fallbackMallProducts;

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

  const filteredMallProducts = useMemo(() => {
    let list = mallAllProducts;

    if (liveProducts.length) {
      return list;
    }

    if (selectedStoreId) {
      list = list.filter((p) => String(p.storeId) === String(selectedStoreId));
    }
    if (selectedCategoryId) {
      list = list.filter((p) => String(p.categoryId) === String(selectedCategoryId));
    }
    return list;
  }, [liveProducts.length, mallAllProducts, selectedStoreId, selectedCategoryId]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      catalogApi.categories.all({ isActive: true }),
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
      .then(([categoriesResponse, productsResponse]) => {
        if (cancelled) return;
        setLiveCategories((unwrapCatalogPayload(categoriesResponse) || []).map((category) => ({
          id: String(category.id),
          name: category.name,
          description: category.description || "",
          parentId: category.parentId == null ? null : String(category.parentId),
          imageUrl: getMediaPreviewUrl(category.image),
        })));
        setLiveProducts(normalizeCatalogPage(productsResponse).content.map(toProductCard));
      })
      .catch(() => {
        if (!cancelled) {
          setLiveCategories([]);
          setLiveProducts([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters, mallId, selectedCategoryId, selectedStoreId]);

  const mallFeaturedProducts = useMemo(() => filteredMallProducts.slice(0, 2), [filteredMallProducts]);

  const deals = useMemo(() => {
    const excludeIds = new Set(mallFeaturedProducts.map((p) => String(p.id)));
    return filteredMallProducts
      .filter((product) => hasProductDiscount(product) || isDiscount(product))
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

        <div className="mb-8">
          <CatalogFilters filters={filters} onChange={setFilters} compact />
        </div>

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
