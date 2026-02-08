"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentProjectDetail } from "@/lib/services/studentService";

export function useStudentProjectDetail(token: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["student-project-detail", token],
    queryFn: () => getStudentProjectDetail(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}
