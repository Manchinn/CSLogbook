"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentEligibility } from "@/lib/services/studentService";

export function useStudentEligibility(token: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["student-eligibility", token],
    queryFn: () => getStudentEligibility(token ?? ""),
    enabled: Boolean(token) && enabled,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}
