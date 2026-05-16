import { auth } from "./auth";

const ACCOUNTS = "/accounts/api";
const CATALOG = "/catalog";

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

async function apiFetch(url, options = {}) {
  const authHeaders = auth.getUser() ? auth.getHeaders() : {};
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...authHeaders, ...(options.headers || {}) },
    ...options,
  });

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
  return JSON.stringify(payload == null ? {} : payload);
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
    price: hasDiscount ? Number(product.discountedPrice ?? 0) : Number(product.basePrice ?? 0),
    oldPrice: hasDiscount ? Number(product.basePrice ?? 0) : null,
    imageUrl: resolveProductImageUrl(product),
  };
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

  getSimilarProducts: async (id, topK = 8) => {
    const data = await apiFetch(`${CATALOG}/products/${id}/similar?topK=${topK}`);
    const list = Array.isArray(data) ? data : [];
    return resolveMissingProductImages(list.map(normalizeProduct));
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
