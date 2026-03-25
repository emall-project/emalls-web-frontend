import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export function AdminLayout({ appearance, onToggleTheme }) {
  return (
    <div dir="rtl" className="min-h-screen">
      <AdminSidebar />
      <div className="lg:pr-64 min-h-screen flex flex-col">
        <AdminTopbar appearance={appearance} onToggleTheme={onToggleTheme} />

        <main className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}