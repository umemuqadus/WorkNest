import { api } from "@/lib/api";
import type { AuthResponse, User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}

export interface ProfilePayload {
  name?: string;
  email?: string;
  location?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  async updateProfile(payload: ProfilePayload): Promise<User> {
    const { data } = await api.patch<User>("/auth/me", payload);
    return data;
  },

  async changePassword(payload: {
    current_password: string;
    new_password: string;
  }): Promise<void> {
    await api.post("/auth/change-password", payload);
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
};
