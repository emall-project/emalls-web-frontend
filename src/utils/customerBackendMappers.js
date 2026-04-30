import { getMediaPreviewUrl } from "../api/mediaManager";

function asStringId(value) {
  return value == null ? "" : String(value);
}

function firstImageUrl(files = []) {
  return (Array.isArray(files) ? files : []).map(getMediaPreviewUrl).find(Boolean) || "";
}

export function mapCatalogCategory(category) {
  return {
    id: asStringId(category?.id ?? category?.categoryId),
    name: category?.name || "تصنيف",
    description: category?.description || "",
    parentId:
      category?.parentId == null && category?.parent?.id == null
        ? null
        : asStringId(category?.parentId ?? category?.parent?.id),
    imageUrl: getMediaPreviewUrl(category?.image),
  };
}

export function mapAccountMall(mall) {
  const id = mall?.mallId ?? mall?.id;
  return {
    id: asStringId(id),
    mallId: id,
    name: mall?.name || "مول",
    location: mall?.location || mall?.city?.name || "",
    city: mall?.city?.name || "",
    logoUrl: getMediaPreviewUrl(mall?.logoImage),
    images: (mall?.mallImages || [])
      .map((image, index) => ({
        id: image?.id || `${id || "mall"}-${index}`,
        image: getMediaPreviewUrl(image),
        alt: mall?.name || "Mall",
      }))
      .filter((image) => image.image),
    services: mall?.services || [],
    description: mall?.description || "",
    status: mall?.status || "",
  };
}

export function mapAccountShop(shop) {
  const id = shop?.shopId ?? shop?.id;
  const mallId = shop?.mall?.mallId ?? shop?.mall?.id ?? shop?.mallId;
  return {
    id: asStringId(id),
    shopId: id,
    name: shop?.name || "متجر",
    mallId: asStringId(mallId),
    logoUrl: getMediaPreviewUrl(shop?.logoImage),
    floor: shop?.floor || "",
    specialist: shop?.category || shop?.specialist || "",
    image: firstImageUrl(shop?.shopPhotos),
    status: shop?.status || "",
  };
}

export function mapDisplayedAd(ad) {
  const image = getMediaPreviewUrl(ad?.adRequestImage);
  if (!image) return null;

  const shopId = ad?.shopId ?? ad?.shop?.shopId ?? ad?.shop?.id;

  return {
    id: ad?.adRequestId ?? ad?.id ?? image,
    image,
    alt: ad?.title || ad?.template?.name || "Ad",
    href: shopId ? `/stores/${shopId}` : "#",
    position: ad?.template?.position || "",
  };
}

export function toMallSearchItem(mall) {
  return {
    type: "mall",
    id: mall.id,
    title: mall.name,
    subtitle: mall.location || mall.city || "",
    imageUrl: mall.logoUrl || "",
    href: `/malls/${mall.id}`,
  };
}

export function toShopSearchItem(shop, malls = []) {
  const mall = malls.find((item) => String(item.id) === String(shop.mallId));
  return {
    type: "store",
    id: shop.id,
    title: shop.name,
    subtitle: mall?.name ? `في ${mall.name}` : shop.specialist || "",
    imageUrl: shop.logoUrl || shop.image || "",
    href: `/stores/${shop.id}`,
  };
}
