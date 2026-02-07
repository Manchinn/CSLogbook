"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/lib/auth/mockSession";

type RoleGuardProps = {
  roles?: AppRole[];
  teacherTypes?: string[];
  redirectPath?: string;
  children: React.ReactNode;
};

export function RoleGuard({ roles, teacherTypes, redirectPath = "/app", children }: RoleGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!user) return;

    if (roles && !roles.includes(user.role)) {
      router.replace(redirectPath);
      return;
    }

    if (teacherTypes && user.role === "teacher" && !teacherTypes.includes(user.teacherType ?? "")) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, isLoading, redirectPath, roles, router, teacherTypes, user]);

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  return <>{children}</>;
}