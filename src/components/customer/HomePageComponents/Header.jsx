import React from "react";
import { FiShoppingCart } from "react-icons/fi";
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
      
      <div className="max-w-400 2xl:max-w-[1920px] mx-auto px-6 md:px-12 py-4 md:py-5">
        <div className="flex items-center justify-between gap-6">
          
          {/* Logo */}
          <button
            className="shrink-0 cursor-pointer bg-transparent border-0 outline-none p-0"
            onClick={() => navigate("/")}
          >
            <div className="flex flex-col items-end leading-none gap-0.5">
              <span className="text-2xl md:text-3xl font-black tracking-tight text-black">سوقنا</span>
              <span className="text-[9px] md:text-[10px] tracking-[0.35em] text-black/40 uppercase font-light self-stretch text-right">e-mall</span>
            </div>
          </button>

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
              <span className="hidden md:block text-[10px] uppercase tracking-widest text-black/70 font-medium group-hover:text-black transition-colors">
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
              <span className="hidden md:block text-[10px] uppercase tracking-widest text-black/70 font-medium group-hover:text-black transition-colors">
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
              <span className="hidden md:block text-[10px] uppercase tracking-widest text-black/70 font-medium group-hover:text-black transition-colors">
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