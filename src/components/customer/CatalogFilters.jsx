import { useEffect, useState } from "react";
import { FiFilter, FiX } from "react-icons/fi";
import { catalogApi, unwrapCatalogPayload } from "../../api/catalog";
import { AGE_GROUP_OPTIONS, AUDIENCE_OPTIONS } from "../../pages/shopOwner/Products/constants";

const inputClass = "w-full border border-black/10 bg-white px-3 py-2 text-sm outline-none";

function setFilterValue(filters, onChange, key, value) {
  onChange({ ...filters, [key]: value });
}

export function hasCatalogFilters(filters = {}) {
  return Boolean(
    filters.categoryId ||
    filters.brandId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.targetedAudience ||
    filters.ageGroup ||
    Object.values(filters.selectedOptionsByAttribute || {}).some((values) => values?.length)
  );
}

export function buildCatalogFilterPayload(filters = {}) {
  const selectedOptionsByAttribute = Object.fromEntries(
    Object.entries(filters.selectedOptionsByAttribute || {})
      .map(([attributeId, values]) => [
        attributeId,
        Array.isArray(values) ? values.map(Number).filter(Number.isFinite) : [],
      ])
      .filter(([, values]) => values.length)
  );

  return {
    ...(filters.categoryId ? { categoryId: Number(filters.categoryId) } : {}),
    ...(filters.brandId ? { brandId: Number(filters.brandId) } : {}),
    ...(filters.minPrice ? { minPrice: Number(filters.minPrice) } : {}),
    ...(filters.maxPrice ? { maxPrice: Number(filters.maxPrice) } : {}),
    ...(filters.targetedAudience ? { targetedAudience: filters.targetedAudience } : {}),
    ...(filters.ageGroup ? { ageGroup: filters.ageGroup } : {}),
    ...(Object.keys(selectedOptionsByAttribute).length ? { selectedOptionsByAttribute } : {}),
  };
}

export default function CatalogFilters({ filters, onChange, compact = false }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      catalogApi.categories.all({ isActive: true }).catch(() => null),
      catalogApi.brands.all({ isActive: true }).catch(() => null),
      catalogApi.attributes.all({ isActive: true }).catch(() => null),
    ]).then(([categoriesResponse, brandsResponse, attributesResponse]) => {
      if (cancelled) return;
      setCategories(unwrapCatalogPayload(categoriesResponse) || []);
      setBrands(unwrapCatalogPayload(brandsResponse) || []);
      setAttributes(unwrapCatalogPayload(attributesResponse) || []);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const reset = () => {
    onChange({
      categoryId: "",
      brandId: "",
      minPrice: "",
      maxPrice: "",
      targetedAudience: "",
      ageGroup: "",
      selectedOptionsByAttribute: {},
    });
  };

  return (
    <section className="border border-black/10 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-black">
          <FiFilter />
          تصفية المنتجات
        </div>
        {hasCatalogFilters(filters) ? (
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs text-black/60 hover:text-black">
            <FiX />
            مسح
          </button>
        ) : null}
      </div>

      <div className={compact ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
        <select className={inputClass} value={filters.categoryId || ""} onChange={(event) => setFilterValue(filters, onChange, "categoryId", event.target.value)}>
          <option value="">كل الفئات</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>

        <select className={inputClass} value={filters.brandId || ""} onChange={(event) => setFilterValue(filters, onChange, "brandId", event.target.value)}>
          <option value="">كل البراندات</option>
          {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>

        <select className={inputClass} value={filters.targetedAudience || ""} onChange={(event) => setFilterValue(filters, onChange, "targetedAudience", event.target.value)}>
          <option value="">كل الجمهور</option>
          {AUDIENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>

        <select className={inputClass} value={filters.ageGroup || ""} onChange={(event) => setFilterValue(filters, onChange, "ageGroup", event.target.value)}>
          <option value="">كل الأعمار</option>
          {AGE_GROUP_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>

        <input
          className={inputClass}
          value={filters.minPrice || ""}
          onChange={(event) => setFilterValue(filters, onChange, "minPrice", event.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="أقل سعر"
          inputMode="decimal"
        />
        <input
          className={inputClass}
          value={filters.maxPrice || ""}
          onChange={(event) => setFilterValue(filters, onChange, "maxPrice", event.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="أعلى سعر"
          inputMode="decimal"
        />

        {attributes.slice(0, compact ? 2 : 6).map((attribute) => (
          <select
            key={attribute.id}
            className={inputClass}
            value={filters.selectedOptionsByAttribute?.[attribute.id]?.[0] || ""}
            onChange={(event) => {
              const next = { ...(filters.selectedOptionsByAttribute || {}) };
              if (event.target.value) {
                next[attribute.id] = [event.target.value];
              } else {
                delete next[attribute.id];
              }
              setFilterValue(filters, onChange, "selectedOptionsByAttribute", next);
            }}
          >
            <option value="">{attribute.name}</option>
            {(attribute.options || []).map((option) => (
              <option key={option.id} value={option.id}>{option.value}</option>
            ))}
          </select>
        ))}
      </div>
    </section>
  );
}
