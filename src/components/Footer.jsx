import React from "react";
import { FiShoppingBag } from "react-icons/fi";
import { IoLogoInstagram } from "react-icons/io5";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { MdEmail, MdLocationOn } from "react-icons/md";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-gray-200 bg-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* top grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-[#E8F0FE] flex items-center justify-center">
                <FiShoppingBag className="text-[#1A73E8]" size={22} />
              </div>
              <div>
                <p className="font-extrabold text-[#1A73E8] text-lg">سوقَنا</p>
                <p className="text-xs text-gray-500">E-Malls</p>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-600 leading-6">
              منصّة تجمع منتجات المولات والمتاجر في مكان واحد لتجربة تسوّق أسرع وأسهل.
            </p>

            {/* socials */}
            <div className="mt-4 flex items-center gap-2">
              <a
                href="#"
                className="h-10 w-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                aria-label="Facebook"
              >
                <FaFacebookF className="text-gray-700" />
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                aria-label="Instagram"
              >
                <IoLogoInstagram className="text-gray-700" size={18} />
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="text-gray-700" size={18} />
              </a>
            </div>
          </div>

          {/* links 1 */}
          <div>
            <p className="font-extrabold text-gray-900">روابط سريعة</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-[#1A73E8]">
                  الرئيسية
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#1A73E8]">
                  جميع الفئات
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#1A73E8]">
                  العروض
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#1A73E8]">
                  المولات والمتاجر
                </a>
              </li>
            </ul>
          </div>

          {/* links 2 */}
          <div>
            <p className="font-extrabold text-gray-900">الدعم</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-[#1A73E8]">
                  الأسئلة الشائعة
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#1A73E8]">
                  سياسة الاسترجاع
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#1A73E8]">
                  الشروط والأحكام
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#1A73E8]">
                  تواصل معنا
                </a>
              </li>
            </ul>
          </div>

          {/* contact */}
          <div>
            <p className="font-extrabold text-gray-900">تواصل</p>

            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-start gap-2 text-gray-600">
                <MdLocationOn className="mt-0.5 text-gray-500" size={18} />
                <span>الخليل – فلسطين</span>
              </div>

              <a
                href="mailto:support@emalls.com"
                className="flex items-center gap-2 text-gray-600 hover:text-[#1A73E8]"
              >
                <MdEmail className="text-gray-500" size={18} />
                <span>support@emalls.com</span>
              </a>

              <div className="rounded-2xl bg-[#E8F0FE] p-3 border border-blue-100">
                <p className="text-xs text-gray-700 font-bold">اشترك</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    placeholder="بريدك الإلكتروني"
                    className="flex-1 h-10 rounded-xl bg-white border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <button className="h-10 px-4 rounded-xl bg-[#1A73E8] text-white font-extrabold hover:opacity-90">
                    إرسال
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {year} E-Malls. جميع الحقوق محفوظة.
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">طرق الدفع:</span>
            <div className="flex gap-2">
              <span className="h-8 px-3 rounded-xl border border-gray-200 text-xs text-gray-600 flex items-center">
                Cash
              </span>
              
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
