import { requestJson } from "../utils/http";

const ACCOUNTS_BASE = "/accounts";

function unwrap(payload) {
  return payload?.data ?? payload ?? null;
}

export function unwrapAccountPayload(payload) {
  return unwrap(payload);
}

export function normalizePage(payload) {
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

function queryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value != null) {
      query.set(key, value);
    }
  });
  return query.toString();
}

function accountFetch(path, options = {}) {
  return requestJson(`${ACCOUNTS_BASE}${path}`, options);
}

function bodyRequest(method, body) {
  return {
    method,
    body: JSON.stringify(body),
  };
}

export const accountsApi = {
  auth: {
    signup: (body) => accountFetch("/api/auth/signup", bodyRequest("POST", body)),
  },

  dashboard: {
    admin: () => accountFetch("/api/dashboard/admin"),
    shopOwner: () => accountFetch("/api/dashboard/shop-owner"),
    customer: () => accountFetch("/api/dashboard/customer"),
  },

  users: {
    page: (params = {}) => accountFetch(`/api/users?${queryString(params)}`),
    all: (params = {}) => accountFetch(`/api/users/all?${queryString(params)}`),
    byId: (id) => accountFetch(`/api/users/${id}`),
    create: (body) => accountFetch("/api/users", bodyRequest("POST", body)),
    update: (body) => accountFetch("/api/users", bodyRequest("PUT", body)),
    activate: (id) => accountFetch(`/api/users/activate/${id}`, { method: "PUT" }),
    deactivate: (id) => accountFetch(`/api/users/deactivate/${id}`, { method: "PUT" }),
    profile: {
      getInfo: (userId) => accountFetch(`/api/users/${userId}/profile/info`),
      updateInfo: (userId, body) =>
        accountFetch(`/api/users/${userId}/profile/info`, bodyRequest("PUT", body)),
      changePassword: (userId, body) =>
        accountFetch(`/api/users/${userId}/profile/password`, bodyRequest("PUT", body)),
    },
  },

  roles: {
    page: (params = {}) => accountFetch(`/api/roles?${queryString(params)}`),
    all: (params = {}) => accountFetch(`/api/roles/all?${queryString(params)}`),
    byId: (id) => accountFetch(`/api/roles/${id}`),
    create: (body) => accountFetch("/api/roles", bodyRequest("POST", body)),
    update: (body) => accountFetch("/api/roles", bodyRequest("PUT", body)),
    delete: (id) => accountFetch(`/api/roles/${id}`, { method: "DELETE" }),
  },

  cities: {
    page: (params = {}) => accountFetch(`/api/cities?${queryString(params)}`),
    all: (params = {}) => accountFetch(`/api/cities/all?${queryString(params)}`),
    active: () => accountFetch("/api/cities/active"),
    byId: (id) => accountFetch(`/api/cities/${id}`),
    create: (body) => accountFetch("/api/cities", bodyRequest("POST", body)),
    update: (body) => accountFetch("/api/cities", bodyRequest("PUT", body)),
    activate: (id) => accountFetch(`/api/cities/activate/${id}`, { method: "PUT" }),
    deactivate: (id) => accountFetch(`/api/cities/deactivate/${id}`, { method: "PUT" }),
  },

  malls: {
    page: (params = {}) => accountFetch(`/api/malls?${queryString(params)}`),
    all: (params = {}) => accountFetch(`/api/malls/all?${queryString(params)}`),
    byId: (id) => accountFetch(`/api/malls/${id}`),
    byCity: (cityId) => accountFetch(`/api/malls/city/${cityId}`),
    activeByCity: (cityId) => accountFetch(`/api/malls/city/${cityId}/active`),
    byStatus: (status) => accountFetch(`/api/malls/status/${status}`),
    create: (body) => accountFetch("/api/malls", bodyRequest("POST", body)),
    update: (body) => accountFetch("/api/malls", bodyRequest("PUT", body)),
    delete: (id) => accountFetch(`/api/malls/${id}`, { method: "DELETE" }),
    changeStatus: (id, status) =>
      accountFetch(`/api/malls/${id}/status?status=${encodeURIComponent(status)}`, { method: "PUT" }),
    activate: (id) => accountFetch(`/api/malls/${id}/activate`, { method: "PUT" }),
    deactivate: (id) => accountFetch(`/api/malls/${id}/deactivate`, { method: "PUT" }),
    maintenance: (id) => accountFetch(`/api/malls/${id}/maintenance`, { method: "PUT" }),
  },

  shops: {
    page: (params = {}) => accountFetch(`/api/shops?${queryString(params)}`),
    all: (params = {}) => accountFetch(`/api/shops/all?${queryString(params)}`),
    byId: (id) => accountFetch(`/api/shops/${id}`),
    byMall: (mallId) => accountFetch(`/api/shops/mall/${mallId}`),
    activeByMall: (mallId) => accountFetch(`/api/shops/mall/${mallId}/active`),
    byOwner: (ownerId) => accountFetch(`/api/shops/owner/${ownerId}`),
    create: (body) => accountFetch("/api/shops", bodyRequest("POST", body)),
    update: (body) => accountFetch("/api/shops", bodyRequest("PUT", body)),
    delete: (id) => accountFetch(`/api/shops/${id}`, { method: "DELETE" }),
    setMaintenance: (id) => accountFetch(`/api/shops/${id}/maintenance`, { method: "PUT" }),
    block: (id) => accountFetch(`/api/shops/${id}/block`, { method: "PUT" }),
    unblock: (id) => accountFetch(`/api/shops/${id}/unblock`, { method: "PUT" }),
    writeAccess: (shopId) => accountFetch(`/api/shops/${shopId}/write-access`),
  },

  mallServices: {
    byMall: (mallId) => accountFetch(`/api/mall-services/mall/${mallId}`),
    activeByMall: (mallId) => accountFetch(`/api/mall-services/mall/${mallId}/active`),
    byId: (serviceId) => accountFetch(`/api/mall-services/${serviceId}`),
    create: (body) => accountFetch("/api/mall-services", bodyRequest("POST", body)),
    createBatch: (body) => accountFetch("/api/mall-services/batch", bodyRequest("POST", body)),
    update: (body) => accountFetch("/api/mall-services", bodyRequest("PUT", body)),
    delete: (serviceId) => accountFetch(`/api/mall-services/${serviceId}`, { method: "DELETE" }),
    deleteByMall: (mallId) => accountFetch(`/api/mall-services/mall/${mallId}`, { method: "DELETE" }),
    activate: (serviceId) => accountFetch(`/api/mall-services/${serviceId}/activate`, { method: "PUT" }),
    deactivate: (serviceId) => accountFetch(`/api/mall-services/${serviceId}/deactivate`, { method: "PUT" }),
  },

  mallRestaurants: {
    byMall: (mallId) => accountFetch(`/api/mall-restaurants/mall/${mallId}`),
    activeByMall: (mallId) => accountFetch(`/api/mall-restaurants/mall/${mallId}/active`),
    byCuisine: (cuisineType) => accountFetch(`/api/mall-restaurants/cuisine/${encodeURIComponent(cuisineType)}`),
    byMallAndCuisine: (mallId, cuisineType) =>
      accountFetch(`/api/mall-restaurants/mall/${mallId}/cuisine/${encodeURIComponent(cuisineType)}`),
    byId: (restaurantId) => accountFetch(`/api/mall-restaurants/${restaurantId}`),
    create: (body) => accountFetch("/api/mall-restaurants", bodyRequest("POST", body)),
    createBatch: (body) => accountFetch("/api/mall-restaurants/batch", bodyRequest("POST", body)),
    update: (body) => accountFetch("/api/mall-restaurants", bodyRequest("PUT", body)),
    delete: (restaurantId) => accountFetch(`/api/mall-restaurants/${restaurantId}`, { method: "DELETE" }),
    deleteByMall: (mallId) => accountFetch(`/api/mall-restaurants/mall/${mallId}`, { method: "DELETE" }),
    activate: (restaurantId) => accountFetch(`/api/mall-restaurants/${restaurantId}/activate`, { method: "PUT" }),
    deactivate: (restaurantId) => accountFetch(`/api/mall-restaurants/${restaurantId}/deactivate`, { method: "PUT" }),
  },

  shopOwnerRequests: {
    create: (body) => accountFetch("/api/shop-owner-requests", bodyRequest("POST", body)),
    createExistingOwnerShopRequest: (body) =>
      accountFetch("/api/shop-owner-requests/existing-owner/shop-request", bodyRequest("POST", body)),
    page: (params = {}) => accountFetch(`/api/shop-owner-requests?${queryString(params)}`),
    all: (params = {}) => accountFetch(`/api/shop-owner-requests/all?${queryString(params)}`),
    pending: () => accountFetch("/api/shop-owner-requests/pending"),
    byId: (id) => accountFetch(`/api/shop-owner-requests/${id}`),
    approve: (shopOwnerRequestId) =>
      accountFetch("/api/shop-owner-requests/approve", bodyRequest("PUT", {
        shopOwnerRequestId,
        approved: true,
      })),
    reject: (shopOwnerRequestId, rejectionReason) =>
      accountFetch("/api/shop-owner-requests/reject", bodyRequest("PUT", {
        shopOwnerRequestId,
        approved: false,
        rejectionReason,
      })),
    existingOwnerPage: (params = {}) =>
      accountFetch(`/api/shop-owner-requests/existing-owner/shop-requests?${queryString(params)}`),
    existingOwnerAll: (params = {}) =>
      accountFetch(`/api/shop-owner-requests/existing-owner/shop-requests/all?${queryString(params)}`),
    approveShopRequest: (shopRequestId) =>
      accountFetch(`/api/shop-owner-requests/shop-requests/${shopRequestId}/approve`, { method: "PUT" }),
    rejectShopRequest: (shopRequestId, rejectionReason) =>
      accountFetch(
        `/api/shop-owner-requests/shop-requests/${shopRequestId}/reject?rejectionReason=${encodeURIComponent(rejectionReason)}`,
        { method: "PUT" }
      ),
  },

  media: {
    usage: (mediumId) => accountFetch(`/media/${mediumId}/usage`),
  },
};
