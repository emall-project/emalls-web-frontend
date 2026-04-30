const STORAGE_KEYS = {
  accessToken: "emall.auth.accessToken",
  refreshToken: "emall.auth.refreshToken",
  session: "emall.auth.session",
  selectedStoreId: "emall.auth.selectedStoreId",
};

const LEGACY_TOKEN_KEYS = ["accessToken", "token", "authToken", "jwt", "jwtToken"];

export const AUTH_CHANGE_EVENT = "emall-auth-changed";
export const ROLE_ADMIN = "ROLE_ADMIN";
export const ROLE_SHOP_OWNER = "ROLE_SHOP_OWNER";
export const ROLE_CUSTOMER = "ROLE_CUSTOMER";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function toNumberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function emitAuthChange(detail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail }));
}

function decodeBase64Url(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return atob(padded);
}

function decodeJwtPayload(token) {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = String(token).split(".");
    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

function normalizeStoreRefs(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => ({
      storeId: toNumberOrNull(entry?.storeId),
      mallId: toNumberOrNull(entry?.mallId),
    }))
    .filter((entry) => entry.storeId != null);
}

function getStoredSelectedStoreId() {
  if (!canUseStorage()) {
    return null;
  }

  return toNumberOrNull(window.localStorage.getItem(STORAGE_KEYS.selectedStoreId));
}

function getLegacyAccessToken() {
  if (!canUseStorage()) {
    return "";
  }

  for (const key of LEGACY_TOKEN_KEYS) {
    const value = window.localStorage.getItem(key) || window.sessionStorage?.getItem(key);
    if (value) {
      return value.startsWith("Bearer ") ? value.slice(7) : value;
    }
  }

  return "";
}

export function getHomePathForRole(role) {
  if (role === ROLE_ADMIN) {
    return "/admin";
  }

  if (role === ROLE_SHOP_OWNER) {
    return "/shop-owner";
  }

  if (role === ROLE_CUSTOMER) {
    return "/account";
  }

  return "/";
}

export function isPortalRole(role) {
  return role === ROLE_ADMIN || role === ROLE_SHOP_OWNER;
}

export function isSessionExpired(session) {
  if (!session?.expiresAt) {
    return false;
  }

  return Date.now() >= session.expiresAt - 30_000;
}

export function buildSession(accessToken, refreshToken = "") {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return null;
  }

  const role = String(payload.role || "");
  const shopIds = normalizeStoreRefs(payload.shopIds);
  const requestedStoreId = getStoredSelectedStoreId();
  const selectedStore =
    shopIds.find((entry) => entry.storeId === requestedStoreId) ||
    shopIds[0] ||
    null;

  return {
    accessToken,
    refreshToken,
    userId: payload.userId ?? null,
    username: payload.username || payload.sub || "",
    fullName: payload.fullName || payload.username || payload.sub || "",
    role,
    shopIds,
    selectedStoreId: selectedStore?.storeId ?? null,
    selectedMallId: selectedStore?.mallId ?? null,
    expiresAt: payload.exp ? Number(payload.exp) * 1000 : null,
  };
}

export function readAuthState() {
  if (!canUseStorage()) {
    return null;
  }

  const accessToken =
    window.localStorage.getItem(STORAGE_KEYS.accessToken) || getLegacyAccessToken();
  const refreshToken = window.localStorage.getItem(STORAGE_KEYS.refreshToken) || "";

  if (!accessToken && !refreshToken) {
    return null;
  }

  const session = accessToken ? buildSession(accessToken, refreshToken) : null;

  if (accessToken && !session) {
    clearAuthState();
    return null;
  }

  return {
    accessToken: accessToken || "",
    refreshToken,
    session,
  };
}

export function getAccessToken() {
  return readAuthState()?.accessToken || "";
}

export function getRefreshToken() {
  return readAuthState()?.refreshToken || "";
}

export function getAuthorizationHeaderValue() {
  const token = getAccessToken();
  return token ? `Bearer ${token}` : "";
}

export function persistAuthState(accessToken, refreshToken = "") {
  if (!canUseStorage()) {
    return null;
  }

  const normalizedAccessToken = String(accessToken || "").replace(/^Bearer\s+/i, "").trim();
  const normalizedRefreshToken = String(refreshToken || "").trim();
  const session = buildSession(normalizedAccessToken, normalizedRefreshToken);

  if (!session) {
    clearAuthState();
    return null;
  }

  window.localStorage.setItem(STORAGE_KEYS.accessToken, normalizedAccessToken);
  window.localStorage.setItem(STORAGE_KEYS.refreshToken, normalizedRefreshToken);
  window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  window.localStorage.setItem("accessToken", normalizedAccessToken);

  if (session.selectedStoreId != null) {
    window.localStorage.setItem(
      STORAGE_KEYS.selectedStoreId,
      String(session.selectedStoreId)
    );
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.selectedStoreId);
  }

  const nextState = {
    accessToken: normalizedAccessToken,
    refreshToken: normalizedRefreshToken,
    session,
  };

  emitAuthChange(nextState);
  return nextState;
}

export function setSelectedStoreId(storeId) {
  const current = readAuthState();
  if (!current?.session || current.session.role !== ROLE_SHOP_OWNER) {
    return current;
  }

  const normalizedStoreId = toNumberOrNull(storeId);
  const selectedStore =
    current.session.shopIds.find((entry) => entry.storeId === normalizedStoreId) ||
    current.session.shopIds[0] ||
    null;

  const nextSession = {
    ...current.session,
    selectedStoreId: selectedStore?.storeId ?? null,
    selectedMallId: selectedStore?.mallId ?? null,
  };

  if (canUseStorage()) {
    if (nextSession.selectedStoreId != null) {
      window.localStorage.setItem(
        STORAGE_KEYS.selectedStoreId,
        String(nextSession.selectedStoreId)
      );
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.selectedStoreId);
    }

    window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(nextSession));
  }

  const nextState = {
    ...current,
    session: nextSession,
  };

  emitAuthChange(nextState);
  return nextState;
}

export function clearAuthState() {
  if (!canUseStorage()) {
    return;
  }

  Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
  LEGACY_TOKEN_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage?.removeItem(key);
  });

  emitAuthChange(null);
}
