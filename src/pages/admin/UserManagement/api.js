import { accountsApi } from "../../../api/accounts";

export const usersApi = {
  getAll: accountsApi.users.page,
  getById: accountsApi.users.byId,
  create: accountsApi.users.create,
  update: accountsApi.users.update,
  activate: accountsApi.users.activate,
  deactivate: accountsApi.users.deactivate,
};
