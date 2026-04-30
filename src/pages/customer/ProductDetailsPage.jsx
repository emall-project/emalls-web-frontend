import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiFlag, FiHeart, FiImage, FiLoader, FiMessageSquare, FiMinus, FiPlus, FiSend, FiShoppingCart, FiStar, FiTrash2 } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import ProductsRow from "../../components/customer/HomePageComponents/ProductsRow";
import { catalogApi, unwrapCatalogPayload } from "../../api/catalog";
import { useAuth } from "../../auth/AuthContext";
import { useCart } from "../../cart/CartContext";
import { getDefaultVariant, getProductImage, getProductPrice, getProductOldPrice, toProductCard } from "../../utils/catalogProducts";
import { getMediaPreviewUrl } from "../../api/mediaManager";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("ar", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProductDetailsPage() {
  const { productId, slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCustomer, isAuthenticated, session } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeMediaUrl, setActiveMediaUrl] = useState("");
  const [similar, setSimilar] = useState([]);
  const [comments, setComments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [favorite, setFavorite] = useState(false);
  const [myComment, setMyComment] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const mallId = Number(productInfo?.mallId ?? product?.mallId ?? 0) || null;

  const defaultVariant = useMemo(() => getDefaultVariant(product), [product]);
  const variants = product?.variants || [];
  const selectedVariant = useMemo(
    () =>
      variants.find((variant) => String(variant.id) === String(selectedVariantId)) ||
      defaultVariant,
    [defaultVariant, selectedVariantId, variants]
  );
  const selectedInfoVariant = useMemo(
    () =>
      productInfo?.variants?.find((variant) => String(variant.variantId) === String(selectedVariant?.id)) ||
      productInfo?.variants?.find((variant) => variant.isDefault),
    [productInfo?.variants, selectedVariant?.id]
  );
  const variantMedia = useMemo(
    () => (selectedVariant?.media || []).map((medium) => medium.mediumFile).filter(Boolean),
    [selectedVariant]
  );
  const imageUrl = activeMediaUrl || getMediaPreviewUrl(variantMedia[0]) || getProductImage(product);
  const displayPrice = Number(
    selectedVariant?.discountedPrice ??
    selectedInfoVariant?.basePrice ??
    getProductPrice(product)
  );
  const oldPrice = selectedVariant?.hasDiscount
    ? Number(selectedVariant.basePrice)
    : getProductOldPrice(product);
  const attributeMap = useMemo(() => {
    const map = new Map();
    attributes.forEach((attribute) => {
      const optionsById = new Map((attribute.options || []).map((option) => [String(option.id), option.value]));
      map.set(String(attribute.id), { name: attribute.name, optionsById });
    });
    return map;
  }, [attributes]);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = slug
        ? await catalogApi.products.bySlug(slug)
        : await catalogApi.products.byId(productId);
      const nextProduct = unwrapCatalogPayload(response);
      setProduct(nextProduct);

      if (nextProduct?.id) {
        const [infoResponse, similarResponse, commentsResponse, reviewsResponse, attributesResponse] = await Promise.all([
          catalogApi.products.info(nextProduct.id).catch(() => null),
          catalogApi.products.similar(nextProduct.id, 8).catch(() => null),
          catalogApi.comments.approved(nextProduct.id).catch(() => null),
          catalogApi.reviews.all(nextProduct.id).catch(() => null),
          catalogApi.attributes.all({ isActive: true }).catch(() => null),
        ]);
        const info = unwrapCatalogPayload(infoResponse);
        setProductInfo(info || null);
        setSimilar((unwrapCatalogPayload(similarResponse) || []).map(toProductCard));
        setComments(unwrapCatalogPayload(commentsResponse) || []);
        setReviews(unwrapCatalogPayload(reviewsResponse) || []);
        setAttributes(unwrapCatalogPayload(attributesResponse) || []);
        const initialVariant =
          nextProduct.variants?.find((variant) => variant.isDefault) ||
          nextProduct.variants?.[0] ||
          null;
        setSelectedVariantId(initialVariant?.id ? String(initialVariant.id) : "");
        setActiveMediaUrl(getMediaPreviewUrl(initialVariant?.media?.[0]?.mediumFile) || "");

        if (isCustomer) {
          const [favoriteResponse, myCommentResponse, myReviewResponse] = await Promise.all([
            catalogApi.favorites.exists(nextProduct.id).catch(() => null),
            catalogApi.comments.mineForProduct(nextProduct.id).catch(() => null),
            catalogApi.reviews.mine(nextProduct.id).catch(() => null),
          ]);
          setFavorite(!!unwrapCatalogPayload(favoriteResponse)?.favorite);
          const ownedComment = unwrapCatalogPayload(myCommentResponse);
          const ownedReview = unwrapCatalogPayload(myReviewResponse);
          setMyComment(ownedComment?.commentId ? ownedComment : null);
          setCommentText(ownedComment?.content || "");
          setMyReview(ownedReview?.reviewId ? ownedReview : null);
          setRating(ownedReview?.rating || 5);
        }
      }
    } catch (requestError) {
      setError(requestError.message || "فشل تحميل المنتج");
    } finally {
      setLoading(false);
    }
  }, [isCustomer, productId, slug]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    setActiveMediaUrl(getMediaPreviewUrl(selectedVariant?.media?.[0]?.mediumFile) || "");
  }, [selectedVariant?.id]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id, product?.id]);

  const requireCustomer = () => {
    if (!isAuthenticated || !isCustomer) {
      navigate("/login", { state: { from: location } });
      return false;
    }
    return true;
  };

  const toggleFavorite = async () => {
    if (!product?.id || !requireCustomer()) return;
    setSaving("favorite");
    try {
      if (favorite) {
        await catalogApi.favorites.deleteProduct(product.id);
        setFavorite(false);
      } else {
        await catalogApi.favorites.create(product.id);
        setFavorite(true);
      }
    } catch (requestError) {
      setError(requestError.message || "فشل تحديث المفضلة");
    } finally {
      setSaving("");
    }
  };

  const saveComment = async () => {
    if (!product?.id || !commentText.trim() || !requireCustomer()) return;
    setSaving("comment");
    try {
      if (myComment?.commentId) {
        await catalogApi.comments.update(product.id, {
          commentId: myComment.commentId,
          content: commentText.trim(),
        });
      } else {
        await catalogApi.comments.create(product.id, {
          userId: session?.userId,
          content: commentText.trim(),
        });
      }
      await loadProduct();
    } catch (requestError) {
      setError(requestError.message || "فشل حفظ التعليق");
    } finally {
      setSaving("");
    }
  };

  const deleteComment = async () => {
    if (!product?.id || !requireCustomer()) return;
    setSaving("comment");
    try {
      await catalogApi.comments.delete(product.id);
      setMyComment(null);
      setCommentText("");
      await loadProduct();
    } catch (requestError) {
      setError(requestError.message || "فشل حذف التعليق");
    } finally {
      setSaving("");
    }
  };

  const reportComment = async (comment) => {
    if (!product?.id || !comment?.commentId || !requireCustomer()) return;
    setSaving(`report-${comment.commentId}`);
    try {
      await catalogApi.comments.report(product.id, comment.commentId);
      await loadProduct();
    } catch (requestError) {
      setError(requestError.message || "فشل الإبلاغ عن التعليق");
    } finally {
      setSaving("");
    }
  };

  const saveReview = async () => {
    if (!product?.id || !requireCustomer()) return;
    setSaving("review");
    try {
      if (myReview?.reviewId) {
        await catalogApi.reviews.update(product.id, {
          reviewId: myReview.reviewId,
          rating: Number(rating),
        });
      } else {
        await catalogApi.reviews.create(product.id, {
          userId: session?.userId,
          rating: Number(rating),
        });
      }
      await loadProduct();
    } catch (requestError) {
      setError(requestError.message || "فشل حفظ التقييم");
    } finally {
      setSaving("");
    }
  };

  const deleteReview = async () => {
    if (!product?.id || !requireCustomer()) return;
    setSaving("review");
    try {
      await catalogApi.reviews.delete(product.id);
      setMyReview(null);
      setRating(5);
      await loadProduct();
    } catch (requestError) {
      setError(requestError.message || "فشل حذف التقييم");
    } finally {
      setSaving("");
    }
  };

  const addCurrentVariantToCart = async () => {
    if (!product?.id || !selectedVariant?.id) {
      setError("اختر متغيرًا صالحًا قبل الإضافة إلى السلة");
      return;
    }

    if (!mallId) {
      setError("تعذر تحديد المول لهذا المنتج");
      return;
    }

    if (!requireCustomer()) {
      return;
    }

    setSaving("cart");
    setError("");

    try {
      await addItem({
        mallId,
        productId: Number(product.id),
        variantId: Number(selectedVariant.id),
        quantity,
      });
    } catch (requestError) {
      setError(requestError.message || "فشل إضافة المنتج إلى السلة");
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-white">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center text-black/50">
          <FiLoader className="animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div dir="rtl" className="min-h-screen bg-white">
        <Header />
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h1 className="text-2xl font-light text-black">المنتج غير موجود</h1>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-400 2xl:max-w-[1920px] px-4 py-8 sm:px-6 md:px-12">
        {error ? (
          <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <div className="bg-neutral-50">
              {imageUrl ? (
                <img src={imageUrl} alt={product.name} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center text-black/30">
                  <FiImage size={36} />
                </div>
              )}
            </div>
            {variantMedia.length > 1 ? (
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {variantMedia.map((file) => {
                  const url = getMediaPreviewUrl(file);
                  if (!url) return null;
                  return (
                    <button
                      type="button"
                      key={file.id || url}
                      onClick={() => setActiveMediaUrl(url)}
                      className="border border-black/10 bg-white p-1"
                    >
                      <img src={url} alt={file.name || product.name} className="aspect-square w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="text-right">
            <div className="border-b border-black/10 pb-6">
              <h1 className="text-3xl font-light tracking-wide text-black">{product.name}</h1>
              {product.shortDescription ? (
                <p className="mt-3 text-sm leading-7 text-black/60">{product.shortDescription}</p>
              ) : null}
              <div className="mt-5 flex items-end gap-3">
                <span className="text-3xl font-semibold text-black">₪{formatPrice(displayPrice)}</span>
                {oldPrice && oldPrice > displayPrice ? (
                  <span className="pb-1 text-sm text-black/40 line-through">₪{formatPrice(oldPrice)}</span>
                ) : null}
              </div>
              {(productInfo?.categoryName || productInfo?.brandName) ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-black/60">
                  {productInfo.categoryName ? <span className="border border-black/10 px-3 py-1">{productInfo.categoryName}</span> : null}
                  {productInfo.brandName ? <span className="border border-black/10 px-3 py-1">{productInfo.brandName}</span> : null}
                </div>
              ) : null}
            </div>

            {variants.length ? (
              <div className="border-b border-black/10 py-5">
                <h2 className="mb-3 text-sm font-semibold tracking-wide text-black">المتغيرات</h2>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <button
                      key={variant.id || variant.name}
                      type="button"
                      onClick={() => setSelectedVariantId(String(variant.id))}
                      className="border px-3 py-2 text-sm transition"
                      style={{
                        borderColor: String(selectedVariant?.id) === String(variant.id) ? "#000" : "rgba(0,0,0,.12)",
                        background: String(selectedVariant?.id) === String(variant.id) ? "#000" : "#fff",
                        color: String(selectedVariant?.id) === String(variant.id) ? "#fff" : "#000",
                      }}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
                {selectedVariant?.attributes?.length ? (
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    {selectedVariant.attributes.map((attribute) => {
                      const meta = attributeMap.get(String(attribute.attributeId));
                      return (
                        <div key={`${attribute.attributeId}-${attribute.optionId}`} className="border border-black/10 p-3">
                          <dt className="text-xs text-black/40">{meta?.name || `خاصية #${attribute.attributeId}`}</dt>
                          <dd className="mt-1 text-black">{meta?.optionsById?.get(String(attribute.optionId)) || attribute.optionId}</dd>
                        </div>
                      );
                    })}
                  </dl>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 py-5 sm:flex-row">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  disabled={quantity <= 1 || saving === "cart"}
                  className="inline-flex h-11 w-11 items-center justify-center border border-black/10 text-black disabled:opacity-35"
                >
                  <FiMinus />
                </button>
                <div className="inline-flex h-11 min-w-14 items-center justify-center border border-black/10 px-3 text-sm font-semibold text-black">
                  {quantity}
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.min(99, current + 1))}
                  disabled={saving === "cart"}
                  className="inline-flex h-11 w-11 items-center justify-center border border-black/10 text-black disabled:opacity-35"
                >
                  <FiPlus />
                </button>
              </div>
              <button
                type="button"
                onClick={addCurrentVariantToCart}
                disabled={saving === "cart" || !selectedVariant?.id || !mallId}
                className="flex flex-1 items-center justify-center gap-2 bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving === "cart" ? <FiLoader className="animate-spin" /> : <FiShoppingCart />}
                إضافة للسلة
              </button>
              <button
                type="button"
                onClick={toggleFavorite}
                disabled={saving === "favorite"}
                className="inline-flex w-14 items-center justify-center border border-black/10 text-black"
                title="المفضلة"
              >
                {saving === "favorite" ? <FiLoader className="animate-spin" /> : <FiHeart fill={favorite ? "currentColor" : "none"} />}
              </button>
            </div>

            {product.description ? (
              <div className="border-t border-black/10 pt-5">
                <h2 className="mb-3 text-sm font-semibold tracking-wide text-black">الوصف</h2>
                <p className="whitespace-pre-wrap text-sm leading-8 text-black/70">{product.description}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="border border-black/10 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-light text-black">
              <FiStar />
              التقييمات
            </h2>
            <div className="mb-5 flex items-center gap-3">
              <select value={rating} onChange={(event) => setRating(event.target.value)} className="border border-black/10 px-3 py-2 text-sm">
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <button type="button" onClick={saveReview} className="bg-black px-4 py-2 text-sm text-white">
                {saving === "review" ? "جار الحفظ..." : myReview ? "تحديث التقييم" : "إضافة تقييم"}
              </button>
              {myReview ? (
                <button type="button" onClick={deleteReview} className="border border-black/10 px-4 py-2 text-sm text-black">
                  حذف التقييم
                </button>
              ) : null}
            </div>
            <div className="space-y-3">
              {reviews.length ? reviews.map((review) => (
                <div key={review.reviewId} className="border-t border-black/10 pt-3 text-sm text-black/70">
                  <div>{review.rating} / 5</div>
                  {review.averageRating ? (
                    <div className="mt-1 text-xs text-black/40">المتوسط: {Number(review.averageRating).toFixed(1)} من {review.totalReviews || reviews.length} تقييم</div>
                  ) : null}
                </div>
              )) : <p className="text-sm text-black/50">لا توجد تقييمات بعد.</p>}
            </div>
          </div>

          <div className="border border-black/10 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-light text-black">
              <FiMessageSquare />
              التعليقات
            </h2>
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              className="mb-3 min-h-24 w-full border border-black/10 p-3 text-sm outline-none"
              placeholder="اكتب تعليقك"
            />
            <div className="mb-5 flex gap-2">
              <button type="button" onClick={saveComment} className="inline-flex items-center gap-2 bg-black px-4 py-2 text-sm text-white">
                <FiSend />
                {saving === "comment" ? "جار الحفظ..." : myComment ? "تحديث التعليق" : "إضافة تعليق"}
              </button>
              {myComment ? (
                <button type="button" onClick={deleteComment} className="inline-flex items-center gap-2 border border-black/10 px-4 py-2 text-sm">
                  <FiTrash2 />
                  حذف
                </button>
              ) : null}
            </div>
            <div className="space-y-3">
              {comments.length ? comments.map((comment) => (
                <div key={comment.commentId} className="border-t border-black/10 pt-3">
                  <p className="text-sm leading-7 text-black/70">{comment.content}</p>
                  <button
                    type="button"
                    onClick={() => reportComment(comment)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-black/40 hover:text-black"
                    disabled={saving === `report-${comment.commentId}`}
                  >
                    <FiFlag />
                    إبلاغ
                  </button>
                </div>
              )) : <p className="text-sm text-black/50">لا توجد تعليقات مقبولة بعد.</p>}
            </div>
          </div>
        </section>
      </main>

      <ProductsRow title="منتجات مشابهة" products={similar} />
      <Footer />
    </div>
  );
}
