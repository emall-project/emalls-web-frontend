import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiEye, FiEyeOff } from "react-icons/fi";
import { usersApi } from "./api";
import { ROLE_OPTIONS, ACTIVE_OPTIONS, getRoleId, getPhonePrefix, getPhoneNumber } from "./constants";
import { useThemeContainer, Spinner, TextInput, CustomDropdown, dialogSurface } from "./ui";

const GENDER_OPTIONS = [
  { value: "MALE", label: "ذكر" },
  { value: "FEMALE", label: "أنثى" },
  { value: "NOT_SPECIFIED", label: "غير محدد" },
];

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#_+=-])[A-Za-z\d@$!%*?&^#_+=-]{8,}$/;
const PHONE_NUMBER_REGEX = /^05(9|6|4)\d{7}$/;

const FIELD_MAP = {
  fullName: "fullName",
  username: "userName",
  email: "email",
  password: "password",
  phone: "phoneNumber",
  "phone.number": "phoneNumber",
  "phone.prefix": "phonePrefix",
  "phone.countryCode": "phonePrefix",
  role: "roleId",
  "role.roleId": "roleId",
  gender: "gender",
  age: "age",
};

function presentFieldMessage(message = "") {
  const text = String(message || "");
  const lowered = text.toLowerCase();

  if (lowered.includes("notblank") || lowered.includes("notnull") || lowered.includes("required")) {
    return "هذا الحقل مطلوب";
  }
  if (lowered.includes("email")) return "صيغة البريد الإلكتروني غير صحيحة";
  if (lowered.includes("size")) return "الطول غير مناسب";
  if (lowered.includes("pattern")) return "الصيغة غير صحيحة";
  if (lowered.includes("min")) return "القيمة أصغر من الحد المسموح";
  if (lowered.includes("max")) return "القيمة أكبر من الحد المسموح";

  return text || "قيمة غير صحيحة";
}

function normalizePhoneNumber(value = "") {
  let digits = String(value).replace(/\D/g, "");

  if (digits.startsWith("970") || digits.startsWith("972")) {
    digits = digits.slice(3);
  }

  if (digits.length === 9 && /^(59|56|54)/.test(digits)) {
    digits = `0${digits}`;
  }

  return digits;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs mt-1" style={{ color: "var(--red-9)" }}>{msg}</p>;
}

export default function UserFormDialog({ open, onOpenChange, user, onSuccess, showToast }) {
  const themeContainer = useThemeContainer();
  const isEdit = !!user;
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+970");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("NOT_SPECIFIED");
  const [age, setAge] = useState("");
  const [roleId, setRoleId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;

    setFieldErrors({});

    if (isEdit && user) {
      setFullName(user.fullName || "");
      setUserName(user.username || "");
      setEmail(user.email || "");
      setPhonePrefix(getPhonePrefix(user));
      setPhoneNumber(getPhoneNumber(user));
      setGender(user.gender || "NOT_SPECIFIED");
      setAge(user.age != null ? String(user.age) : "");
      setRoleId(getRoleId(user) || "");
      setPassword("");
      setIsActive(!!user.isActive);
      return;
    }

    setFullName("");
    setUserName("");
    setEmail("");
    setPhonePrefix("+970");
    setPhoneNumber("");
    setGender("NOT_SPECIFIED");
    setAge("");
    setRoleId("");
    setPassword("");
    setIsActive(true);
  }, [open, isEdit, user]);

  const clearErr = (field) => setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  const validate = () => {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const normalizedAge = Number(age);

    if (!fullName.trim()) {
      showToast("الاسم الكامل مطلوب", "error");
      return null;
    }

    if (!phoneNumber.trim()) {
      showToast("رقم الهاتف مطلوب", "error");
      return null;
    }

    if (!PHONE_NUMBER_REGEX.test(normalizedPhoneNumber)) {
      showToast("رقم الهاتف يجب أن يكون بصيغة 059XXXXXXX", "error");
      return null;
    }

    if (!isEdit && !userName.trim()) {
      showToast("اسم المستخدم مطلوب", "error");
      return null;
    }

    if (!isEdit && !email.trim()) {
      showToast("البريد الإلكتروني مطلوب", "error");
      return null;
    }

    if (!isEdit && !roleId) {
      showToast("الدور مطلوب", "error");
      return null;
    }

    if (!isEdit && !password.trim()) {
      showToast("كلمة المرور مطلوبة", "error");
      return null;
    }

    if (!isEdit && !PASSWORD_REGEX.test(password.trim())) {
      showToast("كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص", "error");
      return null;
    }

    if (!isEdit && !gender) {
      showToast("الجنس مطلوب", "error");
      return null;
    }

    if (!isEdit && age === "") {
      showToast("العمر مطلوب", "error");
      return null;
    }

    if (!isEdit && (!Number.isInteger(normalizedAge) || normalizedAge < 0 || normalizedAge > 150)) {
      showToast("العمر يجب أن يكون بين 0 و 150", "error");
      return null;
    }

    return { normalizedPhoneNumber, normalizedAge };
  };

  const handleSubmit = async () => {
    const validated = validate();
    if (!validated) return;

    setSubmitting(true);
    setFieldErrors({});

    try {
      if (isEdit) {
        await usersApi.update({
          userId: user.userId,
          fullName: fullName.trim(),
          phone: {
            prefix: phonePrefix.trim() || "+970",
            number: validated.normalizedPhoneNumber,
          },
          isActive,
        });
      } else {
        await usersApi.create({
          fullName: fullName.trim(),
          username: userName.trim(),
          email: email.trim(),
          phone: {
            prefix: phonePrefix.trim() || "+970",
            number: validated.normalizedPhoneNumber,
          },
          role: { roleId: Number(roleId) },
          password: password.trim(),
          gender,
          age: validated.normalizedAge,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (error.errorCodes?.length) {
        const mapped = {};
        error.errorCodes.forEach(({ field, message }) => {
          const key = FIELD_MAP[field] || field;
          mapped[key] = presentFieldMessage(message);
        });
        setFieldErrors(mapped);
      } else {
        showToast(error.message || "خطأ في الطلب", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[9998]" />
        <Dialog.Content
          className="fixed z-[9999] top-1/2 left-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl flex flex-col outline-none"
          style={dialogSurface}
          aria-describedby={undefined}
        >
          <div
            className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}
          >
            <div>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                {isEdit ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
              </Dialog.Title>
              <p className="text-xs mt-0.5" style={{ color: "var(--gray-11)" }}>
                {isEdit ? "تعديل بيانات المستخدم المحدد" : "إضافة مستخدم جديد للنظام"}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--gray-11)", background: "transparent", border: "none" }}
              >
                <FiX size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-6 py-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <TextInput
                  label="الاسم الكامل *"
                  value={fullName}
                  onChange={(v) => {
                    setFullName(v);
                    clearErr("fullName");
                  }}
                  placeholder="مثال: محمد أحمد"
                />
                <FieldError msg={fieldErrors.fullName} />
              </div>

              <div className="space-y-1.5">
                <TextInput
                  label="اسم المستخدم *"
                  value={userName}
                  onChange={(v) => {
                    setUserName(v);
                    clearErr("userName");
                  }}
                  placeholder="مثال: mohammed123"
                  disabled={isEdit}
                />
                <FieldError msg={fieldErrors.userName} />
              </div>

              <div className="space-y-1.5">
                <TextInput
                  label="البريد الإلكتروني *"
                  value={email}
                  onChange={(v) => {
                    setEmail(v);
                    clearErr("email");
                  }}
                  placeholder="example@mail.com"
                  type="email"
                  disabled={isEdit}
                />
                <FieldError msg={fieldErrors.email} />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
                  رقم الهاتف *
                </label>
                <div className="flex gap-2" dir="ltr">
                  <select
                    value={phonePrefix}
                    onChange={(e) => {
                      setPhonePrefix(e.target.value);
                      clearErr("phonePrefix");
                    }}
                    className="f-input"
                    style={{ width: 110, flexShrink: 0, cursor: "pointer", textAlign: "center" }}
                  >
                    <option value="+970">🇵🇸 +970</option>
                    <option value="+972">🇮🇱 +972</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      clearErr("phoneNumber");
                    }}
                    placeholder="0591234567"
                    className="f-input"
                    style={{ flex: 1, borderColor: fieldErrors.phoneNumber ? "var(--red-7)" : undefined }}
                  />
                </div>
                <FieldError msg={fieldErrors.phoneNumber} />
                <p className="text-[11px]" style={{ color: "var(--gray-10)" }}>
                  اكتب الرقم المحلي بصيغة 0591234567. يمكننا تنظيف المسافات تلقائياً.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
                  الدور {!isEdit && "*"}
                </label>
                <CustomDropdown
                  value={String(roleId)}
                  onChange={(v) => {
                    setRoleId(v);
                    clearErr("roleId");
                  }}
                  options={ROLE_OPTIONS}
                  placeholder="اختر الدور"
                />
                <FieldError msg={fieldErrors.roleId} />
              </div>

              {!isEdit && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
                      الجنس *
                    </label>
                    <CustomDropdown
                      value={gender}
                      onChange={(v) => {
                        setGender(v);
                        clearErr("gender");
                      }}
                      options={GENDER_OPTIONS}
                      placeholder="اختر الجنس"
                    />
                    <FieldError msg={fieldErrors.gender} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
                      العمر *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value);
                        clearErr("age");
                      }}
                      placeholder="25"
                      className="f-input"
                      style={{ borderColor: fieldErrors.age ? "var(--red-7)" : undefined }}
                    />
                    <FieldError msg={fieldErrors.age} />
                  </div>
                </>
              )}

              {isEdit ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
                    الحالة
                  </label>
                  <CustomDropdown
                    value={String(isActive)}
                    onChange={(v) => setIsActive(v === "true")}
                    options={ACTIVE_OPTIONS}
                    placeholder="اختر الحالة"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearErr("password");
                      }}
                      placeholder="••••••••"
                      className="f-input"
                      style={{ paddingLeft: "2.5rem", borderColor: fieldErrors.password ? "var(--red-7)" : undefined }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                      style={{ color: "var(--gray-11)", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  <FieldError msg={fieldErrors.password} />
                  <p className="text-[11px]" style={{ color: "var(--gray-10)" }}>
                    8+ أحرف، ويجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص.
                  </p>
                </div>
              )}

              {isEdit && (
                <div className="sm:col-span-2">
                  <div
                    className="rounded-xl px-4 py-3 text-xs"
                    style={{
                      background: "var(--gray-a2)",
                      border: "1px solid var(--gray-a5)",
                      color: "var(--gray-10)",
                    }}
                  >
                    ملاحظة: يمكن تعديل الاسم ورقم الهاتف والحالة فقط. البريد الإلكتروني واسم المستخدم لا يمكن تغييرهما.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className="px-6 py-4 border-t flex items-center gap-3 flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}
          >
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#2563eb", color: "#fff" }}
            >
              {submitting ? <Spinner size={14} /> : null}
              {isEdit ? "حفظ التعديلات" : "إنشاء المستخدم"}
            </button>
            <Dialog.Close asChild>
              <button
                className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}
              >
                إلغاء
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
