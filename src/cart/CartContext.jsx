import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { orderHubApi, unwrapOrderHubPayload } from "../api/orderHub";

const CartContext = createContext(null);

function normalizeCart(cart) {
  return unwrapOrderHubPayload(cart) || cart || null;
}

export function CartProvider({ children }) {
  const { ready, isAuthenticated, isCustomer } = useAuth();
  const [activeCarts, setActiveCarts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setCartList = useCallback((next) => {
    setActiveCarts(Array.isArray(next) ? next.map(normalizeCart).filter(Boolean) : []);
  }, []);

  const refreshActiveCarts = useCallback(async () => {
    if (!ready || !isAuthenticated || !isCustomer) {
      setCartList([]);
      setError("");
      return [];
    }

    setLoading(true);
    setError("");

    try {
      const response = await orderHubApi.carts.getActive();
      const carts = unwrapOrderHubPayload(response) || [];
      setCartList(carts);
      return carts;
    } catch (requestError) {
      setCartList([]);
      setError(requestError.message || "تعذر تحميل السلة");
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isCustomer, ready, setCartList]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!isAuthenticated || !isCustomer) {
      setCartList([]);
      setError("");
      setLoading(false);
      return;
    }

    refreshActiveCarts().catch(() => {});
  }, [isAuthenticated, isCustomer, ready, refreshActiveCarts, setCartList]);

  const upsertCart = useCallback((cartPayload) => {
    const cart = normalizeCart(cartPayload);
    if (!cart?.mallId) {
      return cart;
    }

    setActiveCarts((current) => {
      const next = current.filter((item) => String(item.mallId) !== String(cart.mallId));
      const status = String(cart.status || "").toUpperCase();
      const hasItems = Array.isArray(cart.items) && cart.items.length > 0;

      if (status === "ACTIVE" || (!status && hasItems)) {
        next.push(cart);
      }

      next.sort((a, b) => Number(a.mallId || 0) - Number(b.mallId || 0));
      return next;
    });

    return cart;
  }, []);

  const removeMallCart = useCallback((mallId) => {
    setActiveCarts((current) => current.filter((item) => String(item.mallId) !== String(mallId)));
  }, []);

  const addItem = useCallback(async (body) => {
    const response = await orderHubApi.carts.addItem(body);
    return upsertCart(response);
  }, [upsertCart]);

  const getCartByMall = useCallback(async (mallId) => {
    const response = await orderHubApi.carts.getByMall(mallId);
    return upsertCart(response);
  }, [upsertCart]);

  const updateDelivery = useCallback(async (cartId, body) => {
    const response = await orderHubApi.carts.updateDelivery(cartId, body);
    return upsertCart(response);
  }, [upsertCart]);

  const updateQuantity = useCallback(async (cartItemId, body) => {
    const response = await orderHubApi.carts.updateQuantity(cartItemId, body);
    return upsertCart(response);
  }, [upsertCart]);

  const removeItem = useCallback(async (cartItemId) => {
    const response = await orderHubApi.carts.removeItem(cartItemId);
    const cart = normalizeCart(response);

    if (cart?.mallId) {
      const hasItems = Array.isArray(cart.items) && cart.items.length > 0;
      if (!hasItems) {
        removeMallCart(cart.mallId);
      } else {
        upsertCart(cart);
      }
    }

    return cart;
  }, [removeMallCart, upsertCart]);

  const clearMall = useCallback(async (mallId) => {
    const response = await orderHubApi.carts.clearMall(mallId);
    removeMallCart(mallId);
    return normalizeCart(response);
  }, [removeMallCart]);

  const cancelMall = useCallback(async (mallId) => {
    const response = await orderHubApi.carts.cancelMall(mallId);
    removeMallCart(mallId);
    return normalizeCart(response);
  }, [removeMallCart]);

  const checkout = useCallback(async (mallId, body) => {
    const response = await orderHubApi.carts.checkout(mallId, body);
    removeMallCart(mallId);
    return unwrapOrderHubPayload(response) || [];
  }, [removeMallCart]);

  const totalCartQuantity = useMemo(
    () =>
      activeCarts.reduce(
        (sum, cart) =>
          sum +
          (cart?.items || []).reduce((itemTotal, item) => itemTotal + Number(item?.quantity || 0), 0),
        0
      ),
    [activeCarts]
  );

  const value = useMemo(
    () => ({
      activeCarts,
      totalCartQuantity,
      loading,
      error,
      refreshActiveCarts,
      addItem,
      getCartByMall,
      updateDelivery,
      updateQuantity,
      removeItem,
      clearMall,
      cancelMall,
      checkout,
    }),
    [
      activeCarts,
      addItem,
      cancelMall,
      checkout,
      clearMall,
      error,
      getCartByMall,
      loading,
      refreshActiveCarts,
      removeItem,
      totalCartQuantity,
      updateDelivery,
      updateQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
