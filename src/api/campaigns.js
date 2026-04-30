import { requestJson } from "../utils/http";

const CAMPAIGNS_BASE = "/campaigns";

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

function campaignFetch(path, options = {}) {
  return requestJson(`${CAMPAIGNS_BASE}${path}`, options);
}

function bodyRequest(method, body) {
  return {
    method,
    body: JSON.stringify(cleanBody(body)),
  };
}

function pagedPath(path, params = {}) {
  const query = cleanParams(params);
  return query ? `${path}?${query}` : path;
}

export function unwrapCampaignPayload(payload) {
  return unwrap(payload);
}

export function normalizeCampaignPage(payload) {
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

export const campaignsApi = {
  ads: {
    displayed: () => campaignFetch("/api/ad-requests/active/displayed"),
  },

  templates: {
    page: (params = {}) => campaignFetch(pagedPath("/api/ad-templates", params)),
    all: (params = {}) => campaignFetch(pagedPath("/api/ad-templates/all", params)),
    active: () => campaignFetch("/api/ad-templates/active"),
    byId: (id) => campaignFetch(`/api/ad-templates/${id}`),
    create: (body) => campaignFetch("/api/ad-templates", bodyRequest("POST", body)),
    update: (body) => campaignFetch("/api/ad-templates", bodyRequest("PUT", body)),
    delete: (id) => campaignFetch(`/api/ad-templates/${id}`, { method: "DELETE" }),
    changeStatus: (id, status) =>
      campaignFetch(`/api/ad-templates/${id}/status?${cleanParams({ status })}`, {
        method: "PUT",
      }),
    activate: (id) => campaignFetch(`/api/ad-templates/${id}/activate`, { method: "PUT" }),
    archive: (id) => campaignFetch(`/api/ad-templates/${id}/archive`, { method: "PUT" }),
  },

  requests: {
    page: (params = {}) => campaignFetch(pagedPath("/api/ad-requests", params)),
    all: (params = {}) => campaignFetch(pagedPath("/api/ad-requests/all", params)),
    byId: (id) => campaignFetch(`/api/ad-requests/${id}`),
    byShop: (shopId) => campaignFetch(`/api/ad-requests/shop/${shopId}`),
    byShopStatus: (shopId, status) =>
      campaignFetch(`/api/ad-requests/shop/${shopId}/status/${status}`),
    byStatus: (status) => campaignFetch(`/api/ad-requests/status/${status}`),
    create: (body) => campaignFetch("/api/ad-requests", bodyRequest("POST", body)),
    update: (body) => campaignFetch("/api/ad-requests", bodyRequest("PUT", body)),
    cancel: (requestId, shopId) =>
      campaignFetch(`/api/ad-requests/${requestId}/shop/${shopId}`, { method: "DELETE" }),
    approve: (requestId) => campaignFetch(`/api/ad-requests/${requestId}/approve`, { method: "PUT" }),
    reject: (requestId, reason) =>
      campaignFetch(
        `/api/ad-requests/${requestId}/reject${reason ? `?${cleanParams({ reason })}` : ""}`,
        { method: "PUT" }
      ),
    initiatePayment: (requestId) =>
      campaignFetch(`/api/ad-requests/${requestId}/initiate-payment`, { method: "POST" }),
    payments: (requestId) => campaignFetch(`/api/ad-requests/${requestId}/payments`),
    myPayments: (requestId) => campaignFetch(`/api/ad-requests/${requestId}/payments/my`),
    allPayments: () => campaignFetch("/api/ad-requests/payments"),
    paymentsByShop: (shopId) => campaignFetch(`/api/ad-requests/shop/${shopId}/payments`),
  },

  offers: {
    page: (params = {}) => campaignFetch(pagedPath("/api/offers", params)),
    all: (params = {}) => campaignFetch(pagedPath("/api/offers/all", params)),
    byId: (offerId) => campaignFetch(`/api/offers/${offerId}`),
    byShop: (shopId) => campaignFetch(`/api/offers/shop/${shopId}`),
    byShopStatus: (shopId, status) => campaignFetch(`/api/offers/shop/${shopId}/status/${status}`),
    create: (body) => campaignFetch("/api/offers", bodyRequest("POST", body)),
    update: (body) => campaignFetch("/api/offers", bodyRequest("PUT", body)),
    delete: (offerId, shopId) =>
      campaignFetch(`/api/offers/${offerId}/shop/${shopId}`, { method: "DELETE" }),
    activate: (offerId, shopId) =>
      campaignFetch(`/api/offers/${offerId}/activate/shop/${shopId}`, { method: "PUT" }),
    deactivate: (offerId, shopId) =>
      campaignFetch(`/api/offers/${offerId}/deactivate/shop/${shopId}`, { method: "PUT" }),
    addProduct: (offerId, shopId, body) =>
      campaignFetch(`/api/offers/${offerId}/shop/${shopId}/products`, bodyRequest("POST", body)),
    removeProduct: (offerId, shopId, productId) =>
      campaignFetch(`/api/offers/${offerId}/shop/${shopId}/products/${productId}`, {
        method: "DELETE",
      }),
  },

  plans: {
    page: (params = {}) => campaignFetch(pagedPath("/api/subscriptions/plans", params)),
    all: (params = {}) => campaignFetch(pagedPath("/api/subscriptions/plans/all", params)),
    active: () => campaignFetch("/api/subscriptions/plans/active"),
    byId: (planId) => campaignFetch(`/api/subscriptions/plans/${planId}`),
    create: (body) => campaignFetch("/api/subscriptions/plans", bodyRequest("POST", body)),
    update: (body) => campaignFetch("/api/subscriptions/plans", bodyRequest("PUT", body)),
  },

  subscriptions: {
    page: (params = {}) => campaignFetch(pagedPath("/api/subscriptions", params)),
    all: (params = {}) => campaignFetch(pagedPath("/api/subscriptions/all", params)),
    byId: (subscriptionId) => campaignFetch(`/api/subscriptions/${subscriptionId}`),
    cancel: (subscriptionId) =>
      campaignFetch(`/api/subscriptions/${subscriptionId}/cancel`, { method: "PUT" }),
    payments: (subscriptionId) =>
      campaignFetch(`/api/subscriptions/${subscriptionId}/payments`),
    myPayments: (subscriptionId) =>
      campaignFetch(`/api/subscriptions/${subscriptionId}/payments/my`),
    allPayments: () => campaignFetch("/api/subscriptions/payments"),
    paymentsByShop: (shopId) =>
      campaignFetch(`/api/subscriptions/shop/${shopId}/payments`),
    byShop: (shopId) => campaignFetch(`/api/subscriptions/shop/${shopId}`),
    status: (shopId) => campaignFetch(`/api/subscriptions/shop/${shopId}/status`),
    subscribe: (body) => campaignFetch("/api/subscriptions/subscribe", bodyRequest("POST", body)),
  },
};
