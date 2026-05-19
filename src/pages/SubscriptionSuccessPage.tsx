import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/queryKeys";

export default function SubscriptionSuccessPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.subscription });
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.current });
  }, [queryClient]);

  return (
    <div className="text-center space-y-4 max-w-md mx-auto mt-16">
      <CheckCircle className="h-16 w-16 text-success mx-auto" />
      <h1 className="text-2xl font-bold font-display">Payment Successful!</h1>
      <p className="text-muted-foreground">
        Your subscription is now active.
      </p>
      <Link to="/subscription">
        <Button>View Your Plan</Button>
      </Link>
    </div>
  );
}
