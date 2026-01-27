import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFriendships, useDebtSummary } from "@/hooks/useApi";
import { StatCard } from "@/components/StatCard";
import { AvatarCircle } from "@/components/AvatarCircle";
import { AmountDisplay } from "@/components/AmountDisplay";
import { TransactionModal } from "@/components/TransactionModal";
import { NewGroupExpenseModal } from "@/components/NewGroupExpenseModal";
import { AddFriendModal } from "@/components/AddFriendModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  Plus,
  Users,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import RecentTransactions from "@/components/RecentTransactions";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: friendships, isLoading: friendshipsLoading } = useFriendships();
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

  const skeletonKeys = ["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"];

  const friendsCardContent = () => {
    if (friendshipsLoading)
      return (
        <div className="space-y-3">
          {skeletonKeys.map((key) => (
            <Skeleton key={key} className="h-14" />
          ))}
        </div>
      );
    if ((friendships?.length || 0) === 0)
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No outstanding balances</p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link to="/friends">
              <Plus className="h-4 w-4 mr-2" />
              Add friends
            </Link>
          </Button>
        </div>
      );
    return (
      <div className="space-y-3">
        {friendships.map((friendship) => (
          <Link
            key={friendship.id}
            to={`/friends/${friendship.id}`} // Use friendship ID for link, but querying details might need profileId correction later
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors min-w-0"
          >
            <AvatarCircle
              name={friendship.profileName}
              imageUrl={friendship.profileAvatar}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {friendship.profileName}
              </p>
              <p className="text-xs text-muted-foreground">
                {friendship.type === "ANON" ? "Anonymous" : "Connected"}
              </p>
            </div>
            <div className="flex-shrink-0">
              <AmountDisplay amount={friendship.balance} size="sm" />
            </div>
          </Link>
        ))}
      </div>
    );
  };

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

        {/* Friends with Balances */}
        <Card className="border-border/50 min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-display">
              Outstanding Balances
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/friends">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="min-w-0">{friendsCardContent()}</CardContent>
        </Card>
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
