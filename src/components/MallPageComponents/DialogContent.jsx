import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import * as Dialog from "@radix-ui/react-dialog";

export default function DialogContent({ mall, stores }) {
  const [activeTab, setActiveTab] = useState("about");

  return (
    <div className="relative">
      {/* Close Button */}
      <Dialog.Close
        className="
          absolute -top-3 -left-3 sm:-top-4 sm:-left-4
          w-10 h-10 sm:w-12 sm:h-12
          bg-white border border-black/10
          flex items-center justify-center
          hover:bg-black hover:text-white transition-all duration-300
          outline-none
          z-10
        "
      >
        <IoClose className="text-xl sm:text-2xl" />
      </Dialog.Close>

      {/* Header with Logo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8 md:mb-10 pb-6 md:pb-8 border-b border-black/10">
        {/* Logo */}
        {mall?.logoUrl && (
          <div className="flex-shrink-0">
            <img
              src={mall.logoUrl}
              alt={mall?.name || "Mall logo"}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            />
          </div>
        )}

        {/* Tabs Navigation - Scrollable on mobile */}
        <div className="flex-1 w-full overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 sm:gap-3 min-w-max sm:min-w-0">
            {[
              { id: "about", label: "عن المول" },
              { id: "services", label: "الخدمات" },
              { id: "stores", label: "المتاجر" },
              { id: "restaurants", label: "المطاعم" },
              { id: "entertainment", label: "الترفيه" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base font-semibold tracking-wide uppercase transition-all duration-300 whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-black text-white"
                    : "bg-transparent text-black/70 hover:text-black hover:bg-black/5",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px] sm:min-h-[400px]">
        {activeTab === "about" && <AboutTab mall={mall} />}
        {activeTab === "services" && <ServicesTab mall={mall} />}
        {activeTab === "stores" && <StoresTab mall={mall} stores={stores} />}
        {activeTab === "restaurants" && <RestaurantsTab mall={mall} />}
        {activeTab === "entertainment" && <EntertainmentTab mall={mall} />}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// About Tab Component
function AboutTab({ mall }) {
  const aboutSections = mall?.aboutSections || [];
  const mainImage =
    mall?.images?.[2]?.image ||
    "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800&q=80";

  return (
    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
      {/* Image */}
      <div className="w-full lg:w-[480px] flex-shrink-0">
        <img
          src={mainImage}
          alt={mall?.name || "Mall Interior"}
          className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
        />
      </div>

      {/* Text Content */}
      <div className="flex-1 space-y-4 md:space-y-6 text-right">
        {aboutSections.length > 0 ? (
          aboutSections.map((section, index) => (
            <p
              key={index}
              className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed text-black/80"
            >
              {section}
            </p>
          ))
        ) : mall?.description ? (
          <>
            <p className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed text-black/80">
              {mall.description[0]}
            </p>
            <p className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed text-black/80">
              {mall.description[1]}
            </p>
            <p className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed text-black/80">
              {mall.description[2]}
            </p>
          </>
        ) : (
          <p className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed text-black/40">
            لا توجد معلومات متاحة حالياً
          </p>
        )}
      </div>
    </div>
  );
}

// Services Tab Component
function ServicesTab({ mall }) {
  const servicesObj = mall?.services || {};

  const servicesArray = Object.entries(servicesObj)
    .filter(([_, service]) => service.available)
    .map(([key, service]) => ({
      title: service.name,
      description: service.description || "",
      key,
    }));

  const defaultServices = [
    {
      title: "واي فاي",
      description: "استمتع بخدمة واي فاي مجانية وسريعة في جميع أرجاء المول.",
    },
    {
      title: "الأمن",
      description: "نظام أمن متكامل يعمل على مدار الساعة لراحتك وسلامتك.",
    },
    {
      title: "مواقف السيارات",
      description: "مواقف واسعة وآمنة تمتد عبر 5 طوابق للوصول المريح.",
    },
    {
      title: "الإعلانات",
      description: "شاشات إعلانية في جميع الطوابق والمداخل.",
    },
  ];

  const displayServices = servicesArray.length > 0 ? servicesArray : defaultServices;

  return (
    <div>
      {/* Header */}
      <p className="text-sm sm:text-base md:text-lg text-black/80 font-semibold mb-6 md:mb-8 text-right leading-relaxed">
        خدمات متكاملة لراحة زوارنا: مصليات مجهزة، أمن على مدار الساعة، استعلامات، حمامات نظيفة، واي فاي
        مجاني، مساحات إعلانية، ومواقف سيارات واسعة.
      </p>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {displayServices.map((service, index) => (
          <div
            key={service.key || index}
            className="bg-neutral-50 border border-black/5 overflow-hidden text-right hover:bg-neutral-100 transition-all duration-300 p-4 md:p-6"
          >
            {/* Service Title */}
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-black mb-2 md:mb-3 text-center">
              {service.title}
            </h3>

            {/* Divider */}
            <div className="w-8 h-px bg-black mx-auto mb-3 md:mb-4"></div>

            {/* Service Description */}
            {service.description && (
              <p className="text-xs sm:text-sm md:text-base text-black/60 font-semibold leading-relaxed">
                {service.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StoresTab({ stores = [] }) {
  if (stores.length === 0) {
    return (
      <div className="text-center py-12 text-black/40">
        <p className="text-base sm:text-lg md:text-xl font-semibold">
          لا توجد متاجر متاحة حالياً
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <p className="text-sm sm:text-base md:text-lg text-black/80 font-semibold mb-6 md:mb-8 text-right leading-relaxed">
        اكتشف مجموعة متنوعة من المتاجر العالمية والمحلية تحت سقف واحد
      </p>

      {/* Stores Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {stores.map((store) => (
          <div
            key={store.id}
            className="bg-white border border-black/10 overflow-hidden hover:shadow-lg transition-all duration-300 group"
          >
            {/* Store Image */}
            {store.logoUrl && (
              <div className="w-full bg-neutral-50 flex items-center justify-center overflow-hidden">
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="w-full h-24 sm:h-28 md:h-32 object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}

            {/* Store Info */}
            <div className="p-3 sm:p-4 md:p-5 text-right border-t border-black/5">
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-black mb-1 md:mb-2 line-clamp-1">
                {store.name}
              </h3>

              {store.floor && (
                <div className="flex items-center justify-end gap-1.5 text-[10px] sm:text-xs text-black/40 font-semibold">
                  <span>الطابق {store.floor}</span>
                  <span className="w-1 h-1 bg-black/20 rounded-full"></span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RestaurantsTab() {
  return (
    <div className="text-center py-12 text-black/40">
      <p className="text-base sm:text-lg md:text-xl font-semibold">
        قريباً - معلومات المطاعم
      </p>
    </div>
  );
}

function EntertainmentTab() {
  return (
    <div className="text-center py-12 text-black/40">
      <p className="text-base sm:text-lg md:text-xl font-semibold">
        قريباً - معلومات الترفيه
      </p>
    </div>
  );
}
