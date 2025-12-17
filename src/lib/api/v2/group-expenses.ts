import { apiClientV2 } from "../client";

export interface GroupExpense {
  id: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  status: "DRAFT" | "PROCESSING_BILL" | "READY" | "CONFIRMED";
  totalAmount: string;
  itemsTotalAmount: string;
  feesTotalAmount: string;
  payer: Participant;
  creator: Participant;
}

export interface Participant {
  profileId: string;
  name: string;
  avatar: string;
  isUser: boolean;
}

export const groupExpensesApi = {
  createDraft(description: string) {
    return apiClientV2.post<GroupExpense>("/group-expenses", {
      description,
    });
  },
};
