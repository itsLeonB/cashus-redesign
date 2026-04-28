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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet,
  Link2,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import DebtSummary from "@/components/DebtSummary";
import type { FriendBalance } from "@/lib/api";
import { getCurrencyName } from "@/hooks/useCurrencyCodes";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function TransactionHistory({
  debts,
  friendName,
  currency,
  onRecordTransaction,
}: Readonly<{
  debts: FriendBalance["transactionHistory"];
  friendName: string;
  currency: string;
  onRecordTransaction: () => void;
}>) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-display">Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        {debts.length > 0 ? (
          <div className="space-y-3">
            {debts.map((debt) => {
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
                        {formatCurrency(debt.amount || 0, currency)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`hidden sm:block text-lg font-semibold tabular-nums flex-shrink-0 ${
                      isCredit ? "text-success" : "text-warning"
                    }`}
                  >
                    {isCredit ? "+" : "-"}
                    {formatCurrency(debt.amount || 0, currency)}
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
              Record your first transaction with {friendName}
            </p>
            <Button onClick={onRecordTransaction}>
              <Plus className="h-4 w-4 mr-2" />
              Record Transaction
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CurrencyBalanceSummary({
  balancesPerCurrency,
  onCurrencySelect,
}: Readonly<{
  balancesPerCurrency: Record<string, FriendBalance>;
  onCurrencySelect: (currency: string) => void;
}>) {
  const currencies = Object.keys(balancesPerCurrency);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-display">Balances</CardTitle>
        <span className="text-xs text-muted-foreground">
          {currencies.length}{" "}
          {currencies.length === 1 ? "currency" : "currencies"}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {currencies.map((currency) => {
            const netBalance = Number.parseFloat(
              balancesPerCurrency[currency]?.netBalance || "0",
            );
            const isPositive = netBalance >= 0;

            return (
              <button
                key={currency}
                className="w-full flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors text-left"
                onClick={() => onCurrencySelect(currency)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                    {currency}
                  </div>
                  <span className="text-sm">{getCurrencyName(currency)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      isPositive ? "text-success" : "text-warning"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {formatCurrency(netBalance, currency)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FriendDetailPage() {
  const { friendId } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const {
    data: friendship,
    isLoading,
    error,
    isError,
  } = useFriendship(friendId || "");
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [associateOpen, setAssociateOpen] = useState(false);
  const [transferMethodsOpen, setTransferMethodsOpen] = useState(false);
  const [activeCurrencyTab, setActiveCurrencyTab] = useState("");

  const balancesPerCurrency = friendship?.balancesPerCurrency || {};
  const currencies = Object.keys(balancesPerCurrency);
  const hasMultipleCurrencies = currencies.length > 1;
  const activeCurrency =
    activeCurrencyTab && balancesPerCurrency[activeCurrencyTab]
      ? activeCurrencyTab
      : currencies[0] || "IDR";
  const activeBalance =
    balancesPerCurrency[activeCurrency] || friendship?.balance;
  const balance = Number.parseFloat(activeBalance?.netBalance || "0");

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
            {/* Only show a single balance in the header when there's one currency */}
            {!hasMultipleCurrencies && (
              <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                <AmountDisplay
                  amount={balance}
                  currency={activeCurrency}
                  size="lg"
                  showLabel
                />
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
            )}
            {hasMultipleCurrencies && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
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
            )}
          </div>
        </CardContent>
      </Card>

      {hasMultipleCurrencies ? (
        <>
          {/* Concise multi-currency summary — net balance per currency, tappable to jump to tab */}
          <CurrencyBalanceSummary
            balancesPerCurrency={balancesPerCurrency}
            onCurrencySelect={setActiveCurrencyTab}
          />

          <Tabs
            value={activeCurrency}
            onValueChange={setActiveCurrencyTab}
            className="space-y-4"
          >
            {currencies.map((currency) => (
              <TabsContent
                key={currency}
                value={currency}
                className="space-y-6"
              >
                <DebtSummary
                  data={balancesPerCurrency[currency]}
                  currency={currency}
                  isLoading={isLoading}
                  error={error}
                  isError={isError}
                />
                <TransactionHistory
                  debts={
                    balancesPerCurrency[currency]?.transactionHistory || []
                  }
                  friendName={friendship.friend.name}
                  currency={currency}
                  onRecordTransaction={() => setTransactionOpen(true)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </>
      ) : (
        <>
          <DebtSummary
            data={activeBalance}
            currency={activeCurrency}
            isLoading={isLoading}
            error={error}
            isError={isError}
          />
          <TransactionHistory
            debts={activeBalance?.transactionHistory || []}
            friendName={friendship.friend.name}
            currency={activeCurrency}
            onRecordTransaction={() => setTransactionOpen(true)}
          />
        </>
      )}

      <TransactionModal
        open={transactionOpen}
        onOpenChange={setTransactionOpen}
        defaultFriendId={friendship.friend.profileId}
      />

      <AssociateProfileModal
        open={associateOpen}
        onOpenChange={setAssociateOpen}
        anonProfileId={friendship.friend.profileId}
        anonProfileName={friendship.friend.name}
        onSuccess={() => navigate(`/friends`)}
      />

      <TransferMethodsModal
        open={transferMethodsOpen}
        onOpenChange={setTransferMethodsOpen}
        profileId={friendship.friend.profileId}
        profileName={friendship.friend.name}
      />
    </div>
  );
}
