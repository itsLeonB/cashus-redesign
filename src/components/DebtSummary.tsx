import { Card, CardContent } from "@/components/ui/card";
import { AmountDisplay } from "@/components/AmountDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useDebtSummary } from "@/hooks/useApi";

const DebtSummary = () => {
  const { data: debtSummary, isLoading: debtSummaryLoading } = useDebtSummary();

  if (debtSummaryLoading) {
    return <Skeleton className="h-24" />;
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {/* Owed to you */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-success/10 text-success flex-shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Owed to you</p>
              <div className="text-base sm:text-xl font-semibold font-display tabular-nums whitespace-nowrap">
                <AmountDisplay
                  amount={Number.parseFloat(debtSummary?.totalLentToFriend || "0")}
                  showSign={false}
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* You owe */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-destructive/10 text-destructive flex-shrink-0">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">You owe</p>
              <div className="text-base sm:text-xl font-semibold font-display tabular-nums whitespace-nowrap">
                <AmountDisplay
                  amount={-Number.parseFloat(debtSummary?.totalBorrowedFromFriend || "0")}
                  showSign={false}
                  size="md"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebtSummary;
