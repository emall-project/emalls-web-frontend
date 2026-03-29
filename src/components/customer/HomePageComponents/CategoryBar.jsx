import React, { useMemo, useLayoutEffect, useRef } from "react";
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
  const mainCategories = useMemo(
    () => getParentCategories(categories),
    [categories]
  );

  const barRef = useRef(null);

  // ✅ يحفظ ارتفاع الـ CategoryBar
  useLayoutEffect(() => {
    const setH = () => {
      const h = barRef.current?.offsetHeight || 56;
      document.documentElement.style.setProperty("--app-catbar-h", `${h}px`);
    };
    setH();
    window.addEventListener("resize", setH);
    return () => window.removeEventListener("resize", setH);
  }, []);

  return (
    <section
      ref={barRef}
      className="
        sticky top-[73px] z-40
        bg-white
        border-b border-black/10
        supports-[backdrop-filter]:bg-white/95
        supports-[backdrop-filter]:backdrop-blur-md
      "
    >
      {/* Top thin accent line - matching header */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/5 to-transparent"></div>

      <div className="max-w-400 2xl:max-w-[1920px] mx-auto px-6 md:px-12 py-3 md:py-4 flex items-center gap-4 md:gap-8">
        {/* left: all categories */}
        <div className="shrink-0">
          <AllCategoriesMenu
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
          />
        </div>

        {/* center: main categories (scrollable on mobile + desktop) */}
        <div className="flex-1 min-w-0">
          <nav
            style={{ WebkitOverflowScrolling: "touch" }}
            className="
              no-scrollbar
              flex items-center
              gap-4 md:gap-8
              overflow-x-auto
              whitespace-nowrap
              scroll-smooth
              snap-x snap-mandatory
              px-1
              justify-around
            "
          >
            {mainCategories.map((cate) => {
              const active = String(selectedCategoryId) === String(cate.id);

              return (
                <button
                  key={cate.id}
                  type="button"
                  onClick={() => onSelectCategory?.(cate.id)}
                  className={[
                    "relative shrink-0 snap-start",
                    "px-1 py-2 text-[11px] tracking-widest uppercase transition-all duration-300 md:text-[15px]",
                    "whitespace-nowrap font-bold",
                    "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:transition-all after:duration-300",
                    active
                      ? "text-black after:bg-black"
                      : "text-black/70 hover:text-black after:bg-transparent hover:after:bg-black/30 hover:scale-105",
                  ].join(" ")}
                >
                  {cate.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* right: malls & stores */}
        <div className="shrink-0">
          {showMallStoreMenu && (
            <MallsAndStoresMenu
              malls={malls}
              stores={stores}
              selectedMallId={selectedMallId}
              selectedStoreId={selectedStoreId}
              onSelectMall={onSelectMall}
              onSelectStore={onSelectStore}
            />
          )}
        </div>
      </div>

      {/* Bottom subtle shadow - matching header */}
      <div className="h-px bg-gradient-to-r from-transparent via-black/5 to-transparent"></div>

      {/* hide scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
      `}</style>
    </section>
  );
}

export default CategoryBar;
