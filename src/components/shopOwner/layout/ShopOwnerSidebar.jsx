import { NavLink } from "react-router-dom";
import {
  FiGrid, FiShoppingBag, FiPackage, FiRotateCcw,
  FiTag, FiDollarSign, FiGift, FiCreditCard, FiFolder, FiClipboard, FiX,
} from "react-icons/fi";
import { useAuth } from "../../../auth/AuthContext";

const baseLink = "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition";

function OwnerLink({ to, icon, label, end }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) => [baseLink, isActive ? "font-medium" : ""].join(" ")}
      style={({ isActive }) => ({ background: isActive ? "var(--blue-a3)" : "transparent", color: isActive ? "var(--blue-11)" : "var(--gray-12)" })}
      onMouseEnter={(e) => { if (e.currentTarget.getAttribute("aria-current") !== "page") e.currentTarget.style.background = "var(--gray-a3)"; }}
      onMouseLeave={(e) => { if (e.currentTarget.getAttribute("aria-current") !== "page") e.currentTarget.style.background = "transparent"; }}
    >
      <span className="text-lg" style={{ color: "var(--gray-11)" }}>{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

export function ShopOwnerSidebar({ open, onClose }) {
  const sidebarClass = open ? "translate-x-0" : "translate-x-full lg:translate-x-0";
  const { fullName, profilePictureUrl, selectedStoreId } = useAuth();

  return (
    <>
      <aside className={["fixed z-50 lg:z-10 inset-y-0 right-0 w-64 transition-transform duration-300 border-l", sidebarClass].join(" ")}
        style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>

        {/* Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b" style={{ borderColor: "var(--gray-a6)" }}>
          <div className="text-2xl font-bold tracking-wide bg-gradient-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            سوقنا
          </div>
          <button className="lg:hidden p-2 rounded-lg transition" onClick={onClose}
            style={{ background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-a3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <FiX />
          </button>
        </div>

        {/* Role label */}
        <div className="px-4 py-2 border-b" style={{ borderColor: "var(--gray-a5)" }}>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
            صاحب المتجر
          </span>
        </div>

        {/* Links */}
        <nav className="px-3 py-4 space-y-1">
          <OwnerLink to="/shop-owner"           icon={<FiGrid />}       label="لوحة التحكم"        end />
          <OwnerLink to="/shop-owner/profile"   icon={<FiShoppingBag />} label="ملف المتجر"             />
          <OwnerLink to="/shop-owner/products"  icon={<FiPackage />}    label="المنتجات"               />
          <OwnerLink to="/shop-owner/shop-requests" icon={<FiClipboard />} label="طلب متجر جديد"       />
          <OwnerLink to="/shop-owner/files"     icon={<FiFolder />}     label="إدارة الملفات"          />
          <OwnerLink to="/shop-owner/orders"    icon={<FiPackage />}    label="الطلبات"                />
          <OwnerLink to="/shop-owner/returns"   icon={<FiRotateCcw />}  label="الإرجاعات"              />
          <OwnerLink to="/shop-owner/ads"       icon={<FiTag />}        label="الإعلانات"              />
          <OwnerLink to="/shop-owner/finance"   icon={<FiDollarSign />} label="المستحقات المالية"      />
          <OwnerLink to="/shop-owner/offers"    icon={<FiGift />}       label="العروض"                 />
          <OwnerLink to="/shop-owner/subscription" icon={<FiCreditCard />} label="الاشتراك"            />
        </nav>

        {/* User card */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
          <div className="flex items-center gap-3">
            {profilePictureUrl ? (
              <img src={profilePictureUrl} alt={fullName || "صاحب المتجر"} className="h-10 w-10 rounded-full object-cover ring-1 ring-black/10" />
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ background: "var(--blue-9)", color: "#fff" }}>
                SO
              </div>
            )}
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                {fullName || "صاحب المتجر"}
              </div>
              <div className="text-xs" style={{ color: "var(--gray-11)" }}>
                {selectedStoreId ? `متجر #${selectedStoreId}` : "لا يوجد متجر نشط"}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
