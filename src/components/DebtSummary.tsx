import { AmountDisplay } from "@/components/AmountDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { StatCard } from "@/components/StatCard";
import { FriendBalance } from "@/lib/api";

type DebtSummaryProps = {
  data: FriendBalance;
  isLoading: boolean;
};

const DebtSummary = ({ data, isLoading }: DebtSummaryProps) => {
  const isMobile = useIsMobile();

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

  const renderCard = (config: (typeof cardConfigs)[0]) => {
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
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
        <Skeleton className={`${isMobile ? "h-24" : "h-28"}`} />
        <Skeleton className={`${isMobile ? "hidden" : "h-28"}`} />
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${isMobile ? "grid-cols-1 sm:gap-6" : "grid-cols-2"}`}
    >
      {cardConfigs.map(renderCard)}
    </div>
  );
};

export default DebtSummary;
