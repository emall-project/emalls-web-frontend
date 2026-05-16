import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IoBusinessOutline,
  IoChevronBack,
  IoGridOutline,
  IoLocationOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import { FiPackage } from "react-icons/fi";

import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import { customerApi } from "../../api/customerApi";

function Spinner() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function ProductSkeleton() {
  return (
    <div className="customer-panel overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded-full bg-slate-100" />
        <div className="h-3 w-1/2 rounded-full bg-slate-100" />
        <div className="h-4 w-1/4 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function ShopBanner({ shop, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="customer-panel-strong animate-pulse overflow-hidden">
        <div className="h-48 bg-slate-100 md:h-64" />
        <div className="px-5 py-5 sm:px-6">
          <div className="flex gap-4">
            <div className="h-20 w-20 rounded-3xl bg-slate-100" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-5 w-1/3 rounded-full bg-slate-100" />
              <div className="h-4 w-1/4 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) return null;

  const coverImg = shop.image || shop.logoUrl || null;

  return (
    <div className="customer-panel-strong overflow-hidden">
      <div className="relative h-44 overflow-hidden bg-slate-100 md:h-60">
        {coverImg ? (
          <img src={coverImg} alt={shop.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#e2e8f0_0%,#f8fafc_100%)]">
            <IoStorefrontOutline className="text-7xl text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
      </div>

      <div className="px-5 py-5 sm:px-6 md:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white bg-white shadow-lg">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-contain p-2" />
            ) : (
              <IoStorefrontOutline className="text-4xl text-slate-300" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">{shop.name}</h1>
              {shop.category ? (
                <span className="customer-kicker">{shop.categoryLabel || shop.category}</span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              {shop.location ? (
                <span className="flex items-center gap-1.5">
                  <IoLocationOutline className="text-base" />
                  {shop.location}
                </span>
              ) : null}
              {shop.mallName ? (
                <button
                  type="button"
                  onClick={() => navigate(`/malls/${shop.mallId}`)}
                  className="flex items-center gap-1.5 font-semibold hover:text-blue-700"
                >
                  <IoBusinessOutline className="text-base" />
                  {shop.mallName}
                </button>
              ) : null}
            </div>

            {shop.description ? <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-600">{shop.description}</p> : null}
          </div>

          {shop.mallId ? (
            <button type="button" onClick={() => navigate(`/malls/${shop.mallId}`)} className="customer-secondary-btn shrink-0">
              <IoChevronBack className="text-base" />
              زيارة المول
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [shopLoading, setShopLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [shopError, setShopError] = useState(null);
  const [productsError, setProductsError] = useState(null);
  const [inactive, setInactive] = useState(false);

  useEffect(() => {
    setShopLoading(true);
    setShopError(null);

    customerApi.getShopById(storeId)
      .then((shopData) => {
        if (shopData?.status && shopData.status !== "ACTIVE") {
          setInactive(true);
          return;
        }
        setShop(shopData);
      })
      .catch((requestError) => setShopError(requestError.message))
      .finally(() => setShopLoading(false));
  }, [storeId]);

  const loadProducts = useCallback(
    (page = 0, append = false) => {
      if (page === 0) { setProductsLoading(true); setProductsError(null); }
      else setLoadingMore(true);

      customerApi
        .getProducts({ storeId: Number(storeId) }, page, 20)
        .then(({ products: list, totalPages: pages, total: totalItems }) => {
          setProducts((prev) => (append ? [...prev, ...list] : list));
          setTotalPages(pages);
          setTotal(totalItems);
          setCurrentPage(page);
        })
        .catch((e) => setProductsError(e.message))
        .finally(() => {
          setProductsLoading(false);
          setLoadingMore(false);
        });
    },
    [storeId]
  );

  useEffect(() => {
    loadProducts(0);
  }, [loadProducts]);

  if (!shopLoading && shopError) {
    return (
      <div dir="rtl" className="customer-page flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="customer-panel-strong max-w-md px-8 py-10 text-center">
            <IoStorefrontOutline className="mx-auto mb-4 text-5xl text-slate-300" />
            <h2 className="text-xl font-extrabold text-slate-900">تعذر تحميل المتجر</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{shopError}</p>
            <button type="button" onClick={() => navigate(-1)} className="customer-primary-btn mt-6">
              رجوع
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!shopLoading && inactive) {
    return (
      <div dir="rtl" className="customer-page flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="customer-panel-strong max-w-md px-8 py-10 text-center">
            <IoStorefrontOutline className="mx-auto mb-4 text-5xl text-slate-300" />
            <h2 className="text-xl font-extrabold text-slate-900">المتجر غير متاح حاليًا</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              هذا المتجر غير نشط الآن. يمكنك العودة إلى الصفحة الرئيسية أو تجربة متجر آخر.
            </p>
            <button type="button" onClick={() => navigate("/")} className="customer-primary-btn mt-6">
              الصفحة الرئيسية
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div dir="rtl" className="customer-page">
      <Header />

      <div className="customer-shell px-4 py-8 sm:px-6 md:px-12 md:py-10">
        <ShopBanner shop={shop} loading={shopLoading} />

        <section className="mt-8">
          <div className="customer-panel-strong px-5 py-5 sm:px-6 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="customer-icon-chip h-11 w-11 text-sm">
                  <IoGridOutline />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">منتجات المتجر</h2>
                  <p className="text-sm text-slate-500">{productsLoading ? "..." : `${total} منتج`}</p>
                </div>
              </div>
            </div>

            <div className="customer-divider my-6" />

            {productsLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))}
              </div>
            ) : productsError ? (
              <div className="px-6 py-14 text-center">
                <FiPackage className="mx-auto mb-4 text-5xl text-slate-300" />
                <h3 className="text-xl font-extrabold text-slate-900">تعذّر تحميل المنتجات</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{productsError}</p>
                <button type="button" onClick={() => loadProducts(0)} className="customer-secondary-btn mt-6">
                  إعادة المحاولة
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <FiPackage className="mx-auto mb-4 text-5xl text-slate-300" />
                <h3 className="text-xl font-extrabold text-slate-900">لا توجد منتجات بعد</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  لم تتم إضافة منتجات لهذا المتجر في الوقت الحالي.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} p={product} onAddToCart={() => {}} />
                  ))}
                </div>

                {currentPage < totalPages - 1 ? (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => loadProducts(currentPage + 1, true)}
                      disabled={loadingMore}
                      className="customer-secondary-btn"
                    >
                      {loadingMore ? <Spinner /> : null}
                      {loadingMore ? "جارٍ التحميل..." : "عرض المزيد"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>

        <div className="customer-divider mt-12" />
      </div>

      <Footer />
    </div>
  );
}
