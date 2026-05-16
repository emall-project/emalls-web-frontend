import { auth } from "./auth";

const ORDER_HUB = "/order-hub";

async function rawFetch(path, options = {}) {
  const res = await fetch(`${ORDER_HUB}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "خطأ في الطلب");
  return json;
}

function normalizePage(json) {
  const data    = json?.data ?? json ?? {};
  const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
  const meta    = data?.meta || {};
  return {
    content,
    totalPages:    meta.totalPages    ?? data.totalPages    ?? 1,
    totalElements: meta.totalItems    ?? data.totalElements ?? content.length,
  };
}

export const returnsApi = {
  create: async (body) => {
    const json = await rawFetch("/returns", { method: "POST", body: JSON.stringify(body) });
    return json?.data ?? json;
  },

  pageMine: async (page = 0, size = 10) => {
    const json = await rawFetch(`/returns/me?page=${page}&size=${size}`);
    return normalizePage(json);
  },

  byIdMine: async (returnRequestId) => {
    const json = await rawFetch(`/returns/me/${returnRequestId}`);
    return json?.data ?? json;
  },

  byOrderItem: async (orderItemId) => {
    const json = await rawFetch(`/returns/me/order-item/${orderItemId}`);
    return json?.data ?? json;
  },
};
