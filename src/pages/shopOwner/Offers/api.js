import { auth } from "../../../api/auth";

const BASE = "/campaigns";

function getShopId() {
  const id = auth.getShopId();
  if (!id) {
    throw new Error("تعذر تحديد معرف المتجر الحالي.");
  }
  return id;
}

function getErrorMessage(payload) {
  return payload?.message || "حدث خطأ أثناء تنفيذ الطلب";
}

async function apiFetch(path, options = {}, allowRetry = true) {
  const response = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...auth.getHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 401 && allowRetry) {
    const prevToken = auth.getToken();
    await auth.refresh();
    const nextToken = auth.getToken();
    if (nextToken && nextToken !== prevToken) return apiFetch(path, options, false);
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(getErrorMessage(payload));
    error.status = response.status;
    error.errorCodes = payload?.errorCodes || [];
    error.response = payload;
    throw error;
  }

  return payload?.data ?? payload;
}

export const offersApi = {
  getShopId,

  getShopOffers: () => apiFetch(`/api/offers/shop/${getShopId()}`),

  getShopOffersByStatus: (status) => apiFetch(`/api/offers/shop/${getShopId()}/status/${status}`),

  getById: (offerId) => apiFetch(`/api/offers/${offerId}`),

  create: (payload) =>
    apiFetch("/api/offers", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        shopId: getShopId(),
      }),
    }),

  update: (payload) =>
    apiFetch("/api/offers", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (offerId) =>
    apiFetch(`/api/offers/${offerId}/shop/${getShopId()}`, {
      method: "DELETE",
    }),

  activate: (offerId) =>
    apiFetch(`/api/offers/${offerId}/activate/shop/${getShopId()}`, {
      method: "PUT",
    }),

  deactivate: (offerId) =>
    apiFetch(`/api/offers/${offerId}/deactivate/shop/${getShopId()}`, {
      method: "PUT",
    }),

  addProduct: (offerId, productId) =>
    apiFetch(`/api/offers/${offerId}/shop/${getShopId()}/products`, {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),

  removeProduct: (offerId, productId) =>
    apiFetch(`/api/offers/${offerId}/shop/${getShopId()}/products/${productId}`, {
      method: "DELETE",
    }),
};
