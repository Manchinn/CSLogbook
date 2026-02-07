import { apiFetch } from "@/lib/api/client";

export type EvaluationCategoryKey = "discipline" | "behavior" | "performance" | "method" | "relation";

export type SupervisorEvaluationDetails = {
  tokenId?: number;
  token?: string;
  studentInfo: {
    studentId?: string | null;
    studentCode?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    email?: string | null;
  };
  internshipInfo: {
    companyName?: string | null;
    companyAddress?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    internshipPosition?: string | null;
    supervisorName?: string | null;
    supervisorPosition?: string | null;
    supervisorEmail?: string | null;
    supervisorPhone?: string | null;
  };
  evaluationDetails: {
    sentDate?: string | null;
    expiresAt?: string | null;
    status?: string | null;
    documentId?: number | null;
    internshipId?: number | null;
  };
};

export type SupervisorEvaluationDetailsResponse = {
  success: boolean;
  data?: SupervisorEvaluationDetails;
  message?: string;
};

export type SupervisorEvaluationSubmission = {
  supervisorName: string;
  supervisorPosition: string;
  supervisorEmail?: string;
  supervisorPhone?: string;
  supervisorDecision: boolean;
  categories: Record<EvaluationCategoryKey, [number, number, number, number]>;
  strengths: string;
  improvements: string;
  additionalComments?: string | null;
};

export async function getSupervisorEvaluationDetails(token: string) {
  return apiFetch<SupervisorEvaluationDetailsResponse>(
    `/internship/supervisor/evaluation/${token}/details`,
    {
      method: "GET",
    }
  );
}

export async function submitSupervisorEvaluation(
  token: string,
  payload: SupervisorEvaluationSubmission
) {
  return apiFetch<{ success: boolean; message?: string }>(
    `/internship/supervisor/evaluation/${token}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
