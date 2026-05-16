import { AGE_GROUP_OPTIONS, AUDIENCE_OPTIONS, PRODUCT_FORM_STEPS } from "./constants";

export const MAX_PRODUCT_IMAGES = 10;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];
export const ACCEPTED_MEDIA_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];

const AUDIENCE_VALUES = new Set(AUDIENCE_OPTIONS.map((option) => option.value));
const AGE_GROUP_VALUES = new Set(AGE_GROUP_OPTIONS.map((option) => option.value));

export function createVariant(isDefault = false, mediaIds = []) {
  return {
    key: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    basePrice: "",
    isDefault,
    attributes: [],
    mediaIds: [...mediaIds],
  };
}

export function createInitialProductForm() {
  return {
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    isActive: true,
    categoryId: "",
    brandId: "",
    targetedAudience: "ALL",
    ageGroup: "ALL",
    tags: [],
    activeAttributeIds: [],
    attributeOptionSelections: {},
    productMedia: [],
    variants: [createVariant(true)],
  };
}

// Returns a new variants array (Cartesian product of selected options), or null if conditions aren't met.
// Preserves existing variant data (name/price/media) when the attribute combo matches.
export function buildCartesianVariants(activeAttrIds, optionSelections, attrsList, existingVariants = []) {
  if (!activeAttrIds.length) return null;

  // Only generate when every active attribute has at least one option selected
  const allHaveSelections = activeAttrIds.every(
    (id) => (optionSelections[String(id)] || []).length > 0
  );
  if (!allHaveSelections) return null;

  const groups = activeAttrIds.map((attrId) => {
    const attr = attrsList.find((a) => String(a.id) === String(attrId));
    if (!attr) return null;
    const selectedIds = new Set(optionSelections[String(attrId)] || []);
    const opts = (attr.options || []).filter((o) => selectedIds.has(String(o.id)));
    return opts.length ? { attrId: String(attrId), opts } : null;
  }).filter(Boolean);

  if (!groups.length) return null;

  // Build Cartesian product
  const combos = groups.reduce((acc, { attrId, opts }) => {
    if (!acc.length) return opts.map((o) => [{ attrId, optionId: String(o.id), value: o.value }]);
    return acc.flatMap((combo) =>
      opts.map((o) => [...combo, { attrId, optionId: String(o.id), value: o.value }])
    );
  }, []);

  let hasDefault = false;
  const variants = combos.map((combo) => {
    const autoName = combo.map((c) => c.value).join(" / ");
    const attributes = combo.map((c) => ({ attributeId: c.attrId, optionId: c.optionId }));

    const existing = existingVariants.find((v) => {
      const va = v.attributes || [];
      return (
        va.length === attributes.length &&
        attributes.every((a) =>
          va.some(
            (x) =>
              String(x.attributeId) === String(a.attributeId) &&
              String(x.optionId) === String(a.optionId)
          )
        )
      );
    });

    if (existing) {
      if (existing.isDefault) hasDefault = true;
      return { ...existing, attributes };
    }

    return {
      key: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: autoName,
      basePrice: "",
      isDefault: false,
      attributes,
      mediaIds: [],
    };
  });

  if (!hasDefault && variants.length > 0) variants[0] = { ...variants[0], isDefault: true };
  return variants;
}

export function slugifyProductName(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-\u0600-\u06FF]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function sanitizePriceInput(value) {
  const raw = String(value ?? "");
  const next = raw.replace(/[^\d.]/g, "");
  const parts = next.split(".");
  if (parts.length <= 2) return next;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

export function moveArrayItem(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function extractCollection(response) {
  if (!response) return [];
  const raw = response?.data ?? response;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.content)) return raw.data.content;
  return [];
}

export function getOptionLabel(options, value, fallback = "غير محدد") {
  if (value === undefined || value === null || value === "") return fallback;
  const found = options.find((option) => String(option.value) === String(value));
  return found?.label || fallback;
}

export function getSelectedAttributeValue(variant, attributeId) {
  return (variant.attributes || []).find(
    (attribute) => String(attribute.attributeId) === String(attributeId)
  )?.optionId || "";
}

export function buildMediaPayload(mediaLibrary, selectedMediaIds) {
  const selectedIdSet = new Set((selectedMediaIds || []).map(String));

  return mediaLibrary
    .filter((item) => item.id && selectedIdSet.has(String(item.id)))
    .map((item, index) => ({
      mediumId: item.id,
      sortOrder: index,
    }));
}

export function buildCreateProductPayload(form, overrideIsActive = null) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    targetedAudience: form.targetedAudience,
    ageGroup: form.ageGroup,
    isActive: overrideIsActive ?? form.isActive,
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    categoryId: Number(form.categoryId),
    brandId: Number(form.brandId),
    tags: form.tags.map((tag) => ({ name: tag.name.trim() })),
    variants: form.variants.map((variant) => ({
      name: variant.name.trim(),
      basePrice: Number(variant.basePrice),
      isDefault: Boolean(variant.isDefault),
      attributes: (variant.attributes || []).map((attribute) => ({
        attributeId: Number(attribute.attributeId),
        optionId: Number(attribute.optionId),
      })),
      media: buildMediaPayload(form.productMedia, variant.mediaIds),
    })),
  };
}

function validateParentCompatibility(value, parentValue) {
  if (!parentValue || parentValue === "ALL") return true;
  return value === parentValue;
}

function buildStepErrorMap(errors) {
  const map = {
    basic: false,
    classification: false,
    media: false,
    variants: false,
    preview: false,
  };

  Object.keys(errors).forEach((field) => {
    if (["name", "slug", "shortDescription", "description", "isActive"].includes(field)) map.basic = true;
    if (["categoryId", "brandId", "targetedAudience", "ageGroup", "tags"].includes(field)) map.classification = true;
    if (field === "productMedia") map.media = true;
    if (field.startsWith("variants.") || field === "variants") map.variants = true;
  });

  return map;
}

export function validateProductForm(form, categories = [], brands = []) {
  const errors = {};
  const trimmedName = form.name.trim();
  const trimmedSlug = form.slug.trim();
  const trimmedShortDescription = form.shortDescription.trim();
  const trimmedDescription = form.description.trim();
  const uploadedMedia = (form.productMedia || []).filter((item) => item.status === "uploaded" && item.id);

  if (!trimmedName) errors.name = "اسم المنتج مطلوب";
  else if (trimmedName.length < 3 || trimmedName.length > 50) errors.name = "اسم المنتج يجب أن يكون بين 3 و50 حرفًا";

  if (!trimmedSlug) errors.slug = "الرابط المختصر مطلوب";
  else if (trimmedSlug.length < 3 || trimmedSlug.length > 50) errors.slug = "الرابط المختصر يجب أن يكون بين 3 و50 حرفًا";
  else if (/\s/.test(trimmedSlug)) errors.slug = "الرابط المختصر لا يجب أن يحتوي على مسافات";
  else if (!/^(?:[a-z0-9-]|[\u0600-\u06FF])+$/u.test(trimmedSlug)) errors.slug = "استخدم أحرفًا عربية أو إنجليزية صغيرة وأرقامًا وشرطة فقط";
  else if (!/^(?:[a-z]|[\u0600-\u06FF]).*(?:[a-z]|[\u0600-\u06FF])$/u.test(trimmedSlug)) {
    errors.slug = "يجب أن يبدأ الرابط وينتهي بحرف";
  }

  if (!trimmedShortDescription) errors.shortDescription = "الوصف القصير مطلوب";
  else if (trimmedShortDescription.length < 3 || trimmedShortDescription.length > 100) {
    errors.shortDescription = "الوصف القصير يجب أن يكون بين 3 و100 حرف";
  }

  if (!trimmedDescription) errors.description = "الوصف الكامل مطلوب";
  else if (trimmedDescription.length < 3 || trimmedDescription.length > 2500) {
    errors.description = "الوصف الكامل يجب أن يكون بين 3 و2500 حرف";
  }

  if (!form.categoryId) errors.categoryId = "اختر الفئة";
  if (!form.brandId) errors.brandId = "اختر الماركة";

  if (!form.targetedAudience || !AUDIENCE_VALUES.has(form.targetedAudience)) {
    errors.targetedAudience = "اختر الجمهور المستهدف";
  }

  if (!form.ageGroup || !AGE_GROUP_VALUES.has(form.ageGroup)) {
    errors.ageGroup = "اختر الفئة العمرية";
  }

  const selectedCategory = categories.find((category) => String(category.id) === String(form.categoryId));
  const selectedBrand = brands.find((brand) => String(brand.id) === String(form.brandId));

  if (
    selectedCategory &&
    !validateParentCompatibility(form.targetedAudience, selectedCategory.targetedAudience)
  ) {
    errors.targetedAudience = "الجمهور المختار لا يطابق إعدادات الفئة";
  }

  if (selectedBrand && !validateParentCompatibility(form.targetedAudience, selectedBrand.targetedAudience)) {
    errors.targetedAudience = "الجمهور المختار لا يطابق إعدادات الماركة";
  }

  if (selectedCategory && !validateParentCompatibility(form.ageGroup, selectedCategory.ageGroup)) {
    errors.ageGroup = "الفئة العمرية لا تطابق إعدادات الفئة";
  }

  if (selectedBrand && !validateParentCompatibility(form.ageGroup, selectedBrand.ageGroup)) {
    errors.ageGroup = "الفئة العمرية لا تطابق إعدادات الماركة";
  }

  if (uploadedMedia.length === 0) {
    errors.productMedia = "أضف صورة واحدة على الأقل قبل متابعة النشر";
  } else if (uploadedMedia.length > MAX_PRODUCT_IMAGES) {
    errors.productMedia = `يمكنك رفع ${MAX_PRODUCT_IMAGES} صور كحد أقصى`;
  }

  if (!form.variants?.length) {
    errors.variants = "أضف متغيرًا واحدًا على الأقل";
  } else {
    const defaultVariants = form.variants.filter((variant) => variant.isDefault);
    if (defaultVariants.length !== 1) {
      errors.variants = "يجب تحديد متغير افتراضي واحد فقط";
    }

    if (form.variants.length > 1 && form.activeAttributeIds.length === 0) {
      errors.variants = "عند وجود أكثر من متغير يجب تحديد خاصية واحدة على الأقل";
    }

    form.variants.forEach((variant) => {
      const prefix = `variants.${variant.key}`;
      if (!variant.name.trim()) errors[`${prefix}.name`] = "اسم المتغير مطلوب";

      const price = Number(variant.basePrice);
      if (variant.basePrice === "" || Number.isNaN(price) || price <= 0) {
        errors[`${prefix}.basePrice`] = "أدخل سعرًا أساسيًا أكبر من صفر";
      }

      const variantMedia = buildMediaPayload(form.productMedia, variant.mediaIds);
      if (!variantMedia.length) {
        errors[`${prefix}.media`] = "اختر صورة واحدة على الأقل لهذا المتغير";
      }

      if (form.variants.length > 1) {
        const assignedAttributes = (variant.attributes || []).filter(
          (attribute) =>
            form.activeAttributeIds.includes(String(attribute.attributeId)) && attribute.optionId
        );

        if (!assignedAttributes.length) {
          errors[`${prefix}.attributes`] = "اختر خصائص هذا المتغير";
        } else if (assignedAttributes.length < form.activeAttributeIds.length) {
          errors[`${prefix}.attributes`] = "أكمل جميع الخصائص المحددة لهذا المتغير";
        }
      }
    });
  }

  return {
    errors,
    stepErrors: buildStepErrorMap(errors),
    isValid: Object.keys(errors).length === 0,
  };
}

const BACKEND_ERROR_MESSAGES = {
  "brand.not.found": "الماركة المحددة غير موجودة أو لم تعد متاحة",
  "category.not.found": "الفئة المحددة غير موجودة أو لم تعد متاحة",
  "product.slug.exists": "هذا الرابط مستخدم بالفعل",
  "product.slug.exists.in.the.same.store": "هذا الرابط مستخدم بالفعل داخل متجرك",
  "product.has.multiple.default.variants": "لا يمكن تحديد أكثر من متغير افتراضي",
  "default.variants.required": "يجب تحديد متغير افتراضي واحد",
  "product.variant.should.have.attribute": "كل متغير يحتاج إلى خصائص عندما يوجد أكثر من متغير",
  "invalid.product.audience.for.category": "الجمهور المختار لا يطابق الفئة أو الماركة",
  "invalid.product.ageGroup.for.category": "الفئة العمرية لا تطابق الفئة أو الماركة",
  "product.variant.must.haveAtLeastOne": "كل متغير يحتاج إلى وسائط مرفقة واحدة على الأقل",
  "product.variant.image.limitExceeded": `لا يمكن إرفاق أكثر من ${MAX_PRODUCT_IMAGES} صور لكل متغير`,
  "product.variant.duplicate.image.sort": "ترتيب الصور يحتوي على تكرار غير مسموح",
  "product.variant.duplicate.attribute": "لا يمكن تكرار نفس الخاصية داخل المتغير",
  "product.variant.medium.not.found": "تعذر العثور على إحدى الصور المرفقة",
  "product.variant.medium.type.invalid": "نوع إحدى الصور غير مدعوم",
  "product.variant.medium.could.not.be.validated": "تعذر التحقق من إحدى الصور المرفقة",
  "product.name.notblank": "اسم المنتج مطلوب",
  "product.name.size": "اسم المنتج يجب أن يكون بين 3 و50 حرفًا",
  "product.slug.notblank": "الرابط المختصر مطلوب",
  "product.slug.white.spaces": "الرابط المختصر لا يجب أن يحتوي على مسافات",
  "product.slug.lowercase": "استخدم أحرفًا صغيرة فقط في الرابط المختصر",
  "product.slug.start.end.letter": "يجب أن يبدأ الرابط المختصر وينتهي بحرف",
  "product.targetedAudience.notnull": "اختر الجمهور المستهدف",
  "product.ageGroup.notnull": "اختر الفئة العمرية",
  "product.shortDescription.notblank": "الوصف القصير مطلوب",
  "product.shortDescription.size": "الوصف القصير يجب أن يكون بين 3 و100 حرف",
  "product.description.notblank": "الوصف الكامل مطلوب",
  "product.description.size": "الوصف الكامل يجب أن يكون بين 3 و2500 حرف",
  "product.isActive.notnull": "حدد حالة المنتج قبل الحفظ",
  "product.variants.notnull": "أضف متغيرًا واحدًا على الأقل",
  "product.variant.id.null": "بيانات المتغير غير صالحة لعملية الإنشاء",
  "product.variant.id.notnull": "تعذر التعرف على المتغير المطلوب",
  "product.variant.name.notblank": "اسم المتغير مطلوب",
  "product.variant.basePrice.notblank": "السعر الأساسي مطلوب",
  "product.variant.basePrice.positive": "السعر الأساسي يجب أن يكون أكبر من صفر",
  "product.variant.isDefault.notnull": "حدد إن كان هذا المتغير هو الافتراضي",
  "product.variant.media.not.null": "أرفق صور المتغير قبل النشر",
  "product.image.id.null": "لا ترسل معرف صورة داخلي أثناء إنشاء المنتج",
  "product.image.mediaId.notnull": "إحدى الصور المرفقة غير مكتملة",
  "product.image.sortOrder.notnull": "ترتيب الصور مطلوب",
  "variant.attribute.attributeId.notnull": "اختر اسم الخاصية",
  "variant.attribute.optionId.notnull": "اختر قيمة الخاصية",
};

function guessFieldFromCode(code = "") {
  if (!code) return "";

  if (code.includes("slug")) return "slug";
  if (code.includes("brand")) return "brandId";
  if (code.includes("category")) return "categoryId";
  if (code.includes("audience")) return "targetedAudience";
  if (code.includes("ageGroup")) return "ageGroup";
  if (code.includes("variant") || code.includes("default")) return "variants";
  if (code.includes("image") || code.includes("medium")) return "productMedia";

  return "";
}

function mapFieldKey(field = "") {
  if (field === "variants" || field === "productMedia") return field;

  if (field.startsWith("variants[")) {
    const match = field.match(/^variants\[(\d+)\]\.(.+)$/);
    if (!match) return field;
    const index = Number(match[1]);
    const suffix = match[2];
    return { index, suffix };
  }

  return field;
}

export function mapBackendErrors(error, form) {
  const fieldErrors = {};
  const list = Array.isArray(error?.errorCodes) ? error.errorCodes : [];

  list.forEach((item) => {
    const code = typeof item === "string" ? item : item?.message;
    const rawField = typeof item === "object" ? item?.field || guessFieldFromCode(code) : guessFieldFromCode(code);
    const message = BACKEND_ERROR_MESSAGES[code] || code || "يرجى مراجعة البيانات المدخلة";

    const mapped = mapFieldKey(rawField);
    if (typeof mapped === "string") {
      if (!mapped) return;
      fieldErrors[mapped] = message;
      return;
    }

    const variant = form.variants[mapped.index];
    if (!variant) return;
    const suffix = mapped.suffix.startsWith("media")
      ? "media"
      : mapped.suffix.startsWith("attributes")
        ? "attributes"
        : mapped.suffix;
    fieldErrors[`variants.${variant.key}.${suffix}`] = message;
  });

  const summary =
    BACKEND_ERROR_MESSAGES[error?.message] ||
    fieldErrors.variants ||
    fieldErrors.name ||
    error?.message ||
    "تعذر حفظ المنتج. راجع الحقول المطلوبة ثم حاول مرة أخرى.";

  return {
    summary,
    fieldErrors,
    stepErrors: buildStepErrorMap(fieldErrors),
  };
}

export function getPreviewVariant(form, previewVariantKey) {
  return (
    form.variants.find((variant) => variant.key === previewVariantKey) ||
    form.variants.find((variant) => variant.isDefault) ||
    form.variants[0] ||
    null
  );
}

export function getVariantMediaItems(form, variant) {
  const selectedMediaIds = new Set((variant?.mediaIds || []).map(String));
  return (form.productMedia || []).filter(
    (item) => item.status === "uploaded" && item.id && selectedMediaIds.has(String(item.id))
  );
}

export function getStepIndexById(stepId) {
  return PRODUCT_FORM_STEPS.findIndex((step) => step.id === stepId);
}

export function hasUnsavedChanges(form) {
  return (
    form.name.trim() ||
    form.slug.trim() ||
    form.shortDescription.trim() ||
    form.description.trim() ||
    form.categoryId ||
    form.brandId ||
    form.targetedAudience !== "ALL" ||
    form.ageGroup !== "ALL" ||
    form.tags.length > 0 ||
    form.activeAttributeIds.length > 0 ||
    Object.values(form.attributeOptionSelections || {}).some((ids) => ids.length > 0) ||
    form.productMedia.length > 0 ||
    form.variants.length > 1 ||
    form.variants[0]?.name.trim() ||
    form.variants[0]?.basePrice
  );
}
