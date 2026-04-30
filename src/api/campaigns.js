import { requestJson } from "../utils/http";

const CAMPAIGNS_BASE = "/campaigns";

function unwrap(payload) {
  return payload?.data ?? payload ?? null;
}

export function unwrapCampaignPayload(payload) {
  return unwrap(payload);
}

export const campaignsApi = {
  ads: {
    displayed: () => requestJson(`${CAMPAIGNS_BASE}/api/ad-requests/active/displayed`),
  },
};
