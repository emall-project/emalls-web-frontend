import { useRef } from "react";
import { FiLayers, FiPlus, FiSettings } from "react-icons/fi";
import VariantCard from "./VariantCard";

export default function VariantEditorStep({
  form,
  attributes,
  errors,
  onActiveAttributesChange,
  onAddVariant,
  onDuplicateVariant,
  onRemoveVariant,
  onSetDefaultVariant,
  onVariantFieldChange,
  onVariantAttributeChange,
  onVariantMediaToggle,
  onVariantUpload,
  attributeOptionSelections = {},
  onOptionSelectionToggle,
}) {
  const uploadRefs = useRef({});
  const activeAttributes = attributes.filter((attribute) =>
    form.activeAttributeIds.includes(String(attribute.id))
  );

  // Auto-generation is active when every active attribute has ≥1 option selected
  const isAutoGenerating =
    activeAttributes.length > 0 &&
    activeAttributes.every(
      (a) => (attributeOptionSelections[String(a.id)] || []).length > 0
    );

  return (
    <div className="space-y-5">
      <section
        className="space-y-5 rounded-[30px] border p-6"
        style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: "var(--blue-a2)", color: "var(--blue-11)" }}
            >
              <FiSettings size={18} />
            </div>

            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                خصائص المنتج والمتغيرات
              </h2>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--gray-9)" }}>
                اختر الخصائص التي تريد التمييز بها بين المتغيرات، ثم عيّن قيمة كل خاصية داخل بطاقات المتغيرات بالأسفل.
              </p>
            </div>
          </div>

          {!isAutoGenerating ? (
            <button
              type="button"
              onClick={onAddVariant}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: "var(--blue-9)", color: "#fff" }}
            >
              <FiPlus size={14} />
              إضافة متغير
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
              style={{ background: "var(--green-a3)", color: "var(--green-11)" }}
            >
              <FiLayers size={13} />
              {form.variants.length} متغير مُولَّد تلقائياً
            </span>
          )}
        </div>

        {activeAttributes.length ? (
          <div className="flex flex-wrap gap-2">
            {activeAttributes.map((attribute) => (
              <span
                key={attribute.id}
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
              >
                {attribute.name}
              </span>
            ))}
          </div>
        ) : (
          <div
            className="rounded-[22px] border border-dashed px-4 py-4 text-sm"
            style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)", color: "var(--gray-10)" }}
          >
            إذا كان المنتج يحتوي على متغير واحد فقط يمكنك ترك الخصائص غير محددة. عند إضافة أكثر من متغير، فعّل خاصية واحدة على الأقل مثل اللون أو المقاس.
          </div>
        )}

        {attributes.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {attributes.map((attribute) => {
              const active = form.activeAttributeIds.includes(String(attribute.id));

              return (
                <button
                  key={attribute.id}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? form.activeAttributeIds.filter((id) => id !== String(attribute.id))
                      : [...form.activeAttributeIds, String(attribute.id)];
                    onActiveAttributesChange(next);
                  }}
                  className="rounded-[22px] border px-4 py-3 text-right transition-all"
                  style={{
                    background: active ? "var(--blue-a2)" : "var(--gray-a2)",
                    borderColor: active ? "var(--blue-a6)" : "var(--gray-a4)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: active ? "var(--blue-11)" : "var(--gray-12)" }}
                      >
                        {attribute.name}
                      </p>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: active ? "var(--blue-10)" : "var(--gray-9)" }}
                      >
                        {(attribute.options || []).length} قيم متاحة
                      </p>
                    </div>

                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{
                        background: active ? "var(--blue-9)" : "var(--gray-a4)",
                        color: "#fff",
                      }}
                    >
                      {active ? "مفعّلة" : "اختيار"}
                    </span>
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
            <p className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
              لا توجد خصائص متاحة
            </p>
            <p className="mt-1 text-xs leading-6" style={{ color: "var(--gray-9)" }}>
              سيُنشأ المنتج بمتغيرات بسيطة دون خصائص ما دمت تعمل على متغير واحد فقط.
            </p>
          </div>
        )}

        {activeAttributes.length > 0 && onOptionSelectionToggle ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold" style={{ color: "var(--gray-11)" }}>
              اختر القيم المتاحة لكل خاصية — سيتم توليد المتغيرات تلقائياً
            </p>
            {activeAttributes.map((attribute) => {
              const selectedIds = attributeOptionSelections[String(attribute.id)] || [];
              return (
                <div key={attribute.id} className="space-y-2">
                  <p className="text-xs font-bold" style={{ color: "var(--gray-10)" }}>
                    {attribute.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(attribute.options || []).map((option) => {
                      const selected = selectedIds.includes(String(option.id));
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => onOptionSelectionToggle(String(attribute.id), String(option.id))}
                          className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                          style={{
                            background: selected ? "var(--blue-9)" : "var(--gray-a3)",
                            color: selected ? "#fff" : "var(--gray-11)",
                            border: selected ? "1px solid var(--blue-9)" : "1px solid var(--gray-a4)",
                          }}
                        >
                          {option.value}
                        </button>
                      );
                    })}
                    {!(attribute.options || []).length && (
                      <span className="text-xs" style={{ color: "var(--gray-9)" }}>
                        لا توجد قيم لهذه الخاصية
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {activeAttributes.length > 0 && !isAutoGenerating && (
              <p className="text-xs" style={{ color: "var(--amber-10)" }}>
                اختر قيمة واحدة على الأقل لكل خاصية لتوليد المتغيرات تلقائياً.
              </p>
            )}
          </div>
        ) : null}

        {errors.variants ? (
          <p className="text-xs" style={{ color: "var(--red-10)" }}>
            {errors.variants}
          </p>
        ) : null}
      </section>

      <section
        className="space-y-4 rounded-[30px] border p-6"
        style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ background: "var(--blue-a2)", color: "var(--blue-11)" }}
          >
            <FiLayers size={18} />
          </div>

          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
              بطاقات المتغيرات
            </h3>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--gray-9)" }}>
              أضف الاسم والسعر والصور لكل متغير، ثم اختر قيم الخصائص نفسها داخل كل بطاقة حتى يبقى الربط واضحًا ومباشرًا.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {form.variants.map((variant, index) => (
            <div key={variant.key}>
              <input
                ref={(node) => {
                  uploadRefs.current[variant.key] = node;
                }}
                type="file"
                accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  if (files.length) onVariantUpload(variant.key, files);
                  event.target.value = "";
                }}
              />

              <VariantCard
                variant={variant}
                index={index}
                isOnly={form.variants.length === 1}
                activeAttributes={activeAttributes}
                mediaLibrary={form.productMedia
                  .filter((media) => media.status === "uploaded" && media.id)
                  .map((media, mediaIndex) => ({ ...media, sortOrder: mediaIndex }))}
                errors={{
                  name: errors[`variants.${variant.key}.name`],
                  basePrice: errors[`variants.${variant.key}.basePrice`],
                  attributes: errors[`variants.${variant.key}.attributes`],
                  media: errors[`variants.${variant.key}.media`],
                }}
                onFieldChange={(field, value) => onVariantFieldChange(variant.key, field, value)}
                onSetDefault={() => onSetDefaultVariant(variant.key)}
                onRemove={() => onRemoveVariant(variant.key)}
                onDuplicate={() => onDuplicateVariant(variant.key)}
                onToggleMedia={(mediaId) => onVariantMediaToggle(variant.key, mediaId)}
                onAttributeChange={(attributeId, optionId) =>
                  onVariantAttributeChange(variant.key, attributeId, optionId)
                }
                onUploadForVariant={() => uploadRefs.current[variant.key]?.click()}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
