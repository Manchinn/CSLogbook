"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentInternshipStatus } from "@/lib/services/studentService";

export function useStudentInternshipStatus(token: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["student-internship-status", token],
    queryFn: () => getStudentInternshipStatus(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}
