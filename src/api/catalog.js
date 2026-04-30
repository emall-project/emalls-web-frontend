import { requestJson } from "../utils/http";

const CATALOG_BASE = "/catalog";

function unwrap(payload) {
  return payload?.data ?? payload ?? null;
}

function cleanParams(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value != null) {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

function cleanBody(body = {}) {
  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== "" && value != null)
  );
}

function catalogFetch(path, options = {}) {
  return requestJson(`${CATALOG_BASE}${path}`, options);
}

function bodyRequest(method, body) {
  return {
    method,
    body: JSON.stringify(body),
  };
}

function pagedPath(path, params = {}) {
  const query = cleanParams(params);
  return query ? `${path}?${query}` : path;
}

export function unwrapCatalogPayload(payload) {
  return unwrap(payload);
}

export function normalizeCatalogPage(payload) {
  const data = unwrap(payload) || {};
  const content = Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data)
    ? data
    : [];
  const meta = data?.meta || {};

  return {
    content,
    totalPages: meta.totalPages ?? data.totalPages ?? 1,
    totalElements: meta.totalItems ?? data.totalElements ?? content.length,
    page: meta.page ?? data.number ?? 0,
    size: meta.size ?? data.size ?? content.length,
  };
}

function metadataApi(resource) {
  return {
    page: (params = {}) => catalogFetch(pagedPath(`/${resource}`, params)),
    all: (params = {}) => catalogFetch(pagedPath(`/${resource}/all`, params)),
    byId: (id) => catalogFetch(`/${resource}/${id}`),
    bySlug: (slug) => catalogFetch(`/${resource}/slug/${encodeURIComponent(slug)}`),
    create: (body) => catalogFetch(`/${resource}`, bodyRequest("POST", body)),
    update: (body) => catalogFetch(`/${resource}`, bodyRequest("PUT", body)),
    delete: (id) => catalogFetch(`/${resource}/${id}`, { method: "DELETE" }),
  };
}

export const catalogApi = {
  categories: {
    ...metadataApi("categories"),
    light: (params = {}) => catalogFetch(pagedPath("/categories/light", params)),
    tree: () => catalogFetch("/categories/tree"),
    addAudienceConfig: (categoryId, body) =>
      catalogFetch(`/categories/${categoryId}/audience`, bodyRequest("PUT", body)),
    deleteAudienceConfig: (categoryId, audienceConfigId) =>
      catalogFetch(`/categories/${categoryId}/audience/${audienceConfigId}`, {
        method: "DELETE",
      }),
    dashboardSummary: () => catalogFetch("/categories/dashboard/summary"),
  },

  brands: {
    ...metadataApi("brands"),
    dashboardSummary: () => catalogFetch("/brands/dashboard/summary"),
  },

  attributes: {
    ...metadataApi("attributes"),
    dashboardSummary: () => catalogFetch("/attributes/dashboard/summary"),
  },

  tags: metadataApi("tags"),

  products: {
    publicPage: (filter = {}, params = {}) =>
      catalogFetch(pagedPath("/products/all", params), bodyRequest("POST", cleanBody(filter))),
    publicSummary: (filter = {}) =>
      catalogFetch("/products/summary", bodyRequest("POST", cleanBody(filter))),
    byId: (id) => catalogFetch(`/products/${id}`),
    bySlug: (slug) => catalogFetch(`/products/slug/${encodeURIComponent(slug)}`),
    info: (id) => catalogFetch(`/products/${id}/info`),
    similar: (id, topK = 8) =>
      catalogFetch(`/products/${id}/similar?${cleanParams({ topK })}`),

    storePage: (storeId, filter = {}, params = {}) =>
      catalogFetch(
        pagedPath(`/stores/${storeId}/products/all`, params),
        bodyRequest("POST", cleanBody(filter))
      ),
    storeSummary: (storeId, filter = {}) =>
      catalogFetch(
        `/stores/${storeId}/products/summary`,
        bodyRequest("POST", cleanBody(filter))
      ),
    storeList: (storeId, filter = {}) =>
      catalogFetch(
        `/stores/${storeId}/products/all/list`,
        bodyRequest("POST", cleanBody(filter))
      ),
    storeById: (storeId, id) => catalogFetch(`/stores/${storeId}/products/${id}`),
    storeBySlug: (storeId, slug) =>
      catalogFetch(`/stores/${storeId}/products/slug/${encodeURIComponent(slug)}`),
    create: (storeId, body) =>
      catalogFetch(`/stores/${storeId}/products`, bodyRequest("POST", body)),
    update: (storeId, body) =>
      catalogFetch(`/stores/${storeId}/products`, bodyRequest("PUT", body)),
    updateVariant: (storeId, productId, body) =>
      catalogFetch(
        `/stores/${storeId}/products/${productId}/variants`,
        bodyRequest("PUT", body)
      ),
    delete: (storeId, id) =>
      catalogFetch(`/stores/${storeId}/products/${id}`, { method: "DELETE" }),
    deleteVariant: (storeId, productId, variantId) =>
      catalogFetch(`/stores/${storeId}/products/${productId}/variants/${variantId}`, {
        method: "DELETE",
      }),
    dashboardSummary: (storeId) =>
      catalogFetch(`/stores/${storeId}/products/dashboard/summary`),
  },

  favorites: {
    page: (params = {}) => catalogFetch(pagedPath("/favorites", params)),
    all: () => catalogFetch("/favorites/all"),
    byId: (id) => catalogFetch(`/favorites/${id}`),
    exists: (productId) => catalogFetch(`/favorites/product/${productId}/exists`),
    count: () => catalogFetch("/favorites/count"),
    create: (productId) =>
      catalogFetch("/favorites", bodyRequest("POST", { productId })),
    delete: (id) => catalogFetch(`/favorites/${id}`, { method: "DELETE" }),
    deleteProduct: (productId) =>
      catalogFetch(`/favorites/product/${productId}`, { method: "DELETE" }),
  },

  comments: {
    approved: (productId) => catalogFetch(`/products/${productId}/comments`),
    mine: () => catalogFetch("/users/me/comments"),
    mineForProduct: (productId) =>
      catalogFetch(`/products/${productId}/comments/me`),
    create: (productId, contentOrBody) =>
      catalogFetch(
        `/products/${productId}/comments`,
        bodyRequest(
          "POST",
          typeof contentOrBody === "string" ? { content: contentOrBody } : contentOrBody
        )
      ),
    update: (productId, body) =>
      catalogFetch(`/products/${productId}/comments`, bodyRequest("PUT", body)),
    delete: (productId) =>
      catalogFetch(`/products/${productId}/comments`, { method: "DELETE" }),
    report: (productId, commentId) =>
      catalogFetch(`/products/${productId}/comments/${commentId}/report`, {
        method: "POST",
      }),
    adminStats: () => catalogFetch("/admin/comments/stats"),
    adminByStatus: (status) =>
      catalogFetch(`/admin/comments?${cleanParams({ status })}`),
    adminByProduct: (productId) =>
      catalogFetch(`/admin/products/${productId}/comments`),
    approve: (commentId) =>
      catalogFetch(`/admin/comments/${commentId}/approve`, { method: "PATCH" }),
    reject: (commentId) =>
      catalogFetch(`/admin/comments/${commentId}/reject`, { method: "PATCH" }),
    flag: (commentId) =>
      catalogFetch(`/admin/comments/${commentId}/flag`, { method: "PATCH" }),
    remoderate: (commentId) =>
      catalogFetch(`/admin/comments/${commentId}/remoderate`, { method: "PATCH" }),
  },

  reviews: {
    all: (productId) => catalogFetch(`/products/${productId}/reviews`),
    mine: (productId) => catalogFetch(`/products/${productId}/reviews/me`),
    create: (productId, ratingOrBody) =>
      catalogFetch(
        `/products/${productId}/reviews`,
        bodyRequest(
          "POST",
          typeof ratingOrBody === "object" ? ratingOrBody : { rating: ratingOrBody }
        )
      ),
    update: (productId, body) =>
      catalogFetch(`/products/${productId}/reviews`, bodyRequest("PUT", body)),
    delete: (productId) =>
      catalogFetch(`/products/${productId}/reviews`, { method: "DELETE" }),
  },
};
