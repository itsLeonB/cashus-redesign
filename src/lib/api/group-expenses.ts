import { sortByCreatedAtAsc } from "../utils";
import { apiClient } from "./client";
import {
  GroupExpenseResponse,
  NewGroupExpenseRequest,
  NewExpenseItemRequest,
  NewOtherFeeRequest,
  ExpenseItem,
  OtherFee,
  ExpenseBillResponse,
  FeeCalculationMethodInfo,
  ExpenseParticipantsRequest,
  UpdateExpenseItemRequest,
  UpdateOtherFeeRequest,
} from "./types";

export const groupExpensesApi = {
  getAll: () => apiClient.get<GroupExpenseResponse[]>("/group-expenses"),

  getById: async (expenseId: string) => {
    const data = await apiClient.get<GroupExpenseResponse>(
      `/group-expenses/${expenseId}`
    );
    return {
      ...data,
      items: sortByCreatedAtAsc(data.items),
    };
  },

  create: (data: NewGroupExpenseRequest) =>
    apiClient.post<GroupExpenseResponse>("/group-expenses", data),

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
    data: ExpenseParticipantsRequest
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

  confirm: (groupExpenseId: string) =>
    apiClient.patch<GroupExpenseResponse>(
      `/group-expenses/${groupExpenseId}/confirmed`
    ),

  getCalculationMethods: () =>
    apiClient.get<FeeCalculationMethodInfo[]>(
      "/group-expenses/fee-calculation-methods"
    ),

  syncParticipants: (expenseId: string, data: ExpenseParticipantsRequest) =>
    apiClient.put(`/group-expenses/${expenseId}/participants`, data),

  // Bills
  uploadBill: (payerProfileId: string, file: File) => {
    const formData = new FormData();
    formData.append("payerProfileId", payerProfileId);
    formData.append("bill", file);
    return apiClient.uploadFile<ExpenseBillResponse>(
      "/group-expenses/bills",
      formData
    );
  },

  getBills: () => apiClient.get<ExpenseBillResponse[]>("/group-expenses/bills"),

  getBillById: (billId: string) =>
    apiClient.get<ExpenseBillResponse>(`/group-expenses/bills/${billId}`),

  deleteBill: (billId: string) =>
    apiClient.delete(`/group-expenses/bills/${billId}`),
};
