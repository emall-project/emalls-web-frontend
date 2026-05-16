import { useState, useCallback } from "react";
import { FiSearch, FiFilter, FiX } from "react-icons/fi";
import { RxSelect } from "../../../components/shopOwner/ui/RxSelect";
import { SearchableCombobox } from "../../../components/shopOwner/ui/SearchableCombobox";
import { AUDIENCE_OPTIONS, AGE_GROUP_OPTIONS } from "./constants";
import { productsApi } from "./api";

const INPUT_STYLE = {
  background:   "var(--gray-1)",
  border:       "1px solid var(--gray-a6)",
  color:        "var(--gray-12)",
  borderRadius: 10,
  padding:      "7px 12px",
  fontSize:     13,
  outline:      "none",
  width:        "100%",
};

function Spinner({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round"
      style={{ animation: "spin 0.75s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// Server-side search adapters — normalise API response to { value, label }[]
async function searchCategories(q) {
  const r = await productsApi.getCategories(q);
  const list = r?.data?.content ?? r?.data ?? r ?? [];
  return list.map(c => ({ value: String(c.id), label: c.name }));
}

async function searchBrands(q) {
  const r = await productsApi.getBrands(q);
  const list = r?.data?.content ?? r?.data ?? r ?? [];
  return list.map(b => ({ value: String(b.id), label: b.name }));
}

// ── Status options (static — fine for RxSelect) ───────────────────────────────
const STATUS_OPTIONS  = [
  { value: "true",  label: "نشط"      },
  { value: "false", label: "غير نشط"  },
];

/**
 * ProductFilters
 *
 * Props
 *   filters        – current filter state
 *   categories     – pre-loaded { value, label }[] for category combobox
 *   brands         – pre-loaded { value, label }[] for brand combobox
 *   onChange       – (filters) => void
 *   onSearch       – () => void  trigger search
 *   onReset        – () => void
 *   loading        – bool
 */
export function ProductFilters({ filters, categories, brands, onChange, onSearch, onReset, loading }) {
  const [expanded, setExpanded] = useState(false);

  const field = useCallback(
    (key, val) => onChange({ ...filters, [key]: val, page: 0 }),
    [filters, onChange]
  );

  return (
    <div className="rounded-2xl border p-4 space-y-3"
      style={{ background: "var(--gray-1)", borderColor: "var(--gray-a6)" }}>

      {/* ── Row 1 — always visible ── */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* Full-text search */}
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch size={14} className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ right: 10, color: "var(--gray-9)" }} />
          <input
            value={filters.q}
            onChange={e => field("q", e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSearch()}
            placeholder="البحث بالاسم أو الـ slug..."
            style={{ ...INPUT_STYLE, paddingRight: 30 }}
          />
        </div>

        {/* Category — SearchableCombobox (large dynamic list) */}
        <div style={{ width: "auto", minWidth: 160 }}>
          <SearchableCombobox
            value={filters.categoryId}
            onChange={v => field("categoryId", v)}
            placeholder="كل الفئات"
            searchPlaceholder="ابحث عن فئة..."
            options={categories}
            onSearch={searchCategories}
            emptyText="لا توجد فئات"
            style={{ width: "auto", minWidth: 160 }}
          />
        </div>

        {/* Brand — SearchableCombobox (large dynamic list) */}
        <div style={{ width: "auto", minWidth: 150 }}>
          <SearchableCombobox
            value={filters.brandId}
            onChange={v => field("brandId", v)}
            placeholder="كل الماركات"
            searchPlaceholder="ابحث عن ماركة..."
            options={brands}
            onSearch={searchBrands}
            emptyText="لا توجد ماركات"
            style={{ width: "auto", minWidth: 150 }}
          />
        </div>

        {/* Status — RxSelect (3 items, static) */}
        <RxSelect
          value={filters.isActive}
          onValueChange={v => field("isActive", v)}
          placeholder="كل الحالات"
          options={STATUS_OPTIONS}
          style={{ width: "auto", minWidth: 120 }}
        />

        {/* Expand / collapse advanced filters */}
        <button
          onClick={() => setExpanded(o => !o)}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium border transition-colors"
          style={{
            borderColor: "var(--gray-a6)",
            color:       "var(--gray-10)",
            background:  expanded ? "var(--gray-a3)" : "transparent",
          }}>
          <FiFilter size={13} />
          {expanded ? "إخفاء" : "المزيد"}
        </button>

        {/* Search */}
        <button
          onClick={onSearch}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity"
          style={{ background: "var(--blue-9)", color: "#fff", opacity: loading ? 0.7 : 1 }}>
          {loading ? <Spinner /> : <FiSearch size={13} />}
          بحث
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm border"
          style={{ borderColor: "var(--gray-a6)", color: "var(--gray-10)", background: "transparent" }}>
          <FiX size={13} />
          إعادة ضبط
        </button>
      </div>

      {/* ── Row 2 — advanced filters (audience, age group, price range) ── */}
      {expanded && (
        <div className="flex flex-wrap gap-3 pt-3 border-t" style={{ borderColor: "var(--gray-a4)" }}>

          {/* Audience — RxSelect (3 static items) */}
          <RxSelect
            value={filters.targetedAudience}
            onValueChange={v => field("targetedAudience", v)}
            placeholder="الجمهور المستهدف"
            options={AUDIENCE_OPTIONS}
            style={{ width: "auto", minWidth: 140 }}
          />

          {/* Age group — RxSelect (8 static items) */}
          <RxSelect
            value={filters.ageGroup}
            onValueChange={v => field("ageGroup", v)}
            placeholder="الفئة العمرية"
            options={AGE_GROUP_OPTIONS}
            style={{ width: "auto", minWidth: 140 }}
          />

          {/* Price range */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={filters.minPrice}
              onChange={e => field("minPrice", e.target.value)}
              placeholder="السعر من"
              min={0}
              style={{ ...INPUT_STYLE, width: 110 }}
            />
            <span style={{ color: "var(--gray-9)", fontSize: 13 }}>—</span>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={e => field("maxPrice", e.target.value)}
              placeholder="إلى"
              min={0}
              style={{ ...INPUT_STYLE, width: 110 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
