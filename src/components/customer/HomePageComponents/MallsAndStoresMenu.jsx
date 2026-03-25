import React, { useEffect, useMemo, useState } from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { IoIosArrowDown } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { getMallStores } from "../../../utils/tmpMallsAndStores";

function MallsAndStoresMenu({
  malls = [],
  stores = [],
  selectedMallId,
  selectedStoreId,
  onSelectStore,
  onSelectMall,
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const [hoveredMallId, setHoveredMallId] = useState(
    selectedMallId || (malls[0]?.id ?? null)
  );

  const [expandedMallId, setExpandedMallId] = useState(
    selectedMallId || (malls[0]?.id ?? null)
  );

  useEffect(() => {
    if (selectedMallId) {
      setHoveredMallId(selectedMallId);
      setExpandedMallId(selectedMallId);
    } else {
      setHoveredMallId((prev) => prev ?? (malls[0]?.id ?? null));
      setExpandedMallId((prev) => prev ?? (malls[0]?.id ?? null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMallId, malls.length]);

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
    setValue("");
  };

  const goToStore = (mallId, storeId) => {
    onSelectMall?.(mallId);
    onSelectStore?.(storeId);
    navigate(`/stores/${storeId}`);
    setValue("");
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
          {/* Trigger (minimal underline) */}
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
              المولات والمتاجر
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

          {/* Content */}
          <NavigationMenu.Content
            className="
              fixed inset-x-0 right-0 z-50
              bg-white
              border border-black/10
              shadow-[0_8px_30px_rgba(0,0,0,0.12)]
              overflow-hidden
              max-h-[80vh]
              md:absolute md:left-0 md:top-full md:mt-3
              md:inset-x-auto
              md:w-[min(980px,calc(100vw-32px))]
              md:max-h-[560px]
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 bg-white sticky top-0 z-10">
              <p className="text-[10px] font-light text-black/60 tracking-[0.25em] uppercase">
                اختر مول أو متجر
              </p>

              <button
                type="button"
                className="text-black/70 font-light text-sm underline hover:no-underline transition"
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
            <div className="hidden md:flex h-[440px]">
              {/* malls list */}
              <aside className="w-72 shrink-0 border-l border-black/10 bg-white">
                <div className="h-full overflow-auto px-2 py-2">
                  {malls.map((m) => {
                    const isHover = String(hoveredMallId) === String(m.id);
                    const isSelected =
                      String(selectedMallId) === String(m.id) && !selectedStoreId;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onMouseEnter={() => setHoveredMallId(m.id)}
                        onClick={() => goToMall(m.id)}
                        className={[
                          "w-full text-right px-4 py-3 transition-colors",
                          "border-b border-black/5",
                          isHover || isSelected
                            ? "text-black bg-black/[0.02]"
                            : "text-black/70 hover:text-black hover:bg-black/[0.01]",
                        ].join(" ")}
                      >
                        <span className="font-light tracking-wide">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* stores grid */}
              <section className="flex-1 bg-white">
                <div className="h-full overflow-auto p-4">
                  {!hoveredMallId ? (
                    <p className="text-black/60 font-light text-sm">
                      اختاري مول من القائمة.
                    </p>
                  ) : storesOfHoveredMall.length === 0 ? (
                    <p className="text-black/60 font-light text-sm">
                      لا توجد متاجر لهذا المول.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {storesOfHoveredMall.map((s) => {
                        const active = String(selectedStoreId) === String(s.id);

                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => goToStore(hoveredMallId, s.id)}
                            className={[
                              "flex items-center gap-4 px-4 py-3 text-right",
                              "border border-black/10 bg-white",
                              "hover:bg-black/[0.02] transition-colors",
                              active ? "border-black/40" : "",
                            ].join(" ")}
                          >
                            <div className="w-12 h-12 bg-black/5 overflow-hidden shrink-0 flex items-center justify-center">
                              {s.logoUrl ? (
                                <img
                                  src={s.logoUrl}
                                  alt={s.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              ) : (
                                <span className="text-black/40 font-light text-lg ">
                                  {s.name?.[0] || "?"}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="font-light text-black truncate tracking-wide ">
                                {s.name}
                              </p>
                              <p className="text-xs text-black/50 font-light truncate mt-1 tracking-wide">
                                اضغط لفتح صفحة المتجر
                              </p>
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
            <div className="md:hidden bg-white" dir="rtl">
              <div className="p-3 space-y-3 max-h-[70vh] overflow-auto">
                {malls.map((m) => {
                  const storesForMall = getMallStores(stores, m.id);
                  const isOpen = String(expandedMallId) === String(m.id);
                  const isMallSelected =
                    String(selectedMallId) === String(m.id) && !selectedStoreId;

                  return (
                    <div
                      key={m.id}
                      className={[
                        "border border-black/10 bg-white overflow-hidden",
                        isMallSelected ? "border-black/40" : "",
                      ].join(" ")}
                    >
                      {/* mall row */}
                      <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-black/10">
                        <button
                          type="button"
                          onClick={() => goToMall(m.id)}
                          className="min-w-0 text-right"
                        >
                          <p className="font-light text-black truncate tracking-wide">
                            {m.name}
                          </p>
                          <p className="text-xs text-black/50 font-light mt-1 tracking-wide">
                            {storesForMall.length} متجر
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleMall(m.id)}
                          className="h-9 w-9 border border-black/10 grid place-items-center hover:bg-black/[0.02] transition"
                          aria-label="toggle stores"
                        >
                          <IoIosArrowDown
                            className={[
                              "text-black/60 transition-transform",
                              isOpen ? "rotate-180" : "rotate-0",
                            ].join(" ")}
                          />
                        </button>
                      </div>

                      {/* stores list */}
                      {isOpen && (
                        <div className="px-4 py-4">
                          {storesForMall.length === 0 ? (
                            <p className="text-sm text-black/60 font-light">
                              لا توجد متاجر لهذا المول.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {storesForMall.map((s) => {
                                const active = String(selectedStoreId) === String(s.id);

                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => goToStore(m.id, s.id)}
                                    className={[
                                      "w-full flex items-center gap-4 px-4 py-3 text-right",
                                      "border border-black/10 bg-white",
                                      "hover:bg-black/[0.02] transition-colors",
                                      active ? "border-black/40" : "",
                                    ].join(" ")}
                                  >
                                    <div className="w-12 h-12 bg-black/5 overflow-hidden shrink-0 flex items-center justify-center">
                                      {s.logoUrl ? (
                                        <img
                                          src={s.logoUrl}
                                          alt={s.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => (e.currentTarget.style.display = "none")}
                                        />
                                      ) : (
                                        <span className="text-black/40 font-light text-lg">
                                          {s.name?.[0] || "?"}
                                        </span>
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="font-light text-black truncate tracking-wide">
                                        {s.name}
                                      </p>
                                      <p className="text-xs text-black/50 font-light truncate mt-1 tracking-wide">
                                        اضغطي لفتح صفحة المتجر
                                      </p>
                                    </div>

                                    <span className="text-xs font-light text-black/50 shrink-0 tracking-wide">
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
