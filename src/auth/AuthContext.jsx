import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginWithPassword, refreshAccessToken } from "./api";
import {
  AUTH_CHANGE_EVENT,
  clearAuthState,
  getHomePathForRole,
  isSessionExpired,
  readAuthState,
  ROLE_ADMIN,
  ROLE_CUSTOMER,
  ROLE_SHOP_OWNER,
  setSelectedStoreId,
} from "./session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => readAuthState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const syncFromStorage = () => {
      if (!cancelled) {
        setAuthState(readAuthState());
      }
    };

    const bootstrap = async () => {
      const current = readAuthState();

      if (current?.session && !isSessionExpired(current.session)) {
        if (!cancelled) {
          setAuthState(current);
          setReady(true);
        }
        return;
      }

      if (current?.refreshToken) {
        try {
          const refreshed = await refreshAccessToken();
          if (!cancelled) {
            setAuthState(refreshed);
          }
        } catch {
          if (!cancelled) {
            setAuthState(null);
          }
        }
      } else if (current?.session && isSessionExpired(current.session)) {
        clearAuthState();
        if (!cancelled) {
          setAuthState(null);
        }
      } else if (!cancelled) {
        setAuthState(current);
      }

      if (!cancelled) {
        setReady(true);
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, syncFromStorage);
    bootstrap();

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGE_EVENT, syncFromStorage);
    };
  }, []);

  const login = useCallback(async ({ username, password, requiredRole }) => {
    const nextState = await loginWithPassword({ username, password });
    const nextRole = nextState?.session?.role || "";

    if (requiredRole && nextRole !== requiredRole) {
      clearAuthState();
      throw new Error(
        requiredRole === ROLE_ADMIN
          ? "هذا الحساب ليس حساب إدارة"
          : requiredRole === ROLE_SHOP_OWNER
          ? "هذا الحساب ليس حساب صاحب متجر"
          : "هذا الحساب ليس حساب عميل"
      );
    }

    setAuthState(nextState);
    return nextState;
  }, []);

  const logout = useCallback(() => {
    clearAuthState();
    setAuthState(null);
  }, []);

  const selectStore = useCallback((storeId) => {
    const nextState = setSelectedStoreId(storeId);
    setAuthState(nextState);
    return nextState;
  }, []);

  const session = authState?.session || null;

  const value = useMemo(
    () => ({
      ready,
      authState,
      session,
      isAuthenticated: !!session && !isSessionExpired(session),
      role: session?.role || "",
      fullName: session?.fullName || "",
      username: session?.username || "",
      stores: session?.shopIds || [],
      selectedStoreId: session?.selectedStoreId ?? null,
      selectedMallId: session?.selectedMallId ?? null,
      isAdmin: session?.role === ROLE_ADMIN,
      isShopOwner: session?.role === ROLE_SHOP_OWNER,
      isCustomer: session?.role === ROLE_CUSTOMER,
      login,
      logout,
      selectStore,
      getDefaultHome: () => getHomePathForRole(session?.role || ""),
    }),
    [authState, login, logout, ready, selectStore, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
