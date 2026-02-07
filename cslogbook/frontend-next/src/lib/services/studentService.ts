import { apiFetch } from "@/lib/api/client";

export type EligibilityItem = {
  isEligible: boolean;
  canAccessFeature: boolean;
  canRegister: boolean;
  reason: string | null;
};

export type EligibilityStatus = {
  canAccess: boolean;
  canRegister: boolean;
  reason: string | null;
  registrationOpen: boolean;
  registrationReason: string | null;
  requiredCredits?: number | null;
  requiredMajorCredits?: number | null;
  currentCredits: number;
  currentMajorCredits: number;
  requiresInternshipCompletion?: boolean | null;
};

export type EligibilityRequirements = {
  totalCredits?: number | null;
  majorCredits?: number | null;
  requireInternship?: boolean | null;
  allowedSemesters?: number[] | null;
};

export type StudentEligibilityResponse = {
  success: boolean;
  student: {
    studentId: number;
    studentCode: string;
    totalCredits: number;
    majorCredits: number;
  };
  eligibility: {
    internship: EligibilityItem;
    project: EligibilityItem;
  };
  status: {
    internship: EligibilityStatus;
    project: EligibilityStatus;
  };
  requirements: {
    internship: EligibilityRequirements;
    project: EligibilityRequirements;
  };
  academicSettings?: {
    currentAcademicYear?: number | null;
    currentSemester?: number | null;
    internshipRegistrationPeriod?: unknown;
    projectRegistrationPeriod?: unknown;
  };
  curriculum?: {
    id: number | null;
    name: string | null;
    shortName: string | null;
    isActive: boolean;
  };
};

export async function getStudentEligibility(token: string) {
  return apiFetch<StudentEligibilityResponse>("/students/check-eligibility", {
    method: "GET",
    token,
  });
}

export type StudentDeadline = {
  id: number;
  name: string;
  deadlineAt: string;
  deadlineDate?: string;
  deadlineTime?: string;
  deadlineType?: string | null;
  relatedTo?: string | null;
  daysLeft?: number | null;
  hoursLeft?: number | null;
  allowLate?: boolean;
  lockAfterDeadline?: boolean;
  gracePeriodMinutes?: number | null;
};

type StudentDeadlinesResponse = {
  success: boolean;
  data: StudentDeadline[];
};

export async function getStudentUpcomingDeadlines(token: string, days = 7) {
  const response = await apiFetch<StudentDeadlinesResponse>(
    `/students/important-deadlines/upcoming?days=${days}`,
    {
      method: "GET",
      token,
    }
  );

  return response.data;
}
