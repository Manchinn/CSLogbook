"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { featureFlags } from "@/lib/config/featureFlags";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [canRender, setCanRender] = useState(false);

  const legacyLoginUrl = process.env.NEXT_PUBLIC_LEGACY_FRONTEND_URL;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      if (featureFlags.useLegacyFrontend && legacyLoginUrl) {
        router.replace(legacyLoginUrl);
        return;
      }

      router.replace("/login");
      return;
    }

    setCanRender(true);
  }, [isAuthenticated, isLoading, legacyLoginUrl, router]);

  if (!canRender) {
    return null;
  }

  return <>{children}</>;
}