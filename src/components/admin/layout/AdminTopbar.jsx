import { FiSun, FiMoon, FiBell, FiSettings, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";

export function AdminTopbar({ appearance, onToggleTheme }) {
  const isDark = appearance === "dark";
  const navigate = useNavigate();
  const { fullName, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header
      className="sticky top-0 z-20 h-16 border-b"
      style={{ background: "var(--color-panel)", borderColor: "var(--gray-a6)" }}
    >
      <div className="h-full px-6 flex items-center justify-end gap-2">
        <div className="ml-auto text-right">
          <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
            {fullName || "مستخدم إداري"}
          </div>
          <div className="text-xs" style={{ color: "var(--gray-10)" }}>
            إدارة النظام
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg transition"
          title="تبديل الوضع"
          style={{ background: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-a3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {isDark ? <FiSun /> : <FiMoon />}
        </button>

        <button className="p-2 rounded-lg" title="الإشعارات">
          <FiBell />
        </button>
        <button className="p-2 rounded-lg" title="الإعدادات">
          <FiSettings />
        </button>
        <button className="p-2 rounded-lg" title="تسجيل الخروج" onClick={handleLogout}>
          <FiLogOut />
        </button>
      </div>
    </header>
  );
}
