import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "@/contexts/AuthContext";

import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import VerifyRegistrationPage from "@/pages/auth/VerifyRegistrationPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import OAuthCallbackPage from "@/pages/auth/OAuthCallbackPage";
import DashboardPage from "@/pages/DashboardPage";
import FriendsPage from "@/pages/FriendsPage";
import FriendDetailPage from "@/pages/FriendDetailPage";
import ExpensesPage from "@/pages/ExpensesPage";
import ExpenseDetailPage from "@/pages/ExpenseDetailPage";
import BillsPage from "@/pages/BillsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";
import { useUserJotTracker } from "@/hooks/useUserJotTracker";

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
                <Route path="/bills" element={<BillsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Analytics />
            <SpeedInsights />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
