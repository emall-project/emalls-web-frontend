import { accountsApi, normalizePage } from "../../../api/accounts";

async function pageAsList(fetchPage, params = {}) {
  const response = await fetchPage({ page: 0, size: 100, ...params });
  const content = normalizePage(response).content;
  return { data: content, content };
}

export const shopsApi = {
  getAll: accountsApi.shops.page,
  getList: (params = {}) => pageAsList(accountsApi.shops.page, params),
  getById: accountsApi.shops.byId,
  create: accountsApi.shops.create,
  update: accountsApi.shops.update,
  delete: accountsApi.shops.delete,
  setMaintenance: accountsApi.shops.setMaintenance,
  block: accountsApi.shops.block,
  unblock: accountsApi.shops.unblock,
  changeAdminStatus: (id, adminStatus) => {
    if (adminStatus === "MAINTENANCE") return accountsApi.shops.setMaintenance(id);
    if (adminStatus === "BLOCKED") return accountsApi.shops.block(id);
    return accountsApi.shops.unblock(id);
  },
};

export const mallsApi = {
  getList: (params = {}) => pageAsList(accountsApi.malls.page, params),
};

export const usersApi = {
  getAll: accountsApi.users.page,
  getList: (params = {}) => pageAsList(accountsApi.users.page, params),
};
