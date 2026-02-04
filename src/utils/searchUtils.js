import { normalizeMalls, normalizeStores } from "./tmpMallsAndStores";
import { normalizeProducts } from "./tmpProducts";

export function buildSearchIndex({ rawMalls, rawStores, rawProducts }) {
  const malls = normalizeMalls(rawMalls);
  const stores = normalizeStores(rawStores);
  const products = normalizeProducts(rawProducts);

  const mallById = new Map(malls.map((m) => [String(m.id), m]));
  const storeById = new Map(stores.map((s) => [String(s.id), s]));

  // ✅ malls items (صح)
  const mallItems = malls.map((m) => ({
    type: "mall",
    id: String(m.id),
    title: m.name,
    subtitle: m.location || m.city || "",
    imageUrl: m.logoUrl || "",
    href: `/mall/${m.id}`,
    keywords: `${m.name} ${m.location || ""} ${m.city || ""}`.toLowerCase(),
  }));

  // ✅ stores items
  const storeItems = stores.map((s) => {
    const mall = mallById.get(String(s.mallId));
    return {
      type: "store",
      id: String(s.id),
      title: s.name,
      subtitle: mall?.name ? `في ${mall.name}` : "",
      imageUrl: s.logoUrl || "",
      href: `/store/${s.id}`, // عدليها حسب الروت
      keywords: `${s.name} ${mall?.name || ""}`.toLowerCase(),
    };
  });

  // ✅ products items
  const productItems = products.map((p) => {
    const mall = mallById.get(String(p.mallId));
    const store = storeById.get(String(p.storeId)); // ✅ هنا كان الخطأ

    const mallName = mall?.name || "";
    const storeName = store?.name || "";

    return {
      type: "product",
      id: String(p.id),
      title: p.name,
      subtitle: `${storeName}${storeName && mallName ? " • " : ""}${mallName}`,
      imageUrl: p.imageUrl || "",
      href: `/product/${p.id}`, // عدليها حسب الروت
      keywords: `${p.name} ${storeName} ${mallName}`.toLowerCase(),
      price: p.price,
      oldPrice: p.oldPrice,
    };
  });

  return [...mallItems, ...storeItems, ...productItems];
}

function normalizeQuery(q) {
  return (q || "").trim().toLowerCase();
}

export function searchInIndex(query, searchIndex, { limit = 12 } = {}) {
  const q = normalizeQuery(query);
  if (!q || q.length < 2) {
    return { malls: [], stores: [], products: [], all: [] };
  }

  const scored = (searchIndex || [])
    .map((item) => {
      const title = (item.title || "").toLowerCase();
      const keywords = (item.keywords || "").toLowerCase();

      let score = 0;
      if (title.startsWith(q)) score += 100;
      if (title.includes(q)) score += 60;
      if (keywords.includes(q)) score += 30;

      if (score === 0) return null;
      return { ...item, _score: score };
    })
    .filter(Boolean)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  return {
    malls: scored.filter((x) => x.type === "mall"),
    stores: scored.filter((x) => x.type === "store"),
    products: scored.filter((x) => x.type === "product"),
    all: scored,
  };
}
