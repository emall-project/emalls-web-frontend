import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FiSun, FiMoon, FiLogOut, FiMenu, FiChevronDown, FiUser, FiEdit2, FiLock } from "react-icons/fi";
import { auth } from "../../../api/auth";
import { ShopOwnerSidebar } from "./ShopOwnerSidebar";
import { ShopOwnerProfileProvider, useShopOwnerProfile } from "../../../context/ShopOwnerProfileContext";
import { ShopProvider, useShop } from "../../../context/ShopContext";

function getInitials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "S";
}

function IconBtn({ onClick, title, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 outline-none ${className}`}
      style={{ color: "var(--gray-10)", background: "transparent" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-a3)"; e.currentTarget.style.color = "var(--gray-12)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--gray-10)"; }}
    >
      {children}
    </button>
  );
}

function NavDropdownItem({ onSelect, icon: Icon, children, danger = false }) {
  const baseColor = danger ? "var(--red-9)" : "var(--gray-11)";
  const hoverBg   = danger ? "var(--red-a3)" : "var(--gray-a3)";
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer outline-none transition-colors duration-100"
      style={{ color: baseColor }}
      onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </DropdownMenu.Item>
  );
}

// Shared avatar element — shows photo if available, otherwise initials gradient
function UserAvatar({ photoUrl, initials, size = "sm" }) {
  const dim   = size === "sm" ? "w-9 h-9 text-sm" : "w-10 h-10 text-sm";
  const hasPhoto = Boolean(photoUrl);
  return (
    <div
      className={`${dim} rounded-xl overflow-hidden flex items-center justify-center font-bold text-white select-none shrink-0`}
      style={{ background: hasPhoto ? undefined : "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)" }}
    >
      {hasPhoto
        ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        : initials}
    </div>
  );
}

function ShopOwnerTopbar({ appearance, onToggleTheme, onMenuOpen }) {
  const isDark    = appearance === "dark";
  const navigate  = useNavigate();
  const user      = auth.getUser();
  const fullName  = user?.fullName || user?.username || "صاحب المتجر";
  const username  = user?.username || "";
  const initials  = getInitials(fullName);
  const container = document.querySelector(".radix-themes") || document.body;

  const { photoUrl } = useShopOwnerProfile();
  const { activeShopId, shops } = useShop();
  const activeShop = shops.find((s) => String(s.shopId) === String(activeShopId));
  const shopLabel = activeShop?.name || (activeShopId ? `متجر #${activeShopId}` : `@${username}`);

  return (
    <header
      className="sticky top-0 z-30 h-16 border-b"
      style={{
        background:           isDark ? "rgba(12,12,12,0.82)" : "rgba(255,255,255,0.82)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor:          "var(--gray-a4)",
      }}
    >
      <div className="h-full px-5 flex items-center justify-between gap-3">

        {/* ── Left: mobile menu + theme toggle ── */}
        <div className="flex items-center gap-1">
          <IconBtn onClick={onMenuOpen} title="القائمة" className="lg:hidden">
            <FiMenu size={18} />
          </IconBtn>
          <IconBtn onClick={onToggleTheme} title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}>
            {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
          </IconBtn>
        </div>

        {/* ── Right: profile dropdown ── */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl transition-all duration-150 outline-none group"
              style={{ background: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--gray-a3)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div className="hidden sm:block text-right leading-none">
                <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                  {fullName}
                </p>
                <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: "var(--gray-9)" }}>
                  {shopLabel}
                </p>
              </div>

              <div className="relative shrink-0">
                <UserAvatar photoUrl={photoUrl} initials={initials} size="sm" />
                <span
                  className="absolute -bottom-1 -left-1 text-[9px] font-bold px-1.5 rounded-full leading-4 select-none"
                  style={{ background: "var(--blue-9)", color: "#fff" }}
                >
                  متجر
                </span>
              </div>

              <FiChevronDown
                size={13}
                className="transition-transform duration-200 group-data-[state=open]:rotate-180"
                style={{ color: "var(--gray-9)" }}
              />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal container={container}>
            <DropdownMenu.Content
              align="start"
              sideOffset={10}
              className="z-9999 w-64 rounded-2xl border p-1.5 shadow-2xl"
              style={{
                background:  "var(--gray-2)",
                borderColor: "var(--gray-a5)",
                direction:   "rtl",
              }}
            >
              {/* User info header */}
              <div
                className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
                style={{ background: "var(--gray-a2)" }}
              >
                <UserAvatar photoUrl={photoUrl} initials={initials} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--gray-12)" }}>
                    {fullName}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--gray-9)" }}>
                    {shopLabel}
                  </p>
                </div>
              </div>

              <DropdownMenu.Separator className="h-px my-1.5" style={{ background: "var(--gray-a4)" }} />

              <NavDropdownItem icon={FiUser}  onSelect={() => navigate("/shop-owner/account")}>
                الملف الشخصي
              </NavDropdownItem>
              <NavDropdownItem icon={FiEdit2} onSelect={() => navigate("/shop-owner/account")}>
                تعديل البيانات
              </NavDropdownItem>
              <NavDropdownItem icon={FiLock}  onSelect={() => navigate("/shop-owner/account")}>
                تغيير كلمة المرور
              </NavDropdownItem>

              <DropdownMenu.Separator className="h-px my-1.5" style={{ background: "var(--gray-a4)" }} />

              <NavDropdownItem icon={FiLogOut} onSelect={() => auth.logout("/shop-owner/login")} danger>
                تسجيل الخروج
              </NavDropdownItem>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

      </div>
    </header>
  );
}

export function ShopOwnerLayout({ appearance, onToggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed]   = useState(false);

  return (
    <ShopProvider>
    <ShopOwnerProfileProvider>
      <div dir="rtl" className="min-h-screen">

        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)}
          />
        )}

        <ShopOwnerSidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />

        <div className={[
          "min-h-screen flex flex-col transition-[padding-right] duration-300 ease-in-out overflow-x-hidden",
          collapsed ? "lg:pr-16" : "lg:pr-72",
        ].join(" ")}>
          <ShopOwnerTopbar
            appearance={appearance}
            onToggleTheme={onToggleTheme}
            onMenuOpen={() => setMobileOpen(true)}
          />
          <main className="flex-1 p-6">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>

      </div>
    </ShopOwnerProfileProvider>
    </ShopProvider>
  );
}
