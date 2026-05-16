import { auth } from "../../../api/auth";

const BASE = "/campaigns";

async function apiFetch(path, options = {}, allowRetry = true) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
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

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.message || json?.error || "خطأ في الطلب";
    const err = new Error(msg);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json?.data ?? json;
}

function getShopId() {
  const id = auth.getShopId();
  if (!id) throw new Error("تعذر تحديد معرف المتجر، يرجى إعادة تسجيل الدخول.");
  return id;
}

export const subscriptionApi = {
  getActivePlans:          ()              => apiFetch("/api/subscriptions/plans/active"),
  getCurrentSubscription:  ()              => apiFetch(`/api/subscriptions/shop/${getShopId()}`),
  getStatus:               ()              => apiFetch(`/api/subscriptions/shop/${getShopId()}/status`),
  getWriteAccess:          ()              => apiFetch(`/api/subscriptions/shop/${getShopId()}/write-access`),
  getPayments:             ()              => apiFetch(`/api/subscriptions/shop/${getShopId()}/payments`),
  subscribe: (planId, autoRenew = false)   => apiFetch("/api/subscriptions/subscribe", {
    method: "POST",
    body: JSON.stringify({ shopId: getShopId(), planId, autoRenew }),
  }),
};
