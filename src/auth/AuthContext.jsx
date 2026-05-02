import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginWithPassword, refreshAccessToken } from "./api";
import { accountsApi, unwrapAccountPayload } from "../api/accounts";
import { getMediaPreviewUrl } from "../api/mediaManager";
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
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrateAuthState = async ({ markReady = false } = {}) => {
      const current = readAuthState();

      if (current?.session && !isSessionExpired(current.session)) {
        if (!cancelled) {
          setAuthState(current);
          if (markReady) setReady(true);
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
          clearAuthState();
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

      if (markReady && !cancelled) {
        setReady(true);
      }
    };

    const syncFromStorage = () => {
      hydrateAuthState().catch(() => {});
    };

    const syncWhenVisible = () => {
      if (document.visibilityState !== "hidden") {
        syncFromStorage();
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("focus", syncFromStorage);
    document.addEventListener("visibilitychange", syncWhenVisible);
    hydrateAuthState({ markReady: true });

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGE_EVENT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("focus", syncFromStorage);
      document.removeEventListener("visibilitychange", syncWhenVisible);
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
  const isAuthenticated = !!session && !isSessionExpired(session);

  const refreshProfile = useCallback(async () => {
    if (!session?.userId || !isAuthenticated) {
      setProfile(null);
      return null;
    }

    const response = await accountsApi.users.profile.getInfo(session.userId);
    const nextProfile = unwrapAccountPayload(response);
    setProfile(nextProfile || null);
    return nextProfile || null;
  }, [isAuthenticated, session?.userId]);

  useEffect(() => {
    let cancelled = false;

    if (!session?.userId || !isAuthenticated) {
      setProfile(null);
      return () => {
        cancelled = true;
      };
    }

    accountsApi.users.profile.getInfo(session.userId)
      .then((response) => {
        if (!cancelled) setProfile(unwrapAccountPayload(response) || null);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, session?.userId]);

  const profilePictureUrl = getMediaPreviewUrl(
    profile?.profilePictureImage || profile?.profilePicture,
    "small"
  );

  const value = useMemo(
    () => ({
      ready,
      authState,
      session,
      isAuthenticated,
      role: isAuthenticated ? session?.role || "" : "",
      fullName: profile?.fullName || session?.fullName || "",
      username: session?.username || "",
      profile,
      profilePictureUrl,
      stores: session?.shopIds || [],
      selectedStoreId: session?.selectedStoreId ?? null,
      selectedMallId: session?.selectedMallId ?? null,
      isAdmin: isAuthenticated && session?.role === ROLE_ADMIN,
      isShopOwner: isAuthenticated && session?.role === ROLE_SHOP_OWNER,
      isCustomer: isAuthenticated && session?.role === ROLE_CUSTOMER,
      login,
      logout,
      selectStore,
      refreshProfile,
      getDefaultHome: () => getHomePathForRole(isAuthenticated ? session?.role || "" : ""),
    }),
    [authState, isAuthenticated, login, logout, profile, profilePictureUrl, ready, refreshProfile, selectStore, session]
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
