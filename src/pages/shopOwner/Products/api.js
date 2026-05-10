import { catalogApi, normalizeCatalogPage } from "../../../api/catalog";

const PRODUCT_FORM_BRANDS_PAGE_SIZE = 100;

export const productsApi = {
	getAll: (
		storeId,
		{
			page = 0,
			size = 20,
			name = "",
			slug = "",
			categoryId = "",
			brandId = "",
			isActive = "",
			targetedAudience = "",
			ageGroup = "",
			sort = "",
		} = {}
	) => {
		const filter = {};
		if (name) filter.q = name;
		if (slug) filter.slug = slug;
		if (categoryId) filter.categoryId = Number(categoryId);
		if (brandId) filter.brandId = Number(brandId);
		if (isActive !== "") filter.isActive = isActive === true || isActive === "true";
		if (targetedAudience) filter.targetedAudience = targetedAudience;
		if (ageGroup) filter.ageGroup = ageGroup;
		return catalogApi.products.storePage(storeId, filter, { page, size, sort });
	},
	getSummary: (
		storeId,
		{
			name = "",
			slug = "",
			categoryId = "",
			brandId = "",
			isActive = "",
			targetedAudience = "",
			ageGroup = "",
		} = {}
	) => {
		const filter = {};
		if (name) filter.q = name;
		if (slug) filter.slug = slug;
		if (categoryId) filter.categoryId = Number(categoryId);
		if (brandId) filter.brandId = Number(brandId);
		if (isActive !== "") filter.isActive = isActive === true || isActive === "true";
		if (targetedAudience) filter.targetedAudience = targetedAudience;
		if (ageGroup) filter.ageGroup = ageGroup;
		return catalogApi.products.storeSummary(storeId, filter);
	},
	getById: (storeId, id) => catalogApi.products.storeById(storeId, id),
	create: (storeId, body) => catalogApi.products.create(storeId, body),
	update: (storeId, body) => catalogApi.products.update(storeId, body),
	updateVariant: (storeId, productId, body) => catalogApi.products.updateVariant(storeId, productId, body),
	deleteVariant: (storeId, productId, variantId) => catalogApi.products.deleteVariant(storeId, productId, variantId),
	delete: (storeId, id) => catalogApi.products.delete(storeId, id),
	getCategories: () => catalogApi.categories.all(),
	getBrands: async () => {
		const response = await catalogApi.brands.page({
			isActive: true,
			page: 0,
			size: PRODUCT_FORM_BRANDS_PAGE_SIZE,
		});
		return { data: normalizeCatalogPage(response).content };
	},
	getAttributes: () => catalogApi.attributes.all({ isActive: true }),
	getTags: (name) => catalogApi.tags.all(name ? { name } : {}),
	createAttribute: (body) => catalogApi.attributes.create(body),
	updateAttribute: (body) => catalogApi.attributes.update(body),
	deleteAttribute: (id) => catalogApi.attributes.delete(id),
	createTag: (body) => catalogApi.tags.create(body),
	updateTag: (body) => catalogApi.tags.update(body),
	deleteTag: (id) => catalogApi.tags.delete(id),
	createBrand: (body) => catalogApi.brands.create(body),
	updateBrand: (body) => catalogApi.brands.update(body),
	deleteBrand: (id) => catalogApi.brands.delete(id),
	createCategory: (body) => catalogApi.categories.create(body),
	updateCategory: (body) => catalogApi.categories.update(body),
	deleteCategory: (id) => catalogApi.categories.delete(id),
};
