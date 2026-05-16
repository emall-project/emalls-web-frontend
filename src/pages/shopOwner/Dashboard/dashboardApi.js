import { auth } from "../../../api/auth";

const ACCOUNTS  = "/accounts/api";
const CATALOG   = "/catalog";
const CAMPAIGNS = "/campaigns";
const ORDER_HUB = "/order-hub";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "خطأ في تحميل البيانات");
  return json;
}

async function safe(fn) {
  try { return await fn(); } catch { return null; }
}

function norm(raw) {
  return raw?.data ?? raw ?? null;
}

function normList(raw) {
  const unwrapped = raw?.data ?? raw;
  if (Array.isArray(unwrapped)) return { list: unwrapped, total: unwrapped.length };
  const content = unwrapped?.content ?? unwrapped?.items ?? [];
  const total   = unwrapped?.meta?.totalItems ?? unwrapped?.totalElements ?? content.length;
  return { list: Array.isArray(content) ? content : [], total };
}

export async function fetchDashboard(shopId) {
  if (!shopId) throw new Error("تعذر تحديد معرف المتجر، يرجى تسجيل الخروج وإعادة تسجيل الدخول.");

  const [
    shopRaw, orderStatsRaw, ordersRaw,
    productsRaw, activeProductsRaw,
    returnStatsRaw,
    financeRaw, adsRaw, subscriptionRaw, writeAccessRaw,
  ] = await Promise.all([
    safe(() => apiFetch(`${ACCOUNTS}/shops/${shopId}`)),
    safe(() => apiFetch(`${ORDER_HUB}/orders/shop/${shopId}/stats`)),
    safe(() => apiFetch(`${ORDER_HUB}/orders/shop/${shopId}?page=0&size=5&sort=createdAt,desc`)),

    safe(() => apiFetch(`${CATALOG}/stores/${shopId}/products/all?page=0&size=8`, {
      method: "POST", body: JSON.stringify({}),
    })),
    safe(() => apiFetch(`${CATALOG}/stores/${shopId}/products/all?page=0&size=1`, {
      method: "POST", body: JSON.stringify({ isActive: true }),
    })),

    safe(() => apiFetch(`${ORDER_HUB}/returns/shop/${shopId}/stats`)),
    safe(() => apiFetch(`${ORDER_HUB}/finance/shops/${shopId}/payout`)),
    safe(() => apiFetch(`${CAMPAIGNS}/api/ad-requests/shop/${shopId}`)),
    safe(() => apiFetch(`${CAMPAIGNS}/api/subscriptions/shop/${shopId}`)),
    safe(() => apiFetch(`${CAMPAIGNS}/api/subscriptions/shop/${shopId}/write-access`)),
  ]);

  const shop        = norm(shopRaw);
  const orderStats  = norm(orderStatsRaw) ?? {};
  const ordersData  = normList(ordersRaw);
  const productsData = normList(productsRaw);
  const activeCount = (() => {
    const m = activeProductsRaw?.data?.meta ?? activeProductsRaw?.meta;
    return m?.totalItems ?? null;
  })();
  const returnStats = norm(returnStatsRaw) ?? {};
  const finance     = norm(financeRaw);
  const adsList     = (() => {
    const r = norm(adsRaw);
    return Array.isArray(r) ? r : [];
  })();
  const subscription = (() => {
    const r = norm(subscriptionRaw);
    if (Array.isArray(r)) return r[0] ?? null;
    return r;
  })();
  const hasWriteAccess = (() => {
    const r = norm(writeAccessRaw);
    if (typeof r === "boolean") return r;
    if (r && typeof r === "object") {
      if ("hasWriteAccess" in r) return Boolean(r.hasWriteAccess);
      if ("writeAccess"    in r) return Boolean(r.writeAccess);
    }
    return null;
  })();

  return {
    shop, orderStats,
    ordersList: ordersData.list,
    productsList: productsData.list,
    productsTotal: productsData.total,
    activeProductsCount: activeCount,
    returnStats, finance, adsList, subscription, hasWriteAccess,
  };
}
