import { auth } from "../../../api/auth";

const ORDER_HUB = "/order-hub";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.message || "خطأ في تحميل البيانات");
    err.status = res.status;
    throw err;
  }
  return json?.data ?? json;
}

function shopId() {
  const id = auth.getShopId();
  if (!id) throw new Error("تعذر تحديد معرف المتجر");
  return id;
}

export const financeApi = {
  getPayout:      () => apiFetch(`${ORDER_HUB}/finance/shops/${shopId()}/payout`),
  getReturnStats: () => apiFetch(`${ORDER_HUB}/finance/shops/${shopId()}/return-stats`),
  getOrders:      (page = 0, size = 20) =>
    apiFetch(`${ORDER_HUB}/orders/shop/${shopId()}?page=${page}&size=${size}&sort=createdAt,desc`),
};
