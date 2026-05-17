import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import {
  IoArrowBack,
  IoChevronBack,
  IoChevronForward,
  IoClose,
  IoFunnelOutline,
  IoGridOutline,
  IoPricetagOutline,
  IoRefreshOutline,
  IoSearchOutline,
  IoSparklesOutline,
  IoStorefrontOutline,
} from "react-icons/io5";

import Header from "../../components/customer/HomePageComponents/Header";
import Footer from "../../components/customer/HomePageComponents/Footer";
import CategoryBar from "../../components/customer/HomePageComponents/CategoryBar";
import ProductCard from "../../components/customer/HomePageComponents/ProductCard";
import { customerApi } from "../../api/customerApi";

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث", backend: ["id,desc"] },
  { value: "oldest", label: "الأقدم", backend: ["id,asc"] },
];

const TARGETED_AUDIENCE_OPTIONS = [
  { value: "ALL", label: "للجميع" },
  { value: "MALE", label: "للرجال" },
  { value: "FEMALE", label: "للنساء" },
];

const AGE_GROUP_OPTIONS = [
  { value: "ALL", label: "كل الأعمار" },
  { value: "NEWBORN", label: "حديثو الولادة" },
  { value: "INFANT", label: "الرضع" },
  { value: "TODDLER", label: "الأطفال الصغار" },
  { value: "CHILD", label: "الأطفال" },
  { value: "TEENAGER", label: "المراهقون" },
  { value: "YOUTH", label: "الشباب" },
  { value: "ADULT", label: "البالغون" },
];

function parseAttributeSelections(searchParams) {
  const result = {};

  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith("attr-")) continue;
    const attributeId = Number(key.replace("attr-", ""));
    const optionIds = value
      .split(",")
      .map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry));

    if (Number.isFinite(attributeId) && optionIds.length) {
      result[attributeId] = optionIds;
    }
  }

  return result;
}

function applyAttributeSelections(searchParams, selections) {
  const next = new URLSearchParams(searchParams);

  Array.from(next.keys()).forEach((key) => {
    if (key.startsWith("attr-")) next.delete(key);
  });

  Object.entries(selections).forEach(([attributeId, optionIds]) => {
    if (!optionIds?.length) return;
    next.set(`attr-${attributeId}`, optionIds.join(","));
  });

  return next;
}

function parsePositiveNumber(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function collectCategoryAndDescendantIds(categories, rootCategoryId) {
  const rootId = Number(rootCategoryId);
  if (!Number.isFinite(rootId)) return [];

  const childrenByParentId = new Map();

  categories.forEach((category) => {
    const parentId = Number(category?.parentId);
    const categoryNumericId = Number(category?.id);

    if (!Number.isFinite(parentId) || !Number.isFinite(categoryNumericId)) return;

    if (!childrenByParentId.has(parentId)) {
      childrenByParentId.set(parentId, []);
    }

    childrenByParentId.get(parentId).push(categoryNumericId);
  });

  const collected = [];
  const queue = [rootId];
  const visited = new Set();

  while (queue.length) {
    const currentId = queue.shift();
    if (!Number.isFinite(currentId) || visited.has(currentId)) continue;

    visited.add(currentId);
    collected.push(currentId);

    const childIds = childrenByParentId.get(currentId) ?? [];
    childIds.forEach((childId) => {
      if (!visited.has(childId)) queue.push(childId);
    });
  }

  return collected;
}

function formatPrice(value) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function SummaryCard({ icon: Icon, label, value, tone = "default" }) {
  const toneClasses =
    tone === "accent"
      ? "bg-[rgba(27,79,240,0.1)] text-[var(--customer-accent)]"
      : tone === "success"
        ? "bg-emerald-50 text-emerald-600"
        : "bg-white text-slate-700";

  return (
    <div className="customer-panel px-4 py-4 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-[1.55rem] font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${toneClasses}`}>
          <Icon className="text-xl" />
        </div>
      </div>
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="customer-panel-strong overflow-hidden rounded-[28px] border border-[var(--customer-border)] animate-pulse"
        >
          <div className="aspect-[0.95] bg-slate-100" />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="h-4 w-3/4 rounded-full bg-slate-100" />
            <div className="h-3 w-1/2 rounded-full bg-slate-100" />
            <div className="h-4 w-1/3 rounded-full bg-slate-100" />
            <div className="h-11 rounded-[18px] bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon = IoGridOutline, title, description, actionLabel, onAction }) {
  return (
    <div className="customer-panel-strong px-6 py-14 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-[26px] bg-slate-100 text-slate-500">
        <Icon className="text-3xl" />
      </div>
      <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
      {onAction ? (
        <button type="button" onClick={onAction} className="customer-secondary-btn mt-6 rounded-2xl px-5">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder = "الكل", disabled = false }) {
  return (
    <label className="block text-right">
      <span className="mb-2 block text-xs font-semibold text-slate-500">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--customer-border)] bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[rgba(15,109,255,0.24)] focus:ring-4 focus:ring-[rgba(15,109,255,0.08)] disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AttributeGroup({ attribute, selectedOptionIds, onToggle }) {
  if (!attribute?.options?.length) return null;

  return (
    <div className="rounded-[24px] border border-[var(--customer-border)] bg-white/86 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-right">
          <h3 className="text-sm font-black text-slate-950">{attribute.name}</h3>
          <p className="mt-1 text-[11px] text-slate-500">{attribute.options.length} خيارات متاحة</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <IoPricetagOutline className="text-lg" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {attribute.options.map((option) => {
          const checked = selectedOptionIds.includes(option.id);

          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 transition ${
                checked
                  ? "border-[rgba(27,79,240,0.16)] bg-[var(--customer-accent-soft)]"
                  : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
              }`}
            >
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{option.value}</p>
                <p className="text-[11px] text-slate-500">{option.totalProducts} منتج</p>
              </div>
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onToggle(attribute.id, option.id, event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[var(--customer-accent)] focus:ring-[rgba(15,109,255,0.2)]"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ActiveFilterChip({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-[rgba(27,79,240,0.14)] bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-[var(--customer-shadow-soft)] hover:border-[rgba(27,79,240,0.24)] hover:text-[var(--customer-accent)]"
    >
      <IoClose className="text-sm" />
      {label}
    </button>
  );
}

function FiltersSummary({
  activeFilters,
  onClearAll,
}) {
  if (!activeFilters.length) {
    return (
      <div className="customer-panel px-4 py-4 shadow-none">
        <p className="text-sm font-semibold text-slate-500">لا توجد فلاتر إضافية مفعلة الآن.</p>
      </div>
    );
  }

  return (
    <div className="customer-panel px-4 py-4 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <ActiveFilterChip key={filter.key} label={filter.label} onRemove={filter.onRemove} />
          ))}
        </div>
        <button type="button" onClick={onClearAll} className="text-sm font-bold text-[var(--customer-accent)]">
          مسح الكل
        </button>
      </div>
    </div>
  );
}

function FilterPanel({
  malls,
  stores,
  brands,
  attributes,
  filters,
  selectedCategoryName,
  priceRange,
  onApplySearch,
  onApplyPrice,
  onFilterChange,
  onToggleAttribute,
  onClearFilters,
  searchText,
  setSearchText,
  minPriceText,
  setMinPriceText,
  maxPriceText,
  setMaxPriceText,
}) {
  return (
    <div className="space-y-4">
      <div className="customer-panel-strong rounded-[28px] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500">الفئة الحالية</p>
            <h2 className="mt-2 text-lg font-black text-slate-950">
              {selectedCategoryName || "جميع المنتجات"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              حرّك البحث بين المولات والمتاجر والعلامات التجارية ضمن الفلاتر التي يدعمها الخادم.
            </p>
          </div>

          <button type="button" onClick={onClearFilters} className="customer-secondary-btn rounded-2xl px-4 text-sm">
            <IoRefreshOutline className="text-base" />
            إعادة الضبط
          </button>
        </div>
      </div>

      <div className="customer-panel p-5 shadow-none">
        <div className="flex items-center gap-2 rounded-[22px] border border-[var(--customer-border)] bg-white px-4">
          <button
            type="button"
            onClick={onApplySearch}
            className="text-slate-500 transition hover:text-[var(--customer-accent)]"
          >
            <IoSearchOutline className="text-lg" />
          </button>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onApplySearch();
            }}
            placeholder="ابحث بالاسم أو الوصف"
            className="w-full bg-transparent py-3.5 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="customer-panel p-5 shadow-none">
        <div className="grid gap-4">
          <FilterSelect
            label="المول"
            value={filters.mallId}
            onChange={(value) => onFilterChange("mallId", value)}
            options={malls.map((mall) => ({ value: String(mall.id), label: mall.name }))}
            placeholder="كل المولات"
          />

          <FilterSelect
            label="المتجر"
            value={filters.storeId}
            onChange={(value) => onFilterChange("storeId", value)}
            options={stores.map((store) => ({ value: String(store.id), label: store.name }))}
            placeholder="كل المتاجر"
            disabled={!stores.length}
          />

          <FilterSelect
            label="الماركة"
            value={filters.brandId}
            onChange={(value) => onFilterChange("brandId", value)}
            options={brands.map((brand) => ({ value: String(brand.id), label: `${brand.name} (${brand.totalProduct})` }))}
            placeholder="كل الماركات"
            disabled={!brands.length}
          />

          <FilterSelect
            label="الجمهور المستهدف"
            value={filters.targetedAudience}
            onChange={(value) => onFilterChange("targetedAudience", value)}
            options={TARGETED_AUDIENCE_OPTIONS}
            placeholder="كل الجماهير"
          />

          <FilterSelect
            label="الفئة العمرية"
            value={filters.ageGroup}
            onChange={(value) => onFilterChange("ageGroup", value)}
            options={AGE_GROUP_OPTIONS}
            placeholder="كل الفئات العمرية"
          />
        </div>
      </div>

      <div className="customer-panel p-5 shadow-none">
        <div className="text-right">
          <h3 className="text-sm font-black text-slate-950">نطاق السعر</h3>
          {priceRange ? (
            <p className="mt-1 text-xs leading-6 text-slate-500">
              متاح من ₪{formatPrice(priceRange.minPrice)} إلى ₪{formatPrice(priceRange.maxPrice)}
            </p>
          ) : (
            <p className="mt-1 text-xs leading-6 text-slate-500">اختر الحد الأدنى والأعلى إذا أردت تضييق النتائج.</p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-right">
            <span className="mb-2 block text-xs font-semibold text-slate-500">من</span>
            <input
              type="number"
              min="0"
              value={minPriceText}
              onChange={(event) => setMinPriceText(event.target.value)}
              className="w-full rounded-2xl border border-[var(--customer-border)] bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[rgba(15,109,255,0.24)] focus:ring-4 focus:ring-[rgba(15,109,255,0.08)]"
            />
          </label>
          <label className="block text-right">
            <span className="mb-2 block text-xs font-semibold text-slate-500">إلى</span>
            <input
              type="number"
              min="0"
              value={maxPriceText}
              onChange={(event) => setMaxPriceText(event.target.value)}
              className="w-full rounded-2xl border border-[var(--customer-border)] bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[rgba(15,109,255,0.24)] focus:ring-4 focus:ring-[rgba(15,109,255,0.08)]"
            />
          </label>
        </div>

        <button type="button" onClick={onApplyPrice} className="customer-primary-btn mt-4 w-full rounded-2xl">
          تطبيق السعر
        </button>
      </div>

      {attributes?.length ? (
        <div className="space-y-4">
          {attributes.map((attribute) => (
            <AttributeGroup
              key={attribute.id}
              attribute={attribute}
              selectedOptionIds={filters.selectedOptionsByAttribute[attribute.id] ?? []}
              onToggle={onToggleAttribute}
            />
          ))}
        </div>
      ) : null}

    </div>
  );
}

function PaginationControls({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="customer-secondary-btn rounded-2xl px-4 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <IoChevronForward className="text-base" />
        السابق
      </button>

      <div className="rounded-2xl border border-[var(--customer-border)] bg-white px-4 py-3 text-sm font-bold text-slate-700">
        الصفحة {page} من {totalPages}
      </div>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="customer-secondary-btn rounded-2xl px-4 disabled:cursor-not-allowed disabled:opacity-50"
      >
        التالي
        <IoChevronBack className="text-base" />
      </button>
    </div>
  );
}

export default function CustomerProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [malls, setMalls] = useState([]);
  const [stores, setStores] = useState([]);
  const [productsState, setProductsState] = useState({ products: [], totalPages: 0, total: 0, page: 0 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [searchText, setSearchText] = useState(searchParams.get("q") || "");
  const [minPriceText, setMinPriceText] = useState(searchParams.get("minPrice") || "");
  const [maxPriceText, setMaxPriceText] = useState(searchParams.get("maxPrice") || "");

  const categoryId = searchParams.get("categoryId") || "";
  const mallId = searchParams.get("mallId") || "";
  const storeId = searchParams.get("storeId") || "";
  const brandId = searchParams.get("brandId") || "";
  const targetedAudience = searchParams.get("targetedAudience") || "";
  const ageGroup = searchParams.get("ageGroup") || "";
  const parsedPage = Number(searchParams.get("page") || 1);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sortKey = searchParams.get("sort") || "newest";
  const selectedOptionsByAttribute = useMemo(() => parseAttributeSelections(searchParams), [searchParams]);

  useEffect(() => {
    setSearchText(searchParams.get("q") || "");
    setMinPriceText(searchParams.get("minPrice") || "");
    setMaxPriceText(searchParams.get("maxPrice") || "");
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    Promise.all([
      customerApi.getCategories().catch(() => []),
      customerApi.getActiveMalls().catch(() => []),
      customerApi.getActiveShops().catch(() => []),
    ]).then(([categoryList, mallList, shopList]) => {
      if (!active) return;
      setCategories(categoryList);
      setMalls(mallList);
      setStores(shopList);
    });

    return () => {
      active = false;
    };
  }, []);

  const currentCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(categoryId)) || null,
    [categories, categoryId]
  );

  const selectedCategoryIds = useMemo(
    () => collectCategoryAndDescendantIds(categories, categoryId),
    [categories, categoryId]
  );

  const backendFilter = useMemo(() => {
    const filter = {};
    const q = (searchParams.get("q") || "").trim();
    if (q) filter.q = q;
    if (selectedCategoryIds.length) filter.categoryIds = selectedCategoryIds;
    if (brandId) filter.brandId = Number(brandId);
    if (mallId) filter.mallId = Number(mallId);
    if (storeId) filter.storeId = Number(storeId);
    if (targetedAudience) filter.targetedAudience = targetedAudience;
    if (ageGroup) filter.ageGroup = ageGroup;

    const minPrice = parsePositiveNumber(searchParams.get("minPrice"));
    const maxPrice = parsePositiveNumber(searchParams.get("maxPrice"));
    if (minPrice != null) filter.minPrice = minPrice;
    if (maxPrice != null) filter.maxPrice = maxPrice;

    if (Object.keys(selectedOptionsByAttribute).length) {
      filter.selectedOptionsByAttribute = selectedOptionsByAttribute;
    }

    return filter;
  }, [searchParams, selectedCategoryIds, brandId, mallId, storeId, targetedAudience, ageGroup, selectedOptionsByAttribute]);

  const selectedSort = SORT_OPTIONS.find((option) => option.value === sortKey) ?? SORT_OPTIONS[0];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    customerApi
      .getProducts(backendFilter, page - 1, PAGE_SIZE, selectedSort.backend)
      .then((result) => {
        if (!active) return;
        setProductsState(result);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "تعذر تحميل المنتجات");
        setProductsState({ products: [], totalPages: 0, total: 0, page: 0 });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [backendFilter, page, selectedSort]);

  useEffect(() => {
    let active = true;
    setLoadingSummary(true);

    customerApi
      .getProductSummary(backendFilter)
      .then((result) => {
        if (!active) return;
        setSummary(result);
      })
      .catch(() => {
        if (!active) return;
        setSummary(null);
      })
      .finally(() => {
        if (active) setLoadingSummary(false);
      });

    return () => {
      active = false;
    };
  }, [backendFilter]);

  const filteredStores = useMemo(() => {
    if (!mallId) return stores;
    return stores.filter((store) => String(store.mallId) === String(mallId));
  }, [stores, mallId]);

  const filtersState = useMemo(
    () => ({
      mallId,
      storeId,
      brandId,
      targetedAudience,
      ageGroup,
      selectedOptionsByAttribute,
    }),
    [mallId, storeId, brandId, targetedAudience, ageGroup, selectedOptionsByAttribute]
  );

  const updateSearchParams = (updates = {}, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value == null || value === "") {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    if (resetPage) {
      next.set("page", "1");
    }

    setSearchParams(next);
  };

  const handleCategoryNavigation = (nextCategoryId) => {
    const next = new URLSearchParams();
    if (nextCategoryId != null && nextCategoryId !== "") {
      next.set("categoryId", String(nextCategoryId));
    }
    setSearchParams(next);
  };

  const handleSimpleFilterChange = (key, value) => {
    if (key === "mallId") {
      const next = new URLSearchParams(searchParams);
      if (value) next.set("mallId", String(value));
      else next.delete("mallId");
      next.delete("storeId");
      next.set("page", "1");
      setSearchParams(next);
      return;
    }

    updateSearchParams({ [key]: value });
  };

  const handleApplySearch = () => {
    updateSearchParams({ q: searchText.trim() });
  };

  const handleApplyPrice = () => {
    updateSearchParams({
      minPrice: minPriceText,
      maxPrice: maxPriceText,
    });
  };

  const handleToggleAttribute = (attributeId, optionId, checked) => {
    const nextSelections = { ...selectedOptionsByAttribute };
    const current = new Set(nextSelections[attributeId] ?? []);

    if (checked) current.add(optionId);
    else current.delete(optionId);

    if (current.size) nextSelections[attributeId] = Array.from(current);
    else delete nextSelections[attributeId];

    const next = applyAttributeSelections(searchParams, nextSelections);
    next.set("page", "1");
    setSearchParams(next);
  };

  const handleClearFilters = () => {
    const next = new URLSearchParams();
    if (categoryId) next.set("categoryId", categoryId);
    setSearchParams(next);
  };

  const handleSortChange = (value) => {
    updateSearchParams({ sort: value }, { resetPage: true });
  };

  const handlePageChange = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const removeSingleFilter = (key) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    next.set("page", "1");
    if (key === "mallId") next.delete("storeId");
    setSearchParams(next);
  };

  const clearAttributeFilters = () => {
    const next = applyAttributeSelections(searchParams, {});
    next.set("page", "1");
    setSearchParams(next);
  };

  const totalPages = productsState.totalPages || 0;
  const totalProducts = summary?.totalProducts ?? productsState.total ?? 0;
  const brandOptions = summary?.brands ?? [];
  const attributeOptions = summary?.attributeSummary ?? [];
  const priceRange = summary?.priceRange ?? null;
  const selectedMall = malls.find((mall) => String(mall.id) === String(mallId)) || null;
  const selectedStore = stores.find((store) => String(store.id) === String(storeId)) || null;
  const selectedBrand = brandOptions.find((brand) => String(brand.id) === String(brandId)) || null;
  const selectedAudienceLabel =
    TARGETED_AUDIENCE_OPTIONS.find((option) => option.value === targetedAudience)?.label || "";
  const selectedAgeGroupLabel =
    AGE_GROUP_OPTIONS.find((option) => option.value === ageGroup)?.label || "";
  const attributeFiltersCount = Object.values(selectedOptionsByAttribute).reduce(
    (count, optionIds) => count + optionIds.length,
    0
  );

  const activeFilters = useMemo(() => {
    const list = [];

    if (searchParams.get("q")) {
      list.push({
        key: "q",
        label: `بحث: ${searchParams.get("q")}`,
        onRemove: () => removeSingleFilter("q"),
      });
    }
    if (selectedMall) {
      list.push({
        key: "mallId",
        label: `المول: ${selectedMall.name}`,
        onRemove: () => removeSingleFilter("mallId"),
      });
    }
    if (selectedStore) {
      list.push({
        key: "storeId",
        label: `المتجر: ${selectedStore.name}`,
        onRemove: () => removeSingleFilter("storeId"),
      });
    }
    if (selectedBrand) {
      list.push({
        key: "brandId",
        label: `الماركة: ${selectedBrand.name}`,
        onRemove: () => removeSingleFilter("brandId"),
      });
    }
    if (selectedAudienceLabel) {
      list.push({
        key: "targetedAudience",
        label: `الجمهور: ${selectedAudienceLabel}`,
        onRemove: () => removeSingleFilter("targetedAudience"),
      });
    }
    if (selectedAgeGroupLabel) {
      list.push({
        key: "ageGroup",
        label: `العمر: ${selectedAgeGroupLabel}`,
        onRemove: () => removeSingleFilter("ageGroup"),
      });
    }
    if (searchParams.get("minPrice") || searchParams.get("maxPrice")) {
      list.push({
        key: "price",
        label: `السعر: ${searchParams.get("minPrice") || "0"} - ${searchParams.get("maxPrice") || "∞"}`,
        onRemove: () => {
          const next = new URLSearchParams(searchParams);
          next.delete("minPrice");
          next.delete("maxPrice");
          next.set("page", "1");
          setSearchParams(next);
        },
      });
    }
    if (attributeFiltersCount) {
      list.push({
        key: "attributes",
        label: `خصائص محددة: ${attributeFiltersCount}`,
        onRemove: clearAttributeFilters,
      });
    }

    return list;
  }, [
    searchParams,
    selectedMall,
    selectedStore,
    selectedBrand,
    selectedAudienceLabel,
    selectedAgeGroupLabel,
    attributeFiltersCount,
  ]);

  const filterPanel = (
    <FilterPanel
      malls={malls}
      stores={filteredStores}
      brands={brandOptions}
      attributes={attributeOptions}
      filters={filtersState}
      selectedCategoryName={currentCategory?.name}
      priceRange={priceRange}
      onApplySearch={handleApplySearch}
      onApplyPrice={handleApplyPrice}
      onFilterChange={handleSimpleFilterChange}
      onToggleAttribute={handleToggleAttribute}
      onClearFilters={handleClearFilters}
      searchText={searchText}
      setSearchText={setSearchText}
      minPriceText={minPriceText}
      setMinPriceText={setMinPriceText}
      maxPriceText={maxPriceText}
      setMaxPriceText={setMaxPriceText}
    />
  );

  return (
    <div className="customer-page">
      <Header />

      <CategoryBar
        categories={categories}
        selectedCategoryId={categoryId || null}
        onSelectCategory={handleCategoryNavigation}
        malls={[]}
        stores={[]}
        showMallStoreMenu={false}
      />

      <section className="customer-shell px-4 py-6 sm:px-6 md:px-10 md:py-8">
        <div className="relative overflow-hidden rounded-[34px] border border-[var(--customer-border)] bg-[linear-gradient(135deg,#ffffff_0%,#f7f8fd_42%,#eef4ff_100%)] shadow-[var(--customer-shadow-lg)]">
          <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-[rgba(27,79,240,0.08)] blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[rgba(15,23,42,0.05)] blur-3xl" />

          <div className="relative px-5 py-6 sm:px-7 md:px-8 md:py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="text-right">
                <span className="customer-kicker">
                  <IoSparklesOutline />
                  صفحة اكتشاف المنتجات
                </span>
                <h1 className="mt-4 text-[2rem] font-black leading-[1.15] tracking-tight text-slate-950 md:text-[2.6rem]">
                  {currentCategory?.name || "جميع المنتجات"}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 md:text-[0.96rem]">
                  استعرض منتجات عامة من مختلف المتاجر والمولات، وفلتر النتائج وفق الحقول الحقيقية التي يدعمها
                  الخادم من غير ازدحام أو تعقيد.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <button type="button" onClick={() => navigate(-1)} className="customer-secondary-btn rounded-2xl px-4">
                  <IoArrowBack className="text-base" />
                  رجوع
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="customer-secondary-btn rounded-2xl px-4 lg:hidden"
                >
                  <IoFunnelOutline className="text-base" />
                  الفلاتر
                </button>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={IoGridOutline}
                label="إجمالي النتائج"
                value={loadingSummary ? "..." : `${totalProducts}`}
                tone="accent"
              />
              <SummaryCard
                icon={IoStorefrontOutline}
                label="الماركات المتاحة"
                value={loadingSummary ? "..." : `${brandOptions.length}`}
              />
              <SummaryCard
                icon={IoPricetagOutline}
                label="أقل سعر ظاهر"
                value={loadingSummary || !priceRange ? "..." : `₪${formatPrice(priceRange.minPrice)}`}
                tone="success"
              />
              <SummaryCard
                icon={IoSparklesOutline}
                label="خصائص قابلة للتصفية"
                value={loadingSummary ? "..." : `${attributeOptions.length}`}
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <FiltersSummary activeFilters={activeFilters} onClearAll={handleClearFilters} />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-[24px] border border-[var(--customer-border)] bg-white/80 px-4 py-4 shadow-[var(--customer-shadow-soft)]">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500">الفرز المعتمد من الخادم</p>
            <p className="mt-1 text-sm font-black text-slate-950">
              {loading ? "جارٍ التحميل..." : `${productsState.total || 0} منتج في الصفحة الحالية`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sortKey}
              onChange={(event) => handleSortChange(event.target.value)}
              className="rounded-2xl border border-[var(--customer-border)] bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[rgba(15,109,255,0.24)] focus:ring-4 focus:ring-[rgba(15,109,255,0.08)]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden lg:block lg:sticky lg:top-[calc(var(--app-header-h)+1.25rem)] lg:self-start">
            {filterPanel}
          </aside>

          <main className="min-w-0">
            {error ? (
              <EmptyState
                icon={IoRefreshOutline}
                title="تعذر تحميل المنتجات"
                description={error}
                actionLabel="إعادة ضبط الفلاتر"
                onAction={handleClearFilters}
              />
            ) : loading ? (
              <ProductsSkeleton />
            ) : productsState.products.length === 0 ? (
              <EmptyState
                icon={IoGridOutline}
                title="لا توجد منتجات مطابقة"
                description="لم نعثر على نتائج تطابق الفئة أو الفلاتر الحالية. جرّب إزالة بعض الشروط أو توسيع نطاق البحث."
                actionLabel="مسح الفلاتر"
                onAction={handleClearFilters}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {productsState.products.map((product) => (
                    <ProductCard key={product.id} p={product} onAddToCart={() => {}} />
                  ))}
                </div>
                <PaginationControls page={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </>
            )}
          </main>
        </div>
      </section>

      <Dialog.Root open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-sm lg:hidden" />
          <Dialog.Content className="fixed inset-x-3 bottom-3 top-20 z-[80] overflow-auto rounded-[28px] bg-[var(--customer-bg-soft)] p-4 shadow-2xl lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-right">
                <Dialog.Title className="text-lg font-black text-slate-950">فلاتر المنتجات</Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">اختر ما يناسبك ثم أغلق اللوحة لتطبيق العرض.</p>
              </div>
              <Dialog.Close className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--customer-border)] bg-white text-slate-500">
                <IoClose className="text-xl" />
              </Dialog.Close>
            </div>
            {filterPanel}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Footer />
    </div>
  );
}
