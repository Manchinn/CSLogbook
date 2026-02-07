"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentProjectStatus } from "@/lib/services/studentService";

export function useStudentProjectStatus(token: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["student-project-status", token],
    queryFn: () => getStudentProjectStatus(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}
