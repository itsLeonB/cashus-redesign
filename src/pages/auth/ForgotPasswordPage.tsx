import { SubmitEventHandler, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, ArrowLeft, Check } from "lucide-react";
import { useForgotPassword } from "@/hooks/useApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const {
    mutate: forgotPassword,
    isPending: isLoading,
    isSuccess,
  } = useForgotPassword();

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    forgotPassword(email, {
      onError: (error: unknown) => {
        const err = error as { message?: string };
        toast({
          variant: "destructive",
          title: "Request failed",
          description: err.message || "Something went wrong",
        });
      },
    });
  };

  if (isSuccess) {
    return (
      <div className="animate-fade-up">
        <Card className="border-border/50">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-display font-semibold mb-2">
              Check your email
            </h2>
            <p className="text-muted-foreground mb-6">
              If an account exists for <strong>{email}</strong>, you'll receive
              a password reset link shortly.
            </p>
            <Link to="/login">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <Card className="border-border/50">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-display">
            Forgot password?
          </CardTitle>
          <CardDescription>
            Enter your email and we'll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
