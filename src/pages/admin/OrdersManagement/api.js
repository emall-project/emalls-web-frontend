import { auth } from "../../../api/auth";

const BASE = "/order-hub/orders";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders(), ...(options.headers || {}) },
    ...options,
  });
  if (res.status === 401) { auth.logout("/login"); return null; }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "خطأ في الطلب");
  return json;
}

export const adminOrdersApi = {
  getAll: ({ page = 0, size = 20, status = "", shopId = "", customerId = "", mallId = "" } = {}) => {
    const q = new URLSearchParams({ page, size, sort: "createdAt,desc" });
    if (status)     q.set("status",     status);
    if (shopId)     q.set("shopId",     shopId);
    if (customerId) q.set("customerId", customerId);
    if (mallId)     q.set("mallId",     mallId);
    return apiFetch(`/admin?${q}`);
  },
  getById:  (id) => apiFetch(`/admin/${id}`),
  getStats: ()   => apiFetch("/admin/stats"),
  // override uses query params, NOT a request body
  override: (id, targetStatus, reason) => {
    const q = new URLSearchParams({ targetStatus, reason });
    return apiFetch(`/admin/${id}/override?${q}`, { method: "PATCH" });
  },
};
