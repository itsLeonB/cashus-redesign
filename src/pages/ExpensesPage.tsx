import { useState } from "react";
import { useGroupExpenses } from "@/hooks/useApi";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, Receipt, Calendar, Users, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { NewGroupExpenseModal } from "@/components/NewGroupExpenseModal";
import { statusDisplay } from "@/lib/api";
import type { GroupExpenseResponse } from "@/lib/api/types";

export default function ExpensesPage() {
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("unconfirmed");

  const { data: draftExpenses, isLoading: isDraftLoading } =
    useGroupExpenses("DRAFT");
  const { data: readyExpenses, isLoading: isReadyLoading } =
    useGroupExpenses("READY");
  const { data: confirmedExpenses, isLoading: isConfirmedLoading } =
    useGroupExpenses("CONFIRMED", { enabled: activeTab === "confirmed" });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "IDR",
    }).format(Number.parseFloat(amount));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderExpenseCard = (expense: GroupExpenseResponse) => (
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
                  variant={
                    expense.status === "CONFIRMED" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {statusDisplay[expense.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(expense.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {expense.participants?.length || 0} participants
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(expense.totalAmount)}
                </p>
                {expense.payer.name && (
                  <p className="text-xs text-muted-foreground">Paid by</p>
                )}
              </div>
              {expense.payer.name && (
                <AvatarCircle
                  name={expense.payer.name}
                  imageUrl={expense.payer.avatar}
                  size="sm"
                />
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const renderLoadingSkeletons = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={`expense-loading-${i}`} className="h-24" />
      ))}
    </div>
  );

  const renderExpenseList = (
    expenses: GroupExpenseResponse[] | undefined,
    isLoading: boolean
  ) => {
    if (isLoading) return renderLoadingSkeletons();

    if (!expenses || expenses.length === 0) return null;

    return (
      <div className="space-y-4">
        {expenses.map((expense) => renderExpenseCard(expense))}
      </div>
    );
  };

  const renderEmptyState = () => (
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

  const hasUnconfirmedExpenses =
    (readyExpenses && readyExpenses.length > 0) ||
    (draftExpenses && draftExpenses.length > 0);
  const isUnconfirmedLoading = isDraftLoading || isReadyLoading;

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unconfirmed">Unconfirmed</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
        </TabsList>

        <TabsContent value="unconfirmed" className="space-y-6 mt-6">
          {isUnconfirmedLoading ? (
            renderLoadingSkeletons()
          ) : hasUnconfirmedExpenses ? (
            <>
              {/* Ready Expenses */}
              {readyExpenses && readyExpenses.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Ready to Confirm
                  </h2>
                  {renderExpenseList(readyExpenses, false)}
                </div>
              )}

              {/* Divider */}
              {readyExpenses &&
                readyExpenses.length > 0 &&
                draftExpenses &&
                draftExpenses.length > 0 && <Separator className="my-6" />}

              {/* Draft Expenses */}
              {draftExpenses && draftExpenses.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Drafts
                  </h2>
                  {renderExpenseList(draftExpenses, false)}
                </div>
              )}
            </>
          ) : (
            renderEmptyState()
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-6 mt-6">
          {isConfirmedLoading ? (
            renderLoadingSkeletons()
          ) : confirmedExpenses && confirmedExpenses.length > 0 ? (
            <div className="space-y-4">
              {confirmedExpenses.map((expense) => renderExpenseCard(expense))}
            </div>
          ) : (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-1">
                  No confirmed expenses
                </h3>
                <p className="text-muted-foreground text-sm text-center max-w-sm">
                  Confirmed expenses will appear here once you finalize them
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* New Expense Modal */}
      <NewGroupExpenseModal
        open={newExpenseOpen}
        onOpenChange={setNewExpenseOpen}
      />
    </div>
  );
}
