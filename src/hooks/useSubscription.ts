import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { planApi } from "@/lib/api/plan";
import { subscriptionApi } from "@/lib/api/subscription";
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

export function useManageSubscription() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      try {
        const { portalUrl } = await subscriptionApi.getPortalUrl();
        if (!portalUrl) {
          throw new Error("Missing portal URL");
        }
        const parsed = new URL(portalUrl, globalThis.location.origin);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("Invalid portal URL protocol");
        }
        globalThis.location.href = parsed.toString();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to open subscription portal. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
  });
}
