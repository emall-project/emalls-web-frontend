import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAlertCircle, FiChevronDown, FiCheck, FiSearch } from "react-icons/fi";
import { shopsApi, mallsApi, usersApi } from "./api";
import { SHOP_STATUSES, SHOP_STATUS_LABELS, SHOP_CATEGORIES, CATEGORY_LABELS } from "./constants";

function useThemeContainer() {
  const [c, setC] = React.useState(null);
  React.useEffect(() => { setC(document.querySelector(".radix-themes") || document.body); }, []);
  return c;
}

function Spinner({ size = 14 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// ── Simple select dropdown ────────────────────────────────────────────────────
function SelectField({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm outline-none border transition-all"
        style={{
          background:  "var(--gray-a2)", borderColor: open ? "var(--blue-8)" : "var(--gray-a6)",
          color:       selected ? "var(--gray-12)" : "var(--gray-9)", direction: "rtl",
          boxShadow:   open ? "0 0 0 2px var(--blue-a4)" : "none",
        }}>
        <span>{selected?.label || placeholder}</span>
        <FiChevronDown size={13} style={{ color: "var(--gray-9)", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 left-0 z-[10020] rounded-xl overflow-hidden max-h-52 overflow-y-auto"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 8px 32px rgba(0,0,0,.25)" }}>
          {options.map((opt) => (
            <button key={opt.value} type="button"
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-right transition-colors hover:bg-black/5"
              style={{ color: "var(--gray-12)", direction: "rtl" }}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              <span className="flex-1">{opt.label}</span>
              {value === opt.value && <FiCheck size={12} style={{ color: "var(--blue-9)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Owner searchable dropdown ─────────────────────────────────────────────────
function OwnerDropdown({ value, onChange, users, loadingUsers }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const filtered = users.filter((u) =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selected = users.find((u) => String(u.userId) === String(value));

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm outline-none border transition-all"
        style={{
          background:  "var(--gray-a2)", borderColor: open ? "var(--blue-8)" : "var(--gray-a6)",
          color:       selected ? "var(--gray-12)" : "var(--gray-9)", direction: "rtl",
          boxShadow:   open ? "0 0 0 2px var(--blue-a4)" : "none",
        }}>
        <span className="flex items-center gap-2 truncate">
          {loadingUsers
            ? <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round"/></svg><span>جاري التحميل...</span></>
            : <span className="truncate">{selected ? `${selected.fullName} (${selected.email || selected.username || ''})` : "اختر المالك"}</span>}
        </span>
        <FiChevronDown size={13} style={{ color: "var(--gray-9)", flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 left-0 z-[10020] rounded-xl overflow-hidden"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 8px 32px rgba(0,0,0,.25)" }}>

          {/* Search */}
          <div className="p-2 border-b" style={{ borderColor: "var(--gray-a5)" }}>
            <div className="relative">
              <FiSearch size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--gray-9)" }} />
              <input
                className="w-full rounded-lg pr-8 pl-3 py-1.5 text-xs outline-none"
                style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a5)", color: "var(--gray-12)", direction: "rtl", textAlign: "right" }}
                placeholder="ابحث بالاسم أو البريد..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "var(--gray-9)" }}>لا توجد نتائج</p>
            ) : (
              filtered.map((u) => {
                const isActive = String(value) === String(u.userId);
                return (
                  <button key={u.userId} type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-right transition-colors hover:bg-black/5"
                    style={{ color: "var(--gray-12)", direction: "rtl", background: isActive ? "var(--blue-a3)" : "transparent" }}
                    onClick={() => { onChange(String(u.userId)); setOpen(false); setSearch(""); }}>
                    <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                      {u.fullName?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="font-semibold text-sm truncate">{u.fullName || "—"}</div>
                      <div className="text-[11px] truncate" style={{ color: "var(--gray-10)" }}>{u.email || u.username || `#${u.userId}`}</div>
                    </div>
                    {isActive && <FiCheck size={12} style={{ color: "var(--blue-9)", flexShrink: 0 }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopFormDialog({ open, onOpenChange, shop = null, onSuccess }) {
  const themeContainer = useThemeContainer();
  const isEdit         = !!shop;
  const bodyRef        = useRef(null);

  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [malls,        setMalls]        = useState([]);
  const [loadingMalls, setLoadingMalls] = useState(false);
  const [users,        setUsers]        = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [name,        setName]        = useState("");
  const [mallId,      setMallId]      = useState("");
  const [ownerId,     setOwnerId]     = useState("");
  const [category,    setCategory]    = useState("");
  const [location,    setLocation]    = useState("");
  const [status,      setStatus]      = useState("ACTIVE");
  const [description, setDescription] = useState("");
  const [logoUrl,     setLogoUrl]     = useState("");
  const [phone,       setPhone]       = useState("");
  const [email,       setEmail]       = useState("");

  // Fetch malls
  useEffect(() => {
    if (!open) return;
    setLoadingMalls(true);
    mallsApi.getList()
      .then((res) => { const list = res?.content || res?.data || []; setMalls(Array.isArray(list) ? list : []); })
      .catch(() => setMalls([]))
      .finally(() => setLoadingMalls(false));
  }, [open]);

  // Fetch users
  useEffect(() => {
    if (!open) return;
    setLoadingUsers(true);
    usersApi.getAll({ size: 100 })
      .then((res) => {
        const raw  = res?.data || res?.content || {};
        const list = Array.isArray(raw) ? raw : (raw?.content || []);
        setUsers(list);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [open]);

  // Reset / populate
  useEffect(() => {
    if (!open) return;
    if (isEdit && shop) {
      setName(shop.name || ""); setMallId(String(shop.mall?.mallId || ""));
      setOwnerId(String(shop.owner?.userId || "")); setCategory(shop.category || "");
      setLocation(shop.location || ""); setStatus(shop.status || "ACTIVE");
      setDescription(shop.description || ""); setLogoUrl(shop.logoUrl || "");
      setPhone(shop.contactInfo?.phone || ""); setEmail(shop.contactInfo?.email || "");
    } else {
      setName(""); setMallId(""); setOwnerId(""); setCategory(""); setLocation("");
      setStatus("ACTIVE"); setDescription(""); setLogoUrl(""); setPhone(""); setEmail(""); setError("");
    }
  }, [open, isEdit, shop]);

  const scrollTop = () => { if (bodyRef.current) bodyRef.current.scrollTop = 0; };

  const handleSubmit = async () => {
    if (!name.trim())        { setError("اسم المتجر مطلوب");  return scrollTop(); }
    if (!isEdit && !mallId)  { setError("يجب اختيار المول");  return scrollTop(); }
    if (!isEdit && !ownerId) { setError("يجب اختيار المالك"); return scrollTop(); }

    setError(""); setLoading(true);
    try {
      const contactInfo = {};
      if (phone.trim()) contactInfo.phone = phone.trim();
      if (email.trim()) contactInfo.email = email.trim();

      const body = {
        name: name.trim(), location: location.trim() || null,
        description: description.trim() || null, logoUrl: logoUrl.trim() || null,
        status, ...(category ? { category } : {}),
        ...(Object.keys(contactInfo).length ? { contactInfo } : {}),
      };

      if (isEdit) {
        await shopsApi.update({
          shopId: shop.shopId, ...body,
          mall:  mallId  ? { mallId: Number(mallId)  } : undefined,
          owner: ownerId ? { userId: Number(ownerId) } : undefined,
        });
      } else {
        await shopsApi.create({
          ...body,
          mall:  { mallId: Number(mallId) },
          owner: { userId: Number(ownerId) },
        });
      }
      onSuccess?.(); onOpenChange(false);
    } catch (e) {
      setError(e.message || "حدث خطأ، حاول مجدداً"); scrollTop();
    } finally { setLoading(false); }
  };

  const inp = { background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl", textAlign: "right" };
  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
  const labelCls = "block text-xs font-semibold mb-1.5";

  const mallOptions     = malls.map((m) => ({ value: String(m.mallId || m.id), label: m.name }));
  const statusOptions   = SHOP_STATUSES.map((s) => ({ value: s, label: SHOP_STATUS_LABELS[s] }));
  const categoryOptions = [{ value: "", label: "بدون فئة" }, ...SHOP_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] || c }))];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} dir="rtl">
      <Dialog.Portal container={themeContainer}>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[92vw] max-w-[600px] max-h-[92vh] rounded-2xl flex flex-col outline-none"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}
          aria-describedby={undefined}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b" style={{ borderColor: "var(--gray-a6)" }}>
            <div>
              <Dialog.Title className="text-base font-bold" style={{ color: "var(--gray-12)" }}>
                {isEdit ? "تعديل المتجر" : "إضافة متجر جديد"}
              </Dialog.Title>
              <p className="text-xs mt-0.5" style={{ color: "var(--gray-11)" }}>
                {isEdit ? "عدّل بيانات المتجر" : "أدخل بيانات المتجر الجديد"}
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
          <div ref={bodyRef} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.3)", color: "var(--red-9)" }}>
                <FiAlertCircle size={15} /> {error}
              </div>
            )}

            {/* Name + Mall */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>اسم المتجر *</label>
                <input className={inputCls} style={inp} value={name}
                  onChange={(e) => setName(e.target.value)} placeholder="مثال: Fashion Hub" />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                  المول {!isEdit && <span style={{ color: "var(--red-9)" }}>*</span>}
                </label>
                {loadingMalls ? (
                  <div className="w-full rounded-xl px-4 py-2.5 text-sm border flex items-center gap-2"
                    style={{ ...inp, opacity: 0.7 }}>
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="var(--gray-a6)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--blue-9)" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    <span>جاري تحميل المولات...</span>
                  </div>
                ) : (
                  <SelectField value={mallId} onChange={setMallId} options={mallOptions} placeholder="اختر المول" />
                )}
              </div>
            </div>

            {/* Owner + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>
                  المالك {!isEdit && <span style={{ color: "var(--red-9)" }}>*</span>}
                </label>
                <OwnerDropdown
                  value={ownerId} onChange={setOwnerId}
                  users={users} loadingUsers={loadingUsers}
                />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الفئة</label>
                <SelectField value={category} onChange={setCategory} options={categoryOptions} placeholder="اختر الفئة" />
              </div>
            </div>

            {/* Location + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الموقع في المول</label>
                <input className={inputCls} style={inp} value={location}
                  onChange={(e) => setLocation(e.target.value)} placeholder="الطابق 1، قسم A" />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--gray-11)" }}>الحالة</label>
                <SelectField value={status} onChange={setStatus} options={statusOptions} placeholder="اختر الحالة" />
              </div>
            </div>

            {/* Logo URL */}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>رابط الشعار (URL)</label>
              <input className={inputCls} style={{ ...inp, direction: "ltr", textAlign: "left" }}
                value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
            </div>

            {/* Description */}
            <div>
              <label className={labelCls} style={{ color: "var(--gray-11)" }}>الوصف</label>
              <textarea className={inputCls} style={{ ...inp, minHeight: 72, resize: "none" }}
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر عن المتجر..." />
            </div>

            {/* Contact */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--gray-a2)", border: "1px solid var(--gray-a6)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--gray-11)" }}>معلومات التواصل</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ color: "var(--gray-11)" }}>رقم الهاتف</label>
                  <input className={inputCls} style={{ ...inp, background: "var(--gray-a3)" }}
                    value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+970599..." />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--gray-11)" }}>البريد الإلكتروني</label>
                  <input className={inputCls} style={{ ...inp, background: "var(--gray-a3)", direction: "ltr", textAlign: "left" }}
                    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@shop.ps" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0 border-t" style={{ borderColor: "var(--gray-a6)" }}>
            <Dialog.Close asChild>
              <button className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "transparent", border: "1px solid var(--gray-a7)", color: "var(--gray-12)" }}>
                إلغاء
              </button>
            </Dialog.Close>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#2563eb", color: "#fff" }}>
              {loading ? <Spinner size={14} /> : null}
              {isEdit ? "حفظ التعديلات" : "إنشاء المتجر"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}