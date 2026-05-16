import { NavLink } from "react-router-dom";
import {
  FiGrid, FiUsers, FiShoppingBag, FiPackage,
  FiDollarSign, FiTag, FiX, FiMapPin, FiClipboard,
  FiChevronRight, FiChevronLeft, FiShield, FiFolder,
  FiLayers, FiMessageSquare,
} from "react-icons/fi";
import { auth } from "../../../api/auth";
import { useAdminProfile } from "../../../context/AdminProfileContext";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "A";
}

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "الرئيسية",
    items: [{ to: "/admin", icon: FiGrid, label: "لوحة التحكم", end: true }],
  },
  {
    label: "الإدارة",
    items: [
      { to: "/admin/malls",         icon: FiMapPin,      label: "إدارة المولات" },
      { to: "/admin/shops",         icon: FiShoppingBag, label: "إدارة المتاجر" },
      { to: "/admin/shop-requests", icon: FiClipboard,   label: "طلبات المتاجر" },
      { to: "/admin/users",         icon: FiUsers,       label: "إدارة المستخدمين" },
      { to: "/admin/cities",        icon: FiMapPin,      label: "إدارة المدن" },
      { to: "/admin/roles",         icon: FiShield,      label: "إدارة الأدوار" },
      { to: "/admin/ads",           icon: FiTag,         label: "إدارة الإعلانات" },
    ],
  },
  {
    label: "الكتالوج",
    items: [
      { to: "/admin/catalog",          icon: FiLayers,         label: "إدارة الكتالوج" },
      { to: "/admin/catalog/products", icon: FiPackage,        label: "منتجات الكتالوج" },
      { to: "/admin/catalog/comments", icon: FiMessageSquare,  label: "تعليقات المنتجات" },
    ],
  },
  {
    label: "العمليات",
    items: [
      { to: "/admin/orders",  icon: FiPackage,    label: "إدارة الطلبات" },
      { to: "/admin/finance", icon: FiDollarSign, label: "الإدارة المالية" },
      { to: "/admin/files",   icon: FiFolder,     label: "إدارة الملفات" },
    ],
  },
];

// ── Nav link ──────────────────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, end, collapsed }) {
  return (
    <div className="relative group">
      <NavLink
        to={to}
        end={end}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 outline-none"
        style={({ isActive }) => ({
          background:  isActive ? "rgba(124,58,237,0.15)" : "transparent",
          color:       isActive ? "#a78bfa"               : "var(--gray-10)",
          fontWeight:  isActive ? 600                     : 400,
          borderLeft:  isActive ? "2px solid #7c3aed"    : "2px solid transparent",
        })}
        onMouseEnter={e => {
          if (e.currentTarget.getAttribute("aria-current") !== "page")
            e.currentTarget.style.background = "var(--gray-a3)";
        }}
        onMouseLeave={e => {
          if (e.currentTarget.getAttribute("aria-current") !== "page")
            e.currentTarget.style.background = "transparent";
        }}
      >
        {({ isActive }) => (
          <>
            <span
              className="shrink-0 flex items-center justify-center"
              style={{ color: isActive ? "#a78bfa" : "var(--gray-9)", fontSize: 17 }}
            >
              <Icon />
            </span>
            <span
              className="truncate transition-all duration-300 overflow-hidden"
              style={{
                opacity:   collapsed ? 0   : 1,
                maxWidth:  collapsed ? 0   : 160,
                marginRight: collapsed ? 0 : undefined,
              }}
            >
              {label}
            </span>
          </>
        )}
      </NavLink>

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span
          className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl select-none"
          style={{ background: "var(--gray-12)", color: "var(--gray-1)" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function AdminSidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }) {
  const user       = auth.getUser();
  const fullName   = user?.fullName || user?.username || "المشرف";
  const username   = user?.username || "";
  const initials   = getInitials(fullName);
  const { photoUrl } = useAdminProfile();

  return (
    <aside
      className={[
        "fixed z-50 lg:z-10 inset-y-0 right-0 flex flex-col",
        "transition-all duration-300 ease-in-out border-l",
        mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        collapsed ? "w-16" : "w-64",
      ].join(" ")}
      style={{
        background:  "var(--color-panel)",
        borderColor: "var(--gray-a4)",
      }}
    >
      {/* ── Logo ── */}
      <div
        className="h-16 flex items-center justify-between shrink-0 border-b px-3"
        style={{ borderColor: "var(--gray-a4)" }}
      >
        <div
          className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
        >
          <span
            className="text-2xl font-black tracking-wide whitespace-nowrap"
            style={{
              background:            "linear-gradient(135deg, #7c3aed, #4f46e5)",
              WebkitBackgroundClip:  "text",
              WebkitTextFillColor:   "transparent",
            }}
          >
            سوقنا
          </span>
        </div>

        {/* Mobile close / desktop collapse toggle */}
        <button
          onClick={mobileOpen ? onClose : onToggleCollapse}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150 shrink-0"
          style={{ color: "var(--gray-9)", background: "transparent" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-a3)"; e.currentTarget.style.color = "var(--gray-12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--gray-9)"; }}
          title={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
        >
          {mobileOpen
            ? <FiX size={16} />
            : collapsed
              ? <FiChevronLeft size={16} />
              : <FiChevronRight size={16} />
          }
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {/* Group label — hidden when collapsed */}
            <div
              className="px-3 mb-1.5 transition-all duration-300 overflow-hidden"
              style={{
                opacity:  collapsed ? 0    : 1,
                maxHeight: collapsed ? 0   : 32,
                marginBottom: collapsed ? 0 : undefined,
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--gray-8)" }}>
                {group.label}
              </span>
            </div>

            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItem key={item.to} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User card ── */}
      <div
        className="shrink-0 p-3 border-t"
        style={{ borderColor: "var(--gray-a4)" }}
      >
        <div className="flex items-center gap-3 rounded-xl px-2 py-2"
          style={{ background: "var(--gray-a2)" }}>
          <div className="relative shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={fullName}
                className="w-8 h-8 rounded-xl object-cover select-none"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white select-none"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
              >
                {initials}
              </div>
            )}
            <span
              className="absolute -bottom-1 -left-1 text-[8px] font-bold px-1 rounded-full leading-[14px] select-none"
              style={{ background: "var(--purple-9)", color: "#fff" }}
            >
              مشرف
            </span>
          </div>

          <div
            className="min-w-0 flex-1 transition-all duration-300 overflow-hidden"
            style={{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 200 }}
          >
            <p className="text-xs font-semibold truncate leading-tight" style={{ color: "var(--gray-12)" }}>
              {fullName}
            </p>
            <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: "var(--gray-9)" }} dir="ltr">
              @{username}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
