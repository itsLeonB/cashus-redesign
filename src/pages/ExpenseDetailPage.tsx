import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useGroupExpense, useFriendships, useConfirmGroupExpense } from "@/hooks/useApi";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Receipt,
  Calendar,
  Users,
  CheckCircle2,
  Loader2,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { groupExpensesApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function ExpenseDetailPage() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const { data: expense, isLoading } = useGroupExpense(expenseId || "");
  const { data: friendships } = useFriendships();
  const confirmExpense = useConfirmGroupExpense();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, string[]>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const handleParticipantToggle = (itemId: string, profileId: string) => {
    setSelectedParticipants(prev => {
      const current = prev[itemId] || [];
      if (current.includes(profileId)) {
        return { ...prev, [itemId]: current.filter(id => id !== profileId) };
      }
      return { ...prev, [itemId]: [...current, profileId] };
    });
  };

  const handleConfirm = async () => {
    if (!expenseId) return;

    try {
      await confirmExpense.mutateAsync(expenseId);
      toast({
        title: "Expense confirmed",
        description: "The expense has been confirmed and debts have been recorded",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to confirm",
        description: err.message || "Something went wrong",
      });
    }
  };

  const handleAddParticipants = async (itemId: string) => {
    const participants = selectedParticipants[itemId] || [];
    if (participants.length === 0) return;

    setIsUpdating(true);
    try {
      // This would call an API to add participants to the item
      // For now, we'll just show a toast
      await groupExpensesApi.updateItem(itemId, { participants });
      queryClient.invalidateQueries({ queryKey: ['group-expenses', expenseId] });
      toast({
        title: "Participants added",
        description: `Added ${participants.length} participant(s) to the item`,
      });
      setSelectedParticipants(prev => ({ ...prev, [itemId]: [] }));
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to add participants",
        description: err.message || "Something went wrong",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Expense not found</p>
        <Link to="/expenses">
          <Button variant="link">Back to Expenses</Button>
        </Link>
      </div>
    );
  }

  const isConfirmed = expense.status === "CONFIRMED";

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back Link */}
      <Link 
        to="/expenses" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Expenses
      </Link>

      {/* Expense Header */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-display font-bold">
                  {expense.description || 'Untitled Expense'}
                </h1>
                <Badge variant={isConfirmed ? "default" : "secondary"}>
                  {isConfirmed ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Confirmed
                    </>
                  ) : (
                    'Draft'
                  )}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(expense.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {expense.items.reduce((acc, item) => acc + item.participants.length, 0)} participants
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-3xl font-bold tabular-nums">
                {formatCurrency(expense.totalAmount)}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Paid by</span>
                <AvatarCircle 
                  name={expense.payerProfile.name}
                  imageUrl={expense.payerProfile.avatarUrl}
                  size="xs"
                />
                <span className="font-medium text-foreground">{expense.payerProfile.name}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {expense.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border/50 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} × {formatCurrency(parseFloat(item.amount) / item.quantity)}
                  </p>
                </div>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(item.amount)}
                </p>
              </div>

              {/* Current Participants */}
              {item.participants.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Split between:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.participants.map((participant) => (
                      <div
                        key={participant.profileId}
                        className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1"
                      >
                        <AvatarCircle 
                          name={participant.profile.name}
                          imageUrl={participant.profile.avatarUrl}
                          size="xs"
                        />
                        <span className="text-sm">{participant.profile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatCurrency(participant.share)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Participants (only for draft) */}
              {!isConfirmed && friendships && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Add participants:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {friendships.map((friendship) => {
                      const isSelected = (selectedParticipants[item.id] || []).includes(friendship.friendProfile.id);
                      const alreadyParticipant = item.participants.some(
                        p => p.profileId === friendship.friendProfile.id
                      );
                      
                      if (alreadyParticipant) return null;

                      return (
                        <button
                          key={friendship.friendProfile.id}
                          type="button"
                          onClick={() => handleParticipantToggle(item.id, friendship.friendProfile.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-full px-3 py-1 border transition-colors",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/50 hover:border-border"
                          )}
                        >
                          <Checkbox checked={isSelected} className="h-3 w-3" />
                          <AvatarCircle 
                            name={friendship.friendProfile.name}
                            imageUrl={friendship.friendProfile.avatarUrl}
                            size="xs"
                          />
                          <span className="text-sm">{friendship.friendProfile.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {(selectedParticipants[item.id]?.length || 0) > 0 && (
                    <Button 
                      size="sm" 
                      onClick={() => handleAddParticipants(item.id)}
                      disabled={isUpdating}
                    >
                      {isUpdating && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                      <Plus className="h-3 w-3 mr-1" />
                      Add {selectedParticipants[item.id]?.length} participant(s)
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Other Fees */}
      {expense.otherFees.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Additional Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expense.otherFees.map((fee) => (
                <div key={fee.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{fee.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {fee.calculationMethod === "PERCENTAGE" ? "%" : "Flat"}
                    </Badge>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(fee.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(expense.subtotal)}</span>
            </div>
            {expense.otherFees.length > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Fees</span>
                <span className="tabular-nums">
                  {formatCurrency(parseFloat(expense.totalAmount) - parseFloat(expense.subtotal))}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-border/50">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(expense.totalAmount)}</span>
            </div>
          </div>

          {/* Confirm Button */}
          {!isConfirmed && (
            <Button 
              className="w-full mt-6" 
              size="lg"
              onClick={handleConfirm}
              disabled={confirmExpense.isPending}
            >
              {confirmExpense.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm & Record Debts
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
