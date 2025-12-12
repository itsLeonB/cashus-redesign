import { apiClient } from './client';
import { 
  GroupExpenseResponse, 
  NewGroupExpenseRequest,
  NewExpenseItemRequest,
  NewOtherFeeRequest,
  ExpenseItem,
  OtherFee,
  BillResponse 
} from './types';

interface UpdateExpenseItemRequest extends NewExpenseItemRequest {
  id: string;
  participants: { profileId: string; share: string }[];
}

interface UpdateOtherFeeRequest extends NewOtherFeeRequest {
  id: string;
}

export const groupExpensesApi = {
  getAll: () => 
    apiClient.get<GroupExpenseResponse[]>('/group-expenses'),
  
  getById: (expenseId: string) => 
    apiClient.get<GroupExpenseResponse>(`/group-expenses/${expenseId}`),
  
  create: (data: NewGroupExpenseRequest) => 
    apiClient.post<GroupExpenseResponse>('/group-expenses', data),
  
  addItem: (groupExpenseId: string, data: NewExpenseItemRequest) => 
    apiClient.post<ExpenseItem>(`/group-expenses/${groupExpenseId}/items`, data),
  
  updateItem: (groupExpenseId: string, itemId: string, data: UpdateExpenseItemRequest) => 
    apiClient.put<ExpenseItem>(`/group-expenses/${groupExpenseId}/items/${itemId}`, data),
  
  removeItem: (groupExpenseId: string, itemId: string) => 
    apiClient.delete(`/group-expenses/${groupExpenseId}/items/${itemId}`),
  
  addFee: (groupExpenseId: string, data: NewOtherFeeRequest) => 
    apiClient.post<OtherFee>(`/group-expenses/${groupExpenseId}/fees`, data),
  
  updateFee: (groupExpenseId: string, feeId: string, data: UpdateOtherFeeRequest) => 
    apiClient.put<OtherFee>(`/group-expenses/${groupExpenseId}/fees/${feeId}`, data),
  
  removeFee: (groupExpenseId: string, feeId: string) => 
    apiClient.delete(`/group-expenses/${groupExpenseId}/fees/${feeId}`),
  
  confirm: (groupExpenseId: string) => 
    apiClient.patch<GroupExpenseResponse>(`/group-expenses/${groupExpenseId}/confirmed`),
  
  getCalculationMethods: () => 
    apiClient.get<string[]>('/group-expenses/fee-calculation-methods'),
  
  // Bills
  uploadBill: (payerProfileId: string, file: File) => {
    const formData = new FormData();
    formData.append('payerProfileId', payerProfileId);
    formData.append('bill', file);
    return apiClient.uploadFile<BillResponse>('/group-expenses/bills', formData);
  },
  
  getBills: () => 
    apiClient.get<BillResponse[]>('/group-expenses/bills'),
  
  getBillById: (billId: string) => 
    apiClient.get<BillResponse>(`/group-expenses/bills/${billId}`),
  
  deleteBill: (billId: string) => 
    apiClient.delete(`/group-expenses/bills/${billId}`),
};
