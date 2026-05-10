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
