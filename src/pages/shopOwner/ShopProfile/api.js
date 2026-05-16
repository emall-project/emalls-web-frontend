import { auth } from "../../../api/auth";

const BASE = "/accounts/api/shops";

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
    err.errorCodes = json?.errorCodes || [];
    throw err;
  }
  return json;
}

function shopId() {
  const id = auth.getShopId();
  if (!id) throw new Error("تعذر تحديد معرف المتجر");
  return id;
}

export const shopProfileApi = {
  get:                 ()       => apiFetch(`/${shopId()}`),
  update:              (body)   => apiFetch("", { method: "PUT", body: JSON.stringify(body) }),
  requestStatusChange: (status) => apiFetch(`/${shopId()}/status?status=${status}`, { method: "PUT" }),
};
