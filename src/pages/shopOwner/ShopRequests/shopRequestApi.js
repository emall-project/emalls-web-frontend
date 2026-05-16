import { auth } from "../../../api/auth";

const BASE_URL = "/accounts";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...auth.getHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 401) {
    auth.logout("/shop-owner/login");
    return null;
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(json?.message || "خطأ في الطلب");
    err.errorCodes = json?.errorCodes || [];
    throw err;
  }

  return json;
}

export const shopRequestApi = {
  getAllMalls: () => apiFetch("/api/malls/all"),

  // POST /api/shop-owner-requests/existing-owner/shop-request
  // Body: { shopRequest: { mallId, name, category, location, description, contactInfo, logoUuid, licenseImageUuid, shopPhotosUuids } }
  // Auth token identifies the user.
  submitNewShopRequest: (shopRequest) =>
    apiFetch("/api/shop-owner-requests/existing-owner/shop-request", {
      method: "POST",
      body: JSON.stringify({ shopRequest }),
    }),
};
