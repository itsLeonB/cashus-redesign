import { sortByCreatedAtAsc } from "../utils";
import { apiClient } from "./client";
import {
  GroupExpenseResponse,
  NewExpenseItemRequest,
  NewOtherFeeRequest,
  ExpenseItem,
  OtherFee,
  ExpenseBillResponse,
  FeeCalculationMethodInfo,
  ExpenseParticipantsRequest,
  UpdateExpenseItemRequest,
  UpdateOtherFeeRequest,
  SyncItemParticipantsRequest,
  ExpenseConfirmationResponse,
} from "./types";

export const groupExpensesApi = {
  getAll: (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return apiClient.get<GroupExpenseResponse[]>(`/group-expenses${query}`);
  },

  getById: async (expenseId: string) => {
    const data = await apiClient.get<GroupExpenseResponse>(
      `/group-expenses/${expenseId}`
    );
    return {
      ...data,
      items: sortByCreatedAtAsc(data.items),
    };
  },

  createDraft(description: string) {
    return apiClient.post<GroupExpenseResponse>("/group-expenses", {
      description,
    });
  },

  uploadBill: (expenseId: string, file: File) => {
    const formData = new FormData();
    formData.append("bill", file);
    return apiClient.uploadFile<ExpenseBillResponse>(
      `/group-expenses/${expenseId}/bills`,
      formData
    );
  },

  triggerBillParsing: (expenseId: string, billId: string) =>
    apiClient.put(`/group-expenses/${expenseId}/bills/${billId}`, null),

  delete: (expenseId: string) =>
    apiClient.delete(`/group-expenses/${expenseId}`),

  addItem: (groupExpenseId: string, data: NewExpenseItemRequest) =>
    apiClient.post<ExpenseItem>(
      `/group-expenses/${groupExpenseId}/items`,
      data
    ),

  updateItem: (itemId: string, data: UpdateExpenseItemRequest) =>
    apiClient.put<ExpenseItem>(
      `/group-expenses/${data.groupExpenseId}/items/${itemId}`,
      data
    ),

  removeItem: (groupExpenseId: string, itemId: string) =>
    apiClient.delete(`/group-expenses/${groupExpenseId}/items/${itemId}`),

  syncItemParticipants: (
    expenseId: string,
    itemId: string,
    data: SyncItemParticipantsRequest
  ) =>
    apiClient.put(
      `/group-expenses/${expenseId}/items/${itemId}/participants`,
      data
    ),

  addFee: (groupExpenseId: string, data: NewOtherFeeRequest) =>
    apiClient.post<OtherFee>(`/group-expenses/${groupExpenseId}/fees`, data),

  updateFee: (
    groupExpenseId: string,
    feeId: string,
    data: UpdateOtherFeeRequest
  ) =>
    apiClient.put<OtherFee>(
      `/group-expenses/${groupExpenseId}/fees/${feeId}`,
      data
    ),

  removeFee: (groupExpenseId: string, feeId: string) =>
    apiClient.delete(`/group-expenses/${groupExpenseId}/fees/${feeId}`),

  confirm: (groupExpenseId: string, dryRun: boolean) => {
    const query = dryRun ? "?dry-run=true" : "";
    return apiClient.patch<ExpenseConfirmationResponse>(
      `/group-expenses/${groupExpenseId}/confirmed${query}`
    );
  },

  getCalculationMethods: () =>
    apiClient.get<FeeCalculationMethodInfo[]>(
      "/group-expenses/fee-calculation-methods"
    ),

  syncParticipants: (expenseId: string, data: ExpenseParticipantsRequest) =>
    apiClient.put(`/group-expenses/${expenseId}/participants`, data),
};
