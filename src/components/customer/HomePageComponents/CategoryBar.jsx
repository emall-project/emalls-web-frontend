import React, { useLayoutEffect, useMemo, useRef } from "react";

import AllCategoriesMenu from "./AllCategoriesMenu";
import MallsAndStoresMenu from "./MallsAndStoresMenu";
import { getParentCategories } from "../../../utils/tmpCategories";

function CategoryBar({
  categories,
  onSelectCategory,
  selectedCategoryId,
  malls,
  stores,
  selectedMallId,
  selectedStoreId,
  onSelectMall,
  onSelectStore,
  showMallStoreMenu = true,
}) {
  const mainCategories = useMemo(() => getParentCategories(categories), [categories]);
  const barRef = useRef(null);

  useLayoutEffect(() => {
    const setHeight = () => {
      const height = barRef.current?.offsetHeight || 72;
      document.documentElement.style.setProperty("--app-catbar-h", `${height}px`);
    };
    setHeight();
    window.addEventListener("resize", setHeight);
    return () => window.removeEventListener("resize", setHeight);
  }, []);

  return (
    <section ref={barRef} className="sticky z-40 bg-transparent" style={{ top: "var(--app-header-h)" }}>
      <div className="customer-shell px-4 py-3 sm:px-6 md:px-10">
        <div className="customer-catbar-surface flex flex-col gap-2.5 overflow-visible px-3 py-3 md:flex-row md:items-center md:gap-4 md:px-4">
          <div className={`${showMallStoreMenu ? "grid-cols-2" : "grid-cols-1"} order-1 grid w-full gap-2 md:contents`}>
            <div className="min-w-0 md:order-1 md:shrink-0">
              <AllCategoriesMenu
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={onSelectCategory}
                rootClassName="w-full md:w-auto"
                triggerClassName="w-full justify-between px-3 sm:px-4 md:w-auto"
              />
            </div>

            {showMallStoreMenu ? (
              <div className="min-w-0 md:order-3 md:shrink-0">
                <MallsAndStoresMenu
                  malls={malls}
                  stores={stores}
                  selectedMallId={selectedMallId}
                  selectedStoreId={selectedStoreId}
                  onSelectMall={onSelectMall}
                  onSelectStore={onSelectStore}
                  rootClassName="w-full md:w-auto"
                  triggerClassName="w-full justify-between px-3 sm:px-4 md:w-auto"
                />
              </div>
            ) : null}
          </div>

          <div className="order-2 min-w-0 w-full md:order-2 md:flex-1">
            <nav
              style={{ WebkitOverflowScrolling: "touch" }}
              className="flex items-center gap-2 overflow-x-auto px-1 whitespace-nowrap scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <button
                type="button"
                onClick={() => onSelectCategory?.(null)}
                data-active={selectedCategoryId == null}
                className="customer-catbar-chip shrink-0"
              >
                الكل
              </button>

              {mainCategories.map((category) => {
                const active = String(selectedCategoryId) === String(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelectCategory?.(category.id)}
                    data-active={active}
                    className="customer-catbar-chip shrink-0"
                    title={category.name}
                  >
                    <span className="max-w-[140px] truncate md:max-w-[172px]">{category.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CategoryBar;
