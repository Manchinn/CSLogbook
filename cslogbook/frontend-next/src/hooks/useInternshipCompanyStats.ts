"use client";

import { useQuery } from "@tanstack/react-query";
import { getInternshipCompanyDetail, getInternshipCompanyStats } from "@/lib/services/internshipCompanyService";

type StatsParams = {
  academicYear?: number | null;
  semester?: number | null;
  limit?: number | null;
  page?: number | null;
};

export function useInternshipCompanyStats(token: string | null, params: StatsParams, enabled: boolean) {
  return useQuery({
    queryKey: [
      "internship-company-stats",
      token,
      params.academicYear ?? "all",
      params.semester ?? "all",
      params.limit ?? "default",
      params.page ?? 1,
    ],
    queryFn: () => getInternshipCompanyStats(token ?? "", params),
    enabled: Boolean(token) && enabled,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useInternshipCompanyDetail(token: string | null, companyName: string, academicYear: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["internship-company-detail", token, companyName, academicYear ?? "all"],
    queryFn: () => getInternshipCompanyDetail(token ?? "", companyName, academicYear),
    enabled: Boolean(token) && Boolean(companyName) && enabled,
    retry: 1,
  });
}
