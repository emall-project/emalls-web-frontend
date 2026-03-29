import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiEye, FiEyeOff } from "react-icons/fi";
import { usersApi } from "./api";
import { ROLE_OPTIONS, ACTIVE_OPTIONS, getRoleId, getPhonePrefix, getPhoneNumber } from "./constants";
import { useThemeContainer, Spinner, TextInput, CustomDropdown, dialogSurface } from "./ui";

// Map backend field names → form field keys
const FIELD_MAP = {
  fullName:          "fullName",
  username:          "userName",
  email:             "email",
  password:          "password",
  "phone":           "phoneNumber",
  "phone.number":    "phoneNumber",
  "phone.countryCode": "phonePrefix",
  "role":            "roleId",
  "role.roleId":     "roleId",
};

// Translate backend message codes to Arabic
function translateCode(code = "") {
  const c = code.toLowerCase();
  if (c.includes("notblank") || c.includes("notnull") || c.includes("required")) return "هذا الحقل مطلوب";
  if (c.includes("email"))    return "صيغة البريد الإلكتروني غير صحيحة";
  if (c.includes("size"))     return "الطول غير مناسب";
  if (c.includes("pattern"))  return "الصيغة غير صحيحة";
  if (c.includes("min"))      return "القيمة أصغر من الحد المسموح";
  if (c.includes("max"))      return "القيمة أكبر من الحد المسموح";
  return "قيمة غير صحيحة";
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs mt-1" style={{ color: "var(--red-9)" }}>{msg}</p>;
}

export default function UserFormDialog({ open, onOpenChange, user, onSuccess, showToast }) {
  const themeContainer = useThemeContainer();
  const isEdit         = !!user;
  const [submitting,   setSubmitting]   = useState(false);
  const [fieldErrors,  setFieldErrors]  = useState({});

  const [fullName,     setFullName]     = useState("");
  const [userName,     setUserName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [phonePrefix,  setPhonePrefix]  = useState("+970");
  const [phoneNumber,  setPhoneNumber]  = useState("");
  const [roleId,       setRoleId]       = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isActive,     setIsActive]     = useState(true);

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    if (isEdit && user) {
      setFullName(user.fullName   || "");
      setUserName(user.userName   || "");
      setEmail(user.email         || "");
      setPhonePrefix(getPhonePrefix(user));
      setPhoneNumber(getPhoneNumber(user));
      setRoleId(getRoleId(user)   || "");
      setPassword("");
      setIsActive(!!user.isActive);
    } else {
      setFullName(""); setUserName(""); setEmail(""); setPhonePrefix("+970"); setPhoneNumber("");
      setRoleId(""); setPassword(""); setIsActive(true);
    }
  }, [open, isEdit, user]);

  const clearErr = (field) => setFieldErrors((p) => ({ ...p, [field]: "" }));

  const validate = () => {
    if (!fullName.trim())            { showToast("الاسم الكامل مطلوب",       "error"); return false; }
    if (!phoneNumber.trim())         { showToast("رقم الهاتف مطلوب",         "error"); return false; }
    if (!isEdit && !userName.trim()) { showToast("اسم المستخدم مطلوب",       "error"); return false; }
    if (!isEdit && !email.trim())    { showToast("البريد الإلكتروني مطلوب",  "error"); return false; }
    if (!isEdit && !roleId)          { showToast("الدور مطلوب",              "error"); return false; }
    if (!isEdit && !password.trim()) { showToast("كلمة المرور مطلوبة",       "error"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setFieldErrors({});
    try {
      if (isEdit) {
        await usersApi.update({
          userId: user.userId,
          fullName: fullName.trim(),
          phone: { prefix: phonePrefix.trim() || "+970", number: phoneNumber.trim() },
          isActive,
        });
      } else {
        await usersApi.create({
          fullName: fullName.trim(), username: userName.trim(), email: email.trim(),
          phone: { countryCode: phonePrefix.trim() || "+970", number: phoneNumber.trim() },
          role: { roleId: Number(roleId) },
          password: password.trim(),
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Map field-level errors if available
      if (error.errorCodes?.length) {
        const mapped = {};
        error.errorCodes.forEach(({ field, message }) => {
          const key = FIELD_MAP[field] || field;
          mapped[key] = translateCode(message);
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
          style={dialogSurface} aria-describedby={undefined}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <div>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                {isEdit ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
              </Dialog.Title>
              <p className="text-xs mt-0.5" style={{ color: "var(--gray-11)" }}>
                {isEdit ? "تعديل بيانات المستخدم المحدد" : "إضافة مستخدم جديد للنظام"}
              </p>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--gray-11)", background: "transparent", border: "none" }}>
                <FiX size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Full Name */}
              <div className="space-y-1.5">
                <TextInput label="الاسم الكامل *" value={fullName}
                  onChange={(v) => { setFullName(v); clearErr("fullName"); }}
                  placeholder="مثال: محمد أحمد" />
                <FieldError msg={fieldErrors.fullName} />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <TextInput label="اسم المستخدم *" value={userName}
                  onChange={(v) => { setUserName(v); clearErr("userName"); }}
                  placeholder="مثال: mohammed123" disabled={isEdit} />
                <FieldError msg={fieldErrors.userName} />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <TextInput label="البريد الإلكتروني *" value={email}
                  onChange={(v) => { setEmail(v); clearErr("email"); }}
                  placeholder="example@mail.com" type="email" disabled={isEdit} />
                <FieldError msg={fieldErrors.email} />
              </div>

              {/* Phone */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>رقم الهاتف *</label>
                <div className="flex gap-2" dir="ltr">
                  <select
                    value={phonePrefix}
                    onChange={(e) => { setPhonePrefix(e.target.value); clearErr("phonePrefix"); }}
                    className="f-input"
                    style={{ width: 110, flexShrink: 0, cursor: "pointer", textAlign: "center" }}
                  >
                    <option value="+970">🇵🇸 +970</option>
                    <option value="+972">🇮🇱 +972</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => { setPhoneNumber(e.target.value); clearErr("phoneNumber"); }}
                    placeholder="599 123 456"
                    className="f-input"
                    style={{ flex: 1, borderColor: fieldErrors.phoneNumber ? "var(--red-7)" : undefined }}
                  />
                </div>
                <FieldError msg={fieldErrors.phoneNumber} />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الدور {!isEdit && "*"}</label>
                <CustomDropdown value={String(roleId)}
                  onChange={(v) => { setRoleId(v); clearErr("roleId"); }}
                  options={ROLE_OPTIONS} placeholder="اختر الدور" />
                <FieldError msg={fieldErrors.roleId} />
              </div>

              {/* Active / Password */}
              {isEdit ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الحالة</label>
                  <CustomDropdown value={String(isActive)} onChange={(v) => setIsActive(v === "true")}
                    options={ACTIVE_OPTIONS} placeholder="اختر الحالة" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>كلمة المرور *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearErr("password"); }}
                      placeholder="••••••••"
                      className="f-input"
                      style={{ paddingLeft: "2.5rem", borderColor: fieldErrors.password ? "var(--red-7)" : undefined }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                      style={{ color: "var(--gray-11)", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  <FieldError msg={fieldErrors.password} />
                </div>
              )}

              {/* Edit note */}
              {isEdit && (
                <div className="sm:col-span-2">
                  <div className="rounded-xl px-4 py-3 text-xs"
                    style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a5)", color: "var(--gray-10)" }}>
                    ملاحظة: يمكن تعديل الاسم ورقم الهاتف والحالة فقط. البريد الإلكتروني واسم المستخدم لا يمكن تغييرهما.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex items-center gap-3 flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#2563eb", color: "#fff" }}>
              {submitting ? <Spinner size={14} /> : null}
              {isEdit ? "حفظ التعديلات" : "إنشاء المستخدم"}
            </button>
            <Dialog.Close asChild>
              <button className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}>
                إلغاء
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
