import {
  clearAuthState,
  getRefreshToken,
  persistAuthState,
} from "./session";
import { createApiError } from "../utils/apiErrors";

const AUTH_BASE = "/accounts/api/auth";
const AUTH_HEADER = "Authorization";
const REFRESH_HEADER = "X-Refresh-Token";

function extractAccessToken(response) {
  const value = response.headers.get(AUTH_HEADER) || "";
  return value.replace(/^Bearer\s+/i, "").trim();
}

async function buildRequestError(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);
  return createApiError(response, payload, fallbackMessage || "حدث خطأ في المصادقة");
}

async function requestAuth(path, options = {}, fallbackMessage) {
  const response = await fetch(`${AUTH_BASE}${path}`, {
    credentials: "include",
    ...options,
  });
  if (!response.ok) {
    throw await buildRequestError(response, fallbackMessage);
  }

  const accessToken = extractAccessToken(response);
  const refreshToken = response.headers.get(REFRESH_HEADER) || "";

  if (!accessToken) {
    throw new Error("لم يرجع الخادم رمز دخول صالح");
  }

  return persistAuthState(accessToken, refreshToken);
}

let refreshPromise = null;
export async function loginWithPassword({ username, password }) {
  return requestAuth(
    "/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    },
    "فشل تسجيل الدخول"
  );
}
export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthState();
    return null;
  }

  refreshPromise = requestAuth(
    "/refresh-token",
    {
      method: "POST",
      headers: {
        [REFRESH_HEADER]: refreshToken,
      },
    },
    "انتهت صلاحية الجلسة"
  )
    .catch((error) => {
      clearAuthState();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
