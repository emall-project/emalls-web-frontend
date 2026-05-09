import { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiImage,
  FiLoader,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { catalogApi, normalizeCatalogPage, unwrapCatalogPayload } from "../../../api/catalog";
import { getMediaPreviewUrl } from "../../../api/mediaManager";
import { MediaUuidField } from "../../../components/account/MediaUuidField";
import { buildApiFormError } from "../../../utils/apiErrors";
import { AGE_GROUP_OPTIONS, AUDIENCE_OPTIONS } from "../../shopOwner/Products/constants";

const RESOURCE_CONFIG = {
  categories: {
    title: "إدارة الفئات",
    singular: "فئة",
    api: catalogApi.categories,
    searchKey: "name",
    imageField: true,
    audienceFields: true,
    parentField: true,
    columns: ["image", "name", "slug", "audience", "parent", "status"],
    sortableFields: ["name", "slug", "targetedAudience", "ageGroup", "isActive", "depthLevel", "createdAt", "updatedAt"],
  },
  brands: {
    title: "إدارة البراندات",
    singular: "براند",
    api: catalogApi.brands,
    searchKey: "name",
    imageField: true,
    audienceFields: true,
    columns: ["image", "name", "slug", "audience", "status"],
    sortableFields: ["name", "slug", "targetedAudience", "ageGroup", "isActive", "createdAt", "updatedAt"],
  },
  attributes: {
    title: "إدارة الخصائص",
    singular: "خاصية",
    api: catalogApi.attributes,
    searchKey: "name",
    attributeFields: true,
    columns: ["name", "slug", "type", "options", "status"],
    sortableFields: ["name", "slug", "attributeType", "isActive", "createdAt", "updatedAt"],
  },
  tags: {
    title: "إدارة الوسوم",
    singular: "وسم",
    api: catalogApi.tags,
    searchKey: "name",
    tagOnly: true,
    columns: ["name"],
    sortableFields: ["name", "createdAt", "updatedAt"],
  },
};

const ATTRIBUTE_TYPE_OPTIONS = [{ value: "SELECT", label: "اختيار" }];

const ROOT_CATEGORY_OPTIONS = [
  { value: "true", label: "فئات رئيسية" },
  { value: "false", label: "فئات فرعية" },
];

const inputClass =
  "w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const inputStyle = {
  background: "var(--gray-a2)",
  borderColor: "var(--gray-a6)",
  color: "var(--gray-12)",
};

function useThemeContainer() {
  const [container] = useState(() => document.querySelector(".radix-themes") || document.body);

  return container;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function fileId(file) {
  return file?.id || file?.fileId ? String(file.id || file.fileId) : "";
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label || value || "—";
}

function nextSortState(current, field) {
  if (current.field !== field) {
    return { field, direction: "asc" };
  }

  if (current.direction === "asc") {
    return { field, direction: "desc" };
  }

  return { field: "", direction: "" };
}

function tableColumnCount(config) {
  return 7 + config.columns.filter((column) => column !== "name").length;
}

function defaultForm(type) {
  if (type === "tags") {
    return { id: null, name: "" };
  }

  if (type === "attributes") {
    return {
      id: null,
      name: "",
      slug: "",
      attributeType: "SELECT",
      isActive: true,
      options: [{ value: "", sortOrder: 1 }],
    };
  }

  return {
    id: null,
    name: "",
    slug: "",
    targetedAudience: "ALL",
    ageGroup: "ALL",
    isActive: true,
    imageId: "",
    image: null,
    parentId: "",
    audienceConfig: [],
  };
}

function itemToForm(type, item) {
  if (!item) return defaultForm(type);

  if (type === "tags") {
    return { id: item.id ?? null, name: item.name || "" };
  }

  if (type === "attributes") {
    return {
      id: item.id ?? null,
      name: item.name || "",
      slug: item.slug || "",
      attributeType: item.attributeType || "SELECT",
      isActive: item.isActive ?? true,
      options: item.options?.length
        ? item.options.map((option, index) => ({
            id: option.id,
            value: option.value || "",
            sortOrder: option.sortOrder ?? index + 1,
          }))
        : [{ value: "", sortOrder: 1 }],
    };
  }

  return {
    id: item.id ?? null,
    name: item.name || "",
    slug: item.slug || "",
    targetedAudience: item.targetedAudience || "ALL",
    ageGroup: item.ageGroup || "ALL",
    isActive: item.isActive ?? true,
    imageId: item.imageId || fileId(item.image),
    image: item.image || null,
    parentId: item.parentId != null ? String(item.parentId) : "",
    audienceConfig: (item.audienceConfig || []).map((config) => ({
      id: config.id,
      targetedAudience: config.targetedAudience || "ALL",
      ageGroup: config.ageGroup || "ALL",
      imageId: config.imageId || fileId(config.image),
      image: config.image || null,
    })),
  };
}

function buildPayload(type, form) {
  if (type === "tags") {
    return {
      ...(form.id ? { id: Number(form.id) } : {}),
      name: form.name.trim(),
    };
  }

  if (type === "attributes") {
    return {
      ...(form.id ? { id: Number(form.id) } : {}),
      name: form.name.trim(),
      slug: form.slug.trim(),
      attributeType: form.attributeType || "SELECT",
      isActive: !!form.isActive,
      options: form.options
        .filter((option) => option.value.trim())
        .map((option, index) => ({
          ...(option.id ? { id: option.id } : {}),
          value: option.value.trim(),
          sortOrder: Number(option.sortOrder) || index + 1,
        })),
    };
  }

  return {
    ...(form.id ? { id: Number(form.id) } : {}),
    name: form.name.trim(),
    slug: form.slug.trim(),
    targetedAudience: form.targetedAudience || "ALL",
    ageGroup: form.ageGroup || "ALL",
    isActive: !!form.isActive,
    imageId: form.imageId || fileId(form.image),
    ...(form.parentId ? { parentId: Number(form.parentId) } : {}),
    audienceConfig: (form.audienceConfig || [])
      .filter((config) => config.imageId || fileId(config.image))
      .map((config) => ({
        ...(config.id ? { id: config.id } : {}),
        targetedAudience: config.targetedAudience || "ALL",
        ageGroup: config.ageGroup || "ALL",
        imageId: config.imageId || fileId(config.image),
      })),
  };
}

function normalizeCategoryOption(category, parentId = null) {
  if (!category?.id) {
    return null;
  }

  return {
    ...category,
    id: category.id,
    name: category.name || `#${category.id}`,
    parentId: category.parentId ?? parentId ?? null,
  };
}

function normalizeCategoryOptions(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set();
  return items
    .map((category) => normalizeCategoryOption(category))
    .filter(Boolean)
    .filter((category) => {
      const id = String(category.id);
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
}

function flattenCategoryTree(nodes, parentId = null) {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes.flatMap((node) => {
    const normalized = normalizeCategoryOption(node, parentId);
    const children = flattenCategoryTree(node?.children || [], node?.id ?? parentId);
    return normalized ? [normalized, ...children] : children;
  });
}

function collectDescendantIds(categories, categoryId) {
  const rootId = categoryId != null ? String(categoryId) : "";
  const descendantIds = new Set();

  if (!rootId) {
    return descendantIds;
  }

  const childrenByParent = new Map();
  categories.forEach((category) => {
    if (category?.parentId == null) {
      return;
    }

    const parentId = String(category.parentId);
    const children = childrenByParent.get(parentId) || [];
    children.push(String(category.id));
    childrenByParent.set(parentId, children);
  });

  const stack = [...(childrenByParent.get(rootId) || [])];
  while (stack.length) {
    const id = stack.pop();
    if (!id || descendantIds.has(id)) {
      continue;
    }

    descendantIds.add(id);
    stack.push(...(childrenByParent.get(id) || []));
  }

  return descendantIds;
}

async function loadCategoryParentOptions() {
  let lastError = null;

  try {
    const response = await catalogApi.categories.all();
    const categories = normalizeCategoryOptions(unwrapCatalogPayload(response));
    if (categories.length) {
      return categories;
    }
  } catch (error) {
    lastError = error;
  }

  try {
    const response = await catalogApi.categories.page({ page: 0, size: 500 });
    const categories = normalizeCategoryOptions(normalizeCatalogPage(response).content);
    if (categories.length) {
      return categories;
    }
  } catch (error) {
    lastError = error;
  }

  try {
    const response = await catalogApi.categories.tree();
    return normalizeCategoryOptions(flattenCategoryTree(unwrapCatalogPayload(response)));
  } catch (error) {
    lastError = error;
  }

  throw lastError || new Error("فشل تحميل الفئات");
}

function normalizeConfig(config) {
  return {
    targetedAudience: config?.targetedAudience || "ALL",
    ageGroup: config?.ageGroup || "ALL",
    imageId: config?.imageId || fileId(config?.image),
  };
}

function configsEqual(left, right) {
  const a = normalizeConfig(left);
  const b = normalizeConfig(right);
  return a.targetedAudience === b.targetedAudience && a.ageGroup === b.ageGroup && a.imageId === b.imageId;
}

function StatusBadge({ active }) {
  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-xs font-bold"
      style={{
        background: active ? "var(--green-a3)" : "var(--red-a3)",
        color: active ? "var(--green-11)" : "var(--red-11)",
      }}
    >
      {active ? "نشط" : "غير نشط"}
    </span>
  );
}

function MediaThumb({ file }) {
  const url = getMediaPreviewUrl(file);
  return (
    <div
      className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border"
      style={{ background: "var(--gray-a3)", borderColor: "var(--gray-a5)" }}
    >
      {url ? (
        <img src={url} alt={file?.name || "media"} className="h-full w-full object-cover" />
      ) : (
        <FiImage size={16} style={{ color: "var(--gray-9)" }} />
      )}
    </div>
  );
}

function CatalogFormDialog({
  type,
  config,
  open,
  onOpenChange,
  item,
  parentOptions,
  parentLoading = false,
  parentError = "",
  onSaved,
}) {
  const [form, setForm] = useState(() => itemToForm(type, item));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const isEdit = !!item;
  const themeContainer = useThemeContainer();
  const currentImagePreview = getMediaPreviewUrl(form.image, "medium");
  const availableParentOptions = useMemo(() => {
    const descendantIds = collectDescendantIds(parentOptions, form.id);
    return parentOptions.filter((category) => {
      const categoryId = String(category.id);
      return categoryId !== String(form.id) && !descendantIds.has(categoryId);
    });
  }, [form.id, parentOptions]);

  useEffect(() => {
    if (open) {
      setForm(itemToForm(type, item));
      setFormError("");
      setFieldErrors({});
    }
  }, [item, open, type]);

  const set = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleNameChange = (value) => {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: previous.slug && isEdit ? previous.slug : slugify(value),
    }));
  };

  const addOption = () => {
    setForm((previous) => ({
      ...previous,
      options: [
        ...previous.options,
        { value: "", sortOrder: previous.options.length + 1 },
      ],
    }));
  };

  const addAudienceConfig = () => {
    setForm((previous) => ({
      ...previous,
      audienceConfig: [
        ...previous.audienceConfig,
        { targetedAudience: "ALL", ageGroup: "ALL", imageId: "", image: null },
      ],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setFieldErrors({});

    try {
      const payload = buildPayload(type, form);
      if (isEdit) {
        if (type === "categories") {
          const { audienceConfig = [], ...categoryPayload } = payload;
          await config.api.update(categoryPayload);

          const originalConfigs = item?.audienceConfig || [];
          const currentExistingIds = new Set(
            audienceConfig.filter((configItem) => configItem.id).map((configItem) => String(configItem.id))
          );

          const originalById = new Map(
            originalConfigs
              .filter((configItem) => configItem.id)
              .map((configItem) => [String(configItem.id), configItem])
          );
          const changedExisting = audienceConfig.filter((configItem) => {
            if (!configItem.id) return false;
            return !configsEqual(originalById.get(String(configItem.id)), configItem);
          });

          await Promise.all(
            originalConfigs
              .filter((configItem) => {
                if (!configItem.id) return false;
                const removed = !currentExistingIds.has(String(configItem.id));
                const changed = changedExisting.some((current) => String(current.id) === String(configItem.id));
                return removed || changed;
              })
              .map((configItem) => catalogApi.categories.deleteAudienceConfig(form.id, configItem.id))
          );
          await Promise.all(
            [
              ...audienceConfig.filter((configItem) => !configItem.id),
              ...changedExisting.map((configItem) => {
                const nextConfig = { ...configItem };
                delete nextConfig.id;
                return nextConfig;
              }),
            ].map((configItem) => catalogApi.categories.addAudienceConfig(form.id, configItem))
          );
        } else {
          await config.api.update(payload);
        }
      } else {
        await config.api.create(payload);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      const mapped = buildApiFormError(error, {
        imageId: "imageId",
        "options.value": "options",
        "audienceConfig.imageId": "audienceConfig",
      });
      setFormError(mapped.message);
      setFieldErrors(mapped.fieldErrors);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className= "fixed inset-0 z-[9990] bg-black/50" />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-0 z-[9991] flex items-center justify-center p-4"
          aria-describedby={undefined}
        >
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}
          >
            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{ borderColor: "var(--gray-a6)" }}
            >
              <Dialog.Title className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>
                {isEdit ? `تعديل ${config.singular}` : `إضافة ${config.singular}`}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded-lg p-2" style={{ color: "var(--gray-11)" }}>
                  <FiX />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {formError ? (
                <div
                  className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
                  style={{
                    background: "var(--red-a3)",
                    borderColor: "var(--red-a6)",
                    color: "var(--red-11)",
                  }}
                >
                  <FiAlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
                    الاسم
                  </label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    value={form.name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    required
                  />
                  {fieldErrors.name ? <FieldError text={fieldErrors.name} /> : null}
                </div>

                {!config.tagOnly ? (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
                      الرابط المختصر
                    </label>
                    <input
                      className={inputClass}
                      style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
                      value={form.slug}
                      onChange={(event) => set("slug", event.target.value)}
                      required
                    />
                    {fieldErrors.slug ? <FieldError text={fieldErrors.slug} /> : null}
                  </div>
                ) : null}
              </div>

              {config.imageField ? (
                <div className="space-y-3">
                  {currentImagePreview ? (
                    <div
                      className="overflow-hidden rounded-2xl border"
                      style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a6)" }}
                    >
                      <img
                        src={currentImagePreview}
                        alt={form.name || "الصورة الحالية"}
                        className="h-44 w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <MediaUuidField
                    label="الصورة"
                    value={form.imageId}
                    file={form.image}
                    onChange={(value) => set("imageId", value)}
                    onFileChange={(file) => set("image", file)}
                    mode="admin"
                    required
                    error={fieldErrors.imageId}
                  />
                </div>
              ) : null}

              {config.audienceFields ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <SelectField label="الجمهور" value={form.targetedAudience} onChange={(value) => set("targetedAudience", value)} options={AUDIENCE_OPTIONS} />
                  <SelectField label="الفئة العمرية" value={form.ageGroup} onChange={(value) => set("ageGroup", value)} options={AGE_GROUP_OPTIONS} />
                  <ToggleField label="نشط" value={form.isActive} onChange={(value) => set("isActive", value)} />
                </div>
              ) : null}

              {config.parentField ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
                    الفئة الأب
                  </label>
                  <select
                    className={inputClass}
                    style={inputStyle}
                    value={form.parentId}
                    onChange={(event) => set("parentId", event.target.value)}
                    disabled={parentLoading}
                  >
                    <option value="">
                      {parentLoading ? "جاري تحميل الفئات..." : "بدون فئة أب"}
                    </option>
                    {availableParentOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {parentError ? <FieldError text={parentError} /> : null}
                  {!parentLoading && !parentError && availableParentOptions.length === 0 ? (
                    <p className="mt-1 text-xs" style={{ color: "var(--gray-10)" }}>
                      لا توجد فئات متاحة.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {config.attributeFields ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                      قيم الخاصية
                    </span>
                    <button
                      type="button"
                      onClick={addOption}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                      style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                    >
                      <FiPlus size={13} />
                      إضافة قيمة
                    </button>
                  </div>
                  {form.options.map((option, index) => (
                    <div key={option.id || index} className="grid grid-cols-[1fr_90px_36px] gap-2">
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={option.value}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            options: previous.options.map((current, currentIndex) =>
                              currentIndex === index ? { ...current, value: event.target.value } : current
                            ),
                          }))
                        }
                        placeholder={`قيمة ${index + 1}`}
                      />
                      <input
                        className={inputClass}
                        style={inputStyle}
                        type="number"
                        value={option.sortOrder}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            options: previous.options.map((current, currentIndex) =>
                              currentIndex === index ? { ...current, sortOrder: event.target.value } : current
                            ),
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((previous) => ({
                            ...previous,
                            options: previous.options.filter((_, currentIndex) => currentIndex !== index),
                          }))
                        }
                        disabled={form.options.length <= 1}
                        className="rounded-xl border disabled:opacity-40"
                        style={{ borderColor: "var(--gray-a6)", color: "var(--red-9)" }}
                      >
                        <FiX className="mx-auto" />
                      </button>
                    </div>
                  ))}
                  {fieldErrors.options ? <FieldError text={fieldErrors.options} /> : null}
                </div>
              ) : null}

              {type === "categories" ? (
                <div className="space-y-3 rounded-2xl border p-4" style={{ borderColor: "var(--gray-a6)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: "var(--gray-12)" }}>
                      صور الجمهور للفئة
                    </span>
                    <button
                      type="button"
                      onClick={addAudienceConfig}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                      style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                    >
                      <FiPlus size={13} />
                      إضافة إعداد
                    </button>
                  </div>
                  <p className="text-xs leading-6" style={{ color: "var(--gray-10)" }}>
                    ملاحظة: الخلفية لا توفر تحديثًا مباشرًا لإعداد جمهور موجود؛ عند تعديل إعداد محفوظ سيتم حذفه وإعادة إضافته بالقيم الجديدة.
                  </p>

                  {form.audienceConfig.length ? (
                    form.audienceConfig.map((configItem, index) => (
                      <div key={configItem.id || index} className="space-y-3 rounded-xl border p-3" style={{ borderColor: "var(--gray-a5)" }}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <SelectField
                            label="الجمهور"
                            value={configItem.targetedAudience}
                            onChange={(value) =>
                              setForm((previous) => ({
                                ...previous,
                                audienceConfig: previous.audienceConfig.map((current, currentIndex) =>
                                  currentIndex === index ? { ...current, targetedAudience: value } : current
                                ),
                              }))
                            }
                            options={AUDIENCE_OPTIONS}
                          />
                          <SelectField
                            label="الفئة العمرية"
                            value={configItem.ageGroup}
                            onChange={(value) =>
                              setForm((previous) => ({
                                ...previous,
                                audienceConfig: previous.audienceConfig.map((current, currentIndex) =>
                                  currentIndex === index ? { ...current, ageGroup: value } : current
                                ),
                              }))
                            }
                            options={AGE_GROUP_OPTIONS}
                          />
                        </div>
                        <MediaUuidField
                          label="الصورة"
                          value={configItem.imageId}
                          file={configItem.image}
                          onChange={(value) =>
                            setForm((previous) => ({
                              ...previous,
                              audienceConfig: previous.audienceConfig.map((current, currentIndex) =>
                                currentIndex === index ? { ...current, imageId: value } : current
                              ),
                            }))
                          }
                          onFileChange={(file) =>
                            setForm((previous) => ({
                              ...previous,
                              audienceConfig: previous.audienceConfig.map((current, currentIndex) =>
                                currentIndex === index ? { ...current, image: file } : current
                              ),
                            }))
                          }
                          mode="admin"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((previous) => ({
                              ...previous,
                              audienceConfig: previous.audienceConfig.filter((_, currentIndex) => currentIndex !== index),
                            }))
                          }
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                          style={{ background: "var(--red-a3)", color: "var(--red-11)" }}
                        >
                          <FiTrash2 size={13} />
                          حذف الإعداد
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                      لا توجد إعدادات جمهور إضافية.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div
              className="flex items-center justify-end gap-3 border-t px-6 py-4"
              style={{ borderColor: "var(--gray-a6)" }}
            >
              <Dialog.Close asChild>
                <button type="button" className="rounded-xl border px-4 py-2 text-sm" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                  إلغاء
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--blue-9)", color: "#fff" }}
              >
                {saving ? <FiLoader className="animate-spin" /> : null}
                حفظ
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FieldError({ text }) {
  return <p className="mt-1 text-xs" style={{ color: "var(--red-9)" }}>{text}</p>;
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
        {label}
      </label>
      <select className={inputClass} style={inputStyle} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange }) {
  return (
    <label className="flex h-full items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
      <span className="text-sm font-semibold">{label}</span>
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export default function CatalogMetadataPage({ type }) {
  const config = RESOURCE_CONFIG[type] || RESOURCE_CONFIG.categories;
  const [items, setItems] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [targetedAudience, setTargetedAudience] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [parentId, setParentId] = useState("");
  const [isRoot, setIsRoot] = useState("");
  const [attributeType, setAttributeType] = useState("");
  const [sort, setSort] = useState({ field: "", direction: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parentLoading, setParentLoading] = useState(false);
  const [parentError, setParentError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const categoryById = useMemo(
    () => new Map(allCategories.map((category) => [String(category.id), category])),
    [allCategories]
  );

  const params = useMemo(() => {
    const next = { page, size: 20 };
    if (search.trim()) next[config.searchKey] = search.trim();
    if (!config.tagOnly && isActive !== "") next.isActive = isActive;
    if (config.audienceFields && targetedAudience) next.targetedAudience = targetedAudience;
    if (config.audienceFields && ageGroup) next.ageGroup = ageGroup;
    if (type === "categories" && parentId) next.parentId = parentId;
    if (type === "categories" && isRoot !== "") next.isRoot = isRoot;
    if (type === "attributes" && attributeType) next.type = attributeType;
    if (sort.field) next.sort = `${sort.field},${sort.direction}`;
    return next;
  }, [
    ageGroup,
    attributeType,
    config.audienceFields,
    config.searchKey,
    config.tagOnly,
    isActive,
    isRoot,
    page,
    parentId,
    search,
    sort.direction,
    sort.field,
    targetedAudience,
    type,
  ]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await config.api.page(params);
      const normalized = normalizeCatalogPage(response);
      setItems(normalized.content);
      setTotalPages(normalized.totalPages || 1);
    } catch (requestError) {
      setError(requestError.message || "فشل تحميل البيانات");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [config.api, params]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const fetchParentCategories = useCallback(async () => {
    if (type !== "categories") {
      setAllCategories([]);
      setParentError("");
      return;
    }

    setParentLoading(true);
    setParentError("");

    try {
      const categories = await loadCategoryParentOptions();
      setAllCategories(categories);
    } catch (requestError) {
      setAllCategories([]);
      setParentError(requestError?.message || "فشل تحميل الفئات");
    } finally {
      setParentLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchParentCategories();
  }, [fetchParentCategories, dialogOpen]);

  const openCreate = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`حذف ${config.singular} "${item.name}"؟`)) return;
    setDeletingId(item.id);
    try {
      await config.api.delete(item.id);
      fetchItems();
    } catch (requestError) {
      setError(requestError.message || "فشل الحذف");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (field) => {
    if (!config.sortableFields.includes(field)) {
      return;
    }

    setSort((current) => nextSortState(current, field));
    setPage(0);
  };

  const clearFilters = () => {
    setSearch("");
    setIsActive("");
    setTargetedAudience("");
    setAgeGroup("");
    setParentId("");
    setIsRoot("");
    setAttributeType("");
    setSort({ field: "", direction: "" });
    setPage(0);
  };

  const hasActiveFilters =
    search ||
    isActive !== "" ||
    targetedAudience ||
    ageGroup ||
    parentId ||
    isRoot !== "" ||
    attributeType ||
    sort.field;
  const columnCount = tableColumnCount(config);

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>{config.title}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-11)" }}>إدارة بيانات الكتالوج المستخدمة في المنتجات والبحث.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          style={{ background: "var(--blue-9)", color: "#fff" }}
        >
          <FiPlus />
          إضافة {config.singular}
        </button>
      </div>

      <div className="rounded-2xl border p-4" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--gray-9)" }} />
            <input
              className={inputClass}
              style={{ ...inputStyle, paddingRight: 38 }}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="بحث بالاسم"
            />
          </div>
          {!config.tagOnly ? (
            <select
              className={inputClass}
              style={{ ...inputStyle, width: 160 }}
              value={isActive}
              onChange={(event) => {
                setIsActive(event.target.value);
                setPage(0);
              }}
            >
              <option value="">كل الحالات</option>
              <option value="true">نشط</option>
              <option value="false">غير نشط</option>
            </select>
          ) : null}
          {config.audienceFields ? (
            <select
              className={inputClass}
              style={{ ...inputStyle, width: 170 }}
              value={targetedAudience}
              onChange={(event) => {
                setTargetedAudience(event.target.value);
                setPage(0);
              }}
            >
              <option value="">كل الجمهور</option>
              {AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          {config.audienceFields ? (
            <select
              className={inputClass}
              style={{ ...inputStyle, width: 180 }}
              value={ageGroup}
              onChange={(event) => {
                setAgeGroup(event.target.value);
                setPage(0);
              }}
            >
              <option value="">كل الأعمار</option>
              {AGE_GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          {type === "categories" ? (
            <select
              className={inputClass}
              style={{ ...inputStyle, width: 190 }}
              value={parentId}
              onChange={(event) => {
                setParentId(event.target.value);
                setPage(0);
              }}
              disabled={parentLoading}
            >
              <option value="">كل الفئات الأب</option>
              {allCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          ) : null}
          {type === "categories" ? (
            <select
              className={inputClass}
              style={{ ...inputStyle, width: 170 }}
              value={isRoot}
              onChange={(event) => {
                setIsRoot(event.target.value);
                setPage(0);
              }}
            >
              <option value="">كل المستويات</option>
              {ROOT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          {type === "attributes" ? (
            <select
              className={inputClass}
              style={{ ...inputStyle, width: 160 }}
              value={attributeType}
              onChange={(event) => {
                setAttributeType(event.target.value);
                setPage(0);
              }}
            >
              <option value="">كل الأنواع</option>
              {ATTRIBUTE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: "var(--red-a3)", color: "var(--red-11)" }}
            >
              <FiX />
              مسح
            </button>
          ) : null}
          <button
            type="button"
            onClick={fetchItems}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
            style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}
          >
            <FiRefreshCw />
            تحديث
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--red-a3)", borderColor: "var(--red-a6)", color: "var(--red-11)" }}>
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--gray-1)", borderColor: "var(--gray-a7)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 1280 }}>
            <thead style={{ background: "var(--gray-a2)", color: "var(--gray-11)" }}>
              <tr>
                {config.columns.includes("image") ? <Th>الصورة</Th> : null}
                <SortableTh field="name" sort={sort} onSort={handleSort}>الاسم</SortableTh>
                {config.columns.includes("slug") ? <SortableTh field="slug" sort={sort} onSort={handleSort}>الرابط</SortableTh> : null}
                {config.columns.includes("audience") ? <SortableTh field="targetedAudience" sort={sort} onSort={handleSort}>الجمهور</SortableTh> : null}
                {config.columns.includes("parent") ? <Th>الأب</Th> : null}
                {config.columns.includes("type") ? <SortableTh field="attributeType" sort={sort} onSort={handleSort}>النوع</SortableTh> : null}
                {config.columns.includes("options") ? <Th>القيم</Th> : null}
                {config.columns.includes("status") ? <SortableTh field="isActive" sort={sort} onSort={handleSort}>الحالة</SortableTh> : null}
                <Th>المنتجات</Th>
                <SortableTh field="createdAt" sort={sort} onSort={handleSort}>تاريخ الإنشاء</SortableTh>
                <Th>أنشئ بواسطة</Th>
                <SortableTh field="updatedAt" sort={sort} onSort={handleSort}>آخر تحديث</SortableTh>
                <Th>حُدث بواسطة</Th>
                <Th>الإجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columnCount} className="py-14 text-center" style={{ color: "var(--gray-10)" }}>
                    <FiLoader className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item.id} className="border-t" style={{ borderColor: "var(--gray-a5)", color: "var(--gray-12)" }}>
                    {config.columns.includes("image") ? <Td><MediaThumb file={item.image} /></Td> : null}
                    <Td>
                      <div className="font-semibold">{item.name}</div>
                      {item.id != null ? <div className="text-xs" style={{ color: "var(--gray-10)" }}>#{item.id}</div> : null}
                    </Td>
                    {config.columns.includes("slug") ? <Td><span dir="ltr">{item.slug}</span></Td> : null}
                    {config.columns.includes("audience") ? (
                      <Td>
                        {labelFor(AUDIENCE_OPTIONS, item.targetedAudience || "ALL")} / {labelFor(AGE_GROUP_OPTIONS, item.ageGroup || "ALL")}
                      </Td>
                    ) : null}
                    {config.columns.includes("parent") ? (
                      <Td>
                        {item.parentId
                          ? categoryById.get(String(item.parentId))?.name || `#${item.parentId}`
                          : "—"}
                      </Td>
                    ) : null}
                    {config.columns.includes("type") ? <Td>{labelFor(ATTRIBUTE_TYPE_OPTIONS, item.attributeType || "SELECT")}</Td> : null}
                    {config.columns.includes("options") ? <Td>{item.options?.length || 0}</Td> : null}
                    {config.columns.includes("status") ? <Td><StatusBadge active={item.isActive} /></Td> : null}
                    <Td>{item.productsCount ?? 0}</Td>
                    <Td>{formatDateTime(item.createdAt)}</Td>
                    <Td>{item.createdBy || "—"}</Td>
                    <Td>{formatDateTime(item.updatedAt)}</Td>
                    <Td>{item.updatedBy || "—"}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openEdit(item)} className="rounded-lg border p-2" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => deleteItem(item)}
                          className="rounded-lg border p-2 disabled:opacity-50"
                          style={{ borderColor: "var(--red-a6)", color: "var(--red-11)" }}
                        >
                          {deletingId === item.id ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columnCount} className="py-14 text-center" style={{ color: "var(--gray-10)" }}>
                    لا توجد بيانات.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--gray-a6)" }}>
            <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page <= 0} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>السابق</button>
            <span className="text-sm" style={{ color: "var(--gray-11)" }}>صفحة {page + 1} من {totalPages}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={page >= totalPages - 1} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40" style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>التالي</button>
          </div>
        ) : null}
      </div>

      <CatalogFormDialog
        type={type}
        config={config}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        parentOptions={allCategories}
        parentLoading={parentLoading}
        parentError={parentError}
        onSaved={() => {
          fetchItems();
          fetchParentCategories();
        }}
      />
    </div>
  );
}

function Th({ children }) {
  return <th className="px-5 py-3 text-right text-xs font-semibold">{children}</th>;
}

function SortableTh({ field, sort, onSort, children }) {
  const active = sort.field === field;
  const Icon = sort.direction === "asc" ? FiChevronUp : FiChevronDown;

  return (
    <Th>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 font-semibold"
        style={{ color: active ? "var(--blue-11)" : "inherit" }}
      >
        <span>{children}</span>
        {active ? <Icon size={13} /> : null}
      </button>
    </Th>
  );
}

function Td({ children }) {
  return <td className="px-5 py-4 align-middle">{children}</td>;
}
