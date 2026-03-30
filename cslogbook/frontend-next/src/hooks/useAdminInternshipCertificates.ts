"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveAdminCertificateRequest,
  downloadAdminCertificateRequest,
  exportAdminCertificateRequests,
  getAdminCertificateRequestDetail,
  getAdminCertificateRequests,
  getAdminInternshipLogbookSummary,
  rejectAdminCertificateRequest,
  type AdminCertificateListFilters,
} from "@/lib/services/adminInternshipCertificatesService";

export function useAdminInternshipCertificates(filters: AdminCertificateListFilters) {
  return useQuery({
    queryKey: ["admin-internship-certificates", filters],
    queryFn: () => getAdminCertificateRequests(filters),
    staleTime: 1000 * 60,
  });
}

export function useAdminInternshipCertificateDetail(requestId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-internship-certificate-detail", requestId],
    queryFn: () => getAdminCertificateRequestDetail(requestId ?? 0),
    enabled: Boolean(enabled && requestId),
    retry: 0,
  });
}

export function useAdminInternshipLogbookSummary(internshipId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-internship-logbook-summary", internshipId],
    queryFn: () => getAdminInternshipLogbookSummary(internshipId ?? 0),
    enabled: Boolean(enabled && internshipId),
    retry: 0,
    staleTime: 1000 * 60,
  });
}

export function useAdminInternshipCertificateMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-internship-certificates"] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ requestId, certificateNumber }: { requestId: number; certificateNumber: string }) =>
      approveAdminCertificateRequest(requestId, certificateNumber),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, remarks }: { requestId: number; remarks: string }) =>
      rejectAdminCertificateRequest(requestId, remarks),
    onSuccess: invalidate,
  });

  const downloadMutation = useMutation({
    mutationFn: ({ requestId }: { requestId: number }) => downloadAdminCertificateRequest(requestId),
  });

  const exportMutation = useMutation({
    mutationFn: (filters: Omit<AdminCertificateListFilters, "page" | "limit">) =>
      exportAdminCertificateRequests(filters),
  });

  return {
    approveRequest: approveMutation,
    rejectRequest: rejectMutation,
    downloadRequest: downloadMutation,
    exportMutation,
  };
}
