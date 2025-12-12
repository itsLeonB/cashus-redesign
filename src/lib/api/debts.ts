import { apiClient } from './client';
import { DebtTransactionResponse, NewDebtTransactionRequest, TransferMethod } from './types';

export const debtsApi = {
  getAll: () => 
    apiClient.get<DebtTransactionResponse[]>('/debts'),
  
  create: (data: NewDebtTransactionRequest) => 
    apiClient.post<DebtTransactionResponse>('/debts', data),
  
  getTransferMethods: () => 
    apiClient.get<TransferMethod[]>('/transfer-methods'),
};
