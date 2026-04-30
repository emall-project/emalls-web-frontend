import { accountsApi } from "../../../api/accounts";

export const shopsApi = {
  getAll: accountsApi.shops.page,
  getList: accountsApi.shops.all,
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
  getList: accountsApi.malls.all,
};

export const usersApi = {
  getAll: accountsApi.users.page,
  getList: accountsApi.users.all,
};
