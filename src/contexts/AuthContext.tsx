import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserProfile, authApi, apiClient, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { clearNotificationContext } from "@/lib/notificationPersistence";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isRefreshFailed: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshFailed, setIsRefreshFailed] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refreshUser = useCallback(async () => {
    try {
      if (apiClient.isRefreshFailed()) {
        setIsRefreshFailed(true);
        setUser(null);
        return;
      }

      const profile = await authApi.getProfile();
      setUser(profile);
      setIsRefreshFailed(false);
    } catch (error) {
      const err = error as ApiError;
      if (err.isRefreshFailure) {
        setIsRefreshFailed(true);
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = apiClient.getToken();
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });
      apiClient.setTokens(response.token, response.refreshToken);
      setIsRefreshFailed(false);
      const profile = await authApi.getProfile();
      setUser(profile);

      // Invalidate useApi.ts queries
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current });
      queryClient.invalidateQueries({ queryKey: queryKeys.friendships.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.friendRequests.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.recent });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupExpenses.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupExpenses.recent,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all });
    },
    [queryClient],
  );

  const register = useCallback(
    async (email: string, password: string, passwordConfirmation: string) => {
      await authApi.register({ email, password, passwordConfirmation });
    },
    [],
  );

  const logout = useCallback(async () => {
    // 1. Local cleanup must occur unconditionally
    const cleanup = () => {
      setUser(null);
      setIsRefreshFailed(false);
      apiClient.setTokens(null, null);
      clearNotificationContext();
      queryClient.clear();
    };

    try {
      // 2. Best-effort backend call
      await authApi.logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout API failed (swallowed):", error);
      // We don't re-throw or show destructive toast if cleanup succeeded
      // but we might want to notify that session was cleared locally.
      toast({
        title: "Logged out",
        description: "Local session cleared. Could not notify server.",
      });
    } finally {
      cleanup();
    }
  }, [queryClient, toast]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
      isRefreshFailed,
    }),
    [user, isLoading, login, register, logout, refreshUser, isRefreshFailed],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
