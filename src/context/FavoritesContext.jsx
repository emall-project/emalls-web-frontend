import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { auth } from "../api/auth";
import { engagementApi } from "../api/engagementApi";

const FavCtx = createContext({
  favSet: new Set(),
  favCount: 0,
  isFav: () => false,
  toggleFav: async () => {},
  refreshFavorites: async () => {},
});

export function FavoritesProvider({ children }) {
  const location = useLocation();
  const [favSet, setFavSet] = useState(new Set());

  const load = useCallback(async () => {
    const user = auth.getUser();
    if (!user || user.role !== "ROLE_CUSTOMER") {
      setFavSet(new Set());
      return;
    }

    try {
      const list = await engagementApi.getFavoritesList();
      setFavSet(new Set((list ?? []).map((favorite) => String(favorite.productId))));
    } catch {
      setFavSet(new Set());
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, location.pathname]);

  const isFav = useCallback((productId) => favSet.has(String(productId)), [favSet]);

  const toggleFav = useCallback(async (productId) => {
    const productKey = String(productId);
    const wasFavorite = favSet.has(productKey);

    if (wasFavorite) {
      setFavSet((prev) => {
        const next = new Set(prev);
        next.delete(productKey);
        return next;
      });

      try {
        await engagementApi.removeFavoriteByProductId(productId);
      } catch (error) {
        setFavSet((prev) => new Set([...prev, productKey]));
        throw error;
      }
      return;
    }

    setFavSet((prev) => new Set([...prev, productKey]));
    try {
      await engagementApi.addFavorite(productId);
    } catch (error) {
      setFavSet((prev) => {
        const next = new Set(prev);
        next.delete(productKey);
        return next;
      });
      throw error;
    }
  }, [favSet]);

  return (
    <FavCtx.Provider
      value={{
        favSet,
        favCount: favSet.size,
        isFav,
        toggleFav,
        refreshFavorites: load,
      }}
    >
      {children}
    </FavCtx.Provider>
  );
}

export const useFavorites = () => useContext(FavCtx);
