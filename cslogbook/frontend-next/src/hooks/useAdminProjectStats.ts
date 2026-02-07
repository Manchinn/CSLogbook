"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminProjectStats, type AdminProjectStats } from "@/lib/services/adminService";

export function useAdminProjectStats(token: string | null) {
  return useQuery<AdminProjectStats>({
    queryKey: ["admin-project-stats", token],
    queryFn: () => getAdminProjectStats(token ?? ""),
    enabled: Boolean(token),
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 3,
    retry: 1,
  });
}
