"use client";

import { useQuery } from "@tanstack/react-query";
import { getWorkflowTimeline, type WorkflowTimeline } from "@/lib/services/workflowService";

export function useWorkflowTimeline(
  token: string | null,
  workflowType: "internship" | "project",
  studentId: string | number | null,
  enabled: boolean
) {
  return useQuery<WorkflowTimeline>({
    queryKey: ["workflow-timeline", workflowType, studentId, token],
    queryFn: () => getWorkflowTimeline(token ?? "", workflowType, studentId ?? ""),
    enabled: Boolean(token) && Boolean(studentId) && enabled,
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 3,
    retry: 1,
  });
}
