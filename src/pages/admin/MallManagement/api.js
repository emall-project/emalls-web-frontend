import { accountsApi } from "../../../api/accounts";

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
  getAll: accountsApi.cities.all,
  create: accountsApi.cities.create,
  update: accountsApi.cities.update,
  activate: accountsApi.cities.activate,
  deactivate: accountsApi.cities.deactivate,
};
