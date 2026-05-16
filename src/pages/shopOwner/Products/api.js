import { auth } from "../../../api/auth";

const BASE = "/catalog";

async function apiFetch(path, options = {}, allowRetry = true) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...auth.getHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 401 && allowRetry) {
    const prevToken = auth.getToken();
    await auth.refresh();
    const nextToken = auth.getToken();
    if (nextToken && nextToken !== prevToken) {
      return apiFetch(path, options, false);
    }
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(json?.message || "حدث خطأ أثناء تنفيذ الطلب");
    err.status = res.status;
    err.errorCodes = json?.errorCodes || [];
    err.response = json;
    throw err;
  }

  return json;
}

function shopId() {
  const id = auth.getShopId();
  if (!id) throw new Error("تعذر تحديد معرف المتجر. يرجى تسجيل الخروج وإعادة تسجيل الدخول.");
  return id;
}

function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => {
      if (!tag) return null;
      if (typeof tag === "string") return { name: tag.trim() };
      if (typeof tag?.name === "string") return { name: tag.name.trim() };
      return null;
    })
    .filter((tag) => tag?.name);
}

export function buildBasicProductUpdatePayload(product, overrides = {}) {
  const merged = { ...product, ...overrides };

  return {
    id: merged.id,
    name: merged.name,
    slug: merged.slug,
    targetedAudience: merged.targetedAudience,
    ageGroup: merged.ageGroup,
    isActive: Boolean(merged.isActive),
    shortDescription: merged.shortDescription,
    description: merged.description,
    categoryId: Number(merged.categoryId ?? merged.category?.id),
    brandId: Number(merged.brandId ?? merged.brand?.id),
    tags: normalizeTags(merged.tags),
  };
}

export const productsApi = {
  getAll: ({
    page = 0,
    size = 15,
    q = "",
    categoryId = "",
    brandId = "",
    isActive = "",
    targetedAudience = "",
    ageGroup = "",
    minPrice = "",
    maxPrice = "",
  } = {}) => {
    const body = {};
    if (q) body.q = q;
    if (categoryId) body.categoryId = Number(categoryId);
    if (brandId) body.brandId = Number(brandId);
    if (isActive !== "") body.isActive = isActive === "true";
    if (targetedAudience) body.targetedAudience = targetedAudience;
    if (ageGroup) body.ageGroup = ageGroup;
    if (minPrice !== "") body.minPrice = Number(minPrice);
    if (maxPrice !== "") body.maxPrice = Number(maxPrice);

    return apiFetch(`/stores/${shopId()}/products/all?page=${page}&size=${size}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getAllList: ({
    q = "",
    categoryId = "",
    brandId = "",
    isActive = "",
    targetedAudience = "",
    ageGroup = "",
    minPrice = "",
    maxPrice = "",
  } = {}) => {
    const body = {};
    if (q) body.q = q;
    if (categoryId) body.categoryId = Number(categoryId);
    if (brandId) body.brandId = Number(brandId);
    if (isActive !== "") body.isActive = isActive === "true";
    if (targetedAudience) body.targetedAudience = targetedAudience;
    if (ageGroup) body.ageGroup = ageGroup;
    if (minPrice !== "") body.minPrice = Number(minPrice);
    if (maxPrice !== "") body.maxPrice = Number(maxPrice);

    return apiFetch(`/stores/${shopId()}/products/all/list`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getById: (id) => apiFetch(`/stores/${shopId()}/products/${id}`),
  create: (body) => apiFetch(`/stores/${shopId()}/products`, { method: "POST", body: JSON.stringify(body) }),
  update: (body) => apiFetch(`/stores/${shopId()}/products`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/stores/${shopId()}/products/${id}`, { method: "DELETE" }),

  updateStatus: async (productId, isActive) => {
    const details = await apiFetch(`/stores/${shopId()}/products/${productId}`);
    const product = details?.data ?? details;
    const payload = buildBasicProductUpdatePayload(product, { isActive: Boolean(isActive) });

    try {
      return await apiFetch(`/stores/${shopId()}/products`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (error?.status === 500) {
        console.error("[productsApi.updateStatus] 500 payload:", payload);
      }
      throw error;
    }
  },

  addVariant: (productId, body) => apiFetch(
    `/stores/${shopId()}/products/${productId}/variants`,
    { method: "POST", body: JSON.stringify(body) }
  ),
  updateVariant: (productId, body) => apiFetch(
    `/stores/${shopId()}/products/${productId}/variants`,
    { method: "PUT", body: JSON.stringify(body) }
  ),
  deleteVariant: (productId, variantId) => apiFetch(
    `/stores/${shopId()}/products/${productId}/variants/${variantId}`,
    { method: "DELETE" }
  ),

  getCategories: (q = "") => apiFetch(`/categories/light${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  getCategoriesAll: () => apiFetch("/categories/all"),
  getBrands: (q = "") => apiFetch(`/brands/all${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createBrand: (body) => apiFetch("/brands", { method: "POST", body: JSON.stringify(body) }),
  getAttributes: () => apiFetch("/attributes/all?is-active=true"),
  getTags: (name) => apiFetch(`/tags/all${name ? `?name=${encodeURIComponent(name)}` : ""}`),
};
