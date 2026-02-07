import { apiFetchData } from "@/lib/api/client";

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
  const data = await apiFetchData<WorkflowTimeline>(
    `/workflow/timeline/${studentId}/${workflowType}`,
    {
      method: "GET",
      token,
    }
  );

  if (!data) {
    throw new Error("ไม่พบข้อมูล timeline");
  }

  return data;
}
