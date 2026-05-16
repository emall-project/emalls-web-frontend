import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiImage,
  FiInfo,
  FiLoader,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiTrash2,
  FiUploadCloud,
  FiUser,
} from "react-icons/fi";
import { auth } from "../../api/auth";
import { mediaApi } from "../../api/mediaApi";
import { shopOwnerSignupApi } from "./signupApi";
import { RxSelect } from "../../components/shopOwner/ui/RxSelect";

const STEP_ITEMS = [
  {
    title: "بيانات الحساب",
    subtitle: "هوية صاحب المتجر ومعلومات الدخول",
    icon: FiUser,
  },
  {
    title: "بيانات المتجر",
    subtitle: "تفاصيل المتجر والمول والفئة",
    icon: FiBriefcase,
  },
  {
    title: "الصور والمرفقات",
    subtitle: "صور المتجر والترخيص والهوية البصرية",
    icon: FiImage,
  },
  {
    title: "مراجعة وإرسال",
    subtitle: "تأكد من البيانات قبل إرسال الطلب",
    icon: FiFileText,
  },
];

const FEATURES = [
  "إرسال طلب فتح متجر مع مطابقة كاملة لمتطلبات الإدارة",
  "رفع صور المتجر والترخيص قبل المراجعة لضمان الجاهزية",
  "متابعة طلبك لاحقًا بعد اعتماده من فريق سوقنا",
];

const CATEGORY_LABELS = {
  CLOTHING: "ملابس",
  ELECTRONICS: "إلكترونيات",
  FOOD: "أغذية",
  BEVERAGES: "مشروبات",
  BOOKS: "كتب",
  TOYS: "ألعاب",
  JEWELRY: "مجوهرات",
  SPORTS: "رياضة",
  HEALTH: "صحة",
  BEAUTY: "جمال",
  HOME: "منزل",
  FURNITURE: "أثاث",
  OTHER: "أخرى",
};

const GENDER_OPTIONS = [
  { value: "MALE", label: "ذكر" },
  { value: "FEMALE", label: "أنثى" },
  { value: "NOT_SPECIFIED", label: "أفضل عدم التحديد" },
];

const STATUS_LABELS = {
  PENDING: "قيد المراجعة",
  APPROVED: "تمت الموافقة",
  REJECTED: "تم الرفض",
};

const PHONE_REGEX = /^05(9|6|4)\d{7}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#_+=-])[A-Za-z\d@$!%*?&^#_+=-]{8,}$/;
const IMAGE_MAX_SIZE_BYTES = 8 * 1024 * 1024;

const STEP_ERROR_KEYS = [
  [
    "fullName",
    "username",
    "email",
    "phone.number",
    "password",
    "confirmPassword",
    "gender",
    "age",
    "nationalIdNumber",
  ],
  [
    "existingMallCityId",
    "shopRequest.mallId",
    "shopRequest.requestedMallName",
    "shopRequest.requestedMallCityId",
    "shopRequest.name",
    "shopRequest.category",
    "shopRequest.description",
    "shopRequest.location",
    "shopRequest.contactInfo",
  ],
  [
    "profilePictureUuid",
    "shopRequest.logoUuid",
    "shopRequest.licenseImageUuid",
    "shopRequest.shopPhotosUuids",
  ],
  [],
];

const FIELD_STEP_INDEX = {
  fullName: 0,
  username: 0,
  email: 0,
  "phone.number": 0,
  password: 0,
  confirmPassword: 0,
  gender: 0,
  age: 0,
  nationalIdNumber: 0,
  existingMallCityId: 1,
  "shopRequest.mallId": 1,
  "shopRequest.requestedMallName": 1,
  "shopRequest.requestedMallCityId": 1,
  "shopRequest.name": 1,
  "shopRequest.category": 1,
  "shopRequest.location": 1,
  "shopRequest.contactInfo": 1,
  profilePictureUuid: 2,
  "shopRequest.logoUuid": 2,
  "shopRequest.licenseImageUuid": 2,
  "shopRequest.shopPhotosUuids": 2,
};

const INITIAL_FORM = {
  fullName: "",
  username: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  gender: "",
  age: "",
  nationalIdNumber: "",
  mallMode: "existing",
  existingMallCityId: "",
  mallId: "",
  requestedMallName: "",
  requestedMallCityId: "",
  shopName: "",
  category: "",
  description: "",
  location: "",
  contactPhone: "",
  contactEmail: "",
  contactWhatsapp: "",
  contactInstagram: "",
};

function emptyUploadSlot() {
  return {
    key: "",
    id: "",
    file: null,
    name: "",
    preview: "",
    status: "idle",
    error: "",
  };
}

function createUploadItem(file) {
  return {
    key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: "",
    file,
    name: file.name,
    preview: URL.createObjectURL(file),
    status: "uploading",
    error: "",
  };
}

function revokePreview(preview) {
  if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateImageFile(file) {
  if (!file) return "يرجى اختيار ملف صورة.";
  if (!file.type?.startsWith("image/")) return "يُسمح برفع الصور فقط.";
  if (file.size > IMAGE_MAX_SIZE_BYTES) return "حجم الصورة يجب ألا يتجاوز 8 ميجابايت.";
  return "";
}

function trimOptional(value) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function getEntityId(entity) {
  return entity?.id ?? entity?.mallId ?? entity?.cityId ?? null;
}

function parsePositiveId(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getUploadStatusLabel(upload) {
  if (upload.status === "uploading") return "جاري الرفع...";
  if (upload.status === "done") return "تم الرفع بنجاح";
  if (upload.status === "error") return "فشل الرفع";
  return "لم يتم الرفع بعد";
}

function getMallModeLabel(form, cities, malls) {
  if (form.mallMode === "existing") {
    const mall = malls.find((item) => String(getEntityId(item)) === String(form.mallId));
    return mall ? `مول قائم: ${mall.name}` : "مول قائم";
  }

  const city = cities.find((item) => String(getEntityId(item)) === String(form.requestedMallCityId));
  if (!form.requestedMallName.trim()) return "طلب إضافة مول جديد";
  return city
    ? `مول جديد: ${form.requestedMallName.trim()} - ${city.name}`
    : `مول جديد: ${form.requestedMallName.trim()}`;
}

function translateBackendError(code) {
  if (!code) return null;

  const rawField =
    typeof code === "object" && code !== null && "field" in code ? code.field : undefined;
  const rawMessage =
    typeof code === "object" && code !== null && "message" in code
      ? code.message
      : String(code);
  const normalized = `${rawField || ""}:${rawMessage || ""}`;

  const rules = [
    {
      test: normalized.includes("fullName") && normalized.includes("notblank"),
      field: "fullName",
      message: "الاسم الكامل مطلوب.",
    },
    {
      test: normalized.includes("fullName") && normalized.includes("size"),
      field: "fullName",
      message: "الاسم الكامل يجب أن يكون بين حرفين و150 حرفًا.",
    },
    {
      test: normalized.includes("username") && normalized.includes("notblank"),
      field: "username",
      message: "اسم المستخدم مطلوب.",
    },
    {
      test: normalized.includes("username") && normalized.includes("size"),
      field: "username",
      message: "اسم المستخدم يجب أن يكون بين 3 و150 حرفًا.",
    },
    {
      test:
        normalized.includes("username") &&
        (normalized.includes("exists") ||
          normalized.includes("pending") ||
          normalized.includes("used") ||
          normalized.includes("duplicate")),
      field: "username",
      message: "اسم المستخدم مستخدم بالفعل أو عليه طلب قيد المراجعة.",
    },
    {
      test: normalized.includes("email") && normalized.includes("invalid"),
      field: "email",
      message: "يرجى إدخال بريد إلكتروني صالح.",
    },
    {
      test:
        normalized.includes("email") &&
        (normalized.includes("exists") ||
          normalized.includes("pending") ||
          normalized.includes("duplicate")),
      field: "email",
      message: "البريد الإلكتروني مستخدم بالفعل أو عليه طلب سابق.",
    },
    {
      test:
        normalized.includes("phone") &&
        (normalized.includes("notnull") || normalized.includes("notblank")),
      field: "phone.number",
      message: "رقم الهاتف مطلوب.",
    },
    {
      test:
        normalized.includes("phone") &&
        (normalized.includes("pattern") || normalized.includes("invalid")),
      field: "phone.number",
      message: "رقم الهاتف يجب أن يكون بصيغة فلسطينية تبدأ بـ 059 أو 056 أو 054.",
    },
    {
      test:
        normalized.includes("phone") &&
        (normalized.includes("exists") ||
          normalized.includes("pending") ||
          normalized.includes("duplicate")),
      field: "phone.number",
      message: "رقم الهاتف مستخدم بالفعل أو عليه طلب سابق.",
    },
    {
      test: normalized.includes("password") && normalized.includes("notnull"),
      field: "password",
      message: "كلمة المرور مطلوبة.",
    },
    {
      test: normalized.includes("password") && normalized.includes("size"),
      field: "password",
      message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
    },
    {
      test: normalized.includes("password") && normalized.includes("pattern"),
      field: "password",
      message: "كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص.",
    },
    {
      test: normalized.includes("gender") && normalized.includes("notnull"),
      field: "gender",
      message: "يرجى اختيار الجنس.",
    },
    {
      test: normalized.includes("age") && normalized.includes("notnull"),
      field: "age",
      message: "العمر مطلوب.",
    },
    {
      test:
        normalized.includes("age") &&
        (normalized.includes("min") || normalized.includes("max")),
      field: "age",
      message: "العمر يجب أن يكون بين 0 و150.",
    },
    {
      test: normalized.includes("nationalIdNumber") && normalized.includes("size"),
      field: "nationalIdNumber",
      message: "رقم الهوية يجب أن يكون بين 9 و20 رقمًا أو حرفًا.",
    },
    {
      test:
        normalized.includes("nationalIdNumber") &&
        (normalized.includes("exists") ||
          normalized.includes("pending") ||
          normalized.includes("duplicate")),
      field: "nationalIdNumber",
      message: "رقم الهوية مستخدم بالفعل أو عليه طلب سابق.",
    },
    {
      test: normalized.includes("shopRequest.notnull"),
      field: "shopRequest.name",
      message: "بيانات المتجر مطلوبة لإرسال الطلب.",
    },
    {
      test: normalized.includes("shopRequest.name") && normalized.includes("notblank"),
      field: "shopRequest.name",
      message: "اسم المتجر مطلوب.",
    },
    {
      test: normalized.includes("shopRequest.name") && normalized.includes("size"),
      field: "shopRequest.name",
      message: "اسم المتجر يجب أن يكون بين حرفين و255 حرفًا.",
    },
    {
      test: normalized.includes("shopRequest.category") && normalized.includes("notnull"),
      field: "shopRequest.category",
      message: "يرجى اختيار فئة المتجر.",
    },
    {
      test: normalized.includes("shopRequest.location") && normalized.includes("notblank"),
      field: "shopRequest.location",
      message: "وصف موقع المتجر مطلوب.",
    },
    {
      test: normalized.includes("shopRequest.location") && normalized.includes("size"),
      field: "shopRequest.location",
      message: "وصف الموقع يجب ألا يتجاوز 255 حرفًا.",
    },
    {
      test: normalized.includes("shopRequest.mall.invalid"),
      field: "shopRequest.mallId",
      message: "اختر مولًا قائمًا أو قدّم طلب مول جديد، وليس الاثنين معًا.",
    },
    {
      test: normalized.includes("shopRequest.mallId") && normalized.includes("positive"),
      field: "shopRequest.mallId",
      message: "يرجى اختيار مول صالح.",
    },
    {
      test: normalized.includes("requestedMallName") && normalized.includes("size"),
      field: "shopRequest.requestedMallName",
      message: "اسم المول الجديد يجب أن يكون حرفين على الأقل.",
    },
    {
      test: normalized.includes("requestedMallCityId"),
      field: "shopRequest.requestedMallCityId",
      message: "يرجى اختيار المدينة الخاصة بالمول الجديد.",
    },
    {
      test:
        normalized.includes("licenseImageUuid") &&
        (normalized.includes("notnull") || normalized.includes("notblank")),
      field: "shopRequest.licenseImageUuid",
      message: "صورة الترخيص مطلوبة.",
    },
    {
      test:
        normalized.includes("shopPhotosUuids") &&
        (normalized.includes("notempty") || normalized.includes("notnull")),
      field: "shopRequest.shopPhotosUuids",
      message: "يرجى رفع صورة واحدة على الأقل للمتجر.",
    },
  ];

  const matched = rules.find((item) => item.test);
  if (matched) return matched;

  if (rawField && rawMessage) {
    return { field: rawField, message: rawMessage };
  }

  return null;
}

function UploadSlot({
  id,
  title,
  description,
  required = false,
  upload,
  onSelect,
  onRemove,
  onRetry,
  fieldError,
}) {
  const isBusy = upload.status === "uploading";
  const hasFile = Boolean(upload.file || upload.preview || upload.id);

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "var(--gray-1)",
        borderColor: fieldError ? "var(--red-a6)" : "var(--gray-a5)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
              {title}
            </h3>
            {required && (
              <span
                className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
              >
                مطلوب
              </span>
            )}
          </div>
          <p className="text-xs mt-1 leading-6" style={{ color: "var(--gray-10)" }}>
            {description}
          </p>
        </div>
        <label
          htmlFor={id}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer transition hover:opacity-90"
          style={{ background: "var(--blue-9)", color: "#fff" }}
        >
          <FiUploadCloud size={14} />
          {hasFile ? "استبدال" : "اختيار ملف"}
        </label>
      </div>

      <input
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />

      {hasFile ? (
        <div
          className="mt-4 rounded-2xl border overflow-hidden"
          style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}
        >
          <div className="aspect-[16/10] w-full overflow-hidden" style={{ background: "var(--gray-a4)" }}>
            {upload.preview ? (
              <img
                src={upload.preview}
                alt={upload.name || title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <FiImage size={20} style={{ color: "var(--gray-9)" }} />
              </div>
            )}
          </div>

          <div className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--gray-12)" }}>
                  {upload.name || "ملف مرفوع"}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--gray-10)" }}>
                  {isBusy ? (
                    <span className="inline-flex items-center gap-2">
                      <FiLoader size={12} className="animate-spin" />
                      {getUploadStatusLabel(upload)}
                    </span>
                  ) : (
                    getUploadStatusLabel(upload)
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {upload.status === "error" && upload.file && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-80"
                    style={{ background: "var(--amber-a3)", color: "var(--amber-11)" }}
                  >
                    <FiRefreshCw size={12} />
                    إعادة
                  </button>
                )}

                <button
                  type="button"
                  onClick={onRemove}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-80 disabled:opacity-50"
                  style={{ background: "var(--red-a3)", color: "var(--red-11)" }}
                >
                  <FiTrash2 size={12} />
                  حذف
                </button>
              </div>
            </div>

            {upload.error && (
              <div
                className="rounded-xl px-3 py-2 text-xs"
                style={{
                  background: "var(--red-a3)",
                  color: "var(--red-11)",
                  border: "1px solid var(--red-a6)",
                }}
              >
                {upload.error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="mt-4 rounded-2xl border border-dashed p-5 text-center"
          style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
          >
            <FiImage size={20} />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--gray-12)" }}>
            ارفع صورة واضحة بجودة جيدة
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--gray-10)" }}>
            JPG أو PNG وبحجم لا يتجاوز 8 ميجابايت
          </p>
        </div>
      )}

      {fieldError && (
        <p className="text-xs mt-3" style={{ color: "var(--red-11)" }}>
          {fieldError}
        </p>
      )}
    </div>
  );
}

function UploadPhotoTile({ upload, onRetry, onRemove }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "var(--gray-a5)", background: "var(--gray-a2)" }}
    >
      <div className="aspect-square overflow-hidden" style={{ background: "var(--gray-a4)" }}>
        {upload.preview ? (
          <img src={upload.preview} alt={upload.name} className="w-full h-full object-cover" />
        ) : (
          <div className="h-full flex items-center justify-center">
            <FiImage size={20} style={{ color: "var(--gray-9)" }} />
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="text-sm font-medium truncate" style={{ color: "var(--gray-12)" }}>
          {upload.name}
        </div>
        <div className="text-xs" style={{ color: "var(--gray-10)" }}>
          {upload.status === "uploading" ? (
            <span className="inline-flex items-center gap-2">
              <FiLoader size={12} className="animate-spin" />
              جاري الرفع...
            </span>
          ) : (
            getUploadStatusLabel(upload)
          )}
        </div>

        {upload.error && (
          <div
            className="rounded-xl px-3 py-2 text-xs"
            style={{
              background: "var(--red-a3)",
              color: "var(--red-11)",
              border: "1px solid var(--red-a6)",
            }}
          >
            {upload.error}
          </div>
        )}

        <div className="flex items-center gap-2">
          {upload.status === "error" && upload.file && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-80"
              style={{ background: "var(--amber-a3)", color: "var(--amber-11)" }}
            >
              <FiRefreshCw size={12} />
              إعادة
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            disabled={upload.status === "uploading"}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-80 disabled:opacity-50"
            style={{ background: "var(--red-a3)", color: "var(--red-11)" }}
          >
            <FiTrash2 size={12} />
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopOwnerSignup() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingMalls, setLoadingMalls] = useState(false);
  const [cities, setCities] = useState([]);
  const [malls, setMalls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState(emptyUploadSlot());
  const [logoUpload, setLogoUpload] = useState(emptyUploadSlot());
  const [licenseUpload, setLicenseUpload] = useState(emptyUploadSlot());
  const [shopPhotos, setShopPhotos] = useState([]);

  useEffect(() => {
    const user = auth.getUser();
    if (user?.role === "ROLE_SHOP_OWNER") {
      navigate("/shop-owner", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let mounted = true;

    async function loadCities() {
      setLoadingCities(true);
      try {
        const response = await shopOwnerSignupApi.getActiveCities();
        if (!mounted) return;
        setCities(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        if (!mounted) return;
        setFormError(err.message || "تعذر تحميل المدن المتاحة حاليًا.");
      } finally {
        if (mounted) setLoadingCities(false);
      }
    }

    loadCities();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (form.mallMode !== "existing" || !form.existingMallCityId) {
      setMalls([]);
      return;
    }

    let mounted = true;

    async function loadMalls() {
      setLoadingMalls(true);
      try {
        const response = await shopOwnerSignupApi.getActiveMallsByCity(form.existingMallCityId);
        if (!mounted) return;
        setMalls(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        if (!mounted) return;
        setMalls([]);
        setFormError(err.message || "تعذر تحميل المولات المتاحة في هذه المدينة.");
      } finally {
        if (mounted) setLoadingMalls(false);
      }
    }

    loadMalls();

    return () => {
      mounted = false;
    };
  }, [form.mallMode, form.existingMallCityId]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFieldError(fieldName) {
    setErrors((current) => {
      if (!current[fieldName]) return current;
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
  }

  function clearFieldErrors(fieldNames) {
    setErrors((current) => {
      const next = { ...current };
      let changed = false;
      fieldNames.forEach((fieldName) => {
        if (next[fieldName]) {
          delete next[fieldName];
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }

  function setField(fieldName, value, errorKey = fieldName) {
    setForm((current) => ({ ...current, [fieldName]: value }));
    setFormError("");
    clearFieldError(errorKey);
  }

  function replaceStepErrors(stepIndex, nextStepErrors) {
    setErrors((current) => {
      const next = { ...current };
      (STEP_ERROR_KEYS[stepIndex] || []).forEach((key) => delete next[key]);
      return { ...next, ...nextStepErrors };
    });
  }

  function validateAccountStep() {
    const nextErrors = {};
    const fullName = form.fullName.trim();
    const username = form.username.trim();
    const email = form.email.trim();
    const phoneNumber = form.phoneNumber.trim();
    const password = form.password;
    const nationalIdNumber = form.nationalIdNumber.trim();
    const ageNumber = Number(form.age);

    if (!fullName) nextErrors.fullName = "الاسم الكامل مطلوب.";
    else if (fullName.length < 2 || fullName.length > 150) {
      nextErrors.fullName = "الاسم الكامل يجب أن يكون بين حرفين و150 حرفًا.";
    }

    if (!username) nextErrors.username = "اسم المستخدم مطلوب.";
    else if (username.length < 3 || username.length > 150) {
      nextErrors.username = "اسم المستخدم يجب أن يكون بين 3 و150 حرفًا.";
    }

    if (email && !isValidEmail(email)) {
      nextErrors.email = "يرجى إدخال بريد إلكتروني صالح.";
    }

    if (!phoneNumber) nextErrors["phone.number"] = "رقم الهاتف مطلوب.";
    else if (!PHONE_REGEX.test(phoneNumber)) {
      nextErrors["phone.number"] = "أدخل رقمًا بصيغة 0591234567 أو 0561234567 أو 0541234567.";
    }

    if (!password) nextErrors.password = "كلمة المرور مطلوبة.";
    else if (!PASSWORD_REGEX.test(password)) {
      nextErrors.password =
        "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل مع حرف كبير وصغير ورقم ورمز خاص.";
    }

    if (!form.confirmPassword) nextErrors.confirmPassword = "يرجى تأكيد كلمة المرور.";
    else if (password !== form.confirmPassword) {
      nextErrors.confirmPassword = "تأكيد كلمة المرور غير مطابق.";
    }

    if (!form.gender) nextErrors.gender = "يرجى اختيار الجنس.";

    if (form.age === "") nextErrors.age = "العمر مطلوب.";
    else if (Number.isNaN(ageNumber) || ageNumber < 0 || ageNumber > 150) {
      nextErrors.age = "العمر يجب أن يكون بين 0 و150.";
    }

    if (nationalIdNumber && (nationalIdNumber.length < 9 || nationalIdNumber.length > 20)) {
      nextErrors.nationalIdNumber = "رقم الهوية يجب أن يكون بين 9 و20 خانة.";
    }

    return nextErrors;
  }

  function validateShopStep() {
    const nextErrors = {};
    const requestedMallName = form.requestedMallName.trim();
    const shopName = form.shopName.trim();
    const location = form.location.trim();
    const contactEmail = form.contactEmail.trim();
    const existingMallCityId = parsePositiveId(form.existingMallCityId);
    const existingMallId = parsePositiveId(form.mallId);
    const requestedMallCityId = parsePositiveId(form.requestedMallCityId);

    if (form.mallMode === "existing") {
      if (!existingMallCityId) nextErrors.existingMallCityId = "يرجى اختيار المدينة أولًا.";
      if (!existingMallId) nextErrors["shopRequest.mallId"] = "يرجى اختيار مول قائم صالح.";
    } else {
      if (!requestedMallCityId) {
        nextErrors["shopRequest.requestedMallCityId"] = "يرجى اختيار المدينة الخاصة بالمول الجديد.";
      }
      if (!requestedMallName) {
        nextErrors["shopRequest.requestedMallName"] = "اسم المول الجديد مطلوب.";
      } else if (requestedMallName.length < 2) {
        nextErrors["shopRequest.requestedMallName"] = "اسم المول الجديد يجب أن يكون حرفين على الأقل.";
      }
    }

    if (!shopName) nextErrors["shopRequest.name"] = "اسم المتجر مطلوب.";
    else if (shopName.length < 2 || shopName.length > 255) {
      nextErrors["shopRequest.name"] = "اسم المتجر يجب أن يكون بين حرفين و255 حرفًا.";
    }

    if (!form.category) nextErrors["shopRequest.category"] = "يرجى اختيار فئة المتجر.";

    if (!location) nextErrors["shopRequest.location"] = "وصف موقع المتجر مطلوب.";
    else if (location.length > 255) {
      nextErrors["shopRequest.location"] = "وصف الموقع يجب ألا يتجاوز 255 حرفًا.";
    }

    if (contactEmail && !isValidEmail(contactEmail)) {
      nextErrors["shopRequest.contactInfo"] = "يرجى إدخال بريد تواصل صالح أو تركه فارغًا.";
    }

    return nextErrors;
  }

  function validateUploadsStep() {
    const nextErrors = {};
    const donePhotos = shopPhotos.filter((item) => item.status === "done" && item.id);

    if (!licenseUpload.id || licenseUpload.status !== "done") {
      nextErrors["shopRequest.licenseImageUuid"] = "صورة الترخيص مطلوبة قبل الإرسال.";
    }

    if (!donePhotos.length) {
      nextErrors["shopRequest.shopPhotosUuids"] = "يرجى رفع صورة واحدة على الأقل للمتجر.";
    }

    return nextErrors;
  }

  function validateStep(targetStep) {
    if (targetStep === 0) return validateAccountStep();
    if (targetStep === 1) return validateShopStep();
    if (targetStep === 2) return validateUploadsStep();
    return {
      ...validateAccountStep(),
      ...validateShopStep(),
      ...validateUploadsStep(),
    };
  }

  function getFirstErrorStep(fieldErrors) {
    const indexes = Object.keys(fieldErrors)
      .map((fieldName) => FIELD_STEP_INDEX[fieldName])
      .filter((value) => value != null);

    if (!indexes.length) return null;
    return Math.min(...indexes);
  }

  function applyBackendErrors(err) {
    const mappedErrors = {};
    const unknownCodes = [];

    (err?.errorCodes || []).forEach((code) => {
      const translated = translateBackendError(code);
      if (translated?.field && !mappedErrors[translated.field]) {
        mappedErrors[translated.field] = translated.message;
      } else if (!translated) {
        unknownCodes.push(code);
      }
    });

    setErrors(mappedErrors);

    const stepWithError = getFirstErrorStep(mappedErrors);
    if (stepWithError != null) setStep(stepWithError);

    const summaryMessage =
      err?.message ||
      (unknownCodes.length
        ? unknownCodes
            .map((item) =>
              typeof item === "object" && item !== null
                ? item.message || item.field || ""
                : String(item || ""),
            )
            .find(Boolean)
        : "") ||
      "تعذر إرسال الطلب. يرجى مراجعة البيانات والمحاولة مرة أخرى.";

    setFormError(summaryMessage);
    scrollToTop();
  }

  async function uploadSingleFile(file, setter, previousUpload = emptyUploadSlot()) {
    const item = previousUpload.file === file && previousUpload.preview ? previousUpload : createUploadItem(file);
    setter({ ...item, status: "uploading", error: "", id: "" });

    try {
      const response = await mediaApi.uploadTemp(file);
      const uploaded = response?.data || {};
      setter((current) => ({
        ...current,
        status: "done",
        id: uploaded.id || "",
        error: "",
      }));
    } catch (err) {
      setter((current) => ({
        ...current,
        status: "error",
        id: "",
        error: err.message || "تعذر رفع الصورة. حاول مرة أخرى.",
      }));
    }
  }

  function handleSingleUploadSelect(kind, file) {
    const validationMessage = validateImageFile(file);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setFormError("");

    if (kind === "profile") {
      clearFieldError("profilePictureUuid");
      revokePreview(profilePicture.preview);
      void uploadSingleFile(file, setProfilePicture);
      return;
    }

    if (kind === "logo") {
      clearFieldError("shopRequest.logoUuid");
      revokePreview(logoUpload.preview);
      void uploadSingleFile(file, setLogoUpload);
      return;
    }

    clearFieldError("shopRequest.licenseImageUuid");
    revokePreview(licenseUpload.preview);
    void uploadSingleFile(file, setLicenseUpload);
  }

  function handleRetrySingle(kind) {
    if (kind === "profile" && profilePicture.file) {
      setFormError("");
      void uploadSingleFile(profilePicture.file, setProfilePicture, profilePicture);
    } else if (kind === "logo" && logoUpload.file) {
      setFormError("");
      void uploadSingleFile(logoUpload.file, setLogoUpload, logoUpload);
    } else if (kind === "license" && licenseUpload.file) {
      setFormError("");
      void uploadSingleFile(licenseUpload.file, setLicenseUpload, licenseUpload);
    }
  }

  function removeSingleUpload(kind) {
    if (kind === "profile") {
      revokePreview(profilePicture.preview);
      setProfilePicture(emptyUploadSlot());
      clearFieldError("profilePictureUuid");
      return;
    }

    if (kind === "logo") {
      revokePreview(logoUpload.preview);
      setLogoUpload(emptyUploadSlot());
      clearFieldError("shopRequest.logoUuid");
      return;
    }

    revokePreview(licenseUpload.preview);
    setLicenseUpload(emptyUploadSlot());
    clearFieldError("shopRequest.licenseImageUuid");
  }

  async function startPhotoUpload(item) {
    try {
      const response = await mediaApi.uploadTemp(item.file);
      const uploaded = response?.data || {};
      setShopPhotos((current) =>
        current.map((photo) =>
          photo.key === item.key
            ? { ...photo, status: "done", id: uploaded.id || "", error: "" }
            : photo,
        ),
      );
    } catch (err) {
      setShopPhotos((current) =>
        current.map((photo) =>
          photo.key === item.key
            ? {
                ...photo,
                status: "error",
                id: "",
                error: err.message || "تعذر رفع الصورة. حاول مرة أخرى.",
              }
            : photo,
        ),
      );
    }
  }

  function handleAddShopPhotos(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const validItems = [];
    const rejectedMessages = [];

    files.forEach((file) => {
      const validationMessage = validateImageFile(file);
      if (validationMessage) rejectedMessages.push(`${file.name}: ${validationMessage}`);
      else validItems.push(createUploadItem(file));
    });

    if (rejectedMessages.length) {
      setFormError(rejectedMessages[0]);
    } else {
      setFormError("");
    }

    if (!validItems.length) return;

    clearFieldError("shopRequest.shopPhotosUuids");
    setShopPhotos((current) => [...current, ...validItems]);
    validItems.forEach((item) => {
      void startPhotoUpload(item);
    });
  }

  function retryShopPhoto(photoKey) {
    const photo = shopPhotos.find((item) => item.key === photoKey);
    if (!photo?.file) return;

    setFormError("");
    setShopPhotos((current) =>
      current.map((item) =>
        item.key === photoKey ? { ...item, status: "uploading", error: "", id: "" } : item,
      ),
    );
    void startPhotoUpload(photo);
  }

  function removeShopPhoto(photoKey) {
    setShopPhotos((current) => {
      const target = current.find((item) => item.key === photoKey);
      if (target?.preview) revokePreview(target.preview);
      return current.filter((item) => item.key !== photoKey);
    });
    clearFieldError("shopRequest.shopPhotosUuids");
  }

  function handleMallModeChange(mode) {
    setForm((current) => ({
      ...current,
      mallMode: mode,
      existingMallCityId: "",
      mallId: "",
      requestedMallName: "",
      requestedMallCityId: "",
    }));
    setMalls([]);
    setFormError("");
    clearFieldErrors([
      "existingMallCityId",
      "shopRequest.mallId",
      "shopRequest.requestedMallName",
      "shopRequest.requestedMallCityId",
    ]);
  }

  function goToPreviousStep() {
    setStep((current) => Math.max(current - 1, 0));
    setFormError("");
    scrollToTop();
  }

  function goToNextStep() {
    const stepErrors = validateStep(step);
    replaceStepErrors(step, stepErrors);

    if (Object.keys(stepErrors).length) {
      setFormError("يرجى مراجعة الحقول المطلوبة قبل المتابعة.");
      scrollToTop();
      return;
    }

    setFormError("");
    setStep((current) => Math.min(current + 1, STEP_ITEMS.length - 1));
    scrollToTop();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const allErrors = validateStep(3);
    setErrors(allErrors);

    if (Object.keys(allErrors).length) {
      setFormError("يرجى استكمال الحقول المطلوبة قبل إرسال الطلب.");
      const stepWithError = getFirstErrorStep(allErrors);
      if (stepWithError != null) setStep(stepWithError);
      scrollToTop();
      return;
    }

    setSubmitting(true);
    setFormError("");

    const existingMallId = parsePositiveId(form.mallId);
    const requestedMallCityId = parsePositiveId(form.requestedMallCityId);

    const contactInfo = {};
    if (form.contactPhone.trim()) contactInfo.phone = form.contactPhone.trim();
    if (form.contactEmail.trim()) contactInfo.email = form.contactEmail.trim();
    if (form.contactWhatsapp.trim()) contactInfo.whatsapp = form.contactWhatsapp.trim();
    if (form.contactInstagram.trim()) contactInfo.instagram = form.contactInstagram.trim();

    const payload = {
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: trimOptional(form.email),
      phone: {
        prefix: "+972",
        number: form.phoneNumber.trim(),
      },
      password: form.password,
      gender: form.gender,
      age: Number(form.age),
      nationalIdNumber: trimOptional(form.nationalIdNumber),
      profilePictureUuid: profilePicture.id || undefined,
      shopRequest: {
        mallId: form.mallMode === "existing" ? existingMallId : undefined,
        requestedMallName:
          form.mallMode === "new" ? form.requestedMallName.trim() : undefined,
        requestedMallCityId:
          form.mallMode === "new" ? requestedMallCityId : undefined,
        name: form.shopName.trim(),
        category: form.category,
        description: trimOptional(form.description),
        location: form.location.trim(),
        contactInfo: Object.keys(contactInfo).length ? contactInfo : undefined,
        logoUuid: logoUpload.id || undefined,
        licenseImageUuid: licenseUpload.id,
        shopPhotosUuids: shopPhotos
          .filter((item) => item.status === "done" && item.id)
          .map((item) => item.id),
      },
    };

    try {
      const response = await shopOwnerSignupApi.submitRequest(payload);
      setSubmittedRequest(response?.data || null);
      setFormError("");
      scrollToTop();
    } catch (err) {
      applyBackendErrors(err);
    } finally {
      setSubmitting(false);
    }
  }

  function renderFieldError(fieldName) {
    if (!errors[fieldName]) return null;
    return (
      <p className="text-xs mt-1.5" style={{ color: "var(--red-11)" }}>
        {errors[fieldName]}
      </p>
    );
  }

  function renderInput({
    label,
    icon: Icon,
    value,
    onChange,
    placeholder,
    type = "text",
    autoComplete,
    errorKey,
    dir = "rtl",
    inputMode,
    min,
    max,
  }) {
    return (
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-11)" }}>
          {label}
        </label>
        <div className="relative">
          {Icon ? (
            <Icon
              size={14}
              className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none"
              style={{ color: "var(--gray-9)" }}
            />
          ) : null}
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete={autoComplete}
            inputMode={inputMode}
            min={min}
            max={max}
            className="w-full rounded-[12px] pr-9 pl-4 py-3 text-sm border outline-none transition"
            style={{
              background: "var(--gray-a2)",
              borderColor: errors[errorKey] ? "var(--red-a6)" : "var(--gray-a6)",
              color: "var(--gray-12)",
              direction: dir,
            }}
          />
        </div>
        {renderFieldError(errorKey)}
      </div>
    );
  }

  function renderPasswordField({
    label,
    value,
    onChange,
    show,
    setShow,
    placeholder,
    errorKey,
    autoComplete,
  }) {
    return (
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-11)" }}>
          {label}
        </label>
        <div className="relative">
          <FiLock
            size={14}
            className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none"
            style={{ color: "var(--gray-9)" }}
          />
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className="w-full rounded-[12px] pr-9 pl-10 py-3 text-sm border outline-none transition"
            style={{
              background: "var(--gray-a2)",
              borderColor: errors[errorKey] ? "var(--red-a6)" : "var(--gray-a6)",
              color: "var(--gray-12)",
              direction: "ltr",
            }}
          />
          <button
            type="button"
            onClick={() => setShow((current) => !current)}
            className="absolute top-1/2 -translate-y-1/2 left-3 p-1 rounded-lg hover:opacity-70 transition"
            style={{ color: "var(--gray-9)" }}
          >
            {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
          </button>
        </div>
        {renderFieldError(errorKey)}
      </div>
    );
  }

  function renderSelect({
    label,
    value,
    onValueChange,
    placeholder,
    options,
    errorKey,
    disabled = false,
  }) {
    return (
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-11)" }}>
          {label}
        </label>
        <RxSelect
          value={value}
          onValueChange={onValueChange}
          placeholder={placeholder}
          options={options}
          disabled={disabled}
          error={!!errors[errorKey]}
        />
        {renderFieldError(errorKey)}
      </div>
    );
  }

  function renderTextArea({
    label,
    value,
    onChange,
    placeholder,
    errorKey,
    rows = 4,
  }) {
    return (
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-11)" }}>
          {label}
        </label>
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className="w-full rounded-[12px] px-4 py-3 text-sm border outline-none transition resize-none"
          style={{
            background: "var(--gray-a2)",
            borderColor: errors[errorKey] ? "var(--red-a6)" : "var(--gray-a6)",
            color: "var(--gray-12)",
          }}
        />
        {renderFieldError(errorKey)}
      </div>
    );
  }

  function renderAccountStep() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {renderInput({
            label: "الاسم الكامل",
            icon: FiUser,
            value: form.fullName,
            onChange: (e) => setField("fullName", e.target.value),
            placeholder: "أدخل الاسم الكامل",
            autoComplete: "name",
            errorKey: "fullName",
          })}

          {renderInput({
            label: "اسم المستخدم",
            icon: FiUser,
            value: form.username,
            onChange: (e) => setField("username", e.target.value),
            placeholder: "اختر اسم مستخدم",
            autoComplete: "username",
            errorKey: "username",
            dir: "ltr",
          })}

          {renderInput({
            label: "البريد الإلكتروني",
            icon: FiMail,
            value: form.email,
            onChange: (e) => setField("email", e.target.value),
            placeholder: "name@example.com",
            autoComplete: "email",
            errorKey: "email",
            dir: "ltr",
            type: "email",
          })}

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-11)" }}>
              رقم الهاتف
            </label>
            <div className="relative">
              <FiPhone
                size={14}
                className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none"
                style={{ color: "var(--gray-9)" }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 left-3 text-xs font-semibold"
                style={{ color: "var(--gray-10)" }}
              >
                +972
              </div>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value, "phone.number")}
                placeholder="0591234567"
                autoComplete="tel"
                className="w-full rounded-[12px] pr-9 pl-16 py-3 text-sm border outline-none transition"
                style={{
                  background: "var(--gray-a2)",
                  borderColor: errors["phone.number"] ? "var(--red-a6)" : "var(--gray-a6)",
                  color: "var(--gray-12)",
                  direction: "ltr",
                }}
              />
            </div>
            <p className="text-[11px] mt-1" style={{ color: "var(--gray-9)" }}>
              يجب أن يبدأ بـ 059 أو 056 أو 054
            </p>
            {renderFieldError("phone.number")}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {renderPasswordField({
            label: "كلمة المرور",
            value: form.password,
            onChange: (e) => setField("password", e.target.value),
            show: showPassword,
            setShow: setShowPassword,
            placeholder: "أنشئ كلمة مرور قوية",
            errorKey: "password",
            autoComplete: "new-password",
          })}

          {renderPasswordField({
            label: "تأكيد كلمة المرور",
            value: form.confirmPassword,
            onChange: (e) => setField("confirmPassword", e.target.value),
            show: showConfirmPassword,
            setShow: setShowConfirmPassword,
            placeholder: "أعد إدخال كلمة المرور",
            errorKey: "confirmPassword",
            autoComplete: "new-password",
          })}
        </div>

        <div
          className="rounded-2xl border p-4 text-sm leading-7"
          style={{
            background: "linear-gradient(135deg, rgba(37,99,235,.08), rgba(79,70,229,.08))",
            borderColor: "rgba(79,70,229,.18)",
            color: "var(--gray-11)",
          }}
        >
          كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، مع حرف إنجليزي كبير وصغير ورقم ورمز خاص.
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {renderSelect({
            label: "الجنس",
            value: form.gender,
            onValueChange: (v) => setField("gender", v),
            placeholder: "اختر الجنس",
            options: GENDER_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
            errorKey: "gender",
          })}

          {renderInput({
            label: "العمر",
            icon: null,
            value: form.age,
            onChange: (e) => setField("age", e.target.value),
            placeholder: "مثال: 28",
            errorKey: "age",
            type: "number",
            inputMode: "numeric",
            min: 0,
            max: 150,
            dir: "ltr",
          })}

          {renderInput({
            label: "رقم الهوية",
            icon: null,
            value: form.nationalIdNumber,
            onChange: (e) => setField("nationalIdNumber", e.target.value),
            placeholder: "اختياري",
            errorKey: "nationalIdNumber",
            dir: "ltr",
          })}
        </div>
      </div>
    );
  }

  function renderShopStep() {
    const cityOptions = cities.map((city) => ({
      value: String(getEntityId(city)),
      label: city.name,
    }));

    const mallOptions = malls.map((mall) => ({
      value: String(getEntityId(mall)),
      label: mall.name,
    }));

    return (
      <div className="space-y-6">
        <div
          className="rounded-2xl border p-4"
          style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <FiInfo size={14} style={{ color: "var(--blue-11)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
              اختر طريقة ربط المتجر بالمول
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                value: "existing",
                title: "الانضمام إلى مول قائم",
                text: "إذا كان متجرك سيكون داخل مول موجود مسبقًا في النظام.",
              },
              {
                value: "new",
                title: "طلب إضافة مول جديد",
                text: "إذا كان المول غير موجود وتحتاج إضافته مع طلب المتجر.",
              },
            ].map((option) => {
              const active = form.mallMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleMallModeChange(option.value)}
                  className="text-right rounded-2xl border p-4 transition"
                  style={{
                    background: active ? "var(--blue-a3)" : "var(--gray-1)",
                    borderColor: active ? "var(--blue-a6)" : "var(--gray-a5)",
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                        {option.title}
                      </div>
                      <div className="text-xs mt-1 leading-6" style={{ color: "var(--gray-10)" }}>
                        {option.text}
                      </div>
                    </div>
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full border"
                      style={{
                        background: active ? "var(--blue-9)" : "transparent",
                        borderColor: active ? "var(--blue-9)" : "var(--gray-a6)",
                        color: active ? "#fff" : "var(--gray-9)",
                      }}
                    >
                      <FiCheck size={12} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {form.mallMode === "existing" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {renderSelect({
              label: "مدينة المول",
              value: form.existingMallCityId,
              onValueChange: (v) => {
                setField("existingMallCityId", v);
                setField("mallId", "", "shopRequest.mallId");
                clearFieldError("shopRequest.mallId");
              },
              placeholder: loadingCities ? "جاري تحميل المدن..." : "اختر المدينة",
              options: cityOptions,
              errorKey: "existingMallCityId",
              disabled: loadingCities,
            })}

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-11)" }}>
                المول القائم
              </label>
              <RxSelect
                value={form.mallId}
                onValueChange={(v) => setField("mallId", v, "shopRequest.mallId")}
                disabled={!form.existingMallCityId || loadingMalls}
                placeholder={
                  !form.existingMallCityId
                    ? "اختر المدينة أولًا"
                    : loadingMalls
                      ? "جاري تحميل المولات..."
                      : "اختر المول"
                }
                options={mallOptions}
                error={!!errors["shopRequest.mallId"]}
              />
              {!loadingMalls && form.existingMallCityId && !mallOptions.length && (
                <p className="text-[11px] mt-1" style={{ color: "var(--gray-9)" }}>
                  لا توجد مولات مفعلة في هذه المدينة حاليًا. يمكنك التحويل إلى طلب مول جديد.
                </p>
              )}
              {renderFieldError("shopRequest.mallId")}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {renderSelect({
              label: "مدينة المول الجديد",
              value: form.requestedMallCityId,
              onValueChange: (v) =>
                setField("requestedMallCityId", v, "shopRequest.requestedMallCityId"),
              placeholder: loadingCities ? "جاري تحميل المدن..." : "اختر المدينة",
              options: cityOptions,
              errorKey: "shopRequest.requestedMallCityId",
              disabled: loadingCities,
            })}

            {renderInput({
              label: "اسم المول الجديد",
              icon: FiMapPin,
              value: form.requestedMallName,
              onChange: (e) =>
                setField("requestedMallName", e.target.value, "shopRequest.requestedMallName"),
              placeholder: "أدخل اسم المول",
              errorKey: "shopRequest.requestedMallName",
            })}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {renderInput({
            label: "اسم المتجر",
            icon: FiBriefcase,
            value: form.shopName,
            onChange: (e) => setField("shopName", e.target.value, "shopRequest.name"),
            placeholder: "أدخل اسم المتجر",
            errorKey: "shopRequest.name",
          })}

          {renderSelect({
            label: "فئة المتجر",
            value: form.category,
            onValueChange: (v) => setField("category", v, "shopRequest.category"),
            placeholder: "اختر الفئة",
            options: Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
            errorKey: "shopRequest.category",
          })}
        </div>

        {renderTextArea({
          label: "وصف موقع المتجر داخل المول أو خارجه",
          value: form.location,
          onChange: (e) => setField("location", e.target.value, "shopRequest.location"),
          placeholder: "مثال: الطابق الأول قرب المدخل الشرقي",
          errorKey: "shopRequest.location",
          rows: 3,
        })}

        {renderTextArea({
          label: "نبذة عن المتجر",
          value: form.description,
          onChange: (e) => setField("description", e.target.value, "shopRequest.description"),
          placeholder: "اختياري: عرفنا بطبيعة المنتجات أو الخدمات التي يقدمها متجرك",
          errorKey: "shopRequest.description",
          rows: 4,
        })}

        <div
          className="rounded-2xl border p-4"
          style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
        >
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
              معلومات التواصل مع المتجر
            </h3>
            <p className="text-xs mt-1" style={{ color: "var(--gray-10)" }}>
              اختيارية، لكنها تساعد الإدارة في مراجعة الطلب بشكل أسرع.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {renderInput({
              label: "هاتف التواصل",
              icon: FiPhone,
              value: form.contactPhone,
              onChange: (e) => {
                setField("contactPhone", e.target.value, "shopRequest.contactInfo");
                clearFieldError("shopRequest.contactInfo");
              },
              placeholder: "رقم بديل أو هاتف المتجر",
              errorKey: "shopRequest.contactInfo",
              dir: "ltr",
            })}

            {renderInput({
              label: "بريد التواصل",
              icon: FiMail,
              value: form.contactEmail,
              onChange: (e) => {
                setField("contactEmail", e.target.value, "shopRequest.contactInfo");
                clearFieldError("shopRequest.contactInfo");
              },
              placeholder: "shop@example.com",
              errorKey: "shopRequest.contactInfo",
              dir: "ltr",
              type: "email",
            })}

            {renderInput({
              label: "واتساب",
              icon: FiPhone,
              value: form.contactWhatsapp,
              onChange: (e) => {
                setField("contactWhatsapp", e.target.value, "shopRequest.contactInfo");
                clearFieldError("shopRequest.contactInfo");
              },
              placeholder: "مثال: 0591234567",
              errorKey: "shopRequest.contactInfo",
              dir: "ltr",
            })}

            {renderInput({
              label: "إنستغرام",
              icon: FiUser,
              value: form.contactInstagram,
              onChange: (e) => {
                setField("contactInstagram", e.target.value, "shopRequest.contactInfo");
                clearFieldError("shopRequest.contactInfo");
              },
              placeholder: "@shop_handle",
              errorKey: "shopRequest.contactInfo",
              dir: "ltr",
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderUploadsStep() {
    return (
      <div className="space-y-6">
        <div
          className="rounded-2xl border p-4 text-sm leading-7"
          style={{
            background: "linear-gradient(135deg, rgba(37,99,235,.08), rgba(79,70,229,.08))",
            borderColor: "rgba(79,70,229,.18)",
            color: "var(--gray-11)",
          }}
        >
          ارفع صورًا واضحة وحديثة. لا يتم إرسال الطلب النهائي حتى يكتمل رفع صورة الترخيص وصورة
          واحدة على الأقل للمتجر.
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <UploadSlot
            id="profile-picture-upload"
            title="الصورة الشخصية"
            description="اختيارية، وتساعد في إكمال الملف التعريفي لصاحب الطلب."
            upload={profilePicture}
            onSelect={(file) => handleSingleUploadSelect("profile", file)}
            onRemove={() => removeSingleUpload("profile")}
            onRetry={() => handleRetrySingle("profile")}
            fieldError={errors.profilePictureUuid}
          />

          <UploadSlot
            id="logo-upload"
            title="شعار المتجر"
            description="اختياري، إذا كان لديك شعار جاهز للمتجر يمكنك إرفاقه هنا."
            upload={logoUpload}
            onSelect={(file) => handleSingleUploadSelect("logo", file)}
            onRemove={() => removeSingleUpload("logo")}
            onRetry={() => handleRetrySingle("logo")}
            fieldError={errors["shopRequest.logoUuid"]}
          />

          <div className="xl:col-span-2">
            <UploadSlot
              id="license-upload"
              title="صورة الترخيص"
              description="مطلوبة ويُفضّل أن تكون واضحة وكاملة حتى تتمكن الإدارة من التحقق منها."
              required
              upload={licenseUpload}
              onSelect={(file) => handleSingleUploadSelect("license", file)}
              onRemove={() => removeSingleUpload("license")}
              onRetry={() => handleRetrySingle("license")}
              fieldError={errors["shopRequest.licenseImageUuid"]}
            />
          </div>
        </div>

        <div
          className="rounded-2xl border p-4"
          style={{
            background: "var(--gray-1)",
            borderColor: errors["shopRequest.shopPhotosUuids"] ? "var(--red-a6)" : "var(--gray-a5)",
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                  صور المتجر
                </h3>
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                >
                  مطلوب
                </span>
              </div>
              <p className="text-xs mt-1 leading-6" style={{ color: "var(--gray-10)" }}>
                ارفع صورة واحدة على الأقل للواجهة أو المساحة الداخلية أو المنتجات المعروضة داخل
                المتجر.
              </p>
            </div>

            <label
              htmlFor="shop-photos-upload"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer transition hover:opacity-90"
              style={{ background: "var(--blue-9)", color: "#fff" }}
            >
              <FiUploadCloud size={14} />
              إضافة صور
            </label>
          </div>

          <input
            id="shop-photos-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleAddShopPhotos(e.target.files);
              e.target.value = "";
            }}
          />

          {shopPhotos.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shopPhotos.map((photo) => (
                <UploadPhotoTile
                  key={photo.key}
                  upload={photo}
                  onRetry={() => retryShopPhoto(photo.key)}
                  onRemove={() => removeShopPhoto(photo.key)}
                />
              ))}
            </div>
          ) : (
            <div
              className="mt-4 rounded-2xl border border-dashed p-5 text-center"
              style={{ borderColor: "var(--gray-a6)", background: "var(--gray-a2)" }}
            >
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
              >
                <FiImage size={20} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--gray-12)" }}>
                أضف صور المتجر لعرضه بالشكل الأفضل
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--gray-10)" }}>
                يمكنك رفع عدة صور دفعة واحدة، وسيتم التحقق منها قبل الإرسال.
              </p>
            </div>
          )}

          {renderFieldError("shopRequest.shopPhotosUuids")}
        </div>
      </div>
    );
  }

  function renderReviewItem(label, value, subtle = false) {
    return (
      <div className="flex items-start justify-between gap-4 py-3 border-b last:border-b-0" style={{ borderColor: "var(--gray-a4)" }}>
        <div className="text-sm" style={{ color: "var(--gray-10)" }}>
          {label}
        </div>
        <div className="text-sm font-medium text-left" style={{ color: subtle ? "var(--gray-10)" : "var(--gray-12)" }}>
          {value || "غير مذكور"}
        </div>
      </div>
    );
  }

  function renderReviewStep() {
    const chosenCity = cities.find((item) =>
      String(getEntityId(item)) ===
      String(form.mallMode === "existing" ? form.existingMallCityId : form.requestedMallCityId),
    );
    const shopPhotoCount = shopPhotos.filter((item) => item.status === "done" && item.id).length;

    return (
      <div className="space-y-6">
        <div
          className="rounded-2xl border p-4"
          style={{ background: "var(--green-a2)", borderColor: "var(--green-a6)" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl shrink-0"
              style={{ background: "var(--green-a3)", color: "var(--green-11)" }}
            >
              <FiCheckCircle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                جاهز للإرسال
              </h3>
              <p className="text-sm mt-1 leading-7" style={{ color: "var(--gray-11)" }}>
                بعد الإرسال سيبقى الطلب في حالة قيد المراجعة حتى تتم مراجعته من الإدارة، ولن يتم
                إنشاء جلسة دخول تلقائية من هذه الصفحة.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div
            className="rounded-2xl border p-5"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--gray-12)" }}>
              بيانات الحساب
            </h3>
            {renderReviewItem("الاسم الكامل", form.fullName.trim())}
            {renderReviewItem("اسم المستخدم", form.username.trim(), true)}
            {renderReviewItem("البريد الإلكتروني", form.email.trim() || "غير مذكور", true)}
            {renderReviewItem("رقم الهاتف", `+972 ${form.phoneNumber.trim()}`, true)}
            {renderReviewItem(
              "الجنس",
              GENDER_OPTIONS.find((item) => item.value === form.gender)?.label || "غير مذكور",
            )}
            {renderReviewItem("العمر", form.age ? `${form.age} سنة` : "غير مذكور")}
            {renderReviewItem("رقم الهوية", form.nationalIdNumber.trim() || "غير مذكور", true)}
            {renderReviewItem("كلمة المرور", "تم إدخال كلمة مرور قوية", true)}
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--gray-12)" }}>
              بيانات المتجر
            </h3>
            {renderReviewItem("نوع الربط بالمول", getMallModeLabel(form, cities, malls))}
            {renderReviewItem("المدينة المقترحة للمول", chosenCity?.name || "غير مذكور", true)}
            {renderReviewItem("اسم المتجر", form.shopName.trim())}
            {renderReviewItem("الفئة", CATEGORY_LABELS[form.category] || "غير مذكور", true)}
            {renderReviewItem("الموقع", form.location.trim())}
            {renderReviewItem("الوصف", form.description.trim() || "غير مذكور", true)}
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--gray-12)" }}>
              وسائل التواصل
            </h3>
            {renderReviewItem("هاتف التواصل", form.contactPhone.trim() || "غير مذكور", true)}
            {renderReviewItem("بريد التواصل", form.contactEmail.trim() || "غير مذكور", true)}
            {renderReviewItem("واتساب", form.contactWhatsapp.trim() || "غير مذكور", true)}
            {renderReviewItem("إنستغرام", form.contactInstagram.trim() || "غير مذكور", true)}
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{ background: "var(--gray-1)", borderColor: "var(--gray-a5)" }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--gray-12)" }}>
              المرفقات
            </h3>
            {renderReviewItem(
              "الصورة الشخصية",
              profilePicture.id ? "مرفوعة" : "غير مرفوعة",
              !profilePicture.id,
            )}
            {renderReviewItem("شعار المتجر", logoUpload.id ? "مرفوع" : "غير مرفوع", !logoUpload.id)}
            {renderReviewItem("صورة الترخيص", licenseUpload.id ? "مرفوعة" : "غير مرفوعة")}
            {renderReviewItem("عدد صور المتجر", `${shopPhotoCount} صورة`)}
          </div>
        </div>
      </div>
    );
  }

  if (submittedRequest) {
    const statusLabel = STATUS_LABELS[submittedRequest.status] || "قيد المراجعة";

    return (
      <div dir="rtl" className="min-h-screen flex" style={{ background: "var(--gray-2)" }}>
        <aside
          className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 shrink-0"
          style={{ background: "linear-gradient(145deg, #2563eb 0%, #4f46e5 100%)" }}
        >
          <div>
            <div className="text-3xl font-bold text-white tracking-wide">سوقنا</div>
            <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,.65)" }}>
              طلبات انضمام أصحاب المتاجر
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white leading-snug">
              تم استلام طلبك<br />وجارٍ مراجعته
            </h2>
            <div className="space-y-3">
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,.2)" }}
                  >
                    <FiCheck size={11} color="#fff" />
                  </div>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,.85)" }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs" style={{ color: "rgba(255,255,255,.35)" }}>
            © {new Date().getFullYear()} سوقنا - جميع الحقوق محفوظة
          </p>
        </aside>

        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[620px]">
            <div className="lg:hidden text-center mb-8">
              <div className="text-4xl font-bold tracking-wide bg-linear-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                سوقنا
              </div>
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full mt-2"
                style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
              >
                طلب فتح متجر
              </span>
            </div>

            <div
              className="rounded-[28px] border p-6 sm:p-8"
              style={{
                background: "var(--gray-1)",
                borderColor: "var(--gray-a6)",
                boxShadow: "0 28px 70px rgba(0,0,0,.12)",
              }}
            >
              <div
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[24px]"
                style={{ background: "var(--green-a3)", color: "var(--green-11)" }}
              >
                <FiCheckCircle size={28} />
              </div>

              <div className="text-center">
                <span
                  className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
                >
                  {statusLabel}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold mt-4" style={{ color: "var(--gray-12)" }}>
                  تم إرسال طلب فتح المتجر بنجاح
                </h1>
                <p className="text-sm leading-7 mt-3" style={{ color: "var(--gray-10)" }}>
                  وصل طلبك إلى فريق الإدارة في سوقنا، وسيتم مراجعته قبل إنشاء حساب صاحب المتجر
                  واعتماد المتجر بشكل نهائي.
                </p>
              </div>

              <div
                className="rounded-2xl border p-4 mt-6"
                style={{ background: "var(--gray-a2)", borderColor: "var(--gray-a5)" }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs" style={{ color: "var(--gray-9)" }}>
                      رقم الطلب
                    </div>
                    <div className="text-sm font-semibold mt-1" style={{ color: "var(--gray-12)" }}>
                      #{submittedRequest.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--gray-9)" }}>
                      اسم المتجر
                    </div>
                    <div className="text-sm font-semibold mt-1" style={{ color: "var(--gray-12)" }}>
                      {submittedRequest.shopRequest?.name || form.shopName.trim()}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl border p-4 mt-5"
                style={{ background: "var(--blue-a2)", borderColor: "var(--blue-a5)" }}
              >
                <h2 className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                  ماذا بعد؟
                </h2>
                <ul className="mt-2 space-y-2 text-sm leading-7" style={{ color: "var(--gray-11)" }}>
                  <li>سيتم مراجعة بيانات صاحب الطلب والمتجر والمرفقات من قبل الإدارة.</li>
                  <li>عند الموافقة سيتم تفعيل الحساب وإتاحة تسجيل الدخول كصاحب متجر.</li>
                  <li>إذا احتاجت الإدارة إلى معلومات إضافية فسيتم التواصل باستخدام البيانات المرسلة.</li>
                </ul>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/shop-owner/login"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                  style={{ background: "var(--blue-9)", color: "#fff" }}
                >
                  الانتقال إلى دخول صاحب المتجر
                  <FiArrowLeft size={16} />
                </Link>
                <Link
                  to="/"
                  className="flex-1 inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-80"
                  style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}
                >
                  العودة إلى الصفحة الرئيسية
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex" style={{ background: "var(--gray-2)" }}>
      <aside
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 shrink-0"
        style={{ background: "linear-gradient(145deg, #2563eb 0%, #4f46e5 100%)" }}
      >
        <div>
          <div className="text-3xl font-bold text-white tracking-wide">سوقنا</div>
          <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,.65)" }}>
            طلب فتح متجر جديد
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-snug">
              ابدأ رحلتك كصاحب متجر<br />بملف متكامل واحترافي
            </h2>
            <p className="text-sm mt-4 leading-7" style={{ color: "rgba(255,255,255,.78)" }}>
              أرسل طلب فتح المتجر مع بيانات الحساب والمرفقات المطلوبة، وسيتم مراجعته من الإدارة
              قبل التفعيل.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,.2)" }}
                >
                  <FiCheck size={11} color="#fff" />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,.85)" }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <div
            className="rounded-[28px] p-5"
            style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.12)" }}
          >
            <div className="grid gap-3">
              {STEP_ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-2xl shrink-0"
                      style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {index + 1}. {item.title}
                      </div>
                      <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,.72)" }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,.35)" }}>
          © {new Date().getFullYear()} سوقنا - جميع الحقوق محفوظة
        </p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-10">
        <div className="lg:hidden text-center mb-8">
          <div className="text-4xl font-bold tracking-wide bg-linear-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            سوقنا
          </div>
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mt-2"
            style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
          >
            طلب فتح متجر
          </span>
        </div>

        <div className="w-full max-w-[940px]">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}
              >
                انضم إلى سوقنا
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--gray-12)" }}>
                تقديم طلب فتح متجر
              </h1>
              <p className="text-sm mt-2 leading-7" style={{ color: "var(--gray-10)" }}>
                أكمل الخطوات الأربع التالية، ثم أرسل الطلب ليصل إلى الإدارة للمراجعة والاعتماد.
              </p>
            </div>

            <Link
              to="/shop-owner/login"
              className="inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-75"
              style={{ color: "var(--gray-10)" }}
            >
              لديك حساب صاحب متجر؟
              <FiArrowLeft size={15} />
            </Link>
          </div>

          <div
            className="rounded-[28px] border p-4 mb-5"
            style={{
              background: "var(--gray-1)",
              borderColor: "var(--gray-a5)",
              boxShadow: "0 18px 50px rgba(0,0,0,.06)",
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {STEP_ITEMS.map((item, index) => {
                const active = step === index;
                const completed = step > index;
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      if (index <= step) {
                        setStep(index);
                        setFormError("");
                        scrollToTop();
                      }
                    }}
                    className="text-right rounded-2xl border p-4 transition"
                    style={{
                      background: active ? "var(--blue-a2)" : "var(--gray-a2)",
                      borderColor: active || completed ? "var(--blue-a6)" : "var(--gray-a5)",
                      cursor: index <= step ? "pointer" : "default",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl shrink-0"
                        style={{
                          background: completed || active ? "var(--blue-9)" : "var(--gray-a4)",
                          color: completed || active ? "#fff" : "var(--gray-10)",
                        }}
                      >
                        {completed ? <FiCheck size={16} /> : <Icon size={16} />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "var(--gray-12)" }}>
                          {item.title}
                        </div>
                        <div className="text-xs mt-1 leading-6" style={{ color: "var(--gray-10)" }}>
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[30px] border p-5 sm:p-6 lg:p-8"
            style={{
              background: "var(--gray-1)",
              borderColor: "var(--gray-a6)",
              boxShadow: "0 28px 70px rgba(0,0,0,.12)",
            }}
          >
            <div className="mb-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--blue-11)" }}>
                    الخطوة {step + 1} من {STEP_ITEMS.length}
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>
                    {STEP_ITEMS[step].title}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--gray-10)" }}>
                    {STEP_ITEMS[step].subtitle}
                  </p>
                </div>
              </div>
            </div>

            {formError && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-2xl text-sm mb-5"
                style={{
                  background: "var(--red-a3)",
                  color: "var(--red-11)",
                  border: "1px solid var(--red-a6)",
                }}
              >
                <FiAlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {step === 0 && renderAccountStep()}
            {step === 1 && renderShopStep()}
            {step === 2 && renderUploadsStep()}
            {step === 3 && renderReviewStep()}

            <div
              className="mt-8 pt-5 border-t flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: "var(--gray-a5)" }}
            >
              <div className="text-xs leading-6" style={{ color: "var(--gray-9)" }}>
                يتم حفظ الصور المرفوعة مؤقتًا لاستخدامها في هذا الطلب فقط حتى تتم مراجعته.
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-85"
                    style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}
                  >
                    <FiArrowRight size={16} />
                    السابق
                  </button>
                )}

                {step < STEP_ITEMS.length - 1 ? (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                    style={{ background: "var(--blue-9)", color: "#fff" }}
                  >
                    التالي
                    <FiArrowLeft size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
                    style={{ background: "var(--blue-9)", color: "#fff" }}
                  >
                    {submitting && <FiLoader size={15} className="animate-spin" />}
                    {submitting ? "جاري إرسال الطلب..." : "إرسال طلب فتح المتجر"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
