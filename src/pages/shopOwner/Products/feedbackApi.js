import { auth } from "../../../api/auth";

const BASE = "/catalog";

function extractErrorMessage(json, fallback) {
  const firstError = json?.errorCodes?.[0];
  if (typeof firstError === "string" && firstError.trim()) return firstError;
  if (firstError?.message) return firstError.message;
  return json?.message || fallback;
}

async function apiFetch(path, fallbackMessage) {
  const response = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...auth.getHeaders(),
    },
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(extractErrorMessage(json, fallbackMessage));
    error.status = response.status;
    error.errorCodes = json?.errorCodes || [];
    throw error;
  }

  return json?.data ?? json ?? [];
}

export const feedbackApi = {
  getProductReviews(productId) {
    return apiFetch(`/products/${productId}/reviews`, "تعذر تحميل التقييمات.");
  },

  getProductComments(productId) {
    return apiFetch(`/products/${productId}/comments`, "تعذر تحميل التعليقات.");
  },
};
