"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentDeadlineCalendar } from "@/lib/services/studentService";

export function useStudentDeadlineCalendar(
  token: string | null,
  academicYear: string | number | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["student-deadlines-calendar", token, academicYear],
    queryFn: () => getStudentDeadlineCalendar(token ?? "", academicYear),
    enabled: Boolean(token) && enabled,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}
