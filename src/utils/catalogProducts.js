import { getMediaPreviewUrl } from "../api/mediaManager";

export function getProductImage(product, size = "small") {
  const file =
    product?.medium ||
    product?.mediumFile ||
    product?.variants?.find((variant) => variant.isDefault)?.media?.[0]?.mediumFile ||
    product?.variants?.[0]?.media?.[0]?.mediumFile ||
    null;

  const fileUrl = getMediaPreviewUrl(file, size);

  return (
    (size === "small" || size === "thumbnail" ? product?.imageUrl : fileUrl) ||
    fileUrl ||
    product?.imageUrl ||
    file?.smallFileUrl ||
    "/vite.svg"
  );
}

export function getDefaultVariant(product) {
  return product?.variants?.find((variant) => variant.isDefault) || product?.variants?.[0] || null;
}

export function getProductPrice(product) {
  const variant = getDefaultVariant(product);
  const basePrice = product?.price ?? product?.basePrice ?? variant?.basePrice ?? 0;
  const discountedPrice = product?.discountedPrice ?? variant?.discountedPrice;
  return Number(discountedPrice ?? basePrice ?? 0);
}

export function getProductOldPrice(product) {
  if (product?.oldPrice != null && Number(product.oldPrice) > getProductPrice(product)) {
    return Number(product.oldPrice);
  }

  const variant = getDefaultVariant(product);
  const hasDiscount = product?.hasDiscount || variant?.hasDiscount;
  if (!hasDiscount) return null;
  return Number(product?.basePrice ?? variant?.basePrice ?? 0);
}

export function hasProductDiscount(product) {
  return !!getProductOldPrice(product) && getProductOldPrice(product) > getProductPrice(product);
}

export function toProductCard(product) {
  const price = getProductPrice(product);
  const oldPrice = getProductOldPrice(product);

  return {
    ...product,
    id: product?.id,
    name: product?.name || "منتج",
    imageUrl: getProductImage(product),
    price,
    oldPrice,
    status: product?.shortDescription || product?.status || "",
    href: product?.slug ? `/products/slug/${product.slug}` : `/products/${product?.id}`,
    outOfStock: product?.outOfStock || false,
  };
}
