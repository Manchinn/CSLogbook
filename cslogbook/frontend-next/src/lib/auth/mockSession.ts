export const MOCK_ROLE_KEY = "cslogbook:mock-role";

export type AppRole = "student" | "teacher" | "admin";

export const dashboardByRole: Record<AppRole, string> = {
  student: "/dashboard/student",
  teacher: "/dashboard/teacher",
  admin: "/dashboard/admin",
};

type DashboardTargetInput = {
  role?: string | null;
  teacherType?: string | null;
  isSystemAdmin?: boolean | null;
};

export function getDashboardPathByRole(
  role: string | null | undefined,
  teacherType?: string | null,
  isSystemAdmin?: boolean | null
) {
  if (isSystemAdmin) {
    return dashboardByRole.admin;
  }

  if (role === "admin") {
    return dashboardByRole.admin;
  }

  if (role === "teacher") {
    if (teacherType === "support") {
      return dashboardByRole.admin;
    }
    return dashboardByRole.teacher;
  }

  return dashboardByRole.student;
}

export function resolveDashboardPath(input: DashboardTargetInput) {
  const role = input.role ?? null;

  if (!role) return null;
  if (role === "teacher" && !input.teacherType && !input.isSystemAdmin) return null;

  return getDashboardPathByRole(role, input.teacherType ?? null, input.isSystemAdmin ?? null);
}
