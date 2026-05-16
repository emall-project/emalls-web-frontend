import { auth } from "../../../api/auth";

const BASE_URL = "/accounts";

function getErrorMessage(json) {
  const firstError = Array.isArray(json?.errorCodes) ? json.errorCodes[0] : null;
  if (typeof firstError === "string") return firstError;
  if (firstError?.message) return firstError.message;
  return json?.message || "خطأ في الطلب";
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(getErrorMessage(json));
    err.errorCodes = json?.errorCodes || [];
    throw err;
  }
  return json;
}

export const mallsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) q.set(k, v); });
    return apiFetch(`/api/malls?${q.toString()}`);
  },
  getById:      (id)         => apiFetch(`/api/malls/${id}`),
  create:       (body)       => apiFetch("/api/malls", { method: "POST", body: JSON.stringify(body) }),
  update:       (body)       => apiFetch("/api/malls", { method: "PUT", body: JSON.stringify(body) }),
  activate:     (id)         => apiFetch(`/api/malls/${id}/activate`, { method: "PUT" }),
  deactivate:   (id)         => apiFetch(`/api/malls/${id}/deactivate`, { method: "PUT" }),
  changeStatus: (id, status) => apiFetch(`/api/malls/${id}/status?status=${status}`, { method: "PUT" }),
};

export const citiesApi = {
  getActive: ()     => apiFetch("/api/cities/active"),
  getAll:    ()     => apiFetch("/api/cities/all"),
  create:    (body) => apiFetch("/api/cities", { method: "POST", body: JSON.stringify(body) }),
};
