import { auth } from "../../../api/auth";

const BASE = "/order-hub/orders";

async function apiFetch(path, options = {}, allowRetry = true) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...auth.getHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 401) {
    const currentToken = auth.getToken();
    await auth.refresh();
    const nextToken = auth.getToken();

    if (allowRetry && nextToken && nextToken !== currentToken) {
      return apiFetch(path, options, false);
    }

    const json = await res.json().catch(() => null);
    const err = new Error(
      json?.message || "تعذر الوصول إلى طلبات المتجر. يرجى إعادة تسجيل الدخول إذا استمرت المشكلة."
    );
    err.status = 401;
    throw err;
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.message || "تعذر تنفيذ الطلب");
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

export const ordersApi = {
  getAll: async (page = 0) => {
    return apiFetch(`/shop/${shopId()}?page=${page}&size=20&sort=createdAt,desc`);
  },

  getByStatus: async (status, page = 0) => {
    return apiFetch(`/shop/${shopId()}/status/${status}?page=${page}&size=20&sort=createdAt,desc`);
  },

  getById: (orderId) => apiFetch(`/shop/${shopId()}/${orderId}`),
  advance: (orderId) => apiFetch(`/shop/${shopId()}/${orderId}/advance`, { method: "PATCH" }),
  getStats: () => apiFetch(`/shop/${shopId()}/stats`),
};
