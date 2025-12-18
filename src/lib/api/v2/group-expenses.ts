import { apiClientV2 } from "../client";
import { ExpenseBillResponse } from "../types";

export const statusDisplay = {
  DRAFT: "Draft",
  READY: "Ready to Confirm",
  CONFIRMED: "Confirmed",
};

export interface GroupExpense {
  id: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  status: "DRAFT" | "READY" | "CONFIRMED";
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

  uploadBill: (expenseId: string, file: File) => {
    const formData = new FormData();
    formData.append("bill", file);
    return apiClientV2.uploadFile<ExpenseBillResponse>(
      `/group-expenses/${expenseId}/bills`,
      formData
    );
  },

  retryBillParsing: (expenseId: string, billId: string) => {
    return apiClientV2.post<ExpenseBillResponse>(
      `/group-expenses/${expenseId}/bills/${billId}/retry`
    );
  },
};
