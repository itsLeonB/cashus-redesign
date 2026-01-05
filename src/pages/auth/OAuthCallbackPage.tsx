import { useEffect, useState } from "react";
import {
  useSearchParams,
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api/auth";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        setError(
          errorDescription || errorParam || "OAuth authentication failed"
        );
        return;
      }

      if (!code) {
        setError("No authorization code received");
        return;
      }

      try {
        // Exchange the code for tokens
        const response = await authApi.handleOAuthCallback(
          provider,
          code,
          state
        );

        // Store the token
        apiClient.setToken(response.token);

        // Refresh user data
        await refreshUser();

        // Redirect to dashboard
        navigate("/dashboard", { replace: true });
      } catch (err: unknown) {
        const error = err as { message?: string };
        setError(error.message || "Failed to complete authentication");
      }
    };

    handleCallback();
  }, [provider, searchParams, navigate, refreshUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50">
          <CardContent className="flex flex-col items-center gap-4 text-center py-8">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-foreground font-medium">Authentication Failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link to="/login">
              <Button>Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="flex flex-col items-center gap-4 text-center py-8">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Completing authentication...</p>
        </CardContent>
      </Card>
    </div>
  );
}
