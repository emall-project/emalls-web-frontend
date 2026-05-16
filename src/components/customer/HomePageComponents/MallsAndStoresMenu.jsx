import React, { useEffect, useMemo, useState } from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { IoIosArrowDown } from "react-icons/io";
import {
  IoBusinessOutline,
  IoChevronBackOutline,
  IoCompassOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";

import { getMallStores } from "../../../utils/tmpMallsAndStores";

function MallsAndStoresMenu({
  malls = [],
  stores = [],
  selectedMallId,
  selectedStoreId,
  onSelectStore,
  onSelectMall,
  rootClassName = "",
  triggerClassName = "",
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [hoveredMallId, setHoveredMallId] = useState(selectedMallId || (malls[0]?.id ?? null));
  const [expandedMallId, setExpandedMallId] = useState(selectedMallId || (malls[0]?.id ?? null));

  useEffect(() => {
    if (selectedMallId) {
      setHoveredMallId(selectedMallId);
      setExpandedMallId(selectedMallId);
    } else {
      setHoveredMallId((prev) => prev ?? (malls[0]?.id ?? null));
      setExpandedMallId((prev) => prev ?? (malls[0]?.id ?? null));
    }
  }, [selectedMallId, malls]);

  const storesOfHoveredMall = useMemo(() => {
    if (!hoveredMallId) return [];
    return getMallStores(stores, hoveredMallId);
  }, [stores, hoveredMallId]);

  const totalStores = stores.length;

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
      className={["relative", rootClassName].filter(Boolean).join(" ")}
    >
      <NavigationMenu.List className="flex w-full items-center">
        <NavigationMenu.Item value="malls" className="relative w-full md:w-auto">
          <NavigationMenu.Trigger
            className={["customer-catbar-trigger group", triggerClassName].filter(Boolean).join(" ")}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--customer-accent-soft)] text-[var(--customer-accent)]">
              <IoBusinessOutline className="text-base" />
            </span>
            <span className="text-sm font-black">المولات والمتاجر</span>
            <IoIosArrowDown className="text-[var(--customer-muted-soft)] transition-transform duration-150 group-data-[state=open]:rotate-180" />
          </NavigationMenu.Trigger>

          <NavigationMenu.Content className="customer-catbar-menu fixed inset-x-0 right-0 z-50 max-h-[80vh] overflow-hidden md:absolute md:inset-x-auto md:left-0 md:right-auto md:top-full md:mt-3 md:w-[min(1040px,calc(100vw-32px))] md:max-h-[620px] md:rounded-[30px]">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#ffffff_0%,#f7f8fd_55%,#eef4ff_100%)] p-3 md:p-4">
              <div className="rounded-[24px] border border-[var(--customer-border)] bg-white/92 px-5 py-4 shadow-[var(--customer-shadow-soft)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(27,79,240,0.12)] bg-[var(--customer-accent-soft)] px-3 py-1 text-[11px] font-extrabold text-[var(--customer-accent)]">
                      <IoCompassOutline className="text-xs" />
                      وجهات التسوق
                    </div>
                    <h3 className="mt-3 text-xl font-black text-[var(--customer-text)]">استكشف المولات والمتاجر</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--customer-muted)]">
                      تنقّل بين المولات ثم افتح المتجر المناسب مباشرة من نفس القائمة.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl border border-[var(--customer-border)] bg-white px-4 py-3 text-right shadow-[var(--customer-shadow-soft)]">
                      <p className="text-[11px] font-semibold text-[var(--customer-muted)]">المولات</p>
                      <p className="mt-1 text-lg font-black text-[var(--customer-text)]">{malls.length}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--customer-border)] bg-white px-4 py-3 text-right shadow-[var(--customer-shadow-soft)]">
                      <p className="text-[11px] font-semibold text-[var(--customer-muted)]">المتاجر</p>
                      <p className="mt-1 text-lg font-black text-[var(--customer-text)]">{totalStores}</p>
                    </div>
                    <button
                      type="button"
                      className="customer-secondary-btn rounded-2xl px-4 text-sm"
                      onClick={() => {
                        onSelectMall?.(null);
                        onSelectStore?.(null);
                        setValue("");
                      }}
                    >
                      عرض الكل
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 hidden h-[470px] overflow-hidden rounded-[26px] border border-[var(--customer-border)] bg-white/95 shadow-[var(--customer-shadow-soft)] md:flex">
                <aside className="w-80 shrink-0 border-l border-[var(--customer-border)] bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.98))]">
                  <div className="h-full overflow-auto p-3">
                    {malls.map((mall) => {
                      const mallStores = getMallStores(stores, mall.id);
                      const isHover = String(hoveredMallId) === String(mall.id);
                      const isSelected = String(selectedMallId) === String(mall.id) && !selectedStoreId;

                      return (
                        <button
                          key={mall.id}
                          type="button"
                          onMouseEnter={() => setHoveredMallId(mall.id)}
                          onClick={() => goToMall(mall.id)}
                          className={`mb-2 w-full rounded-[22px] border px-4 py-4 text-right transition ${
                            isHover || isSelected
                              ? "border-[rgba(15,109,255,0.18)] bg-white text-[var(--customer-accent)] shadow-[var(--customer-shadow-soft)]"
                              : "border-transparent bg-transparent text-[var(--customer-muted)] hover:border-[var(--customer-border)] hover:bg-white hover:text-[var(--customer-text)]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 text-right">
                              <p className="truncate text-sm font-black">{mall.name}</p>
                              <p className="mt-1 truncate text-xs text-[var(--customer-muted)]">
                                {mallStores.length} متجر متاح
                              </p>
                            </div>
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--customer-surface-muted)] text-[var(--customer-muted)]">
                              {mall.logoUrl ? (
                                <img
                                  src={mall.logoUrl}
                                  alt={mall.name}
                                  className="h-full w-full rounded-2xl object-cover"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <IoBusinessOutline className="text-lg" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <section className="flex-1 bg-white">
                  <div className="h-full overflow-auto p-4">
                    {!hoveredMallId ? (
                      <p className="text-sm text-[var(--customer-muted)]">اختر مولًا من القائمة لعرض متاجره.</p>
                    ) : storesOfHoveredMall.length === 0 ? (
                      <p className="text-sm text-[var(--customer-muted)]">لا توجد متاجر مرتبطة بهذا المول حاليًا.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        {storesOfHoveredMall.map((store) => {
                          const active = String(selectedStoreId) === String(store.id);

                          return (
                            <button
                              key={store.id}
                              type="button"
                              onClick={() => goToStore(hoveredMallId, store.id)}
                              className={`flex items-center gap-4 rounded-[24px] border px-4 py-4 text-right shadow-[var(--customer-shadow-soft)] transition ${
                                active
                                  ? "border-[rgba(15,109,255,0.18)] bg-[var(--customer-accent-soft)]"
                                  : "border-[var(--customer-border)] bg-white hover:-translate-y-0.5 hover:border-[rgba(15,109,255,0.18)] hover:bg-[rgba(15,109,255,0.04)]"
                              }`}
                            >
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[var(--customer-surface-muted)]">
                                {store.logoUrl ? (
                                  <img
                                    src={store.logoUrl}
                                    alt={store.name}
                                    className="h-full w-full object-cover"
                                    onError={(event) => {
                                      event.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <IoStorefrontOutline className="text-lg text-[var(--customer-muted)]" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-[var(--customer-text)]">{store.name}</p>
                                <p className="mt-1 truncate text-xs text-[var(--customer-muted)]">
                                  {store.categoryLabel || "افتح صفحة المتجر"}
                                </p>
                              </div>

                              <IoChevronBackOutline className="shrink-0 text-base text-[var(--customer-muted-soft)]" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="mt-4 md:hidden" dir="rtl">
                <div className="max-h-[70vh] space-y-3 overflow-auto">
                  {malls.map((mall) => {
                    const storesForMall = getMallStores(stores, mall.id);
                    const isOpen = String(expandedMallId) === String(mall.id);
                    const isMallSelected = String(selectedMallId) === String(mall.id) && !selectedStoreId;

                    return (
                      <div
                        key={mall.id}
                        className={`overflow-hidden rounded-[28px] border bg-white shadow-[var(--customer-shadow-soft)] ${
                          isMallSelected ? "border-[rgba(15,109,255,0.18)]" : "border-[var(--customer-border)]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 px-4 py-4">
                          <button type="button" onClick={() => goToMall(mall.id)} className="min-w-0 text-right">
                            <p className="truncate text-sm font-black text-[var(--customer-text)]">{mall.name}</p>
                            <p className="mt-1 text-xs text-[var(--customer-muted)]">{storesForMall.length} متجر</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleMall(mall.id)}
                            className="grid h-10 w-10 place-items-center rounded-full border border-[var(--customer-border)] bg-[var(--customer-surface-muted)] text-[var(--customer-muted)]"
                          >
                            <IoIosArrowDown className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                        </div>

                        {isOpen ? (
                          <div className="border-t border-[var(--customer-border)] px-4 py-4">
                            {storesForMall.length === 0 ? (
                              <p className="text-sm text-[var(--customer-muted)]">لا توجد متاجر لهذا المول.</p>
                            ) : (
                              <div className="space-y-2">
                                {storesForMall.map((store) => {
                                  const active = String(selectedStoreId) === String(store.id);
                                  return (
                                    <button
                                      key={store.id}
                                      type="button"
                                      onClick={() => goToStore(mall.id, store.id)}
                                      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-right transition ${
                                        active
                                          ? "border-[rgba(15,109,255,0.18)] bg-[var(--customer-accent-soft)]"
                                          : "border-[var(--customer-border)] bg-white hover:border-[rgba(15,109,255,0.18)] hover:bg-[rgba(15,109,255,0.04)]"
                                      }`}
                                    >
                                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[var(--customer-surface-muted)]">
                                        {store.logoUrl ? (
                                          <img
                                            src={store.logoUrl}
                                            alt={store.name}
                                            className="h-full w-full object-cover"
                                            onError={(event) => {
                                              event.currentTarget.style.display = "none";
                                            }}
                                          />
                                        ) : (
                                          <IoStorefrontOutline className="text-base text-[var(--customer-muted)]" />
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-black text-[var(--customer-text)]">{store.name}</p>
                                        <p className="mt-1 truncate text-xs text-[var(--customer-muted)]">
                                          {store.categoryLabel || "فتح المتجر"}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

export default MallsAndStoresMenu;
