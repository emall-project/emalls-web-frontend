import { auth } from "../../../api/auth";

const BASE_URL = "/accounts";

function getErrorMessage(json) {
  const firstError = Array.isArray(json?.errorCodes) ? json.errorCodes[0] : null;
  if (typeof firstError === "string") return firstError;
  if (firstError?.message) return firstError.message;
  return json?.message || "خطأ في الطلب";
}

async function apiFetch(path, options = {}) {
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

export const shopsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) q.set(k, v); });
    return apiFetch(`/api/shops?${q.toString()}`);
  },
  getById:      (id)   => apiFetch(`/api/shops/${id}`),
  create:       (body) => apiFetch("/api/shops", { method: "POST", body: JSON.stringify(body) }),
  update:       (body) => apiFetch("/api/shops", { method: "PUT", body: JSON.stringify(body) }),
  setMaintenance:     (id) => apiFetch(`/api/shops/${id}/maintenance`, { method: "PUT" }),
  block:              (id) => apiFetch(`/api/shops/${id}/block`, { method: "PUT" }),
  clearAdminOverride: (id) => apiFetch(`/api/shops/${id}/unblock`, { method: "PUT" }),
};

export const mallsApi = {
  getList: () => apiFetch("/api/malls/all"),
};

export const usersApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) q.set(k, v); });
    return apiFetch(`/api/users?${q.toString()}`);
  },
};
