import { auth } from "../../../api/auth";

const BASE = "/order-hub/finance";

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

export const financeApi = {
  getOverview:       ()       => apiFetch("/overview"),
  getDistribution:   ()       => apiFetch("/items/distribution"),
  getShopPayout:     (shopId) => apiFetch(`/shops/${shopId}/payout`),
  getShopReturnStats:(shopId) => apiFetch(`/shops/${shopId}/return-stats`),
};
