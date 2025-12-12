import { useState } from "react";
import { useGroupExpenses } from "@/hooks/useApi";
import { AvatarCircle } from "@/components/AvatarCircle";
import { NewExpenseModal } from "@/components/NewExpenseModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt, Calendar, Users, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useGroupExpenses();
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number.parseFloat(amount));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const expensesList = () => {
    if (isLoading)
      return (
        <div className="space-y-4">
          {new Array(4).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      );

    if (expenses && expenses.length > 0)
      return (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <Link key={expense.id} to={`/expenses/${expense.id}`}>
              <Card className="border-border/50 hover:border-border transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">
                          {expense.description || "Untitled Expense"}
                        </p>
                        <Badge
                          variant={expense.confirmed ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {expense.confirmed ? "Confirmed" : "Draft"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(expense.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {expense.items.reduce(
                            (acc, item) => acc + item.participants?.length || 0,
                            0
                          )}{" "}
                          participants
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-semibold tabular-nums">
                          {formatCurrency(expense.totalAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">Paid by</p>
                      </div>
                      <AvatarCircle name={expense.payerName} size="sm" />
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      );

    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Receipt className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-1">No group expenses yet</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
            Create your first group expense to split bills with friends easily
          </p>
          <Button variant="premium" onClick={() => setNewExpenseOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group Expense
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            Group Expenses
          </h1>
          <p className="text-muted-foreground mt-1">
            Split bills with multiple people
          </p>
        </div>
        <Button variant="premium" onClick={() => setNewExpenseOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Expense
        </Button>
      </div>

      {expensesList()}

      {/* New Expense Modal */}
      <NewExpenseModal open={newExpenseOpen} onOpenChange={setNewExpenseOpen} />
    </div>
  );
}
