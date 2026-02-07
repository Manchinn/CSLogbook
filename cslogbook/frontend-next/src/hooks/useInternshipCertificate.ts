"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  downloadCertificate,
  getCertificateStatus,
  markCertificateDownloaded,
  previewCertificate,
  submitCertificateRequest,
  type CertificateRequestPayload,
  type InternshipCertificateStatus,
} from "@/lib/services/internshipCertificateService";

const certificateStatusKey = (token: string | null) => ["internship-certificate-status", token ?? "anonymous"] as const;

export function useCertificateStatus(token: string | null, enabled: boolean) {
  return useQuery<InternshipCertificateStatus | null, Error>({
    queryKey: certificateStatusKey(token),
    queryFn: () => getCertificateStatus(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useSubmitCertificateRequest(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CertificateRequestPayload) => submitCertificateRequest(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateStatusKey(token) });
    },
  });
}

export function usePreviewCertificate(token: string | null) {
  return useMutation({
    mutationFn: () => previewCertificate(token),
  });
}

export function useDownloadCertificate(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await downloadCertificate(token);
      try {
        await markCertificateDownloaded(token);
      } catch (error) {
        console.warn("markCertificateDownloaded failed", error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateStatusKey(token) });
    },
  });
}

export type { CertificateRequestPayload };
