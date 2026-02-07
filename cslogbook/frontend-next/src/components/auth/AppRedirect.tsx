"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDashboardPathByRole } from "@/lib/auth/mockSession";
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

    if (user.role === "teacher" && !user.teacherType && !user.isSystemAdmin) {
      return;
    }

    const target = getDashboardPathByRole(user?.role, user?.teacherType, user?.isSystemAdmin);
    if (pathname !== target) {
      router.replace(target);
    }
  }, [isLoading, pathname, router, user]);

  return <p>กำลังพาไปยังหน้าที่เหมาะสมกับสิทธิ์ผู้ใช้...</p>;
}
