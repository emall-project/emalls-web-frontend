import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { MediaManagerWidget } from "./MediaManagerWidget";

export function MediaManagerPickerDialog({
  open,
  onOpenChange,
  mode,
  storeId,
  title,
  selectionMode = "multiple",
  initialSelection = [],
  maxSelection,
  confirmLabel = "إضافة",
  onConfirm,
}) {
  const [themeContainer, setThemeContainer] = useState(null);

  useEffect(() => {
    setThemeContainer(document.querySelector(".radix-themes") || document.body);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay
          className="fixed inset-0 z-[20040]"
          style={{
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(2px)",
          }}
        />

        <Dialog.Content
          dir="rtl"
          className="fixed inset-0 z-[20041] flex items-stretch justify-center overflow-hidden p-4"
          aria-describedby={undefined}
        >
          <div
            className="flex h-full max-h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl shadow-2xl"
            style={{
              background: "var(--gray-1)",
              border: "1px solid var(--gray-a6)",
            }}
          >
            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{ borderColor: "var(--gray-a6)" }}
            >
              <Dialog.Title
                className="text-lg font-bold"
                style={{ color: "var(--gray-12)" }}
              >
                {title}
              </Dialog.Title>

              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-2 transition hover:opacity-70"
                  style={{ color: "var(--gray-11)" }}
                >
                  <FiX size={18} />
                </button>
              </Dialog.Close>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-6">
              <MediaManagerWidget
                mode={mode}
                storeId={storeId}
                selectionMode={selectionMode}
                initialSelection={initialSelection}
                maxSelection={maxSelection}
                confirmLabel={confirmLabel}
                onCancelSelection={() => onOpenChange(false)}
                onConfirmSelection={(files) => {
                  onConfirm?.(files);
                  onOpenChange(false);
                }}
                minHeight={420}
                maxHeight="100%"
              />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
