"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { resolveDashboardPath } from "@/lib/auth/mockSession";
import { useAuth } from "@/contexts/AuthContext";

export function AppRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      if (pathname !== "/login") {
        router.replace("/login");
      }
      return;
    }

    const target = resolveDashboardPath({
      role: user.role,
      teacherType: user.teacherType ?? null,
      isSystemAdmin: user.isSystemAdmin ?? null,
    });

    if (!target) {
      return;
    }
    if (pathname !== target) {
      router.replace(target);
    }
  }, [isLoading, pathname, router, user]);

  return <p>กำลังพาไปยังหน้าที่เหมาะสมกับสิทธิ์ผู้ใช้...</p>;
}
