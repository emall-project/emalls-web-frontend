import { auth } from "./auth";

const ORDER_HUB = "/order-hub";
const ACCOUNTS  = "/accounts/api";

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
  if (!res.ok) throw new Error(json?.message || "خطأ في الطلب");
  return json?.data ?? json;
}

export const cartApi = {
  // ── Cart mutations ─────────────────────────────────────────────────────────

  addItem: (mallId, productId, variantId, quantity) =>
    apiFetch(`${ORDER_HUB}/carts/items`, {
      method: "POST",
      body: JSON.stringify({ mallId, productId, variantId, quantity }),
    }),

  updateQuantity: (cartItemId, quantity) =>
    apiFetch(`${ORDER_HUB}/carts/items/${cartItemId}/quantity`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (cartItemId) =>
    apiFetch(`${ORDER_HUB}/carts/items/${cartItemId}`, { method: "DELETE" }),

  clearCart: (mallId) =>
    apiFetch(`${ORDER_HUB}/carts/me/mall/${mallId}/items`, { method: "DELETE" }),

  cancelCart: (mallId) =>
    apiFetch(`${ORDER_HUB}/carts/me/mall/${mallId}/cancel`, { method: "PATCH" }),

  // ── Cart queries ───────────────────────────────────────────────────────────

  // All active carts (across all malls)
  getActiveCarts: () =>
    apiFetch(`${ORDER_HUB}/carts/me/active`),

  // Active cart for a specific mall
  getCartForMall: (mallId) =>
    apiFetch(`${ORDER_HUB}/carts/me/mall/${mallId}`),

  // ── Checkout ───────────────────────────────────────────────────────────────

  checkout: (mallId, request) =>
    apiFetch(`${ORDER_HUB}/carts/me/mall/${mallId}/checkout`, {
      method: "POST",
      body: JSON.stringify(request),
    }),

  // ── Orders ────────────────────────────────────────────────────────────────

  getOrders: (page = 0, size = 20) =>
    apiFetch(`${ORDER_HUB}/orders/me?page=${page}&size=${size}`),

  getOrderById: (orderId) =>
    apiFetch(`${ORDER_HUB}/orders/me/${orderId}`),

  // ── Reference data ────────────────────────────────────────────────────────

  // Public endpoint — no auth required but we send it anyway since customer is logged in
  getActiveCities: () =>
    apiFetch(`${ACCOUNTS}/cities/active`),
};
