import React, { useMemo, useState } from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { IoIosArrowDown } from "react-icons/io";
import { getMallStores } from "../utils/tmpMallsAndStores";

function MallsAndStoresMenu({
  malls = [],
  stores = [],
  selectedMallId,
  selectedStoreId,
  onSelectStore,
  onSelectMall,
}) {
  const [value, setValue] = useState("");
  const [hoveredMallId, setHoveredMallId] = useState(
    selectedMallId || (malls[0]?.id ?? null)
  );

  React.useEffect(() => {
    if (selectedMallId) setHoveredMallId(selectedMallId);
  }, [selectedMallId]);

  const storesOfHoveredMall = useMemo(() => {
    if (!hoveredMallId) return [];
    return getMallStores(stores, hoveredMallId);
  }, [stores, hoveredMallId]);

  return (
    <NavigationMenu.Root dir="rtl" value={value} onValueChange={setValue} className="relative">
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
            <span className="  font-extrabold text-xs md:text-sm
              text-[#1A73E8] md:text-white
              md:group-hover:text-[#1A73E8]
              transition-colors">
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
            max-h-[75vh]
            md:absolute md:left-0 md:top-full md:mt-3
            md:bottom-auto md:inset-x-auto
            md:w-lvw md:max-w-[95vw]
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

          {/* ✅ Desktop body: right malls + left stores */}
          <div className="hidden md:flex h-105">
            {/* malls list */}
            <aside className="w-60 shrink-0 border-l border-l-gray-200 bg-white">
              <div className="h-full overflow-auto p-2 space-y-1">
                {malls.map((m) => {
                  const isHover = hoveredMallId === m.id;
                  const isSelected = selectedMallId === m.id && !selectedStoreId;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onMouseEnter={() => setHoveredMallId(m.id)}
                      onClick={() => {
                        onSelectMall?.(m.id);
                        onSelectStore?.(null);
                      }}
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

            {/* stores grid with logos */}
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
                          onClick={() => {
                            onSelectMall?.(hoveredMallId);
                            onSelectStore?.(s.id);
                            setValue("");
                          }}
                          className={[
                            "flex items-center gap-3 p-2 rounded-xl border bg-white hover:bg-gray-50 transition text-right",
                            active ? "border-[#1A73E8] bg-blue-50" : "border-gray-200",
                          ].join(" ")}
                        >
                          <img
                            src={s.logoUrl}
                            alt={s.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/40")}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                            <p className="text-xs text-gray-500 truncate">اضغط لعرض منتجات المتجر</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/*malls tabs (horizontal) + stores list below */}
          <div className="md:hidden">
            {/* malls chips */}
            <div className="px-3 py-2 border-b bg-white">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {malls.map((m) => {
                  const activeMall = (selectedMallId || hoveredMallId) === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setHoveredMallId(m.id);     
                        onSelectMall?.(m.id);
                        onSelectStore?.(null);
                      }}
                      className={[
                        "h-9 px-3 rounded-full border whitespace-nowrap text-sm transition",
                        activeMall
                          ? "border-[#1A73E8] bg-blue-50 text-[#1A73E8] font-semibold"
                          : "border-gray-200 bg-white text-gray-700",
                      ].join(" ")}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* stores */}
            <div className="bg-gray-50 p-3 max-h-[60vh] overflow-auto">
              {!hoveredMallId ? (
                <p className="text-gray-600">اختاري مول من الأعلى.</p>
              ) : storesOfHoveredMall.length === 0 ? (
                <p className="text-gray-600">لا توجد متاجر لهذا المول.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {storesOfHoveredMall.map((s) => {
                    const active = selectedStoreId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          onSelectMall?.(hoveredMallId);
                          onSelectStore?.(s.id);
                          setValue("");
                        }}
                        className={[
                          "flex items-center gap-3 p-2 rounded-xl border bg-white hover:bg-gray-50 transition text-right",
                          active ? "border-[#1A73E8] bg-blue-50" : "border-gray-200",
                        ].join(" ")}
                      >
                        <img
                          src={s.logoUrl}
                          alt={s.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                          onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/40")}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                          <p className="text-xs text-gray-500 truncate">اضغط لعرض منتجات المتجر</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-2" />
          </div>
        </NavigationMenu.Content>

        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

export default MallsAndStoresMenu;
