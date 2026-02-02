
export function normalizeMalls(raw) {
  const list = Array.isArray(raw) ? raw : [raw];

  return list
    .filter((m) => String(m?.status || "").toUpperCase() === "ACTIVE") 
    .map((m) => ({
      id: String(m.mallId),
      name: m.name,
      location: m.location,
      logoUrl: m.logoUrl,
      images: Array.isArray(m.images) ? m.images : [],
      services: m.services || {},
      description: m.description || "",
      status: m.status || "",
    }));
}


export function normalizeStores(rawJson){
  const arr = rawJson?.data || [];
  return arr.map(s =>({
    id: String(s.shop_id),
    name: s.shop_name,
    mallId: String(s.mall_id),
    logoUrl:s.logo,
    floor:1,
    specialist:s.specialist,
    image:s.image
  }));
}

export function getMallStores(stores , mallId){
  return stores.filter(s => String(s.mallId) === String(mallId));
}

export function getMallById(mallId , mallsData){
  return (mallsData.find((m) => String(mallId) == String(m.id))) || null 
}