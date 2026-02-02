import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import * as Dialog from "@radix-ui/react-dialog";

export default function DialogContent({ mall , stores }) {
  const [activeTab, setActiveTab] = useState("about");

  return (
    <div className="relative">
      {/* Close Button */}
      <Dialog.Close
        className="
          absolute -top-2 -left-2
          w-10 h-10 rounded-full
          bg-white shadow-lg
          flex items-center justify-center
          hover:bg-gray-50 transition
          outline-none
          z-10
        "
      >
        <IoClose className="text-2xl text-gray-600" />
      </Dialog.Close>

      {/* Header with Logo and Tabs */}
      <div className="flex items-center gap-6 mb-8">
        {/* Logo */}
        {mall?.logoUrl && (
          <div className="flex-shrink-0">
            <img
              src={mall.logoUrl}
              alt={mall?.name || "Mall logo"}
              className="w-20 h-20 object-contain"
            />
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex-1 flex gap-3 justify-center">
          <button
            onClick={() => setActiveTab("about")}
            className={`
              px-8 py-3 rounded-full text-lg font-bold transition
              ${
                activeTab === "about"
                  ? "bg-[#E8F0FE] text-black"
                  : "bg-transparent text-gray-600 hover:bg-gray-50"
              }
            `}
          >
            عن المول
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`
              px-8 py-3 rounded-full text-lg font-bold transition
              ${
                activeTab === "services"
                  ? "bg-[#E8F0FE] text-black"
                  : "bg-transparent text-gray-600 hover:bg-gray-50"
              }
            `}
          >
            الخدمات
          </button>
          <button
            onClick={() => setActiveTab("stores")}
            className={`
              px-8 py-3 rounded-full text-lg font-bold transition
              ${
                activeTab === "stores"
                  ? "bg-[#E8F0FE] text-black"
                  : "bg-transparent text-gray-600 hover:bg-gray-50"
              }
            `}
          >
            المتاجر
          </button>
          <button
            onClick={() => setActiveTab("restaurants")}
            className={`
              px-8 py-3 rounded-full text-lg font-bold transition
              ${
                activeTab === "restaurants"
                  ? "bg-[#E8F0FE] text-black"
                  : "bg-transparent text-gray-600 hover:bg-gray-50"
              }
            `}
          >
            المطاعم
          </button>
          <button
            onClick={() => setActiveTab("entertainment")}
            className={`
              px-8 py-3 rounded-full text-lg font-bold transition
              ${
                activeTab === "entertainment"
                  ? "bg-[#E8F0FE] text-black"
                  : "bg-transparent text-gray-600 hover:bg-gray-50"
              }
            `}
          >
            الترفيه
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "about" && <AboutTab mall={mall} />}
        {activeTab === "services" && <ServicesTab mall={mall} />}
        {activeTab === "stores" && <StoresTab mall={mall} stores={stores}/>}
        {activeTab === "restaurants" && <RestaurantsTab mall={mall} />}
        {activeTab === "entertainment" && <EntertainmentTab mall={mall} />}
      </div>
    </div>
  );
}

// About Tab Component
function AboutTab({ mall }) {
  const aboutSections = mall?.aboutSections || [];
  const mainImage = mall?.images?.[2].image || "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800&q=80";

  return (
    <div className="flex gap-8 items-start">

      {/* Image */}
      <div className="w-[480px] flex-shrink-0">
        <img
          src={mainImage}
          alt={mall?.name || "Mall Interior"}
          className="w-full h-[500px] object-cover rounded-3xl shadow-lg"
        />
      </div>

      {/* Text Content */}
      <div className="flex-1 space-y-6 text-right">
        {aboutSections.length > 0 ? (
          aboutSections.map((section, index) => (
            <p key={index} className="text-lg leading-relaxed text-gray-800">
              {section}
            </p>
          ))
        ) : mall?.description ? (
          <p className="text-lg leading-relaxed text-black font-bold">
            {mall.description[0]}
            <br/>
            <br/>
             {mall.description[1]}
             <br/>
            <br/>
             {mall.description[2]}
          </p>
        ) : (
          <p className="text-lg leading-relaxed text-gray-600">
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
  
  // Convert services object to array format
  const servicesArray = Object.entries(servicesObj)
    .filter(([key, service]) => service.available)
    .map(([key, service]) => ({
      title: service.name,
      description: service.description || "",
      key: key
    }));

  // Default services if none provided
  const defaultServices = [
    {
      title: "واي فاي",
      description: "استمتع بخدمة واي فاي مجانية وسريعة في جميع أرجاء المول.",
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=400"
    },
    {
      title: "الأمن",
      description: "نظام أمن متكامل يعمل على مدار الساعة لراحتك وسلامتك.",
      imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=400"
    },
    {
      title: "مواقف السيارات",
      description: "مواقف واسعة وآمنة تمتد عبر 5 طوابق للحرية وصول مريحة.",
      imageUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=400"
    },
    {
      title: "الإعلانات",
      description: "شاشات إعلانية في جميع الطوابق والمداخل لتعلن علامتك التجارية حضورها بإزاز.",
      imageUrl: "https://images.unsplash.com/photo-1635514569146-9a9607ecf303?q=80&w=400"
    },
  ];

  const displayServices = servicesArray.length > 0 ? servicesArray : defaultServices;

  return (
    <div>
      {/* Header */}
      <p className="text-xl text-black mb-8 text-right leading-relaxed">
        خدمات متكاملة لراحة زوارنا: مصليات مجهزة، أمن على مدار الساعة، استعلامات، حمامات نظيفة، واي فاي مجاني، مساحات إعلانية، ومواقف سيارات واسعة.
      </p>

      {/* Services Grid */}
      <div className="grid grid-cols-2 gap-6">
        {displayServices.map((service, index) => (
          <div
            key={service.key || index}
            className="bg-[#E8F0FE]/40 rounded-3xl overflow-hidden text-right hover:shadow-md transition"
          >
  
            {/* Service Content */}
            <div className="p-4">
              {/* Service Title */}
              <h3 className="flex text-2xl justify-center font-bold text-gray-900 mb-3">
                {service.title}
              </h3>
              
              {/* Service Description */}
              {service.description && (
                <p className="text-lg text-gray-700 leading-relaxed">
                  {service.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function StoresTab({ mall, stores = []}) {
  // Get stores for this mall
  if (stores.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-xl">لا توجد متاجر متاحة حالياً</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <p className="text-xl text-black mb-8 text-right leading-relaxed">
        اكتشف مجموعة متنوعة من المتاجر العالمية والمحلية تحت سقف واحد
      </p>

      {/* Stores Grid */}
      <div className="grid grid-cols-3 gap-6">
        {stores.map((store) => (
          <div
            key={store.id}
            className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100"
          >
            {/* Store Image */}
            {store.logoUrl && (
              <div className="w-full bg-gray-50 flex items-center justify-center ">
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
            
            {/* Store Info */}
            <div className="p-6 text-right">
              {/* Store Name */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {store.name}
              </h3>
              

              {/* Store Floor */}
              {store.floor && (
                <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
                  <span>الطابق {store.floor}</span>
                  <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RestaurantsTab({ mall }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-xl">قريباً - معلومات المطاعم</p>
    </div>
  );
}

function EntertainmentTab({ mall }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-xl">قريباً - معلومات الترفيه</p>
    </div>
  );
}