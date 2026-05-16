import { auth } from "../../../api/auth";

const BASE_URL = "/accounts";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...auth.getHeaders(), ...(options.headers || {}) },
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

export const usersApi = {
  getAll:  (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) q.set(k, v); });
    return apiFetch(`/api/users?${q.toString()}`);
  },
  getById: (id)   => apiFetch(`/api/users/${id}`),
  create:  (body) => apiFetch("/api/users", { method: "POST", body: JSON.stringify(body) }),
  update:  (body) => apiFetch("/api/users", { method: "PUT",  body: JSON.stringify(body) }),
};