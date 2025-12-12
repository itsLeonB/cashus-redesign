import { cn } from "@/lib/utils";

interface AmountDisplayProps {
  amount: number;
  className?: string;
  showSign?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function AmountDisplay({ 
  amount, 
  className, 
  showSign = true,
  showLabel = false,
  size = "md" 
}: AmountDisplayProps) {
  const isPositive = amount > 0;
  const isZero = amount === 0;
  
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-3xl font-display",
  };

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));

  const label = isZero ? "Settled up" : isPositive ? "They owe you" : "You owe";

  return (
    <div className={cn("flex flex-col", showLabel && "items-end")}>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
      <span
        className={cn(
          "tabular-nums font-semibold",
          sizes[size],
          isZero && "text-muted-foreground",
          isPositive && !isZero && "text-success",
          !isPositive && !isZero && "text-destructive",
          className
        )}
      >
        {showSign && !isZero && (isPositive ? "+" : "-")}
        {formattedAmount}
      </span>
    </div>
  );
}
