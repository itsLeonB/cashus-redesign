import { ApiError } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

class ApiClient {
  private readonly baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem("authToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  setTokens(token: string | null, refreshToken: string | null) {
    this.token = token;
    this.refreshToken = refreshToken;

    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }

    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }

  getToken() {
    return this.token;
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && !isRetry && this.refreshToken) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: this.refreshToken }),
          });

          if (!refreshResponse.ok) {
            throw new Error("Refresh failed");
          }

          const { data } = await refreshResponse.json();
          this.setTokens(data.token, data.refreshToken);
          this.isRefreshing = false;
          this.onRefreshed(data.token);
        } catch (error) {
          this.isRefreshing = false;
          this.setTokens(null, null);
          globalThis.dispatchEvent(new CustomEvent("api:unauthorized"));
          throw error;
        }
      }

      return new Promise<T>((resolve, reject) => {
        this.addRefreshSubscriber(() => {
          this.request<T>(endpoint, options, true).then(resolve).catch(reject);
        });
      });
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: "An unexpected error occurred",
        statusCode: response.status,
      }));
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    // Auto-unwrap the data property if it exists, matching standard ApiResponse<T>
    if (data && typeof data === "object" && "data" in data) {
      return data.data;
    }

    return data;
  }

  get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ) {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: "GET" });
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const executeRequest = async (token: string | null): Promise<T> => {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      if (response.status === 401 && this.refreshToken) {
        // For file uploads, it's easier to just trigger refresh if not already doing so
        // and then retry. However, upload might be large.
        // For simplicity, let's follow the same logic as request() but adapted for uploadFile.
        // But wait, request() is more generic. Maybe I can refactor request to handle both?
        // Let's keep it separate for now but handle 401.
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const refreshResponse = await fetch(
              `${this.baseUrl}/auth/refresh`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
              },
            );
            if (!refreshResponse.ok) throw new Error("Refresh failed");
            const { data } = await refreshResponse.json();
            this.setTokens(data.token, data.refreshToken);
            this.isRefreshing = false;
            this.onRefreshed(data.token);
          } catch (error) {
            this.isRefreshing = false;
            this.setTokens(null, null);
            globalThis.dispatchEvent(new CustomEvent("api:unauthorized"));
            throw error;
          }
        }

        return new Promise<T>((resolve, reject) => {
          this.addRefreshSubscriber((newToken) => {
            executeRequest(newToken).then(resolve).catch(reject);
          });
        });
      }

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          message: "An unexpected error occurred",
          statusCode: response.status,
        }));
        throw error;
      }

      const data = await response.json();
      if (data && typeof data === "object" && "data" in data) {
        return data.data;
      }
      return data;
    };

    return executeRequest(this.token);
  }
}

export const apiClient = new ApiClient(API_BASE_URL + "/v1");
