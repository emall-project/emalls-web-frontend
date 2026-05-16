import { auth } from "./auth";

const ACCOUNTS = "/accounts/api";
const CATALOG = "/catalog";
const CAMPAIGNS = "/campaigns/api";
const ORDER_HUB = "/order-hub";

const SHOP_CATEGORY_LABELS = {
  CLOTHING: "ملابس",
  ELECTRONICS: "إلكترونيات",
  FOOD: "أغذية",
  BEVERAGES: "مشروبات",
  BOOKS: "كتب",
  TOYS: "ألعاب",
  JEWELRY: "مجوهرات",
  SPORTS: "رياضة",
  HEALTH: "صحة",
  BEAUTY: "جمال",
  HOME: "منزل",
  FURNITURE: "أثاث",
  OTHER: "أخرى",
};

const TARGETED_AUDIENCE_LABELS = {
  MALE: "للرجال",
  FEMALE: "للنساء",
  ALL: "للجميع",
};

const AGE_GROUP_LABELS = {
  NEWBORN: "حديثو الولادة",
  INFANT: "الرضع",
  TODDLER: "الأطفال الصغار",
  CHILD: "الأطفال",
  TEENAGER: "المراهقون",
  YOUTH: "الشباب",
  ADULT: "البالغون",
  ALL: "كل الأعمار",
};

function buildRequestOptions(options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const shouldSendEmptyJsonBody =
    ["POST", "PUT", "PATCH"].includes(method) && options.body == null;
  const authHeaders = auth.getToken() ? auth.getHeaders() : {};

  return {
    ...options,
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options.headers || {}),
    },
    ...(shouldSendEmptyJsonBody ? { body: "{}" } : {}),
  };
}

async function apiFetch(url, options = {}, allowRetry = true) {
  const res = await fetch(url, buildRequestOptions(options));

  if (res.status === 401 && allowRetry && auth.getRefresh()) {
    const previousToken = auth.getToken();
    await auth.refresh();
    const nextToken = auth.getToken();

    if (nextToken && nextToken !== previousToken) {
      return apiFetch(url, options, false);
    }
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "حدث خطأ في الطلب");
  return json?.data ?? json;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === "") return;
    query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function buildPageQuery(page = 0, size = 20, sort = []) {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("size", String(size));

  (Array.isArray(sort) ? sort : [sort]).forEach((entry) => {
    if (!entry) return;
    query.append("sort", String(entry));
  });

  return `?${query.toString()}`;
}

function toJsonBody(payload) {
  return JSON.stringify(payload ?? {});
}

function extractFileUrl(file) {
  return (
    file?.mediumFileUrl ??
    file?.smallFileUrl ??
    file?.originalFileUrl ??
    file?.url ??
    file?.imageUrl ??
    ""
  );
}

function extractVariantImageUrl(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const selectedVariant =
    variants.find((variant) => variant?.isDefault) ??
    variants[0] ??
    null;

  const media = Array.isArray(selectedVariant?.media)
    ? [...selectedVariant.media].sort(
        (first, second) => (first?.sortOrder ?? 0) - (second?.sortOrder ?? 0)
      )
    : [];

  const firstMedium = media[0];
  return extractFileUrl(firstMedium?.mediumFile) || extractFileUrl(firstMedium) || "";
}

export function resolveProductImageUrl(product) {
  return (
    product?.imageUrl ||
    extractFileUrl(product?.medium) ||
    extractFileUrl(product?.image) ||
    extractVariantImageUrl(product) ||
    ""
  );
}

async function resolveMissingProductImages(products = []) {
  const normalized = products.map((product) => ({
    ...product,
    imageUrl: resolveProductImageUrl(product),
  }));

  const missingProducts = normalized.filter((product) => product?.id && !product.imageUrl);
  if (!missingProducts.length) return normalized;

  const resolvedEntries = await Promise.all(
    missingProducts.map(async (product) => {
      try {
        const detail = await apiFetch(`${CATALOG}/products/${product.id}`);
        return [String(product.id), resolveProductImageUrl(detail)];
      } catch {
        return [String(product.id), ""];
      }
    })
  );

  const resolvedMap = new Map(resolvedEntries);

  return normalized.map((product) => ({
    ...product,
    imageUrl: product.imageUrl || resolvedMap.get(String(product.id)) || "",
  }));
}

export function normalizeCategory(category) {
  if (!category) return null;

  return {
    id: String(category.id),
    name: category.name ?? "",
    slug: category.slug ?? "",
    parentId: category.parentId == null ? null : String(category.parentId),
    depthLevel: category.depthLevel ?? null,
    imageUrl:
      category.image?.smallFileUrl ??
      category.image?.mediumFileUrl ??
      category.image?.originalFileUrl ??
      "",
  };
}

export function normalizeBrand(brand) {
  if (!brand) return null;

  return {
    id: String(brand.id),
    name: brand.name ?? "",
    slug: brand.slug ?? "",
    targetedAudience: brand.targetedAudience ?? "",
    targetedAudienceLabel:
      TARGETED_AUDIENCE_LABELS[brand.targetedAudience] ?? brand.targetedAudience ?? "",
    ageGroup: brand.ageGroup ?? "",
    ageGroupLabel: AGE_GROUP_LABELS[brand.ageGroup] ?? brand.ageGroup ?? "",
    imageUrl: extractFileUrl(brand.image),
  };
}

export function normalizeMall(mall) {
  if (!mall) return null;

  const images = (mall.mallImages ?? []).map((image, index) => ({
    id: index + 1,
    image: image.mediumFileUrl ?? image.originalFileUrl ?? image.smallFileUrl ?? "",
    alt: mall.name ?? "mall",
  }));

  const logoUrl = mall.logoImage?.smallFileUrl ?? mall.logoImage?.mediumFileUrl ?? "";

  return {
    id: String(mall.mallId),
    name: mall.name ?? "",
    description: mall.description ?? "",
    location: mall.location ?? "",
    city: mall.city?.name ?? "",
    logoUrl,
    imageUrl: images[0]?.image || logoUrl || "",
    images,
    status: mall.status ?? "",
    capacity: mall.capacity ?? null,
    contactInfo: mall.contactInfo ?? {},
    services: mall.services ?? [],
    restaurants: mall.restaurants ?? [],
  };
}

export function normalizeShop(shop) {
  if (!shop) return null;

  return {
    id: String(shop.shopId),
    name: shop.name ?? "",
    mallId: String(shop.mall?.mallId ?? ""),
    mallName: shop.mall?.name ?? "",
    description: shop.description ?? "",
    location: shop.location ?? "",
    logoUrl: shop.logoImage?.smallFileUrl ?? shop.logoImage?.mediumFileUrl ?? "",
    image: shop.shopPhotos?.[0]?.mediumFileUrl ?? shop.shopPhotos?.[0]?.originalFileUrl ?? "",
    status: shop.status ?? "",
    category: shop.category ?? "",
    categoryLabel: SHOP_CATEGORY_LABELS[shop.category] ?? shop.category ?? "",
  };
}

export function normalizeProduct(product) {
  if (!product) return null;

  const hasDiscount = Boolean(product.hasDiscount);
  return {
    id: String(product.id),
    name: product.name ?? "",
    slug: product.slug ?? "",
    shortDescription: product.shortDescription ?? "",
    brandName: product.brandName ?? "",
    categoryName: product.categoryName ?? "",
    price: hasDiscount ? Number(product.discountedPrice ?? 0) : Number(product.basePrice ?? 0),
    oldPrice: hasDiscount ? Number(product.basePrice ?? 0) : null,
    imageUrl: resolveProductImageUrl(product),
    hasDiscount,
    isActive: product.isActive ?? true,
  };
}

function normalizePublicAd(ad) {
  if (!ad) return null;

  return {
    id: String(ad.adRequestId ?? ""),
    title: ad.title ?? "",
    imageUrl: extractFileUrl(ad.adRequestImage),
    position: ad.template?.position ?? "",
    positionLabel: ad.template?.position ?? "",
    imageRatio: String(ad.template?.imageRatio ?? "16:9"),
    templateName: ad.template?.name ?? "",
    shopId: ad.shop?.shopId ?? ad.shopId ?? null,
    shopName: ad.shop?.name ?? "",
    startDate: ad.startDate ?? null,
    endDate: ad.endDate ?? null,
    isDisplayed: Boolean(ad.isDisplayed),
  };
}

function normalizeNumericIds(values = []) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0)
  )];
}

export const customerApi = {
  getCategories: async () => {
    const data = await apiFetch(`${CATALOG}/categories/all`);
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeCategory);
  },

  getBrands: async (filters = {}) => {
    const data = await apiFetch(`${CATALOG}/brands/all${buildQuery(filters)}`);
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeBrand);
  },

  getAttributes: async () => {
    const data = await apiFetch(`${CATALOG}/attributes/all?is-active=true`);
    return Array.isArray(data) ? data : [];
  },

  getTags: async () => {
    const data = await apiFetch(`${CATALOG}/tags/all`);
    return Array.isArray(data) ? data : [];
  },

  getAllMalls: async (filters = {}) => {
    const data = await apiFetch(`${ACCOUNTS}/malls/all${buildQuery(filters)}`);
    const list = Array.isArray(data) ? data : [];
    const shouldLimitToActive = filters.status == null || filters.status === "";
    return list
      .filter((mall) => (shouldLimitToActive ? mall.status === "ACTIVE" : true))
      .map(normalizeMall);
  },

  getActiveMalls: async () => {
    const data = await apiFetch(`${ACCOUNTS}/malls/status/ACTIVE`);
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeMall);
  },

  getMallById: async (id) => {
    const data = await apiFetch(`${ACCOUNTS}/malls/${id}`);
    return normalizeMall(data);
  },

  getActiveShopsByMall: async (mallId) => {
    const data = await apiFetch(`${ACCOUNTS}/shops/mall/${mallId}/active`);
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeShop);
  },

  getAllShops: async (filters = {}) => {
    const data = await apiFetch(`${ACCOUNTS}/shops/all${buildQuery(filters)}`);
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeShop);
  },

  getActiveShops: async () => {
    const data = await apiFetch(`${ACCOUNTS}/shops/active`);
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeShop);
  },

  getProducts: async (filter = {}, page = 0, size = 20, sort = []) => {
    const data = await apiFetch(`${CATALOG}/products/all${buildPageQuery(page, size, sort)}`, {
      method: "POST",
      body: toJsonBody(filter),
    });

    const content = data?.content ?? [];
    const meta = data?.meta ?? {};

    return {
      products: await resolveMissingProductImages(content.map(normalizeProduct)),
      totalPages: meta.totalPages ?? 0,
      total: meta.totalItems ?? content.length,
      page: meta.page ?? page,
    };
  },

  getProductsByIds: async (productIds = []) => {
    const ids = normalizeNumericIds(productIds);
    if (!ids.length) return [];

    const data = await apiFetch(`${CATALOG}/products/by-ids`, {
      method: "POST",
      body: toJsonBody({ productIds: ids }),
    });

    const list = Array.isArray(data) ? data : [];
    const normalized = await resolveMissingProductImages(list.map(normalizeProduct));
    const byId = new Map(normalized.map((product) => [String(product.id), product]));

    return ids
      .map((id) => byId.get(String(id)))
      .filter(Boolean);
  },

  getRandomProducts: async (limit = 10) => {
    const data = await apiFetch(`${CATALOG}/products/random?limit=${limit}`);
    const list = Array.isArray(data) ? data : [];
    return resolveMissingProductImages(list.map(normalizeProduct));
  },

  getProductSummary: async (filter = {}) => {
    return apiFetch(`${CATALOG}/products/summary`, {
      method: "POST",
      body: toJsonBody(filter),
    });
  },

  isShopActive: async (id) => {
    const data = await apiFetch(`${ACCOUNTS}/shops/${id}/active`);
    return Boolean(data);
  },

  getShopById: async (id) => {
    const data = await apiFetch(`${ACCOUNTS}/shops/${id}`);
    return normalizeShop(data);
  },

  getProductById: async (id) => {
    return apiFetch(`${CATALOG}/products/${id}`);
  },

  getProductInfo: async (id) => {
    return apiFetch(`${CATALOG}/products/${id}/info`);
  },

  getProductListEntry: async ({ id, slug } = {}) => {
    if (slug) {
      const result = await customerApi.getProducts({ slug }, 0, 1);
      return result?.products?.[0] ?? null;
    }

    if (id) {
      const products = await customerApi.getProductsByIds([id]);
      return products?.[0] ?? null;
    }

    return null;
  },

  getSimilarProducts: async (id, topK = 8) => {
    const data = await apiFetch(`${CATALOG}/products/${id}/similar?topK=${topK}`);
    const list = Array.isArray(data) ? data : [];
    return resolveMissingProductImages(list.map(normalizeProduct));
  },

  getPublicMostOrderedProducts: async (limit = 10) => {
    const data = await apiFetch(`${ORDER_HUB}/dashboard/products/most-ordered/public?limit=${limit}`);
    const ranks = Array.isArray(data) ? data : [];
    const ids = normalizeNumericIds(ranks.map((entry) => entry?.productId));
    const orderedMap = new Map(
      ranks.map((entry) => [String(entry?.productId), Number(entry?.orderedQuantity ?? 0)])
    );

    const products = await customerApi.getProductsByIds(ids);
    return products.map((product) => ({
      ...product,
      orderedQuantity: orderedMap.get(String(product.id)) ?? 0,
    }));
  },

  getPublicActiveSaleProducts: async (limit = 10) => {
    const data = await apiFetch(`${CAMPAIGNS}/offers/products/active/public?limit=${limit}`);
    const saleEntries = Array.isArray(data) ? data : [];
    const ids = normalizeNumericIds(saleEntries.map((entry) => entry?.productId));
    const saleMap = new Map(saleEntries.map((entry) => [String(entry?.productId), entry]));

    const products = await customerApi.getProductsByIds(ids);
    return products.map((product) => ({
      ...product,
      offerId: saleMap.get(String(product.id))?.offerId ?? null,
      discountType: saleMap.get(String(product.id))?.discountType ?? null,
      discountValue: saleMap.get(String(product.id))?.discountValue ?? null,
    }));
  },

  getCustomerDashboard: async () => {
    return apiFetch(`${ORDER_HUB}/dashboard/customer`);
  },

  getActiveDisplayedAds: async () => {
    const data = await apiFetch(`${CAMPAIGNS}/ad-requests/active/displayed`);
    const list = Array.isArray(data) ? data : [];
    return list
      .map(normalizePublicAd)
      .filter((ad) => ad?.imageUrl);
  },

  hydrateFavoritesWithImages: async (favorites = []) => {
    const list = Array.isArray(favorites) ? favorites : [];

    const hydrated = await Promise.all(
      list.map(async (favorite) => {
        const product = favorite?.product ?? {};
        let imageUrl = resolveProductImageUrl(product);

        if (!imageUrl && favorite?.productId) {
          try {
            const detail = await apiFetch(`${CATALOG}/products/${favorite.productId}`);
            imageUrl = resolveProductImageUrl(detail);
          } catch {
            imageUrl = "";
          }
        }

        return {
          ...favorite,
          product: {
            ...product,
            imageUrl,
          },
        };
      })
    );

    return hydrated;
  },
};
