import { apiClient } from "./client";

export const subscriptionApi = {
  getPortalUrl: () =>
    apiClient.post<{ portalUrl: string }>("/subscriptions/portal"),
};
