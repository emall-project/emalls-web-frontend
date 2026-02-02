import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { IoChevronDownOutline, IoLocationOutline, IoClose } from "react-icons/io5";
import DialogContent from "./DialogContent";

export default function MallInfoDialog({ mall , stores}) {
  return (
    <div className=" mx-auto px-10 mt-4">
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button
            className="
              w-full
              bg-[#E8F0FE]/50 rounded-[28px] px-6 py-5
              flex items-center justify-between gap-4
              hover:brightness-[0.98] transition
              outline-none
            "
          >
            {/* right */}
            <div className="flex items-center gap-6">
               {mall?.logoUrl ? (
                <img
                  src={mall.logoUrl}
                  alt={mall?.name || "Mall logo"}
                  className="w-40 h-30 object-contain"
                />
              ) : null}
              <div className="text-right">
                <h2 className="text-2xl font-black">{mall?.name}</h2>
                <div className="mt-2 flex items-center justify-end gap-2 text-black font-semibold">
                  <IoLocationOutline className="text-xl" />
                  <span>
                    {mall?.location}
                  </span>
                </div>
              </div>
            </div>

             {/* left */}
            <div className="flex items-center gap-3 font-extrabold  text-black/80">
              <IoChevronDownOutline className="text-xl" />
              المزيد من المعلومات
            </div>
          </button>
        </Dialog.Trigger>

        {/* ===== DIALOG (Modal) ===== */}
        <Dialog.Portal>
          {/* overlay */}
          <Dialog.Overlay
            className="
              fixed inset-0 z-50
              bg-black/40
              data-[state=open]:animate-in data-[state=closed]:animate-out
              data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            "
          />

          {/* content */}
          <Dialog.Content
            dir="rtl"
            className="
              fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-[min(1100px,calc(100vw-32px))]
              max-h-[85vh] overflow-auto
              rounded-[28px] bg-white
              border border-[#EEF3FB]
              p-8
              shadow-[0_20px_60px_rgba(0,0,0,0.18)]
              outline-none
              data-[state=open]:animate-in data-[state=closed]:animate-out
              data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
              data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
            "
          >
            <DialogContent mall={mall} stores={stores}/>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
