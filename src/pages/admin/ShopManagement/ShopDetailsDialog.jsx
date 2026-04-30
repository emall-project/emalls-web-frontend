import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiMapPin, FiPhone, FiMail, FiGlobe, FiHash, FiEdit2 } from "react-icons/fi";
import { shopsApi } from "./api";
import { SHOP_STATUS_COLORS, SHOP_STATUS_LABELS, CATEGORY_LABELS } from "./constants";

function useThemeContainer() {
  const [c, setC] = React.useState(null);
  React.useEffect(() => { setC(document.querySelector(".radix-themes") || document.body); }, []);
  return c;
}

function StatusBadge({ status }) {
  const s = SHOP_STATUS_COLORS[status] || { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {SHOP_STATUS_LABELS[status] || status}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

const CONTACT_META = {
  phone:    { label: "الهاتف",             icon: <FiPhone size={15} /> },
  email:    { label: "البريد الإلكتروني",  icon: <FiMail size={15} /> },
  website:  { label: "الموقع الإلكتروني", icon: <FiGlobe size={15} /> },
};

function getShopLogoUrl(shop) {
  return (
    shop?.logoImage?.smallFileUrl ||
    shop?.logoImage?.mediumFileUrl ||
    shop?.logoImage?.originalFileUrl ||
    ""
  );
}

export default function ShopDetailsDialog({ open, onOpenChange, shop, onEdit }) {
  const themeContainer = useThemeContainer();
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !shop?.shopId) return;
    setLoading(true);
    shopsApi.getById(shop.shopId)
      .then((res) => setDetail(res?.content || res?.data || shop))
      .catch(() => setDetail(shop))
      .finally(() => setLoading(false));
  }, [open, shop?.shopId]);

  const s = detail || shop;
  const contact = s?.contactInfo && typeof s.contactInfo === "object" ? s.contactInfo : {};

  const surface = {
    background: "var(--gray-1)",
    border:     "1px solid var(--gray-a6)",
    boxShadow:  "0 20px 60px rgba(0,0,0,.4)",
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[92vw] max-w-[620px] max-h-[90vh] rounded-2xl flex flex-col outline-none"
          style={surface} aria-describedby={undefined}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b"
            style={{ borderColor: "var(--gray-a6)" }}>
            <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
              تفاصيل المتجر
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--gray-11)", background: "transparent", border: "none" }}>
                <FiX size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Spinner /></div>
            ) : !s ? (
              <p className="text-sm" style={{ color: "var(--gray-11)" }}>لا يوجد متجر محدد.</p>
            ) : (
              <div className="space-y-5">

                {/* Logo + info */}
                <div className="flex gap-4 items-start">
                  <div className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ background: "var(--gray-a3)", border: "1px solid var(--gray-a5)" }}>
                    {getShopLogoUrl(s)
                      ? <img src={getShopLogoUrl(s)} alt={s.name} className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center text-2xl">🏪</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h2 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>{s.name}</h2>
                      <StatusBadge status={s.status} />
                    </div>
                    {s.category && (
                      <span className="mt-1.5 inline-block text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                        {CATEGORY_LABELS[s.category] || s.category}
                      </span>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: "var(--gray-10)" }}>
                      {s.mall?.name && (
                        <span className="flex items-center gap-1">
                          🏬 {s.mall.name}
                        </span>
                      )}
                      {s.location && (
                        <span className="flex items-center gap-1">
                          <FiMapPin size={11} /> {s.location}
                        </span>
                      )}
                      {s.owner?.username && (
                        <span className="flex items-center gap-1">
                          👤 {s.owner.username}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {s.description && (
                  <div>
                    <p className="text-xs font-bold mb-1.5" style={{ color: "var(--gray-11)" }}>الوصف</p>
                    <div className="rounded-xl px-4 py-3 text-sm leading-relaxed"
                      style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)", color: "var(--gray-11)" }}>
                      {s.description}
                    </div>
                  </div>
                )}

                {/* Contact */}
                {Object.keys(contact).length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: "var(--gray-11)" }}>معلومات التواصل</p>
                    <div className="space-y-2">
                      {Object.entries(contact).map(([k, v]) => {
                        const meta   = CONTACT_META[k.toLowerCase()] || { label: k, icon: <FiHash size={15} /> };
                        const isLink = String(v).startsWith("http");
                        return (
                          <div key={k} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: "rgba(37,99,235,.12)", color: "#60a5fa" }}>
                              {meta.icon}
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-widest"
                                style={{ color: "var(--gray-10)" }}>{meta.label}</p>
                              {isLink
                                ? <a href={String(v)} target="_blank" rel="noreferrer"
                                    className="text-sm font-medium hover:underline" style={{ color: "#60a5fa" }}>
                                    {String(v)}
                                  </a>
                                : <p className="text-sm font-medium" style={{ color: "var(--gray-12)" }}>{String(v)}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                {(s.createdAt || s.updatedAt) && (
                  <div className="flex flex-wrap gap-4 text-xs pt-3 border-t"
                    style={{ color: "var(--gray-10)", borderColor: "var(--gray-a5)" }}>
                    {s.createdAt && (
                      <span>أُنشئ: {new Date(s.createdAt).toLocaleDateString("ar-EG")}
                        {s.createdBy ? ` بواسطة ${s.createdBy}` : ""}</span>
                    )}
                    {s.updatedAt && (
                      <span>آخر تحديث: {new Date(s.updatedAt).toLocaleDateString("ar-EG")}
                        {s.updatedBy ? ` بواسطة ${s.updatedBy}` : ""}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0 border-t"
            style={{ borderColor: "var(--gray-a6)" }}>
            <button className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{ background: "#2563eb", color: "#fff" }}
              onClick={() => { onEdit?.(s); onOpenChange(false); }}>
              <FiEdit2 size={14} /> تعديل المتجر
            </button>
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
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
