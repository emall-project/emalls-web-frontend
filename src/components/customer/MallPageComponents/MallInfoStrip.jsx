import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { IoChevronDownOutline, IoLocationOutline } from "react-icons/io5";

import DialogContent from "./DialogContent";

export default function MallInfoDialog({ mall, stores }) {
  return (
    <div>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button className="customer-panel-strong flex w-full flex-col items-start justify-between gap-4 px-5 py-5 text-right hover:border-blue-200 sm:flex-row sm:items-center sm:px-6 md:px-8">
            <div className="flex w-full items-center gap-4 sm:w-auto">
              {mall?.logoUrl ? (
                <img src={mall.logoUrl} alt={mall?.name || "Mall logo"} className="h-20 w-20 shrink-0 rounded-3xl bg-white object-contain p-2 shadow-sm" />
              ) : null}
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold text-slate-900">{mall?.name}</h2>
                <div className="mt-2 flex items-center justify-end gap-2 text-sm text-slate-500">
                  <IoLocationOutline className="text-base" />
                  <span>{mall?.location}</span>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
              المزيد من التفاصيل
              <IoChevronDownOutline className="text-base" />
            </div>
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm" />

          <Dialog.Content
            dir="rtl"
            className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.24)] outline-none sm:w-[calc(100vw-4rem)] sm:p-8 md:p-10"
          >
            <DialogContent mall={mall} stores={stores} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
