"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPathByRole } from "@/lib/auth/mockSession";

type SsoCallbackClientProps = {
  token?: string;
  redirectPath?: string;
  error?: string;
};

export function SsoCallbackClient({ token, redirectPath, error }: SsoCallbackClientProps) {
  const router = useRouter();
  const { completeSsoLogin } = useAuth();

  useEffect(() => {
    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!token) {
      router.replace("/login?error=missing_token");
      return;
    }

    // Strip token from URL bar before any further navigation (history/referrer leak)
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/auth/sso/callback");
    }

    const safePath =
      redirectPath &&
      redirectPath.startsWith("/") &&
      !redirectPath.startsWith("//") &&
      !redirectPath.startsWith("/\\")
        ? redirectPath
        : null;

    completeSsoLogin(token)
      .then((profile) => {
        const fallbackTarget = getDashboardPathByRole(
          profile.role,
          profile.teacherType,
          profile.isSystemAdmin
        );
        const target = safePath && safePath !== "/app" ? safePath : fallbackTarget;
        router.replace(target);
      })
      .catch((authError) => {
        const message = authError instanceof Error ? authError.message : "sso_callback_failed";
        router.replace(`/login?error=${encodeURIComponent(message)}`);
      });
  }, [completeSsoLogin, error, redirectPath, router, token]);

  return <p>กำลังตรวจสอบข้อมูล SSO และพาเข้าสู่ระบบ...</p>;
}
