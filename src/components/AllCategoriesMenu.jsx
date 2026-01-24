import React, { useMemo, useState } from "react";
import { getParentCategories } from "../utils/tmpCategories";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { IoIosArrowDown } from "react-icons/io";

function AllCategoriesMenu({ categories, selectedCategoryId, onSelectCategory }) {
  const parents = categories;
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
          {/* Trigger */}
          <NavigationMenu.Trigger
            className="
                group flex w-full md:w-auto items-center justify-between gap-2
                rounded-xl px-3 py-1
                border border-gray-200 md:border-transparent
                bg-white md:bg-[#1A73E8]
                hover:bg-gray-50 md:hover:bg-[#E8F0FE]
                transition-colors cursor-pointer outline-none
            "
          >
            <span className="  font-extrabold text-xs md:text-sm
                                text-[#1A73E8] md:text-white
                                md:group-hover:text-[#1A73E8]
                                transition-colors">
              جميع الفئات
            </span>

            <IoIosArrowDown
              className="
                  text-[#1A73E8] md:text-white
                  md:group-hover:text-[#1A73E8]
                  transition-transform duration-150
                  group-data-[state=open]:rotate-180
              "
            />
          </NavigationMenu.Trigger>

          {/* Content */}
          <NavigationMenu.Content
            className="
              fixed inset-x-0 right-0  z-50
              max-h-[70vh] overflow-auto
              bg-white border border-gray-200
              rounded-t-2xl shadow-lg p-3
              md:absolute md:right-0 md:top-full md:mt-3
              md:bottom-auto md:inset-x-auto
              md:w-lvw md:max-w-[92vw]
              md:max-h-none md:overflow-visible
              md:rounded-2xl
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3  top-0 bg-white pb-2">
              <p className="font-extrabold text-gray-800">اختر فئة</p>

              <button
                type="button"
                className="text-sm font-semibold text-gray-500 hover:text-[#1A73E8]"
                onClick={() => {
                  onSelectCategory?.(null);
                  setValue("");
                }}
              >
                عرض كل المنتجات
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {parents.map((cat) => {
                const active = selectedCategoryId === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory?.(cat.id);
                      setValue("");
                    }}
                    className={[
                      "flex items-center gap-3 p-2 rounded-xl border text-right hover:bg-gray-50 transition",
                      active ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
                    ].join(" ")}
                  >
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                      loading="lazy"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{cat.name}</p>
                      <p className="text-xs text-gray-500 truncate">تصفّح منتجات هذه الفئة</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* موبایل: مساحة صغيرة تحت عشان السحب/اللمس */}
            <div className="h-2 md:hidden" />
          </NavigationMenu.Content>

        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

export default AllCategoriesMenu;
