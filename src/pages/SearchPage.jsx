import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoArrowForward, IoSearchOutline, IoStorefrontOutline, IoCartOutline, IoBusinessOutline } from "react-icons/io5";

import rawMalls from "../assets/malls.json";
import rawStores from "../assets/stores.json";
import rawProducts from "../assets/products.json";

import { buildSearchIndex, searchInIndex } from "../utils/searchUtils";

function useQueryParam(name) {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(name) || "", [search, name]);
}

export default function SearchPage() {
  const navigate = useNavigate();
  const q = useQueryParam("q");

  const searchIndex = useMemo(
    () => buildSearchIndex({ rawMalls, rawStores, rawProducts }),
    []
  );

  const results = useMemo(
    () => searchInIndex(q, searchIndex, { limit: 80 }),
    [q, searchIndex]
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="text-right flex-1">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
              نتائج البحث
            </h1>
            <div className="flex items-center gap-2 text-lg">
              {q ? (
                <>
                  <span className="text-gray-600 font-semibold">البحث عن:</span>
                  <span className="text-[#1A73E8] font-black bg-[#E8F0FE] px-4 py-1 rounded-full">
                    "{q}"
                  </span>
                </>
              ) : (
                <span className="text-gray-500 font-semibold">اكتب كلمة للبحث</span>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="h-12 px-6 rounded-full bg-white border-2 border-gray-200 hover:border-[#1A73E8] hover:bg-[#E8F0FE] font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <IoArrowForward className="text-xl" />
            <span>رجوع</span>
          </button>
        </div>

        {/* Count Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <CountCard 
            label="المولات" 
            count={results.malls.length}
            icon={<IoBusinessOutline className="text-3xl" />}
            color="blue"
          />
          <CountCard 
            label="المتاجر" 
            count={results.stores.length}
            icon={<IoStorefrontOutline className="text-3xl" />}
            color="green"
          />
          <CountCard 
            label="المنتجات" 
            count={results.products.length}
            icon={<IoCartOutline className="text-3xl" />}
            color="purple"
          />
        </div>

        {/* Empty States */}
        {q.trim().length < 2 ? (
          <div className="mt-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#E8F0FE] to-[#C2D9F5] flex items-center justify-center">
              <IoSearchOutline className="text-5xl text-[#1A73E8]" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">ابدأ البحث</h3>
            <p className="text-gray-600 font-semibold">
              اكتب حرفين على الأقل لعرض النتائج
            </p>
          </div>
        ) : results.all.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <IoSearchOutline className="text-5xl text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">لا توجد نتائج</h3>
            <p className="text-gray-600 font-semibold mb-4">
              لم نجد أي نتائج مطابقة لـ "{q}"
            </p>
            <p className="text-gray-500 text-sm">
              جرب كلمات بحث مختلفة أو تحقق من الإملاء
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResultsSection
              title="المولات"
              items={results.malls}
              onPick={(item) => navigate(item.href)}
              icon={<IoBusinessOutline className="text-xl" />}
            />
            <ResultsSection
              title="المتاجر"
              items={results.stores}
              onPick={(item) => navigate(item.href)}
              icon={<IoStorefrontOutline className="text-xl" />}
            />
            <div className="lg:col-span-2">
              <ResultsSection
                title="المنتجات"
                items={results.products}
                onPick={(item) => navigate(item.href)}
                icon={<IoCartOutline className="text-xl" />}
                grid
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CountCard({ label, count, icon, color = "blue" }) {
  const colors = {
    blue: {
      bg: "from-blue-50 to-blue-100",
      icon: "text-[#1A73E8]",
      border: "border-blue-200"
    },
    green: {
      bg: "from-green-50 to-green-100",
      icon: "text-green-600",
      border: "border-green-200"
    },
    purple: {
      bg: "from-purple-50 to-purple-100",
      icon: "text-purple-600",
      border: "border-purple-200"
    }
  };

  const colorScheme = colors[color];

  return (
    <div className={`bg-gradient-to-br ${colorScheme.bg} border-2 ${colorScheme.border} rounded-3xl p-6 text-right shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`${colorScheme.icon}`}>{icon}</div>
        <div className="text-sm text-gray-700 font-bold">{label}</div>
      </div>
      <div className="text-4xl font-black text-gray-900">{count}</div>
    </div>
  );
}

function ResultsSection({ title, items, onPick, icon, grid = false }) {
  if (!items?.length) return null;

  return (
    <section className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-gradient-to-br from-[#E8F0FE] to-[#C2D9F5] p-2 rounded-xl text-[#1A73E8]">
          {icon}
        </div>
        <h2 className="text-2xl font-black text-gray-900">{title}</h2>
        <span className="mr-auto bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
          {items.length}
        </span>
      </div>

      <div className={grid 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
        : "space-y-3"
      }>
        {items.map((item) => (
          <button
            key={`${item.type}-${item.id}`}
            onClick={() => onPick(item)}
            className="
              w-full
              text-right
              rounded-2xl
              border-2 border-gray-100
              hover:border-[#1A73E8]
              hover:bg-[#E8F0FE]/30
              transition-all
              p-4
              flex items-center gap-4
              group
              shadow-sm hover:shadow-md
            "
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8F0FE] to-[#C2D9F5] overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-[#1A73E8] font-black text-xl">
                  {item.title?.[0] || "?"}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-bold text-gray-900 truncate group-hover:text-[#1A73E8] transition-colors">
                {item.title}
              </div>
              {item.subtitle ? (
                <div className="text-sm text-gray-500 font-medium truncate mt-1">
                  {item.subtitle}
                </div>
              ) : null}
            </div>

            {/* Arrow */}
            <div className="text-gray-300 group-hover:text-[#1A73E8] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}