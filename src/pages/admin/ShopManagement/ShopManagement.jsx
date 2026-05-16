import React, { useState, useCallback, useEffect } from "react";
import { useSortedData, SortableTh } from "../../../utils/tableSort";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  FiPlus,
  FiSearch,
  FiMapPin,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiMoreVertical,
  FiEye,
  FiEdit,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft as FiArrowLeft,
  FiLoader,
} from "react-icons/fi";
import { shopsApi, mallsApi } from "./api";
import {
  SHOP_STATUSES,
  SHOP_STATUS_LABELS,
  SHOP_STATUS_COLORS,
  SHOP_ADMIN_STATUS_LABELS,
  SHOP_ADMIN_STATUS_COLORS,
  CATEGORY_LABELS,
} from "./constants";
import ShopDetailsDialog from "./ShopDetailsDialog";
import ShopFormDialog from "./ShopFormDialog";

// ── Global Filter Styles ──────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @keyframes dropIn {
    from { opacity:0; transform:translateY(-6px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  :root {
    --f-bg:#f9fafb; --f-bg-open:#fff; --f-border:rgba(0,0,0,.10);
    --f-border-focus:#2563eb; --f-ring:rgba(37,99,235,.13);
    --f-text:#111827; --f-placeholder:#9ca3af; --f-icon:#9ca3af;
    --f-panel:#fff; --f-panel-border:rgba(0,0,0,.09);
    --f-panel-shadow:0 8px 32px rgba(0,0,0,.13),0 2px 8px rgba(0,0,0,.06);
    --f-item-hover:rgba(0,0,0,.05); --f-item-active:rgba(37,99,235,.09);
    --f-item-active-text:#2563eb; --f-divider:rgba(0,0,0,.07);
    --f-search-bg:#f3f4f6; --f-chevron:#9ca3af;
  }

  .dark {
    --f-bg:#1f2937; --f-bg-open:#111827; --f-border:rgba(255,255,255,.10);
    --f-border-focus:#3b82f6; --f-ring:rgba(59,130,246,.18);
    --f-text:#f9fafb; --f-placeholder:#6b7280; --f-icon:#6b7280;
    --f-panel:#1e2736; --f-panel-border:rgba(255,255,255,.10);
    --f-panel-shadow:0 8px 32px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.30);
    --f-item-hover:rgba(255,255,255,.06); --f-item-active:rgba(59,130,246,.15);
    --f-item-active-text:#60a5fa; --f-divider:rgba(255,255,255,.08);
    --f-search-bg:#111827; --f-chevron:#6b7280;
  }

  .f-trigger {
    width:100%;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:8px;
    border-radius:12px;
    padding:10px 16px;
    font-size:14px;
    cursor:pointer;
    outline:none;
    transition:background .15s,border-color .15s,box-shadow .15s;
    background:var(--f-bg);
    border:1px solid var(--f-border);
    color:var(--f-text);
    text-align:right;
  }

  .f-trigger:hover { border-color:var(--f-border-focus); }

  .f-trigger.open,
  .f-trigger:focus-within {
    background:var(--f-bg-open);
    border-color:var(--f-border-focus);
    box-shadow:0 0 0 3px var(--f-ring);
  }

  .f-input {
    width:100%;
    border-radius:12px;
    padding:10px 16px;
    font-size:14px;
    outline:none;
    transition:background .15s,border-color .15s,box-shadow .15s;
    background:var(--f-bg);
    border:1px solid var(--f-border);
    color:var(--f-text);
    text-align:right;
  }

  .f-input::placeholder { color:var(--f-placeholder); }
  .f-input:hover { border-color:var(--f-border-focus); }

  .f-input:focus {
    background:var(--f-bg-open);
    border-color:var(--f-border-focus);
    box-shadow:0 0 0 3px var(--f-ring);
  }

  .f-panel {
    position:absolute;
    top:calc(100% + 6px);
    right:0;
    left:0;
    z-index:999;
    border-radius:14px;
    overflow:hidden;
    animation:dropIn .16s cubic-bezier(.16,1,.3,1);
    background:var(--f-panel);
    border:1px solid var(--f-panel-border);
    box-shadow:var(--f-panel-shadow);
  }

  .f-item {
    width:100%;
    display:flex;
    align-items:center;
    gap:10px;
    padding:9px 12px;
    border-radius:8px;
    font-size:14px;
    text-align:right;
    cursor:pointer;
    outline:none;
    border:none;
    background:transparent;
    color:var(--f-text);
    transition:background .1s;
  }

  .f-item:hover  { background:var(--f-item-hover); }
  .f-item.active { background:var(--f-item-active); color:var(--f-item-active-text); font-weight:600; }

  .spinning { animation: spin .8s linear infinite; }
`;

function StyleInjector() {
  useEffect(() => {
    const styleId = "shop-management-filter-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(style);
  }, []);

  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function useThemeContainer() {
  const [c, setC] = React.useState(null);

  React.useEffect(() => {
    setC(document.querySelector(".radix-themes") || document.body);
  }, []);

  return c;
}

function Spinner({ size = 16 }) {
  return (
    <FiLoader
      size={size}
      className="animate-spin"
      style={{ color: "var(--blue-9)" }}
    />
  );
}

function StatusBadge({ status }) {
  const s =
    SHOP_STATUS_COLORS[status] || {
      bg: "var(--gray-a3)",
      fg: "var(--gray-11)",
      dot: "var(--gray-9)",
    };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: s.dot }}
      />
      {SHOP_STATUS_LABELS[status] || status}
    </span>
  );
}

function AdminStatusBadge({ status }) {
  const s =
    SHOP_ADMIN_STATUS_COLORS[status] || {
      bg: "var(--gray-a3)",
      fg: "var(--gray-11)",
      dot: "var(--gray-9)",
    };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: s.dot }}
      />
      {SHOP_ADMIN_STATUS_LABELS[status] || status}
    </span>
  );
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium"
      style={{
        background: type === "success" ? "var(--green-2)" : "var(--red-2)",
        borderColor: type === "success" ? "var(--green-6)" : "var(--red-6)",
        color: type === "success" ? "var(--green-11)" : "var(--red-11)",
      }}
    >
      {message}
      <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-1">
        ✕
      </button>
    </div>
  );
}

// ── Actions Menu ──────────────────────────────────────────────────────────────
function getAdminStatus(shop) {
  return String(shop?.adminStatus || "NONE").toUpperCase();
}

function ShopActionsMenu({
  shop,
  loading,
  onView,
  onEdit,
  onSetMaintenance,
  onBlock,
  onClearAdminOverride,
}) {
  const themeContainer = useThemeContainer();
  const adminStatus = getAdminStatus(shop);
  const hasAdminOverride = adminStatus !== "NONE";

  const menuStyle = {
    background: "var(--gray-1)",
    border: "1px solid var(--gray-a6)",
    color: "var(--gray-12)",
    boxShadow: "0 14px 40px rgba(0,0,0,.35)",
  };

  return (
    <DropdownMenu.Root dir="rtl">
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          disabled={loading}
          className="p-2 rounded-lg transition outline-none hover:opacity-70"
          style={{ color: "var(--gray-12)" }}
        >
          {loading ? <Spinner size={14} /> : <FiMoreVertical />}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal container={themeContainer}>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-50 min-w-[190px] rounded-xl p-2 outline-none"
          style={menuStyle}
        >
          <DropdownMenu.Label
            className="px-2 py-1.5 text-xs font-semibold"
            style={{ color: "var(--gray-10)" }}
          >
            إجراءات الإدارة
          </DropdownMenu.Label>

          <DDItem icon={<FiEye />} onSelect={() => onView(shop)}>
            عرض التفاصيل
          </DDItem>

          <DDItem icon={<FiEdit />} onSelect={() => onEdit(shop)}>
            تعديل البيانات
          </DDItem>

          <DropdownMenu.Separator
            className="my-1.5 mx-2"
            style={{ height: 1, background: "var(--gray-a5)" }}
          />

          {hasAdminOverride ? (
            <DDItem icon={<FiCheckCircle />} onSelect={() => onClearAdminOverride(shop)}>
              {getAdminMenuLabel(adminStatus)}
            </DDItem>
          ) : (
            <>
              <DDItem icon={<FiAlertCircle />} onSelect={() => onSetMaintenance(shop)}>
                وضع تحت الصيانة
              </DDItem>
              <DDItem icon={<FiXCircle />} onSelect={() => onBlock(shop)}>
                حظر المتجر
              </DDItem>
            </>
          )}

          {hasAdminOverride && adminStatus !== "BLOCKED" && (
            <DDItem icon={<FiXCircle />} onSelect={() => onBlock(shop)}>
              تحويل إلى محظور
            </DDItem>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function DDItem({ children, icon, onSelect }) {
  return (
    <DropdownMenu.Item
      className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm cursor-pointer select-none outline-none transition-colors hover:bg-black/5"
      onSelect={(e) => {
        e.preventDefault();
        onSelect?.();
      }}
      style={{ color: "var(--gray-12)" }}
    >
      <span className="text-base opacity-75">{icon}</span>
      <span className="font-medium">{children}</span>
    </DropdownMenu.Item>
  );
}

function getAdminMenuLabel(adminStatus) {
  if (adminStatus === "BLOCKED") return "إزالة الحظر";
  if (adminStatus === "MAINTENANCE") return "إعادة للوضع الطبيعي";
  return "إعادة للوضع الطبيعي";
}

// ── Filter Input ──────────────────────────────────────────────────────────────
function extractPaginatedResult(response) {
  const raw = response?.data ?? response ?? {};
  const pageData = raw?.data ?? raw;

  const list =
    (Array.isArray(pageData?.content) && pageData.content) ||
    (Array.isArray(raw?.content) && raw.content) ||
    (Array.isArray(pageData) && pageData) ||
    (Array.isArray(raw) && raw) ||
    [];

  const meta = pageData?.meta ?? raw?.meta ?? {};

  return {
    list,
    totalPages: meta?.totalPages ?? pageData?.totalPages ?? raw?.totalPages ?? 1,
    totalItems: meta?.totalItems ?? pageData?.totalItems ?? raw?.totalItems ?? list.length,
  };
}

function FilterInput({ value, onChange, placeholder, icon: Icon }) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={13}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            color: focused ? "var(--f-border-focus)" : "var(--f-icon)",
            transition: "color .15s",
          }}
        />
      )}

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="f-input"
        style={{ paddingRight: Icon ? "2.5rem" : "1rem" }}
      />
    </div>
  );
}

function CustomDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectedOption = options.find(
    (o) => String(o.value) === String(value)
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`f-trigger ${open ? "open" : ""}`}
      >
        <span className="flex items-center gap-2">
          {selectedOption?.dot && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: selectedOption.dot }}
            />
          )}
          <span>{selectedOption?.label || placeholder}</span>
        </span>

        <span
          style={{
            color: "var(--f-chevron)",
            fontSize: "12px",
            transition: "transform .15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="f-panel p-2 max-h-64 overflow-auto">
          <button
            type="button"
            className={`f-item ${!value ? "active" : ""}`}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            {placeholder}
          </button>

          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`f-item ${
                String(value) === String(option.value) ? "active" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.dot && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: option.dot }}
                />
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ShopManagement() {
  const [shops, setShops] = useState([]);
  const { sorted: sortedShops, sortKey, sortDir, onSort } = useSortedData(shops, "name");
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(1);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Malls for filter dropdown
  const [malls, setMalls] = useState([]);

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [mallIdFilter, setMallIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [rowLoading, setRowLoading] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    []
  );

  const fetchShops = useCallback(async () => {
    setFetchLoading(true);
    setFetchError("");

    try {
      const params = {
        page,
        size: 10,
        ...(search ? { name: search } : {}),
        ...(mallIdFilter ? { mall_id: mallIdFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(locationFilter ? { location: locationFilter } : {}),
      };

      const res = await shopsApi.getAll(params);
      const { list, totalPages, totalItems } = extractPaginatedResult(res);

      setShops(list);
      setTotalPages(totalPages || 1);
      setTotalElements(totalItems || list.length);
    } catch (e) {
      setFetchError(e.message || "فشل في جلب البيانات");
      setShops([]);
    } finally {
      setFetchLoading(false);
    }
  }, [page, search, mallIdFilter, statusFilter, categoryFilter, locationFilter]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Fetch malls once for filter dropdown
  useEffect(() => {
    mallsApi
      .getList()
      .then((res) => {
        const list = res?.content || res?.data || [];
        setMalls(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, mallIdFilter, statusFilter, categoryFilter, locationFilter]);

  const runRowAction = async (shop, action, successMessage) => {
    setRowLoading((p) => ({ ...p, [shop.shopId]: true }));

    try {
      await action();
      showToast(successMessage);
      fetchShops();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setRowLoading((p) => ({ ...p, [shop.shopId]: false }));
    }
  };

  const handleSetMaintenance = async (shop) =>
    runRowAction(
      shop,
      () => shopsApi.setMaintenance(shop.shopId),
      `تم وضع ${shop.name} تحت الصيانة.`,
    );

  const handleBlock = async (shop) =>
    runRowAction(
      shop,
      () => shopsApi.block(shop.shopId),
      `تم حظر ${shop.name}.`,
    );

  const handleClearAdminOverride = async (shop) =>
    runRowAction(
      shop,
      () => shopsApi.clearAdminOverride(shop.shopId),
      `تمت إعادة ${shop.name} إلى الوضع الطبيعي.`,
    );

  const clearFilters = () => {
    setSearch("");
    setMallIdFilter("");
    setStatusFilter("");
    setCategoryFilter("");
    setLocationFilter("");
    setPage(0);
  };

  const hasFilters =
    search || mallIdFilter || statusFilter || categoryFilter || locationFilter;

  const statusOptions = SHOP_STATUSES.map((s) => ({
    value: s,
    label: SHOP_STATUS_LABELS[s],
    dot: SHOP_STATUS_COLORS[s]?.dot,
  }));

  const categoryOptions = Object.entries(CATEGORY_LABELS).map(([v, l]) => ({
    value: v,
    label: l,
  }));

  const mallOptions = malls.map((m) => ({
    value: String(m.mallId || m.id),
    label: m.name,
  }));

  return (
    <>
      <StyleInjector />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div dir="rtl" className="space-y-6 p-3 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row-reverse justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={fetchShops}
              disabled={fetchLoading}
              className="px-4 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 transition hover:opacity-80 disabled:opacity-50"
              style={{
                borderColor: "var(--gray-a7)",
                background: "transparent",
                color: "var(--gray-12)",
              }}
            >
              {fetchLoading ? <Spinner size={14} /> : <FiRefreshCw size={14} />}
              تحديث
            </button>

            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition"
              style={{ background: "#2563eb", color: "#fff" }}
            >
              <FiPlus /> إضافة متجر
            </button>
          </div>

          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--gray-12)" }}
            >
              إدارة المتاجر
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--gray-11)" }}>
              {totalElements > 0
                ? `${totalElements} متجر مسجل`
                : "إدارة المتاجر والحالات"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "var(--gray-1)",
            border: "1px solid var(--gray-a7)",
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--gray-11)" }}
              >
                اسم المتجر
              </label>
              <FilterInput
                value={search}
                onChange={setSearch}
                placeholder="ابحث بالاسم..."
                icon={FiSearch}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--gray-11)" }}
              >
                الموقع
              </label>
              <FilterInput
                value={locationFilter}
                onChange={setLocationFilter}
                placeholder="ابحث بالموقع..."
                icon={FiMapPin}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--gray-11)" }}
              >
                المول
              </label>
              <CustomDropdown
                value={mallIdFilter}
                onChange={setMallIdFilter}
                options={mallOptions}
                placeholder="كل المولات"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--gray-11)" }}
              >
                الحالة
              </label>
              <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                placeholder="كل الحالات"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--gray-11)" }}
              >
                الفئة
              </label>
              <CustomDropdown
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
                placeholder="كل الفئات"
              />
            </div>

            {hasFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-xl transition-opacity hover:opacity-70"
                  style={{
                    background: "var(--gray-a3)",
                    color: "var(--gray-11)",
                  }}
                >
                  ✕ مسح الفلاتر
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error banner */}
        {fetchError && (
          <div
            className="rounded-2xl px-5 py-3 flex items-center justify-between gap-3"
            style={{
              background: "var(--red-2)",
              border: "1px solid var(--red-6)",
            }}
          >
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--red-11)" }}
            >
              <FiAlertCircle size={15} />
              <span>{fetchError}</span>
            </div>

            <button
              onClick={fetchShops}
              className="text-xs font-semibold underline flex-shrink-0"
              style={{ color: "var(--red-11)" }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden overflow-x-auto"
          style={{
            background: "var(--gray-1)",
            border: "1px solid var(--gray-a7)",
          }}
        >
          <table className="w-full text-sm" style={{ minWidth: 700 }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--gray-a6)",
                  background: "var(--gray-a2)",
                  color: "var(--gray-11)",
                }}
              >
                <SortableTh label="المتجر" sortKey="name" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-3.5 font-semibold text-xs tracking-wide" />
                <SortableTh label="المول / الموقع" sortKey="mall.name" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-3.5 font-semibold text-xs tracking-wide" />
                <SortableTh label="الفئة" sortKey="category" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-3.5 font-semibold text-xs tracking-wide" />
                <SortableTh label="المالك" sortKey="owner.username" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-3.5 font-semibold text-xs tracking-wide" />
                <SortableTh label="الحالة" sortKey="status" currentKey={sortKey} direction={sortDir} onSort={onSort} className="px-5 py-3.5 font-semibold text-xs tracking-wide" />
                <th className="px-5 py-3.5 text-right font-semibold text-xs tracking-wide">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {fetchLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div
                      className="flex items-center justify-center gap-2"
                      style={{ color: "var(--gray-10)" }}
                    >
                      <Spinner size={20} /> جاري التحميل...
                    </div>
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-sm"
                    style={{ color: "var(--gray-10)" }}
                  >
                    لا توجد متاجر مطابقة.
                  </td>
                </tr>
              ) : (
                sortedShops.map((shop, idx) => (
                  <tr
                    key={shop.shopId}
                    style={{
                      borderTop:
                        idx === 0 ? "none" : "1px solid var(--gray-a5)",
                      color: "var(--gray-12)",
                      background: "transparent",
                    }}
                    className="transition hover:bg-(--gray-a3)"
                  >
                    {/* Shop name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0"
                          style={{
                            background: "var(--gray-a3)",
                            border: "1px solid var(--gray-a5)",
                          }}
                        >
                          {(() => {
                            const src = shop.logoUrl || shop.logoImage?.mediumFileUrl || shop.logoImage?.originalFileUrl || null;
                            return src ? (
                              <img
                                src={src}
                                alt={shop.name}
                                className="h-full w-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-lg">
                                🏪
                              </div>
                            );
                          })()}
                        </div>

                        <div>
                          <div className="font-semibold text-sm">{shop.name}</div>

                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "var(--gray-11)" }}
                          >
                            #{shop.shopId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Mall / Location */}
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium">
                        {shop.mall?.name || "—"}
                      </div>

                      {shop.location && (
                        <div
                          className="text-xs mt-0.5 flex items-center gap-1"
                          style={{ color: "var(--gray-11)" }}
                        >
                          <FiMapPin size={10} /> {shop.location}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4">
                      {shop.category ? (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: "var(--blue-a3)",
                            color: "var(--blue-11)",
                          }}
                        >
                          {CATEGORY_LABELS[shop.category] || shop.category}
                        </span>
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: "var(--gray-9)" }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    {/* Owner */}
                    <td className="px-5 py-4">
                      <div className="text-sm" style={{ color: "var(--gray-12)" }}>
                        {shop.owner?.username || "—"}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <AdminStatusBadge status={getAdminStatus(shop)} />
                        <StatusBadge status={shop.status} />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <ShopActionsMenu
                        shop={shop}
                        loading={!!rowLoading[shop.shopId]}
                        onView={(s) => {
                          setSelectedShop(s);
                          setViewOpen(true);
                        }}
                        onEdit={(s) => {
                          setSelectedShop(s);
                          setEditOpen(true);
                        }}
                        onSetMaintenance={handleSetMaintenance}
                        onBlock={handleBlock}
                        onClearAdminOverride={handleClearAdminOverride}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {!fetchLoading && totalPages > 1 && (
            <div
              className="flex items-center justify-between px-5 py-4 border-t"
              style={{ borderColor: "var(--gray-a6)" }}
            >
              <span className="text-xs" style={{ color: "var(--gray-11)" }}>
                صفحة {page + 1} من {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-8 w-8 rounded-lg flex items-center justify-center border transition hover:opacity-80 disabled:opacity-30"
                  style={{
                    borderColor: "var(--gray-a6)",
                    color: "var(--gray-12)",
                  }}
                >
                  <FiChevronRight size={14} />
                </button>

                {Array.from(
                  { length: Math.min(5, totalPages) },
                  (_, i) => {
                    const p =
                      Math.max(0, Math.min(page - 2, totalPages - 5)) + i;

                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium border transition"
                        style={{
                          borderColor:
                            p === page ? "#2563eb" : "var(--gray-a6)",
                          background:
                            p === page ? "#2563eb" : "transparent",
                          color: p === page ? "#fff" : "var(--gray-12)",
                        }}
                      >
                        {p + 1}
                      </button>
                    );
                  }
                )}

                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="h-8 w-8 rounded-lg flex items-center justify-center border transition hover:opacity-80 disabled:opacity-30"
                  style={{
                    borderColor: "var(--gray-a6)",
                    color: "var(--gray-12)",
                  }}
                >
                  <FiChevronLeft size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ShopDetailsDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        shop={selectedShop}
        onEdit={(s) => {
          setSelectedShop(s);
          setViewOpen(false);
          setEditOpen(true);
        }}
      />

      <ShopFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        shop={null}
        onSuccess={() => {
          showToast("تم إنشاء المتجر بنجاح ✓");
          fetchShops();
        }}
      />

      <ShopFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        shop={selectedShop}
        onSuccess={() => {
          showToast("تم تحديث المتجر بنجاح ✓");
          fetchShops();
        }}
      />
    </>
  );
}

