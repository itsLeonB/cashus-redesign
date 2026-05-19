import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveSubscriptionDetails, useActivePlans } from "@/hooks/useApi";
import { usePurchasePlan } from "@/hooks/useSubscription";
import { CurrentSubscriptionCard } from "@/components/CurrentSubscriptionCard";
import {
  PlanCard,
  PlanCardSkeleton,
  PlanCardsError,
} from "@/components/PlanCard";
import { useToast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";
import { subscriptionPurchaseEnabled } from "@/lib/flags";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const subscriptionQuery = useActiveSubscriptionDetails();
  const plansQuery = useActivePlans();
  const purchaseMutation = usePurchasePlan();

  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

  const currentSubscription = user?.currentSubscription;
  const subscription = subscriptionQuery.data;

  const handleSubscribe = async (planId: string, planVersionId: string) => {
    if (!subscriptionPurchaseEnabled) {
      toast({
        title: "This feature is not supported yet",
        variant: "destructive",
      });
      return;
    }

    if (purchasingPlanId) {
      toast({
        title: "Payment already in progress",
        description:
          "Please complete the current payment before starting another.",
      });
      return;
    }

    setPurchasingPlanId(planVersionId);
    try {
      const payment = await purchaseMutation.mutateAsync({
        planId,
        planVersionId,
      });
      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      } else {
        toast({
          title: "Error",
          description: "No checkout URL received. Please try again.",
          variant: "destructive",
        });
        setPurchasingPlanId(null);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to start payment. Please try again.",
        variant: "destructive",
      });
      setPurchasingPlanId(null);
    }
  };

  const plansSection = () => {
    if (plansQuery.isLoading)
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PlanCardSkeleton />
          <PlanCardSkeleton />
        </div>
      );

    if (plansQuery.isError)
      return <PlanCardsError onRetry={() => plansQuery.refetch()} />;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plansQuery.data.map((plan) => {
          const isCurrentPlan = subscription?.planVersionId === plan.id;
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={isCurrentPlan}
              isPurchasing={purchasingPlanId === plan.id}
              onSubscribe={handleSubscribe}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display flex items-center gap-3">
          <CreditCard className="h-7 w-7 text-primary" />
          Your Plan
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Section A — Current Subscription */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Current Subscription
        </h2>
        <CurrentSubscriptionCard
          subscription={subscription ?? null}
          currentSubscription={currentSubscription}
          isLoading={subscriptionQuery.isLoading}
          isError={subscriptionQuery.isError}
          onRetry={() => subscriptionQuery.refetch()}
        />
      </section>

      {/* Section B — Available Plans */}
      {subscriptionPurchaseEnabled && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Available Plans
          </h2>
          {plansSection()}
        </section>
      )}
    </div>
  );
}
