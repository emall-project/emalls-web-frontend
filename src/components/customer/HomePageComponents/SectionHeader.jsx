import React from "react";
import { IoArrowBackOutline } from "react-icons/io5";

export default function SectionHeader({ title, onViewAll }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-black" />
        <h2 className="text-base md:text-lg font-bold tracking-wide text-black">
          {title}
        </h2>
      </div>

      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="group flex items-center gap-1.5 text-[10px] md:text-xs font-medium tracking-widest uppercase text-black/50 hover:text-black transition-colors duration-300"
        >
          <span>عرض الكل</span>
          <IoArrowBackOutline className="text-sm transition-transform duration-300 group-hover:-translate-x-0.5" />
        </button>
      )}
    </div>
  );
}
