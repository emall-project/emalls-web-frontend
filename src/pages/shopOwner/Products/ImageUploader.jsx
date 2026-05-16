import * as Tooltip from "@radix-ui/react-tooltip";
import { useRef, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiImage,
  FiRefreshCw,
  FiStar,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";
import { ACCEPTED_MEDIA_TYPES } from "./productFormUtils";

function Tip({ content, children }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          className="z-[80] rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg"
          style={{ background: "var(--gray-12)", color: "var(--gray-1)" }}
        >
          {content}
          <Tooltip.Arrow style={{ fill: "var(--gray-12)" }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export default function ImageUploader({
  items,
  uploading,
  error = "",
  onFilesSelected,
  onRemove,
  onRetry,
  onSetMain,
  onMove,
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  function pickFiles() {
    if (!uploading) inputRef.current?.click();
  }

  function normalizeFiles(fileList) {
    return Array.from(fileList || []).filter((file) => ACCEPTED_MEDIA_TYPES.includes(file.type));
  }

  function handleDrag(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const files = normalizeFiles(event.dataTransfer.files);
    if (files.length) onFilesSelected(files);
  }

  return (
    <Tooltip.Provider delayDuration={180}>
      <div className="space-y-4">
        <div
          onClick={pickFiles}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className="cursor-pointer rounded-[28px] border-2 border-dashed p-8 text-center transition-all"
          style={{
            borderColor: error ? "var(--red-8)" : dragActive ? "var(--blue-8)" : "var(--gray-a6)",
            background: dragActive ? "var(--blue-a2)" : "var(--gray-a2)",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = normalizeFiles(event.target.files);
              if (files.length) onFilesSelected(files);
              event.target.value = "";
            }}
          />

          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{ background: dragActive ? "var(--blue-a3)" : "var(--gray-a4)", color: "var(--blue-10)" }}
            >
              <FiUploadCloud size={28} />
            </div>

            <div className="space-y-1">
              <p className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                {uploading ? "جارٍ رفع الوسائط..." : "اسحب الصور أو الفيديوهات هنا أو اضغط للرفع"}
              </p>
              <p className="text-sm leading-6" style={{ color: "var(--gray-9)" }}>
                ارفع صور JPG أو PNG أو WEBP أو فيديوهات MP4 أو WEBM. الوسيط الأول سيكون الرئيسي ويمكنك إعادة ترتيب الباقي لاحقًا.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div
            className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm"
            style={{ background: "var(--red-a2)", borderColor: "var(--red-a5)", color: "var(--red-10)" }}
          >
            <FiAlertCircle size={15} />
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item, index) => {
            const isUploaded = item.status === "uploaded";
            const isError = item.status === "error";
            const isUploading = item.status === "uploading";
            const preview = item.previewUrl;
            const isVideo = item.mimeType?.startsWith("video/");

            return (
              <div
                key={item.localId}
                className="overflow-hidden rounded-[26px] border"
                style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
              >
                <div
                  className="relative aspect-[4/3] overflow-hidden"
                  style={{ background: "linear-gradient(135deg, var(--gray-a3), var(--gray-a2))" }}
                >
                  {preview && isVideo ? (
                    <video src={preview} className="h-full w-full object-cover" muted playsInline />
                  ) : preview ? (
                    <img src={preview} alt={item.fileName || `صورة ${index + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FiImage size={24} style={{ color: "var(--gray-8)" }} />
                    </div>
                  )}

                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{
                        background: index === 0 ? "rgba(37,99,235,.9)" : "rgba(15,23,42,.72)",
                        color: "#fff",
                      }}
                    >
                      {index === 0 ? "الرئيسية" : `#${index + 1}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 px-4 py-4">
                  <div className="space-y-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                      {item.fileName || `صورة ${index + 1}`}
                    </p>
                    <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                      {isUploading
                        ? "جارٍ تجهيز الوسيط"
                        : isError
                          ? "فشل رفع الوسيط"
                          : "تم رفع الوسيط بنجاح"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isUploaded ? (
                      <>
                        <Tip content="تعيين كصورة رئيسية">
                          <button
                            type="button"
                            onClick={() => onSetMain(item.localId)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition"
                            style={{
                              borderColor: index === 0 ? "var(--blue-7)" : "var(--gray-a6)",
                              color: index === 0 ? "var(--blue-10)" : "var(--gray-10)",
                              background: index === 0 ? "var(--blue-a2)" : "transparent",
                            }}
                          >
                            <FiStar size={14} />
                          </button>
                        </Tip>

                        <Tip content="تقديم الصورة">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => onMove(item.localId, -1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-40"
                            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}
                          >
                            <FiArrowRight size={14} />
                          </button>
                        </Tip>

                        <Tip content="تأخير الصورة">
                          <button
                            type="button"
                            disabled={index === items.length - 1}
                            onClick={() => onMove(item.localId, 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-40"
                            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}
                          >
                            <FiArrowLeft size={14} />
                          </button>
                        </Tip>
                      </>
                    ) : null}

                    {isUploading ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: "var(--blue-a2)", color: "var(--blue-11)" }}
                      >
                        <FiUploadCloud size={12} />
                        قيد الرفع
                      </span>
                    ) : isError ? (
                      <button
                        type="button"
                        onClick={() => onRetry(item.localId)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: "var(--amber-a3)", color: "var(--amber-11)" }}
                      >
                        <FiRefreshCw size={12} />
                        إعادة المحاولة
                      </button>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: "var(--green-a3)", color: "var(--green-11)" }}
                      >
                        <FiCheckCircle size={12} />
                        جاهزة
                      </span>
                    )}

                    <Tip content="إزالة الصورة">
                      <button
                        type="button"
                        onClick={() => onRemove(item.localId)}
                        className="mr-auto inline-flex h-9 w-9 items-center justify-center rounded-full border transition"
                        style={{ borderColor: "var(--red-a6)", color: "var(--red-10)", background: "var(--red-a2)" }}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </Tip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Tooltip.Provider>
  );
}
