import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiRefreshCw, FiTag } from "react-icons/fi";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import CatalogFilters from "../../components/customer/CatalogFilters";
import { catalogApi, normalizeCatalogPage, unwrapCatalogPayload } from "../../api/catalog";
import { toProductCard } from "../../utils/catalogProducts";
import { buildCatalogFilterPayload } from "../../utils/catalogFilters";
import { mapCatalogBrand } from "../../utils/customerBackendMappers";

const defaultFilters = {
  categoryId: "",
  brandId: "",
  minPrice: "",
  maxPrice: "",
  targetedAudience: "",
  ageGroup: "",
  selectedOptionsByAttribute: {},
};

export default function BrandPage() {
  const { brandId, slug } = useParams();
  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadingBrand(true);
    setError("");

    const request = slug ? catalogApi.brands.bySlug(slug) : catalogApi.brands.byId(brandId);
    request
      .then((response) => {
        if (!cancelled) setBrand(mapCatalogBrand(unwrapCatalogPayload(response)));
      })
      .catch((requestError) => {
        if (!cancelled) {
          setBrand(null);
          setError(requestError.message || "تعذر تحميل البراند.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBrand(false);
      });

    return () => {
      cancelled = true;
    };
  }, [brandId, slug]);

  useEffect(() => {
    if (!brand?.id) {
      setProducts([]);
      return undefined;
    }

    let cancelled = false;
    setLoadingProducts(true);
    setError("");

    catalogApi.products.publicPage(
      {
        ...buildCatalogFilterPayload(filters),
        brandId: Number(brand.id),
      },
      { page: 0, size: 60 }
    )
      .then((response) => {
        if (!cancelled) setProducts(normalizeCatalogPage(response).content.map(toProductCard));
      })
      .catch((requestError) => {
        if (!cancelled) {
          setProducts([]);
          setError(requestError.message || "تعذر تحميل منتجات البراند.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [brand?.id, filters]);

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-400 px-4 py-8 sm:px-6 md:px-12 2xl:max-w-[1920px]">
        <section className="overflow-hidden border border-black/10 bg-neutral-50">
          <div className="grid gap-0 md:grid-cols-[320px_1fr]">
            <div className="aspect-[4/3] bg-white md:aspect-auto">
              {brand?.imageUrl ? (
                <img src={brand.imageUrl} alt={brand.name} className="h-full w-full object-contain p-8" />
              ) : (
                <div className="grid h-full place-items-center text-6xl font-light text-black/20">
                  {brand?.name?.[0] || "ب"}
                </div>
              )}
            </div>
            <div className="p-6 text-right md:p-8">
              <p className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.28em] text-black/35">
                <FiTag />
                براند
              </p>
              <h1 className="mt-3 text-3xl font-light text-black md:text-5xl">
                {loadingBrand && !brand ? "جاري تحميل البراند..." : brand?.name || "البراند"}
              </h1>
              {brand?.description ? (
                <p className="mt-4 max-w-2xl text-sm leading-7 text-black/55">{brand.description}</p>
              ) : null}
              <div className="mt-6 border border-black/10 bg-white px-4 py-2 text-xs text-black/50">
                {loadingProducts ? "..." : products.length} منتج متاح
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <CatalogFilters
            filters={filters}
            onChange={setFilters}
            compact
            hiddenFields={["brandId"]}
            summaryScope="public"
            fixedSummaryFilter={brand?.id ? { brandId: Number(brand.id) } : {}}
            summaryEnabled={Boolean(brand?.id)}
          />
        </div>

        {error ? <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {loadingProducts ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-black/50">
            <FiRefreshCw className="animate-spin" size={14} />
            جاري تحميل المنتجات...
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} p={product} onAddToCart={() => {}} />
          ))}
        </div>

        {!loadingProducts && !products.length ? (
          <div className="mt-10 border border-black/10 p-8 text-center text-sm text-black/50">
            لا توجد منتجات متاحة لهذا البراند حالياً.
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
