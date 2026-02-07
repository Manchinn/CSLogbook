import { apiFetch } from "./client";
import { featureFlags } from "@/lib/config/featureFlags";
import type { AppRole } from "@/lib/auth/mockSession";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is required");
}

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
  firstName?: string;
  lastName?: string;
  studentCode?: string;
  teacherId?: number;
  teacherCode?: string;
  teacherType?: string;
  canAccessTopicExam?: boolean;
  canExportProject1?: boolean;
  isSystemAdmin?: boolean;
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
  studentCode?: string;
  teacherId?: number;
  teacherCode?: string;
  teacherType?: string;
  canAccessTopicExam?: boolean;
  canExportProject1?: boolean;
  isSystemAdmin?: boolean;
  redirectPath?: string;
};

type VerifyTokenResponse = {
  user: {
    userId: string;
    role: AppRole;
    email?: string;
    firstName?: string;
    lastName?: string;
    studentCode?: string;
    teacherId?: number;
    teacherCode?: string;
    teacherType?: string;
    canAccessTopicExam?: boolean;
    canExportProject1?: boolean;
    isSystemAdmin?: boolean;
  };
};

type TokenClaims = {
  userId?: string;
  role?: AppRole;
  email?: string;
  firstName?: string;
  lastName?: string;
  studentCode?: string;
  teacherId?: number;
  teacherCode?: string;
  teacherType?: string;
  canAccessTopicExam?: boolean;
  canExportProject1?: boolean;
  isSystemAdmin?: boolean;
};

function decodeTokenClaims(token: string): TokenClaims {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));

    return {
      userId: decoded.userId ?? decoded.userID ?? decoded.id,
      role: decoded.role,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      studentCode: decoded.studentCode,
      teacherId: decoded.teacherId,
      teacherCode: decoded.teacherCode,
      teacherType: decoded.teacherType,
      canAccessTopicExam: decoded.canAccessTopicExam,
      canExportProject1: decoded.canExportProject1,
      isSystemAdmin: decoded.isSystemAdmin,
    };
  } catch (error) {
    console.warn("Failed to decode token claims", error);
    return {};
  }
}

function buildAuthUser(params: {
  id: string;
  role: AppRole;
  email?: string;
  firstName?: string;
  lastName?: string;
  studentCode?: string;
  teacherId?: number;
  teacherCode?: string;
  teacherType?: string;
  canAccessTopicExam?: boolean;
  canExportProject1?: boolean;
  isSystemAdmin?: boolean;
}): AuthUser {
  const fullName = [params.firstName, params.lastName].filter(Boolean).join(" ").trim();
  const isSystemAdmin = params.isSystemAdmin ?? (params.role === "admin" || (params.role === "teacher" && params.teacherType === "support"));

  return {
    id: params.id,
    role: params.role,
    email: params.email ?? "",
    name: fullName || params.email || params.id,
    firstName: params.firstName,
    lastName: params.lastName,
    studentCode: params.studentCode,
    teacherId: params.teacherId,
    teacherCode: params.teacherCode,
    teacherType: params.teacherType,
    canAccessTopicExam: params.canAccessTopicExam,
    canExportProject1: params.canExportProject1,
    isSystemAdmin,
  };
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  if (featureFlags.enableMockAuth) {
    const role = payload.role ?? "student";
    return {
      token: "mock-token",
      user: {
        id: "mock-user",
        email: payload.username,
        role,
        name: payload.username || "Mock User",
        teacherType: role === "teacher" ? "academic" : undefined,
        isSystemAdmin: role === "admin",
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

  const user = buildAuthUser({
    id: response.userId,
    role: response.role,
    email: response.email ?? payload.username,
    firstName: response.firstName,
    lastName: response.lastName,
    studentCode: response.studentCode,
    teacherId: response.teacherId,
    teacherCode: response.teacherCode,
    teacherType: response.teacherType,
    canAccessTopicExam: response.canAccessTopicExam,
    canExportProject1: response.canExportProject1,
    isSystemAdmin: response.isSystemAdmin,
  });

  return {
    token: response.token,
    user,
    redirectPath: response.redirectPath,
  };
}

export async function verifyToken(token: string): Promise<AuthUser> {
  const response = await apiFetch<VerifyTokenResponse>("/auth/verify-token", {
    method: "GET",
    token,
  });

  const claims = decodeTokenClaims(token);

  return buildAuthUser({
    id: response.user.userId || claims.userId || "",
    role: response.user.role || claims.role || "student",
    email: response.user.email ?? claims.email,
    firstName: response.user.firstName ?? claims.firstName,
    lastName: response.user.lastName ?? claims.lastName,
    studentCode: response.user.studentCode ?? claims.studentCode,
    teacherId: response.user.teacherId ?? claims.teacherId,
    teacherCode: response.user.teacherCode ?? claims.teacherCode,
    teacherType: response.user.teacherType ?? claims.teacherType,
    canAccessTopicExam: response.user.canAccessTopicExam ?? claims.canAccessTopicExam,
    canExportProject1: response.user.canExportProject1 ?? claims.canExportProject1,
    isSystemAdmin: response.user.isSystemAdmin ?? claims.isSystemAdmin,
  });
}

export function getSsoAuthorizeUrl(redirectPath = "/app") {
  const authorizeUrl = new URL(`${apiBaseUrl}/auth/sso/authorize`);
  authorizeUrl.searchParams.set("redirectPath", redirectPath);
  return authorizeUrl.toString();
}
