const DEFAULT_ERROR_MESSAGE = "حدث خطأ في الطلب";
const FIELD_ERROR_FALLBACK = "قيمة غير صحيحة";
const REVIEW_FIELDS_MESSAGE = "راجع الحقول المحددة";
const ERROR_MESSAGE_MAP = {
  "cart.mallId.notnull": "يجب تحديد المول.",
  "cart.mallId.positive": "المول المحدد غير صالح.",
  "cart.productId.notnull": "يجب تحديد المنتج.",
  "cart.productId.positive": "المنتج المحدد غير صالح.",
  "cart.variantId.notnull": "يجب اختيار المتغير قبل الإضافة للسلة.",
  "cart.variantId.positive": "المتغير المحدد غير صالح.",
  "cartItem.quantity.notnull": "الكمية مطلوبة.",
  "cartItem.quantity.min": "الكمية يجب أن تكون 1 على الأقل.",
  "cart.cityId.positive": "المدينة المحددة غير صالحة.",
  "cart.deliveryName.size": "اسم المستلم يجب أن يكون بين حرفين و100 حرف.",
  "cart.deliveryNote.size": "ملاحظة التوصيل طويلة أكثر من اللازم.",
  "cart.deliveryLocation.size": "موقع التوصيل يجب أن يكون بين 5 و255 حرفًا.",
  "checkout.cityId.notnull": "المدينة مطلوبة لإتمام الطلب.",
  "checkout.cityId.positive": "المدينة المحددة غير صالحة.",
  "checkout.deliveryName.notblank": "اسم المستلم مطلوب.",
  "checkout.deliveryName.size": "اسم المستلم يجب أن يكون بين حرفين و100 حرف.",
  "checkout.deliveryPhone.notnull": "رقم هاتف المستلم مطلوب.",
  "checkout.deliveryLocation.notblank": "موقع التوصيل مطلوب.",
  "checkout.deliveryLocation.size": "موقع التوصيل يجب أن يكون بين 5 و255 حرفًا.",
  "checkout.deliveryNote.size": "ملاحظة التوصيل طويلة أكثر من اللازم.",
  "returnRequest.orderItemId.notnull": "يجب تحديد العنصر المراد إرجاعه.",
  "returnRequest.orderItemId.positive": "العنصر المحدد غير صالح.",
  "returnRequest.reason.notblank": "سبب الإرجاع مطلوب.",
  "returnRequest.reason.size": "سبب الإرجاع يجب أن يكون بين 3 و500 حرف.",
  "returnRequest.description.size": "وصف الإرجاع طويل أكثر من اللازم.",
  "returnRequest.imageUuid.notnull": "صورة طلب الإرجاع مطلوبة.",
  "cityId": "المدينة المحددة غير صالحة.",
  "mallId": "المول المحدد غير صالح.",
  "variantId": "يجب اختيار متغير صالح.",
  "quantity": "الكمية غير صالحة.",
  "deliveryPhone": "رقم الهاتف غير صالح.",
  "deliveryLocation": "موقع التوصيل غير صالح.",
  "orderItemId": "عنصر الطلب غير صالح.",
  "imageUuid": "ملف الصورة المرفوع غير صالح.",
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function extractApiErrorCodes(errorOrPayload) {
  const payload = errorOrPayload?.payload || errorOrPayload;
  return asArray(errorOrPayload?.errorCodes || payload?.errorCodes)
    .map((item) => ({
      field: String(item?.field || "").trim(),
      message: String(item?.message || "").trim(),
    }))
    .filter((item) => item.field || item.message);
}

export function getApiErrorMessage(error, fallback = DEFAULT_ERROR_MESSAGE) {
  const payload = error?.payload || error;
  const firstFieldMessage = extractApiErrorCodes(error)
    .map(({ message }) => ERROR_MESSAGE_MAP[message] || message)
    .find(Boolean);
  return (
    firstFieldMessage ||
    ERROR_MESSAGE_MAP[payload?.message] ||
    payload?.message ||
    ERROR_MESSAGE_MAP[payload?.error] ||
    payload?.error ||
    error?.message ||
    fallback ||
    DEFAULT_ERROR_MESSAGE
  );
}

export function createApiError(response, payload, fallback = DEFAULT_ERROR_MESSAGE) {
  const errorCodes = extractApiErrorCodes(payload);
  const firstFieldMessage = errorCodes
    .map(({ message }) => ERROR_MESSAGE_MAP[message] || message)
    .find(Boolean);
  const message =
    firstFieldMessage ||
    ERROR_MESSAGE_MAP[payload?.message] ||
    payload?.message ||
    ERROR_MESSAGE_MAP[payload?.error] ||
    payload?.error ||
    fallback ||
    DEFAULT_ERROR_MESSAGE;
  const error = new Error(message);
  error.status = response.status;
  error.payload = payload;
  error.errorCodes = errorCodes;
  return error;
}

function resolveFieldName(field, fieldMap = {}) {
  if (!field) {
    return "";
  }

  if (Object.prototype.hasOwnProperty.call(fieldMap, field)) {
    return fieldMap[field];
  }

  const parts = field.split(".");
  const lastPart = parts[parts.length - 1];

  if (Object.prototype.hasOwnProperty.call(fieldMap, lastPart)) {
    return fieldMap[lastPart];
  }

  return field;
}

export function mapApiFieldErrors(error, fieldMap = {}) {
  const fieldErrors = {};
  const formErrors = [];

  extractApiErrorCodes(error).forEach(({ field, message }) => {
    const key = resolveFieldName(field, fieldMap);
    const text = ERROR_MESSAGE_MAP[message] || message || FIELD_ERROR_FALLBACK;

    if (!key || key === "_form" || key === "requestBody" || key === "value") {
      formErrors.push(text);
      return;
    }

    fieldErrors[key] = text;
  });

  return {
    fieldErrors,
    formErrors: [...new Set(formErrors)],
  };
}

export function buildApiFormError(error, fieldMap = {}, fallback = DEFAULT_ERROR_MESSAGE) {
  const { fieldErrors, formErrors } = mapApiFieldErrors(error, fieldMap);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const message = formErrors.length
    ? formErrors.join("\n")
    : hasFieldErrors
    ? REVIEW_FIELDS_MESSAGE
    : getApiErrorMessage(error, fallback);

  return {
    message,
    fieldErrors,
  };
}
