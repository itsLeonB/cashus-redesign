import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { friendshipsApi, debtsApi, groupExpensesApi } from "@/lib/api";
import type {
  ExpenseParticipantsRequest,
  NewAnonymousFriendshipRequest,
  NewDebtTransactionRequest,
  NewGroupExpenseRequest,
  SyncItemParticipantsRequest,
} from "@/lib/api";

// Friendships hooks
export function useFriendships() {
  return useQuery({
    queryKey: ["friendships"],
    queryFn: friendshipsApi.getAll,
  });
}

export function useFriendship(friendId: string) {
  return useQuery({
    queryKey: ["friendships", friendId],
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
      queryClient.invalidateQueries({ queryKey: ["friendships"] });
    },
  });
}

export function useSearchProfiles(query: string) {
  return useQuery({
    queryKey: ["profiles", "search", query],
    queryFn: () => friendshipsApi.searchProfiles(query),
    enabled: query.length >= 2,
  });
}

export function useFriendRequests() {
  const sent = useQuery({
    queryKey: ["friend-requests", "sent"],
    queryFn: friendshipsApi.getSentRequests,
  });

  const received = useQuery({
    queryKey: ["friend-requests", "received"],
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
      queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendshipsApi.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friendships"] });
    },
  });
}

export function useIgnoreFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendshipsApi.ignoreRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friend-requests", "received"],
      });
    },
  });
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendshipsApi.cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] });
    },
  });
}

export function useBlockFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendshipsApi.blockRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}

export function useUnblockFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendshipsApi.unblockRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (billId: string) => groupExpensesApi.deleteBill(billId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

// Debts hooks
export function useDebts() {
  return useQuery({
    queryKey: ["debts"],
    queryFn: debtsApi.getAll,
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewDebtTransactionRequest) => debtsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["friendships"] });
    },
  });
}

// Group Expenses hooks
export function useGroupExpenses() {
  return useQuery({
    queryKey: ["group-expenses"],
    queryFn: groupExpensesApi.getAll,
  });
}

export function useGroupExpense(expenseId: string) {
  return useQuery({
    queryKey: ["group-expenses", expenseId],
    queryFn: () => groupExpensesApi.getById(expenseId),
    enabled: !!expenseId,
  });
}

export function useCreateGroupExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewGroupExpenseRequest) => groupExpensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-expenses"] });
    },
  });
}

export function useConfirmGroupExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => groupExpensesApi.confirm(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-expenses"] });
    },
  });
}

export function useDeleteGroupExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => groupExpensesApi.delete(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-expenses"] });
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
        queryKey: ["group-expenses", expenseId],
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
        queryKey: ["group-expenses", expenseId],
      });
    },
  });
}

// Bills hooks
export function useBills() {
  return useQuery({
    queryKey: ["bills"],
    queryFn: groupExpensesApi.getBills,
  });
}

export function useUploadBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payerProfileId,
      file,
    }: {
      payerProfileId: string;
      file: File;
    }) => groupExpensesApi.uploadBill(payerProfileId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}
