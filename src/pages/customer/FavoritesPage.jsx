import { useEffect, useState } from "react";
import { FiLoader, FiTrash2 } from "react-icons/fi";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import { catalogApi, unwrapCatalogPayload } from "../../api/catalog";
import { toProductCard } from "../../utils/catalogProducts";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    catalogApi.favorites.all()
      .then((response) => {
        if (cancelled) return;
        setFavorites(unwrapCatalogPayload(response) || []);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || "فشل تحميل المفضلة");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const removeFavorite = async (favorite) => {
    const productId = favorite.product?.id || favorite.productId || favorite.productLight?.id;
    const key = String(favorite.id || productId);
    setRemovingId(key);
    setError("");
    try {
      if (productId) {
        await catalogApi.favorites.deleteProduct(productId);
      } else {
        await catalogApi.favorites.delete(favorite.id);
      }
      setFavorites((current) => current.filter((item) => String(item.id || item.productId) !== key));
    } catch (requestError) {
      setError(requestError.message || "فشل حذف المنتج من المفضلة");
    } finally {
      setRemovingId("");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-400 2xl:max-w-[1920px] px-4 py-8 sm:px-6 md:px-12">
        <div className="mb-8 border-b border-black/10 pb-6 text-right">
          <h1 className="text-3xl font-light tracking-wide text-black">المفضلة</h1>
          <p className="mt-2 text-sm text-black/50">المنتجات التي حفظتها للرجوع إليها لاحقًا.</p>
        </div>

        {error ? <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {loading ? <div className="text-sm text-black/50">جاري تحميل المفضلة...</div> : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {favorites.map((favorite) => {
            const key = String(favorite.id || favorite.productId || favorite.product?.id);
            return (
              <div key={key} className="relative">
                <ProductCard
                  p={toProductCard(favorite.product || favorite.productLight || favorite)}
                  onAddToCart={() => {}}
                />
                <button
                  type="button"
                  onClick={() => removeFavorite(favorite)}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 border border-black/10 px-3 py-2 text-xs text-black transition hover:bg-black hover:text-white"
                  disabled={removingId === key}
                >
                  {removingId === key ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                  إزالة من المفضلة
                </button>
              </div>
            );
          })}
        </div>

        {!loading && !favorites.length ? (
          <div className="mt-10 border border-black/10 p-8 text-center text-sm text-black/50">
            لا توجد منتجات في المفضلة.
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
