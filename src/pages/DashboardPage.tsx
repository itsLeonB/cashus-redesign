import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDebtSummary } from "@/hooks/useApi";
import { StatCard } from "@/components/StatCard";
import { AmountDisplay } from "@/components/AmountDisplay";
import { TransactionModal } from "@/components/TransactionModal";
import { NewGroupExpenseModal } from "@/components/NewGroupExpenseModal";
import { AddFriendModal } from "@/components/AddFriendModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  Plus,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import RecentTransactions from "@/components/RecentTransactions";
import RecentExpenses from "@/components/RecentExpenses";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: debtSummary, isLoading: debtSummaryLoading } = useDebtSummary();

  const [transactionOpen, setTransactionOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            {greeting}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your financial overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/friends">
              <Users className="h-4 w-4 mr-2" />
              Friends
            </Link>
          </Button>
          <Button variant="premium" onClick={() => setExpenseModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </Button>
        </div>
      </div>

      {/* Stats */}
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
                  amount={Number.parseFloat(
                    "-" + debtSummary?.totalBorrowedFromFriend || "0",
                  )}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTransactions />
        <RecentExpenses />
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50 gradient-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-display font-semibold mb-4">
            Quick Actions
          </h3>
          <div className="grid gap-3 grid-cols-2">
            <Button
              variant="secondary"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setAddFriendModalOpen(true)}
            >
              <Users className="h-6 w-6" />
              <span>Add Friend</span>
            </Button>
            <Button
              variant="secondary"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => {
                setTransactionOpen(true);
              }}
            >
              <ArrowUpRight className="h-6 w-6" />
              <span>Record Transaction</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal
        open={transactionOpen}
        onOpenChange={setTransactionOpen}
      />

      {/* New Group Expense Modal */}
      <NewGroupExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
      />

      {/* Add Friend Modal */}
      <AddFriendModal
        open={addFriendModalOpen}
        onOpenChange={setAddFriendModalOpen}
      />
    </div>
  );
}
