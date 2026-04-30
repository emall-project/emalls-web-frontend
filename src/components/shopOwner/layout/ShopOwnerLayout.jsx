import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { ShopOwnerSidebar } from "./ShopOwnerSidebar";
import { FiSun, FiMoon, FiBell, FiMenu, FiLogOut } from "react-icons/fi";
import { useAuth } from "../../../auth/AuthContext";

function ShopOwnerTopbar({
  appearance,
  onToggleTheme,
  onMenuOpen,
  fullName,
  stores,
  selectedStoreId,
  onSelectStore,
  onLogout,
}) {
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

        <div className="mr-auto flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
              {fullName || "صاحب المتجر"}
            </div>
            <div className="text-xs" style={{ color: "var(--gray-10)" }}>
              {selectedStoreId ? `المتجر النشط #${selectedStoreId}` : "لا يوجد متجر نشط"}
            </div>
          </div>

          {stores.length > 0 ? (
            <select
              value={selectedStoreId ?? ""}
              onChange={(event) => onSelectStore(event.target.value)}
              className="hidden rounded-xl border px-3 py-2 text-xs outline-none sm:block"
              style={{
                background: "var(--gray-a2)",
                borderColor: "var(--gray-a6)",
                color: "var(--gray-12)",
              }}
            >
              {stores.map((store) => (
                <option key={store.storeId} value={store.storeId}>
                  {`متجر #${store.storeId}`}
                </option>
              ))}
            </select>
          ) : null}

          <div className="flex items-center gap-1">
          <button onClick={onToggleTheme} className="p-2 rounded-lg transition" title="تبديل الوضع"
            style={{ background: "transparent", color: "var(--gray-12)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-a3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            {isDark ? <FiSun /> : <FiMoon />}
          </button>
          <button className="p-2 rounded-lg" title="الإشعارات" style={{ color: "var(--gray-12)" }}>
            <FiBell />
          </button>
          <button className="p-2 rounded-lg" title="تسجيل الخروج" style={{ color: "var(--gray-12)" }} onClick={onLogout}>
            <FiLogOut />
          </button>
        </div>
        </div>
      </div>
    </header>
  );
}

export function ShopOwnerLayout({ appearance, onToggleTheme }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { fullName, stores, selectedStoreId, selectStore, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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
          fullName={fullName}
          stores={stores}
          selectedStoreId={selectedStoreId}
          onSelectStore={selectStore}
          onLogout={handleLogout}
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
