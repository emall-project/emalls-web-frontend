import React from "react";
import { Link } from "react-router-dom";
import { FiShoppingBag } from "react-icons/fi";
import { IoLogoInstagram } from "react-icons/io5";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { MdEmail, MdLocationOn } from "react-icons/md";

const QUICK_LINKS = [
  { label: "الرئيسية", to: "/" },
  { label: "المفضلة", to: "/favorites" },
  { label: "السلة", to: "/cart" },
  { label: "طلباتي", to: "/orders" },
];

const SUPPORT_LINKS = [
  { label: "الأسئلة الشائعة", to: "/faq" },
  { label: "سياسة الاسترجاع", to: "/return-policy" },
  { label: "الشروط والأحكام", to: "/terms-and-conditions" },
  { label: "تواصل معنا", href: "mailto:support@emalls.ps" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="customer-shell mt-14 px-4 pb-8 sm:px-6 md:px-10 md:pb-10">
      <div className="customer-panel-strong overflow-hidden rounded-[32px]">
        <div className="grid gap-8 border-b border-[var(--customer-border)] p-6 md:grid-cols-[1.35fr_0.8fr_0.8fr_1fr] md:p-8 lg:p-10">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="customer-icon-chip">
                <FiShoppingBag className="text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-[var(--customer-text)]">
                  سوقنا
                </h3>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--customer-muted-soft)]">
                  E-MALL
                </p>
              </div>
            </div>

            <p className="max-w-md text-sm leading-8 text-[var(--customer-muted)]">
              تجربة تسوّق أوضح وأسرع تجمع المولات والمتاجر في مكان واحد، مع متابعة
              الطلبات والمفضلة والسلة بسهولة من أي شاشة.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {[
                { icon: <FaFacebookF className="text-sm" />, label: "Facebook" },
                { icon: <IoLogoInstagram className="text-base" />, label: "Instagram" },
                { icon: <FaWhatsapp className="text-base" />, label: "WhatsApp" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  aria-label={item.label}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--customer-border)] bg-[var(--customer-surface-muted)] text-[var(--customer-muted)] hover:-translate-y-0.5 hover:border-[rgba(15,109,255,0.18)] hover:text-[var(--customer-text)]"
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-extrabold text-[var(--customer-text)]">روابط سريعة</h4>
            <ul className="space-y-3 text-sm text-[var(--customer-muted)]">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-[var(--customer-text)]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-extrabold text-[var(--customer-text)]">الدعم</h4>
            <ul className="space-y-3 text-sm text-[var(--customer-muted)]">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link to={link.to} className="hover:text-[var(--customer-text)]">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="hover:text-[var(--customer-text)]">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-extrabold text-[var(--customer-text)]">تواصل</h4>
            <div className="space-y-3 text-sm text-[var(--customer-muted)]">
              <div className="flex items-start gap-2.5">
                <MdLocationOn className="mt-1 shrink-0 text-[var(--customer-muted-soft)]" size={17} />
                <span>الخليل - فلسطين</span>
              </div>
              <a
                href="mailto:support@emalls.ps"
                className="flex items-center gap-2.5 break-all hover:text-[var(--customer-text)]"
              >
                <MdEmail className="shrink-0 text-[var(--customer-muted-soft)]" size={17} />
                <span>support@emalls.ps</span>
              </a>
            </div>

            <div className="mt-6 rounded-[22px] border border-[var(--customer-border)] bg-[var(--customer-surface-muted)] p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--customer-muted-soft)]">
                اشترك في النشرة
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  className="h-11 flex-1 rounded-2xl border border-[var(--customer-border)] bg-white px-4 text-sm outline-none focus:border-[rgba(15,109,255,0.25)]"
                />
                <button type="button" className="customer-primary-btn rounded-2xl px-5">
                  اشتراك
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4 text-sm text-[var(--customer-muted)] md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {year} سوقنا. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--customer-muted-soft)]">
            <span>طرق الدفع</span>
            <span className="rounded-full border border-[var(--customer-border)] bg-[var(--customer-surface-muted)] px-3 py-1 text-[11px] text-[var(--customer-text)]">
              Cash
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
