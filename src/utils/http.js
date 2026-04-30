import { refreshAccessToken } from "../auth/api";
import {
  clearAuthState,
  getAuthorizationHeaderValue,
} from "../auth/session";

function getAuthHeaders(headers = {}) {
  const token = getAuthorizationHeaderValue();

  if (!token || headers.Authorization) {
    return headers;
  }

  return {
    ...headers,
    Authorization: token,
  };
}

function shouldSkipRetry(url) {
  return (
    String(url).includes("/api/auth/login") ||
    String(url).includes("/api/auth/refresh-token")
  );
}

export async function requestJson(url, options = {}) {
  const { skipAuthRetry = false, ...requestOptions } = options;
  const rawHeaders = requestOptions.headers || {};
  const isFormData =
    typeof FormData !== "undefined" && requestOptions.body instanceof FormData;
  const shouldSetJsonType =
    requestOptions.body != null &&
    !isFormData &&
    !rawHeaders["Content-Type"] &&
    !rawHeaders["content-type"];

  const headers = getAuthHeaders({
    ...(shouldSetJsonType ? { "Content-Type": "application/json" } : {}),
    ...rawHeaders,
  });

  const response = await fetch(url, {
    credentials: "include",
    ...requestOptions,
    headers,
  });

  if (response.status === 401 && !skipAuthRetry && !shouldSkipRetry(url)) {
    try {
      const refreshed = await refreshAccessToken();
      if (refreshed?.accessToken) {
        return requestJson(url, {
          ...requestOptions,
          skipAuthRetry: true,
        });
      }
    } catch {
      clearAuthState();
    }
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.message || payload?.error || "حدث خطأ في الطلب"
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}
