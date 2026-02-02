import React from "react";

export default function SectionHeader({ title, onViewAll }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className=" text-center">
        <p className="font-extrabold text-gray-900">{title}</p>
        <div className="mx-auto mt-1 h-[3px] w-20 rounded-full bg-[#1A73E8]" />
      </div>

      <button
        type="button"
        onClick={onViewAll}
        className="text-sm font-semibold text-gray-600 hover:text-[#1A73E8]"
      >
        عرض الكل
      </button>

    </div>
  );
}
