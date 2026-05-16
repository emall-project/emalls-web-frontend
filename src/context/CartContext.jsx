import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { cartApi } from "../api/cartApi";
import { auth } from "../api/auth";

const CartCtx = createContext({ totalItems: 0, refresh: async () => {} });

export function CartProvider({ children }) {
  const [totalItems, setTotalItems] = useState(0);

  const refresh = useCallback(async () => {
    const user = auth.getUser();
    if (!user || user.role !== "ROLE_CUSTOMER") {
      setTotalItems(0);
      return;
    }
    try {
      const carts = await cartApi.getActiveCarts();
      const total = Array.isArray(carts)
        ? carts.reduce(
            (sum, c) =>
              sum + (c.items ?? []).reduce((s, item) => s + (item.quantity ?? 1), 0),
            0
          )
        : 0;
      setTotalItems(total);
    } catch {
      setTotalItems(0);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <CartCtx.Provider value={{ totalItems, refresh }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
