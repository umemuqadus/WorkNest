import axios, { AxiosError } from "axios";
import type { ApiError } from "@/types";

export const TOKEN_KEY = "ai_job_tracker_token";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 drop the stale token and bounce to the login screen (unless we are
// already there - avoids redirect loops).
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register");
      if (!isAuthCall) {
        setToken(null);
        if (!window.location.pathname.startsWith("/login")) {
          window.location.assign("/login");
        }
      }
    }
    return Promise.reject(error);
  },
);

/** Normalise any thrown error into a user-facing message. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiError | undefined;
    if (payload?.detail) return payload.detail;
    if (error.code === "ERR_NETWORK") return "Cannot reach the server. Is the backend running?";
    if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
  }
  // Works for plain objects shaped like an API error too (e.g. re-thrown errors).
  const data = (error as { response?: { data?: ApiError } } | null)?.response?.data;
  if (data?.detail) return data.detail;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

/** Field-level validation errors keyed by form field name. */
export function getFieldErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!axios.isAxiosError(error)) return result;
  const payload = error.response?.data as ApiError | undefined;
  if (payload?.field) result[payload.field] = payload.detail;
  if (payload?.errors) {
    for (const message of payload.errors) {
      const [field] = message.split(":");
      const key = field.replace("body.", "").trim();
      if (key && !(key in result)) result[key] = message.split(":").slice(1).join(":").trim() || message;
    }
  }
  return result;
}
