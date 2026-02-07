"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/services/adminService";

export function useAdminStats(token: string | null) {
  return useQuery({
    queryKey: ["admin-stats", token],
    queryFn: () => getAdminStats(token ?? ""),
    enabled: Boolean(token),
    refetchInterval: 1000 * 60 * 3,
  });
}
