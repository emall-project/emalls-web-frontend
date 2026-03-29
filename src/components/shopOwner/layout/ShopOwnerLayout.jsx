import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ShopOwnerSidebar } from "./ShopOwnerSidebar";
import { FiSun, FiMoon, FiBell, FiMenu, FiLogOut } from "react-icons/fi";

function ShopOwnerTopbar({ appearance, onToggleTheme, onMenuOpen }) {
  const isDark = appearance === "dark";
  return (
    <header className="sticky top-0 z-20 h-16 border-b"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-2">
        {/* Mobile menu button */}
        <button onClick={onMenuOpen}
          className="lg:hidden p-2 rounded-lg transition"
          style={{ background: "transparent", color: "var(--gray-12)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-a3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <FiMenu size={20} />
        </button>

        <div className="flex items-center gap-1 mr-auto">
          <button onClick={onToggleTheme} className="p-2 rounded-lg transition" title="تبديل الوضع"
            style={{ background: "transparent", color: "var(--gray-12)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-a3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            {isDark ? <FiSun /> : <FiMoon />}
          </button>
          <button className="p-2 rounded-lg" title="الإشعارات" style={{ color: "var(--gray-12)" }}>
            <FiBell />
          </button>
          <button className="p-2 rounded-lg" title="تسجيل الخروج" style={{ color: "var(--gray-12)" }}>
            <FiLogOut />
          </button>
        </div>
      </div>
    </header>
  );
}

export function ShopOwnerLayout({ appearance, onToggleTheme }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div dir="rtl" className="min-h-screen">

      {/* Mobile overlay — sits between content and sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <ShopOwnerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pr-64 min-h-screen flex flex-col">
        <ShopOwnerTopbar
          appearance={appearance}
          onToggleTheme={onToggleTheme}
          onMenuOpen={() => setSidebarOpen(true)}
        />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
