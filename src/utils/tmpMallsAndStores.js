export function normalizeMalls(rawJson){
  const arr = rawJson?.data || [];
  return arr.filter(m => m.status ==="Open").map(m =>({
    id: String(m.mall_id),
    name: m.mall_name,
  }));
}
export function normalizeStores(rawJson){
  const arr = rawJson?.data || [];
  return arr.filter(s => s.status ==="Open").map(s =>({
    id: String(s.shop_id),
    name: s.shop_name,
    mallId: String(s.mall_id),
    logoUrl:s.logo
  }));
}

export function getMallStores(stores , mallId){
  return stores.filter(s => String(s.mallId) === String(mallId));
}

