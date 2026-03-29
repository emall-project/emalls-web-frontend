const BASE_URL = "/accounts";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || json?.errorCodes?.[0] || "خطأ في الطلب");
  return json;
}

export const mallsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) q.set(k, v); });
    return apiFetch(`/api/malls?${q.toString()}`);
  },
  getById:      (id)           => apiFetch(`/api/malls/${id}`),
  create:       (body)         => apiFetch("/api/malls", { method: "POST", body: JSON.stringify(body) }),
  update:       (body)         => apiFetch("/api/malls", { method: "PUT",  body: JSON.stringify(body) }),
  activate:     (id)           => apiFetch(`/api/malls/${id}/activate`,   { method: "PUT" }),
  deactivate:   (id)           => apiFetch(`/api/malls/${id}/deactivate`, { method: "PUT" }),
  changeStatus: (id, status)   => apiFetch(`/api/malls/${id}/status?status=${status}`, { method: "PUT" }),
};

export const citiesApi = {
  getActive: ()     => apiFetch("/api/cities/active"),
  getAll:    ()     => apiFetch("/api/cities/all"),
  create:    (body) => apiFetch("/api/cities", { method: "POST", body: JSON.stringify(body) }),
};