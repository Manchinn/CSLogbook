import { apiFetch } from "./client";
import { featureFlags } from "@/lib/config/featureFlags";
import type { AppRole } from "@/lib/auth/mockSession";

export type LoginPayload = {
  email: string;
  password: string;
  role?: AppRole;
};

export type AuthUser = {
  id: string;
  email: string;
  role: AppRole;
  name: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  if (featureFlags.enableMockAuth) {
    return {
      token: "mock-token",
      user: {
        id: "mock-user",
        email: payload.email,
        role: payload.role ?? "student",
        name: payload.email.split("@")[0] || "Mock User",
      },
    };
  }

  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
