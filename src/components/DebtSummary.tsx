import { StatCard } from "@/components/StatCard";
import { AmountDisplay } from "@/components/AmountDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useDebtSummary } from "@/hooks/useApi";

const DebtSummary = () => {
  const { data: debtSummary, isLoading: debtSummaryLoading } = useDebtSummary();

  return (
    <div className="grid gap-4 grid-cols-2">
      {debtSummaryLoading ? (
        <>
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </>
      ) : (
        <>
          <StatCard
            label="Owed to you"
            value={
              <AmountDisplay
                amount={Number.parseFloat(
                  debtSummary?.totalLentToFriend || "0",
                )}
                showSign={false}
                size="lg"
              />
            }
            icon={<TrendingUp className="h-5 w-5" />}
            variant="positive"
          />
          <StatCard
            label="You owe"
            value={
              <AmountDisplay
                amount={
                  -Number.parseFloat(
                    debtSummary?.totalBorrowedFromFriend || "0",
                  )
                }
                showSign={false}
                size="lg"
              />
            }
            icon={<TrendingDown className="h-5 w-5" />}
            variant="negative"
          />
        </>
      )}
    </div>
  );
};

export default DebtSummary;
