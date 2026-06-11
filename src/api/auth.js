const TOKEN_KEY      = "emalls_token";
const REFRESH_KEY    = "emalls_refresh";
const ACTIVE_SHOP_KEY = "emalls_active_shop";
const TEMP_TOKEN_HEADER = "X-Temp-Token";

function getErrorMessage(json, fallback) {
  const firstError = Array.isArray(json?.errorCodes) ? json.errorCodes[0] : null;
  if (typeof firstError === "string" && firstError.trim()) return firstError;
  if (firstError?.message) return firstError.message;
  return json?.message || fallback;
}

function decodePayload(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function stripBearer(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.startsWith("Bearer ") ? trimmed.slice(7).trim() : trimmed;
}

function authPayload(json) {
  return json?.data ?? json ?? {};
}

function readAuthTokens(res, json) {
  const body = authPayload(json);
  const headerToken = stripBearer(res.headers.get("Authorization") || "");
  const bodyToken = stripBearer(body.accessToken || body.authorization || body.Authorization || body.token || "");
  const refresh = body.refreshToken || body.refresh || res.headers.get("X-Refresh-Token");

  return {
    token: bodyToken || headerToken,
    refresh,
  };
}

export const auth = {
  getToken:   () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),

  setTokens: (token, refresh) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ACTIVE_SHOP_KEY);
  },

  // { Authorization: "Bearer <token>" } or {}
  getHeaders: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Decoded JWT payload — { userId, username, role, shopIds, ... }
  // Returns null if token is missing or expired.
  getUser: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = decodePayload(token);
    if (!payload) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  },

  // All { storeId, mallId } entries from the JWT (SHOP_OWNER only)
  getAllShops: () => {
    const user = auth.getUser();
    return user?.shopIds ?? [];
  },

  // Persist the active shop selection across sessions
  setActiveShopId: (storeId) => {
    localStorage.setItem(ACTIVE_SHOP_KEY, String(storeId));
  },

  // Active storeId: respects the user's last selection (stored in localStorage),
  // falls back to the first shop in the JWT when no selection exists or the stored
  // value no longer matches any owned shop (e.g. after re-login).
  getShopId: () => {
    const user = auth.getUser();
    const all  = user?.shopIds ?? [];
    if (!all.length) return null;
    const stored = localStorage.getItem(ACTIVE_SHOP_KEY);
    if (stored && all.some((s) => String(s.storeId) === stored)) {
      return Number(stored);
    }
    return all[0].storeId;
  },

  isLoggedIn: () => !!auth.getUser(),

  login: async (username, password) => {
    const res = await fetch("/accounts/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message || "اسم المستخدم أو كلمة المرور غير صحيحة");
    }
    const json = await res.json().catch(() => null);
    const { token, refresh } = readAuthTokens(res, json);
    if (!token) throw new Error("لم يتم استلام رمز المصادقة من الخادم");
    auth.setTokens(token, refresh);
    return decodePayload(token);
  },

  signup: async (payload) => {
    const res = await fetch("/accounts/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "فشل إنشاء الحساب");
    return json?.data ?? json;
  },

  requestPasswordReset: async (username) => {
    const res = await fetch("/accounts/api/auth/forgot-password/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(getErrorMessage(json, "ÙØ´Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚."));
    }

    const tempToken = res.headers.get(TEMP_TOKEN_HEADER) || "";
    if (!tempToken) {
      throw new Error("Ù„Ù… ÙŠØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø±Ù…Ø² Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ù…Ù† Ø§Ù„Ø®Ø§Ø¯Ù….");
    }

    return tempToken;
  },

  resendPasswordResetOtp: async (tempToken) => {
    const res = await fetch("/accounts/api/auth/forgot-password/resend", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tempToken}`,
      },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(getErrorMessage(json, "ÙØ´Ù„ Ø¥Ø¹Ø§Ø¯Ø© Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ù…Ø²."));
    }

    const nextTempToken = res.headers.get(TEMP_TOKEN_HEADER) || "";
    if (!nextTempToken) {
      throw new Error("Ù„Ù… ÙŠØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø±Ù…Ø² Ø¬Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„Ø®Ø§Ø¯Ù….");
    }

    return nextTempToken;
  },

  resetForgottenPassword: async (tempToken, payload) => {
    const res = await fetch("/accounts/api/auth/forgot-password/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tempToken}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(getErrorMessage(json, "ÙØ´Ù„ ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±."));
    }
  },

  getUserInfo: async (userId) => {
    const res = await fetch(`/accounts/api/users/${userId}/info`, {
      headers: { ...auth.getHeaders() },
    });
    if (res.status === 403) return null;
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "ÙØ´Ù„ Ø¬Ù„Ø¨ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…");
    return json?.data ?? json;
  },

  updateProfile: async (userId, payload) => {
    const res = await fetch(`/accounts/api/users/${userId}/profile/info`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...auth.getHeaders() },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "فشل تحديث الملف الشخصي");
    return json?.data ?? json;
  },

  changePassword: async (userId, payload) => {
    const res = await fetch(`/accounts/api/users/${userId}/profile/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...auth.getHeaders() },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "فشل تغيير كلمة المرور");
  },

  logout: (redirectTo = "/login") => {
    auth.clear();
    window.location.href = redirectTo;
  },

  refresh: async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) { auth.clear(); return; }
    const res = await fetch("/accounts/api/auth/refresh-token", {
      method: "POST",
      headers: { "X-Refresh-Token": refreshToken },
    });
    if (!res.ok) { auth.clear(); return; }
    const json = await res.json().catch(() => null);
    const { token, refresh } = readAuthTokens(res, json);
    if (token) auth.setTokens(token, refresh);
  },
};
