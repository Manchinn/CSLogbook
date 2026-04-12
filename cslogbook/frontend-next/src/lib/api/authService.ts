import { apiFetch } from "./client";
import type { AppRole } from "@/lib/auth/mockSession";
import {
  getSsoAuthorizeCompatibility,
  getSsoCallbackCompatibility,
  getSsoStatusCompatibility,
  getSsoUrlCompatibility,
  logoutCompatibility,
  refreshTokenCompatibility,
} from "@/lib/services/compatibilityService";
import { env } from "@/lib/config/env";

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
  studentId?: number;
  studentCode?: string;
  teacherId?: number;
  teacherCode?: string;
  teacherType?: string;
  teacherPosition?: string;
  canAccessTopicExam?: boolean;
  canExportProject1?: boolean;
  isSystemAdmin?: boolean;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
  redirectPath?: string;
};

export async function changePasswordInit(token: string, currentPassword: string, newPassword: string) {
  return apiFetch<{ success: boolean; message?: string }>("/auth/password/change/init", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function confirmPasswordChange(token: string, otp: string) {
  return apiFetch<{ success: boolean; message?: string }>("/auth/password/change/confirm", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp }),
  });
}

type BackendLoginResponse = {
  token: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: AppRole;
  studentId?: number;
  studentCode?: string;
  teacherId?: number;
  teacherCode?: string;
  teacherType?: string;
  teacherPosition?: string;
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
    studentId?: number;
    studentCode?: string;
    teacherId?: number;
    teacherCode?: string;
    teacherType?: string;
    teacherPosition?: string;
    canAccessTopicExam?: boolean;
    canExportProject1?: boolean;
    isSystemAdmin?: boolean;
  };
};

// JWT payload ลดเหลือเฉพาะ identity + role fields (ไม่มี PII เช่น name/email)
// PII ดึงจาก verify-token endpoint และ login response body แทน
type TokenClaims = {
  userId?: string;
  role?: AppRole;
  studentId?: number;
  studentCode?: string;
  teacherId?: number;
  teacherCode?: string;
  teacherType?: string;
  teacherPosition?: string;
  canAccessTopicExam?: boolean;
  canExportProject1?: boolean;
};

function decodeTokenClaims(token: string): TokenClaims {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));

    return {
      userId: decoded.userId ?? decoded.userID ?? decoded.id,
      role: decoded.role,
      studentId: decoded.studentId,
      studentCode: decoded.studentCode,
      teacherId: decoded.teacherId,
      teacherCode: decoded.teacherCode,
      teacherType: decoded.teacherType,
      teacherPosition: decoded.teacherPosition,
      canAccessTopicExam: decoded.canAccessTopicExam,
      canExportProject1: decoded.canExportProject1,
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
  studentId?: number;
  studentCode?: string;
  teacherId?: number;
  teacherCode?: string;
  teacherType?: string;
  teacherPosition?: string;
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
    studentId: params.studentId,
    studentCode: params.studentCode,
    teacherId: params.teacherId,
    teacherCode: params.teacherCode,
    teacherType: params.teacherType,
    teacherPosition: params.teacherPosition,
    canAccessTopicExam: params.canAccessTopicExam,
    canExportProject1: params.canExportProject1,
    isSystemAdmin,
  };
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiFetch<BackendLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
      redirectPath: "/app",
    }),
  });

  const claims = decodeTokenClaims(response.token);

  const user = buildAuthUser({
    id: response.userId ?? claims.userId ?? "",
    role: response.role ?? claims.role ?? payload.role ?? "student",
    email: response.email ?? payload.username,
    firstName: response.firstName,
    lastName: response.lastName,
    studentId: response.studentId ?? claims.studentId,
    studentCode: response.studentCode ?? claims.studentCode,
    teacherId: response.teacherId ?? claims.teacherId,
    teacherCode: response.teacherCode ?? claims.teacherCode,
    teacherType: response.teacherType ?? claims.teacherType,
    teacherPosition: response.teacherPosition ?? claims.teacherPosition,
    canAccessTopicExam: response.canAccessTopicExam ?? claims.canAccessTopicExam,
    canExportProject1: response.canExportProject1 ?? claims.canExportProject1,
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
    email: response.user.email,
    firstName: response.user.firstName,
    lastName: response.user.lastName,
    studentId: response.user.studentId ?? claims.studentId,
    studentCode: response.user.studentCode ?? claims.studentCode,
    teacherId: response.user.teacherId ?? claims.teacherId,
    teacherCode: response.user.teacherCode ?? claims.teacherCode,
    teacherType: response.user.teacherType ?? claims.teacherType,
    teacherPosition: response.user.teacherPosition ?? claims.teacherPosition,
    canAccessTopicExam: response.user.canAccessTopicExam ?? claims.canAccessTopicExam,
    canExportProject1: response.user.canExportProject1 ?? claims.canExportProject1,
    isSystemAdmin: response.user.isSystemAdmin,
  });
}

export function getSsoAuthorizeUrl(redirectPath = "/app") {
  const authorizeUrl = new URL(`${env.apiUrl}/auth/sso/authorize`);
  authorizeUrl.searchParams.set("redirectPath", redirectPath);
  return authorizeUrl.toString();
}

export async function getSsoStatus() {
  return getSsoStatusCompatibility();
}

export async function getSsoUrl() {
  return getSsoUrlCompatibility();
}

export async function getSsoAuthorize(params: { redirectPath?: string } = {}) {
  return getSsoAuthorizeCompatibility(params);
}

export async function getSsoCallback(params: { code?: string; state?: string } = {}) {
  return getSsoCallbackCompatibility(params);
}

export async function refreshAuthToken(refreshToken?: string) {
  return refreshTokenCompatibility(refreshToken);
}

export async function logout() {
  return logoutCompatibility();
}
