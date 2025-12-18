import { groupExpensesApi } from "@/lib/api/v2/group-expenses";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateDraftExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: groupExpensesApi.createDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-expenses"] });
    },
  });
}

export function useUploadExpenseBill() {
  return useMutation({
    mutationFn: ({ expenseId, file }: { expenseId: string; file: File }) =>
      groupExpensesApi.uploadBill(expenseId, file),
  });
}
