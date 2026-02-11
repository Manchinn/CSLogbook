"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { AdminProjectExamResultsPage } from "@/components/admin/project-documents/AdminProjectExamResultsPage";
import { ADMIN_EXAM_TYPE_THESIS } from "@/lib/services/adminProjectExamResultService";

export default function AdminThesisExamResultsRoute() {
  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <AdminProjectExamResultsPage examType={ADMIN_EXAM_TYPE_THESIS} />
    </RoleGuard>
  );
}
