import { requestJson } from "../utils/http";

const ORDER_HUB_BASE = "/order-hub";

function unwrap(payload) {
  return payload?.data ?? payload ?? null;
}

function queryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value != null) {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

function bodyRequest(method, body) {
  return {
    method,
    body: JSON.stringify(body),
  };
}

function orderHubFetch(path, options = {}) {
  return requestJson(`${ORDER_HUB_BASE}${path}`, options);
}

function pagedPath(path, params = {}) {
  const query = queryString(params);
  return query ? `${path}?${query}` : path;
}

export function unwrapOrderHubPayload(payload) {
  return unwrap(payload);
}

export function normalizeOrderHubPage(payload) {
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

export const orderHubApi = {
  dashboard: {
    getAdmin: () => orderHubFetch("/dashboard/admin"),
    getShop: (shopId) => orderHubFetch(`/dashboard/shop/${shopId}`),
    getCustomer: () => orderHubFetch("/dashboard/customer"),
  },

  carts: {
    addItem: (body) => orderHubFetch("/carts/items", bodyRequest("POST", body)),
    getByMall: (mallId) => orderHubFetch(`/carts/me/mall/${mallId}`),
    getById: (cartId) => orderHubFetch(`/carts/${cartId}`),
    getActive: () => orderHubFetch("/carts/me/active"),
    getHistory: (params = {}) => orderHubFetch(pagedPath("/carts/me/history", params)),
    updateDelivery: (cartId, body) =>
      orderHubFetch(`/carts/${cartId}/delivery`, bodyRequest("PUT", body)),
    updateQuantity: (cartItemId, body) =>
      orderHubFetch(`/carts/items/${cartItemId}/quantity`, bodyRequest("PATCH", body)),
    removeItem: (cartItemId) =>
      orderHubFetch(`/carts/items/${cartItemId}`, { method: "DELETE" }),
    clearMall: (mallId) =>
      orderHubFetch(`/carts/me/mall/${mallId}/items`, { method: "DELETE" }),
    cancelMall: (mallId) =>
      orderHubFetch(`/carts/me/mall/${mallId}/cancel`, { method: "PATCH" }),
    checkout: (mallId, body) =>
      orderHubFetch(`/carts/me/mall/${mallId}/checkout`, bodyRequest("POST", body)),
    adminPage: (params = {}) => orderHubFetch(pagedPath("/carts/admin", params)),
  },

  orders: {
    pageMine: (params = {}) => orderHubFetch(pagedPath("/orders/me", params)),
    byIdMine: (shopOrderId) => orderHubFetch(`/orders/me/${shopOrderId}`),
    shopPage: (shopId, params = {}) =>
      orderHubFetch(pagedPath(`/orders/shop/${shopId}`, params)),
    shopByStatus: (shopId, status, params = {}) =>
      orderHubFetch(pagedPath(`/orders/shop/${shopId}/status/${status}`, params)),
    shopById: (shopId, shopOrderId) =>
      orderHubFetch(`/orders/shop/${shopId}/${shopOrderId}`),
    advanceShopStatus: (shopId, shopOrderId) =>
      orderHubFetch(`/orders/shop/${shopId}/${shopOrderId}/advance`, { method: "PATCH" }),
    shopStats: (shopId) => orderHubFetch(`/orders/shop/${shopId}/stats`),
    adminPage: (params = {}) => orderHubFetch(pagedPath("/orders/admin", params)),
    adminById: (shopOrderId) => orderHubFetch(`/orders/admin/${shopOrderId}`),
    adminOverride: (shopOrderId, targetStatus, reason) =>
      orderHubFetch(
        `/orders/admin/${shopOrderId}/override?${queryString({ targetStatus, reason })}`,
        { method: "PATCH" }
      ),
    adminStats: () => orderHubFetch("/orders/admin/stats"),
  },

  returns: {
    create: (body) => orderHubFetch("/returns", bodyRequest("POST", body)),
    pageMine: (params = {}) => orderHubFetch(pagedPath("/returns/me", params)),
    byIdMine: (returnRequestId) => orderHubFetch(`/returns/me/${returnRequestId}`),
    byOrderItem: (orderItemId) => orderHubFetch(`/returns/me/order-item/${orderItemId}`),
    shopPage: (shopId, params = {}) =>
      orderHubFetch(pagedPath(`/returns/shop/${shopId}`, params)),
    shopByStatus: (shopId, status, params = {}) =>
      orderHubFetch(pagedPath(`/returns/shop/${shopId}/status/${status}`, params)),
    shopById: (shopId, returnRequestId) =>
      orderHubFetch(`/returns/shop/${shopId}/${returnRequestId}`),
    approveShop: (shopId, returnRequestId) =>
      orderHubFetch(`/returns/shop/${shopId}/${returnRequestId}/approve`, { method: "PATCH" }),
    rejectShop: (shopId, returnRequestId, rejectionReason) =>
      orderHubFetch(
        `/returns/shop/${shopId}/${returnRequestId}/reject`,
        bodyRequest("PATCH", { rejectionReason })
      ),
    shopStats: (shopId) => orderHubFetch(`/returns/shop/${shopId}/stats`),
    adminPage: (params = {}) => orderHubFetch(pagedPath("/returns/admin", params)),
    adminByStatus: (status, params = {}) =>
      orderHubFetch(pagedPath(`/returns/admin/status/${status}`, params)),
    adminById: (returnRequestId) => orderHubFetch(`/returns/admin/${returnRequestId}`),
    adminStats: () => orderHubFetch("/returns/admin/stats"),
  },

  deliveries: {
    page: (params = {}) => orderHubFetch(pagedPath("/deliveries", params)),
    byStatus: (status, params = {}) =>
      orderHubFetch(pagedPath(`/deliveries/status/${status}`, params)),
    byId: (deliveryId) => orderHubFetch(`/deliveries/${deliveryId}`),
    byCartId: (cartId) => orderHubFetch(`/deliveries/cart/${cartId}`),
    mine: () => orderHubFetch("/deliveries/me"),
    mineByCartId: (cartId) => orderHubFetch(`/deliveries/me/cart/${cartId}`),
    markSent: (deliveryId) => orderHubFetch(`/deliveries/${deliveryId}/sent`, { method: "PATCH" }),
    markOnTheWay: (deliveryId) =>
      orderHubFetch(`/deliveries/${deliveryId}/on-the-way`, { method: "PATCH" }),
    markDelivered: (deliveryId) =>
      orderHubFetch(`/deliveries/${deliveryId}/delivered`, { method: "PATCH" }),
    markFailed: (deliveryId, body) =>
      orderHubFetch(`/deliveries/${deliveryId}/failed`, bodyRequest("PATCH", body)),
    stats: () => orderHubFetch("/deliveries/stats"),
  },

  finance: {
    overview: () => orderHubFetch("/finance/overview"),
    shopPayout: (shopId) => orderHubFetch(`/finance/shops/${shopId}/payout`),
    itemDistribution: () => orderHubFetch("/finance/items/distribution"),
    shopReturnStats: (shopId) => orderHubFetch(`/finance/shops/${shopId}/return-stats`),
  },
};
