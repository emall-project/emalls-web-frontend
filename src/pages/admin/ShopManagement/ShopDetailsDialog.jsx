import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  FiEdit2,
  FiHash,
  FiImage,
  FiInstagram,
  FiMail,
  FiMapPin,
  FiPhone,
  FiX,
} from "react-icons/fi";
import { shopsApi } from "./api";
import {
  CATEGORY_LABELS,
  SHOP_ADMIN_STATUS_COLORS,
  SHOP_ADMIN_STATUS_LABELS,
  SHOP_STATUS_COLORS,
  SHOP_STATUS_LABELS,
} from "./constants";

function useThemeContainer() {
  const [container, setContainer] = React.useState(null);
  React.useEffect(() => {
    setContainer(document.querySelector(".radix-themes") || document.body);
  }, []);
  return container;
}

function Badge({ status, labels, colors }) {
  const tone = colors[status] || { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: tone.bg, color: tone.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone.dot }} />
      {labels[status] || status}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SectionTitle({ children }) {
  return <p className="text-xs font-bold mb-2" style={{ color: "var(--gray-11)" }}>{children}</p>;
}

function ContactRow({ icon, label, value }) {
  const isLink = String(value).startsWith("http");
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(37,99,235,.12)", color: "#60a5fa" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-10)" }}>
          {label}
        </p>
        {isLink ? (
          <a href={String(value)} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline" style={{ color: "#60a5fa" }}>
            {String(value)}
          </a>
        ) : (
          <p className="text-sm font-medium" style={{ color: "var(--gray-12)" }}>{String(value)}</p>
        )}
      </div>
    </div>
  );
}

export default function ShopDetailsDialog({ open, onOpenChange, shop, onEdit }) {
  const themeContainer = useThemeContainer();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !shop?.shopId) return;
    setLoading(true);
    shopsApi.getById(shop.shopId)
      .then((res) => setDetail(res?.data || res?.content || shop))
      .catch(() => setDetail(shop))
      .finally(() => setLoading(false));
  }, [open, shop?.shopId]);

  const current = detail || shop;
  const contact = current?.contactInfo && typeof current.contactInfo === "object" ? current.contactInfo : {};
  const logoSrc = current?.logoImage?.mediumFileUrl || current?.logoImage?.originalFileUrl || current?.logoUrl || null;
  const licenseSrc = current?.licenseImage?.mediumFileUrl || current?.licenseImage?.originalFileUrl || null;
  const photos = Array.isArray(current?.shopPhotos) ? current.shopPhotos : [];
  const adminStatus = String(current?.adminStatus || "NONE").toUpperCase();
  const hasAdminOverride = adminStatus !== "NONE";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[640px] max-h-[90vh] rounded-2xl flex flex-col outline-none"
          style={{
            background: "var(--gray-1)",
            border: "1px solid var(--gray-a6)",
            boxShadow: "0 20px 60px rgba(0,0,0,.4)",
          }}
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b" style={{ borderColor: "var(--gray-a6)" }}>
            <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
              تفاصيل المتجر
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: "var(--gray-11)", background: "transparent", border: "none" }}>
                <FiX size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Spinner /></div>
            ) : !current ? (
              <p className="text-sm" style={{ color: "var(--gray-11)" }}>لا يوجد متجر محدد.</p>
            ) : (
              <div className="space-y-5">
                <div className="flex gap-4 items-start">
                  <div className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--gray-a3)", border: "1px solid var(--gray-a5)" }}>
                    {logoSrc ? (
                      <img src={logoSrc} alt={current.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl">S</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h2 className="text-xl font-bold" style={{ color: "var(--gray-12)" }}>{current.name}</h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge status={adminStatus} labels={SHOP_ADMIN_STATUS_LABELS} colors={SHOP_ADMIN_STATUS_COLORS} />
                        <Badge status={current.status} labels={SHOP_STATUS_LABELS} colors={SHOP_STATUS_COLORS} />
                      </div>
                    </div>

                    {current.category && (
                      <span className="mt-1.5 inline-block text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                        {CATEGORY_LABELS[current.category] || current.category}
                      </span>
                    )}

                    <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: "var(--gray-10)" }}>
                      {current.mall?.name && <span>{current.mall.name}</span>}
                      {current.location && <span className="flex items-center gap-1"><FiMapPin size={11} /> {current.location}</span>}
                      {current.owner?.username && <span>{current.owner.username}</span>}
                    </div>

                    {hasAdminOverride && (
                      <p className="mt-2 text-xs" style={{ color: "var(--gray-10)" }}>
                        هذا المتجر عليه تقييد إداري، لذلك لا يعتمد ظهوره فقط على حالة الاشتراك.
                      </p>
                    )}
                  </div>
                </div>

                {current.description && (
                  <div>
                    <SectionTitle>الوصف</SectionTitle>
                    <div className="rounded-xl px-4 py-3 text-sm leading-relaxed" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)", color: "var(--gray-11)" }}>
                      {current.description}
                    </div>
                  </div>
                )}

                {Object.keys(contact).length > 0 && (
                  <div>
                    <SectionTitle>معلومات التواصل</SectionTitle>
                    <div className="space-y-2">
                      {contact.email && <ContactRow icon={<FiMail size={15} />} label="البريد الإلكتروني" value={contact.email} />}
                      {contact.phone && <ContactRow icon={<FiPhone size={15} />} label="الهاتف" value={contact.phone} />}
                      {contact.instagram && <ContactRow icon={<FiInstagram size={15} />} label="Instagram" value={contact.instagram} />}
                      {Object.entries(contact)
                        .filter(([key]) => !["email", "phone", "instagram"].includes(key))
                        .map(([key, value]) => (
                          <ContactRow key={key} icon={<FiHash size={15} />} label={key} value={String(value)} />
                        ))}
                    </div>
                  </div>
                )}

                {licenseSrc && (
                  <div>
                    <SectionTitle>صورة الرخصة التجارية</SectionTitle>
                    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--gray-a5)", maxHeight: 220 }}>
                      <img src={licenseSrc} alt="الرخصة التجارية" className="w-full object-contain max-h-52" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                  </div>
                )}

                {photos.length > 0 && (
                  <div>
                    <SectionTitle>صور المتجر ({photos.length})</SectionTitle>
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((photo, index) => {
                        const src = photo.mediumFileUrl || photo.originalFileUrl || photo.preview || null;
                        return (
                          <div
                            key={photo.uuid || photo.id || index}
                            className="rounded-xl overflow-hidden aspect-square"
                            style={{ background: "var(--gray-a3)", border: "1px solid var(--gray-a5)" }}
                          >
                            {src ? (
                              <img src={src} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FiImage size={20} style={{ color: "var(--gray-9)" }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0 border-t" style={{ borderColor: "var(--gray-a6)" }}>
            <button
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{ background: "#2563eb", color: "#fff" }}
              onClick={() => { onEdit?.(current); onOpenChange(false); }}
            >
              <FiEdit2 size={14} /> تعديل المتجر
            </button>
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}>
                إغلاق
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
