import { apiClient } from "./client";
import { NewProfileTransferMethod, ProfileTransferMethod } from "./types";

export const profileApi = {
  addTransferMethod: (data: NewProfileTransferMethod) =>
    apiClient.post("/profile/transfer-methods", data),

  getTransferMethods: () =>
    apiClient.get<ProfileTransferMethod[]>("/profile/transfer-methods"),
};
