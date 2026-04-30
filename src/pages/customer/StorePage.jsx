import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import SectionHeader from "../../components/customer/HomePageComponents/SectionHeader";
import { accountsApi, unwrapAccountPayload } from "../../api/accounts";
import { catalogApi, normalizeCatalogPage } from "../../api/catalog";
import { toProductCard } from "../../utils/catalogProducts";
import CatalogFilters, { buildCatalogFilterPayload } from "../../components/customer/CatalogFilters";
import { mapAccountShop } from "../../utils/customerBackendMappers";

export default function StorePage() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    categoryId: "",
    brandId: "",
    minPrice: "",
    maxPrice: "",
    targetedAudience: "",
    ageGroup: "",
    selectedOptionsByAttribute: {},
  });

  useEffect(() => {
    let cancelled = false;
    setStoreLoading(true);
    setStoreError("");

    accountsApi.shops.byId(storeId)
      .then((response) => {
        if (!cancelled) {
          setStore(mapAccountShop(unwrapAccountPayload(response)));
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setStore(null);
          setStoreError(requestError.message || "تعذر تحميل بيانات المتجر");
        }
      })
      .finally(() => {
        if (!cancelled) setStoreLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    catalogApi.products.publicPage(
      { storeId: Number(storeId), ...buildCatalogFilterPayload(filters) },
      { page: 0, size: 60 }
    )
      .then((response) => {
        if (!cancelled) {
          setProducts(normalizeCatalogPage(response).content.map(toProductCard));
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "فشل تحميل منتجات المتجر");
          setProducts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, storeId]);

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-400 2xl:max-w-[1920px] px-4 py-8 sm:px-6 md:px-12">
        <div className="mb-8 border-b border-black/10 pb-6 text-right">
          <h1 className="text-3xl font-light tracking-wide text-black">
            {storeLoading && !store ? "جاري تحميل المتجر..." : store?.name || `متجر #${storeId}`}
          </h1>
          {store?.category || store?.mallName ? (
            <p className="mt-2 text-sm text-black/50">
              {[store?.category, store?.mallName ? `في ${store.mallName}` : ""].filter(Boolean).join(" • ")}
            </p>
          ) : null}
        </div>

        <SectionHeader title="منتجات المتجر" onViewAll={() => {}} />

        <div className="mt-5">
          <CatalogFilters filters={filters} onChange={setFilters} compact />
        </div>

        {storeError ? <div className="mt-6 border border-black/10 bg-white px-4 py-3 text-sm text-black/60">{storeError}</div> : null}
        {error ? <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {loading ? <div className="mt-8 text-sm text-black/50">جاري تحميل المنتجات...</div> : null}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} p={product} onAddToCart={() => {}} />
          ))}
        </div>

        {!loading && !products.length ? (
          <div className="mt-10 border border-black/10 p-8 text-center text-sm text-black/50">
            لا توجد منتجات متاحة لهذا المتجر.
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
