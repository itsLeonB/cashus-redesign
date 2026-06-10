import { apiClient } from "./client";
import {
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserProfile,
} from "./types";

export interface UpdateProfileRequest {
  name: string;
  homeCurrency: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<void>("/auth/login", data),

  register: (data: RegisterRequest) =>
    apiClient.post<{ message: string }>("/auth/register", data),

  verifyRegistration: (token: string) =>
    apiClient.get<{ message: string }>(
      `/auth/verify-registration?token=${token}`,
    ),

  refreshToken: () =>
    apiClient.put<void>("/auth/refresh"),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>("/auth/password-reset", { email }),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.patch<{ message: string }>("/auth/reset-password", data),

  getProfile: () => apiClient.get<UserProfile>("/profile"),

  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.patch<UserProfile>("/profile", data),

  logout: () => apiClient.delete("/auth/logout"),

  getOAuthUrl: (provider: string) =>
    `${
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"
    }/v1/auth/${provider}`,

  handleOAuthCallback: (provider: string, code: string, state: string | null) =>
    apiClient.get<void>(`/auth/${provider}/callback`, {
      code,
      state,
    }),
};
