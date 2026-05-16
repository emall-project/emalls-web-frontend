import React, { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { IoClose } from "react-icons/io5";

const TAB_ITEMS = [
  { id: "about", label: "عن المول" },
  { id: "services", label: "الخدمات" },
  { id: "stores", label: "المتاجر" },
];

export default function DialogContent({ mall, stores }) {
  const [activeTab, setActiveTab] = useState("about");

  const services = useMemo(() => {
    const servicesObj = mall?.services || {};
    const available = Object.values(servicesObj).filter((service) => service?.available);
    if (available.length) {
      return available.map((service) => ({
        title: service.name,
        description: service.description || "",
      }));
    }

    return [
      { title: "مواقف سيارات", description: "مواقف منظمة وواضحة الوصول لزوار المول." },
      { title: "استعلامات", description: "خدمة استعلامات لمساعدة الزوار داخل المول." },
      { title: "واي فاي", description: "اتصال متاح داخل مناطق متعددة من المول." },
      { title: "أمن ونظافة", description: "مستوى خدمة يومي للمحافظة على راحة الزوار." },
    ];
  }, [mall]);

  return (
    <div className="relative">
      <Dialog.Close className="absolute left-0 top-0 grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
        <IoClose className="text-xl" />
      </Dialog.Close>

      <div className="border-b border-slate-200 pb-6 pr-2 pl-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {mall?.logoUrl ? (
            <img src={mall.logoUrl} alt={mall?.name || "Mall logo"} className="h-20 w-20 rounded-3xl bg-slate-50 object-contain p-2" />
          ) : null}

          <div className="min-w-0 flex-1">
            <h2 className="text-3xl font-extrabold text-slate-900">{mall?.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-8 text-slate-500">
              {mall?.description?.[0] || "تفاصيل أكثر عن المول والخدمات والمتاجر المتاحة داخله."}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6">
        {activeTab === "about" ? <AboutTab mall={mall} /> : null}
        {activeTab === "services" ? <ServicesTab services={services} /> : null}
        {activeTab === "stores" ? <StoresTab stores={stores} /> : null}
      </div>
    </div>
  );
}

function AboutTab({ mall }) {
  const aboutSections = mall?.aboutSections || [];
  const textBlocks =
    aboutSections.length > 0
      ? aboutSections
      : Array.isArray(mall?.description)
      ? mall.description
      : mall?.description
      ? [mall.description]
      : [];

  const image = mall?.images?.[2]?.image || mall?.images?.[0]?.image || mall?.logoUrl || "";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
      <div className="overflow-hidden rounded-[2rem] bg-slate-100">
        {image ? (
          <img src={image} alt={mall?.name || "Mall"} className="h-full min-h-[280px] w-full object-cover" />
        ) : (
          <div className="flex min-h-[280px] items-center justify-center text-slate-400">لا توجد صورة متاحة</div>
        )}
      </div>

      <div className="space-y-4 text-right">
        {textBlocks.length ? (
          textBlocks.map((section, index) => (
            <p key={index} className="text-sm leading-8 text-slate-700">
              {section}
            </p>
          ))
        ) : (
          <p className="text-sm leading-8 text-slate-500">لا توجد معلومات إضافية متاحة عن هذا المول حاليًا.</p>
        )}
      </div>
    </div>
  );
}

function ServicesTab({ services }) {
  return (
    <div>
      <p className="mb-5 text-sm leading-8 text-slate-500">
        هذه أبرز الخدمات المتوفرة داخل المول لتجربة زيارة أوضح وأكثر راحة.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <div key={service.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-extrabold text-slate-900">{service.title}</h3>
            <p className="mt-3 text-sm leading-8 text-slate-600">{service.description || "لا توجد تفاصيل إضافية."}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoresTab({ stores = [] }) {
  if (!stores.length) {
    return <p className="text-sm leading-8 text-slate-500">لا توجد متاجر متاحة للعرض حاليًا.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {stores.map((store) => (
        <div key={store.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="flex h-28 items-center justify-center bg-slate-50 p-4">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-lg font-bold text-slate-400">{store.name?.[0] || "؟"}</span>
            )}
          </div>
          <div className="border-t border-slate-200 p-4 text-right">
            <h3 className="line-clamp-1 text-sm font-extrabold text-slate-900">{store.name}</h3>
            {store.floor ? <p className="mt-1 text-xs text-slate-500">الطابق {store.floor}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
