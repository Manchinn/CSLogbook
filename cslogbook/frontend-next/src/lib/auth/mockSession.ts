export const MOCK_ROLE_KEY = "cslogbook:mock-role";

export type AppRole = "student" | "teacher" | "admin";

export const dashboardByRole: Record<AppRole, string> = {
  student: "/dashboard/student",
  teacher: "/dashboard/teacher",
  admin: "/dashboard/admin",
};

export function getDashboardPathByRole(role: string | null | undefined) {
  if (role === "teacher" || role === "admin" || role === "student") {
    return dashboardByRole[role];
  }

  return dashboardByRole.student;
}
