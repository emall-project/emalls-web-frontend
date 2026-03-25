import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX } from "react-icons/fi";
import { usersApi } from "./api";
import { ROLE_OPTIONS, ACTIVE_OPTIONS, FAKE_USER, getErrorMessage, getRoleId, getPhonePrefix, getPhoneNumber } from "./constants";
import { useThemeContainer, Spinner, TextInput, CustomDropdown, dialogSurface } from "./ui";

export default function UserFormDialog({ open, onOpenChange, user, onSuccess, showToast }) {
  const themeContainer = useThemeContainer();
  const isEdit         = !!user;
  const [submitting,   setSubmitting]   = useState(false);

  const [fullName,     setFullName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [phonePrefix,  setPhonePrefix]  = useState("+970");
  const [phoneNumber,  setPhoneNumber]  = useState("");
  const [roleId,       setRoleId]       = useState("");
  const [password,     setPassword]     = useState("");
  const [isActive,     setIsActive]     = useState(true);

  useEffect(() => {
    if (!open) return;
    if (isEdit && user) {
      setFullName(user.fullName   || "");
      setEmail(user.email         || "");
      setPhonePrefix(getPhonePrefix(user));
      setPhoneNumber(getPhoneNumber(user));
      setRoleId(getRoleId(user)   || "");
      setPassword("");
      setIsActive(!!user.isActive);
    } else {
      setFullName(""); setEmail(""); setPhonePrefix("+970"); setPhoneNumber("");
      setRoleId(""); setPassword(""); setIsActive(true);
    }
  }, [open, isEdit, user]);

  const validate = () => {
    if (!fullName.trim())               { showToast("الاسم الكامل مطلوب",         "error"); return false; }
    if (!phoneNumber.trim())            { showToast("رقم الهاتف مطلوب",           "error"); return false; }
    if (!isEdit && !email.trim())       { showToast("البريد الإلكتروني مطلوب",    "error"); return false; }
    if (!isEdit && !roleId)             { showToast("الدور مطلوب",                "error"); return false; }
    if (!isEdit && !password.trim())    { showToast("كلمة المرور مطلوبة",         "error"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (isEdit && user?.userId === FAKE_USER.userId) {
      showToast("هذا مستخدم تجريبي فقط 😄", "error"); return;
    }

    setSubmitting(true);
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
          fullName: fullName.trim(), email: email.trim(),
          phone: { countryCode: phonePrefix.trim() || "+970", number: phoneNumber.trim() },
          role: { roleId: Number(roleId) },
          password: password.trim(),
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
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

              <TextInput label="الاسم الكامل *" value={fullName} onChange={setFullName} placeholder="مثال: John Doe" />

              <TextInput label="البريد الإلكتروني" value={email} onChange={setEmail}
                placeholder="example@mail.com" type="email" disabled={isEdit} />

              <TextInput label="Country Code" value={phonePrefix} onChange={setPhonePrefix} placeholder="+970" />

              <TextInput label="رقم الهاتف *" value={phoneNumber} onChange={setPhoneNumber} placeholder="0599123456" />

              {/* Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الدور {!isEdit && "*"}</label>
                <CustomDropdown value={String(roleId)} onChange={(v) => setRoleId(v)}
                  options={ROLE_OPTIONS} placeholder="اختر الدور" />
              </div>

              {/* Active / Password */}
              {isEdit ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الحالة</label>
                  <CustomDropdown value={String(isActive)} onChange={(v) => setIsActive(v === "true")}
                    options={ACTIVE_OPTIONS} placeholder="اختر الحالة" />
                </div>
              ) : (
                <TextInput label="كلمة المرور *" value={password} onChange={setPassword}
                  placeholder="********" type="password" />
              )}

              {/* Edit note */}
              {isEdit && (
                <div className="sm:col-span-2">
                  <div className="rounded-xl px-4 py-3 text-xs"
                    style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a5)", color: "var(--gray-10)" }}>
                    ملاحظة: التعديل يعتمد على
                    <span className="font-semibold mx-1" style={{ color: "var(--gray-12)" }}>
                      fullName + phone + isActive
                    </span>
                    فقط حسب الـ endpoint الحالي.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex items-center  gap-3 flex-shrink-0"
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