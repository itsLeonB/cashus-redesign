import { apiClient } from "./client";
import {
  LoginResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserProfile,
} from "./types";

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data),

  register: (data: RegisterRequest) =>
    apiClient.post<{ message: string }>("/auth/register", data),

  verifyRegistration: (token: string) =>
    apiClient.get<{ message: string }>(
      `/auth/verify-registration?token=${token}`
    ),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>("/auth/password-reset", { email }),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.patch<{ message: string }>("/auth/reset-password", data),

  getProfile: () => apiClient.get<UserProfile>("/profile"),

  updateProfile: (name: string) =>
    apiClient.patch<UserProfile>("/profile", { name }),

  logout: () => {
    apiClient.setToken(null);
  },

  getOAuthUrl: (provider: string) =>
    `${
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"
    }/auth/${provider}`,
};
