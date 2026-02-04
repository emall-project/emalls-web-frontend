import React from "react";

export default function SectionHeader({ title, onViewAll }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-right">
        <h2 className="text-base md:text-lg font-light tracking-wide text-black">
          {title}
        </h2>
        <div className="mt-2 h-px w-12 bg-black" />
      </div>

      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="
            group
            text-[10px] md:text-xs 
            font-light 
            tracking-widest 
            uppercase 
            text-black/60
            transition-all duration-300
            hover:text-black
            relative
          "
        >
          عرض الكل
          
          {/* Underline that expands on hover */}
          <span className="
            absolute -bottom-1 right-0
            h-px w-0 bg-black
            transition-all duration-300
            group-hover:w-full
          "></span>
        </button>
      )}
    </div>
  );
}