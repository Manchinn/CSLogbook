"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";

export default function MeetingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;

    if (user.role === "teacher" && user.teacherType === "academic") {
      router.replace("/teacher/meeting-approvals");
      return;
    }

    if (user.role === "student") {
      router.replace("/project/phase1/meeting-logbook");
      return;
    }

    router.replace("/app");
  }, [isLoading, router, user]);

  return (
    <AuthGuard>
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>กำลังพาไปยังหน้าการประชุม...</p>
      </div>
    </AuthGuard>
  );
}
