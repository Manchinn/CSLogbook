"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardPathByRole } from "@/lib/auth/mockSession";
import { useAuth } from "@/contexts/AuthContext";

export function AppRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    const target = getDashboardPathByRole(user?.role);
    router.replace(target);
  }, [isLoading, router, user]);

  return <p>กำลังพาไปยังหน้าที่เหมาะสมกับสิทธิ์ผู้ใช้...</p>;
}
