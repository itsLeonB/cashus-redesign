import { useMutation, useQueryClient } from "@tanstack/react-query";
import { planApi } from "@/lib/api/plan";
import { queryKeys } from "@/lib/queryKeys";

export function usePurchasePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      planVersionId,
    }: {
      planId: string;
      planVersionId: string;
    }) => planApi.purchasePlan(planId, planVersionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.subscription,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current });
    },
  });
}
