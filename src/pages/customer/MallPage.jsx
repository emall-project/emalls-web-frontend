import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import Header from "../../components/customer/HomePageComponents/Header";
import CategoryBar from "../../components/customer/HomePageComponents/CategoryBar";
import FeaturedShops from "../../components/customer/MallPageComponents/FeaturedShops";
import Footer from "../../components/customer/HomePageComponents/Footer";
import SectionHeader from "../../components/customer/HomePageComponents/SectionHeader";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import ProductsRow from "../../components/customer/HomePageComponents/ProductsRow";
import MallInfoDialog from "../../components/customer/MallPageComponents/MallInfoStrip";
import AdvSection from "../../components/customer/HomePageComponents/AdvSection";

import { customerApi } from "../../api/customerApi";

function ProductSkeleton() {
  return (
    <div className="customer-panel overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded-full bg-slate-100" />
        <div className="h-3 w-1/2 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function MallPage() {
  const { mallId } = useParams();

  const [mall, setMall] = useState(null);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);

  const [mallLoading, setMallLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  useEffect(() => {
    setMallLoading(true);
    setError(null);
    Promise.all([
      customerApi.getMallById(mallId),
      customerApi.getCategories().catch(() => []),
      customerApi.getActiveShopsByMall(mallId).catch(() => []),
    ])
      .then(([mallData, categoryList, shopList]) => {
        setMall(mallData);
        setCategories(categoryList);
        setShops(shopList);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setMallLoading(false));
  }, [mallId]);

  const loadProducts = useCallback(() => {
    setProductsLoading(true);
    const filter = { mallId: Number(mallId) };
    if (selectedStoreId) filter.storeId = Number(selectedStoreId);
    if (selectedCategoryId) filter.categoryId = Number(selectedCategoryId);

    customerApi
      .getProducts(filter, 0, 30)
      .then(({ products: list }) => setProducts(list))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [mallId, selectedStoreId, selectedCategoryId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const mallFeaturedProducts = useMemo(() => products.slice(0, 2), [products]);

  const deals = useMemo(() => {
    const excluded = new Set(mallFeaturedProducts.map((product) => String(product.id)));
    return products
      .filter((product) => product.oldPrice !== null && !excluded.has(String(product.id)))
      .slice(0, 2);
  }, [products, mallFeaturedProducts]);

  const mallRowProducts = useMemo(() => {
    const excluded = new Set([
      ...mallFeaturedProducts.map((product) => String(product.id)),
      ...deals.map((product) => String(product.id)),
    ]);
    return products.filter((product) => !excluded.has(String(product.id))).slice(0, 20);
  }, [products, mallFeaturedProducts, deals]);

  if (!mallLoading && !mall && error) {
    return (
      <div dir="rtl" className="customer-page flex min-h-screen items-center justify-center p-6">
        <div className="customer-panel-strong max-w-md px-8 py-10 text-center">
          <p className="text-xl font-extrabold text-slate-900">المول غير متاح</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!mallLoading && !mall) {
    return (
      <div dir="rtl" className="customer-page flex min-h-screen items-center justify-center p-6">
        <div className="customer-panel-strong max-w-md px-8 py-10 text-center">
          <p className="text-xl font-extrabold text-slate-900">المول غير موجود</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">المعرّف الحالي: {mallId}</p>
        </div>
      </div>
    );
  }

  const mallImages = mall?.images?.length ? mall.images : [];

  return (
    <div dir="rtl" className="customer-page">
      <Header />

      <CategoryBar
        showMallStoreMenu={false}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        stores={shops}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
      />

      <AdvSection imgsUrl={mallImages} intervalMs={4000} page="mall" />

      <div className="customer-shell px-4 py-6 sm:px-6 md:px-12">
        {mall ? <MallInfoDialog mall={mall} stores={shops} /> : null}
      </div>

      <FeaturedShops shops={shops} mallName={mall?.name ?? ""} />

      <section className="customer-shell px-4 py-4 sm:px-6 md:px-12 md:py-6">
        <div className="customer-soft-panel p-5 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <SectionHeader
                title="أبرز منتجات المول"
                subtitle="اختيارات سريعة من المنتجات الأوضح داخل هذا المول."
                onViewAll={() => {}}
              />
              <div className="mt-6 grid grid-cols-2 gap-4">
                {productsLoading
                  ? Array.from({ length: 2 }).map((_, index) => <ProductSkeleton key={index} />)
                  : mallFeaturedProducts.map((product) => (
                      <ProductCard key={product.id} p={product} onAddToCart={() => {}} />
                    ))}
              </div>
            </div>

            <div>
              <SectionHeader
                title="عروض هذا المول"
                subtitle="منتجات مخفّضة السعر من المتاجر النشطة في نفس المكان."
                onViewAll={() => {}}
              />
              <div className="mt-6 grid grid-cols-2 gap-4">
                {productsLoading ? (
                  Array.from({ length: 2 }).map((_, index) => <ProductSkeleton key={index} />)
                ) : deals.length > 0 ? (
                  deals.map((product) => <ProductCard key={product.id} p={product} onAddToCart={() => {}} />)
                ) : (
                  <p className="col-span-2 rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                    لا توجد عروض مميزة في الوقت الحالي.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductsRow
        title={`منتجات ${mall?.name ?? ""}`}
        subtitle="مزيد من المنتجات المعروضة داخل هذا المول من متاجر متعددة."
        products={mallRowProducts}
        onViewAll={() => {}}
        onAddToCart={() => {}}
      />

      <Footer />
    </div>
  );
}

export default MallPage;
