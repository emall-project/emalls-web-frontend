import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiUser, FiMail, FiPhone, FiShield, FiCheckCircle, FiXCircle, FiEdit2, FiAtSign } from "react-icons/fi";
import { useThemeContainer, InfoCard, PhoneValue, dialogSurface } from "./ui";
import { getRoleLabel, formatPhone } from "./constants";

export default function UserDetailsDialog({ open, onOpenChange, user, onEdit }) {
  const themeContainer = useThemeContainer();
  if (!user) return null;

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
                تفاصيل المستخدم
              </Dialog.Title>
              <p className="text-xs mt-0.5" style={{ color: "var(--gray-11)" }}>
                معلومات المستخدم المحدد
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard label="الاسم الكامل"        value={user.fullName  || "—"}        icon={<FiUser size={14} />} />
              <InfoCard label="اسم المستخدم"        value={user.username  || "—"}        icon={<FiAtSign size={14} />} />
              <InfoCard label="البريد الإلكتروني"   value={user.email    || "—"}         icon={<FiMail size={14} />} />
              <InfoCard label="رقم الهاتف"          value={<PhoneValue value={formatPhone(user)} />} icon={<FiPhone size={14} />} />
              <InfoCard label="الدور"               value={getRoleLabel(user)}           icon={<FiShield size={14} />} />
              <InfoCard label="الحالة"              value={user.isActive ? "نشط" : "غير نشط"}
                icon={user.isActive ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />} />
              <InfoCard label="معرّف المستخدم"      value={`#${user.userId}`}            icon={<FiUser size={14} />} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex items-center justify-end gap-3 flex-shrink-0"
            style={{ borderColor: "var(--gray-a6)" }}>
            <button
              onClick={() => { onEdit?.(user); onOpenChange(false); }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: "#2563eb", color: "#fff" }}>
              <FiEdit2 size={14} /> تعديل المستخدم
            </button>
            <Dialog.Close asChild>
              <button className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}>
                إغلاق
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
