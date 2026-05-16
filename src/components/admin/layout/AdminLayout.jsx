import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminProfileProvider } from "../../../context/AdminProfileContext";

export function AdminLayout({ appearance, onToggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed]   = useState(false);

  return (
    <AdminProfileProvider>
    <div dir="rtl" className="min-h-screen">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      <div className={[
        "min-h-screen flex flex-col transition-[padding-right] duration-300 ease-in-out",
        collapsed ? "lg:pr-16" : "lg:pr-64",
      ].join(" ")}>
        <AdminTopbar
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
    </AdminProfileProvider>
  );
}
