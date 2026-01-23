export function normalizeCategories(rawJson){
  const arr = rawJson?.data || [];
  return arr.map((c)=>({
    id: String(c._id),
    name: c.name,
    description: c.description,
    parentId: c.parentId === null ? null : String(c.parentId),
    imageUrl : c.image_url || null
  }));
}

export function getParentCategories(categories){
  return categories.filter((c) => c.parentId === null);
}

export function getChildrenMap(categories){
  const map = new Map();
  for(const c of categories){
    if(c.parentId === null) continue;
    if(!map.has(c.parentId)) map.set(c.parentId , []);
    map.get(c.parentId).push(c);
  }
  return map;
}