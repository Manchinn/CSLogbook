import { apiFetchData } from "@/lib/api/client";
import {
  getTimelineAllCompatibility,
  getTimelineStudentCompatibility,
  initTimelineStudentCompatibility,
  getWorkflowStudentTimelineCompatibility,
  updateTimelineStepCompatibility,
  updateWorkflowCompatibility,
  type TimelineRecord,
} from "@/lib/services/compatibilityService";

export type WorkflowStep = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  completed: boolean;
  completedDate?: string | null;
  order?: number | null;
};

export type WorkflowTimeline = {
  steps: WorkflowStep[];
  progress: number;
  status: string;
  currentStepDisplay: number;
  totalStepsDisplay: number;
  blocked: boolean;
};

export async function getWorkflowTimeline(
  token: string,
  workflowType: "internship" | "project",
  studentId: string | number
): Promise<WorkflowTimeline> {
  const primary = await apiFetchData<WorkflowTimeline>(`/workflow/timeline/${studentId}/${workflowType}`, {
    method: "GET",
    token,
  }).catch(() => null);

  if (primary) return primary;

  const fallback = await getWorkflowStudentTimelineCompatibility(studentId, { workflowType });
  if (fallback?.steps && Array.isArray(fallback.steps)) {
    return {
      steps: fallback.steps.map((step, index) => ({
        id: String(step.id ?? index),
        title: step.title ?? `Step ${index + 1}`,
        description: step.description ?? null,
        status: step.status ?? "pending",
        completed: Boolean(step.completed),
        completedDate: step.completedDate ?? null,
        order: step.order ?? index + 1,
      })),
      progress: fallback.progress ?? 0,
      status: fallback.status ?? "unknown",
      currentStepDisplay: fallback.currentStepDisplay ?? 0,
      totalStepsDisplay: fallback.totalStepsDisplay ?? fallback.steps.length,
      blocked: Boolean(fallback.blocked),
    };
  }

  throw new Error("ไม่พบข้อมูล timeline");
}

export async function getAllTimelines(params: Record<string, string | number | boolean> = {}) {
  const data = await getTimelineAllCompatibility(params);
  return Array.isArray(data) ? (data as TimelineRecord[]) : [];
}

export async function getStudentTimeline(studentId: string | number, params: Record<string, string | number | boolean> = {}) {
  return getTimelineStudentCompatibility(studentId, params);
}

export async function initStudentTimeline(studentId: string | number, payload: Record<string, unknown> = {}) {
  return initTimelineStudentCompatibility(studentId, payload);
}

export async function updateWorkflow(payload: Record<string, unknown>) {
  return updateWorkflowCompatibility(payload);
}

export async function updateTimelineStep(stepId: string | number, payload: Record<string, unknown>) {
  return updateTimelineStepCompatibility(stepId, payload);
}
