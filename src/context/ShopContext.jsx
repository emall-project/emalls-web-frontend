import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { auth } from "../api/auth";

const ShopCtx = createContext({
  activeShopId: null,
  shops: [],         // OwnedShopDto list from accounts API
  loading: false,
  switchShop: () => {},
});

export function ShopProvider({ children }) {
  const [activeShopId, setActiveShopId] = useState(() => auth.getShopId());
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);

  const allShopsFromJwt = auth.getAllShops();

  useEffect(() => {
    // Only need names when the owner has more than one shop
    if (allShopsFromJwt.length <= 1) return;

    setLoading(true);
    fetch("/accounts/api/dashboard/shop-owner", { headers: auth.getHeaders() })
      .then((r) => r.json())
      .catch(() => null)
      .then((json) => {
        const myShops = json?.data?.myShops ?? [];
        if (myShops.length) setShops(myShops);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchShop = useCallback((storeId) => {
    auth.setActiveShopId(storeId);
    setActiveShopId(Number(storeId));
    // Navigate to dashboard so all shop-scoped pages remount and re-read the new shopId
    window.location.href = "/shop-owner";
  }, []);

  return (
    <ShopCtx.Provider value={{ activeShopId, shops, loading, switchShop }}>
      {children}
    </ShopCtx.Provider>
  );
}

export const useShop = () => useContext(ShopCtx);
