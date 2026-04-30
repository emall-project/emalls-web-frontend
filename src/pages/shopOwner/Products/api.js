import { requestJson } from "../../../utils/http";

const BASE = "/catalog";

async function apiFetch(path, options = {}) {
	return requestJson(`${BASE}${path}`, options);
}

export const productsApi = {
	getAll: (storeId, { page = 0, size = 20, name = "", slug = "", categoryId = "", brandId = "", isActive = "" } = {}) => {
		const q = new URLSearchParams({ page, size });
		const filter = {};
		if (name) filter.q = name;
		if (slug) filter.slug = slug;
		if (categoryId) filter.categoryId = Number(categoryId);
		if (brandId) filter.brandId = Number(brandId);
		if (isActive !== "") filter.isActive = isActive === true || isActive === "true";
		return apiFetch(`/stores/${storeId}/products/all?${q.toString()}`, {
			method: "POST",
			body: JSON.stringify(filter),
		});
	},
	create: (storeId, body) => apiFetch(`/stores/${storeId}/products`, { method: "POST", body: JSON.stringify(body) }),
	update: (storeId, body) => apiFetch(`/stores/${storeId}/products`, { method: "PUT", body: JSON.stringify(body) }),
	delete: (storeId, id) => apiFetch(`/stores/${storeId}/products/${id}`, { method: "DELETE" }),
	getCategories: () => apiFetch("/categories/all"),
	getBrands: () => apiFetch("/brands/all"),
	getAttributes: () => apiFetch("/attributes/all?is-active=true"),
	getTags: (name) => apiFetch(`/tags/all${name ? `?name=${encodeURIComponent(name)}` : ""}`),
	createAttribute: (body) => apiFetch("/attributes", { method: "POST", body: JSON.stringify(body) }),
	updateAttribute: (body) => apiFetch("/attributes", { method: "PUT", body: JSON.stringify(body) }),
	deleteAttribute: (id) => apiFetch(`/attributes/${id}`, { method: "DELETE" }),
	createTag: (body) => apiFetch("/tags", { method: "POST", body: JSON.stringify(body) }),
	updateTag: (body) => apiFetch("/tags", { method: "PUT", body: JSON.stringify(body) }),
	deleteTag: (id) => apiFetch(`/tags/${id}`, { method: "DELETE" }),
	createBrand: (body) => apiFetch("/brands", { method: "POST", body: JSON.stringify(body) }),
	updateBrand: (body) => apiFetch("/brands", { method: "PUT", body: JSON.stringify(body) }),
	deleteBrand: (id) => apiFetch(`/brands/${id}`, { method: "DELETE" }),
	createCategory: (body) => apiFetch("/categories", { method: "POST", body: JSON.stringify(body) }),
	updateCategory: (body) => apiFetch("/categories", { method: "PUT", body: JSON.stringify(body) }),
	deleteCategory: (id) => apiFetch(`/categories/${id}`, { method: "DELETE" }),
};
