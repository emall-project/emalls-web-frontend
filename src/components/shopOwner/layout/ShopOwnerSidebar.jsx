import { NavLink } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiDollarSign,
  FiFolder,
  FiGift,
  FiGrid,
  FiPackage,
  FiPlusSquare,
  FiRotateCcw,
  FiShoppingBag,
  FiShoppingCart,
  FiTag,
  FiX,
} from "react-icons/fi";
import { auth } from "../../../api/auth";
import { useShop } from "../../../context/ShopContext";

const NAV_GROUPS = [
  {
    label: "الرئيسية",
    items: [{ to: "/shop-owner", icon: FiGrid, label: "لوحة التحكم", end: true }],
  },
  {
    label: "المتجر",
    items: [
      { to: "/shop-owner/profile", icon: FiShoppingBag, label: "ملف المتجر" },
      { to: "/shop-owner/products", icon: FiPackage,    label: "المنتجات" },
      { to: "/shop-owner/files",    icon: FiFolder,     label: "إدارة الملفات" },
      { to: "/shop-owner/orders",   icon: FiShoppingCart, label: "الطلبات" },
      { to: "/shop-owner/returns", icon: FiRotateCcw, label: "الإرجاعات" },
      { to: "/shop-owner/ads", icon: FiTag, label: "الإعلانات" },
    ],
  },
  {
    label: "طلبات",
    items: [
      { to: "/shop-owner/shop-requests", icon: FiPlusSquare, label: "طلب متجر جديد" },
    ],
  },
  {
    label: "المالية",
    items: [
      { to: "/shop-owner/finance", icon: FiDollarSign, label: "المستحقات المالية" },
      { to: "/shop-owner/offers", icon: FiGift, label: "العروض" },
      { to: "/shop-owner/subscription", icon: FiCreditCard, label: "الاشتراك" },
    ],
  },
];

function NavItem({ to, icon: Icon, label, end, collapsed }) {
  return (
    <div className="group relative">
      <NavLink
        to={to}
        end={end}
        className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-150 outline-none"
        style={({ isActive }) => ({
          background: isActive ? "rgba(37,99,235,0.12)" : "transparent",
          color: isActive ? "#2563eb" : "var(--gray-11)",
          fontWeight: isActive ? 700 : 500,
          borderRight: isActive ? "3px solid #2563eb" : "3px solid transparent",
        })}
        onMouseEnter={(event) => {
          if (event.currentTarget.getAttribute("aria-current") !== "page") {
            event.currentTarget.style.background = "var(--gray-a3)";
          }
        }}
        onMouseLeave={(event) => {
          if (event.currentTarget.getAttribute("aria-current") !== "page") {
            event.currentTarget.style.background = "transparent";
          }
        }}
      >
        {({ isActive }) => (
          <>
            <span
              className="flex shrink-0 items-center justify-center"
              style={{ color: isActive ? "#2563eb" : "var(--gray-9)", fontSize: 17 }}
            >
              <Icon />
            </span>
            <span
              className="truncate overflow-hidden transition-all duration-300"
              style={{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 160 }}
            >
              {label}
            </span>
          </>
        )}
      </NavLink>

      {collapsed ? (
        <span
          className="pointer-events-none absolute right-full top-1/2 z-50 mr-3 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap opacity-0 shadow-xl transition-opacity duration-150 select-none group-hover:opacity-100"
          style={{ background: "var(--gray-12)", color: "var(--gray-1)" }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

function ShopSwitcher({ collapsed }) {
  const { activeShopId, shops, switchShop } = useShop();
  const allShopsFromJwt = auth.getAllShops();

  // Only render when the owner actually has more than one shop
  if (allShopsFromJwt.length <= 1) return null;

  const activeShop = shops.find((s) => String(s.shopId) === String(activeShopId));
  const shopName = activeShop?.name || (activeShopId ? `متجر #${activeShopId}` : "المتجر الحالي");
  const mallName = activeShop?.mallName || "";

  const container = document.querySelector(".radix-themes") || document.body;

  return (
    <div className="shrink-0 border-t px-2 py-3" style={{ borderColor: "var(--gray-a4)" }}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 transition-all duration-150 outline-none"
            style={{ background: "var(--blue-a2)", color: "var(--blue-11)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--blue-a3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blue-a2)"; }}
            title={collapsed ? shopName : undefined}
          >
            {/* Shop icon / avatar */}
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black"
              style={{ background: "var(--blue-9)", color: "#fff" }}
            >
              {(shopName?.[0] || "م").toUpperCase()}
            </span>

            <span
              className="min-w-0 flex-1 overflow-hidden transition-all duration-300 text-right"
              style={{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 160 }}
            >
              <p className="truncate text-xs font-bold leading-tight" style={{ color: "var(--blue-11)" }}>
                {shopName}
              </p>
              {mallName ? (
                <p className="truncate text-[10px] leading-tight mt-0.5" style={{ color: "var(--blue-10)" }}>
                  {mallName}
                </p>
              ) : null}
            </span>

            <FiChevronDown
              size={13}
              className="shrink-0 transition-all duration-300"
              style={{ opacity: collapsed ? 0 : 1, color: "var(--blue-10)" }}
            />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal container={container}>
          <DropdownMenu.Content
            side="top"
            align="start"
            sideOffset={8}
            className="z-[9999] min-w-[220px] rounded-2xl border p-1.5 shadow-2xl"
            style={{ background: "var(--gray-2)", borderColor: "var(--gray-a5)", direction: "rtl" }}
          >
            <p
              className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--gray-9)" }}
            >
              اختر المتجر
            </p>

            {shops.length ? (
              shops.map((shop) => {
                const isActive = String(shop.shopId) === String(activeShopId);
                return (
                  <DropdownMenu.Item
                    key={shop.shopId}
                    onSelect={() => !isActive && switchShop(shop.shopId)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer outline-none transition-colors duration-100"
                    style={{
                      background: isActive ? "var(--blue-a2)" : "transparent",
                      color: isActive ? "var(--blue-11)" : "var(--gray-11)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "var(--gray-a3)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                      style={{
                        background: isActive ? "var(--blue-9)" : "var(--gray-a4)",
                        color: isActive ? "#fff" : "var(--gray-10)",
                      }}
                    >
                      {(shop.name?.[0] || "م").toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{shop.name}</p>
                      {shop.mallName ? (
                        <p className="truncate text-xs" style={{ color: "var(--gray-9)" }}>
                          {shop.mallName}
                        </p>
                      ) : null}
                    </div>
                    {isActive ? <FiCheck size={14} style={{ color: "var(--blue-9)", flexShrink: 0 }} /> : null}
                  </DropdownMenu.Item>
                );
              })
            ) : (
              // Fallback: show raw shop IDs from JWT while names are loading
              allShopsFromJwt.map(({ storeId }) => {
                const isActive = String(storeId) === String(activeShopId);
                return (
                  <DropdownMenu.Item
                    key={storeId}
                    onSelect={() => !isActive && switchShop(storeId)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer outline-none transition-colors duration-100"
                    style={{
                      background: isActive ? "var(--blue-a2)" : "transparent",
                      color: isActive ? "var(--blue-11)" : "var(--gray-11)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "var(--gray-a3)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                      style={{
                        background: isActive ? "var(--blue-9)" : "var(--gray-a4)",
                        color: isActive ? "#fff" : "var(--gray-10)",
                      }}
                    >
                      م
                    </span>
                    <p className="text-sm font-semibold">{`متجر #${storeId}`}</p>
                    {isActive ? <FiCheck size={14} style={{ color: "var(--blue-9)", flexShrink: 0 }} /> : null}
                  </DropdownMenu.Item>
                );
              })
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

export function ShopOwnerSidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }) {
  return (
    <aside
      className={[
        "fixed inset-y-0 right-0 z-50 flex flex-col border-l transition-all duration-300 ease-in-out lg:z-10",
        mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        collapsed ? "w-16" : "w-72",
      ].join(" ")}
      style={{ background: "var(--color-panel)", borderColor: "var(--gray-a4)" }}
    >
      <div
        className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-3"
        style={{ borderColor: "var(--gray-a4)" }}
      >
        <div
          className={`flex items-center overflow-hidden transition-all duration-300 ${
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          }`}
        >
          <span
            className="text-2xl font-black tracking-wide whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            سوقنا
          </span>
        </div>

        <button
          onClick={mobileOpen ? onClose : onToggleCollapse}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-150"
          style={{ color: "var(--gray-9)", background: "transparent" }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "var(--gray-a3)";
            event.currentTarget.style.color = "var(--gray-12)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "transparent";
            event.currentTarget.style.color = "var(--gray-9)";
          }}
          title={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
        >
          {mobileOpen ? (
            <FiX size={16} />
          ) : collapsed ? (
            <FiChevronLeft size={16} />
          ) : (
            <FiChevronRight size={16} />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-2 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div
              className="mb-1.5 overflow-hidden px-3 transition-all duration-300"
              style={{
                opacity: collapsed ? 0 : 1,
                maxHeight: collapsed ? 0 : 32,
                marginBottom: collapsed ? 0 : undefined,
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {group.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <ShopSwitcher collapsed={collapsed} />
    </aside>
  );
}
