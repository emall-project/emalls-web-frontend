const BASE_URL = "/accounts";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
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

export const shopOwnerSignupApi = {
  getActiveCities: () => apiFetch("/api/cities/active"),
  getActiveMallsByCity: (cityId) => apiFetch(`/api/malls/city/${cityId}/active`),
  submitRequest: (body) =>
    apiFetch("/api/shop-owner-requests", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
