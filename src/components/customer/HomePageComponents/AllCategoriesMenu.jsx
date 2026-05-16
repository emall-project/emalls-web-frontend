import React, { useState } from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { IoIosArrowDown } from "react-icons/io";
import { IoGridOutline, IoSparklesOutline } from "react-icons/io5";

function AllCategoriesMenu({ categories = [], selectedCategoryId, onSelectCategory }) {
  const [value, setValue] = useState("");

  return (
    <NavigationMenu.Root dir="rtl" value={value} onValueChange={setValue} className="relative">
      <NavigationMenu.List className="flex items-center">
        <NavigationMenu.Item value="all" className="relative">
          <NavigationMenu.Trigger className="customer-catbar-trigger group">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--customer-accent-soft)] text-[var(--customer-accent)]">
              <IoGridOutline className="text-base" />
            </span>
            <span className="text-sm font-black">جميع الفئات</span>
            <IoIosArrowDown className="text-[var(--customer-muted-soft)] transition-transform duration-150 group-data-[state=open]:rotate-180" />
          </NavigationMenu.Trigger>

          <NavigationMenu.Content className="customer-catbar-menu fixed inset-x-0 right-0 z-50 max-h-[72vh] overflow-auto p-4 md:absolute md:inset-x-auto md:right-0 md:left-auto md:top-full md:mt-3 md:w-[min(1020px,calc(100vw-32px))] md:max-h-[560px] md:rounded-[30px]">
            <div className="rounded-[26px] border border-[var(--customer-border)] bg-[linear-gradient(135deg,#ffffff_0%,#f7f8fd_55%,#eef4ff_100%)] p-5 shadow-[var(--customer-shadow-soft)]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--customer-border)] pb-4">
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(27,79,240,0.12)] bg-white/90 px-3 py-1 text-[11px] font-extrabold text-[var(--customer-accent)]">
                    <IoSparklesOutline className="text-xs" />
                    فئات التسوق
                  </div>
                  <h3 className="mt-3 text-xl font-black text-[var(--customer-text)]">استكشف جميع الفئات</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--customer-muted)]">
                    اختر الفئة المناسبة لتنتقل مباشرة إلى صفحة منتجاتها من مختلف المتاجر والمولات.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-[var(--customer-border)] bg-white/90 px-4 py-3 text-right shadow-[var(--customer-shadow-soft)]">
                    <p className="text-[11px] font-semibold text-[var(--customer-muted)]">عدد الفئات</p>
                    <p className="mt-1 text-lg font-black text-[var(--customer-text)]">{categories.length}</p>
                  </div>

                  <button
                    type="button"
                    className="customer-secondary-btn rounded-2xl px-4 text-sm"
                    onClick={() => {
                      onSelectCategory?.(null);
                      setValue("");
                    }}
                  >
                    عرض كل المنتجات
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {categories.map((category) => {
                  const active = String(selectedCategoryId) === String(category.id);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        onSelectCategory?.(category.id);
                        setValue("");
                      }}
                      className={`flex w-full items-center gap-4 rounded-[24px] px-4 py-4 text-right shadow-[var(--customer-shadow-soft)] transition ${
                        active
                          ? "border border-[rgba(15,109,255,0.18)] bg-[var(--customer-accent-soft)]"
                          : "border border-[var(--customer-border)] bg-white/94 hover:-translate-y-0.5 hover:border-[rgba(15,109,255,0.18)] hover:bg-white"
                      }`}
                    >
                      <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef3fb_100%)]">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-lg font-black text-[var(--customer-muted)]">
                            {category.name?.[0] || "؟"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[var(--customer-text)]">{category.name}</p>
                        <p className="mt-1 truncate text-xs leading-6 text-[var(--customer-muted)]">
                          افتح منتجات هذه الفئة مباشرة
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

export default AllCategoriesMenu;
