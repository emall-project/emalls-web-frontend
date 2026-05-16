function includesQuery(values, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return true;

  return values.some((value) =>
    String(value || "").toLowerCase().includes(normalizedQuery)
  );
}

export function filterMallSearchResults(malls = [], query, scopedMallId = null) {
  const scoped = scopedMallId
    ? malls.filter((mall) => String(mall.id) === String(scopedMallId))
    : malls;

  return scoped.filter((mall) =>
    includesQuery([mall.name, mall.location, mall.city], query)
  );
}

export function filterStoreSearchResults(stores = [], query, scopedMallId = null) {
  const scoped = scopedMallId
    ? stores.filter((store) => String(store.mallId) === String(scopedMallId))
    : stores;

  return scoped.filter((store) =>
    includesQuery(
      [store.name, store.location, store.mallName, store.categoryLabel, store.category],
      query
    )
  );
}

export function toMallSearchItem(mall) {
  return {
    type: "mall",
    id: mall.id,
    title: mall.name,
    subtitle: mall.location || mall.city || "",
    imageUrl: mall.logoUrl || "",
    href: `/malls/${mall.id}`,
  };
}

export function toStoreSearchItem(store) {
  return {
    type: "store",
    id: store.id,
    title: store.name,
    subtitle: store.mallName ? `في ${store.mallName}` : store.location || "",
    imageUrl: store.logoUrl || store.image || "",
    href: `/stores/${store.id}`,
  };
}

export function toProductSearchItem(product) {
  return {
    type: "product",
    id: product.id,
    title: product.name,
    subtitle: product.shortDescription,
    imageUrl: product.imageUrl,
    href: `/products/${product.id}`,
    price: product.price,
    oldPrice: product.oldPrice,
  };
}
