"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function MeetingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new meeting approvals page
    router.replace("/teacher/meeting-approvals");
  }, [router]);

  return (
    <AuthGuard>
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>กำลังเปลี่ยนเส้นทาง...</p>
      </div>
    </AuthGuard>
  );
}
