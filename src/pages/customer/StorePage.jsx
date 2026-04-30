import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import SectionHeader from "../../components/customer/HomePageComponents/SectionHeader";
import rawStores from "../../assets/stores.json";
import { normalizeStores } from "../../utils/tmpMallsAndStores";
import { catalogApi, normalizeCatalogPage } from "../../api/catalog";
import { toProductCard } from "../../utils/catalogProducts";
import CatalogFilters, { buildCatalogFilterPayload } from "../../components/customer/CatalogFilters";

export default function StorePage() {
  const { storeId } = useParams();
  const stores = useMemo(() => normalizeStores(rawStores), []);
  const store = useMemo(
    () => stores.find((item) => String(item.id) === String(storeId)),
    [storeId, stores]
  );
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
            {store?.name || `متجر #${storeId}`}
          </h1>
          {store?.specialist ? (
            <p className="mt-2 text-sm text-black/50">{store.specialist}</p>
          ) : null}
        </div>

        <SectionHeader title="منتجات المتجر" onViewAll={() => {}} />

        <div className="mt-5">
          <CatalogFilters filters={filters} onChange={setFilters} compact />
        </div>

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
