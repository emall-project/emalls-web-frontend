import { getMediaPreviewUrl } from "../api/mediaManager";

function asStringId(value) {
  return value == null ? "" : String(value);
}

function firstImageUrl(files = [], size = "small") {
  return (Array.isArray(files) ? files : []).map((file) => getMediaPreviewUrl(file, size)).find(Boolean) || "";
}

function splitParagraphs(value) {
  return String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mapMallService(service) {
  return {
    id: asStringId(service?.serviceId ?? service?.id),
    serviceId: service?.serviceId ?? service?.id ?? null,
    name: service?.name || "خدمة",
    description: service?.description || "",
    isActive: service?.isActive ?? true,
  };
}

export function mapMallRestaurant(restaurant) {
  return {
    id: asStringId(restaurant?.restaurantId ?? restaurant?.id),
    restaurantId: restaurant?.restaurantId ?? restaurant?.id ?? null,
    name: restaurant?.name || "مطعم",
    description: restaurant?.description || "",
    cuisineType: restaurant?.cuisineType || "",
    locationInMall: restaurant?.locationInMall || "",
    logoUrl: getMediaPreviewUrl(restaurant?.logoImage),
    isActive: restaurant?.isActive ?? true,
  };
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
  const logoUrl = getMediaPreviewUrl(mall?.logoImage);
  const images = (mall?.mallImages || [])
    .map((image, index) => ({
      id: image?.id || `${id || "mall"}-${index}`,
      image: getMediaPreviewUrl(image, "original"),
      alt: mall?.name || "Mall",
    }))
    .filter((image) => image.image);
  const description = mall?.description || "";

  return {
    id: asStringId(id),
    mallId: id,
    name: mall?.name || "مول",
    location: mall?.location || mall?.city?.name || "",
    city: mall?.city?.name || "",
    logoUrl,
    images: images.length ? images : logoUrl ? [{ id: `${id || "mall"}-logo`, image: getMediaPreviewUrl(mall?.logoImage, "original") || logoUrl, alt: mall?.name || "Mall" }] : [],
    services: (Array.isArray(mall?.services) ? mall.services : []).map(mapMallService),
    restaurants: (Array.isArray(mall?.restaurants) ? mall.restaurants : []).map(mapMallRestaurant),
    description,
    aboutSections: splitParagraphs(description),
    status: mall?.status || "",
  };
}

export function mapAccountShop(shop) {
  const id = shop?.shopId ?? shop?.id;
  const mallId = shop?.mall?.mallId ?? shop?.mall?.id ?? shop?.mallId;
  const category = shop?.category || shop?.specialist || "";
  return {
    id: asStringId(id),
    shopId: id,
    name: shop?.name || "متجر",
    mallId: asStringId(mallId),
    mallName: shop?.mall?.name || "",
    logoUrl: getMediaPreviewUrl(shop?.logoImage),
    floor: shop?.floor || shop?.location || "",
    specialist: category,
    category,
    description: shop?.description || "",
    location: shop?.location || "",
    image: firstImageUrl(shop?.shopPhotos) || getMediaPreviewUrl(shop?.logoImage),
    status: shop?.status || "",
  };
}

export function mapDisplayedAd(ad) {
  const image = getMediaPreviewUrl(ad?.adRequestImage, "original");
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
    subtitle: mall?.name ? `في ${mall.name}` : shop.mallName ? `في ${shop.mallName}` : shop.category || shop.specialist || "",
    imageUrl: shop.logoUrl || shop.image || "",
    href: `/stores/${shop.id}`,
  };
}
