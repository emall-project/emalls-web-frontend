import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  FiSun, FiMoon, FiLogOut, FiMenu, FiChevronDown, FiUser, FiEdit2, FiLock,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../api/auth";
import { useAdminProfile } from "../../../context/AdminProfileContext";

function getInitials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "A";
}

function IconBtn({ onClick, title, children, danger = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 outline-none ${className}`}
      style={{ color: danger ? "var(--red-9)" : "var(--gray-10)", background: "transparent" }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? "var(--red-a3)" : "var(--gray-a3)";
        e.currentTarget.style.color      = danger ? "var(--red-11)" : "var(--gray-12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color      = danger ? "var(--red-9)" : "var(--gray-10)";
      }}
    >
      {children}
    </button>
  );
}

export function AdminTopbar({ appearance, onToggleTheme, onMenuOpen }) {
  const isDark     = appearance === "dark";
  const user       = auth.getUser();
  const fullName   = user?.fullName || user?.username || "المشرف";
  const username   = user?.username || "";
  const initials   = getInitials(fullName);
  const container  = document.querySelector(".radix-themes") || document.body;
  const navigate   = useNavigate();
  const { photoUrl } = useAdminProfile();

  return (
    <header
      className="sticky top-0 z-30 h-16 border-b"
      style={{
        background:           isDark ? "rgba(12,12,12,0.82)" : "rgba(255,255,255,0.82)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor:          "var(--gray-a4)",
      }}
    >
      <div className="h-full px-5 flex items-center justify-between gap-3">

        {/* ── Left: mobile menu + theme toggle ── */}
        <div className="flex items-center gap-1">
          <IconBtn onClick={onMenuOpen} title="القائمة" className="lg:hidden">
            <FiMenu size={18} />
          </IconBtn>
          <IconBtn onClick={onToggleTheme} title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}>
            {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
          </IconBtn>
        </div>

        {/* ── Right: profile dropdown ── */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl transition-all duration-150 outline-none group"
              style={{ background: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--gray-a3)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {/* Name + username */}
              <div className="hidden sm:block text-right leading-none">
                <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                  {fullName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--gray-9)" }} dir="ltr">
                  @{username}
                </p>
              </div>

              {/* Avatar */}
              <div className="relative shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={fullName}
                    className="w-9 h-9 rounded-xl object-cover select-none"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white select-none"
                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
                  >
                    {initials}
                  </div>
                )}
                <span
                  className="absolute -bottom-1 -left-1 text-[9px] font-bold px-1.5 rounded-full leading-4 select-none"
                  style={{ background: "var(--purple-9)", color: "#fff" }}
                >
                  مشرف
                </span>
              </div>

              <FiChevronDown
                size={13}
                className="transition-transform duration-200 group-data-[state=open]:rotate-180"
                style={{ color: "var(--gray-9)" }}
              />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal container={container}>
            <DropdownMenu.Content
              align="start"
              sideOffset={10}
              className="z-9999 w-60 rounded-2xl border p-1.5 shadow-2xl"
              style={{
                background:  "var(--gray-2)",
                borderColor: "var(--gray-a5)",
                direction:   "rtl",
              }}
            >
              {/* User info — non-interactive */}
              <div
                className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
                style={{ background: "var(--gray-a2)" }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={fullName}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
                  >
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--gray-12)" }}>
                    {fullName}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--gray-9)" }} dir="ltr">
                    @{username}
                  </p>
                </div>
              </div>

              <DropdownMenu.Separator
                className="h-px my-1.5"
                style={{ background: "var(--gray-a4)" }}
              />

              {/* Profile navigation items */}
              <DropdownMenu.Item
                onSelect={() => navigate("/admin/account")}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer outline-none transition-colors duration-100"
                style={{ color: "var(--gray-11)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-a3)"; e.currentTarget.style.color = "var(--gray-12)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--gray-11)"; }}
              >
                <FiUser size={14} />
                الملف الشخصي
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => navigate("/admin/account", { state: { section: "edit" } })}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer outline-none transition-colors duration-100"
                style={{ color: "var(--gray-11)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-a3)"; e.currentTarget.style.color = "var(--gray-12)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--gray-11)"; }}
              >
                <FiEdit2 size={14} />
                تعديل البيانات
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => navigate("/admin/account", { state: { section: "password" } })}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer outline-none transition-colors duration-100"
                style={{ color: "var(--gray-11)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-a3)"; e.currentTarget.style.color = "var(--gray-12)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--gray-11)"; }}
              >
                <FiLock size={14} />
                تغيير كلمة المرور
              </DropdownMenu.Item>

              <DropdownMenu.Separator
                className="h-px my-1.5"
                style={{ background: "var(--gray-a4)" }}
              />

              {/* Logout */}
              <DropdownMenu.Item
                onSelect={() => auth.logout()}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer outline-none transition-colors duration-100"
                style={{ color: "var(--red-9)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--red-a3)"; e.currentTarget.style.color = "var(--red-11)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--red-9)"; }}
              >
                <FiLogOut size={14} />
                تسجيل الخروج
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

      </div>
    </header>
  );
}
