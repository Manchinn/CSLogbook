"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { SystemTestStaffQueuePage } from "@/components/admin/project-documents/SystemTestStaffQueuePage";

export default function AdminSystemTestStaffQueuePage() {
  return (
    <RoleGuard roles={["admin", "teacher"]}>
      <SystemTestStaffQueuePage />
    </RoleGuard>
  );
}
