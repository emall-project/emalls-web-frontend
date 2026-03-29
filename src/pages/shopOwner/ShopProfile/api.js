const BASE = "/accounts/api/shops";
export const SHOP_ID = 1; // hardcoded until login is ready

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json?.message || "خطأ في الطلب");
    err.errorCodes = json?.errorCodes || [];
    throw err;
  }
  return json;
}

export const shopProfileApi = {
  get:                 ()       => apiFetch(`/${SHOP_ID}`),
  update:              (body)   => apiFetch("",            { method: "PUT", body: JSON.stringify(body) }),
  requestStatusChange: (status) => apiFetch(`/${SHOP_ID}/status?status=${status}`, { method: "PUT" }),
};
