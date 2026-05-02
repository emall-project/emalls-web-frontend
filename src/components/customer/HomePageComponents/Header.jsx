import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiShoppingCart } from "react-icons/fi";
import { GrFavorite } from "react-icons/gr";
import { VscAccount } from "react-icons/vsc";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth/AuthContext";
import { getHomePathForRole } from "../../../auth/session";
import { useCart } from "../../../cart/CartContext";
import { catalogApi, unwrapCatalogPayload } from "../../../api/catalog";
import CartDrawer from "../commerce/CartDrawer";
import HeaderSearch from "./HeaderSearch";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef(null);
  const { ready, isAuthenticated, role, isCustomer, fullName, profilePictureUrl } = useAuth();
  const { totalCartQuantity } = useCart();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);

  useLayoutEffect(() => {
    const setHeaderHeight = () => {
      const height = headerRef.current?.offsetHeight || 72;
      document.documentElement.style.setProperty("--app-header-h", `${height}px`);
    };

    setHeaderHeight();
    window.addEventListener("resize", setHeaderHeight);
    return () => window.removeEventListener("resize", setHeaderHeight);
  }, []);

  const handleAccountClick = () => {
    if (!ready) {
      return;
    }

    if (isCustomer && isAuthenticated) {
      navigate("/account");
      return;
    }

    navigate(isAuthenticated ? getHomePathForRole(role) : "/login", {
      state: { from: location },
    });
  };

  const handleCartClick = () => {
    if (!ready) {
      return;
    }

    if (!isCustomer || !isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setCartOpen(true);
  };

  useEffect(() => {
    const handleFavoritesChanged = () => setFavoritesVersion((current) => current + 1);
    window.addEventListener("emall-favorites-changed", handleFavoritesChanged);
    return () => window.removeEventListener("emall-favorites-changed", handleFavoritesChanged);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!isAuthenticated || !isCustomer) {
      setFavoritesCount(0);
      return;
    }

    let cancelled = false;
    catalogApi.favorites.count()
      .then((response) => {
        if (!cancelled) setFavoritesCount(Number(unwrapCatalogPayload(response)?.count || 0));
      })
      .catch(() => {
        if (!cancelled) setFavoritesCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [favoritesVersion, isAuthenticated, isCustomer, ready]);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-white border-b border-black/10">
      {/* Top thin line - luxury accent */}
      <div className="h-px bg-black"></div>
      
      <div className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-3 md:py-5">
        <div className="flex items-center justify-between gap-3 sm:gap-5 md:gap-6">
          
          {/* Logo */}
          <button
            className="shrink-0 cursor-pointer bg-transparent border-0 outline-none p-0"
            onClick={() => navigate("/")}
          >
            <div className="flex flex-col items-end leading-none gap-0.5">
              <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-black">سوقنا</span>
              <span className="text-[9px] md:text-[10px] tracking-[0.35em] text-black/40 uppercase font-light self-stretch text-right">e-mall</span>
            </div>
          </button>

          {/* Search - Centered & Clean */}
          <div className="min-w-0 flex-1 max-w-2xl">
            <HeaderSearch />
          </div>

          {/* Actions - Minimalist Icons */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-5 md:gap-8">
            
            {/* Favorites */}
            <button
              aria-label="favorites"
              type="button"
              disabled={!ready}
              onClick={() =>
                navigate(isCustomer && isAuthenticated ? "/favorites" : "/login", {
                  state: { from: location },
                })
              }
              className="group relative flex flex-col items-center gap-1 transition-all duration-300"
            >
              <div className="relative">
                <GrFavorite className="text-black text-xl md:text-2xl transition-all duration-300 group-hover:scale-110" />
                {/* Subtle badge */}
                {isCustomer && favoritesCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 rounded-full bg-black px-1.5 text-center text-[10px] font-medium leading-4 text-white">
                    {favoritesCount}
                  </span>
                ) : null}
              </div>
              <span className="hidden md:block text-[10px] uppercase tracking-widest text-black/70 font-medium group-hover:text-black transition-colors">
                المفضلة
              </span>
            </button>

            {/* Cart */}
            <button
              aria-label="cart"
              type="button"
              onClick={handleCartClick}
              className="group relative flex flex-col items-center gap-1 transition-all duration-300"
            >
              <div className="relative">
                <FiShoppingCart className="text-black text-xl md:text-2xl transition-all duration-300 group-hover:scale-110" />
                {isCustomer && totalCartQuantity > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 rounded-full bg-black px-1.5 text-center text-[10px] font-medium leading-4 text-white">
                    {totalCartQuantity}
                  </span>
                ) : null}
              </div>
              <span className="hidden md:block text-[10px] uppercase tracking-widest text-black/70 font-medium group-hover:text-black transition-colors">
                السلة
              </span>
            </button>

            {/* Divider - Thin vertical line */}
            <div className="hidden md:block h-8 w-px bg-black/20"></div>

            {/* Account/Login */}
            <button
              type="button"
              onClick={handleAccountClick}
              className="group flex flex-col items-center gap-1 transition-all duration-300"
              title={isAuthenticated ? fullName || "الحساب" : "تسجيل الدخول"}
            >
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={fullName || "الحساب"}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-black/10 transition-all duration-300 group-hover:scale-110 md:h-8 md:w-8"
                />
              ) : (
                <VscAccount className="text-black text-xl md:text-2xl transition-all duration-300 group-hover:scale-110" />
              )}
              <span className="hidden md:block text-[10px] uppercase tracking-widest text-black/70 font-medium group-hover:text-black transition-colors">
                الحساب
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* Bottom subtle shadow */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/5 to-transparent"></div>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}

export default Header;
