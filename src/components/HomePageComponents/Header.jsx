import React from "react";
import { Button } from "@radix-ui/themes";
import { FiShoppingBag, FiShoppingCart } from "react-icons/fi";
import { GrFavorite } from "react-icons/gr";
import { VscAccount } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";

import HeaderSearch from "./HeaderSearch";

function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/10">
      {/* Top thin line - luxury accent */}
      <div className="h-px bg-black"></div>
      
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-4 md:py-5">
        <div className="flex items-center justify-between gap-6">
          
          {/* Logo - Minimal & Elegant */}
          <Button
            className="group flex items-center gap-2.5 shrink-0 cursor-pointer bg-transparent hover:bg-black/5 rounded-none px-2 py-1 transition-all duration-300 border-0"
            onClick={() => navigate("/")}
          >
            <FiShoppingBag className="text-black text-2xl md:text-3xl transition-transform duration-300 group-hover:rotate-12" />
            <div className="text-2xl md:text-3xl font-light tracking-wider text-black">
              سوقَنا
            </div>
          </Button>

          {/* Search - Centered & Clean */}
          <div className="flex-1 max-w-2xl">
            <HeaderSearch />
          </div>

          {/* Actions - Minimalist Icons */}
          <div className="flex items-center gap-6 md:gap-8">
            
            {/* Favorites */}
            <button
              aria-label="favorites"
              className="group relative flex flex-col items-center gap-1 transition-all duration-300"
            >
              <div className="relative">
                <GrFavorite className="text-black text-xl md:text-2xl transition-all duration-300 group-hover:scale-110" />
                {/* Subtle badge */}
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
              <span className="hidden md:block text-[10px] uppercase tracking-widest text-black/70 font-light group-hover:text-black transition-colors">
                المفضلة
              </span>
            </button>

            {/* Cart */}
            <button
              aria-label="cart"
              className="group relative flex flex-col items-center gap-1 transition-all duration-300"
            >
              <div className="relative">
                <FiShoppingCart className="text-black text-xl md:text-2xl transition-all duration-300 group-hover:scale-110" />
                {/* Subtle badge */}
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  5
                </span>
              </div>
              <span className="hidden md:block text-[10px] uppercase tracking-widest text-black/70 font-light group-hover:text-black transition-colors">
                السلة
              </span>
            </button>

            {/* Divider - Thin vertical line */}
            <div className="hidden md:block h-8 w-px bg-black/20"></div>

            {/* Account/Login */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="group flex flex-col items-center gap-1 transition-all duration-300"
            >
              <VscAccount className="text-black text-xl md:text-2xl transition-all duration-300 group-hover:scale-110" />
              <span className="hidden md:block text-[10px] uppercase tracking-widest text-black/70 font-light group-hover:text-black transition-colors">
                الحساب
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* Bottom subtle shadow */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/5 to-transparent"></div>
    </header>
  );
}

export default Header;