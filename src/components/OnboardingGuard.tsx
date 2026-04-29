import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function OnboardingGuard() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (
    isAuthenticated &&
    user &&
    !user.isOnboarded &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}