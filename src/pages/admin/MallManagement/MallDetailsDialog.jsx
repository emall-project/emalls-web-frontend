import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiMapPin, FiPhone, FiMail, FiGlobe, FiHash, FiEdit2 } from "react-icons/fi";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import { mallsApi } from "./api";
import { StatusBadge, Spinner } from "./ui";
import { MallResourcesPanel } from "./MallResourcesPanel";

function useThemeContainer() {
  const [container, setContainer] = React.useState(null);
  React.useEffect(() => {
    setContainer(document.querySelector('.radix-themes') || document.body);
  }, []);
  return container;
}



const dialogSurface = {
  background: "var(--gray-1)",
  border:     "1px solid var(--gray-a6)",
  boxShadow:  "0 20px 60px rgba(0,0,0,.4)",
};

const CONTACT_META = {
  phone:    { label: "الهاتف",             icon: <FiPhone size={16} /> },
  email:    { label: "البريد الإلكتروني",  icon: <FiMail size={16} /> },
  website:  { label: "الموقع الإلكتروني", icon: <FiGlobe size={16} /> },
  facebook: { label: "فيسبوك",            icon: <FaFacebook size={16} /> },
  instagram:{ label: "انستغرام",          icon: <FaInstagram size={16} /> },
  twitter:  { label: "تويتر",             icon: <FaTwitter size={16} /> },
};

function getMallLogoUrl(mall) {
  return (
    mall?.logoImage?.smallFileUrl ||
    mall?.logoImage?.mediumFileUrl ||
    mall?.logoImage?.originalFileUrl ||
    ""
  );
}

function StatPill({ label, value }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-xl"
      style={{ background: "var(--gray-a3)", border: "1px solid var(--gray-a5)" }}>
      <span className="text-lg font-bold" style={{ color: "var(--gray-12)" }}>{value}</span>
      <span className="text-[10px]"       style={{ color: "var(--gray-10)" }}>{label}</span>
    </div>
  );
}

export default function MallDetailsDialog({ open, onOpenChange, mall, onEdit }) {
  const themeContainer = useThemeContainer();
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !mall?.mallId) return;
    setLoading(true);
    mallsApi.getById(mall.mallId)
      .then((res) => setDetail(res?.content || res?.data || mall))
      .catch(() => setDetail(mall))
      .finally(() => setLoading(false));
  }, [open, mall?.mallId]);

  const m = detail || mall;
  const contactInfo = m?.contactInfo && typeof m.contactInfo === "object" ? m.contactInfo : {};

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[92vw] max-w-[680px] max-h-[90vh] rounded-2xl flex flex-col outline-none"
          style={dialogSurface}
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b"
            style={{ borderColor: "var(--gray-a6)" }}>
            <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
              تفاصيل المول
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
              <div className="flex items-center justify-center py-16">
                <Spinner size={28} />
              </div>
            ) : !m ? (
              <p className="text-sm" style={{ color: "var(--gray-11)" }}>لا يوجد مول محدد.</p>
            ) : (
              <div className="space-y-6 slide-up">

                {/* Image + basic info */}
                <div className="flex gap-4 items-start">
                  <div className="h-[90px] w-[90px] rounded-xl overflow-hidden flex-shrink-0"
                    style={{ background: "var(--gray-a3)", border: "1px solid var(--gray-a5)" }}>
                    {getMallLogoUrl(m)
                      ? <img src={getMallLogoUrl(m)} alt={m.name} className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center text-2xl">🏬</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>{m.name}</h2>
                      <StatusBadge status={m.status} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm" style={{ color: "var(--gray-11)" }}>
                      <FiMapPin size={13} />
                      <span>{m.location}{m.city?.name ? `، ${m.city.name}` : ""}</span>
                    </div>
                    <div className="mt-3 flex gap-2.5 flex-wrap">
                      {m.capacity        && <StatPill label="السعة"          value={m.capacity} />}
                      {m.city?.baseFee != null && <StatPill label="الرسوم الأساسية" value={`₪${m.city.baseFee}`} />}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {m.description && (
                  <div>
                    <p className="text-sm font-bold mb-2" style={{ color: "var(--gray-12)" }}>الوصف</p>
                    <div className="rounded-xl px-4 py-3 text-sm leading-relaxed"
                      style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a4)", color: "var(--gray-11)" }}>
                      {m.description}
                    </div>
                  </div>
                )}

                {/* Services + Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* Services */}
                  <div>
                    <p className="text-sm font-bold mb-3" style={{ color: "var(--gray-12)" }}>الخدمات</p>
                    {Array.isArray(m.services) && m.services.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {m.services.map((s, i) => (
                          <span key={s.serviceId || i}
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              border:   "1px solid var(--gray-a6)",
                              color:    "var(--gray-11)",
                              opacity:  s.isActive === false ? 0.45 : 1,
                            }}>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "var(--gray-11)" }}>لا توجد خدمات.</p>
                    )}
                  </div>

                  {/* Contact */}
                  {Object.keys(contactInfo).length > 0 && (
                    <div>
                      <p className="text-sm font-bold mb-3" style={{ color: "var(--gray-12)" }}>معلومات التواصل</p>
                      <div className="space-y-3">
                        {Object.entries(contactInfo).map(([k, v]) => {
                          const meta   = CONTACT_META[k.toLowerCase()] || { label: k, icon: <FiHash size={16} /> };
                          const isLink = String(v).startsWith("http");
                          return (
                            <div key={k} className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: "rgba(37,99,235,.12)", color: "#60a5fa" }}>
                                {meta.icon}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5"
                                  style={{ color: "var(--gray-10)" }}>
                                  {meta.label}
                                </p>
                                {isLink ? (
                                  <a href={String(v)} target="_blank" rel="noreferrer"
                                    className="text-sm font-medium truncate block hover:underline"
                                    style={{ color: "#60a5fa" }}>
                                    {String(v)}
                                  </a>
                                ) : (
                                  <p className="text-sm font-medium truncate" style={{ color: "var(--gray-12)" }}>
                                    {String(v)}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Timestamps */}
                {(m.createdAt || m.updatedAt) && (
                  <div className="flex flex-wrap gap-4 text-xs pt-2 border-t"
                    style={{ color: "var(--gray-10)", borderColor: "var(--gray-a5)" }}>
                    {m.createdAt && (
                      <span>
                        أُنشئ: {new Date(m.createdAt).toLocaleDateString("ar-EG")}
                        {m.createdBy ? ` بواسطة ${m.createdBy}` : ""}
                      </span>
                    )}
                    {m.updatedAt && (
                      <span>
                        آخر تحديث: {new Date(m.updatedAt).toLocaleDateString("ar-EG")}
                        {m.updatedBy ? ` بواسطة ${m.updatedBy}` : ""}
                      </span>
                    )}
                  </div>
                )}

                <MallResourcesPanel mallId={m.mallId} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0 border-t"
            style={{ borderColor: "var(--gray-a6)" }}>
            <button
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: "#2563eb", color: "#fff" }}
              onClick={() => { onEdit?.(m); onOpenChange(false); }}>
              <FiEdit2 size={14} /> تعديل المول
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
