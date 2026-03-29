const BASE = "/campaigns";
const SHOP_ID = 1;

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.message || "خطأ في الطلب");
    err.errorCodes = json?.errorCodes || [];
    throw err;
  }
  return json;
}

export const shopAdsApi = {
  // Get all my ad requests
  getAll:        ()       => apiFetch(`/api/ad-requests/shop/${SHOP_ID}`),
  // Get by status: PENDING | APPROVED | REJECTED
  getByStatus:   (status) => apiFetch(`/api/ad-requests/shop/${SHOP_ID}/status/${status}`),
  // Get single by id (to check payment status)
  getById:       (id)     => apiFetch(`/api/ad-requests/${id}`),
  // Create new ad request
  create:        (body)   => apiFetch("/api/ad-requests", { method: "POST", body: JSON.stringify(body) }),
  // Update (only PENDING)
  update:        (body)   => apiFetch("/api/ad-requests", { method: "PUT",  body: JSON.stringify(body) }),
  // Confirm payment
  pay:           (id)     => apiFetch(`/api/ad-requests/${id}/pay`, { method: "PUT" }),
  // Get active templates to pick from when creating
  getTemplates:  ()       => apiFetch("/api/ad-templates?status=ACTIVE"),
};
