const BASE = "/catalog";
export const SHOP_ID = 1; // hardcoded until login is ready

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.message || "خطأ في الطلب");
    err.errorCodes = json?.errorCodes || [];
    throw err;
  }
  return json;
}

export const productsApi = {
  getAll: ({ page = 0, size = 20, name = "", slug = "", categoryId = "", brandId = "", isActive = "" } = {}) => {
    const q = new URLSearchParams({ page, size, storeId: SHOP_ID });
    if (name)       q.set("name",        name);
    if (slug)       q.set("slug",        slug);
    if (categoryId) q.set("category-id", categoryId);
    if (brandId)    q.set("brand-id",    brandId);
    if (isActive !== "") q.set("is-active", isActive);
    return apiFetch(`/products?${q}`);
  },
  create:        (body) => apiFetch("/products",        { method: "POST",   body: JSON.stringify(body) }),
  update:        (body) => apiFetch("/products",        { method: "PUT",    body: JSON.stringify(body) }),
  delete:        (id)   => apiFetch(`/products/${id}`,  { method: "DELETE" }),
  getCategories:   ()     => apiFetch("/categories/all"),
  getBrands:       ()     => apiFetch("/brands/all"),
  getAttributes:   ()     => apiFetch("/attributes/all?is-active=true"),
  getTags:         (name) => apiFetch(`/tags/all${name ? `?name=${encodeURIComponent(name)}` : ""}`),
  createAttribute: (body) => apiFetch("/attributes",     { method: "POST", body: JSON.stringify(body) }),
  updateAttribute: (body) => apiFetch("/attributes",     { method: "PUT",  body: JSON.stringify(body) }),
  deleteAttribute: (id)   => apiFetch(`/attributes/${id}`, { method: "DELETE" }),
  createTag:       (body) => apiFetch("/tags",            { method: "POST", body: JSON.stringify(body) }),
  updateTag:       (body) => apiFetch("/tags",            { method: "PUT",  body: JSON.stringify(body) }),
  deleteTag:       (id)   => apiFetch(`/tags/${id}`,      { method: "DELETE" }),
  createBrand:      (body) => apiFetch("/brands",           { method: "POST", body: JSON.stringify(body) }),
  updateBrand:      (body) => apiFetch("/brands",           { method: "PUT",  body: JSON.stringify(body) }),
  deleteBrand:      (id)   => apiFetch(`/brands/${id}`,    { method: "DELETE" }),
  createCategory:   (body) => apiFetch("/categories",       { method: "POST", body: JSON.stringify(body) }),
  updateCategory:   (body) => apiFetch("/categories",       { method: "PUT",  body: JSON.stringify(body) }),
  deleteCategory:   (id)   => apiFetch(`/categories/${id}`, { method: "DELETE" }),
};
