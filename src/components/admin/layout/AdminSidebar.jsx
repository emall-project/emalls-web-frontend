import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiDollarSign,
  FiTag,
  FiFolder,
  FiClipboard,
  FiMapPin,
  FiShield,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../../auth/AuthContext";

const baseLink =
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition";

export function AdminSidebar({ open, onClose }) {
  const sidebarClass = open
    ? "translate-x-0"
    : "translate-x-full lg:translate-x-0";
  const { fullName, profilePictureUrl } = useAuth();

  return (
    <aside
      className={[
        "fixed z-50 lg:z-10 inset-y-0 right-0 w-64",
        "transition-transform duration-300",
        "border-l",
        sidebarClass,
      ].join(" ")}
      style={{
        background: "var(--color-panel)",
        borderColor: "var(--gray-a6)",
        color: "var(--gray-12)",
      }}
    >
      {/* logo area */}
      <div
        className="h-16 px-4 flex items-center justify-between border-b"
        style={{ borderColor: "var(--gray-a6)" }}
      >
        <div className="text-2xl font-bold tracking-wide bg-gradient-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          سوقنا
        </div>
        <button
          className="lg:hidden p-2 rounded-lg transition"
          onClick={onClose}
          aria-label="إغلاق القائمة"
          style={{ background: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-a3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <FiX />
        </button>
      </div>

      {/* links */}
      <nav className="px-3 py-4 space-y-1">
        <AdminLink to="/admin" icon={<FiGrid />} label="لوحة التحكم" end />
        <AdminLink to="/admin/malls" icon={<FiShoppingBag />} label="إدارة المولات" />
        <AdminLink to="/admin/shops" icon={<FiShoppingBag />} label="إدارة المتاجر" />
        <AdminLink to="/admin/shop-requests" icon={<FiClipboard />} label="طلبات المتاجر" />
        <AdminLink to="/admin/users" icon={<FiUsers />} label="إدارة المستخدمين" />
        <AdminLink to="/admin/cities" icon={<FiMapPin />} label="إدارة المدن" />
        <AdminLink to="/admin/roles" icon={<FiShield />} label="إدارة الأدوار" />
        <AdminLink to="/admin/catalog" icon={<FiPackage />} label="إدارة الكتالوج" end />
        <AdminLink to="/admin/catalog/products" icon={<FiShoppingBag />} label="منتجات الكتالوج" />
        <AdminLink to="/admin/catalog/comments" icon={<FiClipboard />} label="تعليقات المنتجات" />
        <AdminLink to="/admin/ads" icon={<FiTag />} label="إدارة الإعلانات" />
        <AdminLink to="/admin/files" icon={<FiFolder />} label="إدارة الملفات" />
        <AdminLink to="/admin/orders" icon={<FiPackage />} label="إدارة الطلبات" />
        <AdminLink to="/admin/finance" icon={<FiDollarSign />} label="الإدارة المالية" />
      </nav>

      {/* user card bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 border-t"
        style={{ borderColor: "var(--gray-a6)" }}
      >
        <div className="flex items-center gap-3">
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt={fullName || "مستخدم إدمن"} className="h-10 w-10 rounded-full object-cover ring-1 ring-black/10" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              AD
            </div>
          )}
          <div>
            <div className="text-sm font-semibold">{fullName || "مستخدم إدمن"}</div>
            <div className="text-xs" style={{ color: "var(--gray-11)" }}>
              مدير النظام
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AdminLink({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          baseLink,
          isActive ? "font-medium" : "",
        ].join(" ")
      }
      style={({ isActive }) => ({
        background: isActive ? "var(--gray-a4)" : "transparent",
        color: "var(--gray-12)",
      })}
      onMouseEnter={(e) => {
        // hover إذا مش active
        if (e.currentTarget.getAttribute("aria-current") !== "page") {
          e.currentTarget.style.background = "var(--gray-a3)";
        }
      }}
      onMouseLeave={(e) => {
        if (e.currentTarget.getAttribute("aria-current") !== "page") {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <span className="text-lg" style={{ color: "var(--gray-11)" }}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}
