const DEFAULT_ERROR_MESSAGE = "حدث خطأ في الطلب";
const FIELD_ERROR_FALLBACK = "قيمة غير صحيحة";
const REVIEW_FIELDS_MESSAGE = "راجع الحقول المحددة";

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
  const firstFieldMessage = extractApiErrorCodes(error).find((item) => item.message)?.message;
  return (
    firstFieldMessage ||
    payload?.message ||
    payload?.error ||
    error?.message ||
    fallback ||
    DEFAULT_ERROR_MESSAGE
  );
}

export function createApiError(response, payload, fallback = DEFAULT_ERROR_MESSAGE) {
  const errorCodes = extractApiErrorCodes(payload);
  const firstFieldMessage = errorCodes.find((item) => item.message)?.message;
  const message =
    firstFieldMessage ||
    payload?.message ||
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
    const text = message || FIELD_ERROR_FALLBACK;

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
