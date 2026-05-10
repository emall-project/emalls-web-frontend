import { useEffect, useMemo, useState } from "react";
import { FiFilter, FiX } from "react-icons/fi";
import { catalogApi, unwrapCatalogPayload } from "../../api/catalog";
import { AGE_GROUP_OPTIONS, AUDIENCE_OPTIONS } from "../../pages/shopOwner/Products/constants";
import { buildCatalogFilterPayload, hasCatalogFilters } from "../../utils/catalogFilters";

const inputClass = "w-full border border-black/10 bg-white px-3 py-2 text-sm outline-none";

function setFilterValue(filters, onChange, key, value) {
  onChange({ ...filters, [key]: value });
}

function formatPriceHint(value) {
  if (!Number.isFinite(Number(value))) return "";
  const number = Number(value);
  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/\.?0+$/, "");
}

function mergeSelectedEntity(items, selectedId, cache, fallbackLabelPrefix) {
  if (!selectedId || items.some((item) => String(item.id) === String(selectedId))) {
    return items;
  }

  return [
    ...items,
    {
      id: selectedId,
      name: cache.get(String(selectedId)) || `${fallbackLabelPrefix} #${selectedId}`,
      totalProduct: 0,
    },
  ];
}

function mergeSelectedAttributeOptions(attribute, selectedOptionIds, cache) {
  const selectedIds = (selectedOptionIds || []).map(String).filter(Boolean);
  if (!selectedIds.length) return attribute;

  const existingIds = new Set((attribute.options || []).map((option) => String(option.id)));
  const preservedOptions = selectedIds
    .filter((optionId) => !existingIds.has(optionId))
    .map((optionId) => {
      const cachedOption = cache.get(optionId);
      return cachedOption
        ? { id: cachedOption.id, value: cachedOption.value, totalProducts: 0 }
        : { id: optionId, value: `الخيار #${optionId}`, totalProducts: 0 };
    });

  return preservedOptions.length
    ? { ...attribute, options: [...(attribute.options || []), ...preservedOptions] }
    : attribute;
}

export default function CatalogFilters({
  filters,
  onChange,
  compact = false,
  hiddenFields = [],
  summaryScope = "public",
  summaryStoreId = null,
  fixedSummaryFilter = {},
  summaryEnabled = true,
}) {
  const [summary, setSummary] = useState(null);
  const [labelCache, setLabelCache] = useState({
    categories: {},
    brands: {},
    attributes: {},
    attributeOptions: {},
  });
  const hidden = useMemo(() => new Set(hiddenFields), [hiddenFields]);
  const userFilterPayload = useMemo(() => buildCatalogFilterPayload(filters), [filters]);
  const summaryFilter = useMemo(
    () => ({ ...userFilterPayload, ...(fixedSummaryFilter || {}) }),
    [fixedSummaryFilter, userFilterPayload]
  );
  const summaryRequestKey = JSON.stringify(summaryFilter);

  useEffect(() => {
    let cancelled = false;

    if (!summaryEnabled || (summaryScope === "store" && !summaryStoreId)) {
      return () => {
        cancelled = true;
      };
    }

    const request =
      summaryScope === "store"
        ? catalogApi.products.storeSummary(summaryStoreId, summaryFilter)
        : catalogApi.products.publicSummary(summaryFilter);

    request
      .then((response) => {
        if (cancelled) return;

        const nextSummary = unwrapCatalogPayload(response) || {};
        setLabelCache((current) => {
          const next = {
            categories: { ...current.categories },
            brands: { ...current.brands },
            attributes: { ...current.attributes },
            attributeOptions: { ...current.attributeOptions },
          };

          (nextSummary.categories || []).forEach((category) => {
            next.categories[String(category.id)] = category.name || `فئة #${category.id}`;
          });

          (nextSummary.brands || []).forEach((brand) => {
            next.brands[String(brand.id)] = brand.name || `براند #${brand.id}`;
          });

          (nextSummary.attributeSummary || []).forEach((attribute) => {
            const attributeId = String(attribute.id);
            next.attributes[attributeId] = attribute.name || `خاصية #${attribute.id}`;
            const optionCache = { ...(next.attributeOptions[attributeId] || {}) };
            (attribute.options || []).forEach((option) => {
              optionCache[String(option.id)] = {
                id: option.id,
                value: option.value || `الخيار #${option.id}`,
              };
            });
            next.attributeOptions[attributeId] = optionCache;
          });

          return next;
        });

        setSummary(nextSummary);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [summaryEnabled, summaryRequestKey, summaryScope, summaryStoreId, summaryFilter]);

  const activeSummary = summaryEnabled ? summary : null;

  const categories = useMemo(
    () =>
      mergeSelectedEntity(
        (activeSummary?.categories || []).map((category) => ({
          id: category.id,
          name: category.name,
          totalProduct: category.totalProduct ?? 0,
        })),
        filters.categoryId,
        new Map(Object.entries(labelCache.categories)),
        "فئة"
      ),
    [activeSummary?.categories, filters.categoryId, labelCache.categories]
  );

  const brands = useMemo(
    () =>
      mergeSelectedEntity(
        (activeSummary?.brands || []).map((brand) => ({
          id: brand.id,
          name: brand.name,
          totalProduct: brand.totalProduct ?? 0,
        })),
        filters.brandId,
        new Map(Object.entries(labelCache.brands)),
        "براند"
      ),
    [activeSummary?.brands, filters.brandId, labelCache.brands]
  );

  const attributeOptions = useMemo(() => {
    const selectedByAttribute = filters.selectedOptionsByAttribute || {};
    const baseAttributes = (activeSummary?.attributeSummary || []).map((attribute) =>
      mergeSelectedAttributeOptions(
        {
          id: attribute.id,
          name: attribute.name,
          options: attribute.options || [],
        },
        selectedByAttribute[attribute.id],
        new Map(
          Object.entries(labelCache.attributeOptions[String(attribute.id)] || {})
        )
      )
    );

    const attributesById = new Map(baseAttributes.map((attribute) => [String(attribute.id), attribute]));

    Object.entries(selectedByAttribute).forEach(([attributeId, selectedOptionIds]) => {
      if (attributesById.has(String(attributeId))) return;

      const optionCache = labelCache.attributeOptions[String(attributeId)] || {};
      attributesById.set(String(attributeId), {
        id: attributeId,
        name: labelCache.attributes[String(attributeId)] || `خاصية #${attributeId}`,
        options: (selectedOptionIds || []).map((optionId) => {
          const cachedOption = optionCache[String(optionId)];
          return cachedOption
            ? { id: cachedOption.id, value: cachedOption.value, totalProducts: 0 }
            : { id: optionId, value: `الخيار #${optionId}`, totalProducts: 0 };
        }),
      });
    });

    const orderedAttributes = Array.from(attributesById.values());
    const visibleLimit = compact ? 2 : 6;
    const visibleAttributes = orderedAttributes.slice(0, visibleLimit);
    const visibleIds = new Set(visibleAttributes.map((attribute) => String(attribute.id)));

    Object.keys(selectedByAttribute).forEach((attributeId) => {
      if (!visibleIds.has(String(attributeId)) && attributesById.has(String(attributeId))) {
        visibleAttributes.push(attributesById.get(String(attributeId)));
      }
    });

    return visibleAttributes;
  }, [activeSummary?.attributeSummary, compact, filters.selectedOptionsByAttribute, labelCache.attributeOptions, labelCache.attributes]);

  const audienceCounts = activeSummary?.audienceDistribution || {};
  const audienceOptions = useMemo(() => {
    const countsByAudience = {
      MALE: audienceCounts.productForMales ?? 0,
      FEMALE: audienceCounts.productForFemales ?? 0,
      ALL: audienceCounts.productForAll ?? 0,
    };

    return AUDIENCE_OPTIONS.filter(
      (option) => (countsByAudience[option.value] ?? 0) > 0 || filters.targetedAudience === option.value
    );
  }, [audienceCounts.productForAll, audienceCounts.productForFemales, audienceCounts.productForMales, filters.targetedAudience]);

  const ageCounts = activeSummary?.ageDisTribution || {};
  const ageOptions = useMemo(() => {
    const countsByAge = {
      NEWBORN: ageCounts.productSForNewborn ?? 0,
      INFANT: ageCounts.productSForInfant ?? 0,
      TODDLER: ageCounts.productSForToddler ?? 0,
      CHILD: ageCounts.productSForChild ?? 0,
      TEENAGER: ageCounts.productSForTeenager ?? 0,
      YOUTH: ageCounts.productSForYouth ?? 0,
      ADULT: ageCounts.productSForAdult ?? 0,
      ALL: ageCounts.productSForAll ?? 0,
    };

    return AGE_GROUP_OPTIONS.filter(
      (option) => (countsByAge[option.value] ?? 0) > 0 || filters.ageGroup === option.value
    );
  }, [
    ageCounts.productSForAdult,
    ageCounts.productSForAll,
    ageCounts.productSForChild,
    ageCounts.productSForInfant,
    ageCounts.productSForNewborn,
    ageCounts.productSForTeenager,
    ageCounts.productSForToddler,
    ageCounts.productSForYouth,
    filters.ageGroup,
  ]);

  const minPricePlaceholder = activeSummary?.priceRange?.minPrice != null
    ? `أقل سعر (من ${formatPriceHint(activeSummary.priceRange.minPrice)})`
    : "أقل سعر";
  const maxPricePlaceholder = activeSummary?.priceRange?.maxPrice != null
    ? `أعلى سعر (حتى ${formatPriceHint(activeSummary.priceRange.maxPrice)})`
    : "أعلى سعر";

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
        {!hidden.has("categoryId") ? (
          <select className={inputClass} value={filters.categoryId || ""} onChange={(event) => setFilterValue(filters, onChange, "categoryId", event.target.value)}>
            <option value="">كل الفئات</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        ) : null}

        {!hidden.has("brandId") ? (
          <select className={inputClass} value={filters.brandId || ""} onChange={(event) => setFilterValue(filters, onChange, "brandId", event.target.value)}>
            <option value="">كل البراندات</option>
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
        ) : null}

        <select className={inputClass} value={filters.targetedAudience || ""} onChange={(event) => setFilterValue(filters, onChange, "targetedAudience", event.target.value)}>
          <option value="">كل الجمهور</option>
          {audienceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>

        <select className={inputClass} value={filters.ageGroup || ""} onChange={(event) => setFilterValue(filters, onChange, "ageGroup", event.target.value)}>
          <option value="">كل الأعمار</option>
          {ageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>

        <input
          className={inputClass}
          value={filters.minPrice || ""}
          onChange={(event) => setFilterValue(filters, onChange, "minPrice", event.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={minPricePlaceholder}
          inputMode="decimal"
        />
        <input
          className={inputClass}
          value={filters.maxPrice || ""}
          onChange={(event) => setFilterValue(filters, onChange, "maxPrice", event.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={maxPricePlaceholder}
          inputMode="decimal"
        />

        {attributeOptions.map((attribute) => (
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
