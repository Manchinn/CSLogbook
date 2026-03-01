"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { resolveDashboardPath, type AppRole } from "@/lib/auth/mockSession";

type RoleGuardProps = {
  roles?: AppRole[];
  teacherTypes?: string[];
  redirectPath?: string;
  requireHeadOfDepartment?: boolean;
  requireTopicExamAccess?: boolean;
  children: React.ReactNode;
};

export function RoleGuard({
  roles,
  teacherTypes,
  redirectPath = "/app",
  requireHeadOfDepartment = false,
  requireTopicExamAccess = false,
  children
}: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (pathname !== "/login") {
        router.replace("/login");
      }
      return;
    }

    if (!user) return;

    if (user.role === "teacher" && teacherTypes && !user.teacherType && user.isSystemAdmin !== true) {
      // ถ้า teacherType ไม่มี แต่เป็น support (isSystemAdmin) ก็ให้ผ่าน
      // ถ้าไม่ใช่ ให้ redirect ไป dashboard
      const fallbackTarget = resolveDashboardPath({
        role: user.role,
        teacherType: user.teacherType ?? null,
        isSystemAdmin: user.isSystemAdmin ?? null,
      }) || redirectPath;
      if (pathname !== fallbackTarget) {
        router.replace(fallbackTarget);
      }
      return;
    }

    const fallbackTarget =
      resolveDashboardPath({
        role: user.role,
        teacherType: user.teacherType ?? null,
        isSystemAdmin: user.isSystemAdmin ?? null,
      }) || redirectPath;

    if (roles && !roles.includes(user.role)) {
      if (pathname !== fallbackTarget) {
        router.replace(fallbackTarget);
      }
      return;
    }

    const allowSupportOverride = Boolean(user.isSystemAdmin) && teacherTypes?.includes("support");

    if (teacherTypes && user.role === "teacher" && !teacherTypes.includes(user.teacherType ?? "") && !allowSupportOverride) {
      if (pathname !== fallbackTarget) {
        router.replace(fallbackTarget);
      }
      return;
    }

    // Check head of department requirement
    if (requireHeadOfDepartment && user.role === "teacher") {
      const teacherPosition = (user as { teacherPosition?: string }).teacherPosition;
      if (teacherPosition !== "หัวหน้าภาควิชา" && teacherPosition !== "หัวหน้าภาค") {
        if (pathname !== fallbackTarget) {
          router.replace(fallbackTarget);
        }
        return;
      }
    }

    // Check topic exam access requirement
    if (requireTopicExamAccess && user.role === "teacher") {
      const canAccessTopicExam = Boolean(user.canAccessTopicExam);
      if (!canAccessTopicExam) {
        if (pathname !== fallbackTarget) {
          router.replace(fallbackTarget);
        }
        return;
      }
    }
  }, [isAuthenticated, isLoading, pathname, redirectPath, roles, router, teacherTypes, user, requireHeadOfDepartment, requireTopicExamAccess]);

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  return <>{children}</>;
}