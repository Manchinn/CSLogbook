"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentUpcomingDeadlines } from "@/lib/services/studentService";

export function useStudentDeadlines(token: string | null, days: number, enabled: boolean) {
  return useQuery({
    queryKey: ["student-deadlines", token, days],
    queryFn: () => getStudentUpcomingDeadlines(token ?? "", days),
    enabled: Boolean(token) && enabled,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}
