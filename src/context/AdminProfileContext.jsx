import { createContext, useContext, useState } from "react";

const STORAGE_KEY = "admin_profile_photo";
const Ctx = createContext({ photoUrl: "", setPhotoUrl: () => {} });

export function AdminProfileProvider({ children }) {
  const [photoUrl, setPhotoUrlState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ""
  );

  function setPhotoUrl(url) {
    const clean = url || "";
    setPhotoUrlState(clean);
    if (clean && !clean.startsWith("blob:")) {
      localStorage.setItem(STORAGE_KEY, clean);
    } else if (!clean) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return <Ctx.Provider value={{ photoUrl, setPhotoUrl }}>{children}</Ctx.Provider>;
}

export const useAdminProfile = () => useContext(Ctx);
