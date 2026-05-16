import { auth } from "../../../api/auth";

const BASE_URL = "/accounts";

function buildQuery(params = {}, defaults = {}) {
  const q = new URLSearchParams();
  Object.entries({ ...defaults, ...params }).forEach(([key, value]) => {
    if (value !== "" && value != null) q.set(key, value);
  });
  return q.toString();
}

function getErrorMessage(json) {
  const firstError = Array.isArray(json?.errorCodes) ? json.errorCodes[0] : null;
  if (typeof firstError === "string") return firstError;
  if (firstError?.message) return firstError.message;
  return json?.message || "خطأ في الطلب";
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...auth.getHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 401) {
    auth.logout("/login");
    return null;
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(getErrorMessage(json));
    err.errorCodes = json?.errorCodes || [];
    err.status = json?.status || res.status;
    throw err;
  }

  return json;
}

export const shopRequestsApi = {
  getShopOwnerRequests: (params = {}) => {
    const q = buildQuery(params, { page: 0, size: 20, sort: "id,desc" });
    return apiFetch(`/api/shop-owner-requests?${q}`);
  },

  getShopOwnerRequestsList: (params = {}) => {
    const q = buildQuery(params);
    return apiFetch(`/api/shop-owner-requests/all${q ? `?${q}` : ""}`);
  },

  getPendingShopOwnerRequests: () => apiFetch("/api/shop-owner-requests/pending"),

  getShopOwnerRequestById: (id) => apiFetch(`/api/shop-owner-requests/${id}`),

  approveShopOwnerRequest: (id) =>
    apiFetch("/api/shop-owner-requests/approve", {
      method: "PUT",
      body: JSON.stringify({ shopOwnerRequestId: id, approved: true }),
    }),

  rejectShopOwnerRequest: (id, rejectionReason) =>
    apiFetch("/api/shop-owner-requests/reject", {
      method: "PUT",
      body: JSON.stringify({
        shopOwnerRequestId: id,
        approved: false,
        rejectionReason,
      }),
    }),

  getExistingOwnerShopRequests: (params = {}) => {
    const q = buildQuery(params, { page: 0, size: 20, sort: "id,desc" });
    return apiFetch(`/api/shop-owner-requests/existing-owner/shop-requests?${q}`);
  },

  getExistingOwnerShopRequestsList: (params = {}) => {
    const q = buildQuery(params);
    return apiFetch(`/api/shop-owner-requests/existing-owner/shop-requests/all${q ? `?${q}` : ""}`);
  },

  getExistingOwnerShopRequestById: (id) =>
    apiFetch(`/api/shop-owner-requests/existing-owner/shop-requests/${id}`),

  approveExistingOwnerShopRequest: (id) =>
    apiFetch(`/api/shop-owner-requests/shop-requests/${id}/approve`, { method: "PUT" }),

  rejectExistingOwnerShopRequest: (id, reason) =>
    apiFetch(
      `/api/shop-owner-requests/shop-requests/${id}/reject?${new URLSearchParams({ rejectionReason: reason })}`,
      { method: "PUT" },
    ),

  getAllMalls: () => apiFetch("/api/malls/all"),
};
