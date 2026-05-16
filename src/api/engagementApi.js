import { auth } from "./auth";

const CATALOG = "/catalog";

function extractErrorMessage(json, fallback) {
  const firstError = json?.errorCodes?.[0];
  if (typeof firstError === "string" && firstError.trim()) return firstError;
  if (firstError?.message) return firstError.message;
  return json?.message || fallback;
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...auth.getHeaders(),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractErrorMessage(json, "حدث خطأ أثناء تنفيذ الطلب"));
  }

  return json?.data ?? json ?? null;
}

async function apiFetchOrNull(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...auth.getHeaders(),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (res.status === 404) return null;

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(extractErrorMessage(json, "حدث خطأ أثناء تنفيذ الطلب"));
  }

  return json?.data ?? json ?? null;
}

export const engagementApi = {
  getFavorites: (page = 0, size = 20) =>
    apiFetch(`${CATALOG}/favorites?page=${page}&size=${size}`),

  getFavoritesList: () =>
    apiFetch(`${CATALOG}/favorites/all`),

  getFavoriteCount: () =>
    apiFetch(`${CATALOG}/favorites/count`),

  isFavorite: (productId) =>
    apiFetch(`${CATALOG}/favorites/product/${productId}/exists`),

  addFavorite: (productId) =>
    apiFetch(`${CATALOG}/favorites`, {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),

  removeFavoriteById: (favoriteId) =>
    apiFetch(`${CATALOG}/favorites/${favoriteId}`, { method: "DELETE" }),

  removeFavoriteByProductId: (productId) =>
    apiFetch(`${CATALOG}/favorites/product/${productId}`, { method: "DELETE" }),

  getReviews: (productId) =>
    apiFetch(`${CATALOG}/products/${productId}/reviews`),

  getMyReview: (productId) =>
    apiFetchOrNull(`${CATALOG}/products/${productId}/reviews/me`),

  createReview: (productId, rating, userId) =>
    apiFetch(`${CATALOG}/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ productId, userId, rating }),
    }),

  updateReview: (productId, reviewId, rating, userId) =>
    apiFetch(`${CATALOG}/products/${productId}/reviews`, {
      method: "PUT",
      body: JSON.stringify({ reviewId, productId, userId, rating }),
    }),

  deleteReview: (productId) =>
    apiFetch(`${CATALOG}/products/${productId}/reviews`, { method: "DELETE" }),

  getComments: (productId) =>
    apiFetch(`${CATALOG}/products/${productId}/comments`),

  getMyComment: (productId) =>
    apiFetchOrNull(`${CATALOG}/products/${productId}/comments/me`),

  createComment: (productId, content, userId) =>
    apiFetch(`${CATALOG}/products/${productId}/comments`, {
      method: "POST",
      body: JSON.stringify({ productId, userId, content }),
    }),

  updateComment: (productId, commentId, content, userId) =>
    apiFetch(`${CATALOG}/products/${productId}/comments`, {
      method: "PUT",
      body: JSON.stringify({ commentId, productId, userId, content }),
    }),

  deleteComment: (productId) =>
    apiFetch(`${CATALOG}/products/${productId}/comments`, { method: "DELETE" }),

  reportComment: (productId, commentId) =>
    apiFetch(`${CATALOG}/products/${productId}/comments/${commentId}/report`, {
      method: "POST",
    }),
};
