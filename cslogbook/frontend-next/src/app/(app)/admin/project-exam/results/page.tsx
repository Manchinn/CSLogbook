"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { AdminProjectExamResultsPage } from "@/components/admin/project-documents/AdminProjectExamResultsPage";
import { ADMIN_EXAM_TYPE_PROJECT1 } from "@/lib/services/adminProjectExamResultService";

export default function AdminProjectExamResultsRoute() {
  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <AdminProjectExamResultsPage examType={ADMIN_EXAM_TYPE_PROJECT1} />
    </RoleGuard>
  );
}
