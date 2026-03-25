import { FiSun, FiMoon, FiBell, FiSettings, FiLogOut } from "react-icons/fi";

export function AdminTopbar({ appearance, onToggleTheme }) {
  const isDark = appearance === "dark";

  return (
    <header
      className="sticky top-0 z-20 h-16 border-b"
      style={{ background: "var(--color-panel)", borderColor: "var(--gray-a6)" }}
    >
      <div className="h-full px-6 flex items-center justify-end gap-2">
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
        <button className="p-2 rounded-lg" title="تسجيل الخروج">
          <FiLogOut />
        </button>
      </div>
    </header>
  );
}