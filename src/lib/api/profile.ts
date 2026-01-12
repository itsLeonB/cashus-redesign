import { apiClient } from "./client";
import { NewProfileTransferMethod } from "./types";

export const profileApi = {
  addTransferMethod: (data: NewProfileTransferMethod) =>
    apiClient.post("/profile/transfer-methods", data),
};
