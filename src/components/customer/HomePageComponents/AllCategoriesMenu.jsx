import React, { useState } from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { IoIosArrowDown } from "react-icons/io";

function AllCategoriesMenu({ categories = [], selectedCategoryId, onSelectCategory }) {
  const [value, setValue] = useState("");

  return (
    <NavigationMenu.Root
      dir="rtl"
      value={value}
      onValueChange={setValue}
      className="relative"
    >
      <NavigationMenu.List className="flex items-center">
        <NavigationMenu.Item value="all" className="relative">
          {/* Trigger (minimal underline style) */}
          <NavigationMenu.Trigger
            className="
              group flex items-center gap-2
              px-1 py-2
              border-b border-black/20
              text-black/80
              hover:text-black hover:border-black/50
              transition-colors
              outline-none
              data-[state=open]:text-black data-[state=open]:border-black
            "
          >
            <span className="tracking-wide text-xs  md:text-[15px] font-bold">
              جميع الفئات
            </span>

            <IoIosArrowDown
              className="
              
                text-black/50
                group-hover:text-black/70
                transition-transform duration-150
                group-data-[state=open]:rotate-180
              "
            />
          </NavigationMenu.Trigger>

          {/* Content (minimal panel) */}
          <NavigationMenu.Content
            className="
              fixed inset-x-0 right-0 z-50
              max-h-[70vh] overflow-auto
              bg-white
              border border-black/10
              shadow-[0_8px_30px_rgba(0,0,0,0.12)]
              p-4
              md:absolute md:right-0 md:top-full md:mt-3
              md:inset-x-auto
              md:w-[min(920px,calc(100vw-32px))]
              md:max-h-[520px]
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <p className="text-[10px] font-light text-black/60 tracking-[0.25em] uppercase">
                اختر فئة
              </p>

              <button
                type="button"
                className="text-black/70 font-light text-sm underline hover:no-underline transition"
                onClick={() => {
                  onSelectCategory?.(null);
                  setValue("");
                }}
              >
                عرض كل المنتجات
              </button>
            </div>

            {/* Grid */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const active = String(selectedCategoryId) === String(cat.id);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory?.(cat.id);
                      setValue("");
                    }}
                    className={[
                      "w-full text-right flex items-center gap-4",
                      "px-4 py-3",
                      "border border-black/10",
                      "hover:bg-black/[0.02] transition-colors",
                      active ? "border-black/40" : "",
                    ].join(" ")}
                  >
                    {/* image */}
                    <div className="w-12 h-12 bg-black/5 overflow-hidden shrink-0 flex items-center justify-center">
                      {(cat.imageSmallUrl || cat.imageUrl) ? (
                        <img
                          src={cat.imageSmallUrl || cat.imageUrl}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-black/40 font-light text-lg">
                          {cat.name?.[0] || "?"}
                        </span>
                      )}
                    </div>

                    {/* text */}
                    <div className="min-w-0 flex-1">
                      <p className="font-light text-black truncate tracking-wide">
                        {cat.name}
                      </p>
                      <p className="text-xs text-black/50 font-light truncate mt-1 tracking-wide">
                        تصفّح منتجات هذه الفئة
                      </p>
                    </div>

                    {/* minimal arrow */}
                    <div className="text-black/20">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="h-2 md:hidden" />
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

export default AllCategoriesMenu;
