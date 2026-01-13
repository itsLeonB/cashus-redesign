import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFriendships, useDebts, useGroupExpenses } from "@/hooks/useApi";
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
  ArrowDownRight,
  Plus,
  Users,
  Receipt,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: friendships, isLoading: friendshipsLoading } = useFriendships();
  const { data: debts, isLoading: debtsLoading } = useDebts();
  const { data: expenses, isLoading: expensesLoading } = useGroupExpenses();

  const [transactionOpen, setTransactionOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);

  const isLoading = friendshipsLoading || debtsLoading || expensesLoading;

  // Calculate balances per friend profile ID
  const balances = useMemo(() => {
    const map = new Map<string, number>();
    debts?.forEach((debt) => {
      const amount = Number.parseFloat(debt.amount);
      const current = map.get(debt.profileId) || 0;
      // CREDIT = You are owed (positive), DEBT = You owe (negative)
      const change = debt.type === "CREDIT" ? amount : -amount;
      map.set(debt.profileId, current + change);
    });
    return map;
  }, [debts]);

  // Calculate totals
  const { totalOwedToYou, totalYouOwe } = useMemo(() => {
    let owedToYou = 0;
    let youOwe = 0;
    balances.forEach((balance) => {
      if (balance > 0) owedToYou += balance;
      else youOwe += Math.abs(balance);
    });
    return { totalOwedToYou: owedToYou, totalYouOwe: youOwe };
  }, [balances]);

  // Recent activity
  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      type: "debt" | "expense";
      description: string;
      amount: number;
      date: string;
      profileName: string;
      avatarUrl?: string;
    }> = [];

    debts?.slice(0, 5).forEach((debt) => {
      const friend = friendships?.find((f) => f.profileId === debt.profileId);
      activities.push({
        id: debt.id,
        type: "debt",
        description:
          debt.description || `${debt.type.toLowerCase()} transaction`,
        amount: Number.parseFloat(debt.amount),
        date: debt.createdAt,
        profileName: friend?.profileName || "Unknown",
        avatarUrl: friend?.profileAvatar,
      });
    });

    expenses?.slice(0, 5).forEach((expense) => {
      activities.push({
        id: expense.id,
        type: "expense",
        description: expense.description || "Group expense",
        amount: Number.parseFloat(expense.totalAmount),
        date: expense.createdAt,
        profileName: expense.payer.name,
      });
    });

    const sortTime = (
      a: (typeof activities)[number],
      b: (typeof activities)[number]
    ) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    };

    return activities.toSorted(sortTime).slice(0, 6);
  }, [debts, expenses, friendships]);

  // Friends with balances
  const friendsWithBalances = useMemo(() => {
    if (!friendships) return [];

    return friendships
      .map((f) => ({
        ...f,
        balance: balances.get(f.profileId) || 0,
      }))
      .filter((f) => f.balance !== 0)
      .toSorted((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 5);
  }, [friendships, balances]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const arrowDisplay = (activity) => {
    if (activity.type === "debt") {
      if (debts?.find((d) => d.id === activity.id)?.type === "CREDIT")
        return <ArrowUpRight className="h-4 w-4 text-success" />;
      return <ArrowDownRight className="h-4 w-4 text-destructive" />;
    }

    return <ArrowDownRight className="h-4 w-4 text-destructive" />;
  };

  const activityCardContent = () => {
    if (isLoading)
      return (
        <div className="space-y-3">
          {new Array(4).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      );
    if (recentActivity?.length === 0)
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No recent activity</p>
          <Button variant="outline" size="sm" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create transaction
          </Button>
        </div>
      );
    return (
      <div className="space-y-3">
        {recentActivity.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors min-w-0"
          >
            {activity.profileName && (
              <AvatarCircle
                name={activity.profileName}
                imageUrl={activity.avatarUrl}
                size="sm"
                className="flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {activity.description}
              </p>
              {activity.profileName && (
                <p className="text-xs text-muted-foreground truncate">
                  with {activity.profileName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {arrowDisplay(activity)}
              <AmountDisplay
                amount={activity.amount}
                size="sm"
                showSign={false}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const friendsCardContent = () => {
    if (isLoading)
      return (
        <div className="space-y-3">
          {new Array(4).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      );
    if (friendsWithBalances.length === 0)
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
        {friendsWithBalances.map((friendship) => (
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <StatCard
              label="Owed to you"
              value={
                <AmountDisplay
                  amount={totalOwedToYou}
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
                  amount={-totalYouOwe}
                  showSign={false}
                  size="lg"
                />
              }
              icon={<TrendingDown className="h-5 w-5" />}
              variant="negative"
            />
            <StatCard
              label="Total friends"
              value={friendships?.length || 0}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Group expenses"
              value={expenses?.length || 0}
              icon={<Receipt className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-border/50 min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-display">
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/expenses">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="min-w-0">{activityCardContent()}</CardContent>
        </Card>

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
