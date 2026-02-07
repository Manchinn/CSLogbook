export const MOCK_ROLE_KEY = "cslogbook:mock-role";

export type AppRole = "student" | "teacher" | "admin";

export const dashboardByRole: Record<AppRole, string> = {
  student: "/dashboard/student",
  teacher: "/dashboard/teacher",
  admin: "/dashboard/admin",
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
