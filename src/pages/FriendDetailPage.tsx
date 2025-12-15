import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useFriendship } from "@/hooks/useApi";
import { AvatarCircle } from "@/components/AvatarCircle";
import { AmountDisplay } from "@/components/AmountDisplay";
import { TransactionModal } from "@/components/TransactionModal";
import { AssociateProfileModal } from "@/components/AssociateProfileModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet,
  Link2,
} from "lucide-react";

export default function FriendDetailPage() {
  const { friendId } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const { data: friendship, isLoading } = useFriendship(friendId || "");
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [associateOpen, setAssociateOpen] = useState(false);

  const friendDebts = friendship?.transactions || [];
  const balance = friendship?.balance.netBalance || 0;
  const totalLent = friendship?.balance.totalOwedToYou || 0;
  const totalBorrowed = friendship?.balance.totalYouOwe || 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
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

  if (!friendship) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Friend not found</p>
        <Link to="/friends">
          <Button variant="link">Back to Friends</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back Link */}
      <Link
        to="/friends"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Friends
      </Link>

      {/* Friend Header */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <AvatarCircle
              name={friendship.friend.name}
              imageUrl={friendship.friend.avatar}
              size="xl"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-display font-bold">
                  {friendship.friend.name}
                </h1>
                {friendship.friend.type === "ANON" && (
                  <Badge variant="secondary">Anonymous</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Friends since {formatDate(friendship.friend.createdAt)}
              </p>
              {friendship.friend.type === "ANON" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setAssociateOpen(true)}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Link to Real Profile
                </Button>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <AmountDisplay amount={balance} size="lg" showLabel />
              <Button onClick={() => setTransactionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Transaction
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Lent</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(totalLent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <ArrowDownLeft className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Borrowed</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(totalBorrowed)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {friendDebts.length > 0 ? (
            <div className="space-y-3">
              {friendDebts.map((debt) => {
                const isCredit = debt.type === "REPAY";
                return (
                  <div
                    key={debt.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                  >
                    <div
                      className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${
                        isCredit
                          ? "text-success bg-success/10"
                          : "text-warning bg-warning/10"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {isCredit ? "Lent/Received" : "Borrowed/Returned"}
                        </p>
                        {debt.transferMethod && (
                          <Badge variant="outline" className="text-xs">
                            <Wallet className="h-3 w-3 mr-1" />
                            {debt.transferMethod}
                          </Badge>
                        )}
                      </div>
                      {debt.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {debt.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(debt.createdAt)}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-semibold tabular-nums ${
                        isCredit ? "text-success" : "text-warning"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrency(debt.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">No transactions yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Record your first transaction with {friendship.friend.name}
              </p>
              <Button onClick={() => setTransactionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal
        open={transactionOpen}
        onOpenChange={setTransactionOpen}
        defaultFriendId={friendship.friend.profileId}
      />

      {/* Associate Profile Modal */}
      <AssociateProfileModal
        open={associateOpen}
        onOpenChange={setAssociateOpen}
        anonProfileId={friendship.friend.profileId}
        anonProfileName={friendship.friend.name}
        onSuccess={(realFriendshipId) => {
          navigate(`/friends/${realFriendshipId}`);
        }}
      />
    </div>
  );
}
