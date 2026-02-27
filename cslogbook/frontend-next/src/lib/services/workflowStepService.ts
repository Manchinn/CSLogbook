import { apiFetch, apiFetchData } from "@/lib/api/client";
import { getWorkflowStepCompatibility } from "@/lib/services/compatibilityService";

export type WorkflowStep = {
  stepId: number;
  workflowType: "internship" | "project";
  stepKey: string;
  stepOrder: number;
  title: string;
  descriptionTemplate?: string | null;
  isRequired?: boolean;
  dependencies?: unknown;
};

export type WorkflowStepsResponse = {
  steps: WorkflowStep[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
};

export async function listWorkflowSteps(params: Record<string, unknown> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetchData<WorkflowStepsResponse>(`/admin/workflow-steps${suffix}`);
}

export async function getWorkflowStep(stepId: number) {
  return apiFetchData<WorkflowStep>(`/admin/workflow-steps/${stepId}`);
}

export async function getWorkflowRuntimeStep(stepId: number | string) {
  return getWorkflowStepCompatibility(stepId);
}

export async function getWorkflowStepStats(stepId: number) {
  return apiFetchData<Record<string, unknown>>(`/admin/workflow-steps/${stepId}/stats`);
}

export async function createWorkflowStep(payload: Record<string, unknown>) {
  return apiFetch("/admin/workflow-steps", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateWorkflowStep(stepId: number, payload: Record<string, unknown>) {
  return apiFetch(`/admin/workflow-steps/${stepId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export async function deleteWorkflowStep(stepId: number) {
  return apiFetch(`/admin/workflow-steps/${stepId}`, { method: "DELETE" });
}

export async function reorderWorkflowSteps(payload: { workflowType: string; stepOrders: Array<{ stepId: number; newOrder: number }> }) {
  return apiFetch("/admin/workflow-steps/reorder", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}
