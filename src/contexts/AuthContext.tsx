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
import { UserProfile, authApi, apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

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
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const refreshUser = useCallback(async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
      apiClient.setTokens(null, null);
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    globalThis.addEventListener("api:unauthorized", handleUnauthorized);
    return () => {
      globalThis.removeEventListener("api:unauthorized", handleUnauthorized);
    };
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

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
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
