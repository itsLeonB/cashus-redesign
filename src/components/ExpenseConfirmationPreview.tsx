import { AvatarCircle } from "@/components/AvatarCircle";
import type { ExpenseConfirmationResponse } from "@/lib/api/types";

interface ExpenseConfirmationPreviewProps {
  data: ExpenseConfirmationResponse;
  formatCurrency: (amount: string | number) => string;
  showHeader?: boolean;
}

export function ExpenseConfirmationPreview({
  data,
  formatCurrency,
  showHeader = false,
}: ExpenseConfirmationPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Header Summary */}
      {showHeader && (
        <div className="space-y-1 pb-3 border-b border-border/50">
          <p className="font-semibold text-lg">{data.description || "Expense"}</p>
          <p className="text-sm text-muted-foreground">
            Total: {formatCurrency(data.totalAmount || 0)}
          </p>
          <p className="text-sm text-muted-foreground">
            Paid by {data.payer.name}
          </p>
        </div>
      )}

      {/* Per-Participant Breakdown */}
      {data.participants && data.participants.length > 0 ? (
        <div className="space-y-4">
          {data.participants.map((participant) => {
            const isPayer = participant.profile.id === data.payer.id;
            const isCurrentUser = participant.profile.isUser;

            return (
              <div
                key={participant.profile.id}
                className={`rounded-lg border p-4 space-y-3 ${
                  isCurrentUser
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/50 bg-muted/30"
                }`}
              >
                {/* Participant Header */}
                <div className="flex items-center gap-2">
                  <AvatarCircle
                    name={participant.profile.name}
                    imageUrl={participant.profile.avatar}
                    size="sm"
                  />
                  <span className="font-medium">
                    {participant.profile.name}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (You)
                      </span>
                    )}
                  </span>
                </div>

                {/* Items Breakdown */}
                {participant.items && participant.items.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Items
                    </p>
                    <div className="space-y-1 text-sm">
                      {participant.items.map((item) => {
                        const isNegative = parseFloat(item.shareAmount) < 0;
                        const isFullShare =
                          item.shareRate === "1" ||
                          item.shareRate === "100%" ||
                          item.baseAmount === item.shareAmount;

                        return (
                          <div
                            key={item.id}
                            className="flex justify-between items-start"
                          >
                            <span className="text-muted-foreground">
                              {item.name}
                            </span>
                            <span
                              className={`tabular-nums text-right ${
                                isNegative
                                  ? "text-green-600 dark:text-green-400"
                                  : ""
                              }`}
                            >
                              {isFullShare ? (
                                formatCurrency(item.shareAmount)
                              ) : (
                                <>
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(item.baseAmount)} ×{" "}
                                    {item.shareRate} ={" "}
                                  </span>
                                  {formatCurrency(item.shareAmount)}
                                </>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border/30 text-sm">
                      <span className="text-muted-foreground">
                        Items subtotal
                      </span>
                      <span className="tabular-nums font-medium">
                        {formatCurrency(participant.itemsTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Fees Breakdown */}
                {participant.fees && participant.fees.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Fees
                    </p>
                    <div className="space-y-1 text-sm">
                      {participant.fees.map((fee) => {
                        const isNegative = parseFloat(fee.shareAmount) < 0;
                        const isFullShare =
                          fee.shareRate === "1" ||
                          fee.shareRate === "100%" ||
                          fee.baseAmount === fee.shareAmount;

                        return (
                          <div
                            key={fee.id}
                            className="flex justify-between items-start"
                          >
                            <span className="text-muted-foreground">
                              {fee.name}
                            </span>
                            <span
                              className={`tabular-nums text-right ${
                                isNegative
                                  ? "text-green-600 dark:text-green-400"
                                  : ""
                              }`}
                            >
                              {isFullShare ? (
                                formatCurrency(fee.shareAmount)
                              ) : (
                                <>
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(fee.baseAmount)} ×{" "}
                                    {fee.shareRate} ={" "}
                                  </span>
                                  {formatCurrency(fee.shareAmount)}
                                </>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border/30 text-sm">
                      <span className="text-muted-foreground">
                        Fees subtotal
                      </span>
                      <span className="tabular-nums font-medium">
                        {formatCurrency(participant.feesTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Participant Total & Settlement */}
                <div className="pt-2 border-t border-border/50 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {formatCurrency(participant.total)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPayer ? (
                      <span className="text-primary font-medium">
                        Paid the bill
                      </span>
                    ) : (
                      <>
                        Owes {data.payer.name}{" "}
                        <span className="font-medium text-foreground">
                          {formatCurrency(participant.total)}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No participants found
        </p>
      )}

      {/* Final Cross-Check Summary */}
      {data.participants && data.participants.length > 0 && (
        <div className="pt-3 border-t border-border/50 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Summary
          </p>
          <div className="space-y-1 text-sm">
            {data.participants.map((p) => (
              <div key={p.profile.id} className="flex justify-between">
                <span className="text-muted-foreground">{p.profile.name}</span>
                <span className="tabular-nums">{formatCurrency(p.total)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-2 border-t border-border/50 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">
              {formatCurrency(data.totalAmount || 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
