import { ApiError } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

class ApiClient {
  private readonly baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshFailed = false;
  private refreshSubscribers: ((token: string | null) => void)[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem("authToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  setTokens(token: string | null, refreshToken: string | null) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.refreshFailed = false;

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

  getToken() {
    return this.token;
  }

  isRefreshFailed() {
    return this.refreshFailed;
  }

  private onRefreshed(token: string | null) {
    this.refreshSubscribers.forEach((cb) => {
      cb(token);
    });
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string | null) => void) {
    this.refreshSubscribers.push(cb);
  }

  private async handleRefreshFlow<T>(
    retryAction: () => Promise<T>,
  ): Promise<T> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!refreshResponse.ok) {
          if (refreshResponse.status < 500) {
            this.refreshFailed = true;
          }
          throw new Error("Refresh failed");
        }

        const { data } = await refreshResponse.json();
        this.setTokens(data.token, data.refreshToken);
        this.isRefreshing = false;
        this.onRefreshed(data.token);

        return retryAction();
      } catch (error) {
        this.isRefreshing = false;
        this.onRefreshed(null);
        throw error;
      }
    }

    return new Promise<T>((resolve, reject) => {
      this.addRefreshSubscriber((newToken) => {
        if (newToken) {
          retryAction().then(resolve).catch(reject);
        } else {
          reject({
            message: "Session expired",
            statusCode: 401,
            isRefreshFailure: true,
          } as ApiError);
        }
      });
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    if (this.refreshFailed) {
      throw {
        message: "Session expired",
        statusCode: 401,
        isRefreshFailure: true,
      } as ApiError;
    }

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
      return this.handleRefreshFlow(() =>
        this.request<T>(endpoint, options, true),
      );
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: "An unexpected error occurred",
        statusCode: response.status,
      }));
      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

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

  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    isRetry = false,
  ): Promise<T> {
    if (this.refreshFailed) {
      throw {
        message: "Session expired",
        statusCode: 401,
        isRefreshFailure: true,
      } as ApiError;
    }

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

      if (response.status === 401 && !isRetry && this.refreshToken) {
        return this.handleRefreshFlow(() =>
          this.uploadFile<T>(endpoint, formData, true),
        );
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
