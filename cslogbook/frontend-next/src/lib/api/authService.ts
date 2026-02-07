import { apiFetch } from "./client";
import { featureFlags } from "@/lib/config/featureFlags";
import type { AppRole } from "@/lib/auth/mockSession";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export type LoginPayload = {
  username: string;
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
  redirectPath?: string;
};

type BackendLoginResponse = {
  token: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: AppRole;
  redirectPath?: string;
};

type VerifyTokenResponse = {
  user: {
    userId: string;
    role: AppRole;
  };
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  if (featureFlags.enableMockAuth) {
    return {
      token: "mock-token",
      user: {
        id: "mock-user",
        email: payload.username,
        role: payload.role ?? "student",
        name: payload.username || "Mock User",
      },
      redirectPath: "/app",
    };
  }

  const response = await apiFetch<BackendLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
      redirectPath: "/app",
    }),
  });

  const fullName = [response.firstName, response.lastName].filter(Boolean).join(" ").trim();

  return {
    token: response.token,
    user: {
      id: response.userId,
      email: response.email ?? payload.username,
      role: response.role,
      name: fullName || response.email || payload.username,
    },
    redirectPath: response.redirectPath,
  };
}

export async function verifyToken(token: string): Promise<AuthUser> {
  const response = await apiFetch<VerifyTokenResponse>("/auth/verify-token", {
    method: "GET",
    token,
  });

  return {
    id: response.user.userId,
    role: response.user.role,
    name: response.user.userId,
    email: "",
  };
}

export function getSsoAuthorizeUrl(redirectPath = "/app") {
  const authorizeUrl = new URL(`${apiBaseUrl}/auth/sso/authorize`);
  authorizeUrl.searchParams.set("redirectPath", redirectPath);
  return authorizeUrl.toString();
}
