import React, { useState, useRef, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  FiUpload, FiImage, FiEye, FiTrash2, FiEdit2,
  FiX, FiChevronLeft, FiChevronRight, FiCamera,
} from "react-icons/fi";
import { mediaApi } from "../../../api/mediaApi";

// ── CSS for indeterminate progress bar ────────────────────────────────────────
const PROGRESS_STYLE = `
  @keyframes progress-slide {
    0%   { left: -45%; }
    100% { left: 100%;  }
  }
`;

// ── Image compression (max 1.5 MB, 1920px) ───────────────────────────────────
const MAX_BYTES = 1.5 * 1024 * 1024;
function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size <= MAX_BYTES && file.type !== "image/bmp") { resolve(file); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("تعذّر ضغط الصورة")); };
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > 1920 || h > 1920) { const s = Math.min(1920/w, 1920/h); w = Math.round(w*s); h = Math.round(h*s); }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      const tryNext = () => canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("تعذّر ضغط الصورة")); return; }
        if (blob.size <= MAX_BYTES || quality <= 0.3)
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        else { quality -= 0.1; tryNext(); }
      }, "image/jpeg", quality);
      tryNext();
    };
    img.src = url;
  });
}

function getInitials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "S";
}

function useThemeContainer() {
  return document.querySelector(".radix-themes") || document.body;
}

// ── MiniSpinner ───────────────────────────────────────────────────────────────
function MiniSpinner({ color = "var(--blue-9)", size = 14 }) {
  return (
    <svg className="animate-spin flex-shrink-0" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--gray-a5)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tip({ content, children, side = "top" }) {
  const container = useThemeContainer();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal container={container}>
        <Tooltip.Content
          side={side}
          sideOffset={6}
          className="z-[9999] px-2.5 py-1.5 rounded-lg text-xs font-medium pointer-events-none shadow-lg select-none"
          style={{ background: "var(--gray-12)", color: "var(--gray-1)" }}
        >
          {content}
          <Tooltip.Arrow style={{ fill: "var(--gray-12)" }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// ── Progress bar (indeterminate) ──────────────────────────────────────────────
function ProgressBar() {
  return (
    <div className="relative h-0.5 w-full rounded-full overflow-hidden" style={{ background: "var(--gray-a4)" }}>
      <div
        className="absolute top-0 h-full w-2/5 rounded-full"
        style={{
          background:       "linear-gradient(90deg, #2563eb, #4f46e5)",
          animation:        "progress-slide 1.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ── Delete alert dialog ───────────────────────────────────────────────────────
function DeleteConfirm({ open, onOpenChange, title, description, onConfirm }) {
  const container = useThemeContainer();
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal container={container}>
        <AlertDialog.Overlay className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" />
        <AlertDialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-2xl p-6 outline-none"
          style={{
            background:  "var(--gray-1)",
            border:      "1px solid var(--gray-a6)",
            boxShadow:   "0 24px 64px rgba(0,0,0,.45)",
            direction:   "rtl",
          }}
        >
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--red-a3)" }}>
              <FiTrash2 size={16} style={{ color: "var(--red-9)" }} />
            </div>
            <div className="min-w-0">
              <AlertDialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm mt-1 leading-relaxed" style={{ color: "var(--gray-10)" }}>
                {description}
              </AlertDialog.Description>
            </div>
          </div>
          <div className="flex gap-3">
            <AlertDialog.Cancel asChild>
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border outline-none transition hover:opacity-80"
                style={{ borderColor: "var(--gray-a6)", color: "var(--gray-11)", background: "transparent" }}
              >
                إلغاء
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold outline-none transition hover:opacity-90"
                style={{ background: "var(--red-9)", color: "#fff" }}
              >
                حذف
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

// ── Image preview dialog ──────────────────────────────────────────────────────
function PreviewDialog({ open, onOpenChange, images, startIdx }) {
  const container = useThemeContainer();
  const [idx, setIdx] = useState(startIdx);

  React.useEffect(() => { if (open) setIdx(startIdx); }, [open, startIdx]);

  const hasPrev = idx > 0;
  const hasNext = idx < images.length - 1;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/88 backdrop-blur-md" />
        <Dialog.Content
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 outline-none"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">معاينة الصورة</Dialog.Title>

          {/* Close */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition hover:opacity-80 z-10"
              style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}
            >
              <FiX size={18} />
            </button>
          </Dialog.Close>

          {/* Counter */}
          {images.length > 1 && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold z-10"
              style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}
            >
              {idx + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <div className="relative max-w-4xl w-full flex items-center justify-center">
            {images[idx]?.preview && (
              <img
                src={images[idx].preview}
                alt={`صورة ${idx + 1}`}
                className="max-w-full rounded-2xl object-contain shadow-2xl"
                style={{ maxHeight: "80vh" }}
              />
            )}
          </div>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setIdx(i => i - 1)}
                disabled={!hasPrev}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition hover:opacity-80 disabled:opacity-20"
                style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}
              >
                <FiChevronRight size={22} />
              </button>
              <button
                onClick={() => setIdx(i => i + 1)}
                disabled={!hasNext}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition hover:opacity-80 disabled:opacity-20"
                style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}
              >
                <FiChevronLeft size={22} />
              </button>
            </>
          )}

          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.uuid || i}
                  onClick={() => setIdx(i)}
                  className="rounded-lg overflow-hidden transition-all"
                  style={{
                    width: 48, height: 36,
                    border: i === idx ? "2px solid #fff" : "2px solid rgba(255,255,255,.2)",
                    opacity: i === idx ? 1 : 0.55,
                  }}
                >
                  {img.preview && (
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Upload dropzone ───────────────────────────────────────────────────────────
function UploadDropzone({ onFiles, uploading }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = e => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = e => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  };

  const handleChange = e => {
    const files = Array.from(e.target.files || []);
    if (files.length) onFiles(files);
    e.target.value = "";
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className="relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none"
      style={{
        borderColor: dragActive ? "#2563eb" : "var(--gray-a5)",
        background:  dragActive ? "rgba(37,99,235,.07)" : "var(--gray-a2)",
        padding:     "28px 20px",
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />

      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-200"
          style={{ background: dragActive ? "rgba(37,99,235,.18)" : "var(--gray-a4)" }}
        >
          {uploading
            ? <MiniSpinner color="#2563eb" size={18} />
            : <FiUpload size={20} style={{ color: dragActive ? "#2563eb" : "var(--gray-9)" }} />}
        </div>

        <div>
          <p className="text-sm font-semibold" style={{ color: uploading ? "var(--gray-10)" : "var(--gray-12)" }}>
            {uploading ? "جاري رفع الصور..." : dragActive ? "أفلت الصور هنا" : "اسحب الصور هنا أو اضغط للرفع"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--gray-9)" }}>
            PNG · JPG · WEBP · حتى 5MB
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Single photo card ─────────────────────────────────────────────────────────
function PhotoCard({ photo, index, editMode, onPreview, onReplace, onDelete }) {
  const replaceRef = useRef(null);

  return (
    <div
      className="relative group rounded-2xl overflow-hidden"
      style={{
        aspectRatio: "4/3",
        background:  "var(--gray-a3)",
        border:      "1px solid var(--gray-a5)",
        boxShadow:   "0 1px 4px rgba(0,0,0,.07)",
      }}
    >
      {/* Image */}
      {photo.preview
        ? <img
            src={photo.preview}
            alt={`صورة ${index + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        : <div className="w-full h-full flex items-center justify-center">
            <FiImage size={22} style={{ color: "var(--gray-8)" }} />
          </div>}

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "rgba(0,0,0,.52)", backdropFilter: "blur(3px)" }}
      >
        <Tip content="معاينة" side="bottom">
          <button
            onClick={e => { e.stopPropagation(); onPreview(index); }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110"
            style={{ background: "rgba(255,255,255,.22)", color: "#fff" }}
          >
            <FiEye size={15} />
          </button>
        </Tip>

        {editMode && (
          <>
            <Tip content="استبدال" side="bottom">
              <button
                onClick={e => { e.stopPropagation(); replaceRef.current?.click(); }}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110"
                style={{ background: "rgba(255,255,255,.22)", color: "#fff" }}
              >
                <FiEdit2 size={14} />
              </button>
            </Tip>
            <Tip content="حذف" side="bottom">
              <button
                onClick={e => { e.stopPropagation(); onDelete(index); }}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110"
                style={{ background: "rgba(220,38,38,.45)", color: "#fff" }}
              >
                <FiTrash2 size={14} />
              </button>
            </Tip>
          </>
        )}
      </div>

      {/* Index badge */}
      <div
        className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
        style={{ background: "rgba(0,0,0,.65)", color: "#fff" }}
      >
        {index + 1}
      </div>

      {/* Replace input */}
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onReplace(index, file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Logo card ─────────────────────────────────────────────────────────────────
function LogoCard({ shop, logoUuid, logoPreview, logoUploading, editMode, onFileChange, onDelete, onPreview }) {
  const logoRef = useRef(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const initials = getInitials(shop?.name);

  return (
    <>
      <DeleteConfirm
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف الشعار"
        description="هل أنت متأكد من حذف شعار المتجر؟ لن يتم الحذف النهائي حتى تحفظ التغييرات."
        onConfirm={() => { onDelete(); setDeleteOpen(false); }}
      />
      <input
        ref={logoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = ""; }}
      />

      {logoPreview ? (
        /* ── Has logo ── */
        <div
          className="flex items-center gap-4 p-5 rounded-2xl border transition-shadow"
          style={{
            background:  "var(--gray-a2)",
            borderColor: "var(--gray-a5)",
            boxShadow:   "0 1px 4px rgba(0,0,0,.06)",
          }}
        >
          {/* Preview thumbnail */}
          <div
            className="relative group w-[72px] h-[72px] rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer"
            style={{ border: "1px solid var(--gray-a5)", boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}
            onClick={onPreview}
          >
            <img src={logoPreview} alt="شعار المتجر" className="w-full h-full object-cover" />
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: "rgba(0,0,0,.45)" }}
            >
              <FiEye size={16} style={{ color: "#fff" }} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--gray-12)" }}>
              {shop?.name || "شعار المتجر"}
            </p>
            {logoUuid && (
              <p
                className="text-[11px] font-mono mt-0.5 truncate"
                style={{ color: "var(--gray-9)" }}
                title={logoUuid}
              >
                {logoUuid.slice(0, 16)}…
              </p>
            )}
            <span
              className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: "var(--green-a3)", color: "var(--green-11)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--green-9)" }} />
              مرفوع
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {logoUploading ? (
              <div className="flex items-center gap-2 px-2 py-1 text-xs" style={{ color: "var(--gray-10)" }}>
                <MiniSpinner /> جاري الرفع...
              </div>
            ) : (
              <>
                <Tip content="معاينة">
                  <button
                    onClick={onPreview}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: "var(--gray-a4)", color: "var(--gray-11)" }}
                  >
                    <FiEye size={13} />
                  </button>
                </Tip>
                {editMode && (
                  <>
                    <Tip content="تغيير الشعار">
                      <button
                        onClick={() => logoRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                      >
                        <FiUpload size={11} /> تغيير
                      </button>
                    </Tip>
                    <Tip content="حذف الشعار">
                      <button
                        onClick={() => setDeleteOpen(true)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                        style={{ background: "var(--red-a3)", color: "var(--red-9)" }}
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </Tip>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── No logo ── */
        <div
          className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 rounded-2xl border-2 border-dashed"
          style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}
        >
          <div
            className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0 select-none"
            style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)" }}
          >
            {initials}
          </div>
          <div className="flex-1 text-center sm:text-right">
            <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>لا يوجد شعار للمتجر</p>
            <p className="text-xs mt-0.5 mb-3 leading-relaxed" style={{ color: "var(--gray-9)" }}>
              يُعرض بديل نصي من الأحرف الأولى حتى يتم رفع الشعار
            </p>
            {editMode && (
              logoUploading ? (
                <div className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--gray-10)" }}>
                  <MiniSpinner /> جاري الرفع...
                </div>
              ) : (
                <button
                  onClick={() => logoRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                >
                  <FiUpload size={13} /> رفع شعار المتجر
                </button>
              )
            )}
          </div>
        </div>
      )}

      {logoUploading && (
        <div className="mt-2 px-1">
          <ProgressBar />
        </div>
      )}
    </>
  );
}

// ── Main MediaSection ─────────────────────────────────────────────────────────
export default function MediaSection({
  shop,
  shopId,
  editMode,
  logoUuid,        setLogoUuid,
  logoPreview,     setLogoPreview,
  logoUploading,   setLogoUploading,
  shopPhotos,      setShopPhotos,
  photosUploading, setPhotosUploading,
  showToast,
}) {
  const [previewOpen,     setPreviewOpen]     = useState(false);
  const [previewIdx,      setPreviewIdx]      = useState(0);
  const [logoPreviewOpen, setLogoPreviewOpen] = useState(false);
  const [deletePhotoIdx,  setDeletePhotoIdx]  = useState(null);

  // ── Logo upload ──────────────────────────────────────────────────────────────
  const handleLogoUpload = useCallback(async (file) => {
    setLogoUploading(true);
    try {
      const compressed = await compressImage(file);
      const res = await mediaApi.uploadForStore(compressed, shopId);
      setLogoUuid(res.data.id);
      setLogoPreview(res.data.originalFileUrl || res.data.mediumFileUrl || "");
    } catch (err) {
      showToast(err.message || "فشل رفع الشعار", "error");
    } finally {
      setLogoUploading(false);
    }
  }, [shopId, setLogoUuid, setLogoPreview, setLogoUploading, showToast]);

  // ── Photos upload ────────────────────────────────────────────────────────────
  const handlePhotosUpload = useCallback(async (files) => {
    setPhotosUploading(true);
    try {
      const results = await Promise.all(files.map(async file => {
        const compressed = await compressImage(file);
        const res = await mediaApi.uploadForStore(compressed, shopId);
        return { uuid: res.data.id, preview: res.data.originalFileUrl || res.data.mediumFileUrl || "" };
      }));
      setShopPhotos(prev => [...prev, ...results]);
    } catch (err) {
      showToast(err.message || "فشل رفع الصور", "error");
    } finally {
      setPhotosUploading(false);
    }
  }, [shopId, setShopPhotos, setPhotosUploading, showToast]);

  // ── Replace single photo ─────────────────────────────────────────────────────
  const handleReplacePhoto = useCallback(async (index, file) => {
    setPhotosUploading(true);
    try {
      const compressed = await compressImage(file);
      const res = await mediaApi.uploadForStore(compressed, shopId);
      const updated = { uuid: res.data.id, preview: res.data.originalFileUrl || res.data.mediumFileUrl || "" };
      setShopPhotos(prev => prev.map((p, i) => i === index ? updated : p));
    } catch (err) {
      showToast(err.message || "فشل استبدال الصورة", "error");
    } finally {
      setPhotosUploading(false);
    }
  }, [shopId, setShopPhotos, setPhotosUploading, showToast]);

  const handleDeletePhoto = (index) => {
    setShopPhotos(prev => prev.filter((_, i) => i !== index));
    setDeletePhotoIdx(null);
  };

  const logoImages = logoPreview ? [{ uuid: logoUuid, preview: logoPreview }] : [];

  return (
    <Tooltip.Provider delayDuration={250}>
      <style>{PROGRESS_STYLE}</style>

      {/* ── Dialogs ── */}
      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        images={shopPhotos}
        startIdx={previewIdx}
      />
      <PreviewDialog
        open={logoPreviewOpen}
        onOpenChange={setLogoPreviewOpen}
        images={logoImages}
        startIdx={0}
      />
      <DeleteConfirm
        open={deletePhotoIdx !== null}
        onOpenChange={open => { if (!open) setDeletePhotoIdx(null); }}
        title="حذف الصورة"
        description="هل أنت متأكد من حذف هذه الصورة؟ لن يتم الحذف النهائي حتى تحفظ التغييرات."
        onConfirm={() => handleDeletePhoto(deletePhotoIdx)}
      />

      <div className="space-y-8">

        {/* ── Logo ─────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FiCamera size={13} style={{ color: "var(--gray-9)" }} />
            <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--gray-9)" }}>
              شعار المتجر
            </h4>
          </div>
          <LogoCard
            shop={shop}
            logoUuid={logoUuid}
            logoPreview={logoPreview}
            logoUploading={logoUploading}
            editMode={editMode}
            onFileChange={handleLogoUpload}
            onDelete={() => { setLogoUuid(""); setLogoPreview(""); }}
            onPreview={() => { if (logoPreview) setLogoPreviewOpen(true); }}
          />
        </section>

        {/* ── Divider ── */}
        <div className="border-t" style={{ borderColor: "var(--gray-a4)" }} />

        {/* ── Photos ───────────────────────────────────────────────── */}
        <section className="space-y-4">

          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FiImage size={13} style={{ color: "var(--gray-9)" }} />
              <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--gray-9)" }}>
                صور المتجر
              </h4>
              {shopPhotos.length > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                >
                  {shopPhotos.length}
                </span>
              )}
            </div>

            {editMode && shopPhotos.length > 0 && (
              <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                {photosUploading ? "جاري الرفع..." : "مرّر على الصورة لإظهار الإجراءات"}
              </p>
            )}
          </div>

          {/* Upload progress */}
          {photosUploading && <ProgressBar />}

          {/* Grid */}
          {shopPhotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {shopPhotos.map((photo, i) => (
                <PhotoCard
                  key={photo.uuid || i}
                  photo={photo}
                  index={i}
                  editMode={editMode}
                  onPreview={idx => { setPreviewIdx(idx); setPreviewOpen(true); }}
                  onReplace={handleReplacePhoto}
                  onDelete={idx => setDeletePhotoIdx(idx)}
                />
              ))}
              {/* Uploading placeholder card */}
              {photosUploading && (
                <div
                  className="rounded-2xl flex items-center justify-center"
                  style={{
                    aspectRatio: "4/3",
                    background:  "var(--gray-a3)",
                    border:      "1px dashed var(--gray-a6)",
                  }}
                >
                  <MiniSpinner color="var(--blue-9)" size={18} />
                </div>
              )}
            </div>
          ) : !photosUploading && (
            /* Empty state */
            <div
              className="flex flex-col items-center gap-4 py-14 rounded-2xl"
              style={{
                background:  "var(--gray-a2)",
                border:      "1px solid var(--gray-a4)",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--gray-a4)" }}
              >
                <FiImage size={24} style={{ color: "var(--gray-7)" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  لا توجد صور للمتجر
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--gray-9)" }}>
                  أضف صوراً لعرض متجرك بصورة احترافية
                </p>
              </div>
            </div>
          )}

          {/* Dropzone — edit mode only */}
          {editMode && (
            <UploadDropzone onFiles={handlePhotosUpload} uploading={photosUploading} />
          )}
        </section>
      </div>
    </Tooltip.Provider>
  );
}
