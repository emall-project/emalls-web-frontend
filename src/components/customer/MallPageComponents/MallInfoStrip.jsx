import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { IoChevronDownOutline, IoLocationOutline } from "react-icons/io5";
import DialogContent from "./DialogContent";

export default function MallInfoDialog({ mall, stores }) {
  return (
    <div className="max-w-400 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-6 md:mt-8">
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button
            className="
              w-full
              bg-white border border-black/10
              px-6 sm:px-8 md:px-10 py-5 md:py-6
              flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
              hover:bg-black/5 transition-all duration-300
              outline-none
              group
            "
          >
            {/* Right: Logo & Info */}
            <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
              {mall?.logoUrl ? (
                <img
                  src={mall.logoUrl}
                  alt={mall?.name || "Mall logo"}
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain flex-shrink-0"
                />
              ) : null}
              <div className="text-right flex-1 sm:flex-initial">
                <h2 className="text-lg sm:text-xl md:text-2xl font-light tracking-wide text-black">
                  {mall?.name}
                </h2>
                <div className="mt-2 flex items-center justify-end gap-2 text-black/60 font-light text-sm md:text-base">
                  <IoLocationOutline className="text-base md:text-lg" />
                  <span>{mall?.location}</span>
                </div>
              </div>
            </div>

            {/* Left: More Info */}
            <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm tracking-widest uppercase text-black/60 font-light group-hover:text-black transition-colors self-end sm:self-auto">
              <span>المزيد من المعلومات</span>
              <IoChevronDownOutline className="text-base md:text-lg transition-transform group-hover:translate-y-0.5" />
            </div>
          </button>
        </Dialog.Trigger>

        {/* Dialog Portal */}
        <Dialog.Portal>
          {/* Overlay */}
          <Dialog.Overlay
            className="
              fixed inset-0 z-50
              bg-black/50 backdrop-blur-sm
              data-[state=open]:animate-in data-[state=closed]:animate-out
              data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            "
          />

          {/* Content */}
          <Dialog.Content
            dir="rtl"
            className="
              fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] max-w-[1200px]
              max-h-[90vh] overflow-auto
              bg-white
              border border-black/10
              p-6 sm:p-8 md:p-10 lg:p-12
              shadow-2xl
              outline-none
              data-[state=open]:animate-in data-[state=closed]:animate-out
              data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
              data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
            "
          >
            <DialogContent mall={mall} stores={stores} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}