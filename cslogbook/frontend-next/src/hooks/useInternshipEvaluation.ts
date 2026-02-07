"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEvaluationStatus,
  sendEvaluationRequest,
  type EvaluationStatus,
} from "@/lib/services/internshipService";

const evaluationStatusKey = (token: string | null) => ["internship-evaluation-status", token ?? "anonymous"] as const;

export function useInternshipEvaluationStatus(token: string | null, enabled: boolean) {
  return useQuery<EvaluationStatus | null, Error>({
    queryKey: evaluationStatusKey(token),
    queryFn: () => getEvaluationStatus(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useSendEvaluationRequest(token: string | null, documentId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!documentId) {
        throw new Error("ไม่พบรหัสเอกสารฝึกงาน");
      }
      return sendEvaluationRequest(token ?? "", documentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationStatusKey(token) });
    },
  });
}

export type { EvaluationStatus };
