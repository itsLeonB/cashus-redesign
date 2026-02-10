import { apiClient } from "./client";
import {
  TokenResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserProfile,
  RefreshTokenRequest,
} from "./types";

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<TokenResponse>("/auth/login", data),

  register: (data: RegisterRequest) =>
    apiClient.post<{ message: string }>("/auth/register", data),

  verifyRegistration: (token: string) =>
    apiClient.get<{ message: string }>(
      `/auth/verify-registration?token=${token}`,
    ),

  refreshToken: (data: RefreshTokenRequest) =>
    apiClient.put<TokenResponse>("/auth/refresh", data),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>("/auth/password-reset", { email }),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.patch<{ message: string }>("/auth/reset-password", data),

  getProfile: () => apiClient.get<UserProfile>("/profile"),

  updateProfile: (name: string) =>
    apiClient.patch<UserProfile>("/profile", { name }),

  logout: () => apiClient.delete("/auth/logout"),

  getOAuthUrl: (provider: string) =>
    `${
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"
    }/v1/auth/${provider}`,

  handleOAuthCallback: (provider: string, code: string, state: string | null) =>
    apiClient.get<TokenResponse>(`/auth/${provider}/callback`, {
      code,
      state,
    }),
};
