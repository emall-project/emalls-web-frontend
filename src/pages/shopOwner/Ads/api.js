import { auth } from "../../../api/auth";

const BASE = "/campaigns";

function getErrorMessage(payload) {
  if (payload?.message) return payload.message;
  if (Array.isArray(payload?.errorCodes)) {
    const first = payload.errorCodes.find((item) => typeof item?.message === "string");
    if (first?.message) return first.message;
  }
  return "تعذر تنفيذ الطلب.";
}

async function apiFetch(path, options = {}, allowRetry = true) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...auth.getHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 401 && allowRetry) {
    const prevToken = auth.getToken();
    await auth.refresh();
    const nextToken = auth.getToken();
    if (nextToken && nextToken !== prevToken) return apiFetch(path, options, false);
  }

  if (res.status === 204) return null;

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(getErrorMessage(json));
    error.status = res.status;
    error.body = json;
    throw error;
  }

  return json?.data ?? json;
}

export function getShopId() {
  const shopId = auth.getShopId();
  if (!shopId) throw new Error("تعذر تحديد معرف المتجر الحالي.");
  return shopId;
}

export const adsApi = {
  getActiveTemplates: () => apiFetch("/api/ad-templates/active"),
  getActiveTemplatesByPosition: (position) =>
    apiFetch(`/api/ad-templates/position/${encodeURIComponent(position)}/active`),
  getTemplateById: (id) => apiFetch(`/api/ad-templates/${id}`),

  getShopAdRequests: (shopId = getShopId()) => apiFetch(`/api/ad-requests/shop/${shopId}`),
  getShopAdRequestsByStatus: (status, shopId = getShopId()) =>
    apiFetch(`/api/ad-requests/shop/${shopId}/status/${status}`),
  getAdRequestById: (id) => apiFetch(`/api/ad-requests/${id}`),
  countShopAdRequests: (shopId = getShopId()) => apiFetch(`/api/ad-requests/count/shop/${shopId}`),

  createAdRequest: (payload) =>
    apiFetch("/api/ad-requests", { method: "POST", body: JSON.stringify(payload) }),
  updateAdRequest: (payload) =>
    apiFetch("/api/ad-requests", { method: "PUT", body: JSON.stringify(payload) }),
  cancelAdRequest: (requestId, shopId = getShopId()) =>
    apiFetch(`/api/ad-requests/${requestId}/shop/${shopId}`, { method: "DELETE" }),

  initiatePayment: (requestId) =>
    apiFetch(`/api/ad-requests/${requestId}/initiate-payment`, { method: "POST" }),
  getShopPaymentHistory: (shopId = getShopId()) =>
    apiFetch(`/api/ad-requests/shop/${shopId}/payments`),
  getRequestPaymentHistory: (requestId) =>
    apiFetch(`/api/ad-requests/${requestId}/payments/my`),
};
