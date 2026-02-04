import React from "react";
import { FiShoppingBag } from "react-icons/fi";
import { IoLogoInstagram } from "react-icons/io5";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { MdEmail, MdLocationOn } from "react-icons/md";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 md:mt-16 lg:mt-20 border-t border-black/10 bg-white" dir="rtl">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12 lg:py-16">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <FiShoppingBag className="text-black text-xl md:text-2xl" />
              <div className="text-xl md:text-2xl font-light tracking-wider text-black">
                سوقَنا
              </div>
            </div>

            <p className="mt-3 md:mt-4 text-xs md:text-sm font-light text-black/60 leading-relaxed">
              منصّة تجمع منتجات المولات والمتاجر في مكان واحد لتجربة تسوّق أسرع وأسهل.
            </p>

            {/* Socials - minimal square buttons */}
            <div className="mt-4 md:mt-6 flex items-center gap-2 md:gap-3">
              <a
                href="#"
                className="h-9 w-9 md:h-10 md:w-10 border border-black/10 flex items-center justify-center transition-all duration-300 hover:bg-black group"
                aria-label="Facebook"
              >
                <FaFacebookF className="text-black text-xs md:text-sm transition-colors group-hover:text-white" />
              </a>
              <a
                href="#"
                className="h-9 w-9 md:h-10 md:w-10 border border-black/10 flex items-center justify-center transition-all duration-300 hover:bg-black group"
                aria-label="Instagram"
              >
                <IoLogoInstagram className="text-black text-sm md:text-base transition-colors group-hover:text-white" />
              </a>
              <a
                href="#"
                className="h-9 w-9 md:h-10 md:w-10 border border-black/10 flex items-center justify-center transition-all duration-300 hover:bg-black group"
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="text-black text-sm md:text-base transition-colors group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h3 className="text-xs md:text-sm lg:text-base font-light tracking-wide text-black mb-3 md:mb-4">
              روابط سريعة
            </h3>
            <div className="h-px w-8 bg-black mb-3 md:mb-4"></div>
            <ul className="space-y-2 md:space-y-2.5 text-xs md:text-sm">
              <li>
                <a href="#" className="text-black/60 font-light hover:text-black transition-colors duration-300">
                  الرئيسية
                </a>
              </li>
              <li>
                <a href="#" className="text-black/60 font-light hover:text-black transition-colors duration-300">
                  جميع الفئات
                </a>
              </li>
              <li>
                <a href="#" className="text-black/60 font-light hover:text-black transition-colors duration-300">
                  العروض
                </a>
              </li>
              <li>
                <a href="#" className="text-black/60 font-light hover:text-black transition-colors duration-300">
                  المولات والمتاجر
                </a>
              </li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h3 className="text-xs md:text-sm lg:text-base font-light tracking-wide text-black mb-3 md:mb-4">
              الدعم
            </h3>
            <div className="h-px w-8 bg-black mb-3 md:mb-4"></div>
            <ul className="space-y-2 md:space-y-2.5 text-xs md:text-sm">
              <li>
                <a href="#" className="text-black/60 font-light hover:text-black transition-colors duration-300">
                  الأسئلة الشائعة
                </a>
              </li>
              <li>
                <a href="#" className="text-black/60 font-light hover:text-black transition-colors duration-300">
                  سياسة الاسترجاع
                </a>
              </li>
              <li>
                <a href="#" className="text-black/60 font-light hover:text-black transition-colors duration-300">
                  الشروط والأحكام
                </a>
              </li>
              <li>
                <a href="#" className="text-black/60 font-light hover:text-black transition-colors duration-300">
                  تواصل معنا
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs md:text-sm lg:text-base font-light tracking-wide text-black mb-3 md:mb-4">
              تواصل
            </h3>
            <div className="h-px w-8 bg-black mb-3 md:mb-4"></div>

            <div className="space-y-2.5 md:space-y-3 text-xs md:text-sm">
              <div className="flex items-start gap-2 md:gap-2.5 text-black/60 font-light">
                <MdLocationOn className="mt-0.5 text-black/40 flex-shrink-0" size={16} />
                <span>الخليل – فلسطين</span>
              </div>

              <a
                href="mailto:support@emalls.com"
                className="flex items-center gap-2 md:gap-2.5 text-black/60 font-light hover:text-black transition-colors duration-300 break-all"
              >
                <MdEmail className="text-black/40 flex-shrink-0" size={16} />
                <span>support@emalls.com</span>
              </a>

              {/* Newsletter - minimal */}
              <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-black/10">
                <p className="text-[9px] md:text-[10px] tracking-widest uppercase text-black/60 font-light mb-2 md:mb-3">
                  اشترك في النشرة
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="بريدك الإلكتروني"
                    className="flex-1 h-9 md:h-10 bg-white border border-black/10 px-3 text-xs md:text-sm font-light outline-none focus:border-black transition-colors"
                  />
                  <button className="h-9 md:h-10 px-3 md:px-4 bg-black text-white text-[9px] md:text-[10px] tracking-widest uppercase font-light hover:bg-black/90 transition-all duration-300 whitespace-nowrap">
                    إرسال
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 md:mt-12 lg:mt-16 pt-5 md:pt-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
          <p className="text-[10px] md:text-xs font-light text-black/50 tracking-wide text-center sm:text-right">
            © {year} E-Malls. جميع الحقوق محفوظة.
          </p>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-[9px] md:text-[10px] tracking-widest uppercase text-black/50 font-light">
              طرق الدفع:
            </span>
            <div className="flex gap-2">
              <span className="h-7 md:h-8 px-2 md:px-3 border border-black/10 text-[9px] md:text-[10px] tracking-wider uppercase text-black/60 font-light flex items-center">
                Cash
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
    </footer>
  );
}