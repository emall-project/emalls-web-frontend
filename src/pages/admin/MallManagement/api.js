import { accountsApi, normalizePage } from "../../../api/accounts";

async function pageAsList(fetchPage, params = {}) {
  const response = await fetchPage({ page: 0, size: 100, ...params });
  const content = normalizePage(response).content;
  return { data: content, content };
}

export const mallsApi = {
  getAll: accountsApi.malls.page,
  getById: accountsApi.malls.byId,
  create: accountsApi.malls.create,
  update: accountsApi.malls.update,
  delete: accountsApi.malls.delete,
  activate: accountsApi.malls.activate,
  deactivate: accountsApi.malls.deactivate,
  changeStatus: accountsApi.malls.changeStatus,
  maintenance: accountsApi.malls.maintenance,
};

export const citiesApi = {
  getActive: accountsApi.cities.active,
  getAll: (params = {}) => pageAsList(accountsApi.cities.page, params),
  create: accountsApi.cities.create,
  update: accountsApi.cities.update,
  activate: accountsApi.cities.activate,
  deactivate: accountsApi.cities.deactivate,
};
