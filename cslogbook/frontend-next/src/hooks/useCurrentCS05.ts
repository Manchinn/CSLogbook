"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentCS05, type CS05Document } from "@/lib/services/internshipService";

export function useCurrentCS05(token: string | null, enabled: boolean) {
  return useQuery<CS05Document | null>({
    queryKey: ["current-cs05", token],
    queryFn: () => getCurrentCS05(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}
