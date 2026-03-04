"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAcceptanceLetterStatus,
  getCompanyInfo,
  uploadAcceptanceLetter,
} from "@/lib/services/internshipService";

export function useAcceptanceLetterStatus(token: string | null, documentId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["internship-acceptance-status", token, documentId ?? "none"],
    queryFn: () => getAcceptanceLetterStatus(token ?? "", documentId ?? 0),
    enabled: Boolean(token) && Boolean(documentId) && enabled,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useCompanyInfo(token: string | null, documentId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["internship-company-info", token, documentId ?? "none"],
    queryFn: () => getCompanyInfo(token ?? "", documentId ?? 0),
    enabled: Boolean(token) && Boolean(documentId) && enabled,
    retry: 1,
  });
}

export function useUploadAcceptanceLetter(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, file }: { documentId: number; file: File }) =>
      uploadAcceptanceLetter(token ?? "", documentId, file),
    onSuccess: (_data, { documentId }) => {
      // รีเซ็ต acceptance status cache หลังอัปโหลดสำเร็จ
      queryClient.invalidateQueries({
        queryKey: ["internship-acceptance-status", token, documentId],
      });
      // รีเซ็ต CS05 cache ด้วย (status อาจเปลี่ยนหลัง upload)
      queryClient.invalidateQueries({ queryKey: ["current-cs05", token] });
    },
  });
}
