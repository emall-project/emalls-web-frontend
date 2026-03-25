import React, { useState, useCallback, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  FiPlus, FiSearch, FiRefreshCw, FiAlertCircle,
  FiChevronLeft, FiChevronRight, FiMoreVertical,
  FiEye, FiEdit, FiTrash2, FiArchive, FiCheckCircle,
  FiXCircle, FiLoader, FiCalendar, FiDollarSign,
} from "react-icons/fi";
import { adTemplatesApi, adRequestsApi } from "./api";
import {
  TEMPLATE_STATUSES, TEMPLATE_STATUS_LABELS, TEMPLATE_STATUS_COLORS,
  POSITION_LABELS, REQUEST_STATUSES, REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  FAKE_TEMPLATE, FAKE_REQUEST,
} from "./constants";
import AdTemplateFormDialog    from "./AdTemplateFormDialog";
import { AdRequestFormDialog, RejectDialog } from "./AdRequestDialogs";

// ── Helpers ────────────────────────────────────────────────────────────────────
function useThemeContainer() {
  const [c, setC] = React.useState(null);
  React.useEffect(() => { setC(document.querySelector(".radix-themes") || document.body); }, []);
  return c;
}

function Spinner({ size = 16 }) {
  return <FiLoader size={size} className="animate-spin" style={{ color: "var(--blue-9)" }} />;
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium"
      style={{
        background:  type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color:       type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}>
      {message}
      <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-1">✕</button>
    </div>
  );
}

function StatusBadge({ status, labels, colors }) {
  const s = colors?.[status] || { bg: "var(--gray-a3)", fg: "var(--gray-11)", dot: "var(--gray-9)" };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {labels?.[status] || status}
    </span>
  );
}

function FilterInput({ value, onChange, placeholder, icon: Icon }) {
  return (
    <div className="relative">
      {Icon && <Icon size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--gray-9)" }} />}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl py-2.5 text-sm outline-none border transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        style={{ paddingRight: Icon ? "2.5rem" : "1rem", paddingLeft: "1rem", background: "var(--gray-a2)", borderColor: "var(--gray-a6)", color: "var(--gray-12)", direction: "rtl", textAlign: "right" }} />
    </div>
  );
}

function SimpleSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="w-full rounded-xl py-2.5 px-4 text-sm outline-none border transition-all flex items-center justify-between gap-2"
        style={{
          background:  "var(--gray-a2)",
          borderColor: open ? "#3b82f6" : "var(--gray-a6)",
          color:       selected ? "var(--gray-12)" : "var(--gray-9)",
          direction:   "rtl",
          boxShadow:   open ? "0 0 0 3px rgba(59,130,246,.15)" : "none",
        }}>
        <span className="flex items-center gap-2 truncate">
          {selected?.dot && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selected.dot }} />}
          <span className="truncate">{selected?.label || placeholder}</span>
        </span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gray-9)" strokeWidth="2"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 left-0 z-50 rounded-xl overflow-hidden"
          style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)", boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
          <div className="p-1.5 max-h-56 overflow-y-auto">
            <button type="button"
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-right transition-colors"
              style={{ direction: "rtl", color: !value ? "var(--blue-9)" : "var(--gray-11)", background: !value ? "var(--blue-a3)" : "transparent", fontWeight: !value ? 600 : 400 }}
              onClick={() => { onChange(""); setOpen(false); }}>
              {placeholder}
            </button>
            {options.map((opt) => {
              const isActive = String(value) === String(opt.value);
              return (
                <button key={String(opt.value)} type="button"
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-right transition-colors hover:bg-black/5"
                  style={{ direction: "rtl", color: isActive ? "var(--blue-9)" : "var(--gray-12)", background: isActive ? "var(--blue-a3)" : "transparent", fontWeight: isActive ? 600 : 400 }}
                  onClick={() => { onChange(opt.value); setOpen(false); }}>
                  {opt.dot && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.dot }} />}
                  <span className="flex-1">{opt.label}</span>
                  {isActive && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--blue-9)" strokeWidth="3" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: "var(--gray-a5)" }}>
      <span className="text-xs" style={{ color: "var(--gray-10)" }}>صفحة {page + 1} من {totalPages}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}
          className="h-8 w-8 rounded-lg flex items-center justify-center border transition hover:opacity-80 disabled:opacity-30"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
          <FiChevronRight size={14} />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
          return (
            <button key={p} onClick={() => onPageChange(p)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium border transition"
              style={{ borderColor: p === page ? "#2563eb" : "var(--gray-a6)", background: p === page ? "#2563eb" : "transparent", color: p === page ? "#fff" : "var(--gray-12)" }}>
              {p + 1}
            </button>
          );
        })}
        <button onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
          className="h-8 w-8 rounded-lg flex items-center justify-center border transition hover:opacity-80 disabled:opacity-30"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-12)" }}>
          <FiChevronLeft size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Templates Tab ─────────────────────────────────────────────────────────────
function TemplatesTab({ showToast, addOpen, setAddOpen }) {
  const themeContainer = useThemeContainer();
  const [templates,   setTemplates]   = useState([FAKE_TEMPLATE]);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [page,        setPage]        = useState(0);
  const [search,      setSearch]      = useState("");
  const [statusF,     setStatusF]     = useState("");
  const [positionF,   setPositionF]   = useState("");
  const [rowLoading,  setRowLoading]  = useState({});
  const [editOpen,    setEditOpen]    = useState(false);
  const [selected,    setSelected]    = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await adTemplatesApi.getAll({ page, size: 10, ...(search ? { name: search } : {}), ...(statusF ? { status: statusF } : {}), ...(positionF ? { position: positionF } : {}) });
      const data = res?.data || res?.content || [];
      const list = Array.isArray(data) ? data : (data?.content || []);
      setTemplates([FAKE_TEMPLATE, ...list]);
      setTotalPages(data?.totalPages || 1);
    } catch (e) { setError(e.message); setTemplates([FAKE_TEMPLATE]); }
    finally { setLoading(false); }
  }, [page, search, statusF, positionF]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(0); }, [search, statusF, positionF]);

  const handleArchive = async (t) => {
    if (t.adTemplateId === FAKE_TEMPLATE.adTemplateId) return showToast("هذا نموذج تجريبي 😄", "error");
    setRowLoading((p) => ({ ...p, [t.adTemplateId]: true }));
    try { await adTemplatesApi.archive(t.adTemplateId); showToast(`تم أرشفة ${t.name}`); fetch(); }
    catch (e) { showToast(e.message, "error"); }
    finally { setRowLoading((p) => ({ ...p, [t.adTemplateId]: false })); }
  };

  const handleDelete = async (t) => {
    if (t.adTemplateId === FAKE_TEMPLATE.adTemplateId) return showToast("هذا نموذج تجريبي 😄", "error");
    if (!window.confirm(`هل تريد حذف "${t.name}"؟`)) return;
    setRowLoading((p) => ({ ...p, [t.adTemplateId]: true }));
    try { await adTemplatesApi.delete(t.adTemplateId); showToast(`تم حذف ${t.name}`); fetch(); }
    catch (e) { showToast(e.message, "error"); }
    finally { setRowLoading((p) => ({ ...p, [t.adTemplateId]: false })); }
  };

  const menuStyle = { background: "var(--gray-1)", border: "1px solid var(--gray-a6)", color: "var(--gray-12)", boxShadow: "0 14px 40px rgba(0,0,0,.35)" };

  const statusOptions   = TEMPLATE_STATUSES.map((s) => ({ value: s, label: TEMPLATE_STATUS_LABELS[s] }));
  const positionOptions = Object.entries(POSITION_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <>
      {/* Filters */}
      <div className="rounded-2xl p-5" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>اسم النموذج</label>
            <FilterInput value={search} onChange={setSearch} placeholder="ابحث بالاسم..." icon={FiSearch} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الحالة</label>
            <SimpleSelect value={statusF} onChange={setStatusF} options={statusOptions} placeholder="كل الحالات" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>الموضع</label>
            <SimpleSelect value={positionF} onChange={setPositionF} options={positionOptions} placeholder="كل المواضع" />
          </div>
          {(search || statusF || positionF) && (
            <div className="flex items-end">
              <button onClick={() => { setSearch(""); setStatusF(""); setPositionF(""); }}
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-xl transition-opacity hover:opacity-70"
                style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                ✕ مسح الفلاتر
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl px-5 py-3 flex items-center justify-between gap-3"
          style={{ background: "var(--red-2)", border: "1px solid var(--red-6)" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--red-11)" }}>
            <FiAlertCircle size={15} /> {error}
          </div>
          <button onClick={fetch} className="text-xs font-semibold underline" style={{ color: "var(--red-11)" }}>إعادة المحاولة</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-a5)", color: "var(--gray-10)" }}>
              {["الاسم", "الموضع", "السعر", "الفترة", "الحالة", ""].map((h) => (
                <th key={h} className="px-5 py-3.5 text-right font-semibold text-xs tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center">
                <div className="flex items-center justify-center gap-2" style={{ color: "var(--gray-10)" }}>
                  <Spinner size={20} /> جاري التحميل...
                </div>
              </td></tr>
            ) : templates.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-sm" style={{ color: "var(--gray-10)" }}>لا توجد نماذج مطابقة.</td></tr>
            ) : (
              templates.map((t, idx) => (
                <tr key={t.adTemplateId}
                  style={{ borderTop: idx === 0 ? "none" : "1px solid var(--gray-a4)", color: "var(--gray-12)", background: t.adTemplateId === FAKE_TEMPLATE.adTemplateId ? "rgba(37,99,235,.02)" : "transparent" }}
                  className="transition hover:bg-black/[.015]">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {t.name}
                      {t.adTemplateId === FAKE_TEMPLATE.adTemplateId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(37,99,235,.1)", color: "#2563eb" }}>تجريبي</span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>#{t.adTemplateId} · {t.imageRatio}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--blue-a3)", color: "var(--blue-11)" }}>
                      {POSITION_LABELS[t.position] || t.position}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-sm flex items-center gap-1">
                      <FiDollarSign size={12} style={{ color: "var(--gray-10)" }} /> ₪{t.price}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs flex items-center gap-1" style={{ color: "var(--gray-11)" }}>
                      <FiCalendar size={10} /> {t.startDate}
                    </div>
                    <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--gray-10)" }}>
                      <FiCalendar size={10} /> {t.endDate}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={t.status} labels={TEMPLATE_STATUS_LABELS} colors={TEMPLATE_STATUS_COLORS} />
                  </td>
                  <td className="px-5 py-4">
                    <DropdownMenu.Root dir="rtl">
                      <DropdownMenu.Trigger asChild>
                        <button type="button" disabled={!!rowLoading[t.adTemplateId]}
                          className="p-2 rounded-lg transition outline-none hover:opacity-70"
                          style={{ color: "var(--gray-12)" }}>
                          {rowLoading[t.adTemplateId] ? <Spinner size={14} /> : <FiMoreVertical />}
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal container={themeContainer}>
                        <DropdownMenu.Content sideOffset={8} align="end" className="z-50 min-w-[180px] rounded-xl p-2 outline-none" style={menuStyle}>
                          <DDItem icon={<FiEdit />} onSelect={() => { setSelected(t); setEditOpen(true); }}>تعديل</DDItem>
                          {t.status === "ACTIVE" && (
                            <DDItem icon={<FiArchive />} onSelect={() => handleArchive(t)}>أرشفة</DDItem>
                          )}
                          <DropdownMenu.Separator className="my-1.5 mx-2" style={{ height: 1, background: "var(--gray-a5)" }} />
                          <DDItem icon={<FiTrash2 />} onSelect={() => handleDelete(t)} danger>حذف</DDItem>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <AdTemplateFormDialog open={addOpen} onOpenChange={setAddOpen} template={null}
        onSuccess={() => { showToast("تم إنشاء النموذج بنجاح ✓"); fetch(); }} />
      <AdTemplateFormDialog open={editOpen} onOpenChange={setEditOpen} template={selected}
        onSuccess={() => { showToast("تم تحديث النموذج بنجاح ✓"); fetch(); }} />
    </>
  );
}

// ── Requests Tab ──────────────────────────────────────────────────────────────
function RequestsTab({ showToast, addOpen, setAddOpen }) {
  const themeContainer = useThemeContainer();
  const [requests,    setRequests]    = useState([FAKE_REQUEST]);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [page,        setPage]        = useState(0);
  const [statusF,     setStatusF]     = useState("");
  const [rowLoading,  setRowLoading]  = useState({});
  const [rejectOpen,  setRejectOpen]  = useState(false);
  const [selected,    setSelected]    = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await adRequestsApi.getAll({ page, size: 10, ...(statusF ? { status: statusF } : {}) });
      const raw  = res?.data || res?.content || {};
      const list = Array.isArray(raw) ? raw : (raw?.content || []);
      setRequests([FAKE_REQUEST, ...list]);
      setTotalPages(raw?.meta?.totalPages || raw?.totalPages || 1);
    } catch (e) { setError(e.message); setRequests([FAKE_REQUEST]); }
    finally { setLoading(false); }
  }, [page, statusF]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(0); }, [statusF]);

  const handleApprove = async (r) => {
    if (r.adRequestId === FAKE_REQUEST.adRequestId) return showToast("هذا طلب تجريبي 😄", "error");
    setRowLoading((p) => ({ ...p, [r.adRequestId]: true }));
    try { await adRequestsApi.approve(r.adRequestId); showToast(`تم قبول طلب ${r.title}`); fetch(); }
    catch (e) { showToast(e.message, "error"); }
    finally { setRowLoading((p) => ({ ...p, [r.adRequestId]: false })); }
  };

  const menuStyle = { background: "var(--gray-1)", border: "1px solid var(--gray-a6)", color: "var(--gray-12)", boxShadow: "0 14px 40px rgba(0,0,0,.35)" };
  const statusOptions = REQUEST_STATUSES.map((s) => ({ value: s, label: REQUEST_STATUS_LABELS[s] }));

  return (
    <>
      {/* Filters */}
      <div className="rounded-2xl p-5" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--gray-11)" }}>حالة الطلب</label>
            <SimpleSelect value={statusF} onChange={setStatusF} options={statusOptions} placeholder="كل الحالات" />
          </div>
          {statusF && (
            <div className="flex items-end">
              <button onClick={() => setStatusF("")}
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-xl transition-opacity hover:opacity-70"
                style={{ background: "var(--gray-a3)", color: "var(--gray-11)" }}>
                ✕ مسح الفلاتر
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl px-5 py-3 flex items-center justify-between gap-3"
          style={{ background: "var(--red-2)", border: "1px solid var(--red-6)" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--red-11)" }}>
            <FiAlertCircle size={15} /> {error}
          </div>
          <button onClick={fetch} className="text-xs font-semibold underline" style={{ color: "var(--red-11)" }}>إعادة المحاولة</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--gray-1)", border: "1px solid var(--gray-a6)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gray-a5)", color: "var(--gray-10)" }}>
              {["الطلب", "المتجر", "النموذج", "الحالة", "الدفع", ""].map((h) => (
                <th key={h} className="px-5 py-3.5 text-right font-semibold text-xs tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center">
                <div className="flex items-center justify-center gap-2" style={{ color: "var(--gray-10)" }}>
                  <Spinner size={20} /> جاري التحميل...
                </div>
              </td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-sm" style={{ color: "var(--gray-10)" }}>لا توجد طلبات مطابقة.</td></tr>
            ) : (
              requests.map((r, idx) => {
                const pmtColor = PAYMENT_STATUS_COLORS[r.paymentStatus] || { bg: "var(--gray-a3)", fg: "var(--gray-10)" };
                return (
                  <tr key={r.adRequestId}
                    style={{ borderTop: idx === 0 ? "none" : "1px solid var(--gray-a4)", color: "var(--gray-12)", background: r.adRequestId === FAKE_REQUEST.adRequestId ? "rgba(37,99,235,.02)" : "transparent" }}
                    className="transition hover:bg-black/[.015]">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {r.title}
                        {r.adRequestId === FAKE_REQUEST.adRequestId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(37,99,235,.1)", color: "#2563eb" }}>تجريبي</span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>#{r.adRequestId}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium">{r.shop?.name || `Shop #${r.shopId}`}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>{r.shop?.ownerName}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium">{r.نموذج?.name || `نموذج #${r.نموذجId}`}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--gray-10)" }}>
                        {POSITION_LABELS[r.نموذج?.position] || r.نموذج?.position}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} labels={REQUEST_STATUS_LABELS} colors={REQUEST_STATUS_COLORS} />
                      {r.rejectionReason && (
                        <div className="text-[10px] mt-1" style={{ color: "var(--red-9)" }}>
                          {r.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: pmtColor.bg, color: pmtColor.fg }}>
                        {PAYMENT_STATUS_LABELS[r.paymentStatus] || r.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <DropdownMenu.Root dir="rtl">
                        <DropdownMenu.Trigger asChild>
                          <button type="button" disabled={!!rowLoading[r.adRequestId]}
                            className="p-2 rounded-lg transition outline-none hover:opacity-70"
                            style={{ color: "var(--gray-12)" }}>
                            {rowLoading[r.adRequestId] ? <Spinner size={14} /> : <FiMoreVertical />}
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal container={themeContainer}>
                          <DropdownMenu.Content sideOffset={8} align="end" className="z-50 min-w-[180px] rounded-xl p-2 outline-none" style={menuStyle}>
                            {r.status === "PENDING" && (
                              <>
                                <DDItem icon={<FiCheckCircle />} onSelect={() => handleApprove(r)}>قبول الطلب</DDItem>
                                <DDItem icon={<FiXCircle />} onSelect={() => { setSelected(r); setRejectOpen(true); }} danger>رفض الطلب</DDItem>
                              </>
                            )}
                            {r.status !== "PENDING" && (
                              <DDItem icon={<FiEye />} onSelect={() => {}}>عرض التفاصيل</DDItem>
                            )}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <AdRequestFormDialog open={addOpen} onOpenChange={setAddOpen}
        onSuccess={() => { showToast("تم إرسال الطلب بنجاح ✓"); fetch(); }} />
      <RejectDialog open={rejectOpen} onOpenChange={setRejectOpen} طلب={selected}
        onSuccess={() => { showToast("تم رفض الطلب"); fetch(); }} />
    </>
  );
}

function DDItem({ children, icon, onSelect, danger }) {
  return (
    <DropdownMenu.Item
      className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm cursor-pointer select-none outline-none transition-colors hover:bg-black/5"
      onSelect={(e) => { e.preventDefault(); onSelect?.(); }}
      style={{ color: danger ? "var(--red-9)" : "var(--gray-12)" }}>
      <span className="text-base opacity-75">{icon}</span>
      <span className="font-medium">{children}</span>
    </DropdownMenu.Item>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdsManagement() {
  const [activeTab, setActiveTab] = useState("templates");
  const [toast,     setToast]     = useState(null);
  const [addTemplateOpen, setAddTemplateOpen] = useState(false);
  const [addRequestOpen,  setAddRequestOpen]  = useState(false);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div dir="rtl" className="space-y-6 p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row-reverse justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            {activeTab === "templates" && (
              <button onClick={() => setAddTemplateOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:opacity-90 transition text-sm font-medium">
                <FiPlus /> إضافة نموذج إعلان
              </button>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>إدارة الإعلانات</h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--gray-11)" }}>إدارة الـ نماذج الإعلانات والـ طلبs</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--gray-a3)" }}>
          {[
            { key: "templates", label: "📋 نماذج الإعلانات" },
            { key: "requests",  label: "📨 طلبات الإعلانات"  },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab.key ? "var(--gray-1)" : "transparent",
                color:      activeTab === tab.key ? "var(--gray-12)" : "var(--gray-10)",
                boxShadow:  activeTab === tab.key ? "0 1px 4px rgba(0,0,0,.08)" : "none",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "templates"
          ? <TemplatesTab showToast={showToast} addOpen={addTemplateOpen} setAddOpen={setAddTemplateOpen} />
          : <RequestsTab  showToast={showToast} addOpen={addRequestOpen}  setAddOpen={setAddRequestOpen}  />
        }
      </div>
    </>
  );
}