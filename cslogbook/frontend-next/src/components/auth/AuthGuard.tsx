"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    setCanRender(true);
  }, [isAuthenticated, router]);

  if (!canRender) {
    return null;
  }

  return <>{children}</>;
}