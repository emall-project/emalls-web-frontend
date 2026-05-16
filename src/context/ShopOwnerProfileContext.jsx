import { createContext, useContext, useState } from "react";

const STORAGE_KEY = "so_profile_photo";

const Ctx = createContext({ photoUrl: "", setPhotoUrl: () => {} });

export function ShopOwnerProfileProvider({ children }) {
  const [photoUrl, setPhotoUrlState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ""
  );

  function setPhotoUrl(url) {
    const clean = url || "";
    setPhotoUrlState(clean);
    // Only persist real URLs (not blob: preview URLs — they expire on reload)
    if (clean && !clean.startsWith("blob:")) {
      localStorage.setItem(STORAGE_KEY, clean);
    } else if (!clean) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return <Ctx.Provider value={{ photoUrl, setPhotoUrl }}>{children}</Ctx.Provider>;
}

export const useShopOwnerProfile = () => useContext(Ctx);
