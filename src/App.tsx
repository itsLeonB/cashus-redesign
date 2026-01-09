import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "@/contexts/AuthContext";

import { Spinner } from "@/components/ui/spinner";
import { useUserJotTracker } from "@/hooks/useUserJotTracker";

import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";

import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/DashboardPage";

// Lazy load other pages
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(
  () => import("@/pages/auth/ForgotPasswordPage")
);
const VerifyRegistrationPage = lazy(
  () => import("@/pages/auth/VerifyRegistrationPage")
);
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const OAuthCallbackPage = lazy(() => import("@/pages/auth/OAuthCallbackPage"));
const FriendsPage = lazy(() => import("@/pages/FriendsPage"));
const FriendDetailPage = lazy(() => import("@/pages/FriendDetailPage"));
const ExpensesPage = lazy(() => import("@/pages/ExpensesPage"));
const ExpenseDetailPage = lazy(() => import("@/pages/ExpenseDetailPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const UserJotTracker = () => {
  useUserJotTracker();
  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <UserJotTracker />
            <Suspense
              fallback={
                <div className="h-screen w-full flex items-center justify-center">
                  <Spinner />
                </div>
              }
            >
              <Routes>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/auth/verify-registration"
                    element={<VerifyRegistrationPage />}
                  />
                  <Route
                    path="/auth/:provider/callback"
                    element={<OAuthCallbackPage />}
                  />
                </Route>
                <Route
                  path="/auth/reset-password"
                  element={<ResetPasswordPage />}
                />
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/friends" element={<FriendsPage />} />
                  <Route
                    path="/friends/:friendId"
                    element={<FriendDetailPage />}
                  />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route
                    path="/expenses/:expenseId"
                    element={<ExpenseDetailPage />}
                  />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Analytics />
            <SpeedInsights />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
