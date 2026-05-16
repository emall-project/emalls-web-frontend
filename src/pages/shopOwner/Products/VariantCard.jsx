import * as Tooltip from "@radix-ui/react-tooltip";
import {
  FiCheck,
  FiCopy,
  FiImage,
  FiLayers,
  FiPlusCircle,
  FiStar,
  FiTrash2,
  FiUploadCloud,
  FiVideo,
} from "react-icons/fi";
import { getSelectedAttributeValue, sanitizePriceInput } from "./productFormUtils";

function Tip({ content, children }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          className="z-[80] rounded-lg px-2 py-1.5 text-xs font-medium shadow-lg"
          style={{ background: "var(--gray-12)", color: "var(--gray-1)" }}
        >
          {content}
          <Tooltip.Arrow style={{ fill: "var(--gray-12)" }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs" style={{ color: "var(--red-10)" }}>
      {message}
    </p>
  );
}

const inputStyle = {
  background: "var(--gray-1)",
  border: "1px solid var(--gray-a6)",
  borderRadius: 16,
  color: "var(--gray-12)",
  outline: "none",
  padding: "12px 14px",
  width: "100%",
};

export default function VariantCard({
  variant,
  index,
  isOnly,
  activeAttributes,
  mediaLibrary,
  errors = {},
  onFieldChange,
  onSetDefault,
  onRemove,
  onDuplicate,
  onToggleMedia,
  onAttributeChange,
  onUploadForVariant,
}) {
  const selectedCount = (variant.mediaIds || []).length;

  return (
    <Tooltip.Provider delayDuration={180}>
      <div
        className="overflow-hidden rounded-[28px] border"
        style={{
          background: variant.isDefault ? "linear-gradient(180deg, var(--blue-a2), var(--gray-1))" : "var(--gray-1)",
          borderColor: variant.isDefault ? "var(--blue-a5)" : "var(--gray-a5)",
        }}
      >
        <div
          className="flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-start lg:justify-between"
          style={{ borderColor: variant.isDefault ? "var(--blue-a5)" : "var(--gray-a4)" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: variant.isDefault ? "var(--blue-9)" : "var(--gray-a4)",
                color: "#fff",
              }}
            >
              <FiLayers size={18} />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                  المتغير {index + 1}
                </h3>
                {variant.isDefault ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                  >
                    <FiStar size={11} />
                    الافتراضي
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}
                >
                  {variant.basePrice ? `${Number(variant.basePrice).toLocaleString("ar-SA")} ₪` : "بدون سعر بعد"}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{
                    background: selectedCount ? "var(--green-a3)" : "var(--gray-a3)",
                    color: selectedCount ? "var(--green-11)" : "var(--gray-10)",
                  }}
                >
                  {selectedCount ? `${selectedCount} وسائط` : "بدون صور"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSetDefault}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold"
              style={{
                background: variant.isDefault ? "var(--blue-9)" : "var(--gray-a3)",
                color: variant.isDefault ? "#fff" : "var(--gray-11)",
              }}
            >
              {variant.isDefault ? <FiCheck size={12} /> : <FiStar size={12} />}
              {variant.isDefault ? "المتغير الافتراضي" : "تعيين كافتراضي"}
            </button>

            <Tip content="نسخ المتغير">
              <button
                type="button"
                onClick={onDuplicate}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border"
                style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)" }}
              >
                <FiCopy size={14} />
              </button>
            </Tip>

            {!isOnly ? (
              <Tip content="حذف المتغير">
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border"
                  style={{ borderColor: "var(--red-a6)", color: "var(--red-10)", background: "var(--red-a2)" }}
                >
                  <FiTrash2 size={14} />
                </button>
              </Tip>
            ) : null}
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                اسم المتغير
              </label>
              <input
                value={variant.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                placeholder="مثال: أحمر / كبير"
                style={inputStyle}
              />
              <FieldError message={errors.name} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                السعر الأساسي
              </label>
              <div className="relative">
                <input
                  value={variant.basePrice}
                  onChange={(event) => onFieldChange("basePrice", sanitizePriceInput(event.target.value))}
                  placeholder="0.00"
                  dir="ltr"
                  style={{ ...inputStyle, paddingLeft: 40, textAlign: "left" }}
                />
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold"
                  style={{ color: "var(--gray-8)" }}
                >
                  ₪
                </span>
              </div>
              <FieldError message={errors.basePrice} />
            </div>
          </div>

          {activeAttributes.length ? (
            <div
              className="space-y-4 rounded-[24px] border px-4 py-4"
              style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a4)" }}
            >
              <div className="space-y-1">
                <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                  خصائص المتغير
                </p>
                <p className="text-xs leading-6" style={{ color: "var(--gray-9)" }}>
                  حدّد قيمة كل خاصية حتى يبقى التمييز بين المتغيرات واضحًا في المتجر.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {activeAttributes.map((attribute) => (
                  <div key={attribute.id} className="space-y-1.5">
                    <label className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                      {attribute.name}
                    </label>
                    <select
                      value={String(getSelectedAttributeValue(variant, attribute.id))}
                      onChange={(event) => onAttributeChange(attribute.id, event.target.value)}
                      style={inputStyle}
                    >
                      <option value="">اختر القيمة</option>
                      {(attribute.options || []).map((option) => (
                        <option key={String(option.id)} value={String(option.id)}>
                          {option.value}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <FieldError message={errors.attributes} />
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                  وسائط هذا المتغير
                </p>
                <p className="text-xs leading-6" style={{ color: "var(--gray-9)" }}>
                  اختر الصور أو الفيديوهات المرتبطة بهذا المتغير، أو ارفع وسائط جديدة له مباشرة.
                </p>
              </div>

              <button
                type="button"
                onClick={onUploadForVariant}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
                style={{ background: "var(--blue-a2)", color: "var(--blue-11)" }}
              >
                <FiUploadCloud size={13} />
                رفع وسائط لهذا المتغير
              </button>
            </div>

            {mediaLibrary.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mediaLibrary.map((media) => {
                  const selected = variant.mediaIds.includes(media.id);
                  return (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => onToggleMedia(media.id)}
                      className="overflow-hidden rounded-[22px] border text-right transition-all"
                      style={{
                        background: selected ? "var(--blue-a2)" : "var(--gray-1)",
                        borderColor: selected ? "var(--blue-7)" : "var(--gray-a5)",
                        boxShadow: selected ? "0 14px 30px rgba(37,99,235,0.10)" : "none",
                      }}
                    >
                      <div className="relative aspect-[4/3]" style={{ background: "var(--gray-a3)" }}>
                        {media.previewUrl && media.mimeType?.startsWith("video/") ? (
                          <video src={media.previewUrl} className="h-full w-full object-cover" muted playsInline />
                        ) : media.previewUrl ? (
                          <img src={media.previewUrl} alt={media.fileName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <FiImage size={20} style={{ color: "var(--gray-8)" }} />
                          </div>
                        )}

                        <span
                          className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border"
                          style={{
                            background: selected ? "var(--blue-9)" : "rgba(255,255,255,.8)",
                            borderColor: selected ? "var(--blue-9)" : "var(--gray-a5)",
                            color: selected ? "#fff" : "var(--gray-9)",
                          }}
                        >
                          {selected ? <FiCheck size={13} /> : null}
                        </span>
                        {media.mimeType?.startsWith("video/") ? (
                          <span
                            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
                            style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}
                          >
                            <FiVideo size={11} />
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between gap-2 px-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                            {media.fileName}
                          </p>
                          <p className="text-xs" style={{ color: "var(--gray-9)" }}>
                            الترتيب #{media.sortOrder + 1}
                          </p>
                        </div>
                        {media.sortOrder === 0 ? (
                          <span
                            className="rounded-full px-2 py-1 text-[10px] font-bold"
                            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                          >
                            رئيسية
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                className="rounded-[24px] border border-dashed px-4 py-6 text-center"
                style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}
              >
                <FiPlusCircle size={18} style={{ color: "var(--gray-9)", margin: "0 auto 8px" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
                  لا توجد صور مرفوعة بعد
                </p>
                <p className="mt-1 text-xs leading-6" style={{ color: "var(--gray-9)" }}>
                  ارفع الصور من خطوة الوسائط أو من زر الرفع الخاص بهذا المتغير.
                </p>
              </div>
            )}

            <FieldError message={errors.media} />
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
