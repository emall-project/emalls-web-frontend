import { Link, NavLink } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";

import Header from "./HomePageComponents/Header";
import Footer from "./HomePageComponents/Footer";

const SUPPORT_NAV_LINKS = [
  { label: "الأسئلة الشائعة", to: "/faq" },
  { label: "سياسة الاسترجاع", to: "/return-policy" },
  { label: "الشروط والأحكام", to: "/terms-and-conditions" },
];

export default function SupportPageShell({ kicker, title, subtitle, icon, children }) {
  return (
    <div dir="rtl" className="customer-page min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 customer-shell px-4 py-8 sm:px-6 md:px-12">
        <div className="customer-page-header customer-panel-strong px-5 py-5 sm:px-6 mb-6">
          <div>
            <span className="customer-kicker">
              {icon}
              {kicker}
            </span>
            <h1 className="customer-page-title mt-3">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitle}</p>
          </div>

          <Link to="/" className="customer-secondary-btn shrink-0 mt-4 sm:mt-0">
            <IoArrowForward className="text-base" />
            الرئيسية
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {SUPPORT_NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {children}
      </main>

      <Footer />
    </div>
  );
}
