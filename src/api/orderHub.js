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
  },

  orders: {
    pageMine: (params = {}) => orderHubFetch(pagedPath("/orders/me", params)),
    byIdMine: (shopOrderId) => orderHubFetch(`/orders/me/${shopOrderId}`),
  },

  returns: {
    create: (body) => orderHubFetch("/returns", bodyRequest("POST", body)),
    pageMine: (params = {}) => orderHubFetch(pagedPath("/returns/me", params)),
    byIdMine: (returnRequestId) => orderHubFetch(`/returns/me/${returnRequestId}`),
    byOrderItem: (orderItemId) => orderHubFetch(`/returns/me/order-item/${orderItemId}`),
  },
};
