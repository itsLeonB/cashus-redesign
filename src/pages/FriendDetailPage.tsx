import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useFriendship } from "@/hooks/useApi";
import { AvatarCircle } from "@/components/AvatarCircle";
import { AmountDisplay } from "@/components/AmountDisplay";
import { TransactionModal } from "@/components/TransactionModal";
import { AssociateProfileModal } from "@/components/AssociateProfileModal";
import { TransferMethodsModal } from "@/components/TransferMethodsModal";
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
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import DebtSummary from "@/components/DebtSummary";

export default function FriendDetailPage() {
  const { friendId } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const { data: friendship, isLoading } = useFriendship(friendId || "");
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [associateOpen, setAssociateOpen] = useState(false);
  const [transferMethodsOpen, setTransferMethodsOpen] = useState(false);

  const friendDebts = friendship?.balance.transactionHistory || [];
  const balance = Number.parseFloat(friendship?.balance.netBalance || "0");

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
              <AmountDisplay amount={balance} size="lg" showLabel />
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setTransferMethodsOpen(true)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Transfer Methods
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => setTransactionOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Transaction
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DebtSummary data={friendship.balance} isLoading={isLoading} />

      {/* Transaction History */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {friendDebts.length > 0 ? (
            <div className="space-y-3">
              {friendDebts.map((debt) => {
                const isCredit = debt.type === "LENT";
                return (
                  <div
                    key={debt.id}
                    className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 rounded-lg bg-muted/30"
                  >
                    <div
                      className={`h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center ${
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">
                          {isCredit ? "Lent" : "Borrowed"}
                        </p>
                        {debt.transferMethod && (
                          <Badge variant="outline" className="text-xs">
                            <Wallet className="h-3 w-3 mr-1" />
                            {debt.transferMethod}
                          </Badge>
                        )}
                      </div>
                      {debt.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 sm:truncate">
                          {debt.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(debt.createdAt)}
                        </p>
                        <p
                          className={`text-sm font-semibold tabular-nums sm:hidden ${
                            isCredit ? "text-success" : "text-warning"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {formatCurrency(debt.amount || 0)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`hidden sm:block text-lg font-semibold tabular-nums flex-shrink-0 ${
                        isCredit ? "text-success" : "text-warning"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrency(debt.amount || 0)}
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
        onSuccess={() => {
          navigate(`/friends`);
        }}
      />

      {/* Transfer Methods Modal */}
      <TransferMethodsModal
        open={transferMethodsOpen}
        onOpenChange={setTransferMethodsOpen}
        profileId={friendship.friend.profileId}
        profileName={friendship.friend.name}
      />
    </div>
  );
}
