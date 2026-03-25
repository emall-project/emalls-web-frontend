const BASE_URL = "https://api.e-mall.store";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || json?.errorCodes?.[0] || "خطأ في الطلب");
  return json;
}

export const shopsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) q.set(k, v); });
    return apiFetch(`/api/shops?${q.toString()}`);
  },
  getById:      (id)         => apiFetch(`/api/shops/${id}`),
  create:       (body)       => apiFetch("/api/shops", { method: "POST", body: JSON.stringify(body) }),
  update:       (body)       => apiFetch("/api/shops", { method: "PUT",  body: JSON.stringify(body) }),
  changeStatus: (id, status) => apiFetch(`/api/shops/${id}/status?status=${status}`, { method: "PUT" }),
};

export const mallsApi = {
  getList: () => apiFetch("/api/malls/all"),
};