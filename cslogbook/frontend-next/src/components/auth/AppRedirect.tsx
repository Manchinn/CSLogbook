"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardPathByRole, MOCK_ROLE_KEY } from "@/lib/auth/mockSession";

export function AppRedirect() {
  const router = useRouter();

  useEffect(() => {
    const savedRole = window.localStorage.getItem(MOCK_ROLE_KEY);
    const target = getDashboardPathByRole(savedRole);
    router.replace(target);
  }, [router]);

  return <p>กำลังพาไปยังหน้าที่เหมาะสมกับสิทธิ์ผู้ใช้...</p>;
}
