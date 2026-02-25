import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Clock, Upload } from "lucide-react";
import { SubscriptionDetails } from "@/lib/api/profile";
import { CurrentSubscription } from "@/lib/api/types";

interface CurrentSubscriptionCardProps {
  subscription: SubscriptionDetails | null | undefined;
  currentSubscription: CurrentSubscription | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({
  subscription,
}: Readonly<{ subscription: SubscriptionDetails }>) {
  const isExpired =
    subscription.endsAt && new Date(subscription.endsAt) < new Date();

  if (isExpired) {
    return (
      <Badge variant="destructive" className="text-xs">
        Expired
      </Badge>
    );
  }
  if (subscription.status === "canceled") {
    return (
      <Badge variant="outline" className="text-xs border-warning text-warning">
        Canceled
      </Badge>
    );
  }
  if (subscription.status === "past_due") {
    return (
      <Badge variant="outline" className="text-xs border-warning text-warning">
        Past Due Payment
      </Badge>
    );
  }
  return (
    <Badge className="text-xs bg-success/15 text-success border-success/30 hover:bg-success/20">
      Active
    </Badge>
  );
}

export function CurrentSubscriptionCard({
  subscription,
  currentSubscription,
  isLoading,
  isError,
  onRetry,
}: Readonly<CurrentSubscriptionCardProps>) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">
            Failed to load subscription details.
          </p>
          <button
            onClick={onRetry}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  // Free user - no active subscription
  if (!subscription) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Current Plan</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Free
            </Badge>
          </div>
          <CardDescription>
            You're on the free plan. Upgrade to unlock more features.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isCanceled =
    !!subscription.canceledAt || subscription.status === "canceled";

  const isPastDue = subscription.status === "past_due";
  const uploads = currentSubscription?.limits?.uploads;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{subscription.planName}</CardTitle>
          <StatusBadge subscription={subscription} />
        </div>
        {subscription.endsAt ? (
          <CardDescription>
            Until {formatDate(subscription.endsAt)}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cancel warning */}
        {isCanceled && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-warning">
              Your plan will downgrade at the end of this billing period
              {subscription.endsAt
                ? ` (${formatDate(subscription.endsAt)})`
                : ""}
              .
            </p>
          </div>
        )}
        {isPastDue && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-warning">
              Your limits are downgraded, please make a payment.
            </p>
          </div>
        )}

        {/* Usage info */}
        {uploads && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Upload Usage
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {uploads.daily.limit > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-medium">
                      {uploads.daily.used}/{uploads.daily.limit}
                    </span>{" "}
                    <span className="text-muted-foreground">daily</span>
                  </div>
                  {uploads.daily.canUpload ? (
                    <CheckCircle className="h-3.5 w-3.5 text-success ml-auto" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-warning ml-auto" />
                  )}
                </div>
              )}
              {uploads.monthly.limit > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-medium">
                      {uploads.monthly.used}/{uploads.monthly.limit}
                    </span>{" "}
                    <span className="text-muted-foreground">monthly</span>
                  </div>
                  {uploads.monthly.canUpload ? (
                    <CheckCircle className="h-3.5 w-3.5 text-success ml-auto" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-warning ml-auto" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
