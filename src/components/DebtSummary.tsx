import { AmountDisplay } from "@/components/AmountDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { FriendBalance } from "@/lib/api";

type DebtSummaryProps = {
  data: FriendBalance;
  isLoading: boolean;
};

// Common card configuration
const cardConfigs = [
  {
    label: "Owed to you",
    amountKey: "totalLentToFriend" as const,
    icon: <TrendingUp className="h-5 w-5" />,
    variant: "positive" as const,
    sign: 1,
  },
  {
    label: "You owe",
    amountKey: "totalBorrowedFromFriend" as const,
    icon: <TrendingDown className="h-5 w-5" />,
    variant: "negative" as const,
    sign: -1,
  },
];

const DebtSummary = ({ data, isLoading }: DebtSummaryProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Skeleton className="h-24 sm:h-28" />
        <Skeleton className="h-24 sm:h-28" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 sm:gap-6">
      {cardConfigs.map((config) => {
        const amount =
          Number.parseFloat(data?.[config.amountKey] || "0") * config.sign;

        return (
          <StatCard
            key={config.label}
            label={config.label}
            value={<AmountDisplay amount={amount} showSign={false} size="lg" />}
            icon={config.icon}
            variant={config.variant}
          />
        );
      })}
    </div>
  );
};

export default DebtSummary;
