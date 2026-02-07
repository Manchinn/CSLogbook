"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getInternshipStudentInfo,
  type InternshipStudentInfoResponse,
} from "@/lib/services/internshipService";

export function useInternshipStudentInfo(token: string | null, enabled: boolean) {
  return useQuery<InternshipStudentInfoResponse>({
    queryKey: ["internship-student-info", token],
    queryFn: () => getInternshipStudentInfo(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 3,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}
