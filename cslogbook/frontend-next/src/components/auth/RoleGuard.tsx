"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPathByRole, type AppRole } from "@/lib/auth/mockSession";

type RoleGuardProps = {
  roles?: AppRole[];
  teacherTypes?: string[];
  redirectPath?: string;
  children: React.ReactNode;
};

export function RoleGuard({ roles, teacherTypes, redirectPath = "/app", children }: RoleGuardProps) {
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

    if (user.role === "teacher" && teacherTypes && !user.teacherType && !user.isSystemAdmin) {
      return;
    }

    const fallbackTarget =
      getDashboardPathByRole(user.role, user.teacherType, user.isSystemAdmin) || redirectPath;

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
    }
  }, [isAuthenticated, isLoading, pathname, redirectPath, roles, router, teacherTypes, user]);

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  return <>{children}</>;
}