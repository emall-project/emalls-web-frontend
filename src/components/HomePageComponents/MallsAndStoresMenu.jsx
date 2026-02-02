import React, { useEffect, useMemo, useState } from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { IoIosArrowDown } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { getMallStores } from "../../utils/tmpMallsAndStores";

function MallsAndStoresMenu({
  malls = [],
  stores = [],
  selectedMallId,
  selectedStoreId,
  onSelectStore,
  onSelectMall,
}) {
  const navigate = useNavigate();

  // Radix menu value (open/close)
  const [value, setValue] = useState("");

  // Desktop: hovered/active mall to show its stores
  const [hoveredMallId, setHoveredMallId] = useState(
    selectedMallId || (malls[0]?.id ?? null)
  );

  // Mobile: accordion open mall
  const [expandedMallId, setExpandedMallId] = useState(
    selectedMallId || (malls[0]?.id ?? null)
  );

  // keep states in sync with selection
  useEffect(() => {
    if (selectedMallId) {
      setHoveredMallId(selectedMallId);
      setExpandedMallId(selectedMallId);
    } else {
      // if nothing selected, keep reasonable defaults
      setHoveredMallId((prev) => prev ?? (malls[0]?.id ?? null));
      setExpandedMallId((prev) => prev ?? (malls[0]?.id ?? null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMallId, malls.length]);

  // stores for hovered mall (desktop)
  const storesOfHoveredMall = useMemo(() => {
    if (!hoveredMallId) return [];
    return getMallStores(stores, hoveredMallId);
  }, [stores, hoveredMallId]);

  const toggleMall = (mallId) => {
    setExpandedMallId((prev) => (prev === mallId ? null : mallId));
  };

  const goToMall = (mallId) => {
    onSelectMall?.(mallId);
    onSelectStore?.(null);
    navigate(`/malls/${mallId}`);
    setValue(""); // close menu
  };

  const goToStore = (mallId, storeId) => {
    onSelectMall?.(mallId);
    onSelectStore?.(storeId);
    navigate(`/stores/${storeId}`);
    setValue(""); // close menu
  };

  return (
    <NavigationMenu.Root
      dir="rtl"
      value={value}
      onValueChange={setValue}
      className="relative"
    >
      <NavigationMenu.List className="flex items-center">
        <NavigationMenu.Item value="malls" className="relative">
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
            <span
              className="
                font-extrabold text-xs md:text-sm
                text-[#1A73E8] md:text-white
                md:group-hover:text-[#1A73E8]
                transition-colors
              "
            >
              المولات والمتاجر
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
              fixed inset-x-0 right-0 z-50
              bg-white border border-gray-200
              rounded-t-2xl shadow-lg overflow-hidden
              max-h-[80vh]
              md:absolute md:left-0 md:top-full md:mt-3
              md:bottom-auto md:inset-x-auto
              md:w-lvw md:max-w-[92vw]
              md:rounded-2xl md:max-h-none
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-b-gray-200 sticky top-0 bg-white z-10">
              <p className="font-extrabold text-gray-800">اختر مول أو متجر</p>

              <button
                type="button"
                className="text-sm font-semibold text-gray-500 hover:text-[#1A73E8]"
                onClick={() => {
                  onSelectMall?.(null);
                  onSelectStore?.(null);
                  setValue("");
                }}
              >
                عرض الكل
              </button>
            </div>

            {/* ===================== Desktop Layout ===================== */}
            <div className="hidden md:flex h-[420px]">
              {/* malls list */}
              <aside className="w-64 shrink-0 border-l border-l-gray-200 bg-white">
                <div className="h-full overflow-auto p-2 space-y-1">
                  {malls.map((m) => {
                    const isHover = hoveredMallId === m.id;
                    const isSelected = selectedMallId === m.id && !selectedStoreId;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onMouseEnter={() => setHoveredMallId(m.id)}
                        onClick={() => goToMall(m.id)} 
                        className={[
                          "w-full text-right px-3 py-2 rounded-xl border transition",
                          isHover || isSelected
                            ? "border-[#1A73E8] bg-blue-50 text-[#1A73E8]"
                            : "border-transparent hover:bg-gray-50 text-gray-800",
                        ].join(" ")}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* stores grid */}
              <section className="flex-1 bg-gray-50">
                <div className="h-full overflow-auto p-3">
                  {!hoveredMallId ? (
                    <p className="text-gray-600">اختاري مول من القائمة.</p>
                  ) : storesOfHoveredMall.length === 0 ? (
                    <p className="text-gray-600">لا توجد متاجر لهذا المول.</p>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {storesOfHoveredMall.map((s) => {
                        const active = selectedStoreId === s.id;

                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => goToStore(hoveredMallId, s.id)} // ✅ open store page
                            className={[
                              "flex items-center gap-3 p-2 rounded-xl border bg-white hover:bg-gray-50 transition text-right",
                              active ? "border-[#1A73E8] bg-blue-50" : "border-gray-200",
                            ].join(" ")}
                          >
                            <img
                              src={s.logoUrl}
                              alt={s.name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                              onError={(e) =>
                                (e.currentTarget.src = "https://via.placeholder.com/40")
                              }
                            />

                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                              <p className="text-xs text-gray-500 truncate">اضغط لفتح صفحة المتجر</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ===================== Mobile Layout ===================== */}
            <div className="md:hidden bg-gray-50" dir="rtl">
              <div className="p-3 space-y-2 max-h-[70vh] overflow-auto">
                {malls.map((m) => {
                  const storesForMall = getMallStores(stores, m.id);
                  const isOpen = expandedMallId === m.id;
                  const isMallSelected = selectedMallId === m.id && !selectedStoreId;

                  return (
                    <div
                      key={m.id}
                      className={[
                        "rounded-2xl border bg-white shadow-sm overflow-hidden",
                        isMallSelected ? "border-[#1A73E8]" : "border-gray-200",
                      ].join(" ")}
                    >
                      {/* mall row */}
                      <div className="flex items-center justify-between gap-2 p-3">
                        {/* mall name -> open mall page */}
                        <button
                          type="button"
                          onClick={() => goToMall(m.id)}
                          className="min-w-0 text-right"
                        >
                          <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {storesForMall.length} متجر
                          </p>
                        </button>

                        {/* expand/collapse stores */}
                        <button
                          type="button"
                          onClick={() => toggleMall(m.id)}
                          className="h-9 w-9 rounded-full border border-gray-200 grid place-items-center hover:bg-gray-50 transition"
                          aria-label="toggle stores"
                        >
                          <IoIosArrowDown
                            className={[
                              "text-gray-700 transition-transform",
                              isOpen ? "rotate-180" : "rotate-0",
                            ].join(" ")}
                          />
                        </button>
                      </div>

                      {/* stores list */}
                      {isOpen && (
                        <div className="px-3 pb-3">
                          {storesForMall.length === 0 ? (
                            <p className="text-sm text-gray-600">لا توجد متاجر لهذا المول.</p>
                          ) : (
                            <div className="mt-2 space-y-2">
                              {storesForMall.map((s) => {
                                const active = selectedStoreId === s.id;

                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => goToStore(m.id, s.id)}
                                    className={[
                                      "w-full flex items-center gap-3 p-2 rounded-xl border bg-white hover:bg-gray-50 transition text-right",
                                      active
                                        ? "border-[#1A73E8] bg-blue-50"
                                        : "border-gray-200",
                                    ].join(" ")}
                                  >
                                    <img
                                      src={s.logoUrl}
                                      alt={s.name}
                                      className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0"
                                      onError={(e) =>
                                        (e.currentTarget.src = "https://via.placeholder.com/44")
                                      }
                                    />

                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                                      <p className="text-xs text-gray-500 truncate">
                                        اضغطي لفتح صفحة المتجر
                                      </p>
                                    </div>

                                    <span className="text-xs font-semibold text-[#1A73E8] shrink-0">
                                      فتح
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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

export default MallsAndStoresMenu;
