"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeacherOverview } from "@/lib/services/teacherService";

export function useTeacherOverview(token: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["teacher-overview", token],
    queryFn: () => getTeacherOverview(token ?? ""),
    enabled: Boolean(token) && enabled,
    refetchInterval: 1000 * 60 * 3,
  });
}
