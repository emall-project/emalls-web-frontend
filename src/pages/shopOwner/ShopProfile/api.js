import { accountsApi } from "../../../api/accounts";

export const shopProfileApi = {
  get: accountsApi.shops.byId,
  update: accountsApi.shops.update,
  requestStatusChange: (storeId, status) =>
    accountsApi.shops.update({
      shopId: storeId,
      status,
    }),
  requestMaintenance: accountsApi.shops.setMaintenance,
  clearAdminOverride: accountsApi.shops.unblock,
};
