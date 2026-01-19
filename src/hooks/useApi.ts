import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  friendshipsApi,
  debtsApi,
  groupExpensesApi,
  authApi,
  ExpenseParticipantsRequest,
  NewAnonymousFriendshipRequest,
  NewDebtTransactionRequest,
  SyncItemParticipantsRequest,
  NewExpenseItemRequest,
  NewOtherFeeRequest,
  NewProfileTransferMethod,
} from "@/lib/api";
import { profileApi } from "@/lib/api/profile";
import { profilesApi } from "@/lib/api/profiles";
import { queryKeys } from "@/lib/queryKeys";

// Profile hooks
export function useMyTransferMethods() {
  return useQuery({
    queryKey: queryKeys.transferMethods.all,
    queryFn: profileApi.getTransferMethods,
  });
}

export function useProfileTransferMethods(profileId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.transferMethods.profile(profileId),
    queryFn: () => profilesApi.getTransferMethods(profileId),
    enabled: !!profileId && enabled,
  });
}

// Friendships hooks
export function useFriendships() {
  return useQuery({
    queryKey: queryKeys.friendships.all,
    queryFn: friendshipsApi.getAll,
  });
}

export function useFriendship(friendId: string) {
  return useQuery({
    queryKey: queryKeys.friendships.detail(friendId),
    queryFn: () => friendshipsApi.getById(friendId),
    enabled: !!friendId,
  });
}

export function useCreateAnonymousFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewAnonymousFriendshipRequest) =>
      friendshipsApi.createAnonymous(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friendships.all });
    },
  });
}

export function useSearchProfiles(query: string) {
  return useQuery({
    queryKey: queryKeys.profiles.search(query),
    queryFn: () => friendshipsApi.searchProfiles(query),
    enabled: query.length >= 2,
  });
}

export function useFriendRequests() {
  const sent = useQuery({
    queryKey: queryKeys.friendRequests.sent,
    queryFn: friendshipsApi.getSentRequests,
  });

  const received = useQuery({
    queryKey: queryKeys.friendRequests.received,
    queryFn: friendshipsApi.getReceivedRequests,
  });

  return { sent, received };
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) =>
      friendshipsApi.sendFriendRequest(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.friendRequests.sent,
      });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendshipsApi.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.friendRequests.received,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.friendships.all });
    },
  });
}

export function useIgnoreFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendshipsApi.ignoreRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.friendRequests.received,
      });
    },
  });
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendshipsApi.cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.friendRequests.sent,
      });
    },
  });
}

export function useBlockFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendshipsApi.blockRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.friendRequests.received,
      });
    },
  });
}

export function useUnblockFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendshipsApi.unblockRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.friendRequests.received,
      });
    },
  });
}

// Debts hooks
export function useDebts() {
  return useQuery({
    queryKey: queryKeys.debts.all,
    queryFn: debtsApi.getAll,
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewDebtTransactionRequest) => debtsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.friendships.all });
    },
  });
}

export function useDebtSummary() {
  return useQuery({
    queryKey: queryKeys.debts.summary,
    queryFn: debtsApi.getSummary,
    staleTime: 15 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

// Group Expenses hooks
export function useGroupExpenses(
  status?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.groupExpenses.status(status),
    queryFn: () => groupExpensesApi.getAll(status),
    enabled: options?.enabled ?? true,
  });
}

export function useGroupExpense(expenseId: string) {
  return useQuery({
    queryKey: queryKeys.groupExpenses.detail(expenseId),
    queryFn: () => groupExpensesApi.getById(expenseId),
    enabled: !!expenseId,
  });
}

export function useCreateDraftExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: groupExpensesApi.createDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupExpenses.all });
    },
  });
}

export function useUploadExpenseBill(expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file }: { file: File }) =>
      groupExpensesApi.uploadBill(expenseId, file),
    onSuccess: () => {
      // Invalidate only the specific group expense query
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupExpenses.detail(expenseId),
      });
    },
  });
}

export function useTriggerBillParsing(expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (billId: string) =>
      groupExpensesApi.triggerBillParsing(expenseId, billId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupExpenses.detail(expenseId),
      });
    },
  });
}

export function useConfirmGroupExpense(expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dryRun: boolean) =>
      groupExpensesApi.confirm(expenseId, dryRun),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupExpenses.all });
    },
  });
}

export function useDeleteGroupExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => groupExpensesApi.delete(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupExpenses.all });
    },
  });
}

export function useSyncParticipants(expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExpenseParticipantsRequest) =>
      groupExpensesApi.syncParticipants(expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupExpenses.detail(expenseId),
      });
    },
  });
}

export function useSyncItemParticipants(expenseId: string, itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SyncItemParticipantsRequest) =>
      groupExpensesApi.syncItemParticipants(expenseId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupExpenses.detail(expenseId),
      });
    },
  });
}

export function useAssociateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      realProfileId,
      anonProfileId,
    }: {
      realProfileId: string;
      anonProfileId: string;
    }) => friendshipsApi.associateProfile(realProfileId, anonProfileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friendships.all });
    },
  });
}

// Auth hooks
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => authApi.updateProfile(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: Parameters<typeof authApi.resetPassword>[0]) =>
      authApi.resetPassword(data),
  });
}

export function useVerifyRegistration() {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyRegistration(token),
  });
}

export function useOAuthCallback() {
  return useMutation({
    mutationFn: ({
      provider,
      code,
      state,
    }: {
      provider: string;
      code: string;
      state: string | null;
    }) => authApi.handleOAuthCallback(provider, code, state),
  });
}

// Group Expenses: Items hooks
export function useAddExpenseItem(expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewExpenseItemRequest) =>
      groupExpensesApi.addItem(expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupExpenses.detail(expenseId),
      });
    },
  });
}

export function useUpdateExpenseItem(expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewExpenseItemRequest & { id: string }) =>
      groupExpensesApi.updateItem(data.id, {
        ...data,
        groupExpenseId: expenseId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupExpenses.detail(expenseId),
      });
    },
  });
}

export function useDeleteExpenseItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      expenseId,
      itemId,
    }: {
      expenseId: string;
      itemId: string;
    }) => groupExpensesApi.removeItem(expenseId, itemId),
    onSuccess: (_, { expenseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupExpenses.detail(expenseId),
      });
    },
  });
}

// Group Expenses: Fees hooks
export function useAddExpenseFee(expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewOtherFeeRequest) =>
      groupExpensesApi.addFee(expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupExpenses.detail(expenseId),
      });
    },
  });
}

export function useUpdateExpenseFee(expenseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewOtherFeeRequest & { id: string }) =>
      groupExpensesApi.updateFee(expenseId, data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupExpenses.detail(expenseId),
      });
    },
  });
}

export function useDeleteExpenseFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, feeId }: { expenseId: string; feeId: string }) =>
      groupExpensesApi.removeFee(expenseId, feeId),
    onSuccess: (_, { expenseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupExpenses.detail(expenseId),
      });
    },
  });
}

// Profile hooks modifications
export function useAddTransferMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewProfileTransferMethod) =>
      profileApi.addTransferMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transferMethods.all,
      });
    },
  });
}
