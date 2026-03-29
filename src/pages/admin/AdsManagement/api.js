const BASE_URL = "/campaigns";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
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

// ── Ad Templates ──────────────────────────────────────────────────────────────
export const adTemplatesApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) q.set(k, v); });
    return apiFetch(`/api/ad-templates?${q.toString()}`);
  },
  getById:       (id)         => apiFetch(`/api/ad-templates/${id}`),
  create:        (body)       => apiFetch("/api/ad-templates", { method: "POST", body: JSON.stringify(body) }),
  update:        (body)       => apiFetch("/api/ad-templates", { method: "PUT",  body: JSON.stringify(body) }),
  archive:       (id)         => apiFetch(`/api/ad-templates/${id}/archive`, { method: "PUT" }),
  changeStatus:  (id, status) => apiFetch(`/api/ad-templates/${id}/status?status=${status}`, { method: "PUT" }),
  delete:        (id)         => apiFetch(`/api/ad-templates/${id}`, { method: "DELETE" }),
};

// ── Ad Requests ───────────────────────────────────────────────────────────────
export const adRequestsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) q.set(k, v); });
    return apiFetch(`/api/ad-requests?${q.toString()}`);
  },
  getById: (id)           => apiFetch(`/api/ad-requests/${id}`),
  create:  (body)         => apiFetch("/api/ad-requests", { method: "POST", body: JSON.stringify(body) }),
  update:  (body)         => apiFetch("/api/ad-requests", { method: "PUT",  body: JSON.stringify(body) }),
  approve: (id)           => apiFetch(`/api/ad-requests/${id}/approve`, { method: "PUT" }),
  reject:  (id, reason)   => apiFetch(`/api/ad-requests/${id}/reject?reason=${encodeURIComponent(reason)}`, { method: "PUT" }),
  cancel:  (id)           => apiFetch(`/api/ad-requests/${id}`, { method: "DELETE" }),
};