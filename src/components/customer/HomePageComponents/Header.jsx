import React from "react";
import { useNavigate } from "react-router-dom";
import { FiHeart, FiShoppingBag, FiShoppingCart } from "react-icons/fi";
import { IoReceiptOutline } from "react-icons/io5";
import { PiUserCircleBold } from "react-icons/pi";

import HeaderSearch from "./HeaderSearch";
import { auth } from "../../../api/auth";
import { useCart } from "../../../context/CartContext";
import { useFavorites } from "../../../context/FavoritesContext";

function ActionButton({
  icon,
  badge,
  label,
  onClick,
  accent = false,
  hiddenOnMobile = false,
  compactOnMobile = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        hiddenOnMobile ? "hidden sm:flex" : "flex",
        compactOnMobile
          ? "group relative min-w-[52px] flex-col items-center justify-center gap-1 rounded-[18px] border px-2 py-2.5 text-center shadow-[var(--customer-shadow-soft)] sm:min-w-[72px] sm:rounded-[22px] sm:px-3"
          : "group relative min-w-[72px] flex-col items-center justify-center gap-1 rounded-[22px] border px-3 py-2.5 text-center shadow-[var(--customer-shadow-soft)]",
        accent
          ? "border-[rgba(27,79,240,0.16)] bg-[var(--customer-accent-soft)] text-[var(--customer-accent)]"
          : "border-[var(--customer-border)] bg-white/92 text-[var(--customer-muted)] hover:border-[rgba(27,79,240,0.16)] hover:text-[var(--customer-text)]",
      ].join(" ")}
    >
      <div className="relative text-[1.25rem]">
        {React.cloneElement(icon, { className: "transition-transform group-hover:scale-105" })}
        {badge > 0 ? (
          <span className="absolute -left-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--customer-deal)] px-1 text-[9px] font-extrabold text-white shadow-sm">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </div>
      <span className={compactOnMobile ? "hidden text-[11px] font-bold leading-none sm:inline" : "text-[11px] font-bold leading-none"}>
        {label}
      </span>
    </button>
  );
}

function AccountButton({ user, isCustomer, onClick }) {
  const displayName = user?.fullName || user?.username || "حسابي";
  const initial = displayName.trim()?.[0]?.toUpperCase?.() || "U";

  if (!isCustomer) {
    return (
      <button type="button" onClick={onClick} className="customer-primary-btn rounded-[20px] px-3 sm:rounded-[22px] sm:px-5">
        <PiUserCircleBold className="text-[1.1rem]" />
        <span className="hidden sm:inline">تسجيل الدخول</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-[24px] border border-[var(--customer-border)] bg-white/94 px-3 py-2 shadow-[var(--customer-shadow-soft)] hover:border-[rgba(27,79,240,0.18)]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#2257F5_0%,#153CC7_100%)] text-sm font-black text-white shadow-[0_12px_24px_rgba(27,79,240,0.22)]">
        {initial}
      </div>
      <div className="hidden min-w-0 text-right md:block">
        <div className="max-w-[120px] truncate text-sm font-extrabold text-[var(--customer-text)]">
          {displayName}
        </div>
        <div className="mt-0.5 text-[11px] font-semibold text-[var(--customer-muted)]">
          إدارة الطلبات والحساب
        </div>
      </div>
    </button>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const user = auth.getUser();
  const isCustomer = user?.role === "ROLE_CUSTOMER";
  const { totalItems } = useCart();
  const { favCount } = useFavorites();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--customer-border)] bg-[rgba(248,249,253,0.92)] backdrop-blur-xl">
      <div className="customer-shell px-4 py-3 sm:px-6 md:px-10">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
          <div className="order-3 shrink-0 md:order-1">
            <button type="button" onClick={() => navigate("/")} className="flex items-center gap-3 text-right">
              <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#2257F5_0%,#153CC7_100%)] text-white shadow-[0_18px_40px_rgba(27,79,240,0.24)]">
                <FiShoppingBag className="text-[1.4rem]" />
              </div>
              <div className="hidden sm:block leading-none">
                <div className="text-[1.75rem] font-black tracking-tight text-[var(--customer-text)]">سوقنا</div>
                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.36em] text-[var(--customer-muted-soft)]">
                  E-MALL MARKETPLACE
                </div>
              </div>
            </button>
          </div>

          <div className="order-1 min-w-0 flex-1 md:order-2">
            <HeaderSearch />
          </div>

          <div className="order-2 flex shrink-0 items-center gap-1.5 sm:gap-2 md:order-3">
            <ActionButton
              icon={<FiHeart />}
              badge={favCount}
              label="المفضلة"
              onClick={() => navigate(isCustomer ? "/favorites" : "/customer/login")}
              hiddenOnMobile
            />
            <ActionButton
              icon={<IoReceiptOutline />}
              label="طلباتي"
              onClick={() => navigate(isCustomer ? "/orders" : "/customer/login")}
              hiddenOnMobile
            />
            <ActionButton
              icon={<FiShoppingCart />}
              badge={totalItems}
              label="السلة"
              onClick={() => navigate("/cart")}
              accent
              compactOnMobile
            />
            <AccountButton
              user={user}
              isCustomer={isCustomer}
              onClick={() => navigate(isCustomer ? "/customer/profile" : "/customer/login")}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
