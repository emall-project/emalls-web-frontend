import { auth } from "../../../api/auth";

const BASE = "/order-hub/returns";

async function apiFetch(path, options = {}, allowRetry = true) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders(), ...(options.headers || {}) },
    ...options,
  });

  if (res.status === 401 && allowRetry) {
    const prevToken = auth.getToken();
    await auth.refresh();
    const nextToken = auth.getToken();
    if (nextToken && nextToken !== prevToken) return apiFetch(path, options, false);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.message || "خطأ في الطلب");
    err.status = res.status;
    throw err;
  }
  return json;
}

function shopId() {
  const id = auth.getShopId();
  if (!id) throw new Error("تعذر تحديد معرف المتجر");
  return id;
}

export const returnsApi = {
  getAll:      (page = 0) => apiFetch(`/shop/${shopId()}?page=${page}&size=20&sort=createdAt,desc`),
  getByStatus: (status, page = 0) => apiFetch(`/shop/${shopId()}/status/${status}?page=${page}&size=20&sort=createdAt,desc`),
  approve:     (returnId) => apiFetch(`/shop/${shopId()}/${returnId}/approve`, { method: "PATCH" }),
  reject:      (returnId, rejectionReason) => apiFetch(`/shop/${shopId()}/${returnId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ rejectionReason }),
  }),
  getStats:    () => apiFetch(`/shop/${shopId()}/stats`),
};
