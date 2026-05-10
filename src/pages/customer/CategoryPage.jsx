import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiChevronLeft, FiGrid, FiRefreshCw } from "react-icons/fi";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import CatalogFilters from "../../components/customer/CatalogFilters";
import { catalogApi, normalizeCatalogPage, unwrapCatalogPayload } from "../../api/catalog";
import { toProductCard } from "../../utils/catalogProducts";
import { buildCatalogFilterPayload } from "../../utils/catalogFilters";
import { mapCatalogCategory } from "../../utils/customerBackendMappers";

const defaultFilters = {
  categoryId: "",
  brandId: "",
  minPrice: "",
  maxPrice: "",
  targetedAudience: "",
  ageGroup: "",
  selectedOptionsByAttribute: {},
};

function flattenTree(nodes = []) {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children || [])]);
}

function findNode(nodes = [], id) {
  for (const node of nodes) {
    if (String(node.id) === String(id)) return node;
    const child = findNode(node.children || [], id);
    if (child) return child;
  }
  return null;
}

export default function CategoryPage() {
  const { categoryId, slug } = useParams();
  const [categoryTree, setCategoryTree] = useState([]);
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadingCategory(true);
    setError("");

    Promise.all([
      catalogApi.categories.tree().catch(() => null),
      slug ? catalogApi.categories.bySlug(slug) : catalogApi.categories.byId(categoryId),
    ])
      .then(([treeResponse, categoryResponse]) => {
        if (cancelled) return;
        const mappedTree = (unwrapCatalogPayload(treeResponse) || []).map(mapCatalogCategory);
        const selected = mapCatalogCategory(unwrapCatalogPayload(categoryResponse));
        setCategoryTree(mappedTree);
        setCategory(selected);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setCategory(null);
          setError(requestError.message || "تعذر تحميل الفئة.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCategory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, slug]);

  const selectedTreeNode = useMemo(
    () => findNode(categoryTree, category?.id) || category,
    [category, categoryTree]
  );
  const descendantIds = useMemo(
    () => flattenTree(selectedTreeNode?.children || []).map((item) => Number(item.id)).filter(Number.isFinite),
    [selectedTreeNode]
  );
  const categoryIds = useMemo(() => {
    const ids = [Number(category?.id), ...descendantIds].filter(Number.isFinite);
    return Array.from(new Set(ids));
  }, [category?.id, descendantIds]);
  const categorySummaryScopeFilter = useMemo(
    () => (categoryIds.length ? { categoryIds } : {}),
    [categoryIds]
  );

  useEffect(() => {
    if (!categoryIds.length) {
      setProducts([]);
      return undefined;
    }

    let cancelled = false;
    setLoadingProducts(true);
    setError("");

    catalogApi.products.publicPage(
      {
        ...buildCatalogFilterPayload(filters),
        categoryIds,
      },
      { page: 0, size: 60 }
    )
      .then((response) => {
        if (!cancelled) setProducts(normalizeCatalogPage(response).content.map(toProductCard));
      })
      .catch((requestError) => {
        if (!cancelled) {
          setProducts([]);
          setError(requestError.message || "تعذر تحميل منتجات الفئة.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryIds, filters]);

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-400 px-4 py-8 sm:px-6 md:px-12 2xl:max-w-[1920px]">
        <section className="overflow-hidden border border-black/10 bg-neutral-50">
          <div className="grid gap-0 md:grid-cols-[320px_1fr]">
            <div className="aspect-[4/3] bg-neutral-100 md:aspect-auto">
              {selectedTreeNode?.imageUrl ? (
                <img src={selectedTreeNode.imageUrl} alt={selectedTreeNode.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-6xl font-light text-black/20">
                  {selectedTreeNode?.name?.[0] || "ف"}
                </div>
              )}
            </div>
            <div className="p-6 text-right md:p-8">
              <p className="text-[10px] font-semibold tracking-[0.28em] text-black/35">فئة مباشرة</p>
              <h1 className="mt-3 text-3xl font-light text-black md:text-5xl">
                {loadingCategory && !selectedTreeNode ? "جاري تحميل الفئة..." : selectedTreeNode?.name || "الفئة"}
              </h1>
              {selectedTreeNode?.description ? (
                <p className="mt-4 max-w-2xl text-sm leading-7 text-black/55">{selectedTreeNode.description}</p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-black/50">
                <span className="border border-black/10 bg-white px-3 py-1.5">
                  تشمل {categoryIds.length} فئة
                </span>
                <span className="border border-black/10 bg-white px-3 py-1.5">
                  {loadingProducts ? "..." : products.length} منتج
                </span>
              </div>
            </div>
          </div>
        </section>

        {selectedTreeNode?.children?.length ? (
          <section className="mt-6 border border-black/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-black">
              <FiGrid />
              فئات فرعية
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTreeNode.children.map((child) => (
                <Link
                  key={child.id}
                  to={`/categories/${child.id}`}
                  className="inline-flex items-center gap-2 border border-black/10 px-4 py-2 text-xs font-semibold text-black transition hover:border-black hover:bg-black hover:text-white"
                >
                  {child.name}
                  <FiChevronLeft size={12} />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-6">
          <CatalogFilters
            filters={filters}
            onChange={setFilters}
            compact
            hiddenFields={["categoryId"]}
            summaryScope="public"
            fixedSummaryFilter={categorySummaryScopeFilter}
            summaryEnabled={categoryIds.length > 0}
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
            لا توجد منتجات متاحة ضمن هذه الفئة حالياً.
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
